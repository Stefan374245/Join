import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ContactService } from '../../../services/contact.service';
import { Contact } from '../../../models/contact.interface';
import { ContactDialogComponent } from '../contact-dialog/contact-dialog.component';

@Component({
  selector: 'app-contact-detail',
  standalone: true,
  imports: [CommonModule, ContactDialogComponent],
  templateUrl: './contact-detail.component.html',
  styleUrl: './contact-detail.component.scss'
})
export class ContactDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private contactService = inject(ContactService);

  contact: Contact | null = null;
  showActionMenu = false;
  showDialog = false;
  dialogMode: 'add' | 'edit' = 'edit';

  ngOnInit(): void {
    const email = this.route.snapshot.paramMap.get('email');
    if (email) {
      this.loadContact(email);
    }
  }

  private loadContact(email: string) {
    this.contactService.loadAll().subscribe({
      next: (contacts) => {
        this.contact = contacts.find(c => c.email === email) || null;
        if (!this.contact) {
          this.router.navigate(['/contacts']);
        }
      },
      error: (err) => {
        console.error('Error loading contact:', err);
        this.router.navigate(['/contacts']);
      }
    });
  }

  goBack() {
    this.router.navigate(['/contacts']);
  }

  toggleActionMenu() {
    this.showActionMenu = !this.showActionMenu;
  }

  editContact() {
    this.showActionMenu = false;
    this.dialogMode = 'edit';
    this.showDialog = true;
  }

  async deleteContact() {
    if (!this.contact?.id) return;

    if (confirm(`Delete contact ${this.contact.firstName} ${this.contact.lastName}?`)) {
      try {
        await this.contactService.deleteUser(this.contact.id).toPromise();
        this.router.navigate(['/contacts']);
      } catch (error) {
        console.error('Error deleting contact:', error);
        alert('Failed to delete contact');
      }
    }
    this.showActionMenu = false;
  }

  closeDialog() {
    this.showDialog = false;
  }

  async saveContact(updatedContact: Contact) {
    if (!updatedContact.id) return;

    try {
      await this.contactService.updateUser(updatedContact.id, {
        firstName: updatedContact.firstName,
        lastName: updatedContact.lastName,
        phone: updatedContact.phone
      }).toPromise();
      this.contact = updatedContact;
      this.showDialog = false;
    } catch (error) {
      console.error('Error updating contact:', error);
      alert('Failed to update contact');
    }
  }

  handleDelete(email: string) {
    this.router.navigate(['/contacts']);
  }
}
