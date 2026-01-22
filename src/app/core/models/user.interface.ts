import { Timestamp } from '@angular/fire/firestore';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  initials: string;
}

/**
 * User document interface for Firestore
 * Complete user data stored in Firestore users collection
 */
export interface UserDocument {
  firstName: string;
  lastName: string;
  displayName: string;
  email: string;
  phone: string;
  color: string;
  initials: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}