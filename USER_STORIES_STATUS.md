# Join - User Stories Implementation Status

## ✅ User Story 1: Benutzerregistrierung (COMPLETED)

### Anforderungen:
- [x] Registrierungsformular mit E-Mail, Name und Passwort
- [x] Datenschutzerklärung muss akzeptiert werden
- [x] Fehlermeldungen bei falscher Eingabe
- [x] "Registrieren"-Button ist deaktiviert, solange nicht alle Pflichtfelder ausgefüllt sind

### Implementierung:
- **Komponente**: `src/app/components/auth/signup/signup.component.ts`
- **Validierung**:
  - Name: Mindestens 2 Zeichen
  - Email: Muss @ enthalten
  - Passwort: Mindestens 6 Zeichen
  - Passwort-Bestätigung: Muss mit Passwort übereinstimmen
  - Privacy Policy: Muss akzeptiert werden
- **Button-State**: `isSignupButtonDisabled()` - Button ist disabled bis alle Felder valide sind
- **Fehlermeldungen**: Spezifische Fehler für:
  - Ungültige Email
  - Email bereits registriert
  - Schwaches Passwort
  - Fehlende Pflichtfelder

### Firebase Integration:
- User wird in **Firebase Authentication** erstellt
- User-Profil wird in **Firestore Collection "users"** gespeichert mit:
  - displayName
  - email
  - color (automatisch generiert basierend auf Email)
  - createdAt
  - updatedAt

---

## ✅ User Story 2: Benutzeranmeldung (COMPLETED)

### Anforderungen:
- [x] Login-Formular mit E-Mail und Passwort
- [x] Fehlermeldungen bei falscher Eingabe
- [x] Option für Gast-Login
- [x] Nicht angemeldete Besucher werden auf Login-Seite weitergeleitet

### Implementierung:
- **Komponente**: `src/app/components/auth/login/login.component.ts`
- **Login-Methoden**:
  1. Email/Password Login
  2. Gast-Login (guest@join.com)
  3. Google Sign-In
- **Button-State**: `isLoginButtonDisabled()` - Button ist disabled bis Email und Passwort valide sind
- **Fehlermeldungen**: Spezifische Fehler für:
  - Falsches Passwort
  - User nicht gefunden
  - Ungültige Email
  - Zu viele Login-Versuche

### Route Guards:
- **authGuard** (`src/app/guards/auth.guard.ts`):
  - Schützt: `/summary`, `/board`, `/contacts`
  - Redirect zu `/login` wenn nicht authentifiziert
- **guestGuard**:
  - Schützt: `/login`, `/signup`
  - Redirect zu `/summary` wenn bereits authentifiziert

---

## ✅ User Story 3: Abmeldung (COMPLETED)

### Anforderungen:
- [x] "Logout"-Option in der Benutzeroberfläche
- [x] Sicheres Ausloggen und Weiterleitung zum Login
- [x] Persönliche Daten nicht mehr zugänglich nach Logout

### Implementierung:
- **Header Component** (`src/app/layout/header/header.component.ts`):
  - User-Avatar mit Dropdown-Menü
  - Logout-Button im Dropdown
  - `logout()` Methode ruft `authService.logout()` auf
- **AuthService** (`src/app/services/auth.service.ts`):
  - `logout()` ruft Firebase `signOut()` auf
  - Navigiert zu `/login`
  - Löscht Session automatisch

---

## ⏳ User Story 4: Dashboard (TODO)

### Anforderungen:
- [ ] Dashboard zeigt Anzahl der Tasks bis zur nächsten Deadline
- [ ] Dashboard zeigt Anzahl der Tasks in ToDo, In Progress, Awaiting Feedback, Done
- [ ] Begrüßungsnachricht abhängig von Tageszeit

### Nächste Schritte:
1. **Task Interface** erstellen (`src/app/models/task.interface.ts`)
2. **TaskService** implementieren (`src/app/services/task.service.ts`)
3. **Summary Component** erweitern (`src/app/components/summary/summary-view/summary-view.component.ts`)

---

## 🔧 Firebase Setup

### Firestore Collections:
1. **users** - Gespeicherte User-Profile
   ```typescript
   {
     displayName: string,
     email: string,
     color: string,
     createdAt: string,
     updatedAt: string
   }
   ```

2. **tasks** (noch zu implementieren)
   ```typescript
   {
     title: string,
     description: string,
     status: 'todo' | 'in-progress' | 'awaiting-feedback' | 'done',
     priority: 'low' | 'medium' | 'urgent',
     dueDate: string,
     assignedTo: string[], // User IDs
     createdBy: string,
     createdAt: string,
     updatedAt: string
   }
   ```

### Firestore Security Rules:
Siehe `FIRESTORE_RULES.md` für aktuelle Rules.

**Wichtig**: Rules müssen in Firebase Console publiziert werden!
https://console.firebase.google.com/project/join-angular-based/firestore/rules

---

## 📝 Testing Checklist

### Registrierung:
- [ ] Neue User registrieren
- [ ] Email-Validierung prüfen
- [ ] Passwort-Stärke prüfen
- [ ] Privacy Policy Checkbox erforderlich
- [ ] Button disabled bei unvollständigen Feldern
- [ ] User erscheint in Firebase Auth
- [ ] User-Dokument in Firestore "users" erstellt
- [ ] Weiterleitung zu Login nach erfolgreicher Registrierung

### Login:
- [ ] Login mit registriertem User
- [ ] Gast-Login testen
- [ ] Google Sign-In testen
- [ ] Button disabled bei unvollständigen Feldern
- [ ] Fehlermeldung bei falschem Passwort
- [ ] Weiterleitung zu Summary nach Login

### Logout:
- [ ] Logout-Button im Header funktioniert
- [ ] Weiterleitung zu Login nach Logout
- [ ] Geschützte Routen nicht mehr zugänglich

### Route Guards:
- [ ] Nicht-authentifizierte User werden zu /login umgeleitet
- [ ] Authentifizierte User können nicht zu /login
- [ ] Summary/Board/Contacts sind geschützt

---

## 🚀 Deployment Hinweise

### Vor Production:
1. ✅ Firebase Config in `environment.ts` aktualisieren
2. ✅ Firestore Rules publizieren
3. ⏳ Guest Account erstellen (guest@join.com)
4. ⏳ Production Rules verschärfen (siehe FIRESTORE_RULES.md)
5. ⏳ Error Tracking einrichten
6. ⏳ Analytics einrichten

### Performance:
- Firebase Auth State wird gecached
- Firestore Queries verwenden Indexes
- Route Guards mit `take(1)` für einmalige Checks
