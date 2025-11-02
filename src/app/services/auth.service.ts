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

export interface SignupData {
  name: string;
  email: string;
  password: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private auth = inject(Auth);
  private firestore = inject(Firestore);
  private router = inject(Router);
  
  // Observable of the current user
  user$: Observable<User | null> = authState(this.auth);
  
  // Get current user synchronously
  get currentUser(): User | null {
    return this.auth.currentUser;
  }

  /**
   * Generate a color for new user based on email
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
   * Save user data to Firestore 'users' collection
   */
  private async saveUserToFirestore(user: User, displayName: string): Promise<void> {
    const userDoc = doc(this.firestore, 'users', user.uid);
    const color = this.generateColorFromEmail(user.email || '');
    
    // Parse displayName into firstName and lastName
    const nameParts = displayName.split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';
    
    // Generate initials
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
   * Ensure user exists in Firestore (migration helper for existing Auth users)
   * Checks if user document exists, if not creates it
   */
  private async ensureUserInFirestore(user: User): Promise<void> {
    try {
      const userDoc = doc(this.firestore, 'users', user.uid);
      const userSnapshot = await getDoc(userDoc);
      
      if (!userSnapshot.exists()) {
        console.log('🔄 User not found in Firestore, creating document for:', user.email);
        const displayName = user.displayName || user.email?.split('@')[0] || 'User';
        await this.saveUserToFirestore(user, displayName);
        console.log('✅ User migrated to Firestore successfully');
      } else {
        console.log('✅ User already exists in Firestore');
      }
    } catch (error) {
      console.error('❌ Error ensuring user in Firestore:', error);
      // Don't throw error, just log it - login should still succeed
    }
  }

  /**
   * Sign up a new user with email and password
   * @param data - User signup data (name, email, password)
   * @returns Observable of UserCredential
   */
  signup(data: SignupData): Observable<UserCredential> {
    const promise = createUserWithEmailAndPassword(
      this.auth, 
      data.email, 
      data.password
    ).then(async (userCredential) => {
      // Update user profile with display name
      if (userCredential.user) {
        await updateProfile(userCredential.user, {
          displayName: data.name
        });
        
        // Save user to Firestore for contacts list
        await this.saveUserToFirestore(userCredential.user, data.name);
      }
      return userCredential;
    });
    
    return from(promise);
  }

  /**
   * Sign in with email and password
   * @param email - User email
   * @param password - User password
   * @returns Observable of UserCredential
   */
  login(email: string, password: string): Observable<UserCredential> {
    const promise = signInWithEmailAndPassword(this.auth, email, password)
      .then(async (userCredential) => {
        // Ensure user exists in Firestore (migration for existing users)
        await this.ensureUserInFirestore(userCredential.user);
        return userCredential;
      });
    return from(promise);
  }

  /**
   * Sign in as guest (anonymous)
   * For now, uses a test account
   * TODO: Implement proper anonymous auth if needed
   */
  guestLogin(): Observable<UserCredential> {
    // You can implement anonymous auth here
    // For now, use a guest account
    return this.login('guest@join.com', 'guest123');
  }

  /**
   * Sign in with Google
   * Opens a popup window for Google authentication
   * @returns Observable of UserCredential
   */
  signInWithGoogle(): Observable<UserCredential> {
    const provider = new GoogleAuthProvider();
    // Optional: Add custom parameters
    provider.setCustomParameters({
      prompt: 'select_account'
    });
    
    const promise = signInWithPopup(this.auth, provider).then(async (userCredential) => {
      // Ensure user exists in Firestore
      await this.ensureUserInFirestore(userCredential.user);
      return userCredential;
    });
    
    return from(promise);
  }

  /**
   * Sign out the current user
   * @returns Observable of void
   */
  logout(): Observable<void> {
    const promise = signOut(this.auth).then(() => {
      this.router.navigate(['/login']);
    });
    return from(promise);
  }

  /**
   * Check if user is authenticated
   * @returns boolean
   */
  isAuthenticated(): boolean {
    return this.currentUser !== null;
  }

  /**
   * Get user display name
   * @returns string or null
   */
  getUserDisplayName(): string | null {
    return this.currentUser?.displayName || null;
  }

  /**
   * Get user email
   * @returns string or null
   */
  getUserEmail(): string | null {
    return this.currentUser?.email || null;
  }

  /**
   * Update the display name of the current user
   * Updates both the Firebase Auth profile
   * @param displayName - The new display name
   * @returns Promise<void>
   */
  async updateDisplayName(displayName: string): Promise<void> {
    if (!this.currentUser) {
      throw new Error('No user is currently logged in');
    }

    try {
      // Update Firebase Auth profile
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
