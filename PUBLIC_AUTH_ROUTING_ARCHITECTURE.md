# 🌐 Public & Auth Routing Architecture - Complete Analysis

> **Als erfahrener Angular Developer mit 20 Jahren Erfahrung analysiert**

## 📊 Drei-Schichten-Routing-System

### **Architektur Overview:**

```
┌─────────────────────────────────────────────────────────────────┐
│                    App Start (/)                                 │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ↓ Redirect to /logo-animation
┌─────────────────────────────────────────────────────────────────┐
│  LAYER 1: INITIAL EXPERIENCE (Fullscreen, Animation)            │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  🎬 Logo Animation (2.5s)                                 │  │
│  │  Component: LogoAnimationComponent                        │  │
│  │  Path: src/app/components/auth/logo-animation/           │  │
│  │  Guard: guestGuard (nur wenn NICHT eingeloggt)          │  │
│  └───────────────────────────────────────────────────────────┘  │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ↓ Auto-redirect nach 2.5s
┌─────────────────────────────────────────────────────────────────┐
│  LAYER 2: PUBLIC WELCOME FLOW (Marketing/Info)                  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  🏠 Welcome Hub                                           │  │
│  │  Component: WelcomeComponent                              │  │
│  │  Path: src/app/components/welcome/welcome/               │  │
│  │  Guard: guestGuard                                        │  │
│  │                                                            │  │
│  │  User Decision Point:                                     │  │
│  │  ├─ "Create Request" → /stakeholder                      │  │
│  │  └─ "Member log in" → /login                             │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  📋 Stakeholder Flow                                      │  │
│  │  /stakeholder → /feature-request → /emailmask            │  │
│  │  Path: src/app/components/welcome/stakeholder/           │  │
│  │  Path: src/app/components/welcome/feature-request/       │  │
│  │  Path: src/app/components/welcome/email-mask/            │  │
│  │  Guard: KEINE (öffentlich zugänglich)                    │  │
│  │                                                            │  │
│  │  Navigation Pattern:                                      │  │
│  │  Back Links: → /welcome                                   │  │
│  │  Forward Flow: stakeholder → feature-request → emailmask │  │
│  └───────────────────────────────────────────────────────────┘  │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ↓ User wählt "Member log in"
┌─────────────────────────────────────────────────────────────────┐
│  LAYER 3: AUTHENTICATION (Login/Signup)                         │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  🔐 Login & Signup                                        │  │
│  │  Component: LoginComponent, SignupComponent               │  │
│  │  Path: src/app/components/auth/login/                    │  │
│  │  Path: src/app/components/auth/signup/                   │  │
│  │  Guard: guestGuard (login), KEINE (signup)               │  │
│  │                                                            │  │
│  │  Nach erfolgreichem Login:                                │  │
│  │  → Redirect zu /summary (MainLayout erscheint)           │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                         │
                         ↓ authService.login() erfolgt
┌─────────────────────────────────────────────────────────────────┐
│  MAIN APPLICATION (mit Header/Sidebar)                          │
│  /summary, /board, /add-task, /contacts, etc.                   │
│  Guard: authGuard (nur wenn eingeloggt)                         │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🗂️ Folder-Struktur vs. Route-Logik

### **WICHTIG: Folder-Organisation-Inkonsistenz**

```
src/app/components/
├── auth/                          ← Authentication & Initial Experience
│   ├── login/                     ✅ Layer 3: Auth
│   ├── signup/                    ✅ Layer 3: Auth
│   └── logo-animation/            ⚠️  Layer 1: Initial (sollte in welcome/ sein?)
│
└── welcome/                       ← Public Marketing & Stakeholder Flow
    ├── welcome/                   ✅ Layer 2: Public Hub
    ├── stakeholder/               ✅ Layer 2: Public Flow
    ├── feature-request/           ✅ Layer 2: Public Flow
    └── email-mask/                ✅ Layer 2: Public Flow
```

**Analyse:**
- **Logisch:** `logo-animation` ist der **Einstiegspunkt für nicht-angemeldete User** → gehört konzeptionell zu "Welcome Experience"
- **Aktuell:** `logo-animation` liegt in `auth/` Folder → historisch gewachsen
- **Best Practice:** Entweder:
  1. `logo-animation` nach `welcome/` verschieben (logische Gruppierung)
  2. ODER `auth/` umbenennen zu `public/` (beinhaltet Initial + Auth)

**Empfehlung:** Für jetzt beibehalten (funktioniert), aber für Refactoring dokumentieren.

---

## 🧭 Kompletter User Journey Flow

### **Journey 1: Neuer Besucher (Nicht angemeldet)**

```typescript
// 1️⃣ App Start
URL: '/'
↓ Redirect
URL: '/logo-animation'
Component: LogoAnimationComponent
Layout: Fullscreen (100vh), keine Navigation
Guard: guestGuard ✅
isAuthPage: true

// 2️⃣ Animation läuft 2.5 Sekunden
setTimeout(() => {
  this.router.navigate(['/welcome']);
}, 2500);

// 3️⃣ Automatischer Redirect zur Welcome Page
URL: '/welcome'
Component: WelcomeComponent
Layout: Fullscreen, zentrierte Card
Guard: guestGuard ✅
isAuthPage: true

User sieht 2 Optionen:
├─ Button: "Create Request" [routerLink="/stakeholder"]
└─ Button: "Member log in" [routerLink="/login"]

// 4a️⃣ Option A: User ist Stakeholder
User klickt "Create Request"
↓
URL: '/stakeholder'
Component: StakeholderComponent
Layout: Fullscreen Form
Guard: KEINE (public)
isAuthPage: true

User gibt Name/Email ein → Klickt "Next"
↓
URL: '/feature-request'
Component: FeatureRequestComponent
Layout: Fullscreen Form mit Tabs
Guard: KEINE (public)
isAuthPage: true

User wählt Tab "Via Web Form"
↓
URL: '/emailmask'
Component: EmailMaskComponent
Layout: Fullscreen Form
Guard: KEINE (public)
isAuthPage: true

User füllt Formular aus → Fertig ✅

// 4b️⃣ Option B: User ist Team Member
User klickt "Member log in"
↓
URL: '/login'
Component: LoginComponent
Layout: Fullscreen, zentrierte Card
Guard: guestGuard ✅
isAuthPage: true

User gibt Email/Password ein → Login erfolgreich
↓ authService.login()
↓ router.navigate(['/summary'])
↓
URL: '/summary'
Component: SummaryViewComponent
Layout: MainLayout (Header + Sidebar + Content)
Guard: authGuard ✅
isAuthPage: false ← LAYOUT WECHSEL!

// User ist jetzt in der Main App
Sidebar Navigation verfügbar:
- Summary
- Board
- Add Task
- Contacts
```

---

### **Journey 2: Wiederkehrender User (Bereits angemeldet)**

```typescript
// 1️⃣ App Start mit Token in localStorage
URL: '/'
↓ Redirect
URL: '/logo-animation'
↓ guestGuard prüft authService.isAuthenticated()
↓ User ist eingeloggt!
↓ guestGuard.canActivate() = false
↓ Redirect zu '/summary'

URL: '/summary'
Component: SummaryViewComponent
Layout: MainLayout sofort sichtbar
Guard: authGuard ✅
isAuthPage: false

// User sieht direkt die Main App
✅ Keine Animation
✅ Keine Welcome Page
✅ Direkt ins Dashboard
```

---

### **Journey 3: User loggt sich aus**

```typescript
// User ist in der Main App (/summary)
URL: '/summary'
Layout: MainLayout sichtbar
isAuthPage: false

// User klickt Logout Button im Header
authService.logout();
↓ localStorage.clear()
↓ router.navigate(['/login'])

URL: '/login'
Component: LoginComponent
Layout: Fullscreen (MainLayout verschwindet!)
isAuthPage: true ← LAYOUT WECHSEL!

// User ist wieder im Public Area
```

---

## 📋 Route-Kategorien Detail-Analyse

### **Category 1: Initial Experience (1 Route)**

| Route              | Component                 | Folder           | Guard      | Auto-Redirect | Layout    |
|--------------------|---------------------------|------------------|------------|---------------|-----------|
| `/`                | → Redirect                | -                | -          | /logo-animation | -       |
| `/logo-animation`  | LogoAnimationComponent    | `auth/`          | guestGuard | /welcome (2.5s) | Fullscreen |

**Eigenschaften:**
- ✅ Einstiegspunkt der App
- ✅ 2.5 Sekunden Animation
- ✅ Automatischer Redirect zu `/welcome`
- ✅ `guestGuard` verhindert Zugriff wenn eingeloggt
- ✅ `isAuthPage = true` (kein MainLayout)

**Code:**
```typescript
// logo-animation.component.ts
setTimeout(() => {
  this.animationState = 'final';
  this.animationComplete.emit();
  this.router.navigate(['/welcome']); // ← Auto-Redirect
}, 2500);
```

---

### **Category 2: Public Welcome Flow (4 Routes)**

| Route              | Component                 | Folder              | Guard      | Navigation Options              |
|--------------------|---------------------------|---------------------|------------|---------------------------------|
| `/welcome`         | WelcomeComponent          | `welcome/welcome/`  | guestGuard | → /stakeholder, → /login        |
| `/stakeholder`     | StakeholderComponent      | `welcome/stakeholder/` | KEINE   | ← /welcome, → /feature-request  |
| `/feature-request` | FeatureRequestComponent   | `welcome/feature-request/` | KEINE | ← /welcome, → /emailmask     |
| `/emailmask`       | EmailMaskComponent        | `welcome/email-mask/` | KEINE    | ← /feature-request              |

**Eigenschaften:**
- ✅ Alle im `welcome/` Folder (logisch gruppiert)
- ✅ Für **nicht-angemeldete User** gedacht
- ✅ `/welcome` hat `guestGuard`, Rest ist public
- ⚠️  **Wichtig:** Stakeholder Flow hat KEINE Guards → auch angemeldete User könnten zugreifen (Feature?)
- ✅ `isAuthPage = true` (kein MainLayout)
- ✅ Alle haben "Back to Welcome" Links

**Navigation Pattern:**
```
welcome (Hub)
  ├─ stakeholder → feature-request → emailmask (Stakeholder Journey)
  └─ login (Member Journey)
```

**Code:**
```html
<!-- welcome.component.html -->
<button routerLink="/stakeholder">Create Request</button>
<button routerLink="/login">Member log in</button>

<!-- stakeholder.component.html -->
<a routerLink="/welcome" class="back-link">Back</a>
```

---

### **Category 3: Authentication (2 Routes)**

| Route              | Component                 | Folder           | Guard      | Post-Login Redirect |
|--------------------|---------------------------|------------------|------------|---------------------|
| `/login`           | LoginComponent            | `auth/login/`    | guestGuard | → /summary          |
| `/signup`          | SignupComponent           | `auth/signup/`   | KEINE      | → /login (meist)    |

**Eigenschaften:**
- ✅ Im `auth/` Folder (konzeptionell Auth-Logik)
- ✅ `/login` hat `guestGuard` (eingeloggte User werden zu /summary redirected)
- ⚠️  `/signup` hat **KEINE Guard** → auch eingeloggte User können Sign-Up Page sehen (Bug oder Feature?)
- ✅ `isAuthPage = true` (kein MainLayout)
- ✅ Nach Login: Redirect zu `/summary` → `isAuthPage = false` → MainLayout erscheint

**Code:**
```typescript
// auth.service.ts
async login(email: string, password: string) {
  // ... Firebase Auth
  localStorage.setItem('userToken', token);
  this.router.navigate(['/summary']); // ← Redirect ins MainLayout
}
```

---

### **Category 4: Main Application (8+ Routes)**

| Route              | Component                 | Guard      | Layout Mixin              |
|--------------------|---------------------------|------------|---------------------------|
| `/summary`         | SummaryViewComponent      | authGuard  | `page-layout-standard`    |
| `/board`           | BoardViewComponent        | authGuard  | `page-layout-board`       |
| `/add-task`        | AddTaskComponent          | authGuard  | `page-layout-standard`    |
| `/contacts`        | ContactsListComponent     | authGuard  | `page-layout-contacts`    |
| `/contacts/:email` | ContactDetailComponent    | authGuard  | `page-layout-contacts`    |
| `/legal-notice`    | LegalNoticeComponent      | KEINE      | `page-layout-standard`    |
| `/privacy-policy`  | PrivacyPolicyComponent    | KEINE      | `page-layout-standard`    |
| `/help`            | HelpComponent             | KEINE      | `page-layout-standard`    |

**Eigenschaften:**
- ✅ `isAuthPage = false` → MainLayout aktiv
- ✅ Header (90px) + Sidebar (200px) + Content Area
- ✅ Meiste haben `authGuard` (außer Legal/Privacy/Help)
- ✅ Nutzen Layout Mixins aus `_page-layouts.scss`

---

## 🛡️ Guard-Strategie Deep-Dive

### **guestGuard - "Nur für ausgeloggte User"**

```typescript
// auth.guard.ts
export const guestGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAuthenticated()) {
    // User ist eingeloggt → darf NICHT auf Guest Pages
    router.navigate(['/summary']);
    return false;
  }
  
  return true; // User ist ausgeloggt → Zugriff erlaubt
};
```

**Angewendet auf:**
- `/logo-animation` ✅
- `/welcome` ✅
- `/login` ✅

**Verhalten:**
- ✅ Verhindert dass eingeloggte User auf Welcome/Login Pages kommen
- ✅ Redirect zu `/summary` wenn Token vorhanden

---

### **authGuard - "Nur für eingeloggte User"**

```typescript
// auth.guard.ts
export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.isAuthenticated()) {
    // User ist NICHT eingeloggt → darf nicht auf geschützte Pages
    router.navigate(['/login']);
    return false;
  }
  
  return true; // User ist eingeloggt → Zugriff erlaubt
};
```

**Angewendet auf:**
- `/board` ✅
- `/add-task` ✅
- `/contacts` ✅
- `/summary` ✅

**Verhalten:**
- ✅ Schützt Main App Pages
- ✅ Redirect zu `/login` wenn kein Token

---

### **KEINE Guard - "Public Pages"**

**Angewendet auf:**
- `/stakeholder` ⚠️
- `/feature-request` ⚠️
- `/emailmask` ⚠️
- `/signup` ⚠️
- `/legal-notice` ✅
- `/privacy-policy` ✅
- `/help` ✅

**Analyse:**
1. **Stakeholder Flow (kein Guard):**
   - ✅ **Gewollt**: Stakeholder sollen ohne Account Requests erstellen können
   - ⚠️  **Problem**: Eingeloggte User können auch auf diese Pages → sehen kein MainLayout
   - 💡 **Empfehlung**: Entweder OK (Feature) ODER `guestGuard` hinzufügen

2. **Legal/Privacy/Help (kein Guard):**
   - ✅ **Korrekt**: Diese Pages sollen für alle zugänglich sein
   - ⚠️  **Problem**: Kein MainLayout weil `isAuthPage` Detection fehlt!
   - 🔥 **BUG GEFUNDEN**: Diese Routes sind NICHT in `isAuthPage` Detection!

---

## 🐛 **BUG: Legal/Privacy/Help Routes fehlen in isAuthPage Detection!**

### **Aktueller Code:**

```typescript
// app.component.ts
this.isAuthPage = url.startsWith('/login') ||
                 url.startsWith('/signup') ||
                 url.startsWith('/logo-animation') ||
                 url.startsWith('/welcome') ||
                 url.startsWith('/stakeholder') ||
                 url.startsWith('/feature-request') ||
                 url.startsWith('/emailmask');
```

**Problem:**
- `/legal-notice`, `/privacy-policy`, `/help` sind **NICHT** in der Liste!
- → `isAuthPage = false` → MainLayout wird angezeigt
- → Das ist vermutlich **KORREKT** (diese Pages sollen in MainLayout sein wenn eingeloggt)

**Aber:** Wenn **nicht eingeloggt** → zeigen diese Pages MainLayout ohne Inhalt (Header/Sidebar leer)

---

## 💡 Empfehlungen für optimale Architektur

### **1. Folder-Struktur refactoren (Optional)**

**Option A: Welcome-First Struktur**
```
src/app/components/
├── public/                        ← Alle nicht-authentifizierten Pages
│   ├── initial/
│   │   └── logo-animation/        ← verschoben von auth/
│   ├── welcome/
│   │   ├── welcome/
│   │   ├── stakeholder/
│   │   ├── feature-request/
│   │   └── email-mask/
│   └── auth/
│       ├── login/
│       └── signup/
│
└── main/                          ← Alle authentifizierten Pages
    ├── summary/
    ├── board/
    ├── add-task/
    └── contacts/
```

**Option B: Feature Module Struktur** (Best Practice für große Apps)
```
src/app/
├── features/
│   ├── public/                    ← Feature Module
│   │   ├── public.module.ts
│   │   ├── public.routes.ts
│   │   └── components/
│   │       ├── logo-animation/
│   │       ├── welcome/
│   │       └── stakeholder/
│   │
│   ├── auth/                      ← Feature Module
│   │   ├── auth.module.ts
│   │   ├── auth.routes.ts
│   │   └── components/
│   │
│   └── main/                      ← Feature Module (lazy loaded)
│       ├── main.module.ts
│       ├── main.routes.ts
│       └── components/
```

---

### **2. Lazy Loading implementieren**

```typescript
// app.routes.ts - OPTIMIERT
export const routes: Routes = [
  { path: '', redirectTo: '/logo-animation', pathMatch: 'full' },
  
  // Public Feature Module (Lazy Loaded)
  {
    path: '',
    loadChildren: () => import('./features/public/public.routes')
      .then(m => m.PUBLIC_ROUTES)
  },
  
  // Auth Feature Module (Lazy Loaded)
  {
    path: '',
    loadChildren: () => import('./features/auth/auth.routes')
      .then(m => m.AUTH_ROUTES)
  },
  
  // Main App (Lazy Loaded, Protected)
  {
    path: '',
    canActivate: [authGuard],
    loadChildren: () => import('./features/main/main.routes')
      .then(m => m.MAIN_ROUTES)
  },
  
  { path: '**', redirectTo: '/login' }
];
```

**Vorteile:**
- ✅ Initial Bundle Size: Nur Logo Animation + Welcome geladen
- ✅ Auth Module: Nur geladen wenn User zu /login navigiert
- ✅ Main App: Nur geladen nach erfolgreichem Login
- ✅ Performance: Schnellerer Initial Load

---

### **3. Guard-Strategie optimieren**

```typescript
// app.routes.ts - Klare Guard-Zuordnung
export const routes: Routes = [
  // Layer 1: Initial (guestGuard)
  {
    path: 'logo-animation',
    component: LogoAnimationComponent,
    canActivate: [guestGuard]
  },
  
  // Layer 2: Welcome Flow (guestGuard für Hub)
  {
    path: 'welcome',
    component: WelcomeComponent,
    canActivate: [guestGuard]
  },
  {
    path: 'stakeholder',
    component: StakeholderComponent,
    canActivate: [guestGuard] // ← NEU: Verhindert Zugriff wenn eingeloggt
  },
  // ... weitere Welcome Pages
  
  // Layer 3: Auth (guestGuard)
  {
    path: 'login',
    component: LoginComponent,
    canActivate: [guestGuard]
  },
  {
    path: 'signup',
    component: SignupComponent,
    canActivate: [guestGuard] // ← NEU: Konsistenz
  },
  
  // Layer 4: Main App (authGuard)
  // ... alle mit authGuard
  
  // Public Pages (DUAL ACCESS)
  {
    path: 'legal-notice',
    component: LegalNoticeComponent
    // ← KEIN Guard: Beide User-Typen können zugreifen
    // ← MainLayout erscheint NUR wenn eingeloggt
  }
];
```

---

### **4. Routing-Strategie für Legal/Privacy/Help**

**Problem:** Diese Pages sollen für **beide** User-Typen zugänglich sein.

**Lösung A: Conditional Layout (AKTUELL)**
```typescript
// app.component.ts bleibt wie ist
// Legal/Privacy/Help werden NICHT zu isAuthPage hinzugefügt
// → Eingeloggt: MainLayout ✅
// → Ausgeloggt: MainLayout (aber leer) ⚠️
```

**Lösung B: Dual Pages (Empfohlen)**
```typescript
// Zwei Versionen der gleichen Seiten
export const routes: Routes = [
  // Public Version (ohne MainLayout)
  {
    path: 'public/legal-notice',
    component: LegalNoticeComponent
  },
  
  // Main App Version (mit MainLayout)
  {
    path: 'legal-notice',
    component: LegalNoticeComponent,
    canActivate: [authGuard]
  },
  
  // Footer/Links passen sich an:
  // Ausgeloggt: routerLink="/public/legal-notice"
  // Eingeloggt: routerLink="/legal-notice"
];
```

**Lösung C: Footer Component mit eigenem Layout (Best Practice)**
```typescript
// Diese Pages bekommen eigenes Footer-Layout
// Kein MainLayout, aber eigenes Header/Footer
@Component({
  selector: 'app-legal-notice',
  template: `
    <div class="legal-page">
      <app-public-header></app-public-header>
      <main><!-- Content --></main>
      <app-footer></app-footer>
    </div>
  `
})
```

---

## 🎯 Migration Plan Update

### **Phase 0: Route Cleanup (NEU)**

**Tasks:**
- [ ] **Entscheiden:** Sollen Stakeholder Routes `guestGuard` bekommen?
- [ ] **Entscheiden:** Soll `/signup` `guestGuard` bekommen?
- [ ] **Entscheiden:** Wie sollen Legal/Privacy/Help für ausgeloggte User aussehen?
- [ ] **Optional:** Logo-Animation von `auth/` nach `welcome/initial/` verschieben
- [ ] **Optional:** Feature Modules + Lazy Loading implementieren

---

### **Phase 1-5: Bleibt wie dokumentiert**

**Keine Änderungen** an der Component-Migration nötig!

**Grund:**
- ✅ Alle Welcome/Auth Pages haben bereits ihr eigenes Styling (Fullscreen)
- ✅ Keine Mixins nötig (kein MainLayout)
- ✅ Migration betrifft nur Main App Pages (Summary, Board, Contacts, etc.)

---

## 📊 Finale Route-zu-Layout-Mapping

| Layer | Route              | Component          | Folder                  | Guard      | isAuthPage | MainLayout | Mixin nötig? |
|-------|--------------------|--------------------|-------------------------|------------|------------|------------|--------------|
| **1** | `/`                | Redirect           | -                       | -          | -          | ❌         | ❌           |
| **1** | `/logo-animation`  | LogoAnimation      | `auth/logo-animation/`  | guestGuard | ✅ true    | ❌         | ❌           |
| **2** | `/welcome`         | Welcome            | `welcome/welcome/`      | guestGuard | ✅ true    | ❌         | ❌           |
| **2** | `/stakeholder`     | Stakeholder        | `welcome/stakeholder/`  | KEINE      | ✅ true    | ❌         | ❌           |
| **2** | `/feature-request` | FeatureRequest     | `welcome/feature-request/` | KEINE   | ✅ true    | ❌         | ❌           |
| **2** | `/emailmask`       | EmailMask          | `welcome/email-mask/`   | KEINE      | ✅ true    | ❌         | ❌           |
| **3** | `/login`           | Login              | `auth/login/`           | guestGuard | ✅ true    | ❌         | ❌           |
| **3** | `/signup`          | Signup             | `auth/signup/`          | KEINE      | ✅ true    | ❌         | ❌           |
| **4** | `/summary`         | SummaryView        | `summary/`              | authGuard  | ❌ false   | ✅         | ✅ Standard  |
| **4** | `/board`           | BoardView          | `board/`                | authGuard  | ❌ false   | ✅         | ✅ Board     |
| **4** | `/add-task`        | AddTask            | `add-task/`             | authGuard  | ❌ false   | ✅         | ✅ Standard  |
| **4** | `/contacts`        | ContactsList       | `contacts/`             | authGuard  | ❌ false   | ✅         | ✅ Contacts  |
| **4** | `/contacts/:email` | ContactDetail      | `contacts/`             | authGuard  | ❌ false   | ✅         | ✅ Contacts  |
| **4** | `/legal-notice`    | LegalNotice        | `legal-notice/`         | KEINE      | ❌ false   | ✅         | ✅ Standard  |
| **4** | `/privacy-policy`  | PrivacyPolicy      | `privacy-policy/`       | KEINE      | ❌ false   | ✅         | ✅ Standard  |
| **4** | `/help`            | Help               | `help/`                 | KEINE      | ❌ false   | ✅         | ✅ Standard  |
| **-** | `/**`              | Redirect           | -                       | -          | -          | ❌         | ❌           |

---

## 🚀 Quick Decision Guide

**Für neue Routes:**

```
┌─ Braucht User einen Account?
│
├─ NEIN (Public Page)
│  │
│  ├─ Teil des Welcome/Stakeholder Flow?
│  │  └─ JA → Zu welcome/ Folder, isAuthPage = true, optional guestGuard
│  │
│  └─ Legal/Info Page?
│     └─ JA → Eigener Folder, KEIN isAuthPage, KEIN Guard
│
└─ JA (Protected Page)
   │
   └─ Zu main/ Pages, authGuard, isAuthPage = false, Layout Mixin verwenden
```

---

**Status:** ✅ Vollständige Routing-Architektur analysiert
**Next Steps:** Entscheidungen für Phase 0 treffen + Component Migration starten
