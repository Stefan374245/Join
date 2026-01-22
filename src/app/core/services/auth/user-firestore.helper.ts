import { Firestore, doc, setDoc, getDoc } from '@angular/fire/firestore';
import { User } from '@angular/fire/auth';
import { UserDocument } from '../../models/user.interface';
import { generateColorFromEmail } from './color-generator.helper';
import { splitDisplayName, generateInitials, getCurrentTimestamp } from './user-profile.helper';

/**
 * Saves user data to Firestore
 * @param firestore - Firestore instance
 * @param user - Firebase Auth user object
 * @param displayName - User's display name
 * @returns Promise that resolves when user data is saved
 */
export async function saveUserToFirestore(
  firestore: Firestore,
  user: User,
  displayName: string
): Promise<void> {
  const userDoc = doc(firestore, 'users', user.uid);
  const userData = buildUserDocument(user, displayName);
  await setDoc(userDoc, userData);
}

/**
 * Builds user document for Firestore
 * @param user - Firebase Auth user object
 * @param displayName - User's display name
 * @returns Complete user document object
 */
function buildUserDocument(user: User, displayName: string): UserDocument {
  const { firstName, lastName } = splitDisplayName(displayName);
  const color = generateColorFromEmail(user.email || '');
  const initials = generateInitials(displayName, user.email || undefined);
  const timestamp = getCurrentTimestamp();

  return {
    firstName,
    lastName,
    displayName,
    email: user.email || '',
    phone: '',
    color,
    initials,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

/**
 * Checks if user exists in Firestore
 * @param firestore - Firestore instance
 * @param userId - User ID to check
 * @returns Promise with boolean result
 */
export async function userExistsInFirestore(
  firestore: Firestore,
  userId: string
): Promise<boolean> {
  const userDoc = doc(firestore, 'users', userId);
  const userSnapshot = await getDoc(userDoc);
  return userSnapshot.exists();
}

/**
 * Ensures user exists in Firestore, creates document if not exists
 * @param firestore - Firestore instance
 * @param user - Firebase Auth user object
 * @returns Promise that resolves when check is complete
 */
export async function ensureUserInFirestore(
  firestore: Firestore,
  user: User
): Promise<void> {
  try {
    const exists = await userExistsInFirestore(firestore, user.uid);
    
    if (!exists) {
      const displayName = getDisplayNameOrFallback(user);
      await saveUserToFirestore(firestore, user, displayName);
    }
  } catch (error) {
    // Silent fail - user document creation is non-critical
  }
}

/**
 * Gets display name or fallback from user object
 * @param user - Firebase Auth user object
 * @returns Display name or email-based fallback
 */
function getDisplayNameOrFallback(user: User): string {
  return user.displayName || user.email?.split('@')[0] || 'User';
}
