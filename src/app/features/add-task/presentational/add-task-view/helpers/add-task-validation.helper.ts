import { FormGroup } from "@angular/forms";

/**
 * Validates all required task form fields.
 * Checks title (min 3 chars), due date, and category.
 */
export function checkFormValidity(
  form: FormGroup | null,
  selectedCategory: string
): boolean {
  if (!form) {
    return false;
  }
  const titleControl = form.get("title");
  const dueDateControl = form.get("dueDate");
  const titleValid = titleControl?.valid && titleControl?.value?.trim()?.length >= 3;
  const dueDateValid = dueDateControl?.valid && dueDateControl?.value;
  const categoryValid = selectedCategory !== "";
  return titleValid && dueDateValid && categoryValid;
}

/**
 * Validates the form in edit mode.
 * Ensures required fields have values.
 */
export function isEditFormValid(
  form: FormGroup,
  selectedCategory: string
): boolean {
  const titleControl = form.get("title");
  const dueDateControl = form.get("dueDate");
  const categoryValid = selectedCategory !== "";
  return (
    !!titleControl?.value?.trim() &&
    !!dueDateControl?.value &&
    categoryValid
  );
}

/**
 * Retrieves the category FormControl from the form.
 */
export function getCategoryControl(form: FormGroup) {
  return form.get("category");
}

/**
 * Checks if the category field has a validation error.
 * Returns true if touched and invalid.
 */
export function hasCategoryError(form: FormGroup | null): boolean {
  if (!form) return false;
  const categoryControl = form.get("category");
  return !!categoryControl && categoryControl.touched && categoryControl.invalid;
}
