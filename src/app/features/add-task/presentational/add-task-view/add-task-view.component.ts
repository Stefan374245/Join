import { Component, OnInit, input, output, signal, computed, inject, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, FormControl, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { FormFieldComponent } from '../../components/form-field/form-field.component';
import { ButtonGroupComponent, ButtonConfig } from '../../components/button-group/button-group.component';
import { DropdownComponent, DropdownItem } from '../../components/dropdown/dropdown.component';
import { BadgeListComponent } from '../../components/badge-list/badge-list.component';
import { SubtaskManagementComponent, Subtask } from '../../components/subtask-management/subtask-management.component';
import { TaskAttachmentUploadComponent } from '../../components/task-attachment-upload/task-attachment-upload.component';
import { TaskService } from '../../../../core/services/task.service';
import { ContactService } from '../../../../core/services/contact.service';
import { AuthService } from '../../../../core/services/auth.service';
import { ToastService } from '../../../../core/services/toast.service';
import { Task, TaskAttachment } from '../../../../core/models/task.interface';
import { Contact } from '../../../../core/models/contact.interface';

/**
 * Comprehensive task creation and editing component with form validation
 */
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
    SubtaskManagementComponent,
    TaskAttachmentUploadComponent
  ],
  templateUrl: './add-task-view.component.html',
  styleUrl: './add-task-view.component.scss'
})
export class AddTaskViewComponent implements OnInit, AfterViewInit {
  @ViewChild(TaskAttachmentUploadComponent) uploadComponent?: TaskAttachmentUploadComponent;
  
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
  attachments = signal<TaskAttachment[]>([]);
  editingSubtaskId = signal<string | null>(null);
  subtaskEditInput = signal<string>('');
  isEditMode = signal<boolean>(false);
  minDate = signal<string>(this.formatDateForInput(new Date()));
  formValid = signal<boolean>(false);
  formDirty = signal<boolean>(false); // Signal for dirty state
  
  readonly categories = ['Technical Task', 'User Story'];
  
  readonly priorityButtons: ButtonConfig[] = [
    { value: 'urgent', label: 'Urgent', cssClass: 'priority-btn priority-btn-urgent', iconRight: 'assets/images/urgent.svg', iconRightActive: 'assets/images/urgentwhite.svg' },
    { value: 'medium', label: 'Medium', cssClass: 'priority-btn priority-btn-medium', iconRight: 'assets/images/medium.svg', iconRightActive: 'assets/images/mediumwhite.svg' },
    { value: 'low', label: 'Low', cssClass: 'priority-btn priority-btn-low', iconRight: 'assets/images/low.svg', iconRightActive: 'assets/images/lowwhite.svg' }
  ];
 
  /**
   * Available contacts formatted for dropdown - using ContactService signals
   */
  availableContacts = computed((): DropdownItem[] => {
    // Use ContactService signals instead of direct method calls
    return this.contactService.contacts().map((c: Contact) => ({
      id: c.id,
      label: `${c.firstName} ${c.lastName}`,
      value: c.id,
      color: c.color
    }));
  });
  
  /**
   * Available categories formatted for dropdown
   */
  categoryItems = computed((): DropdownItem[] => {
    // Convert category strings to dropdown items
    return this.categories.map(cat => ({
      id: cat,
      label: cat
    }));
  });
  
  /**
   * Selected contacts as badge items for display
   */
  selectedContactBadges = computed(() => {
    const selected = this.selectedContactIds();
    // Filter and transform selected contacts to badges
    return this.availableContacts()
      .filter(c => selected.includes(c.id))
      .map(c => ({
        id: c.id,
        label: c.label,
        color: (c as any).color || '#29ABE2',
        removable: true
      }));
  });
  
  /**
   * Form validation state for submit button
   */
  isFormValid = computed(() => this.formValid());
  
  // In edit mode, button is enabled if form is dirty or basic fields are present
  canSubmit = computed(() => {
    const editMode = this.isEditMode();
    const dirty = editMode ? this.formDirty() : false;
    const valid = this.isFormValid();
    
    console.log('🔍 canSubmit() computed:', {
      editMode,
      dirty,
      valid,
      result: editMode ? dirty : valid
    });
    
    if (editMode) {
      // Allow submit if form is dirty (any changes made)
      return dirty;
    }
    // In create mode, require full validation
    return valid;
  });
  
  /**
   * Updates form validation state based on required fields
   */
  private updateFormValidity(): void {
    if (!this.taskForm) {
      this.formValid.set(false);
      return;
    }
    
    // Check title: must be valid and at least 3 characters
    const titleControl = this.taskForm.get('title');
    const dueDateControl = this.taskForm.get('dueDate');
    
    const titleValid = titleControl?.valid && titleControl?.value?.trim()?.length >= 3;
    const dueDateValid = dueDateControl?.valid && dueDateControl?.value;
    const categoryValid = this.selectedCategory() !== '';
    
    // All required fields must be valid
    const result = titleValid && dueDateValid && categoryValid;
    this.formValid.set(result);
  }
  
  /**
   * Gets form control by name with type safety
   * @param name - Form control name
   * @returns Form control instance
   */
  getControl(name: string): FormControl {
    return this.taskForm.get(name) as FormControl;
  }

  /**
   * Component initialization - sets up form and loads data using signals
   */
  ngOnInit(): void {
    // Initialize reactive form with validation
    this.initForm();
    
    // ContactService loads automatically via signals - no manual loading needed
    
    // Check if editing existing task and populate form
    const task = this.taskToEdit();
    if (task) {
      this.isEditMode.set(true);
      this.populateFormWithTask(task);
    }
  }
  
  
  ngAfterViewInit(): void {
    // Set initial attachments AFTER view is initialized, in edit mode only
    if (this.isEditMode() && this.attachments().length > 0 && this.uploadComponent) {
      this.uploadComponent.initialAttachments = this.attachments();
      console.log('✨ Set initial attachments via ViewChild:', this.attachments().length);
    }
  }
  
  /**
   * Initializes reactive form with validation rules
   */
  private initForm(): void {
    // Create form with required field validators
    this.taskForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(3)]],
      description: [''],
      dueDate: ['', Validators.required],
      category: ['', Validators.required]
    });
    
    // Subscribe to form changes for real-time validation
    this.taskForm.valueChanges.subscribe(() => {
      this.updateFormValidity();
      
      // In edit mode, mark as dirty when form fields change
      if (this.isEditMode()) {
        this.formDirty.set(true);
      }
    });
    
    // Initial validation check
    this.updateFormValidity();
  }
  
  /**
   * Populates form with existing task data for editing
   * @param task - Task to edit
   */
  private populateFormWithTask(task: Task): void {
    // Fill form controls with task data
    this.taskForm.patchValue({
      title: task.title,
      description: task.description,
      dueDate: this.formatDateForInput(task.dueDate),
      category: task.category
    });
    
    // Set signal values for non-form fields
    this.selectedPriority.set(task.priority);
    this.selectedCategory.set(task.category);
    this.subtasks.set(task.subtasks ? [...task.subtasks] : []);
    this.attachments.set(task.attachments ? [...task.attachments] : []);
    
    // Map assigned contact IDs to available contacts
    const contactIds = this.availableContacts()
      .filter(c => task.assignedTo.includes(c.id))
      .map(c => c.id);
    this.selectedContactIds.set(contactIds);
    
    // Reset dirty state - form should be pristine after loading
    this.taskForm.markAsPristine();
    this.formDirty.set(false);
  }
  
  /**
   * Formats Date object for HTML date input
   * @param date - Date to format
   * @returns YYYY-MM-DD string
   */
  private formatDateForInput(date: Date): string {
    const d = new Date(date);
    // Extract year, month, day with zero padding
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  /**
   * Handles priority button selection
   * @param priority - Selected priority value
   */
  onPriorityChange(priority: string | number): void {
    // Update priority signal with new selection
    this.selectedPriority.set(priority);
    // Mark form as dirty so save button is enabled in edit mode
    if (this.isEditMode()) {
      this.taskForm.markAsDirty();
      this.formDirty.set(true);
    }
  }

  /**
   * Handles contact selection from dropdown
   * @param contactIds - Array of selected contact IDs
   */
  onContactSelection(contactIds: string[]): void {
    // Update selected contacts signal
    this.selectedContactIds.set(contactIds);
    // Mark form as dirty so save button is enabled in edit mode
    if (this.isEditMode()) {
      this.taskForm.markAsDirty();
      this.formDirty.set(true);
    }
  }

  /**
   * Handles category selection with form sync
   * @param categoryIds - Array of selected category IDs (single select)
   */
  onCategorySelection(categoryIds: string[]): void {
    if (categoryIds.length > 0) {
      const category = categoryIds[0];
      // Update both signal and form control
      this.selectedCategory.set(category);
      this.taskForm.patchValue({ category });
    } else {
      // Clear selection
      this.selectedCategory.set('');
      this.taskForm.patchValue({ category: '' });
    }
    
    // Mark form as dirty in edit mode
    if (this.isEditMode()) {
      this.taskForm.markAsDirty();
      this.formDirty.set(true);
    }
    
    // Trigger form validation update
    this.updateFormValidity();
  }
  
  /**
   * Removes contact from selection via badge
   * @param idToRemove - Contact ID to remove
   */
  onRemoveBadge(idToRemove: string): void {
    // Filter out the removed contact ID
    const updated = this.selectedContactIds().filter(id => id !== idToRemove);
    this.selectedContactIds.set(updated);
  }
  
  /**
   * Adds new subtask with limit validation
   * @param title - Subtask title
   */
  onAddSubtask(title: string): void {
    // Check maximum subtask limit
    if (this.subtasks().length >= 5) {
      this.toastService.showToast('Maximal 5 Subtasks erlaubt');
      return;
    }
    
    // Create new subtask with unique ID
    const newSubtask: Subtask = {
      id: Date.now().toString(36) + Math.random().toString(36).substring(2),
      title: title.trim(),
      completed: false
    };
    
    // Add to subtasks array
    this.subtasks.update(tasks => [...tasks, newSubtask]);
  }
  
  /**
   * Initiates subtask editing mode
   * @param subtask - Subtask to edit
   */
  onEditSubtask(subtask: Subtask): void {
    // Set editing state signals
    this.editingSubtaskId.set(subtask.id);
    this.subtaskEditInput.set(subtask.title);
  }
  
  /**
   * Updates subtask with new title
   */
  onUpdateSubtask(): void {
    const id = this.editingSubtaskId();
    const newTitle = this.subtaskEditInput().trim();
    
    if (!id || !newTitle) return;
    
    // Update subtask title in array
    this.subtasks.update(tasks =>
      tasks.map(t => t.id === id ? { ...t, title: newTitle } : t)
    );
    
    // Clear editing state
    this.editingSubtaskId.set(null);
    this.subtaskEditInput.set('');
  }
  
  /**
   * Cancels subtask editing without saving
   */
  onCancelEditSubtask(): void {
    // Reset editing state signals
    this.editingSubtaskId.set(null);
    this.subtaskEditInput.set('');
  }
  
  /**
   * Deletes subtask by ID
   * @param id - Subtask ID to delete
   */
  onDeleteSubtask(id: string): void {
    // Filter out the deleted subtask
    this.subtasks.update(tasks => tasks.filter(t => t.id !== id));
  }
  
  /**
   * Updates subtask edit input value
   * @param value - New input value
   */
  onSubtaskEditInputChange(value: string): void {
    // Update edit input signal
    this.subtaskEditInput.set(value);
  }

  /**
   * Handles attachment changes from upload component
   * @param attachments - Updated attachments array
   */
  onAttachmentsChange(attachments: TaskAttachment[]): void {
    console.log('📎 onAttachmentsChange():', {
      count: attachments.length,
      editMode: this.isEditMode(),
      dirtyBefore: this.taskForm.dirty
    });
    
    this.attachments.set(attachments);
    
    // Mark form as dirty so save button is enabled in edit mode
    if (this.isEditMode()) {
      this.taskForm.markAsDirty();
      this.formDirty.set(true); // Update signal!
      console.log('✅ markAsDirty() called, dirtyAfter:', this.taskForm.dirty);
    }
  }
  
  /**
   * Clears entire form and resets all signals
   */
  onClearForm(): void {
    // Reset form controls to initial state
    this.taskForm.reset();
    // Reset all signal states to defaults
    this.selectedPriority.set('medium');
    this.selectedContactIds.set([]);
    this.selectedCategory.set('');
    this.subtasks.set([]);
    this.attachments.set([]);
    this.editingSubtaskId.set(null);
    this.subtaskEditInput.set('');
    
    // Trigger validation update
    this.updateFormValidity();
  }
  
  /**
   * Emits close event to parent component
   */
  onClose(): void {
    this.close.emit();
  }
  
  /**
   * Handles overlay background clicks for modal closure
   * @param event - Mouse click event
   */
  onOverlayClick(event: MouseEvent): void {
    // Close only if clicking directly on the overlay background
    if (event.target === event.currentTarget) {
      this.onClose();
    }
  }
  
  /**
   * Handles form submission with validation
   */
  onSubmit(): void {
    // In edit mode, allow save even if only signal values (attachments, contacts, priority) changed
    if (this.isEditMode()) {
      // Check if basic form fields are present (more lenient validation)
      const titleControl = this.taskForm.get('title');
      const dueDateControl = this.taskForm.get('dueDate');
      
      if (!titleControl?.value?.trim() || !dueDateControl?.value) {
        this.markFormAsTouched();
        this.toastService.showToast('Title and Due Date are required');
        return;
      }
      
      this.updateTask();
      return;
    }
    
    // In create mode, require full validation
    if (!this.isFormValid()) {
      this.markFormAsTouched();
      this.toastService.showToast('Please fill all required fields');
      return;
    }
    
    this.createTask();
  }
  
  /**
   * Creates new task from form data
   */
  private async createTask(): Promise<void> {
    const formValue = this.taskForm.value;
    const userId = this.authService.userId();
    
    // Validate user authentication
    if (!userId) {
      this.toastService.showToast('User not authenticated');
      return;
    }

    const additionalData = {
      userId,
      selectedCategory: this.selectedCategory(),
      selectedContactIds: this.selectedContactIds(),
      selectedPriority: this.selectedPriority().toString(),
      initialStatus: this.initialStatus(),
      subtasks: this.subtasks(),
      attachments: this.attachments()
    };

    // Save task via service with error handling
    try {
      const newTask = await this.taskService.createTaskFromForm(formValue, additionalData);
      this.toastService.showToast('Task created successfully');
      this.taskSaved.emit(newTask);
      
      // Navigate based on usage context
      if (this.isOverlay()) {
        this.close.emit();
      } else {
        this.router.navigate(['/board']);
      }
    } catch (error: any) {
      this.toastService.showToast('Failed to create task');
      console.error('Error creating task:', error);
    }
  }
  
  /**
   * Updates existing task with form data
   */
  private async updateTask(): Promise<void> {
    console.log('🔵 UpdateTask() called');
    
    const task = this.taskToEdit();
    if (!task) {
      console.error('❌ No task to edit found');
      return;
    }
    
    console.log('📋 Task to edit:', task.id, task.title);
    
    const formValue = this.taskForm.value;
    console.log('📝 Form values:', formValue);
    
    const additionalData = {
      selectedCategory: this.selectedCategory(),
      selectedContactIds: this.selectedContactIds(),
      selectedPriority: this.selectedPriority().toString(),
      subtasks: this.subtasks(),
      attachments: this.attachments()
    };
    
    console.log('💾 Additional data:', {
      category: additionalData.selectedCategory,
      contacts: additionalData.selectedContactIds,
      priority: additionalData.selectedPriority,
      subtasksCount: additionalData.subtasks.length,
      attachmentsCount: additionalData.attachments.length
    });
    
    // Update task via service with error handling
    try {
      console.log('⏳ Calling taskService.updateTaskFromForm...');
      const updatedTask = await this.taskService.updateTaskFromForm(task.id, formValue, additionalData);
      console.log('✅ Task updated successfully:', updatedTask);
      
      this.toastService.showToast('Task updated successfully');
      this.taskSaved.emit(updatedTask);
      
      // Navigate based on usage context
      if (this.isOverlay()) {
        console.log('📤 Closing overlay');
        this.close.emit();
      } else {
        console.log('🔄 Navigating to board');
        this.router.navigate(['/board']);
      }
    } catch (error: any) {
      console.error('❌ Error updating task:', error);
      this.toastService.showToast('Failed to update task');
    }
  }
 
  /**
   * Marks all form controls as touched to show validation errors
   */
  private markFormAsTouched(): void {
    // Iterate through all form controls and mark as touched
    Object.keys(this.taskForm.controls).forEach(key => {
      this.taskForm.controls[key].markAsTouched();
    });
  }
}
