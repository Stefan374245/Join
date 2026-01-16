export interface Contact {
  id: string; // Firestore Document ID
  authUid?: string; // Firebase Auth UID (falls anders als Document ID)
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  color: string;
  initials: string;
}