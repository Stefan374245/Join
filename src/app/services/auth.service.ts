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
  
  user$: Observable<User | null> = authState(this.auth);
  
  get currentUser(): User | null {
    return this.auth.currentUser;
  }

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

  login(email: string, password: string): Observable<UserCredential> {
    const promise = signInWithEmailAndPassword(this.auth, email, password)
      .then(async (userCredential) => {
        await this.ensureUserInFirestore(userCredential.user);
        return userCredential;
      });
    return from(promise);
  }

  guestLogin(): Observable<UserCredential> {
    return this.login('guest@join.com', 'guest123');
  }

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

  logout(): Observable<void> {
    const promise = signOut(this.auth).then(() => {
      this.router.navigate(['/login']);
    });
    return from(promise);
  }

  isAuthenticated(): boolean {
    return this.currentUser !== null;
  }

  getUserDisplayName(): string | null {
    return this.currentUser?.displayName || null;
  }

  getUserEmail(): string | null {
    return this.currentUser?.email || null;
  }

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
