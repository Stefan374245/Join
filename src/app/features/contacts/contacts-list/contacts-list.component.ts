import { Component, OnInit, inject, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { ContactService } from '../../../core/services/contact.service';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { Contact } from '../../../core/models/contact.interface';
import { Observable, BehaviorSubject } from 'rxjs';
import { ContactDialogComponent } from '../contact-dialog/contact-dialog.component';

/**
 * Grouped contacts by alphabetical letter
 */
type Grouped = { letter: string; items: Contact[] }[];

/**
 * Contacts list view with search, selection and CRUD operations
 */
@Component({
  selector: 'app-contacts-list',
  standalone: true,
  imports: [CommonModule, RouterLink, ContactDialogComponent],
  templateUrl: './contacts-list.component.html',
  styleUrl: './contacts-list.component.scss'
})
export class ContactsListComponent implements OnInit {
  private contactService = inject(ContactService);
  private authService = inject(AuthService);
  private toastService = inject(ToastService);
  private router = inject(Router);

  contacts$ = new BehaviorSubject<Contact[]>([]);
  grouped$ = new BehaviorSubject<Grouped>([]);
  isGuest$ = this.authService.isGuestUser$();

  selected: Contact | null = null;
  showRight = true;
  isMobile = false;

  showDialog = false;
  dialogMode: 'add' | 'edit' = 'add';
  dialogContact: Contact | null = null;

  showDeleteConfirm = false;
  contactToDelete: Contact | null = null;

  /**
   * Component initialization - loads contacts and sets up responsive behavior
   */
  ngOnInit(): void {
    this.load();
    // this.checkAutoSelect(); // Deaktiviert: Kein Auto-Select beim Laden
    this.onResize();
  }

  /**
   * Loads all contacts from service and groups them alphabetically
   */
  async load() {
    console.log('🔄 Starting to load contacts...');
    this.contactService.loadAll().subscribe({
      next: (list) => {
        console.log('✅ Contacts loaded:', list.length, 'contacts', list);
        this.contacts$.next(list);
        this.group(list);

        console.log('📊 Contacts$ value:', this.contacts$.value);
        console.log('📊 Grouped$ value:', this.grouped$.value);
      },
      error: (err) => {
        console.error('❌ Error loading contacts:', err);
        console.error('❌ Error details:', err.message, err.code);
      }
    });
  }

  /**
   * Groups contacts by first letter of name
   * @param list - Array of contacts to group
   */
  private group(list: Contact[]) {
    const groupedRecord: Record<string, Contact[]> = {};
    list.forEach(u => {
      const name = `${u.firstName} ${u.lastName}`.trim();
      const letter = (name[0] || '#').toUpperCase();
      (groupedRecord[letter] ||= []).push(u);
    });

    const grouped: Grouped = Object.keys(groupedRecord).sort().map(l => ({ letter: l, items: groupedRecord[l] }));
    console.log('📋 Grouped contacts:', grouped);
    this.grouped$.next(grouped);
  }

  /**
   * Selects a contact and updates localStorage
   * @param contact - Contact to select
   * @param event - Optional click event
   */
  select(contact: Contact, event?: Event) {
    if (window.innerWidth >= 900) {
      if (event) {
        event.preventDefault();
      }
    }
    this.selected = contact;
    localStorage.setItem('selectedContactEmail', contact.email);
    localStorage.setItem('lastEditedContact', contact.email);
  }

  /**
   * Opens dialog to add new contact (blocked for guest users)
   */
  addContact() {
    if (this.authService.isGuestUser()) {
      this.toastService.showGuestCannotAddContacts();
      return;
    }
    this.dialogMode = 'add';
    this.dialogContact = null;
    this.showDialog = true;
  }

  /**
   * Opens dialog to edit existing contact (blocked for guest users)
   * @param contact - Contact to edit
   */
  editContact(contact: Contact) {
    if (this.authService.isGuestUser()) {
      this.toastService.showGuestCannotAddContacts();
      return;
    }
    this.dialogMode = 'edit';
    this.dialogContact = contact;
    this.showDialog = true;
  }

  /**
   * Closes contact dialog and resets state
   */
  closeDialog() {
    this.showDialog = false;
    this.dialogContact = null;
  }

  /**
   * Saves contact (add or update) and handles own profile updates
   * @param contact - Contact data to save
   */
  async saveContact(contact: Contact) {
    try {
      if (this.dialogMode === 'add') {
        const contactId = contact.email.replace(/[.@]/g, '_');

        const newContact: Contact = {
          ...contact,
          id: contactId
        };

        await this.contactService.saveContact(newContact).toPromise();
        console.log('✅ Contact added successfully');
        this.toastService.showSuccess(`Contact ${contact.firstName} ${contact.lastName} added successfully!`);
      } else if (contact.id) {
        const isOwnProfile = this.authService.currentUser?.email === contact.email;

        await this.contactService.updateUser(contact.id, {
          firstName: contact.firstName,
          lastName: contact.lastName,
          phone: contact.phone
        }).toPromise();

        if (isOwnProfile) {
          const displayName = `${contact.firstName} ${contact.lastName}`;
          await this.authService.updateDisplayName(displayName);
          console.log('✅ Profile updated in both Firestore and Auth');
        }

        console.log('✅ Contact updated successfully');
        this.toastService.showSuccess(`Contact ${contact.firstName} ${contact.lastName} updated successfully!`);
      }

      this.load();

      this.closeDialog();

      this.selected = contact;
      localStorage.setItem('selectedContactEmail', contact.email);
    } catch (error) {
      console.error('❌ Error saving contact:', error);
      this.toastService.showError('Failed to save contact. Please try again.');
    }
  }

  /**
   * Shows delete confirmation dialog (blocked for guest users)
   * @param contact - Contact to delete
   */
  showDeleteConfirmation(contact: Contact) {
    if (this.authService.isGuestUser()) {
      this.toastService.showGuestCannotAddContacts();
      return;
    }
    this.contactToDelete = contact;
    this.showDeleteConfirm = true;
  }

  /**
   * Cancels delete operation and closes confirmation dialog
   */
  cancelDelete() {
    this.showDeleteConfirm = false;
    this.contactToDelete = null;
  }

  /**
   * Confirms and executes contact deletion
   */
  async confirmDelete() {
    if (!this.contactToDelete) return;

    const contact = this.contactToDelete;
    this.showDeleteConfirm = false;
    this.contactToDelete = null;

    try {
      if (!contact.id) {
        throw new Error('Contact ID not found');
      }

      await this.contactService.deleteUser(contact.id).toPromise();
      console.log('✅ Contact deleted successfully');
      this.toastService.showSuccess(`Contact ${contact.firstName} ${contact.lastName} deleted successfully!`);

      if (this.selected?.email === contact.email) {
        this.clearSelection();
      }

      this.load();
      this.closeDialog();
    } catch (error) {
      console.error('❌ Error deleting contact:', error);
      this.toastService.showError('Failed to delete contact. Please try again.');
    }
  }

  /**
   * Clears current selection and removes from localStorage
   */
  clearSelection() {
    this.selected = null;
    localStorage.removeItem('selectedContactEmail');
  }

  /**
   * Automatically selects last edited contact from localStorage
   */
  checkAutoSelect() {
    const last = localStorage.getItem('lastEditedContact') || localStorage.getItem('selectedContactEmail');
    if (!last) return;
    this.contactService.getByEmail(last).subscribe(c => {
      if (c) this.selected = c;
    });
  }

  /**
   * Checks if selected contact is the user's own profile
   * @returns True if selected contact matches current user email
   */
  get isOwnProfile(): boolean {
    if (!this.selected || !this.authService.currentUser) {
      return false;
    }
    return this.selected.email === this.authService.currentUser.email;
  }

  /**
   * Handles window resize for responsive layout
   */
  @HostListener('window:resize')
  onResize() {
    const w = window.innerWidth;
    this.showRight = w >= 900;
    this.isMobile = w < 900;
  }
}
