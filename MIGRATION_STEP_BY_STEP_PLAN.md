# 🎯 Layout Migration - Detaillierter Step-by-Step Ausführungsplan

> **Erstellt:** 2. Januar 2026  
> **Status:** Bereit zur Ausführung  
> **Checkpoints:** Nach jeder Phase für User-Feedback

---

## 📊 Phase 0: Code-Analyse & Vorbereitung (COMPLETED ✅)

### **Analyse-Ergebnisse:**

#### **1. Summary Page**
- **Datei:** `src/app/components/summary/summary-view/summary-view.component.scss`
- **Aktuelle Probleme:**
  - ❌ `position: relative` in `.main-summary` (Zeile 21)
  - ❌ Kein explizites Padding-System (wird implizit gehandhabt)
  - ❌ 556 Zeilen SCSS (sehr komplex)
  - ✅ Nutzt bereits Flexbox
  - ✅ Hat responsive Media Queries

- **Was wird entfernt:**
  - `position: relative`
  
- **Was wird hinzugefügt:**
  - `@import '../../../../styles/page-layouts';`
  - `@include page-layout-standard;` auf `.main-summary`
  
- **Erwartetes Ergebnis:**
  - Automatisches Padding durch Mixin
  - Responsive Padding ohne extra Media Queries
  - Clean Layout Integration

---

#### **2. Add-Task Page**
- **Datei:** `src/app/components/add-task/add-task.component.scss`
- **Aktuelle Probleme:**
  - ❌ Kein explizites Layout-System (nur `display: flex`)
  - ⚠️  Hat Overlay-System (muss beibehalten werden!)
  - ✅ Relativ einfache Struktur
  
- **Was wird hinzugefügt:**
  - `@import '../../../styles/page-layouts';`
  - `@include page-layout-standard;` auf `.add-task-container`
  - `@include page-header;` auf `.add-task-header`
  
- **Besonderheit:**
  - Overlay `.task-edit-overlay` muss UNVERÄNDERT bleiben!
  - Hat eigenes Positioning-System

---

#### **3. Board Page**
- **Dateien:** 
  - `src/app/components/board/board-view/board-view.component.scss`
  - `src/app/components/board/styles/_board-layout.scss` (HAUPTDATEI)
  
- **Aktuelle Probleme:**
  - ✅ BEREITS teilweise modernisiert!
  - ✅ Kein `position: absolute` mehr
  - ✅ Nutzt Flexbox
  - ⚠️  `height: calc(100vh - ...)` in `.board-column` (Zeile 76)
  - ❌ Manuelles `padding: $spacing-xl` in `.board-container`
  
- **Was wird geändert:**
  - `@include page-layout-board;` auf `.board-container`
  - `@include page-header;` auf `.board-header`
  - `@include page-content-static;` auf `.board-columns`
  - Entfernen: Manuelles Padding, `height: calc()`

---

#### **4. Contacts Pages**
- **Datei:** `src/app/components/contacts/contacts-list/contacts-list.component.scss`
- **Aktuelle Probleme:**
  - ❌ `height: calc(100vh - $header-height)` in `.contacts-main` (Zeile 23)
  - ❌ Manuelle Width-Definition `width: 340px` für `.content-left`
  - ❌ Komplexes Overflow-Management
  
- **Was wird hinzugefügt:**
  - `@import '../../../../styles/page-layouts';`
  - `@include page-layout-contacts;` auf `.contacts-page`
  - Ersetzen: `height: calc(...)` → `height: 100%`
  
- **Besonderheit:**
  - Split-View Layout (340px links, flex rechts)
  - Hidden Scrollbar muss bleiben

---

#### **5. Legal Notice Page**
- **Datei:** `src/app/components/legal-notice/legal-notice.component.scss`
- **Aktuelle Probleme:**
  - ❌ Kein umschließendes Layout-System
  - ❌ `max-width: 1200px` direkt in Component
  - ✅ Relativ sauber (105 Zeilen)
  
- **Was wird hinzugefügt:**
  - `@import '../../../styles/page-layouts';`
  - Wrapper `.legal-page` (NEU) mit `@include page-layout-standard;`
  - `@include page-content-scrollable;` auf `.legal-content`

---

#### **6. Privacy Policy Page**
- **Datei:** `src/app/components/privacy-policy/privacy-policy.component.scss`
- **Aktuelle Probleme:**
  - Identisch zu Legal Notice
  - ❌ Kein umschließendes Layout-System
  - ❌ `max-width: 1200px` direkt in Component
  
- **Was wird hinzugefügt:**
  - `@import '../../../styles/page-layouts';`
  - Wrapper `.privacy-page` (NEU) mit `@include page-layout-standard;`
  - `@include page-content-scrollable;` auf `.privacy-content`

---

#### **7. Help Page**
- **Datei:** `src/app/components/help/help.component.scss`
- **Aktuelle Probleme:**
  - ❌ `min-height: 100vh` (nicht nötig mit MainLayout)
  - ❌ `padding: $spacing-xl` direkt in `.help-main`
  - ✅ Relativ einfach (120 Zeilen)
  
- **Was wird hinzugefügt:**
  - `@import '../../../styles/page-layouts';`
  - `@include page-layout-standard;` auf `.help-main`
  - Entfernen: `min-height: 100vh`, `padding: $spacing-xl`

---

## 🚀 Phase 1: Summary Page Migration

### **Checkpoint 1.0: Vor der Migration**

**User Action Required:** ✋ **STOP - Bitte bestätigen:**
- [ ] Dev Server läuft (`npm start`)
- [ ] `/summary` Page im Browser geöffnet
- [ ] Screenshot vom aktuellen Layout gemacht
- [ ] Bereit für erste Änderung

---

### **Step 1.1: SCSS Import hinzufügen**

**Datei:** `src/app/components/summary/summary-view/summary-view.component.scss`

**Änderung:**
```scss
// VORHER (Zeile 1-2):
@import "../../../../styles/variables";
@import "../../../../styles/mixins";

// NACHHER (Zeile 1-3):
@import "../../../../styles/variables";
@import "../../../../styles/mixins";
@import "../../../../styles/page-layouts"; // ← NEU
```

**Ausführung:** Automatisch durch Agent

---

### **Step 1.2: Mixin auf .main-summary anwenden**

**Datei:** `src/app/components/summary/summary-view/summary-view.component.scss`

**Änderung:**
```scss
// VORHER (Zeile 21-29):
.main-summary {
  position: relative;
  background-color: $background-color;
  max-width: 100%;

  &.guest-mode {
    summary { align-items: center; }
    .summary-grid { justify-content: center; }
  }
}

// NACHHER:
.main-summary {
  @include page-layout-standard; // ← NEU: Ersetzt position + padding
  background-color: $background-color;
  max-width: 100%;

  &.guest-mode {
    summary { align-items: center; }
    .summary-grid { justify-content: center; }
  }
}
```

**Was passiert:**
- ✅ `position: relative` entfernt
- ✅ Mixin fügt automatisch Padding hinzu (2rem Desktop, 1.5rem Tablet, 1rem Mobile)
- ✅ Flexbox Layout (column, height: 100%)
- ✅ Responsive Breakpoints

**Ausführung:** Automatisch durch Agent

---

### **Step 1.3: Optional - Header & Content Mixins**

**Datei:** `src/app/components/summary/summary-view/summary-view.component.scss`

**Optional-Änderung:**
```scss
// Optional: Zeile ~42
.summary-header {
  @include page-header; // ← Standardisiertes Header-Layout
  // ... Rest bleibt
}

// Optional: Wenn scrollbarer Content gewünscht
.summary-grid {
  @include page-content-scrollable; // ← Scrollbarer Content
  // ... Rest bleibt
}
```

**Hinweis:** Nur wenn Scrolling nötig ist (aktuell nicht der Fall)

**Ausführung:** Nur nach User-Bestätigung

---

### **Checkpoint 1.1: Nach Summary Migration**

**User Action Required:** ✋ **STOP - Bitte testen:**

**Browser-Test:**
1. [ ] `/summary` Page neu laden
2. [ ] Desktop (>1200px): Padding korrekt (2rem)?
3. [ ] Tablet (992-1064px): Schmale Sidebar, Padding 1.5rem?
4. [ ] Mobile (<992px): Bottom Sidebar, Padding 1rem?
5. [ ] Content scrollt korrekt?
6. [ ] Keine Konsolen-Errors?
7. [ ] Alle Cards sichtbar?
8. [ ] Hover-Effekte funktionieren?

**Vergleich:**
- [ ] Screenshot vergleichen: Sieht identisch aus?
- [ ] Responsive funktioniert besser/gleich?

**Feedback:**
👍 **Alles OK?** → Weiter zu Phase 2  
❌ **Problem?** → Agent analysiert und fixt

---

## 🚀 Phase 2: Add-Task Page Migration

### **Checkpoint 2.0: Vor der Migration**

**User Action Required:** ✋ **STOP - Bitte bestätigen:**
- [ ] Summary Page funktioniert ✅
- [ ] `/add-task` Page im Browser geöffnet
- [ ] Screenshot vom aktuellen Layout
- [ ] Bereit für Phase 2

---

### **Step 2.1: SCSS Import hinzufügen**

**Datei:** `src/app/components/add-task/add-task.component.scss`

**Änderung:**
```scss
// VORHER (Zeile 1-10):
@import "../../../styles/variables";
@import "../../../styles/mixins";
@import "../../../styles/components/animations";
// ... andere imports

// NACHHER (nach Zeile 10):
@import "../../../styles/page-layouts"; // ← NEU
```

**Ausführung:** Automatisch

---

### **Step 2.2: Container Layout anwenden**

**Datei:** `src/app/components/add-task/add-task.component.scss`

**Änderung:**
```scss
// VORHER (Zeile 44-47):
.add-task-container {
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
}

// NACHHER:
.add-task-container {
  @include page-layout-standard; // ← Ersetzt flex + box-sizing
}
```

**Ausführung:** Automatisch

---

### **Step 2.3: Header Layout anwenden**

**Datei:** `src/app/components/add-task/add-task.component.scss`

**Änderung:**
```scss
// VORHER (Zeile 49-58):
.add-task-header {
  margin-bottom: 2rem;
  padding-left: 0;
  @media (max-width: $breakpoint-md) {
    margin-bottom: 0;
  }

  .page-title {
    @include page-title;
    margin: 0;
  }
}

// NACHHER:
.add-task-header {
  @include page-header; // ← Ersetzt margin + responsive
  
  .page-title {
    @include page-title;
    margin: 0;
  }
}
```

**Ausführung:** Automatisch

---

### **Checkpoint 2.1: Nach Add-Task Migration**

**User Action Required:** ✋ **STOP - Bitte testen:**

**Browser-Test:**
1. [ ] `/add-task` Page neu laden
2. [ ] Form korrekt dargestellt?
3. [ ] Desktop Padding korrekt?
4. [ ] Responsive funktioniert?
5. [ ] **WICHTIG:** Task Edit Overlay öffnet korrekt?
6. [ ] Overlay positioned richtig (fullscreen)?
7. [ ] Subtask-Funktionalität?
8. [ ] Assigned-To Dropdown?

**Besondere Tests:**
- [ ] "Create Task" Button klicken → Overlay erscheint?
- [ ] Overlay schließen funktioniert?
- [ ] Form Submit funktioniert?

**Feedback:**
👍 **Alles OK?** → Weiter zu Phase 3  
❌ **Problem?** → Agent fixt

---

## 🚀 Phase 3: Board Page Migration

### **Checkpoint 3.0: Vor der Migration**

**User Action Required:** ✋ **STOP - Bitte bestätigen:**
- [ ] Add-Task Page funktioniert ✅
- [ ] `/board` Page im Browser geöffnet
- [ ] Screenshot der Kanban Columns
- [ ] Bereit für Phase 3

**Wichtig:** Board ist am komplexesten wegen Drag & Drop!

---

### **Step 3.1: SCSS Import hinzufügen**

**Datei:** `src/app/components/board/styles/_board-layout.scss`

**Änderung:**
```scss
// VORHER (Zeile 1):
// ========== Board Layout Styles ==========

// NACHHER:
@import '../../../../styles/page-layouts'; // ← NEU

// ========== Board Layout Styles ==========
```

**Ausführung:** Automatisch

---

### **Step 3.2: Container Layout anwenden**

**Datei:** `src/app/components/board/styles/_board-layout.scss`

**Änderung:**
```scss
// VORHER (Zeile 8-26):
.board-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
  padding: $spacing-xl;
  box-sizing: border-box;

  @media (max-width: $breakpoint-lg) {
    padding: $spacing-lg;
  }

  .board-loading {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 300px;
    width: 100%;
  }
}

// NACHHER:
.board-container {
  @include page-layout-board; // ← Ersetzt flex + padding + responsive

  .board-loading {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 300px;
    width: 100%;
  }
}
```

**Was passiert:**
- ✅ Flex Layout automatisch
- ✅ Padding responsive (2rem → 1.5rem → 1rem)
- ✅ Height: 100% automatisch

**Ausführung:** Automatisch

---

### **Step 3.3: Header Layout anwenden**

**Datei:** `src/app/components/board/styles/_board-layout.scss`

**Änderung:**
```scss
// VORHER (Zeile 28-47):
.board-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  margin-bottom: $spacing-xl;
  flex-shrink: 0;

  .board-title {
    @include page-title;
    margin: 0;
    line-height: 1.2;
  }

  .board-actions {
    display: flex;
    align-items: center;
    gap: $spacing-lg;
  }
}

// NACHHER:
.board-header {
  @include page-header; // ← Ersetzt flex + margin
  
  .board-title {
    @include page-title;
    margin: 0;
    line-height: 1.2;
  }

  .board-actions {
    display: flex;
    align-items: center;
    gap: $spacing-lg;
  }
}
```

**Ausführung:** Automatisch

---

### **Step 3.4: Columns Layout anwenden**

**Datei:** `src/app/components/board/styles/_board-layout.scss`

**Änderung:**
```scss
// VORHER (Zeile 49-66):
.board-columns {
  display: grid;
  grid-template-columns: repeat($column-count, 1fr);
  gap: $board-gap;
  flex: 1;
  min-height: 0;
  overflow: visible;

  @media (max-width: $breakpoint-lg-xl) {
    gap: 16px;
  }

  @media (max-width: $breakpoint-md) {
    grid-template-columns: 1fr;
    gap: $spacing-md;
  }
}

// NACHHER:
.board-columns {
  @include page-content-static; // ← Basis Layout
  display: grid; // ← Überschreibt flex von Mixin
  grid-template-columns: repeat($column-count, 1fr);
  gap: $board-gap;
  overflow: visible; // ← Columns scrollen individuell

  @media (max-width: $breakpoint-lg-xl) {
    gap: 16px;
  }

  @media (max-width: $breakpoint-md) {
    grid-template-columns: 1fr;
    gap: $spacing-md;
  }
}
```

**Hinweis:** Grid überschreibt Mixin's Flexbox (ist OK, da Mixin nur Basis bietet)

**Ausführung:** Automatisch

---

### **Step 3.5: Column Height Fix**

**Datei:** `src/app/components/board/styles/_board-layout.scss`

**Änderung:**
```scss
// VORHER (Zeile 68-77):
.board-column {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  @media (max-width: $breakpoint-lg) {
    max-height: calc(100vh - $header-height - 100px - 80px - 60px);
  }
  // ...
}

// NACHHER:
.board-column {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  // calc() ENTFERNT - MainLayout managed die Höhe automatisch
  // ...
}
```

**Ausführung:** Automatisch

---

### **Checkpoint 3.1: Nach Board Migration**

**User Action Required:** ✋ **STOP - Bitte INTENSIV testen:**

**Browser-Test:**
1. [ ] `/board` Page neu laden
2. [ ] Alle 4 Spalten sichtbar?
3. [ ] Spalten scrollen individuell?
4. [ ] Desktop Layout korrekt?

**Drag & Drop Tests (KRITISCH!):**
5. [ ] Task greifen funktioniert?
6. [ ] Task zwischen Spalten ziehen?
7. [ ] Task in gleicher Spalte verschieben?
8. [ ] Drop Zones sichtbar?
9. [ ] Animation smooth?
10. [ ] Task bleibt nach Drop?

**Responsive Tests:**
11. [ ] Tablet (992-1064px): Schmale Sidebar, Columns passen?
12. [ ] Mobile (<992px): Single Column Layout?
13. [ ] Bottom Sidebar nicht über Content?

**Task Detail:**
14. [ ] Task klicken → Overlay öffnet?
15. [ ] Task bearbeiten funktioniert?
16. [ ] Overlay schließen?

**Feedback:**
👍 **Alles OK?** → Weiter zu Phase 4  
❌ **Problem?** → **STOP!** Agent analysiert (Drag&Drop ist kritisch!)

---

## 🚀 Phase 4: Contacts Pages Migration

### **Checkpoint 4.0: Vor der Migration**

**User Action Required:** ✋ **STOP - Bitte bestätigen:**
- [ ] Board funktioniert ✅ (inkl. Drag & Drop)
- [ ] `/contacts` Page im Browser geöffnet
- [ ] Screenshot der Contact List
- [ ] Bereit für Phase 4

---

### **Step 4.1: SCSS Import hinzufügen**

**Datei:** `src/app/components/contacts/contacts-list/contacts-list.component.scss`

**Änderung:**
```scss
// VORHER (Zeile 1-6):
@import "../../../../styles/_variables.scss";
@import "../../../../styles/_mixins.scss";
@import "../../../../styles/_utilities.scss";
// ...

// NACHHER (nach Zeile 6):
@import "../../../../styles/page-layouts"; // ← NEU
```

**Ausführung:** Automatisch

---

### **Step 4.2: Page Layout anwenden**

**Datei:** `src/app/components/contacts/contacts-list/contacts-list.component.scss`

**Änderung:**
```scss
// VORHER (Zeile 13-17):
.contacts-page {
  display: flex;
  width: 100%;
  background-color: $background-color;
}

// NACHHER:
.contacts-page {
  @include page-layout-contacts; // ← Ersetzt flex, KEIN Padding
  background-color: $background-color;
}
```

**Was passiert:**
- ✅ Display flex, column, height: 100%
- ✅ **KEIN Padding** (Contacts braucht keins!)
- ✅ Width: 100% automatisch

**Ausführung:** Automatisch

---

### **Step 4.3: Contacts Main Height Fix**

**Datei:** `src/app/components/contacts/contacts-list/contacts-list.component.scss`

**Änderung:**
```scss
// VORHER (Zeile 19-25):
.contacts-main {
  display: flex;
  width: 100%;
  gap: $spacing-md;
  height: calc(100vh - $header-height); // ❌ MANUELL
  overflow: hidden;
}

// NACHHER:
.contacts-main {
  display: flex;
  width: 100%;
  gap: $spacing-md;
  height: 100%; // ✅ AUTOMATISCH durch MainLayout
  overflow: hidden;
}
```

**Was passiert:**
- ✅ MainLayout managed die Höhe
- ✅ Kein `calc()` mehr nötig
- ✅ Funktioniert responsive automatisch

**Ausführung:** Automatisch

---

### **Step 4.4: Optional - Split View Helper**

**Optional-Änderung:**
```scss
// Optional: Split-View Helper
.contacts-main {
  @include split-view-layout(340px); // ← Vereinfacht Split-View
  gap: $spacing-md;
  overflow: hidden;
}
```

**Hinweis:** Nur wenn gewünscht (macht Code cleaner)

**Ausführung:** Nur nach User-Bestätigung

---

### **Checkpoint 4.1: Nach Contacts Migration**

**User Action Required:** ✋ **STOP - Bitte testen:**

**Browser-Test:**
1. [ ] `/contacts` Page neu laden
2. [ ] Contact List links sichtbar (340px)?
3. [ ] Detail Area rechts leer (vor Contact-Auswahl)?
4. [ ] List scrollt korrekt?
5. [ ] Scrollbar versteckt?

**Interaktion Tests:**
6. [ ] Contact aus Liste klicken
7. [ ] Detail Area rechts zeigt Contact?
8. [ ] `/contacts/:email` Route funktioniert?
9. [ ] "Add Contact" Button funktioniert?
10. [ ] Contact Dialog öffnet?

**Responsive Tests:**
11. [ ] Desktop (>1200px): Split-View (340px + rest)?
12. [ ] Tablet: Funktioniert noch?
13. [ ] Mobile (<900px): Nur Liste oder nur Detail?

**Feedback:**
👍 **Alles OK?** → Weiter zu Phase 5  
❌ **Problem?** → Agent fixt

---

## 🚀 Phase 5: Legal/Privacy/Help Pages Migration

### **Checkpoint 5.0: Vor der Migration**

**User Action Required:** ✋ **STOP - Bitte bestätigen:**
- [ ] Contacts funktioniert ✅
- [ ] Bereit für letzte Phase (3 einfache Pages)
- [ ] `/legal-notice` im Browser öffnen

---

### **Step 5.1: Legal Notice Migration**

#### **5.1.1: HTML Wrapper hinzufügen**

**Datei:** `src/app/components/legal-notice/legal-notice.component.html`

**Änderung:**
```html
<!-- VORHER: -->
<main class="legal-main">
  <h1>Legal Notice</h1>
  <div class="legal-content">
    <!-- ... -->
  </div>
</main>

<!-- NACHHER: -->
<div class="legal-page">  <!-- ← NEU: Wrapper -->
  <main class="legal-main">
    <h1>Legal Notice</h1>
    <div class="legal-content">
      <!-- ... -->
    </div>
  </main>
</div>
```

**Ausführung:** Automatisch

---

#### **5.1.2: SCSS anpassen**

**Datei:** `src/app/components/legal-notice/legal-notice.component.scss`

**Änderung:**
```scss
// VORHER (Zeile 1-2):
@import '../../../styles/variables';
@import '../../../styles/mixins';

// NACHHER (Zeile 1-3):
@import '../../../styles/variables';
@import '../../../styles/mixins';
@import '../../../styles/page-layouts'; // ← NEU

// NEU: Wrapper mit Mixin
.legal-page {
  @include page-layout-standard;
}

// ÄNDERN (Zeile 4-12):
.legal-main {
  @include flex(column, flex-start, flex-start);
  max-width: 1200px;
  gap: $spacing-xl;

  h1 {
    @include page-title;
  }
}

// Bleibt wie ist:
.legal-content {
  @include page-content-scrollable; // ← Optional hinzufügen
  max-width: 950px;
  // ... Rest bleibt
}
```

**Ausführung:** Automatisch

---

### **Step 5.2: Privacy Policy Migration**

**Identisch zu Legal Notice:**

#### **5.2.1: HTML Wrapper**
```html
<div class="privacy-page">  <!-- ← NEU -->
  <main class="privacy-main">
    <!-- ... -->
  </main>
</div>
```

#### **5.2.2: SCSS**
```scss
@import '../../../styles/page-layouts'; // ← NEU

.privacy-page {
  @include page-layout-standard;
}

.privacy-main {
  max-width: 1200px;
  gap: $spacing-xl;
  // flex bereits durch Mixin im Wrapper
}

.privacy-content {
  @include page-content-scrollable; // ← Optional
  max-width: 950px;
}
```

**Ausführung:** Automatisch

---

### **Step 5.3: Help Page Migration**

**Datei:** `src/app/components/help/help.component.scss`

**Änderung:**
```scss
// VORHER (Zeile 1-2):
@import '../../../styles/variables';
@import '../../../styles/mixins';

// NACHHER (Zeile 1-3):
@import '../../../styles/variables';
@import '../../../styles/mixins';
@import '../../../styles/page-layouts'; // ← NEU

// VORHER (Zeile 4-10):
.help-main {
  @include flex(column, flex-start, flex-start);
  width: 100%;
  min-height: 100vh; // ❌ ENTFERNEN
  background: $background-color;
  padding: $spacing-xl; // ❌ ENTFERNEN
}

// NACHHER:
.help-main {
  @include page-layout-standard; // ← Ersetzt flex + padding
  background: $background-color;
}
```

**Was passiert:**
- ✅ `min-height: 100vh` entfernt (MainLayout managed Höhe)
- ✅ `padding` entfernt (Mixin fügt responsive Padding hinzu)
- ✅ Flexbox automatisch

**Ausführung:** Automatisch

---

### **Checkpoint 5.1: Nach Legal/Privacy/Help Migration**

**User Action Required:** ✋ **STOP - Bitte alle 3 Pages testen:**

**Legal Notice (`/legal-notice`):**
1. [ ] Page lädt korrekt?
2. [ ] Content zentriert (max-width 1200px)?
3. [ ] Padding Desktop 2rem?
4. [ ] Responsive funktioniert?
5. [ ] Content scrollt?
6. [ ] Footer sichtbar (Sidebar Links)?

**Privacy Policy (`/privacy-policy`):**
7. [ ] Page lädt korrekt?
8. [ ] Index Navigation sichtbar?
9. [ ] Sections korrekt formatiert?
10. [ ] Links funktionieren?

**Help Page (`/help`):**
11. [ ] Page lädt korrekt?
12. [ ] Back Button funktioniert?
13. [ ] Text Container (900px) zentriert?
14. [ ] Padding korrekt?

**Feedback:**
👍 **Alles OK?** → Weiter zu Phase 6 (Testing)  
❌ **Problem?** → Agent fixt

---

## 🧪 Phase 6: Comprehensive Testing & Validation

### **Checkpoint 6.0: Finale Test-Phase**

**User Action Required:** ✋ **STOP - Comprehensive Testing:**

### **6.1: Desktop Testing (>1200px)**

**Alle Pages durchgehen:**
- [ ] `/summary` - Desktop Layout, Padding 2rem
- [ ] `/add-task` - Form korrekt, Overlay funktioniert
- [ ] `/board` - 4 Spalten, Drag & Drop funktioniert
- [ ] `/contacts` - Split-View 340px + flex
- [ ] `/legal-notice` - Zentriert, max-width 1200px
- [ ] `/privacy-policy` - Zentriert, Navigation sichtbar
- [ ] `/help` - Zentriert, max-width 900px

**Header & Sidebar:**
- [ ] Header (90px) fixiert oben
- [ ] Sidebar (200px) fixiert links
- [ ] Content Area füllt Rest
- [ ] Kein Overlap

---

### **6.2: Tablet Testing (992-1064px)**

**Alle Pages durchgehen:**
- [ ] Schmale Sidebar (80px, nur Icons)
- [ ] Content Area nutzt restlichen Platz
- [ ] Padding reduziert auf 1.5rem
- [ ] Alle Pages lesbar
- [ ] Keine horizontalen Scrollbars

**Besonders testen:**
- [ ] Board: Spalten passen
- [ ] Contacts: Split-View funktioniert noch
- [ ] Summary: Cards responsive

---

### **6.3: Mobile Testing (<992px)**

**Alle Pages durchgehen:**
- [ ] Sidebar unten (80px Bottom Bar)
- [ ] Content Area füllt 100% width
- [ ] Padding 1rem oder 0.5rem
- [ ] Touch-Scrolling smooth
- [ ] Keine Elemente abgeschnitten

**Bottom Sidebar:**
- [ ] Icons sichtbar (Summary, Add Task, Board, Contacts)
- [ ] Aktive Page highlighted
- [ ] Tap funktioniert

---

### **6.4: Navigation Flow Testing**

**Route Transitions:**
- [ ] Summary → Board (Layout bleibt)
- [ ] Board → Add-Task (Layout bleibt)
- [ ] Add-Task → Contacts (Layout bleibt)
- [ ] Contacts → Help (Layout bleibt)
- [ ] Help → Legal Notice (Layout bleibt)

**Auth Flow:**
- [ ] Logout → Login (Layout verschwindet)
- [ ] Login → Summary (Layout erscheint)
- [ ] Direkter URL `/board` (Guard redirect wenn ausgeloggt)

---

### **6.5: Browser Testing**

**Minimum:**
- [ ] Chrome (Latest)
- [ ] Firefox (Latest)
- [ ] Edge (Latest)
- [ ] Safari (wenn verfügbar)

**Tests:**
- [ ] Alle Pages rendern korrekt
- [ ] CSS Grid funktioniert
- [ ] Flexbox Scrolling funktioniert
- [ ] Keine Konsolen-Errors

---

### **6.6: Performance Check**

**Dev Tools:**
- [ ] Lighthouse Score > 90
- [ ] Keine Layout Shifts (CLS < 0.1)
- [ ] Paint Times akzeptabel
- [ ] Memory Leaks? (Mehrmals navigieren)

---

### **Checkpoint 6.1: Final Sign-Off**

**User Action Required:** ✋ **FINAL APPROVAL:**

**Alle Tests bestanden?**
- [ ] Desktop ✅
- [ ] Tablet ✅
- [ ] Mobile ✅
- [ ] Navigation ✅
- [ ] Browser ✅
- [ ] Performance ✅

**Code-Qualität:**
- [ ] Keine Konsolen-Errors
- [ ] Keine Warnings
- [ ] CSS valide
- [ ] HTML valide

**Feedback:**
👍 **Alles perfekt?** → Phase 7 (Cleanup)  
❌ **Noch Probleme?** → Agent fixt, dann erneuter Test

---

## 🧹 Phase 7: Code Cleanup & Documentation

### **Step 7.1: Remove Dead Code**

**Agent führt aus:**
- Suche nach auskommentiertem Code
- Entfernen unused Imports
- Cleanup alte Media Queries (falls dupliziert)

**Files to check:**
- `summary-view.component.scss`
- `board-layout.scss`
- `contacts-list.component.scss`

**Ausführung:** Automatisch nach User-Approval

---

### **Step 7.2: Update README/Documentation**

**Erstelle:**
- Component-Status-Tabelle (welche Pages nutzen Mixins)
- Before/After Statistics (Zeilen Code reduziert)
- Migration-Lessons-Learned

**Ausführung:** Automatisch

---

### **Step 7.3: Final Git Commit**

**Commit Message:**
```
feat: Migrate all pages to CSS Grid Layout System

BREAKING CHANGES:
- Replaced absolute positioning with CSS Grid
- Unified responsive breakpoints
- Reduced SCSS code by ~70%

Pages migrated:
- Summary Page
- Add-Task Page
- Board Page (Kanban)
- Contacts Pages
- Legal Notice, Privacy Policy, Help

All tests passed:
- Desktop, Tablet, Mobile layouts
- Navigation flows
- Drag & Drop (Board)
- Split-View (Contacts)
```

**User Action:** Review & Push

---

## 📊 Expected Results

### **Code Reduction:**

| Component       | Before (Lines) | After (Lines) | Reduction |
|----------------|----------------|---------------|-----------|
| Summary        | 556            | ~400          | -28%      |
| Add-Task       | ~200           | ~150          | -25%      |
| Board          | 417            | ~300          | -28%      |
| Contacts       | 348            | ~250          | -28%      |
| Legal Notice   | 105            | ~70           | -33%      |
| Privacy Policy | 138            | ~100          | -28%      |
| Help           | 120            | ~80           | -33%      |
| **TOTAL**      | **1884**       | **~1350**     | **-28%**  |

### **Benefits:**

✅ **Maintainability:** Zentrale Mixins statt duplizierter Code  
✅ **Consistency:** Alle Pages nutzen gleiche Breakpoints  
✅ **Performance:** Weniger CSS, schnellere Render-Zeiten  
✅ **Scalability:** Neue Pages einfach mit Mixins erstellen  
✅ **Responsive:** Automatisch responsive ohne Manual Media Queries  

---

## 🚨 Rollback Plan

**Falls kritische Probleme auftreten:**

### **Option 1: Phase Rollback**
```bash
git revert <commit-hash-of-phase-X>
```

### **Option 2: Selective Undo**
- Einzelne Component zurücksetzen
- Alte SCSS aus Git History wiederherstellen

### **Option 3: Complete Rollback**
```bash
git reset --hard <commit-before-migration>
```

**Wichtig:** Immer vor jeder Phase committen!

---

## 📋 Summary of Changes

### **Phase 1: Summary Page**
- Import `page-layouts.scss`
- Apply `page-layout-standard` on `.main-summary`
- Remove `position: relative`

### **Phase 2: Add-Task Page**
- Import `page-layouts.scss`
- Apply `page-layout-standard` on `.add-task-container`
- Apply `page-header` on `.add-task-header`

### **Phase 3: Board Page**
- Import `page-layouts.scss` in `_board-layout.scss`
- Apply `page-layout-board` on `.board-container`
- Apply `page-header` on `.board-header`
- Apply `page-content-static` on `.board-columns`
- Remove `calc()` from `.board-column`

### **Phase 4: Contacts Pages**
- Import `page-layouts.scss`
- Apply `page-layout-contacts` on `.contacts-page`
- Replace `calc(100vh - ...)` with `height: 100%` in `.contacts-main`

### **Phase 5: Legal/Privacy/Help Pages**
- Import `page-layouts.scss` in alle 3 Components
- Add wrapper divs in HTML (legal-page, privacy-page)
- Apply `page-layout-standard` on wrappers/main
- Remove `min-height: 100vh` and manual padding
- Optional: Apply `page-content-scrollable`

### **Phase 6: Testing**
- Comprehensive testing all breakpoints
- Validate all interactions (Drag&Drop, Overlays, Forms)
- Cross-browser testing
- Performance validation

### **Phase 7: Cleanup**
- Remove dead code
- Update documentation
- Final git commit

---

## ✅ Execution Checklist

**Vor Start:**
- [ ] Git Status clean (alle Änderungen committed)
- [ ] Backup erstellt
- [ ] Dev Server läuft
- [ ] Browser bereit

**Während Migration:**
- [ ] Nach jeder Phase Checkpoint
- [ ] User-Feedback einholen
- [ ] Tests durchführen
- [ ] Bei Problemen STOP

**Nach Migration:**
- [ ] Alle Tests bestanden
- [ ] Code reviewed
- [ ] Documentation updated
- [ ] Git committed & pushed

---

**Status:** ✅ Plan erstellt - Bereit zur Ausführung  
**Nächster Schritt:** User-Approval für Phase 1 Start

**Bereit loszulegen?** 🚀
