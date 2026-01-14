import { Component, OnInit, input, output, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, FormControl, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { FormFieldComponent } from '../../components/form-field/form-field.component';
import { ButtonGroupComponent, ButtonConfig } from '../../components/button-group/button-group.component';
import { DropdownComponent, DropdownItem } from '../../components/dropdown/dropdown.component';
import { BadgeListComponent } from '../../components/badge-list/badge-list.component';
import { SubtaskManagementComponent, Subtask } from '../../components/subtask-management/subtask-management.component';
import { TaskService } from '../../../../core/services/task.service';
import { ContactService } from '../../../../core/services/contact.service';
import { AuthService } from '../../../../core/services/auth.service';
import { ToastService } from '../../../../core/services/toast.service';
import { Task } from '../../../../core/models/task.interface';
import { Contact } from '../../../../core/models/contact.interface';

@Component({
  selector: 'app-add-task-view',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormFieldComponent,
    ButtonGroupComponent,
    DropdownComponent,
    BadgeListComponent,
    SubtaskManagementComponent
  ],
  templateUrl: './add-task-view.component.html',
  styleUrl: './add-task-view.component.scss'
})
export class AddTaskViewComponent implements OnInit {
  isOverlay = input<boolean>(false);
  taskToEdit = input<Task | null>(null);
  initialStatus = input<'triage' | 'todo' | 'in-progress' | 'await-feedback' | 'done'>('todo');
  
  close = output<void>();
  taskSaved = output<Task>();
  
  private fb = inject(FormBuilder);
  private taskService = inject(TaskService);
  private contactService = inject(ContactService);
  private authService = inject(AuthService);
  private toastService = inject(ToastService);
  private router = inject(Router);
  
  taskForm!: FormGroup;
  selectedPriority = signal<string | number>('medium');
  selectedContactIds = signal<string[]>([]);
  selectedCategory = signal<string>('');
  subtasks = signal<Subtask[]>([]);
  editingSubtaskId = signal<string | null>(null);
  subtaskEditInput = signal<string>('');
  isEditMode = signal<boolean>(false);
  minDate = signal<string>(this.formatDateForInput(new Date()));
  formValid = signal<boolean>(false);
  
  readonly categories = ['Technical Task', 'User Story'];
  
  readonly priorityButtons: ButtonConfig[] = [
    { value: 'urgent', label: 'Urgent', cssClass: 'priority-btn priority-btn-urgent', iconRight: 'assets/images/urgent.svg', iconRightActive: 'assets/images/urgentwhite.svg' },
    { value: 'medium', label: 'Medium', cssClass: 'priority-btn priority-btn-medium', iconRight: 'assets/images/medium.svg', iconRightActive: 'assets/images/mediumwhite.svg' },
    { value: 'low', label: 'Low', cssClass: 'priority-btn priority-btn-low', iconRight: 'assets/images/low.svg', iconRightActive: 'assets/images/lowwhite.svg' }
  ];
 
  availableContacts = computed((): DropdownItem[] => {
    return this.contactService.contacts().map((c: Contact) => ({
      id: c.id,
      label: `${c.firstName} ${c.lastName}`,
      value: c.id,
      color: c.color
    }));
  });
  
  categoryItems = computed((): DropdownItem[] => {
    return this.categories.map(cat => ({
      id: cat,
      label: cat
    }));
  });
  
  selectedContactBadges = computed(() => {
    const selected = this.selectedContactIds();
    return this.availableContacts()
      .filter(c => selected.includes(c.id))
      .map(c => ({
        id: c.id,
        label: c.label,
        color: (c as any).color || '#29ABE2',
        removable: true
      }));
  });
  
  isFormValid = computed(() => this.formValid());
  
  private updateFormValidity(): void {
    if (!this.taskForm) {
      this.formValid.set(false);
      return;
    }
    
    const titleControl = this.taskForm.get('title');
    const dueDateControl = this.taskForm.get('dueDate');
    
    const titleValid = titleControl?.valid && titleControl?.value?.trim()?.length >= 3;
    const dueDateValid = dueDateControl?.valid && dueDateControl?.value;
    const categoryValid = this.selectedCategory() !== '';
    
    const result = titleValid && dueDateValid && categoryValid;
    this.formValid.set(result);
  }
  
  getControl(name: string): FormControl {
    return this.taskForm.get(name) as FormControl;
  }

  ngOnInit(): void {
    this.initForm();
    
    this.contactService.loadContactsAsync();
    
    const task = this.taskToEdit();
    if (task) {
      this.isEditMode.set(true);
      this.populateFormWithTask(task);
    }
  }
  
  private initForm(): void {
    this.taskForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(3)]],
      description: [''],
      dueDate: ['', Validators.required],
      category: ['', Validators.required]
    });
    
    this.taskForm.valueChanges.subscribe(() => {
      this.updateFormValidity();
    });
    
    this.updateFormValidity();
  }
  
  private populateFormWithTask(task: Task): void {
    this.taskForm.patchValue({
      title: task.title,
      description: task.description,
      dueDate: this.formatDateForInput(task.dueDate),
      category: task.category
    });
    
    this.selectedPriority.set(task.priority);
    this.selectedCategory.set(task.category);
    this.subtasks.set(task.subtasks ? [...task.subtasks] : []);
    
    const contactIds = this.availableContacts()
      .filter(c => task.assignedTo.includes(c.id))
      .map(c => c.id);
    this.selectedContactIds.set(contactIds);
  }
  
  private formatDateForInput(date: Date): string {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  onPriorityChange(priority: string | number): void {
    this.selectedPriority.set(priority);
  }

  onContactSelection(contactIds: string[]): void {
    this.selectedContactIds.set(contactIds);
  }

  onCategorySelection(categoryIds: string[]): void {
    if (categoryIds.length > 0) {
      const category = categoryIds[0];
      this.selectedCategory.set(category);
      this.taskForm.patchValue({ category });
    } else {
      this.selectedCategory.set('');
      this.taskForm.patchValue({ category: '' });
    }
    
    this.updateFormValidity();
  }
  
  onRemoveBadge(idToRemove: string): void {
    const updated = this.selectedContactIds().filter(id => id !== idToRemove);
    this.selectedContactIds.set(updated);
  }
  
  onAddSubtask(title: string): void {
    if (this.subtasks().length >= 5) {
      this.toastService.showToast('Maximal 5 Subtasks erlaubt');
      return;
    }
    
    const newSubtask: Subtask = {
      id: this.generateId(),
      title: title.trim(),
      completed: false
    };
    
    this.subtasks.update(tasks => [...tasks, newSubtask]);
  }
  
  onEditSubtask(subtask: Subtask): void {
    this.editingSubtaskId.set(subtask.id);
    this.subtaskEditInput.set(subtask.title);
  }
  
  onUpdateSubtask(): void {
    const id = this.editingSubtaskId();
    const newTitle = this.subtaskEditInput().trim();
    
    if (!id || !newTitle) return;
    
    this.subtasks.update(tasks =>
      tasks.map(t => t.id === id ? { ...t, title: newTitle } : t)
    );
    
    this.editingSubtaskId.set(null);
    this.subtaskEditInput.set('');
  }
  
  onCancelEditSubtask(): void {
    this.editingSubtaskId.set(null);
    this.subtaskEditInput.set('');
  }
  
  onDeleteSubtask(id: string): void {
    this.subtasks.update(tasks => tasks.filter(t => t.id !== id));
  }
  
  onSubtaskEditInputChange(value: string): void {
    this.subtaskEditInput.set(value);
  }
  
  onClearForm(): void {
    this.taskForm.reset();
    this.selectedPriority.set('medium');
    this.selectedContactIds.set([]);
    this.selectedCategory.set('');
    this.subtasks.set([]);
    this.editingSubtaskId.set(null);
    this.subtaskEditInput.set('');
    
    this.updateFormValidity();
  }
  
  onClose(): void {
    this.close.emit();
  }
  
  onOverlayClick(event: MouseEvent): void {
    // Close only if clicking directly on the overlay background
    if (event.target === event.currentTarget) {
      this.onClose();
    }
  }
  
  onSubmit(): void {
    if (!this.isFormValid()) {
      this.markFormAsTouched();
      this.toastService.showToast('Please fill all required fields');
      return;
    }
    
    if (this.isEditMode()) {
      this.updateTask();
    } else {
      this.createTask();
    }
  }
  
  private createTask(): void {
    const formValue = this.taskForm.value;
    const userId = this.authService.userId();
    
    if (!userId) {
      this.toastService.showToast('User not authenticated');
      return;
    }
    
    const newTask: Task = {
      id: this.generateId(),
      title: formValue.title,
      description: formValue.description,
      category: this.selectedCategory(),
      assignedTo: this.selectedContactIds(),
      dueDate: new Date(formValue.dueDate),
      priority: this.selectedPriority() as 'low' | 'medium' | 'high',
      status: this.initialStatus(),
      subtasks: this.subtasks().map(st => ({
        id: st.id,
        title: st.title,
        completed: st.completed ?? false
      })),
      createdAt: new Date()
    };
    
    try {
      this.taskService.addTask(newTask).subscribe({
        next: () => {
          this.toastService.showToast('Task created successfully');
          this.taskSaved.emit(newTask);
          
          if (this.isOverlay()) {
            this.close.emit();
          } else {
            this.router.navigate(['/board']);
          }
        },
        error: (error) => {
          this.toastService.showToast('Failed to create task');
          console.error('Error creating task:', error);
        }
      });
    } catch (error) {
      this.toastService.showToast('Failed to create task');
      console.error('Error creating task:', error);
    }
  }
  
  private updateTask(): void {
    const task = this.taskToEdit();
    if (!task) return;
    
    const formValue = this.taskForm.value;
    
    const updates: Partial<Task> = {
      title: formValue.title,
      description: formValue.description,
      category: this.selectedCategory(),
      assignedTo: this.selectedContactIds(),
      dueDate: new Date(formValue.dueDate),
      priority: this.selectedPriority() as 'low' | 'medium' | 'high',
      subtasks: this.subtasks().map(st => ({
        id: st.id,
        title: st.title,
        completed: st.completed ?? false
      }))
    };
    
    try {
      this.taskService.updateTask(task.id, updates).subscribe({
        next: () => {
          this.toastService.showToast('Task updated successfully');
          const updatedTask: Task = { ...task, ...updates };
          this.taskSaved.emit(updatedTask);
          
          if (this.isOverlay()) {
            this.close.emit();
          } else {
            this.router.navigate(['/board']);
          }
        },
        error: (error) => {
          this.toastService.showToast('Failed to update task');
          console.error('Error updating task:', error);
        }
      });
    } catch (error) {
      this.toastService.showToast('Failed to update task');
      console.error('Error updating task:', error);
    }
  }
 
  private markFormAsTouched(): void {
    Object.keys(this.taskForm.controls).forEach(key => {
      this.taskForm.controls[key].markAsTouched();
    });
  }
  
  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
  }
}
