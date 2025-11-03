import { Component, OnInit } from '@angular/core';
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
export class AddTaskComponent implements OnInit {
  taskForm!: FormGroup;
  subtaskInput: string = '';
  subtasks: Subtask[] = [];
  editingSubtaskId: string | null = null;
  
  selectedPriority: 'low' | 'medium' | 'high' = 'medium';
  selectedContacts: Contact[] = [];
  selectedCategory: string = '';
  
  availableContacts: Contact[] = [];
  categories: string[] = ['Technical Task', 'User Story'];
  
  showContactDropdown: boolean = false;
  showCategoryDropdown: boolean = false;

  constructor(
    private fb: FormBuilder,
    private taskService: TaskService,
    private contactService: ContactService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.loadContacts();
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
    }
  }

  clearSubtaskInput(): void {
    this.subtaskInput = '';
  }

  editSubtask(subtask: Subtask): void {
    this.editingSubtaskId = subtask.id;
    this.subtaskInput = subtask.title;
  }

  updateSubtask(): void {
    if (this.editingSubtaskId && this.subtaskInput.trim()) {
      const subtask = this.subtasks.find(s => s.id === this.editingSubtaskId);
      if (subtask) {
        subtask.title = this.subtaskInput.trim();
      }
      this.editingSubtaskId = null;
      this.subtaskInput = '';
    }
  }

  deleteSubtask(subtaskId: string): void {
    this.subtasks = this.subtasks.filter(s => s.id !== subtaskId);
  }

  // Form Actions
  onSubmit(): void {
    if (this.taskForm.valid) {
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
          console.log('Task created successfully');
          this.router.navigate(['/board']);
        },
        error: (error: any) => {
          console.error('Error creating task:', error);
        }
      });
    } else {
      this.markFormAsTouched();
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

