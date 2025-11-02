# 🔥 Firebase Authentication Setup Guide

## ✅ Was wurde implementiert:

### 1. **Firebase Packages installiert:**
```bash
npm install firebase @angular/fire
```

### 2. **Dateien erstellt/aktualisiert:**
- ✅ `src/environments/environment.ts` - Firebase Config (Development)
- ✅ `src/environments/environment.prod.ts` - Firebase Config (Production)
- ✅ `src/app/app.config.ts` - Firebase Provider
- ✅ `src/app/services/auth.service.ts` - Authentication Service
- ✅ `src/app/guards/auth.guard.ts` - Route Guards
- ✅ `src/app/app.routes.ts` - Protected Routes
- ✅ `src/app/components/auth/login/login.component.ts` - Firebase Login
- ✅ `src/app/components/auth/signup/signup.component.ts` - Firebase Signup

## 🚀 Nächste Schritte:

### **Schritt 1: Firebase Projekt erstellen**

1. Gehe zu [Firebase Console](https://console.firebase.google.com/)
2. Klicke auf "Projekt hinzufügen" / "Add project"
3. Gib deinem Projekt einen Namen (z.B. "Join")
4. (Optional) Google Analytics aktivieren
5. Klicke auf "Projekt erstellen"

### **Schritt 2: Web-App in Firebase registrieren**

1. In deinem Firebase-Projekt, klicke auf das Web-Icon `</>`
2. Gib deiner App einen Namen (z.B. "Join Web")
3. (Optional) Firebase Hosting aktivieren
4. Klicke auf "App registrieren"

### **Schritt 3: Firebase Config kopieren**

Nach der Registrierung siehst du den Config-Code:

```javascript
const firebaseConfig = {
  apiKey: "AIza...",
  authDomain: "join-xxxxx.firebaseapp.com",
  projectId: "join-xxxxx",
  storageBucket: "join-xxxxx.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef"
};
```

**Kopiere diese Werte in:**
- `src/environments/environment.ts`
- `src/environments/environment.prod.ts`

Ersetze die Platzhalter mit deinen echten Werten!

### **Schritt 4: Authentication aktivieren**

1. In Firebase Console, gehe zu **Authentication** im Menü
2. Klicke auf **Get started** / "Erste Schritte"
3. Wähle den Tab **Sign-in method**
4. Aktiviere **Email/Password**:
   - Klicke auf "Email/Password"
   - Toggle **Enable** / "Aktivieren"
   - Klicke auf **Save** / "Speichern"

### **Schritt 5: Firestore Database aktivieren (Optional für User-Daten)**

1. In Firebase Console, gehe zu **Firestore Database**
2. Klicke auf **Create database**
3. Wähle **Start in test mode** (für Development)
4. Wähle eine Location (z.B. europe-west3)
5. Klicke auf **Enable**

### **Schritt 6: Test-Guest Account erstellen**

1. In Firebase Console, gehe zu **Authentication** → **Users**
2. Klicke auf **Add user**
3. Email: `guest@join.com`
4. Password: `guest123`
5. Klicke auf **Add user**

## 🎯 Features implementiert:

### **AuthService Methoden:**
```typescript
// Signup
signup(data: SignupData): Observable<UserCredential>

// Login
login(email: string, password: string): Observable<UserCredential>

// Guest Login
guestLogin(): Observable<UserCredential>

// Logout
logout(): Observable<void>

// Check if authenticated
isAuthenticated(): boolean

// Get user info
getUserDisplayName(): string | null
getUserEmail(): string | null

// Observable of current user
user$: Observable<User | null>
```

### **Route Guards:**
- ✅ **authGuard** - Schützt authentifizierte Routes (board, contacts, summary)
- ✅ **guestGuard** - Verhindert Zugriff auf login/signup wenn eingeloggt

### **Error Handling:**
- ✅ `auth/user-not-found` - User existiert nicht
- ✅ `auth/wrong-password` - Falsches Passwort
- ✅ `auth/invalid-email` - Ungültige Email
- ✅ `auth/email-already-in-use` - Email bereits registriert
- ✅ `auth/weak-password` - Passwort zu schwach
- ✅ `auth/too-many-requests` - Zu viele Versuche

## 🧪 Testen:

### **1. Registrierung testen:**
```
1. Starte App: npm start
2. Gehe zu /signup
3. Fülle Formular aus
4. Klicke "Sign up"
5. → Sollte erfolgreich registrieren und zu /login weiterleiten
```

### **2. Login testen:**
```
1. Gehe zu /login
2. Email: (deine registrierte Email)
3. Password: (dein Passwort)
4. Klicke "Log in"
5. → Sollte erfolgreich einloggen und zu /summary weiterleiten
```

### **3. Guest Login testen:**
```
1. Gehe zu /login
2. Klicke "Guest Log in"
3. → Sollte mit guest@join.com einloggen
```

### **4. Protected Routes testen:**
```
1. Logge dich aus (oder öffne Incognito)
2. Versuche direkt zu /summary zu gehen
3. → Sollte zu /login umleiten
```

## 📋 Firestore Security Rules (Optional):

Wenn du Firestore verwendest, füge diese Rules hinzu:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users collection
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Tasks collection
    match /tasks/{taskId} {
      allow read, write: if request.auth != null;
    }
    
    // Contacts collection
    match /contacts/{contactId} {
      allow read, write: if request.auth != null;
    }
  }
}
```

## 🔒 Sicherheit:

### **Wichtig:**
- ❌ **Niemals** Firebase Config in Git committen (wenn sie Secrets enthält)
- ✅ Verwende Firebase Security Rules
- ✅ Validiere Daten auf Server-Seite (Firebase Functions)
- ✅ Implementiere Rate Limiting

### **Environment Variables (Optional):**
Für mehr Sicherheit, verwende Environment Variables:

```typescript
// environment.ts
export const environment = {
  production: false,
  firebase: {
    apiKey: process.env['FIREBASE_API_KEY'],
    authDomain: process.env['FIREBASE_AUTH_DOMAIN'],
    // ...
  }
};
```

## 🎨 UI Features:

- ✅ Loading States während Authentication
- ✅ Error Messages mit Firebase Error Codes
- ✅ Success Messages nach Login/Signup
- ✅ Automatische Weiterleitung nach erfolgreicher Auth
- ✅ Password Visibility Toggle
- ✅ Form Validation

## 📝 Nächste Erweiterungen:

1. **Password Reset:**
   ```typescript
   sendPasswordResetEmail(email: string): Observable<void>
   ```

2. **Email Verification:**
   ```typescript
   sendEmailVerification(): Observable<void>
   ```

3. **Social Login (Google, etc.):**
   ```typescript
   signInWithGoogle(): Observable<UserCredential>
   ```

4. **User Profile in Firestore:**
   ```typescript
   createUserProfile(user: User): Observable<void>
   ```

5. **Remember Me / Persistence:**
   ```typescript
   setPersistence(type: 'local' | 'session'): Observable<void>
   ```

---

**Alles ist vorbereitet! Füge einfach deine Firebase Config hinzu und teste die Authentication! 🎉**
