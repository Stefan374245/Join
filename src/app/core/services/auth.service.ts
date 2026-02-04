import { Injectable, inject, computed } from "@angular/core";
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
  authState,
} from "@angular/fire/auth";
import { Firestore } from "@angular/fire/firestore";
import { Router } from "@angular/router";
import { toSignal } from "@angular/core/rxjs-interop";
import { saveUserToFirestore, ensureUserInFirestore } from './auth/user-firestore.helper';
import { GUEST_CREDENTIALS, isUserNotFoundError, isEmailInUseError, logGuestCreation, logGuestSuccess, logGuestError } from './auth/guest-login.helper';

/**
 * Interface for user registration data
 */
export interface SignupData {
  /** Full display name of the user */
  name: string;
  /** Email address for authentication */
  email: string;
  /** Password for account security */
  password: string;
}

/**
 * Authentication service using Firebase Auth with Angular Signals
 * Provides user registration, login, logout and reactive state management
 * @remarks Utilizes Angular Signals for reactive user state
 */
@Injectable({
  providedIn: "root",
})
export class AuthService {
  private auth = inject(Auth);
  private firestore = inject(Firestore);
  private router = inject(Router);
  
  public readonly currentUserSignal = toSignal(authState(this.auth), { initialValue: null });
  public readonly isAuthenticated = computed(() => this.currentUserSignal() !== null);
  public readonly userDisplayName = computed(() => this.currentUserSignal()?.displayName ?? null);
  public readonly userEmail = computed(() => this.currentUserSignal()?.email ?? null);
  public readonly isGuestUser = computed(() => this.currentUserSignal()?.email === "guest@join.com");
  public readonly userId = computed(() => this.currentUserSignal()?.uid ?? null);

  /**
   * Gets currently authenticated user from Firebase Auth (Legacy support)
   * @returns Current Firebase User object or null
   * @deprecated Use currentUserSignal for reactive programming
   */
  get currentUser(): User | null {
    return this.auth.currentUser;
  }


  /**
   * Registers new user with email and password
   * @param data - Registration data (name, email, password)
   * @returns Promise with user credentials
   */
  async signup(data: SignupData): Promise<UserCredential> {
    const userCredential = await this.createUserAccount(data);
    await this.setupUserProfile(userCredential.user, data.name);
    return userCredential;
  }

  /**
   * Creates user account in Firebase Auth
   * @param data - Registration data
   * @returns Promise with user credentials
   */
  private async createUserAccount(data: SignupData): Promise<UserCredential> {
    return await createUserWithEmailAndPassword(
      this.auth,
      data.email,
      data.password
    );
  }

  /**
   * Sets up user profile and Firestore document
   * @param user - Firebase user object
   * @param displayName - User's display name
   */
  private async setupUserProfile(user: User, displayName: string): Promise<void> {
    if (user) {
      await updateProfile(user, { displayName });
      await saveUserToFirestore(this.firestore, user, displayName);
    }
  }

  /**
   * Logs in user with email and password
   * @param email - User's email address
   * @param password - User's password
   * @returns Promise with user credentials
   */
  async login(email: string, password: string): Promise<UserCredential> {
    const userCredential = await signInWithEmailAndPassword(
      this.auth,
      email,
      password
    );
    await ensureUserInFirestore(this.firestore, userCredential.user);
    return userCredential;
  }

  /**
   * Logs in as guest user, creates guest account if not exists
   * @returns Promise with guest user credentials
   */
  async guestLogin(): Promise<UserCredential> {
    try {
      return await this.attemptGuestLogin();
    } catch (error: any) {
      return await this.handleGuestLoginError(error);
    }
  }

  /**
   * Attempts to login with guest credentials
   * @returns Promise with user credentials
   */
  private async attemptGuestLogin(): Promise<UserCredential> {
    return await this.login(GUEST_CREDENTIALS.email, GUEST_CREDENTIALS.password);
  }

  /**
   * Handles guest login errors and creates account if needed
   * @param error - Error from login attempt
   * @returns Promise with user credentials
   */
  private async handleGuestLoginError(error: any): Promise<UserCredential> {
    if (isUserNotFoundError(error)) {
      return await this.createGuestAccount();
    }
    throw error;
  }

  /**
   * Creates new guest account
   * @returns Promise with user credentials
   */
  private async createGuestAccount(): Promise<UserCredential> {
    logGuestCreation();
    
    try {
      await this.signup({
        name: GUEST_CREDENTIALS.displayName,
        email: GUEST_CREDENTIALS.email,
        password: GUEST_CREDENTIALS.password,
      });
      logGuestSuccess();
      return await this.attemptGuestLogin();
    } catch (signupError: any) {
      this.handleGuestSignupError(signupError);
      throw signupError;
    }
  }

  /**
   * Handles guest signup errors
   * @param error - Error from signup attempt
   */
  private handleGuestSignupError(error: any): void {
    if (isEmailInUseError(error)) {
      logGuestError();
    }
  }

  /**
   * Signs in user with Google OAuth using popup
   * @returns Promise with user credentials
   * @remarks Creates Firestore user document if new user
   */
  async signInWithGoogle(): Promise<UserCredential> {
    const provider = this.createGoogleProvider();
    const userCredential = await signInWithPopup(this.auth, provider);
    await ensureUserInFirestore(this.firestore, userCredential.user);
    return userCredential;
  }

  /**
   * Creates configured Google OAuth provider
   * @returns Google OAuth provider instance
   * @remarks Sets prompt to select account
   */
  private createGoogleProvider(): GoogleAuthProvider {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: "select_account" });
    return provider;
  }

  /**
   * Logs out current user and navigates to logo animation
   * @returns Promise of logout operation
   */
  async logout(): Promise<void> {
    await signOut(this.auth);
    this.router.navigate(["/logo-animation"]);
  }

  /**
   * Checks if user is authenticated (Legacy method)
   * @returns True if authenticated, false otherwise
   * @deprecated Use isAuthenticated signal instead
   */
  isAuthenticatedLegacy(): boolean {
    return this.auth.currentUser !== null;
  }

  /**
   * Gets current user's display name (Legacy method)
   * @returns Display name or null
   * @deprecated Use userDisplayName signal instead
   */
  getUserDisplayName(): string | null {
    return this.auth.currentUser?.displayName || null;
  }

  /**
   * Gets current user's email address (Legacy method)
   * @returns Email address or null
   * @deprecated Use userEmail signal instead
   */
  getUserEmail(): string | null {
    return this.auth.currentUser?.email || null;
  }

  /**
   * Checks if current user is guest (Legacy method)
   * @returns True if guest, false otherwise
   * @deprecated Use isGuestUser signal instead
   */
  isGuestUserLegacy(): boolean {
    return this.auth.currentUser?.email === "guest@join.com";
  }

  /**
   * Updates display name of current user
   * @param displayName - New display name
   * @returns Promise that resolves when update is complete
   * @throws Error if no user is logged in
   */
  async updateDisplayName(displayName: string): Promise<void> {
    if (!this.auth.currentUser) {
      throw new Error("No user is currently logged in");
    }

    try {
      await updateProfile(this.auth.currentUser, {
        displayName: displayName,
      });

      console.log("✅ Display name updated successfully in Auth");
    } catch (error) {
      console.error("❌ Error updating display name:", error);
      throw error;
    }
  }
}
