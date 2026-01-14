import { Injectable, inject, signal, computed } from '@angular/core';
import { Firestore, collection, getDocs, doc, setDoc, deleteDoc, query, where } from '@angular/fire/firestore';
import { Auth } from '@angular/fire/auth';
import { Observable, from, combineLatest } from 'rxjs';
import { map } from 'rxjs/operators';
import { toObservable } from '@angular/core/rxjs-interop';

import { Contact } from '../models/contact.interface';

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
   * Lädt alle Kontakte aus Firestore (Async mit Signal-Update)
   * Sortiert die Kontakte alphabetisch nach Namen
   * @returns {Promise<Contact[]>} Promise mit allen Kontakten
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
   * Lädt alle Kontakte aus Firestore (Legacy Observable-Methode)
   * @returns {Observable<Contact[]>} Observable mit allen Kontakten
   * @deprecated Use loadContactsAsync() or contacts signal instead
   */
  loadAll(): Observable<Contact[]> {
    return from(this.loadContactsAsync());
  }

  /**
   * Gibt alle Kontakte zurück (Legacy Observable-Methode)
   * @returns {Observable<Contact[]>} Observable mit allen Kontakten
   * @deprecated Use loadContactsAsync() or contacts signal instead
   */
  getContacts(): Observable<Contact[]> {
    return from(this.loadContactsAsync());
  }

  /**
   * Signal-basierte Suche nach Kontakt per E-Mail
   * @param {string} email - Die zu suchende E-Mail-Adresse
   * @returns {Contact | undefined} Der Kontakt oder undefined
   */
  findContactByEmail(email: string): Contact | undefined {
    return this.contacts().find(c => c.email === email);
  }

  /**
   * Signal-basierte Suche nach Kontakt per ID
   * @param {string} id - Die zu suchende ID
   * @returns {Contact | undefined} Der Kontakt oder undefined
   */
  findContactById(id: string): Contact | undefined {
    return this.contacts().find(c => c.id === id);
  }

  /**
   * Signal-basierte Suche mit Suchbegriff
   * @param {string} searchTerm - Der Suchbegriff
   * @returns {Contact[]} Gefilterte Kontakte
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
   * Generiert eine konsistente Farbe basierend auf der E-Mail-Adresse
   * @private
   * @param {string} email - Die E-Mail-Adresse
   * @returns {string} Hexadezimaler Farbcode
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
   * Sucht einen Kontakt anhand der E-Mail-Adresse
   * @param {string} email - Die zu suchende E-Mail-Adresse
   * @returns {Observable<Contact | null>} Observable mit dem Kontakt oder null
   */
  getByEmail(email: string): Observable<Contact | null> {
    return this.loadAll().pipe(
      map(list => list.find(c => c.email === email) ?? null)
    );
  }

  /**
   * Speichert einen neuen Benutzer in Firestore
   * @param {string} userId - Die eindeutige Benutzer-ID
   * @param {Object} userData - Die Benutzerdaten
   * @param {string} userData.displayName - Anzeigename des Benutzers
   * @param {string} userData.email - E-Mail-Adresse des Benutzers
   * @param {string} [userData.color] - Optionale Farbe für den Avatar
   * @returns {Observable<void>} Observable des Speichervorgangs
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
   * Speichert einen Kontakt in Firestore und aktualisiert den lokalen Cache
   * Erstellt oder aktualisiert ein vollständiges Kontaktdokument
   * @param {Contact} contact - Der zu speichernde Kontakt
   * @returns {Observable<void>} Observable des Speichervorgangs
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
   * Aktualisiert einen bestehenden Benutzer in Firestore und den lokalen Cache
   * Aktualisiert automatisch den displayName wenn firstName oder lastName geändert werden
   * @param {string} userId - Die Benutzer-ID
   * @param {Partial<Contact>} data - Die zu aktualisierenden Daten
   * @returns {Observable<void>} Observable des Aktualisierungsvorgangs
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
   * Löscht einen Benutzer aus Firestore, entfernt ihn aus allen Tasks und aktualisiert den Cache
   * @param {string} userId - Die ID des zu löschenden Benutzers
   * @returns {Observable<void>} Observable des Löschvorgangs
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
   * Entfernt einen User aus dem assignedTo Array aller Tasks
   * @private
   * @param {string} userId - Die ID des zu entfernenden Users
   * @returns {Promise<void>}
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
