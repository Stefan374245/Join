import { Component, OnInit, Input, Output, EventEmitter, ViewChild, ElementRef, AfterViewChecked, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Task, Subtask } from '../../models/task.interface';
import { Contact } from '../../models/contact.interface';
import { TaskService } from '../../services/task.service';
import { ContactService } from '../../services/contact.service';

@Component({
  selector: 'app-add-task',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './add-task.component.html',
  styleUrl: './add-task.component.scss'
})
export class AddTaskComponent implements OnInit, AfterViewChecked {
  @Input() isOverlay: boolean = false;
  @Input() taskToEdit: Task | null = null;
  @Input() initialStatus: 'triage' | 'todo' | 'in-progress' | 'await-feedback' | 'done' = 'todo';
  @Output() close = new EventEmitter<void>();
  @Output() taskSaved = new EventEmitter<Task>();
  @ViewChild('editInput') editInput?: ElementRef<HTMLInputElement>;
  
  taskForm!: FormGroup;
  subtaskInput: string = '';
  subtaskEditInput: string = '';
  subtasks: Subtask[] = [];
  editingSubtaskId: string | null = null;
  subtaskInputFocused: boolean = false;
  
  selectedPriority: 'low' | 'medium' | 'high' = 'medium';
  selectedContacts: Contact[] = [];
  selectedCategory: string = '';
  
  availableContacts: Contact[] = [];
  categories: string[] = ['Technical Task', 'User Story'];
  
  showContactDropdown: boolean = false;
  showCategoryDropdown: boolean = false;
  
  isEditMode: boolean = false;

  constructor(
    private fb: FormBuilder,
    private taskService: TaskService,
    private contactService: ContactService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.initForm();
    
    if (this.taskToEdit) {
      this.isEditMode = true;
      this.loadContactsAndPopulateForm(this.taskToEdit);
    } else {
      this.loadContacts();
    }
  }

  ngAfterViewChecked(): void {
    if (this.editingSubtaskId && this.editInput) {
      this.editInput.nativeElement.focus();
    }
  }

  /**
   * Contacts laden und dann Form befüllen (für Edit-Modus)
   */
  private loadContactsAndPopulateForm(task: Task): void {
    this.contactService.getContacts().subscribe({
      next: (contacts: Contact[]) => {
        this.availableContacts = contacts;
        console.log('📋 Contacts loaded:', contacts.length);
        this.populateFormWithTask(task);
      },
      error: (error: any) => {
        console.error('❌ Error loading contacts:', error);
      }
    });
  }

  /**
   * Formular mit Task-Daten befüllen (Edit-Modus)
   */
  private populateFormWithTask(task: Task): void {
    this.taskForm.patchValue({
      title: task.title,
      description: task.description,
      dueDate: this.formatDateForInput(task.dueDate),
      category: task.category
    });

    this.selectedPriority = task.priority;
    this.selectedCategory = task.category;
    this.subtasks = task.subtasks ? [...task.subtasks] : [];
    this.selectedContacts = this.availableContacts.filter(c => 
      task.assignedTo.includes(c.id)
    );
  }

  /**
   * Datum für Input-Feld formatieren (YYYY-MM-DD)
   */
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

  private loadContacts(): void {
    this.contactService.getContacts().subscribe({
      next: (contacts: Contact[]) => {
        this.availableContacts = contacts;
      },
      error: (error: any) => {
        console.error('Error loading contacts:', error);
      }
    });
  }

  selectPriority(priority: 'low' | 'medium' | 'high'): void {
    this.selectedPriority = priority;
  }

  toggleContactDropdown(): void {
    this.showContactDropdown = !this.showContactDropdown;
    if (this.showContactDropdown) {
      this.showCategoryDropdown = false;
    }
  }

  selectContact(contact: Contact): void {
    const index = this.selectedContacts.findIndex(c => c.id === contact.id);
    if (index === -1) {
      this.selectedContacts.push(contact);
    } else {
      this.selectedContacts.splice(index, 1);
    }
  }

  isContactSelected(contact: Contact): boolean {
    return this.selectedContacts.some(c => c.id === contact.id);
  }

  removeContact(contactId: string): void {
    this.selectedContacts = this.selectedContacts.filter(c => c.id !== contactId);
  }

  /**
   * Schließt Dropdowns wenn außerhalb geklickt wird
   */
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    
    const isInsideContactDropdown = target.closest('#assignedTo')?.parentElement?.parentElement || 
                                     target.closest('.dropdown-menu') ||
                                     target.closest('.selected-contacts');
    
    if (!isInsideContactDropdown && this.showContactDropdown) {
      this.showContactDropdown = false;
    }

    const isInsideCategoryDropdown = target.closest('#category')?.parentElement?.parentElement || 
                                      target.closest('.dropdown-menu');
    
    if (!isInsideCategoryDropdown && this.showCategoryDropdown) {
      this.showCategoryDropdown = false;
    }
  }

  toggleCategoryDropdown(): void {
    this.showCategoryDropdown = !this.showCategoryDropdown;
    if (this.showCategoryDropdown) {
      this.showContactDropdown = false;
    }
  }

  selectCategory(category: string): void {
    this.selectedCategory = category;
    this.taskForm.patchValue({ category });
    this.showCategoryDropdown = false;
  }

  addSubtask(): void {
    if (this.subtaskInput.trim()) {
      const newSubtask: Subtask = {
        id: this.generateId(),
        title: this.subtaskInput.trim(),
        completed: false
      };
      this.subtasks.push(newSubtask);
      this.subtaskInput = '';
      this.subtaskInputFocused = false;
    }
  }

  clearSubtaskInput(): void {
    this.subtaskInput = '';
    this.editingSubtaskId = null;
  }

  onSubtaskInputFocus(): void {
    this.subtaskInputFocused = true;
  }

  onSubtaskInputBlur(): void {
    setTimeout(() => {
      if (!this.subtaskInput.trim() && !this.editingSubtaskId) {
        this.subtaskInputFocused = false;
      }
    }, 200);
  }

  editSubtask(subtask: Subtask): void {
    this.editingSubtaskId = subtask.id;
    this.subtaskEditInput = subtask.title;
  }

  updateSubtask(): void {
    if (this.editingSubtaskId && this.subtaskEditInput.trim()) {
      const subtask = this.subtasks.find(s => s.id === this.editingSubtaskId);
      if (subtask) {
        subtask.title = this.subtaskEditInput.trim();
      }
      this.editingSubtaskId = null;
      this.subtaskEditInput = '';
    }
  }

  cancelEditSubtask(): void {
    this.editingSubtaskId = null;
    this.subtaskEditInput = '';
  }

  deleteSubtask(subtaskId: string): void {
    this.subtasks = this.subtasks.filter(s => s.id !== subtaskId);
  }

  // Form Actions
  onSubmit(): void {
    if (this.taskForm.valid) {
      if (this.isEditMode && this.taskToEdit) {
        // UPDATE existierenden Task
        this.updateTask();
      } else {
        // CREATE neuen Task
        this.createTask();
      }
    } else {
      this.markFormAsTouched();
    }
  }

  /**
   * Neuen Task erstellen
   */
  private createTask(): void {
    const newTask: Task = {
      id: this.generateId(),
      title: this.taskForm.value.title,
      description: this.taskForm.value.description || '',
      category: this.selectedCategory,
      assignedTo: this.selectedContacts.map(c => c.id),
      dueDate: new Date(this.taskForm.value.dueDate),
      priority: this.selectedPriority,
      status: this.initialStatus, // Verwende den initialStatus aus Input
      subtasks: this.subtasks
    };

    this.taskService.addTask(newTask).subscribe({
      next: () => {
        console.log('✅ Task created successfully');
        if (this.isOverlay) {
          this.taskSaved.emit(newTask);
          this.onClose();
        } else {
          this.router.navigate(['/board']);
        }
      },
      error: (error: any) => {
        console.error('❌ Error creating task:', error);
      }
    });
  }

  /**
   * Existierenden Task aktualisieren
   */
  private updateTask(): void {
    if (!this.taskToEdit) return;

    const updatedTask: Partial<Task> = {
      title: this.taskForm.value.title,
      description: this.taskForm.value.description || '',
      category: this.selectedCategory,
      assignedTo: this.selectedContacts.map(c => c.id),
      dueDate: new Date(this.taskForm.value.dueDate),
      priority: this.selectedPriority,
      subtasks: this.subtasks
    };

    this.taskService.updateTask(this.taskToEdit.id, updatedTask).subscribe({
      next: () => {
        console.log('✅ Task updated successfully');
        const fullTask: Task = { ...this.taskToEdit!, ...updatedTask };
        if (this.isOverlay) {
          this.taskSaved.emit(fullTask);
          this.onClose();
        } else {
          this.router.navigate(['/board']);
        }
      },
      error: (error: any) => {
        console.error('❌ Error updating task:', error);
      }
    });
  }

  /**
   * Overlay schließen
   */
  onClose(): void {
    this.close.emit();
  }

  /**
   * Overlay-Hintergrund-Click
   */
  onOverlayClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('task-overlay')) {
      this.onClose();
    }
  }

  clearForm(): void {
    this.taskForm.reset();
    this.subtasks = [];
    this.selectedContacts = [];
    this.selectedCategory = '';
    this.selectedPriority = 'medium';
    this.subtaskInput = '';
  }

  private markFormAsTouched(): void {
    Object.keys(this.taskForm.controls).forEach(key => {
      this.taskForm.get(key)?.markAsTouched();
    });
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  // Getter for form validation
  get f() {
    return this.taskForm.controls;
  }
}

