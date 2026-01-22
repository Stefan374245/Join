import { Injectable, inject, signal, computed, Injector, runInInjectionContext } from '@angular/core';
import { Firestore, collection, getDocs, doc, setDoc, deleteDoc } from '@angular/fire/firestore';
import { Auth } from '@angular/fire/auth';
import { Observable, from } from 'rxjs';
import { map } from 'rxjs/operators';
import { Contact } from '../models/contact.interface';
import { generateColorFromEmail } from './auth/color-generator.helper';
import { fetchContactsFromFirestore, saveContactToFirestore, updateContactInFirestore } from './contacts/contact-firestore.helper';
import { mapFirestoreToContact, sortContactsByName, buildFullName } from './contacts/contact-mapper.helper';
import { groupContactsByInitial } from './contacts/contact-grouping.helper';

/**
 * Signal-based contact management service with Firestore synchronization
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

  constructor() {
    this.loadContactsAsync().catch(error => {
      console.warn('❌ ContactService: Initial contact loading failed:', error);
    });
  }

  /**
   * Loads all contacts from Firestore and updates signals
   * @returns Promise with all contacts
   */
  async loadContactsAsync(): Promise<Contact[]> {
    this.setLoadingState(true);

    try {
      const contacts = await this.fetchAndMapContacts();
      this.updateContactsSignal(contacts);
      return contacts;
    } catch (err) {
      this.handleLoadError(err);
      return [];
    }
  }

  /**
   * Sets loading state
   * @param loading - Loading state
   */
  private setLoadingState(loading: boolean): void {
    this.loadingSignal.set(loading);
    if (loading) {
      this.errorSignal.set(null);
    }
  }

  /**
   * Fetches and maps contacts from Firestore
   * @returns Promise with mapped contacts
   */
  private async fetchAndMapContacts(): Promise<Contact[]> {
    const snapshot = await runInInjectionContext(this.injector, async () => {
      return await fetchContactsFromFirestore(this.firestore);
    });

    const contacts = snapshot.docs.map(doc => 
      mapFirestoreToContact(doc.id, doc.data(), generateColorFromEmail)
    );

    return sortContactsByName(contacts);
  }

  /**
   * Updates contacts signal with new data
   * @param contacts - Array of contacts
   */
  private updateContactsSignal(contacts: Contact[]): void {
    this.contactsSignal.set(contacts);
    this.loadingSignal.set(false);
  }

  /**
   * Handles load error
   * @param err - Error object
   */
  private handleLoadError(err: any): void {
    console.error('❌ ContactService: Error loading contacts:', err);
    this.errorSignal.set('Failed to load contacts');
    this.loadingSignal.set(false);
  }

  /**
   * Loads all contacts using Observable
   * @returns Observable with all contacts
   * @deprecated Use loadContactsAsync() or contacts signal instead
   */
  loadAll(): Observable<Contact[]> {
    return from(this.loadContactsAsync());
  }

  /**
   * Returns all contacts using Observable
   * @returns Observable with all contacts
   * @deprecated Use loadContactsAsync() or contacts signal instead
   */
  getContacts(): Observable<Contact[]> {
    return from(this.loadContactsAsync());
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
   * Finds contact by email using Observable
   * @param email - The email address to search for
   * @returns Observable with contact or null
   */
  getByEmail(email: string): Observable<Contact | null> {
    return this.loadAll().pipe(
      map(list => list.find(c => c.email === email) ?? null)
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
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await setDoc(userDoc, contactData);
    // Refresh contacts after save
    await this.loadContactsAsync();
  }

  /**
   * Saves new user to Firestore
   * @param userId - The unique user ID
   * @param userData - The user data
   * @returns Observable of the save operation
   */
  saveUser(userId: string, userData: { displayName: string; email: string; color?: string }): Observable<void> {
    const userDoc = doc(this.firestore, 'users', userId);
    const color = userData.color || generateColorFromEmail(userData.email);

    const promise = setDoc(userDoc, {
      displayName: userData.displayName,
      email: userData.email,
      color: color,
      createdAt: new Date().toISOString()
    });

    return from(promise);
  }

  /**
   * Updates existing user in Firestore and local cache
   * @param userId - The user ID
   * @param data - The data to update
   * @returns Promise of the update operation
   */
  async updateUser(userId: string, data: Partial<Contact>): Promise<void> {
    await updateContactInFirestore(this.firestore, userId, this.buildUpdateData(data));
    await this.loadContactsAsync();
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
    await this.loadContactsAsync();
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
