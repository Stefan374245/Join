import { Component, OnInit, inject, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { ContactService } from '../../../services/contact.service';
import { AuthService } from '../../../services/auth.service';
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
  private router = inject(Router);

  contacts$ = new BehaviorSubject<Contact[]>([]);
  grouped$ = new BehaviorSubject<Grouped>([]);

  selected: Contact | null = null;
  showRight = true;
  isMobile = false;

  showDialog = false;
  dialogMode: 'add' | 'edit' = 'add';
  dialogContact: Contact | null = null;

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
    this.dialogMode = 'add';
    this.dialogContact = null;
    this.showDialog = true;
  }

  editContact(contact: Contact) {
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
      }

      this.load();

      this.closeDialog();

      this.selected = contact;
      localStorage.setItem('selectedContactEmail', contact.email);
    } catch (error) {
      console.error('❌ Error saving contact:', error);
      alert('Failed to save contact. Please try again.');
    }
  }

  async deleteContact(email: string) {
    const confirmed = confirm('Are you sure you want to delete this contact?');
    if (!confirmed) return;

    try {
      const contact = this.contacts$.value.find(c => c.email === email);
      if (!contact?.id) {
        throw new Error('Contact ID not found');
      }

      await this.contactService.deleteUser(contact.id).toPromise();
      console.log('✅ Contact deleted successfully');

      if (this.selected?.email === email) {
        this.clearSelection();
      }

      this.load();

      this.closeDialog();
    } catch (error) {
      console.error('❌ Error deleting contact:', error);
      alert('Failed to delete contact. Please try again.');
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
