import { Component, OnInit, inject, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { ContactService } from '../../../services/contact.service';
import { AuthService } from '../../../services/auth.service';
import { Contact } from '../../../models/contact.interface';
import { Observable, BehaviorSubject } from 'rxjs';
import { ContactDialogComponent } from '../contact-dialog/contact-dialog.component';

type Grouped = { letter: string; items: Contact[] }[];

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

  contacts$ = new BehaviorSubject<Contact[]>([]);
  grouped$ = new BehaviorSubject<Grouped>([]);

  // UI state
  selected: Contact | null = null;
  showRight = true;
  
  // Dialog state
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
        
        // Additional debug info
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

  select(contact: Contact) {
    this.selected = contact;
    localStorage.setItem('selectedContactEmail', contact.email);
    localStorage.setItem('lastEditedContact', contact.email);
    if (window.innerWidth <= 800) {
      this.showRight = true;
    }
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
        // Create new contact (non-auth user)
        // Generate ID from email
        const contactId = contact.email.replace(/[.@]/g, '_'); // sanitize email for Firestore ID
        
        // Create complete contact object with ID
        const newContact: Contact = {
          ...contact,
          id: contactId
        };
        
        await this.contactService.saveContact(newContact).toPromise();
        console.log('✅ Contact added successfully');
      } else if (contact.id) {
        // Update existing contact
        const isOwnProfile = this.authService.currentUser?.email === contact.email;
        
        // Update Firestore
        await this.contactService.updateUser(contact.id, {
          firstName: contact.firstName,
          lastName: contact.lastName,
          phone: contact.phone
        }).toPromise();
        
        // If editing own profile, also update Firebase Auth profile
        if (isOwnProfile) {
          const displayName = `${contact.firstName} ${contact.lastName}`;
          await this.authService.updateDisplayName(displayName);
          console.log('✅ Profile updated in both Firestore and Auth');
        }
        
        console.log('✅ Contact updated successfully');
      }
      
      // Reload contacts list
      this.load();
      
      // Close dialog
      this.closeDialog();
      
      // Select the saved/updated contact
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
      // Find the contact by email to get the ID
      const contact = this.contacts$.value.find(c => c.email === email);
      if (!contact?.id) {
        throw new Error('Contact ID not found');
      }
      
      await this.contactService.deleteUser(contact.id).toPromise();
      console.log('✅ Contact deleted successfully');
      
      // Clear selection if deleted contact was selected
      if (this.selected?.email === email) {
        this.clearSelection();
      }
      
      // Reload contacts list
      this.load();
      
      // Close dialog
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

  /**
   * Check if the selected contact is the currently logged-in user
   */
  get isOwnProfile(): boolean {
    if (!this.selected || !this.authService.currentUser) {
      return false;
    }
    return this.selected.email === this.authService.currentUser.email;
  }

  // responsive helper
  @HostListener('window:resize') onResize() {
    this.showRight = window.innerWidth >= 800;
  }
}
