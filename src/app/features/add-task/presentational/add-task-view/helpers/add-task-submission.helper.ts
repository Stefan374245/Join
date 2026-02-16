import { TaskService } from "../../../../../core/services/task.service";
import { ToastService } from "../../../../../core/services/toast.service";
import { Router } from "@angular/router";
import { Task } from "../../../../../core/models/task.interface";
import { TASK_MESSAGES } from "../../../../../shared/constants";

export interface TaskSubmissionContext {
  taskService: TaskService;
  toastService: ToastService;
  router: Router;
  isOverlay: boolean;
}

/**
 * Creates a new task using form data and additional metadata.
 * @param formValue - The values from the task form.
 * @param additionalData - Additional metadata such as selected category, contacts, priority, subtasks, and attachments.
 * @param context - An object containing necessary services and state for task submission. 
 * @param callbacks - An object containing success and optional error callback functions to handle post-submission actions.
 * @returns The created Task object on success, or null on failure.
 * @remarks This function handles the entire flow of creating a task, including calling the task service, showing toasts for success or error, and navigating after creation. It abstracts away the details of task creation and allows the caller to simply provide form data and handle the result through callbacks.
 */
export async function createTaskFromFormData(
  formValue: any,
  additionalData: any,
  context: TaskSubmissionContext,
  callbacks: {
    onSuccess: (task: Task) => void;
    onError?: (error: any) => void;
  }
): Promise<Task | null> {
  try {
    const newTask = await context.taskService.createTaskFromForm(
      formValue,
      additionalData
    );
    context.toastService.showToast(TASK_MESSAGES.CREATE_SUCCESS);
    callbacks.onSuccess(newTask);
    handlePostCreate(context);
    return newTask;
  } catch (error: any) {
    context.toastService.showToast(TASK_MESSAGES.CREATE_ERROR);
    console.error("Error creating task:", error);
    if (callbacks.onError) {
      callbacks.onError(error);
    }
    return null;
  }
}

/**
 * Updates an existing task with form data and additional metadata.
 * @param taskId - The ID of the task to update.
 * @param formValue - The values from the task form.
 * @param additionalData - Additional metadata such as selected category, contacts, priority, subtasks, and attachments.
 * @param context - An object containing necessary services and state for task submission.
 * @param callbacks - An object containing success and optional error callback functions to handle post-submission actions.
 * @returns The updated Task object on success, or null on failure.
 * @remarks This function handles the entire flow of updating a task, including calling the task service, showing toasts for success or error, and navigating after update. It abstracts away the details of task updating and allows the caller to simply provide form data and handle the result through callbacks.   
 */
export async function updateTaskFromFormData(
  taskId: string,
  formValue: any,
  additionalData: any,
  context: TaskSubmissionContext,
  callbacks: {
    onSuccess: (task: Task) => void;
    onError?: (error: any) => void;
  }
): Promise<Task | null> {
  try {
    const updatedTask = await context.taskService.updateTaskFromForm(
      taskId,
      formValue,
      additionalData
    );
    context.toastService.showToast(TASK_MESSAGES.UPDATE_SUCCESS);
    callbacks.onSuccess(updatedTask);
    handlePostUpdate(context);
    return updatedTask;
  } catch (error: any) {
    context.toastService.showToast(TASK_MESSAGES.UPDATE_ERROR);
    console.error("❌ Error updating task:", error);
    if (callbacks.onError) {
      callbacks.onError(error);
    }
    return null;
  }
}

/**
 * Navigates to board after task creation if not in overlay mode.
 * @param context - An object containing necessary services and state for task submission. 
 * @remarks This function checks if the current context is in overlay mode. If it is not, it uses the router service to navigate to the "/board" route after a task is created. This allows for different navigation behavior based on whether the task creation is happening within an overlay or as a standalone page. 
 */
function handlePostCreate(context: TaskSubmissionContext): void {
  if (context.isOverlay) {
    return;
  }
  context.router.navigate(["/board"]);
}

/**
 * Navigates to board after task update if not in overlay mode.
 * @param context - An object containing necessary services and state for task submission. 
 * @remarks This function checks if the current context is in overlay mode. If it is not, it uses the router service to navigate to the "/board" route after a task is updated. This allows for different navigation behavior based on whether the task updating is happening within an overlay or as a standalone page. 
 */
function handlePostUpdate(context: TaskSubmissionContext): void {
  if (context.isOverlay) {
    return;
  }
  context.router.navigate(["/board"]);
}
