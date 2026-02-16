import { Component, OnInit, inject, HostListener, effect, signal } from "@angular/core";
import { CommonModule } from "@angular/common";
import { Router, RouterLink, RouterLinkActive } from "@angular/router";
import { StopPropagationDirective } from '../../../shared/directives';
import { ContactService } from "../../../core/services/contact.service";
import { AuthService } from "../../../core/services/auth.service";
import { ToastService } from "../../../core/services/toast.service";
import { Contact } from "../../../core/models/contact.interface";
import { ContactSaveRequest } from '../../../core/models/contact-save-request.interface';
import { ContactDialogComponent } from "../contact-dialog/contact-dialog.component";
import { LoadingSpinnerComponent } from "../../../shared/components/loading-spinner/loading-spinner.component";

/**
 * Contacts list view with search, selection and CRUD operations using ContactService signals
 */
@Component({
  selector: "app-contacts-list",
  standalone: true,
  imports: [CommonModule, RouterLink, ContactDialogComponent, StopPropagationDirective, LoadingSpinnerComponent],
  templateUrl: "./contacts-list.component.html",
  styleUrl: "./contacts-list.component.scss",
})
export class ContactsListComponent implements OnInit {
  private contactService = inject(ContactService);
  authService = inject(AuthService);
  private toastService = inject(ToastService);
  private router = inject(Router);

  contacts = this.contactService.contacts;
  groupedContacts = this.contactService.contactsByInitial;
  loading = this.contactService.loading;

  selected: Contact | null = null;
  private selectedEmail: string | null = null;
  showRight = true;
  isMobile = false;

  showDialog = false;
  dialogMode: "add" | "edit" = "add";
  dialogContact: Contact | null = null;

  showDeleteConfirm = false;
  contactToDelete: Contact | null = null;
  isSavingContact = signal<boolean>(false);
  private avatarLoaded = signal<Record<string, boolean>>({});
  detailAvatarLoaded = signal<boolean>(false);

  constructor() {
    effect(() => {
      const contacts = this.contactService.contacts();
      if (!this.selectedEmail) {
        this.selected = null;
        return;
      }

      this.selected = contacts.find((contact) => contact.email === this.selectedEmail) || null;
    });
  }

  /**
   * Determines if the selected contact is the current user's own profile
   *
   * @returns {boolean} True if selected contact matches current user email
   * @remarks Used to conditionally allow editing of own profile
   * in the contact detail view.
   */
  get isOwnProfile(): boolean {
    if (!this.selected || !this.authService.currentUser) {
      return false;
    }
    return this.selected.email === this.authService.currentUser.email;
  }
  /**
   * Component initialization - sets up auto-selection
   * Note: Contacts load automatically via real-time listener in ContactService
   *
   * @returns {void}
   */
  ngOnInit(): void {
    this.onResize();
    setTimeout(() => this.checkAutoSelect(), 100);
  }

  /**
   * Selects a contact and updates localStorage
   * @param contact - Contact to select
   * @param event - Optional click event
   * @returns {void}
   */
  select(contact: Contact, event?: Event): void {
    if (window.innerWidth >= 900) {
      if (event) {
        event.preventDefault();
      }
    }
    this.selectedEmail = contact.email;
    this.selected = contact;
    this.detailAvatarLoaded.set(!contact.avatarUrl);
    localStorage.setItem("selectedContactEmail", contact.email);
    localStorage.setItem("lastEditedContact", contact.email);
  }

  /**
   * Opens dialog to add new contact (blocked for guest users).
   *
   * @returns {void}
   */
  addContact(): void {
    if (this.authService.isGuestUser()) {
      this.toastService.showGuestCannotAddContacts();
      return;
    }
    this.dialogMode = "add";
    this.dialogContact = null;
    this.showDialog = true;
  }

  /**
   * Opens dialog to edit existing contact (blocked for guest users).
   * @param contact - Contact to edit
   *
   * @returns {void}
   */
  editContact(contact: Contact): void {
    if (this.authService.isGuestUser()) {
      this.toastService.showGuestCannotAddContacts();
      return;
    }
    this.dialogMode = "edit";
    this.dialogContact = contact;
    this.showDialog = true;
  }

  /**
   * Closes contact dialog and resets state.
   *
   * @returns {void}
   */
  closeDialog(): void {
    this.showDialog = false;
    this.dialogContact = null;
  }

  /**
   * Saves contact (add or edit) using ContactService signals.
   * @param contact - Contact data to save
   * @async
   * @returns {Promise<void>}
   * @remarks Handles both adding new contacts and updating existing ones.
   * Emits success or error toasts based on operation outcome.
   */
  async saveContact(request: ContactSaveRequest): Promise<void> {
    const { contact, avatar, removeAvatar } = request;

    this.isSavingContact.set(true);
    try {
      if (this.dialogMode === "add") {
        await this.addContactLogic(contact, avatar);
      } else if (contact.id) {
        await this.updateContactLogic(contact, avatar, removeAvatar);
      }
      this.afterContactSave(contact);
    } catch (error) {
      this.handleContactSaveError(error);
    } finally {
      this.isSavingContact.set(false);
    }
  }

  /**
   * Shared logic to add a new contact.
   *
   * @param contact - Contact data to add
   * @async
   * @returns {Promise<void>}
   * @remarks Generates contact ID from email, saves via ContactService,
   * and shows success toast on completion.
   */
  private async addContactLogic(contact: Contact, avatar?: ContactSaveRequest['avatar']): Promise<void> {
    const contactId = contact.email.replace(/[.@]/g, "_");
    const newContact: Contact = { ...contact, id: contactId };
    await this.contactService.saveContactWithAvatar(newContact, avatar);
    this.toastService.showSuccess(
      `Contact ${contact.firstName} ${contact.lastName} added successfully!`,
    );
  }

  /**
   * Shared logic to update an existing contact.
   *
   * @param contact - Contact data to update
   * @async
   * @returns {Promise<void>}
   * @remarks Updates contact via ContactService,
   * updates auth display name if own profile,
   * and shows success toast on completion.
   */
  private async updateContactLogic(
    contact: Contact,
    avatar?: ContactSaveRequest['avatar'],
    removeAvatar?: boolean,
  ): Promise<void> {
    const isOwnProfile = this.authService.currentUser?.email === contact.email;
    await this.contactService.updateUserWithAvatar(contact, avatar, !!removeAvatar);

    if (isOwnProfile) {
      const displayName = `${contact.firstName} ${contact.lastName}`;
      await this.authService.updateDisplayName(displayName);
    }
    this.toastService.showSuccess(
      `Contact ${contact.firstName} ${contact.lastName} updated successfully!`,
    );
  }

  /**
   * Post-save logic to close dialog and update selection.
   * @param contact - Contact that was saved
   * @returns {void}
   * @remarks Closes the contact dialog, sets the selected contact,
   * and updates localStorage with the selected contact email.
   */
  private afterContactSave(contact: Contact): void {
    this.closeDialog();
    this.selectedEmail = contact.email;
    this.selected = this.contactService.findContactByEmail(contact.email) || contact;
    this.detailAvatarLoaded.set(!this.selected?.avatarUrl);
    localStorage.setItem("selectedContactEmail", contact.email);
  }

  /**
   * Handles errors during contact save operations and shows error toast.
   *
   * @param error - Error encountered during save
   * @returns {void}
   * @remarks Logs error to console and displays user-friendly error message.
   */
  private handleContactSaveError(error: any): void {
    console.error("❌ Error saving contact:", error);
    this.toastService.showError("Failed to save contact. Please try again.");
  }

  /**
   * Shows delete confirmation dialog (blocked for guest users)
   * @param contact - Contact to delete
   * @returns {void}
   * @remarks Sets up state for confirmation dialog display.
   */
  showDeleteConfirmation(contact: Contact): void {
    if (this.authService.isGuestUser()) {
      this.toastService.showGuestCannotAddContacts();
      return;
    }
    this.contactToDelete = contact;
    this.showDeleteConfirm = true;
  }

  /**
   * Cancels delete operation and closes confirmation dialog
   *
   * @returns {void}
   * @remarks Resets state related to deletion confirmation.
   */
  cancelDelete(): void {
    this.showDeleteConfirm = false;
    this.contactToDelete = null;
  }

  /**
   * Confirms and executes contact deletion and handles post-deletion logic.
   * @async
   * @returns {Promise<void>}
   * @remarks Deletes contact via ContactService, shows success or error toasts,
   * clears selection if deleted contact was selected, and closes dialog.
   */
  async confirmDelete(): Promise<void> {
    if (!this.contactToDelete) return;
    const contact = this.contactToDelete;
    this.resetDeleteState();
    try {
      await this.deleteContactLogic(contact);
      this.afterContactDelete(contact);
    } catch (error) {
      this.handleContactDeleteError(error);
    }
  }

  /**
   * Resets deletion confirmation state
   *
   * @returns {void}
   * @remarks Clears contactToDelete and hides confirmation dialog.
   */
  private resetDeleteState(): void {
    this.showDeleteConfirm = false;
    this.contactToDelete = null;
  }

  /**
   * Executes contact deletion via ContactService.
   *
   * @param contact - Contact to delete
   * @async
   * @returns {Promise<void>}
   * @remarks Deletes contact by ID and shows success toast on completion.
   */
  private async deleteContactLogic(contact: Contact): Promise<void> {
    if (!contact.id) throw new Error("Contact ID not found");
    await this.contactService.deleteUser(contact.id);
    this.toastService.showSuccess(
      `Contact ${contact.firstName} ${contact.lastName} deleted successfully!`,
    );
  }

  /**
   * Post-deletion logic to clear selection and close dialog.
   * @param contact - Contact that was deleted
   * @returns {void}
   * @remarks Clears selection if deleted contact was selected,
   * and closes any open dialog.
   */
  private afterContactDelete(contact: Contact): void {
    if (this.selected?.email === contact.email) this.clearSelection();
    this.closeDialog();
  }

  /**
   * Handles errors during contact deletion and shows error toast.
   *
   * @param error - Error encountered during deletion
   * @returns {void}
   * @remarks Logs error to console and displays user-friendly error message.
   */
  private handleContactDeleteError(error: any): void {
    console.error("❌ Error deleting contact:", error);
    this.toastService.showError("Failed to delete contact. Please try again.");
  }

  /**
   * Clears current selection and removes from localStorage
   *
   * @returns {void}
   * @remarks Used after contact deletion to reset selection state.
   */
  clearSelection(): void {
    this.selected = null;
    this.selectedEmail = null;
    this.detailAvatarLoaded.set(false);
    localStorage.removeItem("selectedContactEmail");
  }

  /**
   * Automatically selects last edited contact from localStorage
   *
   * @returns {void}
   * @remarks Checks localStorage for last edited contact email
   * and selects that contact if found.
   */
  checkAutoSelect(): void {
    const last =
      localStorage.getItem("lastEditedContact") ||
      localStorage.getItem("selectedContactEmail");
    if (!last) return;
    const contact = this.contactService.findContactByEmail(last);
    if (contact) {
      this.selectedEmail = contact.email;
      this.selected = contact;
      this.detailAvatarLoaded.set(!contact.avatarUrl);
    }
  }

  isDetailAvatarLoading(contact: Contact | null): boolean {
    if (!contact?.avatarUrl) return false;
    return !this.detailAvatarLoaded();
  }

  onDetailAvatarLoad(): void {
    this.detailAvatarLoaded.set(true);
  }

  onDetailAvatarError(): void {
    this.detailAvatarLoaded.set(true);
  }

  /**
   * Handles window resize for responsive layout
   * @returns {void}
   * @remarks Updates showRight and isMobile flags based on window width.
   */
  @HostListener("window:resize")
  onResize(): void {
    const w = window.innerWidth;
    this.showRight = w >= 900;
    this.isMobile = w < 900;
  }

  avatarLoadKey(contact: Contact): string {
    return `${contact.id}:${contact.avatarUrl || ''}`;
  }

  isAvatarLoading(contact: Contact): boolean {
    if (!contact.avatarUrl) return false;
    const key = this.avatarLoadKey(contact);
    return !this.avatarLoaded()[key];
  }

  onAvatarLoad(contact: Contact): void {
    const key = this.avatarLoadKey(contact);
    this.avatarLoaded.update((state) => ({ ...state, [key]: true }));
  }

  onAvatarError(contact: Contact): void {
    this.onAvatarLoad(contact);
  }
}
