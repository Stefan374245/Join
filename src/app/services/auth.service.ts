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
  private router = inject(Router);
  
  // Observable of the current user
  user$: Observable<User | null> = authState(this.auth);
  
  // Get current user synchronously
  get currentUser(): User | null {
    return this.auth.currentUser;
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
    ).then((userCredential) => {
      // Update user profile with display name
      if (userCredential.user) {
        return updateProfile(userCredential.user, {
          displayName: data.name
        }).then(() => userCredential);
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
    const promise = signInWithEmailAndPassword(this.auth, email, password);
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
    const promise = signInWithPopup(this.auth, provider);
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
}
