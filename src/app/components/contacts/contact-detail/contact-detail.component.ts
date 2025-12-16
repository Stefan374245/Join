import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ContactService } from '../../../services/contact.service';
import { AuthService } from '../../../services/auth.service';
import { ToastService } from '../../../services/toast.service';
import { Contact } from '../../../models/contact.interface';
import { ContactDialogComponent } from '../contact-dialog/contact-dialog.component';
import { ClickOutsideDirective } from '../../../shared/directives/click-outside.directive';

@Component({
  selector: 'app-contact-detail',
  standalone: true,
  imports: [CommonModule, ContactDialogComponent, ClickOutsideDirective],
  templateUrl: './contact-detail.component.html',
  styleUrl: './contact-detail.component.scss'
})
export class ContactDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private contactService = inject(ContactService);
  private authService = inject(AuthService);
  private toastService = inject(ToastService);

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

  closeActionMenu() {
    this.showActionMenu = false;
  }

  editContact() {
    if (this.authService.isGuestUser()) {
      this.toastService.showGuestCannotAddContacts();
      this.showActionMenu = false;
      return;
    }
    this.showActionMenu = false;
    this.dialogMode = 'edit';
    this.showDialog = true;
  }

  async deleteContact() {
    if (this.authService.isGuestUser()) {
      this.toastService.showGuestCannotAddContacts();
      this.showActionMenu = false;
      return;
    }
    
    if (!this.contact?.id) return;

    if (confirm(`Delete contact ${this.contact.firstName} ${this.contact.lastName}?`)) {
      try {
        await this.contactService.deleteUser(this.contact.id).toPromise();
        this.toastService.showSuccess(`Contact ${this.contact.firstName} ${this.contact.lastName} deleted successfully!`);
        this.router.navigate(['/contacts']);
      } catch (error) {
        console.error('Error deleting contact:', error);
        this.toastService.showError('Failed to delete contact. Please try again.');
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
      this.toastService.showSuccess(`Contact ${updatedContact.firstName} ${updatedContact.lastName} updated successfully!`);
    } catch (error) {
      console.error('Error updating contact:', error);
      this.toastService.showError('Failed to update contact. Please try again.');
    }
  }

  handleDelete(email: string) {
    this.router.navigate(['/contacts']);
  }
}
