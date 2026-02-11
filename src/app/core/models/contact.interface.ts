export interface Contact {
  id: string;
  authUid?: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  color: string;
  initials: string;
  createdAt?: Date;
  updatedAt?: Date;
}