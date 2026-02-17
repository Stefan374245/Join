import { UserCredential } from '@angular/fire/auth';

/**
 * Guest user credentials
 */
export const GUEST_CREDENTIALS = {
  email: 'guest@join.com',
  password: 'GuestJoin2024!',
  displayName: 'Guest User',
} as const;

/**
 * Checks if error is user not found
 * @param error - Error object from Firebase Auth
 * @returns True if user not found
 */
export function isUserNotFoundError(error: any): boolean {
  return (
    error.code === 'auth/user-not-found' ||
    error.code === 'auth/invalid-credential'
  );
}

/**
 * Checks if error is email already in use
 * @param error - Error object from Firebase Auth
 * @returns True if email already in use
 */
export function isEmailInUseError(error: any): boolean {
  return error.code === 'auth/email-already-in-use';
}

/**
 * Logs guest account creation
 */
export function logGuestCreation(): void {
}

/**
 * Logs successful guest creation
 */
export function logGuestSuccess(): void {
}

/**
 * Logs guest account error
 */
export function logGuestError(): void {
  console.error(
    '❌ Guest account exists but wrong password. Please check credentials.'
  );
}
