export interface Contact {
  id: string;
  authUid?: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  color: string;
  initials: string;
  avatarUrl?: string | null;
  avatarPath?: string | null;
  avatarUpdatedAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}