import { Component, OnInit, inject, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ContactService } from '../../../core/services/contact.service';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { Contact } from '../../../core/models/contact.interface';
import { ContactDialogComponent } from '../contact-dialog/contact-dialog.component';
import { ClickOutsideDirective } from '../../../shared/directives/click-outside.directive';
import { StopPropagationDirective } from '../../../shared/directives';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';

@Component({
  selector: 'app-contact-detail',
  standalone: true,
  imports: [CommonModule, ContactDialogComponent, ClickOutsideDirective, StopPropagationDirective, LoadingSpinnerComponent],
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
  showDeleteConfirm = signal<boolean>(false);
  
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
   * Displays the delete confirmation dialog to prevent accidental contact deletion.
   * Sets the UI state to show confirmation buttons and warning message before proceeding.
   */
  showDeleteConfirmation(): void {
    if (this.authService.isGuestUser()) {
      this.toastService.showGuestCannotAddContacts();
      this.showActionMenu = false;
      return;
    }
    this.showActionMenu = false;
    this.showDeleteConfirm.set(true);
  }

  /**
   * Cancels the delete operation and hides the confirmation dialog.
   * Resets the UI state back to normal view without performing any deletion.
   */
  cancelDelete(): void {
    this.showDeleteConfirm.set(false);
  }

  /**
   * Confirms and executes the contact deletion process.
   * 
   * This method sets isDeleting state, deletes the contact via service,
   * shows a success toast notification, and navigates back to contacts list.
   * The loading spinner will automatically show during the deletion process.
   * 
   * @async
   * @returns {Promise<void>}
   */
  async confirmDelete(): Promise<void> {
    const currentContact = this.contact();
    if (!currentContact?.id) return;

    this.isDeleting.set(true);
    this.showDeleteConfirm.set(false);
    
    try {
      await this.contactService.deleteUser(currentContact.id);
      this.toastService.showSuccess(`Contact ${currentContact.firstName} ${currentContact.lastName} deleted successfully!`);
      this.router.navigate(['/contacts']);
    } catch (error) {
      console.error('Error deleting contact:', error);
      this.toastService.showError('Failed to delete contact. Please try again.');
    } finally {
      this.isDeleting.set(false);
    }
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
