import { Contact } from './contact.interface';
import { ContactAvatarUpload } from './contact-avatar-upload.interface';

export interface ContactSaveRequest {
  contact: Contact;
  avatar?: ContactAvatarUpload;
  removeAvatar?: boolean;
}
