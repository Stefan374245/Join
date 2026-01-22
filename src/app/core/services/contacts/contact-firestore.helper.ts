import { Firestore, collection, getDocs, doc, setDoc, deleteDoc } from '@angular/fire/firestore';
import { Contact } from '../../models/contact.interface';

/**
 * Helper functions for Firestore contact operations
 */

/**
 * Fetches all contacts from Firestore
 * @param firestore - Firestore instance
 * @returns Promise with query snapshot
 */
export async function fetchContactsFromFirestore(firestore: Firestore) {
  const usersCol = collection(firestore, 'users');
  return await getDocs(usersCol);
}

/**
 * Saves contact to Firestore
 * @param firestore - Firestore instance
 * @param contact - Contact to save
 */
export async function saveContactToFirestore(
  firestore: Firestore,
  contact: Contact
): Promise<void> {
  const contactDoc = doc(firestore, 'users', contact.id);
  const contactData = buildContactDocument(contact);
  await setDoc(contactDoc, contactData);
}

/**
 * Builds Firestore document from contact
 * @param contact - Contact object
 * @returns Firestore document data
 */
function buildContactDocument(contact: Contact): any {
  return {
    firstName: contact.firstName,
    lastName: contact.lastName,
    displayName: `${contact.firstName} ${contact.lastName}`.trim(),
    email: contact.email,
    phone: contact.phone || '',
    color: contact.color,
    initials: contact.initials,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Deletes contact from Firestore
 * @param firestore - Firestore instance
 * @param contactId - Contact ID to delete
 */
export async function deleteContactFromFirestore(
  firestore: Firestore,
  contactId: string
): Promise<void> {
  const contactDoc = doc(firestore, 'users', contactId);
  await deleteDoc(contactDoc);
}

/**
 * Updates contact in Firestore
 * @param firestore - Firestore instance
 * @param userId - User ID to update
 * @param data - Partial contact data
 */
export async function updateContactInFirestore(
  firestore: Firestore,
  userId: string,
  data: Partial<Contact>
): Promise<void> {
  const userDoc = doc(firestore, 'users', userId);
  const updateData = {
    ...data,
    updatedAt: new Date().toISOString(),
  };
  await setDoc(userDoc, updateData, { merge: true });
}
