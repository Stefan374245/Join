import { Firestore, collection, getDocs, doc, setDoc, deleteDoc, Timestamp, onSnapshot, QuerySnapshot, DocumentData } from '@angular/fire/firestore';
import { Injector, WritableSignal, runInInjectionContext } from '@angular/core';
import { Contact } from '../../models/contact.interface';
import { convertToTimestamp } from './contact-timestamp.helper';

/**
 * Helper functions for Firestore contact operations
 */

/**
 * Fetches all contacts from Firestore (for initial load)
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
    avatarUrl: contact.avatarUrl || null,
    avatarPath: contact.avatarPath || null,
    avatarUpdatedAt: contact.avatarUpdatedAt ? convertToTimestamp(contact.avatarUpdatedAt) : null,
    createdAt: contact.createdAt ? convertToTimestamp(contact.createdAt) : Timestamp.now(),
    updatedAt: Timestamp.now(),
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
  const updateData = buildContactUpdateData(data);
  await setDoc(userDoc, updateData, { merge: true });
}

/**
 * Builds update data with proper type conversion
 * @param data - Partial contact data
 * @returns Update data object
 */
function buildContactUpdateData(data: Partial<Contact>): any {
  const updateData: any = {
    updatedAt: Timestamp.now()
  };

  copySafeContactProperties(updateData, data);
  addDisplayNameIfNeeded(updateData, data);
  convertDatesToTimestamps(updateData, data);

  return updateData;
}

/**
 * Copies safe properties to update data
 * @param updateData - Target update data
 * @param data - Source contact data
 */
function copySafeContactProperties(updateData: any, data: Partial<Contact>): void {
  if (data.firstName !== undefined) updateData.firstName = data.firstName;
  if (data.lastName !== undefined) updateData.lastName = data.lastName;
  if (data.email !== undefined) updateData.email = data.email;
  if (data.phone !== undefined) updateData.phone = data.phone;
  if (data.color !== undefined) updateData.color = data.color;
  if (data.initials !== undefined) updateData.initials = data.initials;
  if (data.avatarUrl !== undefined) updateData.avatarUrl = data.avatarUrl;
  if (data.avatarPath !== undefined) updateData.avatarPath = data.avatarPath;
}

/**
 * Adds displayName if names changed
 * @param updateData - Target update data
 * @param data - Source contact data
 */
function addDisplayNameIfNeeded(updateData: any, data: Partial<Contact>): void {
  if (data.firstName || data.lastName) {
    updateData.displayName = `${data.firstName || ''} ${data.lastName || ''}`.trim();
  }
}

/**
 * Converts Date objects to Timestamps
 * @param updateData - Target update data
 * @param data - Source contact data
 */
function convertDatesToTimestamps(updateData: any, data: Partial<Contact>): void {
  if (data.createdAt) {
    updateData.createdAt = convertToTimestamp(data.createdAt);
  }

  if (data.avatarUpdatedAt) {
    updateData.avatarUpdatedAt = convertToTimestamp(data.avatarUpdatedAt);
  }
}

/**
 * Sets up real-time listener for contacts collection
 * @param firestore - Firestore instance
 * @param injector - Angular injector
 * @param contactsSignal - Writable signal for contacts
 * @param loadingSignal - Writable signal for loading state
 * @param errorSignal - Writable signal for errors
 * @param mapperFn - Function to map Firestore data to Contact
 * @param sorterFn - Function to sort contacts
 * @returns Unsubscribe function
 * @remarks Initializes a real-time listener on the 'users' collection in Firestore. Updates the provided signals for contacts, loading state, and errors based on snapshot updates or errors. Returns a function to unsubscribe from the listener when it's no longer needed. Handles initialization errors gracefully by setting error and loading states accordingly.
 */
export function setupContactsListener(
  firestore: Firestore,
  injector: Injector,
  contactsSignal: WritableSignal<Contact[]>,
  loadingSignal: WritableSignal<boolean>,
  errorSignal: WritableSignal<string | null>,
  mapperFn: (docId: string, data: any) => Contact,
  sorterFn: (contacts: Contact[]) => Contact[]
): () => void {
  try {
    return runInInjectionContext(injector, () => {
      const usersCol = collection(firestore, 'users');
      return createContactsSnapshot(usersCol, contactsSignal, loadingSignal, errorSignal, mapperFn, sorterFn);
    });
  } catch (error) {
    handleListenerError(error, errorSignal, loadingSignal, contactsSignal);
    return () => {};
  }
}

/**
 * Creates real-time listener for contacts collection
 * Listens to Firestore changes and updates signals automatically
 * @returns Unsubscribe function to stop listening
 * @remarks Uses onSnapshot to listen for real-time updates and updates contacts, loading, and error signals accordingly. Handles errors gracefully and ensures proper cleanup with unsubscribe function.
 */
function createContactsSnapshot(
  usersCol: any,
  contactsSignal: WritableSignal<Contact[]>,
  loadingSignal: WritableSignal<boolean>,
  errorSignal: WritableSignal<string | null>,
  mapperFn: (docId: string, data: any) => Contact,
  sorterFn: (contacts: Contact[]) => Contact[]
): () => void {

  return onSnapshot(
    usersCol,
    
    (snapshot: QuerySnapshot<DocumentData>) => {
      handleContactsSnapshot(snapshot, contactsSignal, loadingSignal, errorSignal, mapperFn, sorterFn);
    },
    
    (error: Error) => {
      handleSnapshotError(error, errorSignal, loadingSignal, contactsSignal);
    }
  );
}

/**
 * Handles successful snapshot update
 * Updates contacts signal with mapped and sorted contacts, sets loading to false, and clears any previous errors
 * @param snapshot - Firestore query snapshot
 * @param contactsSignal - Writable signal for contacts
 * @param loadingSignal - Writable signal for loading state
 * @param errorSignal - Writable signal for errors
 * @param mapperFn - Function to map Firestore data to Contact
 * @param sorterFn - Function to sort contacts
 * @remarks Maps Firestore documents to Contact objects using the provided mapper function, sorts them with the sorter function, and updates the contacts signal. Also manages loading and error states appropriately.
 */
function handleContactsSnapshot(
  snapshot: QuerySnapshot<DocumentData>,
  contactsSignal: WritableSignal<Contact[]>,
  loadingSignal: WritableSignal<boolean>,
  errorSignal: WritableSignal<string | null>,
  mapperFn: (docId: string, data: any) => Contact,
  sorterFn: (contacts: Contact[]) => Contact[]
): void {
  const contacts = snapshot.docs.map((doc: any) => mapperFn(doc.id, doc.data()));
  const sortedContacts = sorterFn(contacts);

  contactsSignal.set(sortedContacts);
  loadingSignal.set(false);
  errorSignal.set(null);
}

/**
 * Handles snapshot error
 */
function handleSnapshotError(
  error: Error,
  errorSignal: WritableSignal<string | null>,
  loadingSignal: WritableSignal<boolean>,
  contactsSignal: WritableSignal<Contact[]>
): void {
  console.error('❌ ContactService: Listener error:', error);
  errorSignal.set('Failed to load contacts');
  loadingSignal.set(false);
  contactsSignal.set([]);
}

/**
 * Handles listener initialization error
 */
function handleListenerError(
  error: unknown,
  errorSignal: WritableSignal<string | null>,
  loadingSignal: WritableSignal<boolean>,
  contactsSignal: WritableSignal<Contact[]>
): void {
  console.error('❌ ContactService: Failed to initialize listener:', error);
  errorSignal.set('Failed to initialize contacts listener');
  loadingSignal.set(false);
  contactsSignal.set([]);
}
