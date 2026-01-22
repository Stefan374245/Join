import { Injectable, inject, signal, computed, Injector, runInInjectionContext, effect } from '@angular/core';
import { Firestore, collection, getDocs, doc, setDoc, deleteDoc, Timestamp } from '@angular/fire/firestore';
import { Auth, authState } from '@angular/fire/auth';
import { toSignal } from '@angular/core/rxjs-interop';
import { Contact } from '../models/contact.interface';
import { generateColorFromEmail } from './auth/color-generator.helper';
import { fetchContactsFromFirestore, saveContactToFirestore, updateContactInFirestore, setupContactsListener } from './contacts/contact-firestore.helper';
import { mapFirestoreToContact, sortContactsByName, buildFullName } from './contacts/contact-mapper.helper';
import { groupContactsByInitial } from './contacts/contact-grouping.helper';

/**
 * Signal-based contact management service with real-time Firestore synchronization
 * Follows same pattern as TaskService for consistency
 */
@Injectable({
  providedIn: 'root'
})
export class ContactService {
  private firestore = inject(Firestore);
  private auth = inject(Auth);
  private injector = inject(Injector);
  private contactsSignal = signal<Contact[]>([]);
  private loadingSignal = signal<boolean>(false);
  private errorSignal = signal<string | null>(null);

  public readonly contacts = this.contactsSignal.asReadonly();
  public readonly loading = this.loadingSignal.asReadonly();
  public readonly error = this.errorSignal.asReadonly();

  public readonly sortedContacts = computed(() => 
    sortContactsByName(this.contacts())
  );

  public readonly contactCount = computed(() => this.contacts().length);

  public readonly contactsByInitial = computed(() => 
    groupContactsByInitial(this.sortedContacts())
  );

  private unsubscribe: (() => void) | null = null;

  constructor() {
    const authStateSignal = toSignal(authState(this.auth), { initialValue: null });
    
    effect(() => {
      const user = authStateSignal();
      if (user) {
        this.initializeContactsListener();
      } else {
        if (this.unsubscribe) {
          this.unsubscribe();
          this.unsubscribe = null;
        }
        this.contactsSignal.set([]);
      }
    });
  }

  /**
   * Initializes real-time Firestore listener for contact updates
   */
  private initializeContactsListener(): void {
    if (this.unsubscribe) {
      this.unsubscribe();
    }

    this.loadingSignal.set(true);

    this.unsubscribe = setupContactsListener(
      this.firestore,
      this.injector,
      this.contactsSignal,
      this.loadingSignal,
      this.errorSignal,
      (docId, data) => mapFirestoreToContact(docId, data, generateColorFromEmail),
      sortContactsByName
    );
  }

  /**
   * Finds contact by ID or authUid
   * @param idOrAuthUid - Contact ID or Firebase Auth UID
   * @returns Contact if found, undefined otherwise
   */
  findContactByIdOrAuthUid(idOrAuthUid: string): Contact | undefined {
    const contacts = this.contacts();
    // First try exact ID match
    let contact = contacts.find(c => c.id === idOrAuthUid);
    // If not found, try authUid match
    if (!contact) {
      contact = contacts.find(c => c.authUid === idOrAuthUid);
    }
    return contact;
  }

  /**
   * Finds contact by email using signals
   * @param email - The email address to search for
   * @returns Contact or undefined
   */
  findContactByEmail(email: string): Contact | undefined {
    return this.contacts().find(c => c.email === email);
  }

  /**
   * Finds contact by ID using signals
   * @param id - The ID to search for
   * @returns Contact or undefined
   */
  findContactById(id: string): Contact | undefined {
    return this.contacts().find(c => c.id === id);
  }

  /**
   * Searches contacts by search term using signals
   * @param searchTerm - The search term
   * @returns Filtered contacts
   */
  searchContacts(searchTerm: string): Contact[] {
    const term = searchTerm.toLowerCase();
    return this.contacts().filter(contact =>
      `${contact.firstName} ${contact.lastName} ${contact.email}`
        .toLowerCase()
        .includes(term)
    );
  }

  /**
   * Saves new contact to Firestore
   * @param contact - The contact to save
   * @returns Promise of the save operation
   */
  async saveContact(contact: Contact): Promise<void> {
    const userDoc = doc(this.firestore, 'users', contact.id);

    const contactData = {
      firstName: contact.firstName,
      lastName: contact.lastName,
      displayName: `${contact.firstName} ${contact.lastName}`.trim(),
      email: contact.email,
      phone: contact.phone || '',
      color: contact.color,
      initials: contact.initials,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    };

    await setDoc(userDoc, contactData);
    // Real-time listener will update automatically
  }

  /**
   * Saves new user to Firestore
   * @param userId - The unique user ID
   * @param userData - The user data
   * @returns Promise of the save operation
   */
  async saveUser(userId: string, userData: { displayName: string; email: string; color?: string }): Promise<void> {
    const userDoc = doc(this.firestore, 'users', userId);
    const color = userData.color || generateColorFromEmail(userData.email);

    await setDoc(userDoc, {
      displayName: userData.displayName,
      email: userData.email,
      color: color,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    });
    // Real-time listener will update automatically
  }

  /**
   * Updates existing user in Firestore
   * @param userId - The user ID
   * @param data - The data to update
   * @returns Promise of the update operation
   */
  async updateUser(userId: string, data: Partial<Contact>): Promise<void> {
    await updateContactInFirestore(this.firestore, userId, this.buildUpdateData(data));
    // Real-time listener will update automatically
  }

  /**
   * Builds update data with displayName if names changed
   * @param data - Partial contact data
   * @returns Update data object
   */
  private buildUpdateData(data: Partial<Contact>): any {
    const updateData: any = { ...data };

    if (data.firstName || data.lastName) {
      updateData.displayName = buildFullName(
        data.firstName || '',
        data.lastName || ''
      );
    }

    return updateData;
  }

  /**
   * Deletes user from Firestore and removes from all tasks
   * @param userId - The ID of the user to delete
   * @returns Promise of the delete operation
   */
  async deleteUser(userId: string): Promise<void> {
    const userDoc = doc(this.firestore, 'users', userId);
    
    await this.removeUserFromAllTasks(userId);
    await deleteDoc(userDoc);
    // Real-time listener will update automatically
  }

  /**
   * Removes user from assignedTo array of all tasks
   * @param userId - The ID of the user to remove
   * @returns Promise
   */
  private async removeUserFromAllTasks(userId: string): Promise<void> {
    const tasksCol = collection(this.firestore, 'tasks');
    const snapshot = await getDocs(tasksCol);
    
    const updatePromises = snapshot.docs
      .filter((doc: any) => {
        const assignedTo = doc.data()['assignedTo'] || [];
        return Array.isArray(assignedTo) && assignedTo.includes(userId);
      })
      .map((doc: any) => {
        const currentAssignedTo = doc.data()['assignedTo'] || [];
        const updatedAssignedTo = currentAssignedTo.filter((id: string) => id !== userId);
        
        const taskDoc = doc.ref;
        return setDoc(taskDoc, { assignedTo: updatedAssignedTo }, { merge: true });
      });
    
    await Promise.all(updatePromises);
  }
}
