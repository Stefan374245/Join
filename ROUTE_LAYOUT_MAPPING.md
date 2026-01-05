# 🗺️ Route-to-Layout Quick Reference

## 📋 Vollständige Route-Übersicht

### **Layer 1: Initial Experience (App Start)**

| Route              | Component              | Guard      | Layout Style          | Auto-Redirect   | Änderung nötig? |
|--------------------|------------------------|------------|-----------------------|-----------------|------------------|
| `/`                | → /logo-animation      | -          | Redirect              | Sofort          | ❌ Keine         |
| `/logo-animation`  | LogoAnimationComponent | guestGuard | Fullscreen Animation  | /welcome (2.5s) | ❌ Keine         |

### **Layer 2: Welcome Flow (Public Pages für nicht angemeldete User)**

| Route              | Component              | Folder                  | Guard      | Navigation              | Änderung nötig? |
|--------------------|------------------------|-------------------------|------------|-------------------------|------------------|
| `/welcome`         | WelcomeComponent       | `welcome/welcome/`      | guestGuard | Hub: → /stakeholder, → /login | ❌ Keine   |
| `/stakeholder`     | StakeholderComponent   | `welcome/stakeholder/`  | KEINE      | ← /welcome, → /feature-request | ❌ Keine |
| `/feature-request` | FeatureRequestComponent| `welcome/feature-request/` | KEINE   | ← /welcome, → /emailmask | ❌ Keine      |
| `/emailmask`       | EmailMaskComponent     | `welcome/email-mask/`   | KEINE      | ← /feature-request      | ❌ Keine         |

### **Layer 3: Authentication (Login & Signup)**

| Route              | Component              | Folder           | Guard      | Post-Action          | Änderung nötig? |
|--------------------|------------------------|------------------|------------|----------------------|------------------|
| `/login`           | LoginComponent         | `auth/login/`    | guestGuard | → /summary (nach Login) | ❌ Keine      |
| `/signup`          | SignupComponent        | `auth/signup/`   | KEINE      | → /login (meist)     | ❌ Keine         |

**User Journey:**
```
App Start (/) 
  ↓ Redirect
Logo Animation (2.5s Fullscreen)
  ↓ Auto-redirect
Welcome Hub
  ├─ Stakeholder Flow (→ feature-request → emailmask)
  └─ Auth Flow (→ login → Main App)
```

**Routing:**
```html
<!-- app.component.html -->
@if (isAuthPage) {
  <router-outlet />  ← Layers 1-3: Alle Public & Auth Routes
}
```

---

### **Layer 4: Main Application (MIT MainLayout)**

| Route              | Component              | Guard      | Layout Mixin              | Änderung nötig? |
|--------------------|------------------------|------------|---------------------------|-----------------|
| `/summary`         | SummaryViewComponent   | authGuard  | `page-layout-standard`    | ✅ Ja - Phase 1 |
| `/add-task`        | AddTaskComponent       | authGuard  | `page-layout-standard`    | ✅ Ja - Phase 1 |
| `/board`           | BoardViewComponent     | authGuard  | `page-layout-board`       | ✅ Ja - Phase 3 |
| `/contacts`        | ContactsListComponent  | authGuard  | `page-layout-contacts`    | ✅ Ja - Phase 2 |
| `/contacts/:email` | ContactDetailComponent | authGuard  | `page-layout-contacts`    | ✅ Ja - Phase 2 |
| `/legal-notice`    | LegalNoticeComponent   | -          | `page-layout-standard`    | ✅ Ja - Phase 1 |
| `/privacy-policy`  | PrivacyPolicyComponent | -          | `page-layout-standard`    | ✅ Ja - Phase 1 |
| `/help`            | HelpComponent          | -          | `page-layout-standard`    | ✅ Ja - Phase 1 |
| `/**`              | → /login               | -          | Redirect (Fallback)       | ❌ Keine        |

**Routing:**
```html
<!-- app.component.html -->
@else {
  <app-main-layout>
    <router-outlet />  ← Diese Routes
  </app-main-layout>
}
```

---

## 🎨 Layout Pattern pro Route

### **Pattern A: Standard Layout (6 Routes)**

**Routes:**
- `/summary`
- `/add-task`
- `/legal-notice`
- `/privacy-policy`
- `/help`

**SCSS Template:**
```scss
@import '../../../../styles/page-layouts';

.container {
  @include page-layout-standard;
}

.header {
  @include page-header;
}

.content {
  @include page-content-scrollable;
}
```

---

### **Pattern B: Board Layout (1 Route)**

**Route:**
- `/board`

**SCSS Template:**
```scss
@import '../../../../styles/page-layouts';

.board-container {
  @include page-layout-board;
}

.board-header {
  @include page-header;
}

.board-columns {
  @include page-content-static; // Spalten scrollen individuell
}
```

---

### **Pattern C: Contacts Layout (2 Routes)**

**Routes:**
- `/contacts`
- `/contacts/:email`

**SCSS Template:**
```scss
@import '../../../../styles/page-layouts';

.contacts-page {
  @include page-layout-contacts; // KEIN Padding
}

.contacts-main {
  display: flex;
  height: 100%;
  gap: $spacing-md;
}

.content-left {
  width: 340px;
  @include page-content-scrollable-hidden;
}

.content-right {
  flex: 1;
  overflow: hidden;
}
```

---

### **Pattern D: Public/Auth Pages (8 Routes - Layers 1-3)**

**Initial Experience:**
- `/logo-animation` (Layer 1)

**Welcome Flow:**
- `/welcome` (Layer 2 - Hub)
- `/stakeholder` (Layer 2)
- `/feature-request` (Layer 2)
- `/emailmask` (Layer 2)

**Auth Flow:**
- `/login` (Layer 3)
- `/signup` (Layer 3)

**SCSS Template:**
```scss
// KEINE Mixins nötig - Eigenes Fullscreen Styling
.public-page {
  width: 100vw;
  height: 100vh;
  display: grid;
  place-items: center;
  // ... custom styling
}

// Oder Centered Card Pattern
.auth-page {
  width: 100vw;
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
}
```

---

## 🔀 Route Transitions

### **Layer 1 → Layer 2 (Auto-Redirect nach Animation)**

```
/logo-animation (Layer 1)
  ↓ Animation läuft 2.5 Sekunden
  ↓ setTimeout(() => router.navigate(['/welcome']))
  ↓
/welcome (Layer 2)
  ↓ isAuthPage = true (bleibt)
  ↓ Kein Layout-Wechsel
  ✅ Welcome Hub erscheint
```

### **Layer 2 → Layer 3 (User wählt Login)**

```
/welcome (Layer 2 - Public)
  ↓ User klickt "Member log in"
  ↓ routerLink="/login"
  ↓
/login (Layer 3 - Auth)
  ↓ isAuthPage = true (bleibt)
  ↓ Kein Layout-Wechsel
  ✅ Login Form erscheint
```

### **Layer 3 → Layer 4 (Login → Main App)**

```
/login (Layer 3 - Auth)
  ↓ User loggt sich ein
  ↓ authService.login()
  ↓ Redirect zu /summary
  ↓
/summary (Layer 4 - Main)
  ↓ isAuthPage = false
  ↓ <app-main-layout> rendered
  ✅ Header + Sidebar erscheinen
```

### **Main → Main (Layout bleibt)**

```
/summary (MainLayout)
  ↓ User klickt Sidebar "Board"
  ↓ router.navigate(['/board'])
  ↓
/board (MainLayout)
  ↓ isAuthPage = false (bleibt)
  ↓ <app-main-layout> bleibt gerendert
  ✅ Nur Content ändert sich
```

### **Main → Auth (Layout verschwindet)**

```
/summary (MainLayout)
  ↓ User klickt "Logout"
  ↓ authService.logout()
  ↓ Redirect zu /login
  ↓
/login (Standalone)
  ↓ isAuthPage = true
  ↓ <app-main-layout> entfernt
  ✅ Fullscreen Login
```

---

## 📊 Migration Priority Matrix

| Priority | Route              | Reason                           | Effort |
|----------|--------------------|----------------------------------|--------|
| 🔴 HIGH  | `/summary`         | Landing Page, häufigst genutzt   | Low    |
| 🔴 HIGH  | `/board`           | Haupt-Feature, komplex           | Medium |
| 🟡 MED   | `/add-task`        | Häufig genutzt                   | Low    |
| 🟡 MED   | `/contacts`        | Split-View, speziell             | Medium |
| 🟢 LOW   | `/legal-notice`    | Selten besucht                   | Low    |
| 🟢 LOW   | `/privacy-policy`  | Selten besucht                   | Low    |
| 🟢 LOW   | `/help`            | Selten besucht                   | Low    |
| ⚪ SKIP  | `/login`           | Funktioniert bereits             | None   |
| ⚪ SKIP  | `/signup`          | Funktioniert bereits             | None   |
| ⚪ SKIP  | `/welcome`         | Funktioniert bereits             | None   |

**Empfohlene Reihenfolge:**
1. `/summary` - Quick Win, zeigt Pattern
2. `/board` - Komplex, aber wichtig
3. `/add-task` - Standard Pattern
4. `/contacts` - Spezielles Pattern
5. `/legal-notice`, `/privacy-policy`, `/help` - Batch

---

## 🧪 Route Testing Template

```typescript
// route-test-scenarios.spec.ts

describe('Route-to-Layout Integration', () => {
  
  describe('Auth Routes (Standalone)', () => {
    it('should show /login without MainLayout', () => {
      router.navigate(['/login']);
      expect(isAuthPage).toBe(true);
      expect(mainLayoutVisible).toBe(false);
    });
    
    it('should redirect /login to /summary when logged in', () => {
      authService.login();
      router.navigate(['/login']);
      expect(router.url).toBe('/summary');
    });
  });
  
  describe('Main Routes (with MainLayout)', () => {
    it('should show /summary with MainLayout', () => {
      authService.login();
      router.navigate(['/summary']);
      expect(isAuthPage).toBe(false);
      expect(mainLayoutVisible).toBe(true);
    });
    
    it('should redirect /summary to /login when logged out', () => {
      authService.logout();
      router.navigate(['/summary']);
      expect(router.url).toBe('/login');
    });
    
    it('should keep MainLayout on Main → Main transition', () => {
      authService.login();
      router.navigate(['/summary']);
      const layoutRef = getMainLayout();
      
      router.navigate(['/board']);
      const newLayoutRef = getMainLayout();
      
      expect(layoutRef).toBe(newLayoutRef); // Same instance
    });
  });
  
  describe('Layout Transitions', () => {
    it('should transition Auth → Main smoothly', () => {
      router.navigate(['/login']);
      expect(mainLayoutVisible).toBe(false);
      
      authService.login();
      router.navigate(['/summary']);
      
      expect(mainLayoutVisible).toBe(true);
      expect(transitionSmooth).toBe(true);
    });
  });
});
```

---

## 🎯 Quick Decision Tree

```
Neue Route hinzufügen?
│
├─ Braucht Header/Sidebar?
│  │
│  ├─ JA → Main Route
│  │     │
│  │     ├─ Geschützt? → authGuard
│  │     ├─ Standard Layout? → page-layout-standard
│  │     ├─ Board/Kanban? → page-layout-board
│  │     └─ Split-View? → page-layout-contacts
│  │
│  └─ NEIN → Auth/Standalone Route
│        │
│        ├─ Nur für ausgeloggte? → guestGuard
│        ├─ Fullscreen Layout
│        └─ Update isAuthPage Detection
```

---

## 📝 Checklist: Neue Route hinzufügen

### **Main Route (MIT MainLayout):**

```typescript
// ✅ 1. Route in app.routes.ts
{
  path: 'new-page',
  component: NewPageComponent,
  canActivate: [authGuard] // wenn geschützt
}

// ✅ 2. Component SCSS
@import '../../../styles/page-layouts';

.new-page-container {
  @include page-layout-standard;
}

// ✅ 3. Sidebar Link (sidebar.component.ts)
navLinks = [
  // ...
  { path: '/new-page', label: 'New Page', icon: '...' }
];

// ✅ 4. Test
□ Route funktioniert
□ MainLayout erscheint
□ Guard funktioniert (wenn gesetzt)
□ Responsive funktioniert
```

### **Auth Route (OHNE MainLayout):**

```typescript
// ✅ 1. Route in app.routes.ts
{
  path: 'new-auth',
  component: NewAuthComponent,
  canActivate: [guestGuard] // wenn nur für ausgeloggte
}

// ✅ 2. Update app.component.ts Detection
this.isAuthPage = url.startsWith('/login') ||
                 // ...
                 url.startsWith('/new-auth'); // ← NEU

// ✅ 3. Component SCSS (Eigenes Styling)
.new-auth {
  width: 100vw;
  height: 100vh;
  // ... fullscreen layout
}

// ✅ 4. Test
□ Route funktioniert
□ KEIN MainLayout erscheint
□ Guard funktioniert (wenn gesetzt)
□ Fullscreen Layout korrekt
```

---

**Status:** ✅ Routing vollständig dokumentiert und integriert
**Ready for:** Component-by-Component Migration
