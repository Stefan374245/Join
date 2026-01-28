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
import { TaskAttachmentUploadComponent } from "../../components/task-attachment-upload/task-attachment-upload.component";
import { TaskService } from "../../../../core/services/task.service";
import { ContactService } from "../../../../core/services/contact.service";
import { AuthService } from "../../../../core/services/auth.service";
import { ToastService } from "../../../../core/services/toast.service";
import { Task, TaskAttachment } from "../../../../core/models/task.interface";
import { Contact } from "../../../../core/models/contact.interface";
import { ImageViewerComponent } from "../../../board/components/image-viewer/image-viewer.component";

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
    TaskAttachmentUploadComponent,
    ImageViewerComponent,
  ],
  templateUrl: "./add-task-view.component.html",
  styleUrl: "./add-task-view.component.scss",
})
export class AddTaskViewComponent implements OnInit, AfterViewInit {
  @ViewChild(TaskAttachmentUploadComponent)
  uploadComponent?: TaskAttachmentUploadComponent;

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
  minDate = signal<string>(this.formatDateForInput(new Date()));
  formValid = signal<boolean>(false);
  formDirty = signal<boolean>(false);

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

    console.log("🔍 canSubmit() computed:", {
      editMode,
      dirty,
      valid,
      result: editMode ? dirty : valid,
    });

    if (editMode) {
      return dirty;
    }
    return valid;
  });

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

  getControl(name: string): FormControl {
    return this.taskForm.get(name) as FormControl;
  }

  ngOnInit(): void {
    this.initForm();
    const task = this.taskToEdit();
    if (task) {
      this.isEditMode.set(true);
      this.populateFormWithTask(task);
    }
  }

  ngAfterViewInit(): void {
    if (
      this.isEditMode() &&
      this.attachments().length > 0 &&
      this.uploadComponent
    ) {
      this.uploadComponent.initialAttachments = this.attachments();
      console.log(
        "✨ Set initial attachments via ViewChild:",
        this.attachments().length,
      );
    }
  }

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

  private formatDateForInput(date: Date): string {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  onPriorityChange(priority: string | number): void {
    this.selectedPriority.set(priority);
    if (this.isEditMode()) {
      this.taskForm.markAsDirty();
      this.formDirty.set(true);
    }
  }

  onContactSelection(contactIds: string[]): void {
    this.selectedContactIds.set(contactIds);
    if (this.isEditMode()) {
      this.taskForm.markAsDirty();
      this.formDirty.set(true);
    }
  }

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

  onRemoveBadge(idToRemove: string): void {
    const updated = this.selectedContactIds().filter((id) => id !== idToRemove);
    this.selectedContactIds.set(updated);
  }

  onAddSubtask(title: string): void {
    if (this.subtasks().length >= 5) {
      this.toastService.showToast("Maximal 5 Subtasks erlaubt");
      return;
    }

    const newSubtask: Subtask = {
      id: Date.now().toString(36) + Math.random().toString(36).substring(2),
      title: title.trim(),
      completed: false,
    };

    this.subtasks.update((tasks) => [...tasks, newSubtask]);
  }

  onEditSubtask(subtask: Subtask): void {
    this.editingSubtaskId.set(subtask.id);
    this.subtaskEditInput.set(subtask.title);
  }

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

  onCancelEditSubtask(): void {
    this.editingSubtaskId.set(null);
    this.subtaskEditInput.set("");
  }

  onDeleteSubtask(id: string): void {
    this.subtasks.update((tasks) => tasks.filter((t) => t.id !== id));
  }

  onSubtaskEditInputChange(value: string): void {
    this.subtaskEditInput.set(value);
  }

  onAttachmentsChange(attachments: TaskAttachment[]): void {
    console.log("📎 onAttachmentsChange():", {
      count: attachments.length,
      editMode: this.isEditMode(),
      dirtyBefore: this.taskForm.dirty,
    });

    this.attachments.set(attachments);

    if (this.isEditMode()) {
      this.taskForm.markAsDirty();
      this.formDirty.set(true);
      console.log("✅ markAsDirty() called, dirtyAfter:", this.taskForm.dirty);
    }
  }

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

  onClose(): void {
    this.close.emit();
  }

  onOverlayClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.onClose();
    }
  }

  onSubmit(): void {
    if (this.isEditMode()) {
      const titleControl = this.taskForm.get("title");
      const dueDateControl = this.taskForm.get("dueDate");

      if (!titleControl?.value?.trim() || !dueDateControl?.value) {
        this.markFormAsTouched();
        this.toastService.showToast("Title and Due Date are required");
        return;
      }

      this.updateTask();
      return;
    }

    if (!this.isFormValid()) {
      this.markFormAsTouched();
      this.toastService.showToast("Please fill all required fields");
      return;
    }

    this.createTask();
  }

  private async createTask(): Promise<void> {
    const formValue = this.taskForm.value;
    const userId = this.authService.userId();

    if (!userId) {
      this.toastService.showToast("User not authenticated");
      return;
    }

    const additionalData = {
      userId,
      selectedCategory: this.selectedCategory(),
      selectedContactIds: this.selectedContactIds(),
      selectedPriority: this.selectedPriority().toString(),
      initialStatus: this.initialStatus(),
      subtasks: this.subtasks(),
      attachments: this.attachments(),
    };

    try {
      const newTask = await this.taskService.createTaskFromForm(
        formValue,
        additionalData,
      );
      this.toastService.showToast("Task created successfully");
      this.taskSaved.emit(newTask);

      if (this.isOverlay()) {
        this.close.emit();
      } else {
        this.router.navigate(["/board"]);
      }
    } catch (error: any) {
      this.toastService.showToast("Failed to create task");
      console.error("Error creating task:", error);
    }
  }

  private async updateTask(): Promise<void> {
    console.log("🔵 UpdateTask() called");

    const task = this.taskToEdit();
    if (!task) {
      console.error("❌ No task to edit found");
      return;
    }

    console.log("📋 Task to edit:", task.id, task.title);

    const formValue = this.taskForm.value;
    console.log("📝 Form values:", formValue);

    const additionalData = {
      selectedCategory: this.selectedCategory(),
      selectedContactIds: this.selectedContactIds(),
      selectedPriority: this.selectedPriority().toString(),
      subtasks: this.subtasks(),
      attachments: this.attachments(),
    };

    console.log("💾 Additional data:", {
      category: additionalData.selectedCategory,
      contacts: additionalData.selectedContactIds,
      priority: additionalData.selectedPriority,
      subtasksCount: additionalData.subtasks.length,
      attachmentsCount: additionalData.attachments.length,
    });

    try {
      console.log("⏳ Calling taskService.updateTaskFromForm...");
      const updatedTask = await this.taskService.updateTaskFromForm(
        task.id,
        formValue,
        additionalData,
      );
      console.log("✅ Task updated successfully:", updatedTask);

      this.toastService.showToast("Task updated successfully");
      this.taskSaved.emit(updatedTask);

      if (this.isOverlay()) {
        console.log("📤 Closing overlay");
        this.close.emit();
      } else {
        console.log("🔄 Navigating to board");
        this.router.navigate(["/board"]);
      }
    } catch (error: any) {
      console.error("❌ Error updating task:", error);
      this.toastService.showToast("Failed to update task");
    }
  }

  private markFormAsTouched(): void {
    Object.keys(this.taskForm.controls).forEach((key) => {
      this.taskForm.controls[key].markAsTouched();
    });
  }

  onViewAttachment(attachment: TaskAttachment): void {
    this.selectedAttachment.set(attachment);
  }

  onDeleteAttachment(attachment: TaskAttachment): void {
    this.attachments.update((atts) =>
      atts.filter((a) => a.id !== attachment.id),
    );
    this.toastService.showSuccess("Attachment removed");

    if (this.selectedAttachment()?.id === attachment.id) {
      this.selectedAttachment.set(null);
    }
  }

  onDeleteAllAttachments(): void {
    this.attachments.set([]);
    this.selectedAttachment.set(null);
    this.toastService.showSuccess("All attachments removed");
  }

  onCloseImageViewer(): void {
    this.selectedAttachment.set(null);
  }
}
