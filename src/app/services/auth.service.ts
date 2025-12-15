import { Injectable, inject } from '@angular/core';
import {
  Auth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  updateProfile,
  User,
  UserCredential,
  authState
} from '@angular/fire/auth';
import { Firestore, doc, setDoc, getDoc } from '@angular/fire/firestore';
import { Observable, from } from 'rxjs';
import { Router } from '@angular/router';

/**
 * Interface für Registrierungsdaten
 * @interface SignupData
 */
export interface SignupData {
  /** Vollständiger Name des Benutzers */
  name: string;
  /** E-Mail-Adresse des Benutzers */
  email: string;
  /** Passwort für das Konto */
  password: string;
}

/**
 * Service für die Authentifizierung und Benutzerverwaltung
 * 
 * Dieser Service verwaltet alle authentifizierungsbezogenen Operationen:
 * - Benutzerregistrierung und -anmeldung
 * - Google OAuth-Integration
 * - Gast-Login-Funktionalität
 * - Benutzerprofilverwaltung
 * - Firestore-Synchronisation von Benutzerdaten
 * 
 * @class AuthService
 */
@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private auth = inject(Auth);
  private firestore = inject(Firestore);
  private router = inject(Router);

  /** Observable Stream des aktuellen Authentifizierungsstatus */
  user$: Observable<User | null> = authState(this.auth);

  /**
   * Gibt den aktuell angemeldeten Benutzer zurück
   * @returns {User | null} Der aktuelle Benutzer oder null
   */
  get currentUser(): User | null {
    return this.auth.currentUser;
  }

  /**
   * Generiert eine konsistente Farbe basierend auf der E-Mail-Adresse
   * @private
   * @param {string} email - Die E-Mail-Adresse des Benutzers
   * @returns {string} Hexadezimaler Farbcode
   */
  private generateColorFromEmail(email: string): string {
    const colors = [
      '#FF7A00', '#FF5EB3', '#6E52FF', '#9327FF', '#00BEE8',
      '#1FD7C1', '#FF745E', '#FFA35E', '#FC71FF', '#FFC701',
      '#0038FF', '#C3FF2B', '#FFE62B', '#FF4646', '#FFBB2B'
    ];

    const hash = email.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const colorIndex = hash % colors.length;
    return colors[colorIndex];
  }

  /**
   * Speichert Benutzerdaten in Firestore
   * @private
   * @param {User} user - Firebase Auth Benutzerobjekt
   * @param {string} displayName - Anzeigename des Benutzers
   * @returns {Promise<void>}
   */
  private async saveUserToFirestore(user: User, displayName: string): Promise<void> {
    const userDoc = doc(this.firestore, 'users', user.uid);
    const color = this.generateColorFromEmail(user.email || '');

    const nameParts = displayName.split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';

    const initials = displayName
      ? displayName.split(' ').map((s: string) => s[0]).slice(0, 2).join('').toUpperCase()
      : (user.email?.substring(0, 2).toUpperCase() || 'U');

    await setDoc(userDoc, {
      firstName: firstName,
      lastName: lastName,
      displayName: displayName,
      email: user.email,
      phone: '',
      color: color,
      initials: initials,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
  }

  /**
   * Stellt sicher, dass der Benutzer in Firestore existiert
   * Erstellt ein Benutzerdokument, falls es noch nicht existiert
   * @private
   * @param {User} user - Firebase Auth Benutzerobjekt
   * @returns {Promise<void>}
   */
  private async ensureUserInFirestore(user: User): Promise<void> {
    try {
      const userDoc = doc(this.firestore, 'users', user.uid);
      const userSnapshot = await getDoc(userDoc);

      if (!userSnapshot.exists()) {
        const displayName = user.displayName || user.email?.split('@')[0] || 'User';
        await this.saveUserToFirestore(user, displayName);
      }
    } catch (error) {
    }
  }

  /**
   * Registriert einen neuen Benutzer mit E-Mail und Passwort
   * Erstellt automatisch ein Firestore-Dokument mit Benutzerdaten
   * @param {SignupData} data - Registrierungsdaten (Name, E-Mail, Passwort)
   * @returns {Observable<UserCredential>} Observable mit den Benutzer-Credentials
   */
  signup(data: SignupData): Observable<UserCredential> {
    const promise = createUserWithEmailAndPassword(
      this.auth,
      data.email,
      data.password
    ).then(async (userCredential) => {
      if (userCredential.user) {
        await updateProfile(userCredential.user, {
          displayName: data.name
        });

        await this.saveUserToFirestore(userCredential.user, data.name);
      }
      return userCredential;
    });

    return from(promise);
  }

  /**
   * Meldet einen Benutzer mit E-Mail und Passwort an
   * Stellt sicher, dass der Benutzer in Firestore existiert
   * @param {string} email - E-Mail-Adresse des Benutzers
   * @param {string} password - Passwort des Benutzers
   * @returns {Observable<UserCredential>} Observable mit den Benutzer-Credentials
   */
  login(email: string, password: string): Observable<UserCredential> {
    const promise = signInWithEmailAndPassword(this.auth, email, password)
      .then(async (userCredential) => {
        await this.ensureUserInFirestore(userCredential.user);
        return userCredential;
      });
    return from(promise);
  }

  /**
   * Meldet den Benutzer als Gast an
   * Verwendet vordefinierte Gast-Credentials
   * @returns {Observable<UserCredential>} Observable mit den Gast-Credentials
   */
  guestLogin(): Observable<UserCredential> {
    return this.login('guest@join.com', 'guest123');
  }

  /**
   * Meldet den Benutzer über Google OAuth an
   * Erstellt automatisch ein Firestore-Dokument, falls noch nicht vorhanden
   * @returns {Observable<UserCredential>} Observable mit den Google-Credentials
   */
  signInWithGoogle(): Observable<UserCredential> {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({
      prompt: 'select_account'
    });

    const promise = signInWithPopup(this.auth, provider).then(async (userCredential) => {
      await this.ensureUserInFirestore(userCredential.user);
      return userCredential;
    });

    return from(promise);
  }

  /**
   * Meldet den aktuellen Benutzer ab und navigiert zur Login-Seite
   * @returns {Observable<void>} Observable des Logout-Vorgangs
   */
  logout(): Observable<void> {
    const promise = signOut(this.auth).then(() => {
      this.router.navigate(['/login']);
    });
    return from(promise);
  }

  /**
   * Überprüft, ob ein Benutzer angemeldet ist
   * @returns {boolean} True wenn angemeldet, sonst false
   */
  isAuthenticated(): boolean {
    return this.currentUser !== null;
  }

  /**
   * Gibt den Anzeigenamen des aktuellen Benutzers zurück
   * @returns {string | null} Anzeigename oder null
   */
  getUserDisplayName(): string | null {
    return this.currentUser?.displayName || null;
  }

  /**
   * Gibt die E-Mail-Adresse des aktuellen Benutzers zurück
   * @returns {string | null} E-Mail-Adresse oder null
   */
  getUserEmail(): string | null {
    return this.currentUser?.email || null;
  }

  /**
   * Aktualisiert den Anzeigenamen des aktuellen Benutzers
   * @param {string} displayName - Neuer Anzeigename
   * @returns {Promise<void>}
   * @throws {Error} Wenn kein Benutzer angemeldet ist
   */
  async updateDisplayName(displayName: string): Promise<void> {
    if (!this.currentUser) {
      throw new Error('No user is currently logged in');
    }

    try {
      await updateProfile(this.currentUser, {
        displayName: displayName
      });

      console.log('✅ Display name updated successfully in Auth');
    } catch (error) {
      console.error('❌ Error updating display name:', error);
      throw error;
    }
  }
}
