import { Component, OnInit, Output, EventEmitter, ViewChild, ElementRef, AfterViewChecked, signal, computed, effect, input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SubtaskListComponent } from './subtask-list/subtask-list.component';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Task, Subtask } from '../../core/models/task.interface';
import { Contact } from '../../core/models/contact.interface';
import { TaskService } from '../../core/services/task.service';
import { ContactService } from '../../core/services/contact.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { ClickOutsideDirective } from '../../shared/directives/click-outside.directive';

@Component({
  selector: 'app-add-task',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, SubtaskListComponent, ClickOutsideDirective],
  templateUrl: './add-task.component.html',
  styleUrl: './add-task.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AddTaskComponent implements OnInit, AfterViewChecked {
  // ✅ Signal Inputs (Angular 17.1+)
  isOverlay = input<boolean>(false);
  taskToEdit = input<Task | null>(null);
  initialStatus = input<'triage' | 'todo' | 'in-progress' | 'await-feedback' | 'done'>('todo');
  
  @Output() close = new EventEmitter<void>();
  @Output() taskSaved = new EventEmitter<Task>();
  @ViewChild('editInput') editInput?: ElementRef<HTMLInputElement>;

  taskForm!: FormGroup;
  
  subtaskInput = signal('');
  subtaskEditInput = signal('');
  subtasks = signal<Subtask[]>([]);
  editingSubtaskId = signal<string | null>(null);
  subtaskInputFocused = signal(false);

  selectedPriority = signal<'low' | 'medium' | 'high'>('medium');
  selectedContacts = signal<Contact[]>([]);
  selectedCategory = signal('');

  showContactDropdown = signal(false);
  showCategoryDropdown = signal(false);
  contactSearchQuery = signal('');

  isEditMode = signal(false);
  minDate = signal(this.formatDateForInput(new Date()));
  
  categories: string[] = ['Technical Task', 'User Story'];
  
  displayedContacts = computed(() => {
    const query = this.contactSearchQuery().toLowerCase();
    const contacts = this.contactService.contacts();
    return contacts.filter(contact =>
      `${contact.firstName} ${contact.lastName}`.toLowerCase().includes(query)
    );
  });
  
  displayedContactsList = computed(() => this.selectedContacts().slice(0, 3));
  remainingContactsCount = computed(() => Math.max(0, this.selectedContacts().length - 3));
  hasMoreContacts = computed(() => this.selectedContacts().length > 3);
  
  isFormValid = computed(() => {
    return this.taskForm.valid && 
           this.selectedCategory() !== '';
  });
  
  subtaskCount = computed(() => this.subtasks().length);
  canAddMoreSubtasks = computed(() => this.subtaskCount() < 5);

  constructor(
    private fb: FormBuilder,
    private taskService: TaskService,
    private contactService: ContactService,
    private authService: AuthService,
    private router: Router,
    private toastService: ToastService
  ) {}
  
  // ✅ Getter für Kontakte aus Service
  get availableContacts() {
    return this.contactService.contacts;
  }

  ngOnInit(): void {
    this.initForm();
    
    this.contactService.loadContactsAsync();

    const task = this.taskToEdit();
    if (task) {
      this.isEditMode.set(true);
      this.loadContactsAndPopulateForm(task);
    }
  }

  ngAfterViewChecked(): void {
    if (this.editingSubtaskId() && this.editInput) {
      this.editInput.nativeElement.focus();
    }
  }

  private async loadContactsAndPopulateForm(task: Task): Promise<void> {
    try {
      await this.contactService.loadContactsAsync();
      console.log('📋 Contacts loaded:', this.availableContacts().length);
      this.populateFormWithTask(task);
    } catch (error) {
      console.error('❌ Error loading contacts:', error);
    }
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
    this.selectedContacts.set(
      this.availableContacts().filter(c => task.assignedTo.includes(c.id))
    );
  }

  private formatDateForInput(date: Date): string {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private initForm(): void {
    this.taskForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(3)]],
      description: [''],
      dueDate: ['', Validators.required],
      category: ['', Validators.required]
    });
  }

  selectPriority(priority: 'low' | 'medium' | 'high'): void {
    this.selectedPriority.set(priority);
  }

  toggleContactDropdown(): void {
    this.showContactDropdown.update((show: boolean) => !show);
    if (this.showContactDropdown()) {
      this.showCategoryDropdown.set(false);
    }
  }

  selectContact(contact: Contact): void {
    const currentContacts = this.selectedContacts();
    const index = currentContacts.findIndex(c => c.id === contact.id);
    if (index === -1) {
      this.selectedContacts.set([...currentContacts, contact]);
    } else {
      this.selectedContacts.set(currentContacts.filter((_, i) => i !== index));
    }
  }

  isContactSelected(contact: Contact): boolean {
    return this.selectedContacts().some(c => c.id === contact.id);
  }

  removeContact(contactId: string): void {
    this.selectedContacts.update(contacts => 
      contacts.filter(c => c.id !== contactId)
    );
  }

  closeContactDropdown(): void {
    this.showContactDropdown.set(false);
  }

  closeCategoryDropdown(): void {
    this.showCategoryDropdown.set(false);
  }

  toggleCategoryDropdown(): void {
    this.showCategoryDropdown.update((show: boolean) => !show);
    if (this.showCategoryDropdown()) {
      this.showContactDropdown.set(false);
    }
  }

  selectCategory(category: string): void {
    this.selectedCategory.set(category);
    this.taskForm.patchValue({ category });
    this.showCategoryDropdown.set(false);
  }

  addSubtask(): void {
    const input = this.subtaskInput().trim();
    if (input) {
      if (!this.canAddMoreSubtasks()) {
        this.toastService.showToast('Maximum of 5 subtasks allowed');
        return;
      }
      const newSubtask: Subtask = {
        id: this.generateId(),
        title: input,
        completed: false
      };
      this.subtasks.update(tasks => [...tasks, newSubtask]);
      this.subtaskInput.set('');
      this.subtaskInputFocused.set(false);
    }
  }

  clearSubtaskInput(): void {
    this.subtaskInput.set('');
    this.editingSubtaskId.set(null);
  }

  onSubtaskInputFocus(): void {
    this.subtaskInputFocused.set(true);
  }

  onSubtaskInputBlur(): void {
    setTimeout(() => {
      if (!this.subtaskInput().trim() && !this.editingSubtaskId()) {
        this.subtaskInputFocused.set(false);
      }
    }, 200);
  }

  editSubtask(subtask: Subtask): void {
    this.editingSubtaskId.set(subtask.id);
    this.subtaskEditInput.set(subtask.title);
  }

  updateSubtask(): void {
    const editId = this.editingSubtaskId();
    const editText = this.subtaskEditInput().trim();
    
    if (editId && editText) {
      this.subtasks.update(tasks =>
        tasks.map(s => s.id === editId ? { ...s, title: editText } : s)
      );
      this.editingSubtaskId.set(null);
      this.subtaskEditInput.set('');
    }
  }

  cancelEditSubtask(): void {
    this.editingSubtaskId.set(null);
    this.subtaskEditInput.set('');
  }

  deleteSubtask(subtaskId: string): void {
    this.subtasks.update(tasks => tasks.filter(s => s.id !== subtaskId));
  }

  onSubmit(): void {
    if (this.taskForm.valid) {
      if (this.isEditMode() && this.taskToEdit()) {
        this.updateTask();
      } else {
        this.createTask();
      }
    } else {
      this.markFormAsTouched();
    }
  }

  private createTask(): void {
    const currentUser = this.authService.currentUser;

    const newTask: Task = {
      id: this.generateId(),
      title: this.taskForm.value.title,
      description: this.taskForm.value.description || '',
      category: this.selectedCategory(),
      assignedTo: this.selectedContacts().map(c => c.id),
      dueDate: new Date(this.taskForm.value.dueDate),
      priority: this.selectedPriority(),
      status: this.initialStatus(),
      subtasks: this.subtasks(),
      source: 'member',
      creatorType: 'member',
      creatorName: currentUser?.displayName || undefined,
      creatorEmail: currentUser?.email || undefined,
      createdAt: new Date(),
      aiGenerated: false
    };

    this.taskService.addTask(newTask).subscribe({
      next: () => {
        console.log('✅ Task created successfully');
        this.toastService.showTaskCreated(newTask.title);
        if (this.isOverlay()) {
          this.taskSaved.emit(newTask);
          this.onClose();
        } else {
          this.router.navigate(['/board']);
        }
      },
      error: (error: any) => {
        console.error('❌ Error creating task:', error);
        this.toastService.showTaskCreateError();
      }
    });
  }

  private updateTask(): void {
    const task = this.taskToEdit();
    if (!task) return;

    const updatedTask: Partial<Task> = {
      title: this.taskForm.value.title,
      description: this.taskForm.value.description || '',
      category: this.selectedCategory(),
      assignedTo: this.selectedContacts().map(c => c.id),
      dueDate: new Date(this.taskForm.value.dueDate),
      priority: this.selectedPriority(),
      subtasks: this.subtasks(),
      updatedAt: new Date()
    };

    this.taskService.updateTask(task.id, updatedTask).subscribe({
      next: () => {
        console.log('✅ Task updated successfully');
        this.toastService.showTaskUpdated(updatedTask.title!);
        const fullTask: Task = { ...this.taskToEdit()!, ...updatedTask };
        if (this.isOverlay()) {
          this.taskSaved.emit(fullTask);
          this.onClose();
        } else {
          this.router.navigate(['/board']);
        }
      },
      error: (error: any) => {
        console.error('❌ Error updating task:', error);
        this.toastService.showTaskUpdateError();
      }
    });
  }

  onClose(): void {
    this.close.emit();
  }

  onOverlayClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('task-overlay')) {
      this.onClose();
    }
  }

  clearForm(): void {
    this.taskForm.reset();
    this.subtasks.set([]);
    this.selectedContacts.set([]);
    this.selectedCategory.set('');
    this.selectedPriority.set('medium');
    this.subtaskInput.set('');
  }

  private markFormAsTouched(): void {
    Object.keys(this.taskForm.controls).forEach(key => {
      this.taskForm.get(key)?.markAsTouched();
    });
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  get f() {
    return this.taskForm.controls;
  }
}

