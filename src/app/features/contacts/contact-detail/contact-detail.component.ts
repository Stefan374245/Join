import { Component, OnInit, inject, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ContactService } from '../../../core/services/contact.service';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { Contact } from '../../../core/models/contact.interface';
import { ContactDialogComponent } from '../contact-dialog/contact-dialog.component';
import { ClickOutsideDirective } from '../../../shared/directives/click-outside.directive';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';

@Component({
  selector: 'app-contact-detail',
  standalone: true,
  imports: [CommonModule, ContactDialogComponent, ClickOutsideDirective, LoadingSpinnerComponent],
  templateUrl: './contact-detail.component.html',
  styleUrl: './contact-detail.component.scss'
})
export class ContactDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private contactService = inject(ContactService);
  private authService = inject(AuthService);
  private toastService = inject(ToastService);
  private currentEmail = signal<string | null>(null);
  
  contact = computed(() => {
    const email = this.currentEmail();
    if (!email) return null;
    return this.contactService.findContactByEmail(email) || null;
  });
  
  loading = this.contactService.loading;
  isDeleting = signal<boolean>(false);
  isUpdating = signal<boolean>(false);
  
  showActionMenu = false;
  showDialog = false;
  dialogMode: 'add' | 'edit' = 'edit';

  /**
   * Component initialization - gets email from route
   * Note: Contact data loads automatically via real-time listener in ContactService
   */
  ngOnInit(): void {
    
    const email = this.route.snapshot.paramMap.get('email');
    if (email) {
      this.currentEmail.set(email);
    } else {
      this.router.navigate(['/contacts']);
    }
  }

  /**
   * Navigates back to contacts list
   */
  goBack() {
    this.router.navigate(['/contacts']);
  }

  /**
   * Toggles action menu visibility
   */
  toggleActionMenu() {
    this.showActionMenu = !this.showActionMenu;
  }

  /**
   * Closes action menu
   */
  closeActionMenu() {
    this.showActionMenu = false;
  }

  /**
   * Opens edit dialog for current contact
   * @remarks
   * Prevents guest users from editing contacts
   */
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

 
  /**
   * Deletes the currently selected contact after user confirmation.
   * 
   * - If the user is a guest, shows a toast notification and exits.
   * - Prompts the user for confirmation before deleting.
   * - Sets a loading state while the deletion is in progress.
   * - On successful deletion, shows a success toast and navigates to the contacts list.
   * - On failure, logs the error and shows an error toast.
   * - Always resets the loading state and hides the action menu after the operation.
   * 
   * @async
   * @returns {Promise<void>}
   */
  async deleteContact(): Promise<void> {
    if (this.authService.isGuestUser()) {
      this.toastService.showGuestCannotAddContacts();
      this.showActionMenu = false;
      return;
    }
    
    const currentContact = this.contact();
    if (!currentContact?.id) return;

    if (confirm(`Delete contact ${currentContact.firstName} ${currentContact.lastName}?`)) {
      this.isDeleting.set(true);
      try {
        await this.contactService.deleteUser(currentContact.id);
        this.toastService.showSuccess(`Contact ${currentContact.firstName} ${currentContact.lastName} deleted successfully!`);
        this.router.navigate(['/contacts']);
      } catch (error) {
        this.toastService.showError('Failed to delete contact. Please try again.');
      } finally {
        this.isDeleting.set(false);
      }
    }
    this.showActionMenu = false;
  }

  /**
   * Closes contact dialog.
   * 
   * @returns {void}
   */
  closeDialog(): void {
    this.showDialog = false;
  }

  /**
   * Saves updated contact data to the service.
   * Displays success or error toast based on outcome.
   * 
   * @param updatedContact - Contact with updated data
   * @async @returns {Promise<void>}
   */
  async saveContact(updatedContact: Contact): Promise<void> {
    if (!updatedContact.id) return;

    this.isUpdating.set(true);
    try {
      await this.contactService.updateUser(updatedContact.id, {
        firstName: updatedContact.firstName,
        lastName: updatedContact.lastName,
        phone: updatedContact.phone
      });
      this.showDialog = false;
      this.toastService.showSuccess(`Contact ${updatedContact.firstName} ${updatedContact.lastName} updated successfully!`);
    } catch (error) {
      this.toastService.showError('Failed to update contact. Please try again.');
    } finally {
      this.isUpdating.set(false);
    }
  }

  /**
   * Handles contact deletion by navigating back
   * @param _email - Deleted contact email
   */
  handleDelete(_email: string) {
    this.router.navigate(['/contacts']);
  }
}
