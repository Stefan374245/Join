# ✅ FINAL PRE-FLIGHT CHECK - Bereit zum Start

## 📐 Dimensionen & Breakpoints (VERIFIZIERT)

### **Variables (_variables.scss):**
```scss
$sidebar-width: 232px;              ✅ Desktop Sidebar
$sidebar-width-narrow: 80px;        ✅ Tablet schmale Sidebar
$sidebar-height-mobile: 80px;       ✅ Mobile Bottom Bar
$header-height: 96px;               ✅ Desktop Header
$header-height-mobile: 80px;        ✅ Mobile/Tablet Header

$breakpoint-lg: 992px;              ✅ Mobile Cutoff (Bottom Sidebar)
$breakpoint-lg-xl: 1064px;          ✅ Schmale Sidebar Cutoff
```

---

## 🎨 MainLayout Grid (main-layout.component.scss) - VERIFIZIERT

### **Desktop (>1200px):**
```scss
grid-template-columns: 232px 1fr;   ✅ Sidebar 232px + Content
grid-template-rows: 96px 1fr;       ✅ Header 96px + Content
grid-template-areas:
  "header header"
  "sidebar content";
```

### **Tablet (1064px - 992px):**
```scss
grid-template-columns: 80px 1fr;    ✅ Schmale Sidebar
grid-template-rows: 96px 1fr;       ✅ Header bleibt 96px
```

### **Mobile (<992px):**
```scss
grid-template-columns: 1fr;         ✅ Full Width Content
grid-template-rows: 80px 1fr 80px;  ✅ Header 80px + Content + Bottom 80px
grid-template-areas:
  "header"
  "content"
  "sidebar";
```

---

## 📄 Page Layout Mixins (_page-layouts.scss) - VERIFIZIERT

### **1. page-layout-standard (Summary, Add-Task, Legal, Privacy, Help)**

| Screen Size | Padding | Left Padding | Begründung |
|-------------|---------|--------------|------------|
| **Desktop (>1200px)** | `2rem` | `96px` | ✅ 96px Abstand zur 232px Sidebar |
| **Tablet (1064px-992px)** | `2rem` | `2rem` | ✅ Schmale Sidebar (80px), normales Padding |
| **Mobile (<992px)** | `1.5rem` | `1.5rem` | ✅ Bottom Sidebar, gleichmäßiges Padding |
| **Small (<768px)** | `1rem` | `1rem` | ✅ Kompakter |
| **XS (<576px)** | `0.5rem` | `0.5rem` | ✅ Max Content-Platz |

**Code:**
```scss
@mixin page-layout-standard {
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
  padding: $spacing-xl;              // 2rem
  padding-left: 96px;                // ✅ 96px Desktop
  box-sizing: border-box;

  @media (max-width: $breakpoint-lg-xl) {  // 1064px
    padding-left: $spacing-xl;       // ✅ 2rem (schmale Sidebar)
  }

  @media (max-width: $breakpoint-lg) {     // 992px
    padding: $spacing-lg;            // ✅ 1.5rem all sides
    padding-left: $spacing-lg;
  }

  @media (max-width: $breakpoint-md) {     // 768px
    padding: $spacing-md;            // ✅ 1rem
  }

  @media (max-width: $breakpoint-sm) {     // 576px
    padding: $spacing-sm;            // ✅ 0.5rem
  }
}
```

---

### **2. page-layout-board (Board)**

| Screen Size | Padding | Left Padding | Begründung |
|-------------|---------|--------------|------------|
| **Desktop (>1200px)** | `2rem` | `2rem` | ✅ Direkt an Sidebar, KEIN extra Abstand |
| **Tablet (<992px)** | `1.5rem` | `1.5rem` | ✅ Kompakter |
| **Mobile (<768px)** | `1rem` | `1rem` | ✅ Single Column |

**Code:**
```scss
@mixin page-layout-board {
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
  padding: $spacing-xl;              // 2rem all sides
  padding-left: $spacing-xl;         // ✅ KEIN extra Abstand
  box-sizing: border-box;

  @media (max-width: $breakpoint-lg) {     // 992px
    padding: $spacing-lg;            // ✅ 1.5rem
  }

  @media (max-width: $breakpoint-md) {     // 768px
    padding: $spacing-md;            // ✅ 1rem
  }
}
```

---

### **3. page-layout-contacts (Contacts)**

| Screen Size | Padding | Begründung |
|-------------|---------|------------|
| **Alle** | `0` | ✅ KEIN Padding, Split-View geht direkt an Sidebar ran |

**Code:**
```scss
@mixin page-layout-contacts {
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
  padding: 0;                        // ✅ KEIN Padding
  box-sizing: border-box;
}
```

---

## 🚀 Migration Plan - Phase für Phase

### **Phase 1: Summary Page** ⏱️ ~5 Minuten

**Änderungen:**
1. Import hinzufügen: `@import '../../../../styles/page-layouts';`
2. `.main-summary` → `@include page-layout-standard;`
3. Entfernen: `position: relative`

**Erwartetes Ergebnis:**
- Desktop: 96px left padding + 2rem other sides
- Tablet: 2rem all sides
- Mobile: 1.5rem all sides
- Content scrollt korrekt

**Test-Checklist:**
- [ ] Desktop: 96px Abstand zur Sidebar sichtbar?
- [ ] Tablet: Content passt mit 80px Sidebar?
- [ ] Mobile: Bottom Bar überlappt NICHT?
- [ ] Alle Summary Cards sichtbar?
- [ ] Responsive funktioniert smooth?

---

### **Phase 2: Add-Task Page** ⏱️ ~5 Minuten

**Änderungen:**
1. Import hinzufügen: `@import '../../../styles/page-layouts';`
2. `.add-task-container` → `@include page-layout-standard;`
3. `.add-task-header` → `@include page-header;`

**Erwartetes Ergebnis:**
- Desktop: 96px left padding
- Overlay-System bleibt unverändert
- Form funktioniert korrekt

**Test-Checklist:**
- [ ] Desktop: 96px Abstand zur Sidebar?
- [ ] Form alle Felder sichtbar?
- [ ] Overlay öffnet fullscreen?
- [ ] Assigned-To Dropdown funktioniert?
- [ ] Subtasks funktionieren?

---

### **Phase 3: Board Page** ⏱️ ~10 Minuten (KRITISCH - Drag & Drop!)

**Änderungen:**
1. Import in `_board-layout.scss`: `@import '../../../../styles/page-layouts';`
2. `.board-container` → `@include page-layout-board;`
3. `.board-header` → `@include page-header;`
4. `.board-columns` → `@include page-content-static;` (dann Grid override)
5. Entfernen: `height: calc(100vh - ...)` in `.board-column`

**Erwartetes Ergebnis:**
- Desktop: 2rem padding, direkt an Sidebar (kein 96px gap!)
- 4 Spalten nebeneinander
- Jede Spalte scrollt individuell

**Test-Checklist (WICHTIG!):**
- [ ] Desktop: Spalten direkt an Sidebar (KEIN 96px gap)?
- [ ] Alle 4 Spalten sichtbar?
- [ ] Spalten scrollen individuell?
- [ ] **Drag & Drop: Task greifen?**
- [ ] **Drag & Drop: Zwischen Spalten ziehen?**
- [ ] **Drag & Drop: Task bleibt nach Drop?**
- [ ] Task klicken → Detail Overlay öffnet?
- [ ] Mobile: Single Column Layout?

---

### **Phase 4: Contacts Pages** ⏱️ ~5 Minuten

**Änderungen:**
1. Import in `contacts-list.component.scss`: `@import '../../../../styles/page-layouts';`
2. `.contacts-page` → `@include page-layout-contacts;`
3. `.contacts-main` → `height: 100%;` (statt `calc(100vh - $header-height)`)

**Erwartetes Ergebnis:**
- KEIN Padding zur Sidebar (Split-View direkt ran)
- Left: 340px Contact List
- Right: Detail Area

**Test-Checklist:**
- [ ] Desktop: Liste direkt an Sidebar (0 padding)?
- [ ] Split-View: 340px + Rest funktioniert?
- [ ] Liste scrollt?
- [ ] Contact klicken → Detail rechts?
- [ ] "Add Contact" Dialog öffnet?
- [ ] Mobile: Nur Liste ODER Detail?

---

### **Phase 5: Legal/Privacy/Help Pages** ⏱️ ~10 Minuten (3 Pages)

**Änderungen pro Page:**
1. HTML Wrapper hinzufügen (z.B. `<div class="legal-page">`)
2. Import: `@import '../../../styles/page-layouts';`
3. Wrapper → `@include page-layout-standard;`
4. Optional: Content → `@include page-content-scrollable;`
5. Entfernen: `min-height: 100vh`, manuelle `padding`

**Erwartetes Ergebnis:**
- Desktop: 96px left padding
- Content max-width funktioniert
- Scrolling korrekt

**Test-Checklist:**
- [ ] Legal Notice: 96px gap, scrollt?
- [ ] Privacy Policy: Index Navigation funktioniert?
- [ ] Help: Back Button funktioniert?
- [ ] Alle responsive?

---

## 🎯 Visual Layout Behavior

### **Desktop (>1200px):**
```
┌─────────────────────────────────────────────────────────────┐
│ Header (96px)                                               │
├──────────────┬──────────────────────────────────────────────┤
│              │ Summary/Add-Task:                            │
│   Sidebar    │ [--96px gap--] Content starts here           │
│   (232px)    │                                              │
│              │ Board/Contacts:                              │
│              │ [2rem]Content directly (no 96px gap)         │
└──────────────┴──────────────────────────────────────────────┘
```

### **Tablet (1064px - 992px):**
```
┌─────────────────────────────────────────────────────────────┐
│ Header (96px)                                               │
├──────┬──────────────────────────────────────────────────────┤
│  S   │ Summary/Add-Task:                                    │
│  i   │ [2rem] Content                                       │
│  d   │                                                      │
│  e   │ Board/Contacts:                                      │
│ (80) │ [2rem] Content                                       │
└──────┴──────────────────────────────────────────────────────┘
```

### **Mobile (<992px):**
```
┌─────────────────────────────────────────────────────────────┐
│ Header (80px)                                               │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ Summary/Add-Task: [1.5rem padding]                         │
│ Board: [1.5rem padding]                                     │
│ Contacts: [no padding]                                      │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│ Bottom Sidebar (80px)                                       │
└─────────────────────────────────────────────────────────────┘
```

---

## 📊 Expected Code Reduction

| Component | Before | After | Reduction | Hauptgrund |
|-----------|--------|-------|-----------|------------|
| Summary | 556 lines | ~450 | -19% | Padding-Mixins, kein position: relative |
| Add-Task | ~200 | ~150 | -25% | Layout Mixins |
| Board | 417 | ~320 | -23% | Padding Mixins, kein calc() |
| Contacts | 348 | ~270 | -22% | Kein calc(), height: 100% |
| Legal | 105 | ~75 | -29% | Wrapper + Mixins |
| Privacy | 138 | ~105 | -24% | Wrapper + Mixins |
| Help | 120 | ~85 | -29% | Kein min-height, Mixins |
| **TOTAL** | **1884** | **~1455** | **-23%** | |

---

## ⚠️ KRITISCHE PUNKTE - Aufpassen!

### **1. Board Drag & Drop (Phase 3)**
**Problem:** Drag & Drop ist sehr fragil!
**Lösung:** 
- Testkriterien STRENG befolgen
- Wenn Problem: SOFORT stoppen
- Alte Version in Git verfügbar

### **2. Contacts Split-View (Phase 4)**
**Problem:** 340px left + flex right kann brechen
**Lösung:**
- Testen bei verschiedenen Breiten
- Mobile Ansicht prüfen (nur Liste ODER Detail)

### **3. Overlay-Systeme**
**Problem:** Add-Task und Board haben Overlays mit eigenem Positioning
**Lösung:**
- Overlays NICHT anfassen!
- Nur Page-Container migrieren

---

## ✅ PRE-FLIGHT CHECKLIST

**Vor Start:**
- [x] Variables updated (232px Sidebar, 96px Header)
- [x] MainLayout Grid updated (96px Desktop, 80px Mobile)
- [x] Page-Layouts Mixins erstellt (96px left für Standard)
- [x] Dokumentation vollständig
- [ ] Dev Server läuft (`npm start`)
- [ ] Browser bereit auf `/summary`
- [ ] Git Status clean (alles committed)

**Migration Ready:**
- [ ] Phase 1 Bereit (Summary)
- [ ] Phase 2 Bereit (Add-Task)
- [ ] Phase 3 Bereit (Board - KRITISCH!)
- [ ] Phase 4 Bereit (Contacts)
- [ ] Phase 5 Bereit (Legal/Privacy/Help)

---

## 🚦 START SIGNAL

**User Confirmation Required:**
1. ✅ Dimensionen korrekt? (232px Sidebar, 96px Header Desktop, 80px Mobile)
2. ✅ Layout-Logik verstanden? (96px gap nur Summary/Add-Task, nicht Board/Contacts)
3. ✅ Test-Strategie klar? (Nach jeder Phase Checkpoint)
4. ✅ Bereit zu starten?

---

**Wenn ALLE Checkboxen ✅, dann:**

🚀 **READY TO START PHASE 1 (SUMMARY PAGE)**
