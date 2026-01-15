import { Injectable, inject, signal, computed } from '@angular/core';
import { Firestore, collection, getDocs, doc, setDoc, deleteDoc, query, where } from '@angular/fire/firestore';
import { Auth } from '@angular/fire/auth';
import { Observable, from, combineLatest } from 'rxjs';
import { map } from 'rxjs/operators';
import { toObservable } from '@angular/core/rxjs-interop';

import { Contact } from '../models/contact.interface';

/**
 * Signal-based contact management service with Firestore synchronization
 */
@Injectable({
  providedIn: 'root'
})
export class ContactService {
  private firestore = inject(Firestore);
  private auth = inject(Auth);

  private contactsSignal = signal<Contact[]>([]);
  
  private loadingSignal = signal<boolean>(false);
  
  private errorSignal = signal<string | null>(null);

  public readonly contacts = this.contactsSignal.asReadonly();
  public readonly loading = this.loadingSignal.asReadonly();
  public readonly error = this.errorSignal.asReadonly();

  public readonly sortedContacts = computed(() => 
    [...this.contacts()].sort((a, b) =>
      `${a.firstName} ${a.lastName}`.localeCompare(
        `${b.firstName} ${b.lastName}`,
        undefined,
        { sensitivity: 'base' }
      )
    )
  );

  public readonly contactCount = computed(() => this.contacts().length);

  public readonly contactsByInitial = computed(() => {
    const grouped = new Map<string, Contact[]>();
    this.sortedContacts().forEach(contact => {
      const initial = contact.firstName.charAt(0).toUpperCase();
      if (!grouped.has(initial)) {
        grouped.set(initial, []);
      }
      grouped.get(initial)!.push(contact);
    });
    return grouped;
  });

  constructor() {}

  /**
   * Loads all contacts from Firestore and updates signals
   * @returns Promise with all contacts
   */
  async loadContactsAsync(): Promise<Contact[]> {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    try {
      const usersCol = collection(this.firestore, 'users');
      const snapshot = await getDocs(usersCol);

      const result: Contact[] = snapshot.docs.map((doc) => {
        const data = doc.data();
        const email = data['email'] || '';

        let firstName = data['firstName'] || '';
        let lastName = data['lastName'] || '';

        if (!firstName && !lastName && data['displayName']) {
          const nameParts = data['displayName'].split(' ');
          firstName = nameParts[0] || '';
          lastName = nameParts.slice(1).join(' ') || '';
        }

        const fullName = `${firstName} ${lastName}`.trim();

        const initials = data['initials'] || (fullName
          ? fullName.split(' ').map((s: string) => s[0]).slice(0, 2).join('').toUpperCase()
          : email.substring(0, 2).toUpperCase());

        const color = data['color'] || this.generateColorFromEmail(email);

        return {
          id: doc.id,
          firstName: firstName,
          lastName: lastName,
          email: email,
          phone: data['phone'] || '',
          color: color,
          initials: initials
        } as Contact;
      });

      result.sort((a, b) =>
        (a.firstName + ' ' + a.lastName).localeCompare(
          b.firstName + ' ' + b.lastName,
          undefined,
          { sensitivity: 'base' }
        )
      );

      this.contactsSignal.set(result);
      this.loadingSignal.set(false);
      return result;
    } catch (err) {
      this.errorSignal.set('Failed to load contacts');
      this.loadingSignal.set(false);
      return [];
    }
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
   * Generates consistent color based on email address
   * @param email - The email address
   * @returns Hexadecimal color code
   */
  private generateColorFromEmail(email: string): string {
    const colors = [
      '#FF7A00', '#FF5EB3', '#6E52FF', '#9327FF', '#00BEE8',
      '#1FD7C1', '#FF745E', '#FFA35E', '#FC71FF', '#FFC701',
      '#0038FF', '#C3FF2B', '#FFE62B', '#FF4646', '#FFBB2B'
    ];

    const hash = email.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const colorIndex = hash % colors.length;
    return colors[colorIndex];
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
   * Saves new user to Firestore
   * @param userId - The unique user ID
   * @param userData - The user data
   * @returns Observable of the save operation
   */
  saveUser(userId: string, userData: { displayName: string; email: string; color?: string }): Observable<void> {
    const userDoc = doc(this.firestore, 'users', userId);
    const color = userData.color || this.generateColorFromEmail(userData.email);

    const promise = setDoc(userDoc, {
      displayName: userData.displayName,
      email: userData.email,
      color: color,
      createdAt: new Date().toISOString()
    });

    return from(promise);
  }

  /**
   * Saves contact to Firestore and updates local cache
   * @param contact - The contact to save
   * @returns Observable of the save operation
   */
  saveContact(contact: Contact): Observable<void> {
    const contactDoc = doc(this.firestore, 'users', contact.id);
    const color = contact.color || this.generateColorFromEmail(contact.email);

    const promise = setDoc(contactDoc, {
      firstName: contact.firstName,
      lastName: contact.lastName,
      displayName: `${contact.firstName} ${contact.lastName}`,
      email: contact.email,
      phone: contact.phone || '',
      color: color,
      initials: contact.initials,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }).then(() => {
      this.loadContactsAsync();
    });

    return from(promise);
  }

  /**
   * Updates existing user in Firestore and local cache
   * @param userId - The user ID
   * @param data - The data to update
   * @returns Observable of the update operation
   */
  updateUser(userId: string, data: Partial<Contact>): Observable<void> {
    const userDoc = doc(this.firestore, 'users', userId);
    const updateData: any = {
      ...data,
      updatedAt: new Date().toISOString()
    };

    if (data.firstName || data.lastName) {
      updateData.displayName = `${data.firstName || ''} ${data.lastName || ''}`.trim();
    }

    const promise = setDoc(userDoc, updateData, { merge: true }).then(() => {
      this.loadContactsAsync();
    });

    return from(promise);
  }

  /**
   * Deletes user from Firestore and removes from all tasks
   * @param userId - The ID of the user to delete
   * @returns Observable of the delete operation
   */
  deleteUser(userId: string): Observable<void> {
    const userDoc = doc(this.firestore, 'users', userId);
    
    const promise = (async () => {
      await this.removeUserFromAllTasks(userId);
      
      await deleteDoc(userDoc);
      
      await this.loadContactsAsync();
    })();
    
    return from(promise);
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
      .filter(doc => {
        const assignedTo = doc.data()['assignedTo'] || [];
        return Array.isArray(assignedTo) && assignedTo.includes(userId);
      })
      .map(doc => {
        const currentAssignedTo = doc.data()['assignedTo'] || [];
        const updatedAssignedTo = currentAssignedTo.filter((id: string) => id !== userId);
        
        const taskDoc = doc.ref;
        return setDoc(taskDoc, { assignedTo: updatedAssignedTo }, { merge: true });
      });
    
    await Promise.all(updatePromises);
  }
}
