import { Injectable, inject, signal, computed, effect } from "@angular/core";
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
import { Firestore, doc, setDoc, getDoc } from "@angular/fire/firestore";
import { Observable, from } from "rxjs";
import { catchError, switchMap, map } from "rxjs/operators";
import { Router } from "@angular/router";
import { toSignal, toObservable } from "@angular/core/rxjs-interop";

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
 *
 * Provides user registration, login, logout and reactive state management
 */
@Injectable({
  providedIn: "root",
})
export class AuthService {
  private auth = inject(Auth);
  private firestore = inject(Firestore);
  private router = inject(Router);
  private userSignal = toSignal(authState(this.auth), { initialValue: null });
  public readonly currentUserSignal = this.userSignal;

  user$: Observable<User | null> = toObservable(this.userSignal);

  public readonly isAuthenticated = computed(() => this.userSignal() !== null);

  public readonly userDisplayName = computed(
    () => this.userSignal()?.displayName ?? null
  );

  public readonly userEmail = computed(() => this.userSignal()?.email ?? null);

  public readonly isGuestUser = computed(
    () => this.userSignal()?.email === "guest@join.com"
  );

  public readonly userId = computed(() => this.userSignal()?.uid ?? null);

  /**
   * Gets currently authenticated user from Firebase Auth (Legacy support)
   * @returns Current Firebase User object or null
   * @deprecated Use currentUserSignal for reactive programming
   */
  get currentUser(): User | null {
    return this.auth.currentUser;
  }

  /**
   * Generates consistent color based on email address
   * @param email - User's email address
   * @returns Hexadecimal color code
   * @private
   */
  private generateColorFromEmail(email: string): string {
    const colors = [
      "#FF7A00",
      "#FF5EB3",
      "#6E52FF",
      "#9327FF",
      "#00BEE8",
      "#1FD7C1",
      "#FF745E",
      "#FFA35E",
      "#FC71FF",
      "#FFC701",
      "#0038FF",
      "#C3FF2B",
      "#FFE62B",
      "#FF4646",
      "#FFBB2B",
    ];

    const hash = email
      .split("")
      .reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const colorIndex = hash % colors.length;
    return colors[colorIndex];
  }

  /**
   * Saves user data to Firestore
   * @param user - Firebase Auth user object
   * @param displayName - User's display name
   * @returns Promise that resolves when user data is saved
   * @private
   */
  private async saveUserToFirestore(
    user: User,
    displayName: string
  ): Promise<void> {
    const userDoc = doc(this.firestore, "users", user.uid);
    const color = this.generateColorFromEmail(user.email || "");

    const nameParts = displayName.split(" ");
    const firstName = nameParts[0] || "";
    const lastName = nameParts.slice(1).join(" ") || "";

    const initials = displayName
      ? displayName
          .split(" ")
          .map((s: string) => s[0])
          .slice(0, 2)
          .join("")
          .toUpperCase()
      : user.email?.substring(0, 2).toUpperCase() || "U";

    await setDoc(userDoc, {
      firstName: firstName,
      lastName: lastName,
      displayName: displayName,
      email: user.email,
      phone: "",
      color: color,
      initials: initials,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }

  /**
   * Ensures user exists in Firestore, creates document if not exists
   * @param user - Firebase Auth user object
   * @returns Promise that resolves when check is complete
   * @private
   */
  private async ensureUserInFirestore(user: User): Promise<void> {
    try {
      const userDoc = doc(this.firestore, "users", user.uid);
      const userSnapshot = await getDoc(userDoc);

      if (!userSnapshot.exists()) {
        const displayName =
          user.displayName || user.email?.split("@")[0] || "User";
        await this.saveUserToFirestore(user, displayName);
      }
    } catch (error) {}
  }

  /**
   * Registers new user with email and password
   * @param data - Registration data (name, email, password)
   * @returns Promise with user credentials
   */
  async signup(data: SignupData): Promise<UserCredential> {
    const userCredential = await createUserWithEmailAndPassword(
      this.auth,
      data.email,
      data.password
    );

    if (userCredential.user) {
      await updateProfile(userCredential.user, {
        displayName: data.name,
      });

      await this.saveUserToFirestore(userCredential.user, data.name);
    }
    return userCredential;
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
    await this.ensureUserInFirestore(userCredential.user);
    return userCredential;
  }

  /**
   * Logs in as guest user, creates guest account if not exists
   * @returns Promise with guest user credentials
   */
  async guestLogin(): Promise<UserCredential> {
    const guestEmail = "guest@join.com";
    const guestPassword = "GuestJoin2024!";

    try {
      return await this.login(guestEmail, guestPassword);
    } catch (error: any) {
      if (
        error.code === "auth/user-not-found" ||
        error.code === "auth/invalid-credential"
      ) {
        console.log("🔧 Guest user does not exist. Creating guest account...");

        try {
          await this.signup({
            name: "Guest User",
            email: guestEmail,
            password: guestPassword,
          });
          console.log("✅ Guest account created successfully");
          return await this.login(guestEmail, guestPassword);
        } catch (signupError: any) {
          if (signupError.code === "auth/email-already-in-use") {
            console.error(
              "❌ Guest account exists but wrong password. Please check credentials."
            );
          }
          throw signupError;
        }
      }
      throw error;
    }
  }

  /**
   * Signs in user with Google OAuth
   * @returns Promise with Google OAuth credentials
   */
  async signInWithGoogle(): Promise<UserCredential> {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({
      prompt: "select_account",
    });

    const userCredential = await signInWithPopup(this.auth, provider);
    await this.ensureUserInFirestore(userCredential.user);
    return userCredential;
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
    return this.currentUser !== null;
  }

  /**
   * Gets current user's display name (Legacy method)
   * @returns Display name or null
   * @deprecated Use userDisplayName signal instead
   */
  getUserDisplayName(): string | null {
    return this.currentUser?.displayName || null;
  }

  /**
   * Gets current user's email address (Legacy method)
   * @returns Email address or null
   * @deprecated Use userEmail signal instead
   */
  getUserEmail(): string | null {
    return this.currentUser?.email || null;
  }

  /**
   * Checks if current user is guest (Legacy method)
   * @returns True if guest, false otherwise
   * @deprecated Use isGuestUser signal instead
   */
  isGuestUserLegacy(): boolean {
    return this.currentUser?.email === "guest@join.com";
  }

  /**
   * Returns Observable that checks if user is guest
   * @returns Observable with guest status
   * @deprecated Use isGuestUser signal instead
   */
  isGuestUser$(): Observable<boolean> {
    return this.user$.pipe(map((user) => user?.email === "guest@join.com"));
  }

  /**
   * Updates display name of current user
   * @param displayName - New display name
   * @returns Promise that resolves when update is complete
   * @throws Error if no user is logged in
   */
  async updateDisplayName(displayName: string): Promise<void> {
    if (!this.currentUser) {
      throw new Error("No user is currently logged in");
    }

    try {
      await updateProfile(this.currentUser, {
        displayName: displayName,
      });

      console.log("✅ Display name updated successfully in Auth");
    } catch (error) {
      console.error("❌ Error updating display name:", error);
      throw error;
    }
  }
}
