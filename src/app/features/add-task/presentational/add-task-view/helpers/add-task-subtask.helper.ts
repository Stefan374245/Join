import { Subtask } from "../../../components/subtask-management/subtask-management.component";

/**
 * Creates a new subtask with a unique ID and trimmed title.
 * @param title - The title of the subtask to be created.
 * @returns A new Subtask object with a unique ID, the provided title, and a default completed status of false.
 * @remarks This function generates a unique ID for the subtask using the current timestamp and a random string. It also trims any whitespace from the provided title to ensure clean input. The returned Subtask object is ready to be added to a list of subtasks associated with a task.
 */
export function createSubtask(title: string): Subtask {
  return {
    id: generateSubtaskId(),
    title: title.trim(),
    completed: false,
  };
}

/**
 * Generates a unique ID for subtasks using timestamp and random string.
 * @returns A unique string ID for a subtask.
 * @remarks This function combines the current timestamp (converted to base 36) with a random string (also converted to base 36) to create a unique identifier for subtasks. This approach ensures that each subtask has a distinct ID, which is important for managing and updating subtasks within a task.
 */
export function generateSubtaskId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
}

/**
 * Updates the title of a specific subtask by ID.
 * @param subtasks - The array of subtasks to be updated.
 * @param id - The unique identifier of the subtask to be updated.
 * @param newTitle - The new title to be set for the specified subtask.
 * @return An updated array of subtasks with the specified subtask's title changed to the new title.
 * @remarks This function iterates through the array of subtasks and checks for a subtask with the matching ID. If a match is found, it creates a new subtask object with the updated title while keeping the other properties unchanged. The function returns a new array of subtasks with the updated subtask included.
 */
export function updateSubtaskTitle(
  subtasks: Subtask[],
  id: string,
  newTitle: string
): Subtask[] {
  return subtasks.map((t) =>
    t.id === id ? { ...t, title: newTitle } : t
  );
}

/**
 * Removes a subtask from the array by ID.
 * @param subtasks - The array of subtasks to be updated.
 * @param id - The unique identifier of the subtask to be removed.
 * @returns A new array of subtasks with the specified subtask removed.
 * @remarks This function iterates through the array of subtasks and filters out the subtask with the matching ID. The function returns a new array of subtasks without the removed subtask.
 */
export function removeSubtask(subtasks: Subtask[], id: string): Subtask[] {
  return subtasks.filter((t) => t.id !== id);
}
