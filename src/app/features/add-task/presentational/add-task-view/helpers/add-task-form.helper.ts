import { Subtask } from "../../../components/subtask-management/subtask-management.component";
import { TaskAttachment } from "../../../../../core/models/task.interface";

/**
 * Formats a Date object to YYYY-MM-DD string for HTML date inputs.
 */
export function formatDateForInput(date: Date): string {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Builds the complete data object required for task creation.
 * Includes all form values and selected metadata.
 */
export function buildAdditionalData(
  userId: string,
  selectedCategory: string,
  selectedContactIds: string[],
  selectedPriority: string | number,
  initialStatus: "triage" | "todo" | "in-progress" | "await-feedback" | "done",
  subtasks: Subtask[],
  attachments: TaskAttachment[]
) {
  return {
    userId,
    selectedCategory,
    selectedContactIds,
    selectedPriority: selectedPriority.toString(),
    initialStatus,
    subtasks,
    attachments,
  };
}

/**
 * Builds the data object required for task updates.
 * @param selectedCategory - The currently selected category for the task
 * @param selectedContactIds - An array of selected contact IDs associated with the task
 * @param selectedPriority - The currently selected priority level for the task
 * @param subtasks - An array of subtasks associated with the task
 * @param attachments - An array of attachments associated with the task
 * @returns An object containing updated fields for the task, including selected metadata and form values.
 * @remarks This function is used to prepare the payload for updating an existing task with new values and metadata.
 */
export function buildUpdateData(
  selectedCategory: string,
  selectedContactIds: string[],
  selectedPriority: string | number,
  subtasks: Subtask[],
  attachments: TaskAttachment[]
) {
  return {
    selectedCategory,
    selectedContactIds,
    selectedPriority: selectedPriority.toString(),
    subtasks,
    attachments,
  };
}

/**
 * Marks all controls in a FormGroup as touched to trigger validation display.
 * @param formControls An object containing the form controls to be marked as touched.
 * @return void
 * @remarks This function iterates through each control in the provided form controls object and calls the `markAsTouched()` method on it. This is typically used to ensure that validation messages are displayed for all fields when a user attempts to submit a form without filling out required fields or correcting validation errors.
 */
export function markFormAsTouched(formControls: { [key: string]: any }): void {
  Object.keys(formControls).forEach((key) => {
    formControls[key].markAsTouched();
  });
}
