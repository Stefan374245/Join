import {
  Component,
  OnInit,
  input,
  output,
  signal,
  computed,
  inject,
  ViewChild,
  AfterViewInit,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  FormControl,
  Validators,
} from "@angular/forms";
import { Router } from "@angular/router";
import { FormFieldComponent } from "../../components/form-field/form-field.component";
import {
  ButtonGroupComponent,
  ButtonConfig,
} from "../../components/button-group/button-group.component";
import {
  DropdownComponent,
  DropdownItem,
} from "../../components/dropdown/dropdown.component";
import { BadgeListComponent } from "../../components/badge-list/badge-list.component";
import {
  SubtaskManagementComponent,
  Subtask,
} from "../../components/subtask-management/subtask-management.component";
import { AttachmentUploadComponent, ImageViewerComponent } from "../../../attachments";
import { TaskService } from "../../../../core/services/task.service";
import { ContactService } from "../../../../core/services/contact.service";
import { AuthService } from "../../../../core/services/auth.service";
import { ToastService } from "../../../../core/services/toast.service";
import { Task, TaskAttachment } from "../../../../core/models/task.interface";
import { Contact } from "../../../../core/models/contact.interface";
import { LoadingSpinnerComponent } from "../../../../shared/components/loading-spinner/loading-spinner.component";
import { TASK_MESSAGES, TASK_LIMITS } from "../../../../shared/constants";
@Component({
  selector: "app-add-task-view",
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormFieldComponent,
    ButtonGroupComponent,
    DropdownComponent,
    BadgeListComponent,
    SubtaskManagementComponent,
    AttachmentUploadComponent,
    ImageViewerComponent,
    LoadingSpinnerComponent,
  ],
  templateUrl: "./add-task-view.component.html",
  styleUrl: "./add-task-view.component.scss",
})
export class AddTaskViewComponent implements OnInit, AfterViewInit {
  @ViewChild(AttachmentUploadComponent)
  uploadComponent?: AttachmentUploadComponent;

  isOverlay = input<boolean>(false);
  taskToEdit = input<Task | null>(null);
  initialStatus = input<"triage" | "todo" | "in-progress" | "await-feedback" | "done">("triage");

  close = output<void>();
  taskSaved = output<Task>();

  private fb = inject(FormBuilder);
  private taskService = inject(TaskService);
  private contactService = inject(ContactService);
  private authService = inject(AuthService);
  private toastService = inject(ToastService);
  private router = inject(Router);

  taskForm!: FormGroup;
  selectedPriority = signal<string | number>("medium");
  selectedContactIds = signal<string[]>([]);
  selectedCategory = signal<string>("");
  subtasks = signal<Subtask[]>([]);
  attachments = signal<TaskAttachment[]>([]);
  editingSubtaskId = signal<string | null>(null);
  subtaskEditInput = signal<string>("");
  isEditMode = signal<boolean>(false);
  minDate = signal<string>(this.formatDateForInput(new Date()));
  formValid = signal<boolean>(false);
  formDirty = signal<boolean>(false);
  isLoading = signal<boolean>(false);

  selectedAttachment = signal<TaskAttachment | null>(null);
  selectedAttachmentIndex = computed<number>(() => {
    const attachment = this.selectedAttachment();
    const currentAttachments = this.attachments();

    if (!attachment || !currentAttachments || currentAttachments.length === 0) {
      return 0;
    }

    const index = currentAttachments.findIndex(
      (att) => att.id === attachment.id,
    );
    return index >= 0 ? index : 0;
  });

  showImageViewer = computed<boolean>(() => this.selectedAttachment() !== null);

  readonly categories = ["Technical Task", "User Story"];

  readonly priorityButtons: ButtonConfig[] = [
    {
      value: "urgent",
      label: "Urgent",
      cssClass: "priority-btn priority-btn-urgent",
      iconRight: "assets/images/urgent.svg",
      iconRightActive: "assets/images/urgentwhite.svg",
    },
    {
      value: "medium",
      label: "Medium",
      cssClass: "priority-btn priority-btn-medium",
      iconRight: "assets/images/medium.svg",
      iconRightActive: "assets/images/mediumwhite.svg",
    },
    {
      value: "low",
      label: "Low",
      cssClass: "priority-btn priority-btn-low",
      iconRight: "assets/images/low.svg",
      iconRightActive: "assets/images/lowwhite.svg",
    },
  ];

  availableContacts = computed((): DropdownItem[] => {
    return this.contactService.contacts().map((c: Contact) => ({
      id: c.id,
      label: `${c.firstName} ${c.lastName}`,
      value: c.id,
      color: c.color,
    }));
  });

  categoryItems = computed((): DropdownItem[] => {
    return this.categories.map((cat) => ({
      id: cat,
      label: cat,
    }));
  });

  selectedContactBadges = computed(() => {
    const selected = this.selectedContactIds();
    return this.availableContacts()
      .filter((c) => selected.includes(c.id))
      .map((c) => ({
        id: c.id,
        label: c.label,
        color: (c as any).color || "#29ABE2",
        removable: true,
      }));
  });

  isFormValid = computed(() => this.formValid());

  canSubmit = computed(() => {
    const editMode = this.isEditMode();
    const dirty = editMode ? this.formDirty() : false;
    const valid = this.isFormValid();

    if (editMode) {
      return dirty;
    }
    return valid;
  });

  /**
   * Updates the validity state of the task form.
   *
   * This method checks the validity of the form controls for the task title,
   * due date, and selected category. It sets the `formValid` observable to `true`
   * if all required fields are valid and meet their respective criteria:
   * - The title must be valid and at least 3 characters long.
   * - The due date must be valid and have a value.
   * - A category must be selected (not an empty string).
   *
   * If the form is not initialized, the validity is set to `false`.
   */
  private updateFormValidity(): void {
    if (!this.taskForm) {
      this.formValid.set(false);
      return;
    }

    const titleControl = this.taskForm.get("title");
    const dueDateControl = this.taskForm.get("dueDate");

    const titleValid =
      titleControl?.valid && titleControl?.value?.trim()?.length >= 3;
    const dueDateValid = dueDateControl?.valid && dueDateControl?.value;
    const categoryValid = this.selectedCategory() !== "";

    const result = titleValid && dueDateValid && categoryValid;
    this.formValid.set(result);
  }

  /**
   * Retrieves a form control from the `taskForm` FormGroup by its name.
   *
   * @param name - The name of the control to retrieve.
   * @returns The `FormControl` instance associated with the given name.
   */
  getControl(name: string): FormControl {
    return this.taskForm.get(name) as FormControl;
  }

  /**
   * Lifecycle hook that is called after data-bound properties of a directive are initialized.
   * Initializes the form and checks if there is a task to edit.
   * If a task exists, sets the component to edit mode and populates the form with the task data.
   */
  ngOnInit(): void {
    this.initForm();
    const task = this.taskToEdit();
    if (task) {
      this.isEditMode.set(true);
      this.populateFormWithTask(task);
    }
  }

  /**
   * Lifecycle hook that is called after Angular has fully initialized
   * a component's view. Sets initial attachments in edit mode.
   * If in edit mode and there are attachments, it assigns them to the
   * TaskAttachmentUploadComponent via ViewChild.
   */
  ngAfterViewInit(): void {
    if (
      this.isEditMode() &&
      this.attachments().length > 0 &&
      this.uploadComponent
    ) {
      this.uploadComponent.initialAttachments = this.attachments();
    }
  }

/**
 * Initializes the task form with default values and validators.
 * Sets up a subscription to form value changes to update form validity
 * and track dirty state in edit mode.
 * This method creates a FormGroup with controls for title, description,
 * due date, and category, applying necessary validators for required fields
 * and minimum length where applicable.
 */
  private initForm(): void {
    this.taskForm = this.fb.group({
      title: ["", [Validators.required, Validators.minLength(3)]],
      description: [""],
      dueDate: ["", Validators.required],
      category: ["", Validators.required],
    });

    this.taskForm.valueChanges.subscribe(() => {
      this.updateFormValidity();
      if (this.isEditMode()) {
        this.formDirty.set(true);
      }
    });

    this.updateFormValidity();
  }

  /**
   * Populates the task form with the provided task's data.
   *
   * This method updates the form controls and related state with the values from the given `Task` object,
   * including title, description, due date, category, priority, subtasks, attachments, and assigned contacts.
   * It also resets the form's dirty state to pristine.
   *
   * @param task - The `Task` object whose data will be used to populate the form.
   */
  private populateFormWithTask(task: Task): void {
    this.taskForm.patchValue({
      title: task.title,
      description: task.description,
      dueDate: this.formatDateForInput(task.dueDate),
      category: task.category,
    });

    this.selectedPriority.set(task.priority);
    this.selectedCategory.set(task.category);
    this.subtasks.set(task.subtasks ? [...task.subtasks] : []);
    this.attachments.set(task.attachments ? [...task.attachments] : []);

    const contactIds = this.availableContacts()
      .filter((c) => task.assignedTo.includes(c.id))
      .map((c) => c.id);
    this.selectedContactIds.set(contactIds);

    this.taskForm.markAsPristine();
    this.formDirty.set(false);
  }

/**
 * Formats a Date object into a string suitable for use in date input fields (YYYY-MM-DD).
 * 
 * @param date 
 * @returns 
 */
  private formatDateForInput(date: Date): string {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  /**
   * Handles changes to the selected priority.
   * If in edit mode, marks the form as dirty.
   * 
   * @param priority string | number - The newly selected priority value.
   * 
   */
  onPriorityChange(priority: string | number): void {
    this.selectedPriority.set(priority);
    if (this.isEditMode()) {
      this.taskForm.markAsDirty();
      this.formDirty.set(true);
    }
  }

/**
 * Handles changes to the selected contacts.
 * If in edit mode, marks the form as dirty.
 * 
 * @param contactIds  string[] - Array of selected contact IDs.
 */
  onContactSelection(contactIds: string[]): void {
    this.selectedContactIds.set(contactIds);
    if (this.isEditMode()) {
      this.taskForm.markAsDirty();
      this.formDirty.set(true);
    }
  }

  /**
   * Handles the selection of task categories by updating the form and internal state.
   *
   * - Sets the selected category based on the first element of the provided `categoryIds` array.
   * - Updates the `taskForm`'s `category` field with the selected category or clears it if none are selected.
   * - If in edit mode, marks the form as dirty and updates the `formDirty` state.
   * - Calls `updateFormValidity()` to revalidate the form after changes.
   *
   * @param categoryIds - An array of selected category IDs. The first ID is used as the selected category.
   */
  onCategorySelection(categoryIds: string[]): void {
    if (categoryIds.length > 0) {
      const category = categoryIds[0];
      this.selectedCategory.set(category);
      this.taskForm.patchValue({ category });
    } else {
      this.selectedCategory.set("");
      this.taskForm.patchValue({ category: "" });
    }

    if (this.isEditMode()) {
      this.taskForm.markAsDirty();
      this.formDirty.set(true);
    }

    this.updateFormValidity();
  }

  /**
   * Removes a contact ID from the list of selected contact IDs.
   *
   * @param idToRemove - The ID of the contact badge to remove from the selection.
   */
  onRemoveBadge(idToRemove: string): void {
    const updated = this.selectedContactIds().filter((id) => id !== idToRemove);
    this.selectedContactIds.set(updated);
  }

  /**
   * Adds a new subtask with the given title to the list of subtasks.
   * 
   * - Limits the total number of subtasks to 5. If the limit is reached,
   *   displays a toast notification and does not add the subtask.
   * - Generates a unique ID for the new subtask.
   * - Trims whitespace from the provided title.
   * - Marks the new subtask as not completed.
   * 
   * @param title - The title of the subtask to add.
   */
  onAddSubtask(title: string): void {
    if (this.subtasks().length >= TASK_LIMITS.MAX_SUBTASKS) {
      this.toastService.showToast(TASK_MESSAGES.MAX_SUBTASKS);
      return;
    }

    const newSubtask: Subtask = {
      id: Date.now().toString(36) + Math.random().toString(36).substring(2),
      title: title.trim(),
      completed: false,
    };

    this.subtasks.update((tasks) => [...tasks, newSubtask]);
  }

  /**
   * Handles the initiation of editing a subtask.
   * 
   * Sets the current editing subtask's ID and pre-fills the edit input with the subtask's title.
   *
   * @param subtask - The subtask object to be edited.
   */
  onEditSubtask(subtask: Subtask): void {
    this.editingSubtaskId.set(subtask.id);
    this.subtaskEditInput.set(subtask.title);
  }

  /**
   * Updates the title of the currently edited subtask.
   *
   * Retrieves the ID of the subtask being edited and the new title from the input.
   * If both are valid, updates the corresponding subtask's title in the `subtasks` store.
   * After updating, resets the editing subtask ID and clears the input field.
   *
   * @returns {void}
   */
  onUpdateSubtask(): void {
    const id = this.editingSubtaskId();
    const newTitle = this.subtaskEditInput().trim();

    if (!id || !newTitle) return;

    this.subtasks.update((tasks) =>
      tasks.map((t) => (t.id === id ? { ...t, title: newTitle } : t)),
    );

    this.editingSubtaskId.set(null);
    this.subtaskEditInput.set("");
  }

  /**
   * Cancels the editing of a subtask.
   * 
   * Resets the currently edited subtask ID to `null` and clears the subtask edit input field.
   * Typically called when the user decides to cancel editing a subtask.
   */
  onCancelEditSubtask(): void {
    this.editingSubtaskId.set(null);
    this.subtaskEditInput.set("");
  }

  /**
   * Deletes a subtask from the list of subtasks by its unique identifier.
   *
   * @param id - The unique identifier of the subtask to be deleted.
   */
  onDeleteSubtask(id: string): void {
    this.subtasks.update((tasks) => tasks.filter((t) => t.id !== id));
  }

  /**
   * Handles changes to the subtask edit input field.
   * 
   * Updates the value of the `subtaskEditInput` control with the provided input value.
   *
   * @param value - The new value entered in the subtask edit input field.
   */
  onSubtaskEditInputChange(value: string): void {
    this.subtaskEditInput.set(value);
  }

  /**
   * Handles changes to the task attachments.
   *
   * This method is triggered when the attachments for a task are updated.
   * It logs the change, updates the internal attachments state, and, if in edit mode,
   * marks the form as dirty and updates the form's dirty state.
   *
   * @param attachments - The updated list of task attachments.
   */
  onAttachmentsChange(attachments: TaskAttachment[]): void {
    this.attachments.set(attachments);

    if (this.isEditMode()) {
      this.taskForm.markAsDirty();
      this.formDirty.set(true);
    }
  }

  /**
   * Clears and resets the task form to its initial state.
   * This method resets all form fields and related state signals,
   * including selected priority, contacts, category, subtasks, and attachments.
   * It also resets the editing subtask ID and subtask edit input.
   * Finally, it updates the form validity state.
   * 
   * @returns {void}
   */
  onClearForm(): void {
    this.taskForm.reset();
    this.selectedPriority.set("medium");
    this.selectedContactIds.set([]);
    this.selectedCategory.set("");
    this.subtasks.set([]);
    this.attachments.set([]);
    this.editingSubtaskId.set(null);
    this.subtaskEditInput.set("");

    this.updateFormValidity();
  }

  /**
   * Handles the closing of the add/edit task view.
   * Emits the `close` event to notify parent components.
   * 
   * @return {void}
   */
  onClose(): void {
    this.close.emit();
  }

  /**
   * Handles click events on the overlay background to close the add/edit task view.
   * Closes the view only if the click target is the overlay itself,
   * not any child elements.
   * 
   * @param event MouseEvent - The mouse event triggered by the click.
   * 
   */
  onOverlayClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.onClose();
    }
  }

  /**
   * Handles the submission of the task form for creating or updating a task.
   * Determines whether to create a new task or update an existing one
   * based on the current mode (edit or create).
   * 
   * @return {void}
   */
  onSubmit(): void {
    this.handleSubmit();
  }

  /**
   * Submits the task form by either creating a new task or updating an existing one.
   * Checks the current mode (edit or create) and validates the form accordingly.
   * If in edit mode, it validates the edit form and calls `updateTask()`.
   * If in create mode, it validates the create form and calls `createTask()`.
   * 
   * @returns 
   */
  private handleSubmit(): void {
    if (this.isEditMode()) {
      if (!this.isEditValid()) return;
      this.updateTask();
      return;
    }
    if (!this.isCreateValid()) return;
    this.createTask();
  }

  /**
   * Validates the form in edit mode to ensure required fields are filled.
   * Checks that the title is not empty, the due date is set, and a category is selected.
   * If validation fails, marks the form as touched and shows a toast notification.
   * 
   * @returns {boolean} - True if the form is valid, false otherwise.
   */
  private isEditValid(): boolean {
    const titleControl = this.taskForm.get("title");
    const dueDateControl = this.taskForm.get("dueDate");
    const categoryValid = this.selectedCategory() !== "";
    
    if (!titleControl?.value?.trim() || !dueDateControl?.value || !categoryValid) {
      this.markFormAsTouched();
      this.toastService.showToast(TASK_MESSAGES.REQUIRED_FIELDS);
      return false;
    }
    return true;
  }

  /**
   * Checks if the form is valid for creating a new task.
   * If the form is invalid, marks all form fields as touched and displays a toast notification.
   *
   * @returns {boolean} Returns `true` if the form is valid; otherwise, returns `false`.
   */
  private isCreateValid(): boolean {
    if (!this.isFormValid()) {
      this.markFormAsTouched();
      this.toastService.showToast(TASK_MESSAGES.REQUIRED_FIELDS);
      return false;
    }
    return true;
  }

  /**
   * Creates a new task based on the form values and additional data.
   * Retrieves the current user's ID and constructs the task data.
   * Calls the TaskService to create the task and handles success or failure.
   * On success, shows a success toast, emits the taskSaved event, and handles post-creation navigation.
   * On failure, shows an error toast and logs the error.
   * 
   * @returns {Promise<void>} A promise that resolves when the task creation process is complete.
   */
  private async createTask(): Promise<void> {
    const userId = this.authService.userId();
    if (!userId) return this.toastService.showToast(TASK_MESSAGES.USER_NOT_AUTH);
    const formValue = this.taskForm.value;
    const additionalData = this.buildAdditionalData(userId);
    this.isLoading.set(true);
    try {
      const newTask = await this.taskService.createTaskFromForm(
        formValue,
        additionalData,
      );
      this.toastService.showToast(TASK_MESSAGES.CREATE_SUCCESS);
      this.taskSaved.emit(newTask);
      this.handleAfterCreate();
    } catch (error: any) {
      this.toastService.showToast(TASK_MESSAGES.CREATE_ERROR);
      console.error("Error creating task:", error);
    } finally {
      this.isLoading.set(false);
    }
  }
/**
 * Builds additional data required for task creation or update.
 * Includes user ID, selected category, contact IDs, priority, initial status, subtasks, and attachments.
 * 
 * @param userId 
 * @returns 
 */
  private buildAdditionalData(userId: string) {
    return {
      userId,
      selectedCategory: this.selectedCategory(),
      selectedContactIds: this.selectedContactIds(),
      selectedPriority: this.selectedPriority().toString(),
      initialStatus: this.initialStatus(),
      subtasks: this.subtasks(),
      attachments: this.attachments(),
    };
  }

  /**
   * Handles post-creation navigation based on the component mode.
   * If in overlay mode, emits the close event to close the overlay.
   * If not in overlay mode, navigates to the "/board" route.
   * 
   * @return {void}
   */
  private handleAfterCreate() {
    if (this.isOverlay()) {
      this.close.emit();
    } else {
      this.router.navigate(["/board"]);
    }
  }

  /**
   * Updates an existing task based on the form values and additional data.
   * Retrieves the task to edit and constructs the update data.
   * Calls the TaskService to update the task and handles success or failure.
   * On success, shows a success toast, emits the taskSaved event, and handles post-update navigation.
   * On failure, shows an error toast and logs the error.
   *
   * @returns {Promise<void>} A promise that resolves when the task update process is complete.
   */
  private async updateTask(): Promise<void> {
    const task = this.taskToEdit();
    if (!task) return console.error("❌ No task to edit found");
    const formValue = this.taskForm.value;
    const additionalData = this.buildUpdateData();
    this.isLoading.set(true);
    try {
      const updatedTask = await this.taskService.updateTaskFromForm(task.id, formValue, additionalData);
      this.toastService.showToast(TASK_MESSAGES.UPDATE_SUCCESS);
      this.taskSaved.emit(updatedTask);
      this.handleAfterUpdate();
    } catch (error: any) {
      this.toastService.showToast(TASK_MESSAGES.UPDATE_ERROR);
      console.error("❌ Error updating task:", error);
    } finally {
      this.isLoading.set(false);
    }
  }

  /**
   * Builds the data required for updating a task.
   * Includes selected category, contact IDs, priority, subtasks, and attachments.
   * 
   * @returns Object - The data object for task update. 
   */
  private buildUpdateData() {
    return {
      selectedCategory: this.selectedCategory(),
      selectedContactIds: this.selectedContactIds(),
      selectedPriority: this.selectedPriority().toString(),
      subtasks: this.subtasks(),
      attachments: this.attachments(),
    };
  }

  /**
   * Handles post-update navigation based on the component mode.
   * If in overlay mode, emits the close event to close the overlay.
   * If not in overlay mode, navigates to the "/board" route.
   * 
   * @return {void}
   */
  private handleAfterUpdate() {
    if (this.isOverlay()) {
      this.close.emit();
    } else {
      this.router.navigate(["/board"]);
    }
  }

  /**
   * Marks all controls in the `taskForm` form group as touched.
   * This is typically used to trigger validation messages for all form fields,
   * ensuring that any validation errors are displayed to the user.
   *
   * @private
   */
  private markFormAsTouched(): void {
    Object.keys(this.taskForm.controls).forEach((key) => {
      this.taskForm.controls[key].markAsTouched();
    });
  }

  /**
   * Handles the viewing of a task attachment.
   * Sets the selected attachment to be viewed in the image viewer.
   * 
   * @param attachment - The task attachment to be viewed.
   */
  onViewAttachment(attachment: TaskAttachment): void {
    this.selectedAttachment.set(attachment);
  }

  /**
   * Handles the deletion of a task attachment.
   * Removes the specified attachment from the attachments list.
   * Displays a success toast notification upon removal.
   * If the deleted attachment is currently selected, it clears the selection.
   * 
   * @param attachment - The task attachment to be deleted.
   */
  onDeleteAttachment(attachment: TaskAttachment): void {
    this.attachments.update((atts) =>
      atts.filter((a) => a.id !== attachment.id),
    );
    this.toastService.showSuccess("Attachment removed");

    if (this.selectedAttachment()?.id === attachment.id) {
      this.selectedAttachment.set(null);
    }
  }

  /**
   * Handles the deletion of all task attachments.
   * Clears the attachments list and resets the selected attachment.
   * Displays a success toast notification upon removal.
   * 
   * @return {void}
   */
  onDeleteAllAttachments(): void {
    this.attachments.set([]);
    this.selectedAttachment.set(null);
    this.toastService.showSuccess("All attachments removed");
  }

  /**
   * Handles the closing of the image viewer.
   * Resets the selected attachment to null, effectively closing the viewer.
   * 
   * @return {void}
   */
  onCloseImageViewer(): void {
    this.selectedAttachment.set(null);
  }
}
