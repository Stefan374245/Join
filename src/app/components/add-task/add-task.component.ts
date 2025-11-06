import { Component, OnInit, Input, Output, EventEmitter, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
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
  @Input() isOverlay: boolean = false; // Overlay-Modus aktivieren
  @Input() taskToEdit: Task | null = null; // Task zum Bearbeiten
  @Output() close = new EventEmitter<void>(); // Overlay schließen
  @Output() taskSaved = new EventEmitter<Task>(); // Task gespeichert
  @ViewChild('editInput') editInput?: ElementRef<HTMLInputElement>;
  
  taskForm!: FormGroup;
  subtaskInput: string = '';
  subtaskEditInput: string = ''; // Separates Input für Inline-Editing
  subtasks: Subtask[] = [];
  editingSubtaskId: string | null = null;
  subtaskInputFocused: boolean = false; // Neues Property für Focus-State
  
  selectedPriority: 'low' | 'medium' | 'high' = 'medium';
  selectedContacts: Contact[] = [];
  selectedCategory: string = '';
  
  availableContacts: Contact[] = [];
  categories: string[] = ['Technical Task', 'User Story'];
  
  showContactDropdown: boolean = false;
  showCategoryDropdown: boolean = false;
  
  isEditMode: boolean = false; // Edit-Modus Flag

  constructor(
    private fb: FormBuilder,
    private taskService: TaskService,
    private contactService: ContactService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.initForm();
    
    // Contacts laden und dann Form befüllen wenn Edit-Modus
    if (this.taskToEdit) {
      this.isEditMode = true;
      this.loadContactsAndPopulateForm(this.taskToEdit);
    } else {
      this.loadContacts();
    }
  }

  ngAfterViewChecked(): void {
    // Auto-Focus auf Edit-Input wenn im Edit-Modus
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
        // JETZT Form befüllen, nachdem Contacts geladen sind
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
    console.log('📝 Populating form with task:', task);
    console.log('👥 Available contacts:', this.availableContacts.length);
    console.log('🎯 Task assignedTo:', task.assignedTo);
    
    // Form-Werte setzen
    this.taskForm.patchValue({
      title: task.title,
      description: task.description,
      dueDate: this.formatDateForInput(task.dueDate),
      category: task.category
    });
    
    // Priority setzen
    this.selectedPriority = task.priority;
    
    // Category setzen
    this.selectedCategory = task.category;
    
    // Subtasks setzen
    this.subtasks = task.subtasks ? [...task.subtasks] : [];
    
    // Selected Contacts setzen (Contacts sind jetzt garantiert geladen)
    this.selectedContacts = this.availableContacts.filter(c => 
      task.assignedTo.includes(c.id)
    );
    
    console.log('✅ Selected contacts:', this.selectedContacts.length, this.selectedContacts.map(c => c.firstName));
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

  // Priority Methods
  selectPriority(priority: 'low' | 'medium' | 'high'): void {
    this.selectedPriority = priority;
  }

  // Contact Methods
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

  // Category Methods
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

  // Subtask Methods
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
    // Verzögerung, damit Click-Events auf Icons noch funktionieren
    setTimeout(() => {
      if (!this.subtaskInput.trim() && !this.editingSubtaskId) {
        this.subtaskInputFocused = false;
      }
    }, 200);
  }

  editSubtask(subtask: Subtask): void {
    this.editingSubtaskId = subtask.id;
    this.subtaskEditInput = subtask.title; // Separates Input für Inline-Editing
    // Focus wird automatisch durch #editInput gesetzt
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
      status: 'todo',
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

