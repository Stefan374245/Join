import { Component, OnInit, inject, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { ContactService } from '../../../services/contact.service';
import { AuthService } from '../../../services/auth.service';
import { ToastService } from '../../../services/toast.service';
import { Contact } from '../../../models/contact.interface';
import { Observable, BehaviorSubject } from 'rxjs';
import { ContactDialogComponent } from '../contact-dialog/contact-dialog.component';
import { ClickOutsideDirective } from '../../../shared/directives/click-outside.directive';

type Grouped = { letter: string; items: Contact[] }[];

@Component({
  selector: 'app-contacts-list',
  standalone: true,
  imports: [CommonModule, RouterLink, ContactDialogComponent, ClickOutsideDirective],
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

  ngOnInit(): void {
    this.load();
    this.checkAutoSelect();
    this.onResize();
  }

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

  addContact() {
    if (this.authService.isGuestUser()) {
      this.toastService.showGuestCannotAddContacts();
      return;
    }
    this.dialogMode = 'add';
    this.dialogContact = null;
    this.showDialog = true;
  }

  editContact(contact: Contact) {
    if (this.authService.isGuestUser()) {
      this.toastService.showGuestCannotAddContacts();
      return;
    }
    this.dialogMode = 'edit';
    this.dialogContact = contact;
    this.showDialog = true;
  }

  closeDialog() {
    this.showDialog = false;
    this.dialogContact = null;
  }

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

  showDeleteConfirmation(contact: Contact) {
    if (this.authService.isGuestUser()) {
      this.toastService.showGuestCannotAddContacts();
      return;
    }
    this.contactToDelete = contact;
    this.showDeleteConfirm = true;
  }

  cancelDelete() {
    this.showDeleteConfirm = false;
    this.contactToDelete = null;
  }

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

  clearSelection() {
    this.selected = null;
    localStorage.removeItem('selectedContactEmail');
  }

  checkAutoSelect() {
    const last = localStorage.getItem('lastEditedContact') || localStorage.getItem('selectedContactEmail');
    if (!last) return;
    this.contactService.getByEmail(last).subscribe(c => {
      if (c) this.selected = c;
    });
  }

  get isOwnProfile(): boolean {
    if (!this.selected || !this.authService.currentUser) {
      return false;
    }
    return this.selected.email === this.authService.currentUser.email;
  }

  @HostListener('window:resize')
  onResize() {
    const w = window.innerWidth;
    this.showRight = w >= 900;
    this.isMobile = w < 900;
  }
}
