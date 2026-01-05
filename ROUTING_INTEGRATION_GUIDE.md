# 🔀 Routing & Layout Integration Guide

## 🎯 Architektur-Übersicht

### **Zwei-Ebenen-System**

```
┌─────────────────────────────────────────────────────┐
│                 app.component.ts                    │
│                                                     │
│  @if (isAuthPage) {                                │
│    <router-outlet />          ← Auth/Welcome       │
│  } @else {                                          │
│    <app-main-layout>          ← Main App           │
│      <router-outlet />                              │
│    </app-main-layout>                               │
│  }                                                  │
└─────────────────────────────────────────────────────┘
```

---

## 📁 Route-Kategorien

### **1. Auth/Welcome Routes (Standalone)**

**Keine Header/Sidebar - Fullscreen**

```typescript
// app.routes.ts
export const routes: Routes = [
  {
    path: 'logo-animation',
    component: LogoAnimationComponent,
    canActivate: [guestGuard]
  },
  {
    path: 'welcome',
    component: WelcomeComponent,
    canActivate: [guestGuard]
  },
  {
    path: 'login',
    component: LoginComponent,
    canActivate: [guestGuard]
  },
  {
    path: 'signup',
    component: SignupComponent
  },
  {
    path: 'stakeholder',
    component: StakeholderComponent
  },
  {
    path: 'feature-request',
    component: FeatureRequestComponent
  },
  {
    path: 'emailmask',
    component: EmailMaskComponent
  }
];
```

**Layout:**
```
┌────────────────────────────────────┐
│                                    │
│                                    │
│        FULLSCREEN CONTENT          │
│        (Eigenes Layout)            │
│                                    │
│                                    │
└────────────────────────────────────┘
```

**SCSS:**
```scss
// Keine Layout-Mixins nötig!
.welcome-page {
  width: 100vw;
  height: 100vh;
  // ... eigenes Styling
}
```

---

### **2. Main Application Routes (mit MainLayout)**

**Mit Header/Sidebar - CSS Grid**

```typescript
// app.routes.ts
export const routes: Routes = [
  {
    path: 'board',
    component: BoardViewComponent,
    canActivate: [authGuard]
  },
  {
    path: 'add-task',
    component: AddTaskComponent,
    canActivate: [authGuard]
  },
  {
    path: 'contacts',
    component: ContactsListComponent,
    canActivate: [authGuard]
  },
  {
    path: 'contacts/:email',
    component: ContactDetailComponent,
    canActivate: [authGuard]
  },
  {
    path: 'summary',
    component: SummaryViewComponent,
    canActivate: [authGuard]
  },
  {
    path: 'legal-notice',
    component: LegalNoticeComponent
  },
  {
    path: 'privacy-policy',
    component: PrivacyPolicyComponent
  },
  {
    path: 'help',
    component: HelpComponent
  }
];
```

**Layout:**
```
┌──────────────────────────────────────┐
│          HEADER (90px)               │
└──────────────────────────────────────┘
┌─────────┬────────────────────────────┐
│         │                            │
│ SIDEBAR │     CONTENT AREA           │
│ 200px   │     (router-outlet)        │
│         │     (page-layout-*)        │
│         │                            │
└─────────┴────────────────────────────┘
```

**SCSS:**
```scss
// Benutzt Layout-Mixins!
.page-container {
  @include page-layout-standard; // oder board, contacts, etc.
}
```

---

## 🔒 Route Guards

### **authGuard - Schützt Main Pages**

```typescript
// guards/auth.guard.ts
export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return authService.user$.pipe(
    map(user => {
      if (user) {
        return true; // User eingeloggt → Zugriff erlaubt
      }
      router.navigate(['/login']); // → Redirect zu Login
      return false;
    })
  );
};
```

**Verwendet von:**
- /board
- /add-task
- /contacts
- /summary

### **guestGuard - Schützt Auth Pages**

```typescript
// guards/auth.guard.ts
export const guestGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return authService.user$.pipe(
    map(user => {
      if (!user) {
        return true; // User ausgeloggt → Zugriff erlaubt
      }
      router.navigate(['/summary']); // → Redirect zu Summary
      return false;
    })
  );
};
```

**Verwendet von:**
- /logo-animation
- /welcome
- /login

---

## 🎨 Layout Detection Logic

### **app.component.ts**

```typescript
export class AppComponent {
  isAuthPage = true;

  constructor(private router: Router) {
    this.router.events.subscribe(() => {
      const url = this.router.url;
      
      // Prüfe ob aktuelle Route eine Auth Page ist
      this.isAuthPage = url.startsWith('/login') ||
                       url.startsWith('/signup') ||
                       url.startsWith('/logo-animation') ||
                       url.startsWith('/welcome') ||
                       url.startsWith('/stakeholder') ||
                       url.startsWith('/feature-request') ||
                       url.startsWith('/emailmask');
    });
  }
}
```

### **app.component.html**

```html
<app-toast></app-toast>

@if (isAuthPage) {
  <!-- Auth/Welcome Pages: Fullscreen -->
  <router-outlet />
} @else {
  <!-- Main Pages: Mit Layout -->
  <app-main-layout></app-main-layout>
}
```

---

## 🔄 Navigation Flow

### **User Journey: Nicht eingeloggt**

```
1. App Start
   ↓
2. / → Redirect zu /logo-animation
   ↓
3. Logo Animation (guestGuard ✅)
   ↓
4. Auto-Redirect zu /welcome
   ↓
5. User klickt "Login"
   ↓
6. /login (guestGuard ✅)
   ↓
7. User loggt sich ein
   ↓
8. Redirect zu /summary
   ↓
9. /summary (authGuard ✅, MainLayout erscheint)
```

### **User Journey: Eingeloggt**

```
1. User navigiert zu /logo-animation
   ↓
2. guestGuard → Redirect zu /summary
   (User ist bereits eingeloggt)
   ↓
3. /summary (authGuard ✅, MainLayout)
   ↓
4. User klickt Sidebar: /board
   ↓
5. /board (authGuard ✅, MainLayout bleibt)
   ↓
6. User klickt Logout
   ↓
7. Redirect zu /login
   ↓
8. MainLayout verschwindet
```

---

## 🎭 Layout Switching Animation

### **Kein "Flicker" beim Wechsel**

```typescript
// MainLayout wird nur bei @else gerendert
@if (isAuthPage) {
  <router-outlet />
} @else {
  <app-main-layout></app-main-layout>
}
```

**Warum kein Flicker?**
- ✅ Angular's `@if` ist synchron
- ✅ `router.events` updated `isAuthPage` sofort
- ✅ CSS Grid Layout ist instant
- ✅ Kein `ngIf` async rendering

### **Optional: Fade Transition**

```scss
// app.component.scss
app-main-layout {
  animation: fadeIn 0.2s ease-in;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
```

---

## 🧪 Testing Guide

### **Route Testing Checklist**

```bash
# 1. Direct URL Access
□ Direkt /summary öffnen (eingeloggt) → Funktioniert
□ Direkt /login öffnen (ausgeloggt) → Funktioniert
□ Direkt /summary öffnen (ausgeloggt) → Redirect zu /login
□ Direkt /login öffnen (eingeloggt) → Redirect zu /summary

# 2. Navigation via Sidebar
□ Summary → Board → Contacts → Add Task
□ Alle Transitions smooth
□ Layout bleibt erhalten
□ Kein Flicker

# 3. Auth Flow
□ Login → Summary (Layout erscheint)
□ Logout → Login (Layout verschwindet)
□ Logo Animation → Welcome → Login

# 4. Browser Navigation
□ Back Button funktioniert
□ Forward Button funktioniert
□ Page Refresh erhält Route & Layout

# 5. Deep Links
□ /contacts/anton@example.com funktioniert
□ Query Params bleiben erhalten
□ Fragments (#section) funktionieren

# 6. Error Cases
□ /unknown-route → Redirect zu /login
□ Unauthorized access → Redirect korrekt
□ Expired session → Redirect zu /login
```

---

## 🐛 Common Issues & Solutions

### **Problem 1: Layout erscheint auf Auth Pages**

```typescript
// ❌ FALSCH
this.isAuthPage = this.router.url.includes('login');

// ✅ RICHTIG
this.isAuthPage = this.router.url.startsWith('/login');
```

### **Problem 2: Guards funktionieren nicht**

```typescript
// Stelle sicher dass Guards in routes.ts importiert sind
import { authGuard, guestGuard } from './guards/auth.guard';

// Und korrekt angewendet:
{
  path: 'summary',
  component: SummaryViewComponent,
  canActivate: [authGuard] // ← Wichtig!
}
```

### **Problem 3: Redirect Loop**

```typescript
// ❌ FALSCH - Beide Guards redirecten zu gleicher Route
guestGuard → redirect zu /summary
authGuard auf /summary → redirect zu /login

// ✅ RICHTIG - Guards redirecten zu unterschiedlichen Routes
guestGuard → redirect zu /summary (hat authGuard)
authGuard → redirect zu /login (hat guestGuard)
```

### **Problem 4: Layout "springt" beim Wechsel**

```scss
// ❌ FALSCH - Height animation
app-main-layout {
  animation: slideIn 0.5s;
}

// ✅ RICHTIG - Nur opacity/transform
app-main-layout {
  animation: fadeIn 0.2s ease-in;
}
```

---

## 📊 Route → Layout Mapping

| Route              | Layout Type         | Guard        | Mixin                    |
|--------------------|---------------------|--------------|--------------------------|
| /logo-animation    | Standalone          | guestGuard   | (none)                   |
| /welcome           | Standalone          | guestGuard   | (none)                   |
| /login             | Standalone          | guestGuard   | (none)                   |
| /signup            | Standalone          | (none)       | (none)                   |
| /stakeholder       | Standalone          | (none)       | (none)                   |
| /feature-request   | Standalone          | (none)       | (none)                   |
| /emailmask         | Standalone          | (none)       | (none)                   |
| **---**            | **---**             | **---**      | **---**                  |
| /summary           | MainLayout          | authGuard    | page-layout-standard     |
| /add-task          | MainLayout          | authGuard    | page-layout-standard     |
| /board             | MainLayout          | authGuard    | page-layout-board        |
| /contacts          | MainLayout          | authGuard    | page-layout-contacts     |
| /contacts/:email   | MainLayout          | authGuard    | page-layout-contacts     |
| /legal-notice      | MainLayout          | (none)       | page-layout-standard     |
| /privacy-policy    | MainLayout          | (none)       | page-layout-standard     |
| /help              | MainLayout          | (none)       | page-layout-standard     |

---

## 🚀 Adding New Routes

### **Neue Auth Page hinzufügen:**

```typescript
// 1. Route hinzufügen (app.routes.ts)
{
  path: 'reset-password',
  component: ResetPasswordComponent,
  canActivate: [guestGuard]
}

// 2. Detection Logic updaten (app.component.ts)
this.isAuthPage = url.startsWith('/login') ||
                 url.startsWith('/signup') ||
                 // ... andere ...
                 url.startsWith('/reset-password'); // ← NEU

// 3. Component braucht KEIN Layout-Mixin
// reset-password.component.scss
.reset-password {
  width: 100vw;
  height: 100vh;
  // ... eigenes Styling
}
```

### **Neue Main Page hinzufügen:**

```typescript
// 1. Route hinzufügen (app.routes.ts)
{
  path: 'settings',
  component: SettingsComponent,
  canActivate: [authGuard]
}

// 2. Keine Änderung in app.component.ts nötig!
// Default: !isAuthPage = MainLayout ✅

// 3. Component benutzt Layout-Mixin
// settings.component.scss
@import '../../../styles/page-layouts';

.settings-container {
  @include page-layout-standard;
}
```

---

## ✅ Best Practices

### **DO:**
✅ Benutze Guards konsequent
✅ Prüfe `startsWith()` für Pfade
✅ Teste alle Route-Transitions
✅ Verwende Layout-Mixins in Main Pages
✅ Halte Auth Pages layout-frei

### **DON'T:**
❌ Mische Auth/Main Layout Logic
❌ Vergesse Guards bei geschützten Routes
❌ Benutze `includes()` statt `startsWith()`
❌ Hardcode Layout-Detection in Components
❌ Erstelle eigene Layout-Components pro Page

---

## 🎓 Summary

**Das System ist bereits perfekt aufgesetzt:**

1. ✅ **app.component** entscheidet: Auth oder Main
2. ✅ **Guards** schützen Routes korrekt
3. ✅ **MainLayout** managed Layout automatisch
4. ✅ **Pages** benutzen nur noch Layout-Mixins

**Keine Routing-Änderungen nötig für Migration!**
**Nur SCSS in Components updaten.** 🎯

---

**Status:** ✅ Routing vollständig integriert und dokumentiert
