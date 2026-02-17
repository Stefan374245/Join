import { Component, OnInit, input, output, signal, computed, inject, ViewChild, AfterViewInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import { ReactiveFormsModule, FormBuilder, FormGroup, FormControl, Validators } from "@angular/forms";
import { Router } from "@angular/router";
import { FormFieldComponent } from "../../components/form-field/form-field.component";
import { ButtonGroupComponent, ButtonConfig } from "../../components/button-group/button-group.component";
import { DropdownComponent, DropdownItem } from "../../components/dropdown/dropdown.component";
import { BadgeListComponent } from "../../components/badge-list/badge-list.component";
import { SubtaskManagementComponent, Subtask } from "../../components/subtask-management/subtask-management.component";
import { AttachmentUploadComponent, ImageViewerComponent } from "../../../attachments";
import { TaskService } from "../../../../core/services/task.service";
import { ContactService } from "../../../../core/services/contact.service";
import { AuthService } from "../../../../core/services/auth.service";
import { ToastService } from "../../../../core/services/toast.service";
import { Task, TaskAttachment } from "../../../../core/models/task.interface";
import { Contact } from "../../../../core/models/contact.interface";
import { LoadingSpinnerComponent } from "../../../../shared/components/loading-spinner/loading-spinner.component";
import { TASK_MESSAGES, TASK_LIMITS } from "../../../../shared/constants";
import { formatDateForInput, buildAdditionalData, buildUpdateData, markFormAsTouched } from "./helpers/add-task-form.helper";
import { createTaskFromFormData, updateTaskFromFormData, TaskSubmissionContext } from "./helpers/add-task-submission.helper";
import { checkFormValidity, isEditFormValid, getCategoryControl, hasCategoryError } from "./helpers/add-task-validation.helper";
import { createSubtask, updateSubtaskTitle, removeSubtask } from "./helpers/add-task-subtask.helper";
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
  initialStatus = input<
    "triage" | "todo" | "in-progress" | "await-feedback" | "done"
  >("triage");

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
  minDate = signal<string>(formatDateForInput(new Date()));
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
      avatarUrl: c.avatarUrl,
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
        avatarUrl: (c as any).avatarUrl || null,
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

  private updateFormValidity(): void {
    const isValid = checkFormValidity(this.taskForm, this.selectedCategory());
    this.formValid.set(isValid);
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
    this.patchFormFields(task);
    this.setTaskState(task);
    this.setContactIds(task);
    this.resetFormDirty();
  }

  private patchFormFields(task: Task): void {
    this.taskForm.patchValue({
      title: task.title,
      description: task.description,
      dueDate: formatDateForInput(task.dueDate),
      category: task.category,
    });
  }

  private setTaskState(task: Task): void {
    this.selectedPriority.set(task.priority);
    this.selectedCategory.set(task.category);
    this.subtasks.set(task.subtasks ? [...task.subtasks] : []);
    this.attachments.set(task.attachments ? [...task.attachments] : []);
  }

  private setContactIds(task: Task): void {
    const contactIds = this.availableContacts()
      .filter((c) => task.assignedTo.includes(c.id))
      .map((c) => c.id);
    this.selectedContactIds.set(contactIds);
  }

  private resetFormDirty(): void {
    this.taskForm.markAsPristine();
    this.formDirty.set(false);
  }



  /**
   * Handles changes to the selected priority.
   * If in edit mode, marks the form as dirty.
   * @param priority string | number - The newly selected priority value.
   * @returns void
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
   * @param contactIds  string[] - Array of selected contact IDs.
   * @return void
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
   * @param categoryIds - An array of selected category IDs. The first ID is used as the selected category.
   * @retyrn void
   * @remarks This method updates the `selectedCategory` signal and patches the `category` control in the form with the selected category. If the component is in edit mode, it also marks the form as dirty and updates the `formDirty` signal to reflect that changes have been made. Finally, it calls `updateFormValidity()` to re-evaluate the form's validity based on the new category selection.
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
   * Handles the blur event on the category dropdown to trigger validation.
   * @returns void
   * @remarks This method is called when the category dropdown loses focus. It marks the category control as touched and updates its validity without emitting an event. Finally, it calls `updateFormValidity()` to ensure that the form's overall validity state is updated based on the current value of the category control. This is important for displaying validation messages related to the category selection when the user interacts with the dropdown.
   */
  onCategoryBlur(): void {
    const control = getCategoryControl(this.taskForm);
    control?.markAsTouched();
    control?.updateValueAndValidity({ emitEvent: false });
    this.updateFormValidity();
  }

  /**
   * Checks if the category field has a validation error.
   * @returns boolean - True if the category field has a validation error, false otherwise.
   */
  categoryHasError(): boolean {
    return hasCategoryError(this.taskForm);
  }

  /**
   * Removes a contact ID from the list of selected contact IDs.
   * @param idToRemove - The ID of the contact badge to remove from the selection.
   * @returns void
   * @remarks This method updates the `selectedContactIds` signal by filtering out the specified `idToRemove`. It creates a new array that includes all contact IDs except the one that matches `idToRemove`, and then sets this new array as the updated value for `selectedContactIds`.
   */
  onRemoveBadge(idToRemove: string): void {
    const updated = this.selectedContactIds().filter((id) => id !== idToRemove);
    this.selectedContactIds.set(updated);
    
    if (this.isEditMode()) {
      this.formDirty.set(true);
    }
  }

  onAddSubtask(title: string): void {
    if (this.subtasks().length >= TASK_LIMITS.MAX_SUBTASKS) {
      this.toastService.showToast(TASK_MESSAGES.MAX_SUBTASKS);
      return;
    }
    const newSubtask = createSubtask(title);
    this.subtasks.update((tasks) => [...tasks, newSubtask]);
    
    if (this.isEditMode()) {
      this.formDirty.set(true);
    }
  }

  /**
   * Handles the initiation of editing a subtask.
   * @param subtask - The subtask object to be edited.
   * @returns void
   */
  onEditSubtask(subtask: Subtask): void {
    this.editingSubtaskId.set(subtask.id);
    this.subtaskEditInput.set(subtask.title);
  }

  /**
   * Handles the submission of an edited subtask.
   * @returns void
   * @remarks This method retrieves the currently editing subtask ID and the new title from the `subtaskEditInput`. If either the ID or the new title is missing, it returns early. Otherwise, it updates the subtasks signal by calling `updateSubtaskTitle` with the current list of subtasks, the ID of the subtask being edited, and the new title. Finally, it resets the editing subtask ID and clears the subtask edit input.
   */
  onUpdateSubtask(): void {
    const id = this.editingSubtaskId();
    const newTitle = this.subtaskEditInput().trim();
    if (!id || !newTitle) return;
    this.subtasks.update((tasks) => updateSubtaskTitle(tasks, id, newTitle));
    this.editingSubtaskId.set(null);
    this.subtaskEditInput.set("");
    
    if (this.isEditMode()) {
      this.formDirty.set(true);
    }
  }

  /**
   * Cancels the editing of a subtask.
   * @returns void
   * @remarks This method resets the `editingSubtaskId` signal to null and clears the `subtaskEditInput` signal. This effectively cancels the editing process for a subtask by clearing any temporary state related to the subtask being edited.
   */
  onCancelEditSubtask(): void {
    this.editingSubtaskId.set(null);
    this.subtaskEditInput.set("");
  }

  /**
   * Deletes a subtask by its ID.
   * @param id - The ID of the subtask to delete.
   * @returns {void}
   * @remarks This method updates the `subtasks` signal by removing the subtask with the specified ID. It effectively deletes the subtask from the list of subtasks.
   */
  onDeleteSubtask(id: string): void {
    this.subtasks.update((tasks) => removeSubtask(tasks, id));
    
    if (this.isEditMode()) {
      this.formDirty.set(true);
    }
  }

  /**
    * Handles changes to the subtask edit input field. * @param value - The new value entered in the subtask edit input field.
   */
  onSubtaskEditInputChange(value: string): void {
    this.subtaskEditInput.set(value);
  }

  /**
   * Handles changes to the task attachments.
   * @param attachments - The updated list of task attachments.
   * @returns void
   * @remarks This method updates the `attachments` signal with the new list of attachments. If the component is in edit mode, it also marks the form as dirty and updates the `formDirty` signal to reflect that changes have been made to the attachments. Finally, it calls `updateFormValidity()` to re-evaluate the form's validity based on the new attachments.
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
   * @returns {void}
   * @remarks This method resets the form controls to their default values, clears selected priority, contacts, category, subtasks, and attachments. It also resets the editing subtask state and updates the form validity. This is typically called when the user wants to clear all inputs and start fresh while creating or editing a task.
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
    this.uploadComponent?.removeAllAttachments();

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
   * @return {void}
   */
  onSubmit(): void {
    this.handleSubmit();
  }

  /**
   * Submits the task form by either creating a new task or updating an existing one.
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

  private isEditValid(): boolean {
    if (!isEditFormValid(this.taskForm, this.selectedCategory())) {
      this.markFormAsTouched();
      this.toastService.showToast(TASK_MESSAGES.REQUIRED_FIELDS);
      return false;
    }
    return true;
  }

  /**
   * Checks if the form is valid for creating a new task.
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

  private async createTask(): Promise<void> {
    const userId = this.authService.userId();
    if (!userId) {
      return this.toastService.showToast(TASK_MESSAGES.USER_NOT_AUTH);
    }
    const data = this.getCreateData(userId);
    await this.submitCreate(data);
  }

  private getCreateData(userId: string) {
    return {
      formValue: this.taskForm.value,
      additionalData: buildAdditionalData(
        userId,
        this.selectedCategory(),
        this.selectedContactIds(),
        this.selectedPriority(),
        this.initialStatus(),
        this.subtasks(),
        this.attachments()
      ),
    };
  }

  private async submitCreate(data: any): Promise<void> {
    this.isLoading.set(true);
    await createTaskFromFormData(
      data.formValue,
      data.additionalData,
      this.getSubmissionContext(),
      { onSuccess: (task) => this.handleTaskSaved(task) }
    );
    this.isLoading.set(false);
  }

  private async updateTask(): Promise<void> {
    const task = this.taskToEdit();
    if (!task) {
      return console.error("❌ No task to edit found");
    }
    const data = this.getUpdateData();
    await this.submitUpdate(task.id, data);
  }

  private getUpdateData() {
    return {
      formValue: this.taskForm.value,
      additionalData: buildUpdateData(
        this.selectedCategory(),
        this.selectedContactIds(),
        this.selectedPriority(),
        this.subtasks(),
        this.attachments()
      ),
    };
  }

  private async submitUpdate(taskId: string, data: any): Promise<void> {
    this.isLoading.set(true);
    await updateTaskFromFormData(
      taskId,
      data.formValue,
      data.additionalData,
      this.getSubmissionContext(),
      { onSuccess: (task) => this.handleTaskSaved(task) }
    );
    this.isLoading.set(false);
  }

  private handleTaskSaved(task: Task): void {
    this.taskSaved.emit(task);
    if (this.isOverlay()) {
      this.close.emit();
    }
  }

  private markFormAsTouched(): void {
    markFormAsTouched(this.taskForm.controls);
  }

  private getSubmissionContext(): TaskSubmissionContext {
    return {
      taskService: this.taskService,
      toastService: this.toastService,
      router: this.router,
      isOverlay: this.isOverlay(),
    };
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
    this.uploadComponent?.removeAttachment(attachment.id);
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
    this.uploadComponent?.removeAllAttachments();
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
