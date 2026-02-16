import { Contact } from '../../models/contact.interface';
import { convertToDate } from './contact-timestamp.helper';

/**
 * Helper functions for contact data mapping
 */

/**
 * Extracts name parts from display name
 * @param displayName - Full display name
 * @returns Object with firstName and lastName
 */
export function extractNameParts(displayName: string): { firstName: string; lastName: string } {
  const nameParts = displayName.split(' ');
  const firstName = nameParts[0] || '';
  const lastName = nameParts.slice(1).join(' ') || '';
  return { firstName, lastName };
}

/**
 * Generates initials from full name or email
 * @param fullName - Full name string
 * @param email - Email as fallback
 * @returns Initials (max 2 characters uppercase)
 */
export function generateContactInitials(fullName: string, email: string): string {
  if (fullName) {
    return fullName
      .split(' ')
      .map((s: string) => s[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  }
  return email.substring(0, 2).toUpperCase();
}

/**
 * Builds full name from first and last name
 * @param firstName - First name
 * @param lastName - Last name
 * @returns Full name trimmed
 */
export function buildFullName(firstName: string, lastName: string): string {
  return `${firstName} ${lastName}`.trim();
}

function resolveContactNames(data: any): { firstName: string; lastName: string } {
  const firstName = data['firstName'] || '';
  const lastName = data['lastName'] || '';
  if (firstName || lastName || !data['displayName']) return { firstName, lastName };
  return extractNameParts(data['displayName']);
}

function mapContactMeta(data: any): Partial<Contact> {
  return {
    avatarUrl: data['avatarUrl'] || null,
    avatarPath: data['avatarPath'] || null,
    avatarUpdatedAt: data['avatarUpdatedAt'] ? convertToDate(data['avatarUpdatedAt']) : undefined,
    createdAt: data['createdAt'] ? convertToDate(data['createdAt']) : undefined,
    updatedAt: data['updatedAt'] ? convertToDate(data['updatedAt']) : undefined,
  };
}

/**
 * Maps Firestore document to Contact object
 * @param docId - Document ID
 * @param data - Firestore document data
 * @param colorGenerator - Function to generate color from email
 * @returns Contact object
 */
export function mapFirestoreToContact(
  docId: string,
  data: any,
  colorGenerator: (email: string) => string
): Contact {
  const email = data['email'] || '';
  const { firstName, lastName } = resolveContactNames(data);
  const fullName = buildFullName(firstName, lastName);
  return {
    id: docId,
    authUid: docId,
    firstName,
    lastName,
    email,
    phone: data['phone'] || '',
    color: data['color'] || colorGenerator(email),
    initials: data['initials'] || generateContactInitials(fullName, email),
    ...mapContactMeta(data),
  } as Contact;
}

/**
 * Sorts contacts by full name
 * @param contacts - Array of contacts to sort
 * @returns Sorted contacts array
 */
export function sortContactsByName(contacts: Contact[]): Contact[] {
  return [...contacts].sort((a, b) =>
    buildFullName(a.firstName, a.lastName).localeCompare(
      buildFullName(b.firstName, b.lastName),
      undefined,
      { sensitivity: 'base' }
    )
  );
}
