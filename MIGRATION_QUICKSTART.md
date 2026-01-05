# 🚀 Layout Migration - Quick Start Guide

## ✅ Phase 0: Setup (COMPLETED)

- [x] `_page-layouts.scss` erstellt
- [x] Layout Mixins definiert
- [x] Dokumentation erstellt
- [x] MainLayoutComponent integriert
- [x] Routing konfiguriert

---

## 🔀 Routing-Architektur (Bereits implementiert ✅)

### **Drei-Schichten-Routing-System**

```typescript
// app.component.ts
@if (isAuthPage) {
  <router-outlet />           // ← Layers 1-3: Public & Auth (Fullscreen)
} @else {
  <app-main-layout>           // ← Layer 4: Main App (mit Header/Sidebar)
    <router-outlet />
  </app-main-layout>
}
```

### **Route-Kategorien:**

#### **Layer 1: Initial Experience (App Start)**
```typescript
// Auto-Redirect Flow:
'/' → '/logo-animation' (2.5s Animation) → '/welcome'
```
**Route:**
- `/logo-animation` (guestGuard)

**Eigenschaften:**
- ✅ Einstiegspunkt der App
- ✅ 2.5s Animation, dann auto-redirect zu /welcome
- ✅ Fullscreen, kein MainLayout

---

#### **Layer 2: Welcome Flow (Public Pages)**
```typescript
// Nicht-angemeldete User Flow
const welcomeRoutes = [
  '/welcome',          // Hub mit 2 Optionen
  '/stakeholder',      // Stakeholder Journey
  '/feature-request',  // ↓
  '/emailmask'         // ↓
];
```

**Eigenschaften:**
- ✅ Für nicht-angemeldete User
- ✅ Alle im `welcome/` Folder
- ✅ `/welcome` hat guestGuard, Rest public
- ✅ Fullscreen Layout, eigenes Styling
- ✅ Navigation: Welcome Hub → Stakeholder Flow ODER Login

---

#### **Layer 3: Authentication Pages**
```typescript
// Login & Signup
const authRoutes = [
  '/login',   // Mit guestGuard
  '/signup'   // Public
];
```

**Eigenschaften:**
- ✅ Login/Signup Forms
- ✅ Nach Login: Redirect zu /summary → Layer 4
- ✅ Fullscreen, zentrierte Cards
- ✅ `/login` mit guestGuard

---

#### **Layer 4: Main Application Pages (MIT MainLayout)**
```typescript
// Zeigt: <app-main-layout><router-outlet /></app-main-layout>
const mainRoutes = [
  '/board',          // ← Board Layout
  '/add-task',       // ← Standard Layout
  '/contacts',       // ← Contacts Layout
  '/summary',        // ← Standard Layout
  '/legal-notice',   // ← Standard Layout
  '/privacy-policy', // ← Standard Layout
  '/help'            // ← Standard Layout
];
```

**Eigenschaften:**
- ✅ Header (90px) oben
- ✅ Sidebar (200px) links / bottom (80px)
- ✅ Content Area scrollbar
- ✅ CSS Grid Layout
- ✅ Meist mit `authGuard`

### **Route Detection Logic:**

```typescript
// app.component.ts (Bereits implementiert)
this.router.events.subscribe(() => {
  const url = this.router.url;
  
  // Layers 1-3: Public & Auth (OHNE MainLayout)
  this.isAuthPage = url.startsWith('/login') ||          // Layer 3
                   url.startsWith('/signup') ||         // Layer 3
                   url.startsWith('/logo-animation') || // Layer 1
                   url.startsWith('/welcome') ||        // Layer 2
                   url.startsWith('/stakeholder') ||    // Layer 2
                   url.startsWith('/feature-request') ||// Layer 2
                   url.startsWith('/emailmask');        // Layer 2
  
  // Layer 4: Main App (MIT MainLayout)
  // Alle anderen Routes → isAuthPage = false
});
```

**User Journey:**
```
App Start
  ↓
Layer 1: /logo-animation (2.5s)
  ↓ auto-redirect
Layer 2: /welcome (Hub)
  ├─ Stakeholder Flow → /stakeholder → /feature-request → /emailmask
  └─ Member Login → Layer 3: /login
                    ↓ authService.login()
                    ↓ redirect zu /summary
                  Layer 4: Main App (Header + Sidebar)
```

**Status:** ✅ Funktioniert bereits korrekt!

---

## 🎯 Schritt-für-Schritt Anleitung

### **Schritt 1: Import hinzufügen**

In **jeder** Component SCSS-Datei, die migriert wird:

```scss
// Am Anfang der Datei
@import '../../../../styles/page-layouts';
```

### **Schritt 2: Layout Mixin anwenden**

Ersetze den Container mit dem passenden Mixin:

```scss
// ❌ VORHER
.my-page-container {
  padding: 2rem;
  max-width: 100%;
  @media (max-width: 768px) {
    padding: 1rem;
  }
}

// ✅ NACHHER
.my-page-container {
  @include page-layout-standard;
}
```

### **Schritt 3: Header & Content anpassen**

```scss
.page-header {
  @include page-header;
}

.page-content {
  @include page-content-scrollable;
}
```

---

## 📝 Component-Specific Guides

### **1. Summary Page**

```bash
Datei: src/app/components/summary/summary-view/summary-view.component.scss
```

**Änderungen:**

```scss
// Import hinzufügen
@import '../../../../styles/page-layouts';

// Container anpassen
.main-summary {
  @include page-layout-standard;
  background-color: $background-color;
  
  // Rest bleibt gleich
}

// Optional: Header
.summary-header {
  @include page-header;
}

// Optional: Content Grid
.summary-grid {
  @include content-grid($columns: 4, $gap: $spacing-lg);
}
```

**Entfernen:**
- `position: relative`
- Alle `padding` Definitionen
- Media Queries für Padding

---

### **2. Board Page**

```bash
Datei: src/app/components/board/styles/_board-layout.scss
```

**Änderungen:**

```scss
@import '../../../../styles/page-layouts';

.board-container {
  @include page-layout-board;
}

.board-header {
  @include page-header;
}

.board-columns {
  @include page-content-static; // Spalten haben eigenes Scroll
}
```

**Entfernen:**
- Alle `calc()` Formeln
- `position: absolute`
- `top`, `left`, `right` Definitionen
- Komplexe Media Queries

---

### **3. Contacts Page**

```bash
Datei: src/app/components/contacts/contacts-list/contacts-list.component.scss
```

**Änderungen:**

```scss
@import '../../../../styles/page-layouts';

.contacts-page {
  @include page-layout-contacts;
}

.contacts-main {
  display: flex;
  width: 100%;
  height: 100%; // ← Statt calc(100vh - $header-height)
  gap: $spacing-md;
  overflow: hidden;
}

.content-left {
  width: 340px;
  flex-shrink: 0;
  overflow-y: auto;
  height: 100%; // ← Statt 100vh
  
  @include hide-scrollbar;
}

.content-right {
  flex: 1;
  overflow-y: auto;
  height: 100%;
}
```

**Entfernen:**
- `height: calc(100vh - $header-height)`
- Komplexe Höhen-Berechnungen

---

### **4. Add-Task Page**

```bash
Datei: src/app/components/add-task/add-task.component.scss
```

**Änderungen:**

```scss
@import '../../../../styles/page-layouts';

.add-task-container {
  @include page-layout-standard;
}

.add-task-header {
  @include page-header;
}

// Overlay bleibt unverändert
.task-edit-overlay {
  // ... bestehender Code
}
```

---

### **5. Legal Notice & Privacy Policy**

```bash
Dateien:
- src/app/components/legal-notice/legal-notice.component.scss
- src/app/components/privacy-policy/privacy-policy.component.scss
```

**Änderungen:**

```scss
@import '../../../styles/page-layouts';

.legal-main {
  @include page-layout-standard;
  max-width: 1200px;
}

.legal-content {
  @include page-content-scrollable;
}
```

---

### **6. Help Page**

```bash
Datei: src/app/components/help/help.component.scss
```

**Änderungen:**

```scss
@import '../../../styles/page-layouts';

.help-container {
  @include page-layout-standard;
}

.help-content {
  @include page-content-scrollable;
}
```

---

## 🔍 Testing Pro Component

Nach jeder Migration testen:

### **Layout Testing:**

```bash
# Desktop (> 1200px)
□ Padding korrekt (2rem)
□ Content scrollt
□ Kein Overflow
□ Sidebar 200px links

# Tablet (992-1064px)
□ Schmale Sidebar (80px) funktioniert
□ Padding angepasst (1.5rem)
□ Icons sichtbar, Text versteckt

# Mobile (< 992px)
□ Bottom Sidebar (80px)
□ Content nicht versteckt unter Sidebar
□ Padding angepasst (1rem)
□ Touch-Scrolling smooth
```

### **Routing Testing:**

```bash
# Route Transitions
□ Direct URL funktioniert (/summary, /board, etc.)
□ Navigation via Sidebar funktioniert
□ Browser Back/Forward funktioniert
□ Page Refresh erhält Layout

# Auth Flow
□ Login → Redirect zu /summary
□ Logout → Redirect zu /login
□ Guest Guard blockt Auth Pages wenn eingeloggt
□ Auth Guard blockt Main Pages wenn ausgeloggt

# Layout Switching
□ Auth Page → Main Page (Layout erscheint)
□ Main Page → Auth Page (Layout verschwindet)
□ Main Page → Main Page (Layout bleibt)
□ Keine "Flicker" beim Wechsel
```

### **Component Testing:**

```bash
# Interaktionen
□ Overlays öffnen korrekt
□ Buttons funktionieren
□ Dropdowns nicht abgeschnitten
□ Modals zentriert
□ Drag & Drop (Board) funktioniert

# State Management
□ Data bleibt bei Navigation erhalten
□ Forms behalten Values
□ Scroll Position bleibt (wenn gewünscht)
```

---

## 🐛 Häufige Probleme & Lösungen

### **Problem 1: Content scrollt nicht**

```scss
// ❌ FALSCH
.page-content {
  flex: 1;
  overflow-y: auto;
}

// ✅ RICHTIG
.page-content {
  flex: 1;
  min-height: 0; // ← Das fehlt!
  overflow-y: auto;
}
```

### **Problem 2: Padding stimmt nicht**

```scss
// Override wenn nötig:
.my-page {
  @include page-layout-standard;
  padding: $spacing-lg !important; // Custom override
}
```

### **Problem 3: Height nicht 100%**

```scss
// Prüfe Parent Chain:
:host {
  display: block;
  height: 100%; // ← Wichtig!
}

.container {
  height: 100%; // ← Auch wichtig!
}
```

### **Problem 4: Responsive funktioniert nicht**

```scss
// Stelle sicher dass Mixins geladen sind:
@import '../../../../styles/variables'; // ZUERST
@import '../../../../styles/page-layouts'; // DANN
```

---

## 📊 Migration Progress Tracker

### **Phase 1: Standard Pages (MIT MainLayout)**
- [ ] `/summary` - Summary Page
- [ ] `/add-task` - Add-Task Page  
- [ ] `/legal-notice` - Legal Notice
- [ ] `/privacy-policy` - Privacy Policy
- [ ] `/help` - Help Page

### **Phase 2: Special Pages (MIT MainLayout)**
- [ ] `/board` - Board Page (finalize)
- [ ] `/contacts` - Contacts Page

### **Phase 3: Public & Auth Pages (Layers 1-3)**
- [x] `/logo-animation` - Keine Änderung nötig ✅ (Layer 1: Initial)
- [x] `/welcome` - Keine Änderung nötig ✅ (Layer 2: Hub)
- [x] `/stakeholder` - Keine Änderung nötig ✅ (Layer 2: Welcome Flow)
- [x] `/feature-request` - Keine Änderung nötig ✅ (Layer 2: Welcome Flow)
- [x] `/emailmask` - Keine Änderung nötig ✅ (Layer 2: Welcome Flow)
- [x] `/login` - Keine Änderung nötig ✅ (Layer 3: Auth)
- [x] `/signup` - Keine Änderung nötig ✅ (Layer 3: Auth)

### **Phase 4: Routing & Guards**
- [x] Auth/Main Page Detection ✅
- [x] authGuard für geschützte Routes ✅
- [x] guestGuard für Auth Pages ✅
- [ ] Test alle Route-Transitions

### **Phase 5: Polish**
- [ ] Header Responsive Fix
- [ ] Testing alle Breakpoints
- [ ] Code Cleanup
- [ ] Performance Check

---

## 🎓 Mixin Cheat Sheet

```scss
// Layout Typen
@include page-layout-standard;    // Standard mit Padding
@include page-layout-board;        // Für Board/Kanban
@include page-layout-contacts;     // Kein Padding
@include page-layout-centered;     // Zentriert

// Sections
@include page-header;              // Header (fixed)
@include page-header-compact;      // Header (weniger margin)
@include page-content-scrollable;  // Content (scrollt)
@include page-content-static;      // Content (kein scroll)

// Utilities
@include content-grid(4);          // Responsive Grid
@include split-view-layout(340px); // Split View
@include action-bar;               // Button Bar
```

---

## ✅ Definition of Done

Eine Page ist fertig migriert wenn:

1. ✅ Mixin importiert und angewendet
2. ✅ Alte CSS entfernt (calc, position, etc.)
3. ✅ Desktop funktioniert
4. ✅ Tablet funktioniert
5. ✅ Mobile funktioniert
6. ✅ Keine Konsolen-Errors
7. ✅ Code reviewed

---

## 🚀 Let's Go!

**Starte mit Summary Page** - sie ist am einfachsten und hat die meisten Verbesserungen.

```bash
# 1. Öffne Datei
code src/app/components/summary/summary-view/summary-view.component.scss

# 2. Import hinzufügen
@import '../../../../styles/page-layouts';

# 3. Mixin anwenden
.main-summary {
  @include page-layout-standard;
}

# 4. Testen!
```

**Viel Erfolg! 🎉**
