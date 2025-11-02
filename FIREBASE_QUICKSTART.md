# 🔥 Firebase Authentication - Quick Reference

## ⚡ Schnellstart (5 Minuten)

### 1. Firebase Config einfügen
```typescript
// src/environments/environment.ts
export const environment = {
  production: false,
  firebase: {
    apiKey: "DEINE_API_KEY",              // ← Hier einfügen
    authDomain: "DEIN_PROJECT.firebaseapp.com",
    projectId: "DEIN_PROJECT_ID",
    storageBucket: "DEIN_PROJECT.appspot.com",
    messagingSenderId: "DEINE_SENDER_ID",
    appId: "DEINE_APP_ID"
  }
};
```

### 2. Firebase Console Setup
1. [Firebase Console](https://console.firebase.google.com/) öffnen
2. Neues Projekt erstellen
3. Web-App hinzufügen (`</>` Icon)
4. Authentication → Email/Password aktivieren
5. Test-User erstellen: `guest@join.com` / `guest123`

### 3. Testen
```bash
npm start
# Gehe zu http://localhost:4200/signup
```

## 🎯 AuthService Usage

### Login
```typescript
this.authService.login(email, password).subscribe({
  next: (user) => console.log('Logged in:', user),
  error: (err) => console.error('Login failed:', err)
});
```

### Signup
```typescript
this.authService.signup({ name, email, password }).subscribe({
  next: (user) => console.log('Signed up:', user),
  error: (err) => console.error('Signup failed:', err)
});
```

### Logout
```typescript
this.authService.logout().subscribe();
```

### Current User
```typescript
// Observable
this.authService.user$.subscribe(user => {
  if (user) console.log('User:', user.email);
});

// Synchronous
const user = this.authService.currentUser;
const name = this.authService.getUserDisplayName();
const email = this.authService.getUserEmail();
```

## 🛡️ Route Guards

### Protect Routes
```typescript
// app.routes.ts
{
  path: 'dashboard',
  component: DashboardComponent,
  canActivate: [authGuard]  // ← Nur für eingeloggte User
}
```

### Guest Only Routes
```typescript
{
  path: 'login',
  component: LoginComponent,
  canActivate: [guestGuard]  // ← Nur für nicht-eingeloggte User
}
```

## ❌ Error Codes

| Code | Bedeutung | Action |
|------|-----------|---------|
| `auth/user-not-found` | Email nicht registriert | Zeige "Konto existiert nicht" |
| `auth/wrong-password` | Falsches Passwort | Zeige "Falsches Passwort" |
| `auth/email-already-in-use` | Email bereits registriert | Zeige "Email bereits verwendet" |
| `auth/weak-password` | Passwort zu schwach | Zeige "Mindestens 6 Zeichen" |
| `auth/invalid-email` | Ungültige Email | Zeige "Ungültige Email" |
| `auth/too-many-requests` | Zu viele Versuche | Zeige "Zu viele Versuche" |

## 📁 Dateien Overview

```
src/
├── environments/
│   ├── environment.ts          ← Firebase Config hier!
│   └── environment.prod.ts
├── app/
│   ├── app.config.ts          ← Firebase Provider
│   ├── app.routes.ts          ← Protected Routes
│   ├── guards/
│   │   └── auth.guard.ts      ← authGuard, guestGuard
│   ├── services/
│   │   └── auth.service.ts    ← Authentication Logic
│   └── components/
│       └── auth/
│           ├── login/         ← Login mit Firebase
│           └── signup/        ← Signup mit Firebase
```

## 🔑 Firebase Console URLs

- **Console:** https://console.firebase.google.com/
- **Authentication:** → Authentication → Users
- **Database:** → Firestore Database
- **Settings:** → Project Settings → General

## ✅ Checklist

- [ ] Firebase Projekt erstellt
- [ ] Web-App registriert
- [ ] Firebase Config in `environment.ts` eingefügt
- [ ] Email/Password Authentication aktiviert
- [ ] Guest-Account erstellt (`guest@join.com`)
- [ ] `npm install firebase @angular/fire` ausgeführt
- [ ] App gestartet und getestet

---

**Bei Problemen:** Siehe `FIREBASE_SETUP.md` für Details!
