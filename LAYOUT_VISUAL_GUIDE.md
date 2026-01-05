# 🎨 Layout Design Patterns - Visual Reference

## 📐 Layout-Typen im Vergleich

```
┌─────────────────────────────────────────────────────────────────┐
│                          HEADER (90px)                          │
│  Logo  Title                              Help  [User Avatar]   │
└─────────────────────────────────────────────────────────────────┘
┌─────┬───────────────────────────────────────────────────────────┐
│     │                                                             │
│  S  │  ┌────────────────────────────────────────────────────┐   │
│  I  │  │  PAGE TITLE              [Actions]                 │   │
│  D  │  └────────────────────────────────────────────────────┘   │
│  E  │                                                             │
│  B  │  ┌────────────────────────────────────────────────────┐   │
│  A  │  │                                                     │   │
│  R  │  │            SCROLLABLE CONTENT AREA                 │   │
│     │  │                                                     │   │
│ 200 │  │  ← Standard Pages: Summary, Add-Task, Legal       │   │
│ px  │  │  ← Padding: 2rem (Desktop) → 1rem (Mobile)        │   │
│     │  │                                                     │   │
│     │  │                                                     │   │
│     │  └────────────────────────────────────────────────────┘   │
│     │                                                             │
└─────┴───────────────────────────────────────────────────────────┘
```

---

## 🎯 Pattern 1: Standard Page (Summary, Add-Task, Legal, Privacy)

### **Desktop Layout (> 992px)**

```
┌──────────────────────────────────────────────────────────────────┐
│                        HEADER (90px)                             │
└──────────────────────────────────────────────────────────────────┘
┌────────┬─────────────────────────────────────────────────────────┐
│        │ ← 2rem padding →                                        │
│        │  ┌──────────────────────────────────────────────────┐   │
│        │  │  Summary  |  Key Metrics                         │   │
│        │  └──────────────────────────────────────────────────┘   │
│ SIDE   │  ↕ 2rem margin                                          │
│ BAR    │  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐          │
│ 200px  │  │ Card 1 │ │ Card 2 │ │ Card 3 │ │ Card 4 │          │
│        │  │        │ │        │ │        │ │        │          │
│        │  └────────┘ └────────┘ └────────┘ └────────┘          │
│        │                                                          │
│        │  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐          │
│        │  │ Card 5 │ │ Card 6 │ │ Card 7 │ │ Card 8 │          │
│        │  └────────┘ └────────┘ └────────┘ └────────┘          │
│        │                                                          │
└────────┴──────────────────────────────────────────────────────────┘
```

**SCSS:**
```scss
.main-summary {
  @include page-layout-standard; // Padding + Responsive
}

.summary-grid {
  @include content-grid($columns: 4); // Auto-Responsive
}
```

### **Mobile Layout (< 992px)**

```
┌──────────────────────────────────────┐
│         HEADER (90px)                │
└──────────────────────────────────────┘
│ ← 1rem padding →                     │
│  ┌──────────────────────────────┐    │
│  │  Summary                     │    │
│  └──────────────────────────────┘    │
│                                       │
│  ┌──────────────────────────────┐    │
│  │         Card 1               │    │
│  └──────────────────────────────┘    │
│  ┌──────────────────────────────┐    │
│  │         Card 2               │    │
│  └──────────────────────────────┘    │
│  ┌──────────────────────────────┐    │
│  │         Card 3               │    │
│  └──────────────────────────────┘    │
│                                       │
│                (scrollable)          │
└───────────────────────────────────────┘
┌──────────────────────────────────────┐
│      SIDEBAR (80px) - Bottom         │
│   Summary | Add Task | Board | ...  │
└──────────────────────────────────────┘
```

---

## 🎯 Pattern 2: Board Page (Kanban)

### **Desktop Layout**

```
┌──────────────────────────────────────────────────────────────────┐
│                        HEADER (90px)                             │
└──────────────────────────────────────────────────────────────────┘
┌────────┬─────────────────────────────────────────────────────────┐
│        │ ← 2rem padding →                                        │
│        │  ┌──────────────────────────────────────────────────┐   │
│        │  │  Board          [Search] [+ Add Task]            │   │
│        │  └──────────────────────────────────────────────────┘   │
│        │                                                          │
│ SIDE   │  ┌─────┐  ┌─────┐  ┌─────┐  ┌─────┐  ┌─────┐         │
│ BAR    │  │Tria │  │To Do│  │Prog │  │Await│  │Done │         │
│ 200px  │  ├─────┤  ├─────┤  ├─────┤  ├─────┤  ├─────┤         │
│        │  │[+]  │  │[+]  │  │[+]  │  │[+]  │  │[+]  │         │
│        │  ├─────┤  ├─────┤  ├─────┤  ├─────┤  ├─────┤         │
│        │  │Task │  │Task │  │Task │  │Task │  │Task │         │
│        │  │ 1   │  │ 3   │  │ 5   │  │ 7   │  │ 9   │         │
│        │  ├─────┤  ├─────┤  ├─────┤  ├─────┤  ├─────┤         │
│        │  │Task │  │Task │  │Task │  │Task │  │     │         │
│        │  │ 2   │  │ 4   │  │ 6   │  │ 8   │  │     │         │
│        │  │     │  │     │  │     │  │     │  │     │         │
│        │  │  ↕  │  │  ↕  │  │  ↕  │  │  ↕  │  │  ↕  │ ← Scroll
│        │  │     │  │     │  │     │  │     │  │     │         │
└────────┴──────────────────────────────────────────────────────────┘
```

**SCSS:**
```scss
.board-container {
  @include page-layout-board;
}

.board-columns {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 26px;
  
  @include page-content-static; // Kein Scroll hier
}

.board-column {
  .column-content {
    @include page-content-scrollable-hidden; // Spalten scrollen
  }
}
```

---

## 🎯 Pattern 3: Contacts Page (Split-View)

### **Desktop Layout**

```
┌──────────────────────────────────────────────────────────────────┐
│                        HEADER (90px)                             │
└──────────────────────────────────────────────────────────────────┘
┌────────┬─────────────────────────────────────────────────────────┐
│        │ ⚠️ KEIN PADDING                                         │
│        │┌────────────────┬───────────────────────────────────┐   │
│        ││  CONTACTS      │  CONTACT DETAIL                   │   │
│        ││                │                                    │   │
│        ││  [+ New]       │  ┌────────────────────────────┐   │   │
│ SIDE   ││  ─────────────│  │    [Avatar]                │   │   │
│ BAR    ││  Anton Meyer  ││  │                            │   │   │
│ 200px  ││  [AM]  Anton  ││  │    Anton Meyer            │   │   │
│        ││                │  │    anton@example.com       │   │   │
│        ││  Ben Schmidt  ││  │    +49 123 456789         │   │   │
│        ││  [BS]  Ben    ││  │                            │   │   │
│        ││         ↕      │  │    [Edit] [Delete]        │   │   │
│        ││      Scroll    │  └────────────────────────────┘   │   │
│        ││                │                                    │   │
│        ││  340px         │  Flex: 1                          │   │
│        │└────────────────┴───────────────────────────────────┘   │
└────────┴─────────────────────────────────────────────────────────┘
```

**SCSS:**
```scss
.contacts-page {
  @include page-layout-contacts; // KEIN Padding!
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
  overflow: hidden; // Detail View hat eigenes Scroll
}
```

---

## 🎯 Pattern 4: Auth Pages (Fullscreen)

### **Welcome/Login Layout (Standalone)**

```
┌──────────────────────────────────────────────────────────────────┐
│                                                                    │
│                                                                    │
│                     ┌─────────────────────┐                       │
│                     │                     │                       │
│                     │   [Join Logo]      │                       │
│                     │                     │                       │
│                     │   Welcome to Join   │                       │
│                     │                     │                       │
│                     │  ┌──────────────┐  │                       │
│                     │  │   Login      │  │                       │
│                     │  └──────────────┘  │                       │
│                     │  ┌──────────────┐  │                       │
│                     │  │  Guest Login │  │                       │
│                     │  └──────────────┘  │                       │
│                     │                     │                       │
│                     └─────────────────────┘                       │
│                                                                    │
│                                                                    │
└──────────────────────────────────────────────────────────────────┘
```

**SCSS:**
```scss
// KEINE MainLayout!
.welcome-page {
  width: 100vw;
  height: 100vh;
  display: grid;
  place-items: center;
  background-color: $primary-color;
}

.welcome-card {
  // Eigenes Styling - KEIN Mixin nötig
}
```

---

## 📱 Responsive Breakpoints

### **Desktop (> 1200px)**
```scss
// Standard Sidebar (200px)
// Volle Grid-Ansicht (4 Spalten)
// Padding: 2rem
```

### **Tablet (992px - 1064px)**
```scss
// Schmale Sidebar (80px) - Nur Icons
// Grid: 3 Spalten
// Padding: 1.5rem
```

### **Mobile (< 992px)**
```scss
// Bottom Sidebar (80px)
// Grid: 1 Spalte
// Padding: 1rem
// Content: 100vh - Header - Bottom Sidebar
```

---

## 🎨 CSS Grid Layout (Main-Layout)

### **Desktop Grid**
```scss
.app-grid {
  display: grid;
  height: 100vh;
  grid-template-columns: 200px 1fr;
  grid-template-rows: 90px 1fr;
  grid-template-areas:
    "header header"
    "sidebar content";
}
```

**Visual:**
```
┌──────────┬────────────────────────┐
│  HEADER  │      HEADER            │ 90px
├──────────┼────────────────────────┤
│          │                        │
│  SIDEBAR │      CONTENT           │ 1fr
│  200px   │      (scrolls)         │
│          │                        │
└──────────┴────────────────────────┘
```

### **Mobile Grid**
```scss
@media (max-width: 992px) {
  .app-grid {
    grid-template-columns: 1fr;
    grid-template-rows: 90px 1fr 80px;
    grid-template-areas:
      "header"
      "content"
      "sidebar";
  }
}
```

**Visual:**
```
┌────────────────────┐
│      HEADER        │ 90px
├────────────────────┤
│                    │
│      CONTENT       │ 1fr
│     (scrolls)      │
│                    │
├────────────────────┤
│      SIDEBAR       │ 80px
└────────────────────┘
```

---

## 🔑 Key Design Principles

### **1. Container → Content Hierarchy**
```scss
.page-container {
  @include page-layout-standard;  // ← Layout-Verantwortung
  
  .page-header {
    @include page-header;          // ← Fixed Section
  }
  
  .page-content {
    @include page-content-scrollable;  // ← Scrollable Section
  }
}
```

### **2. Flexbox Scrolling Pattern**
```scss
.parent {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.fixed-header {
  flex-shrink: 0;  // ← Nimmt nur nötigen Platz
}

.scrollable-content {
  flex: 1;         // ← Nimmt restlichen Platz
  min-height: 0;   // ← MAGIC für Scrolling
  overflow-y: auto;
}
```

### **3. Responsive Padding**
```scss
// Desktop
padding: 2rem;      // 32px

// Tablet
padding: 1.5rem;    // 24px

// Mobile
padding: 1rem;      // 16px

// Small Mobile
padding: 0.5rem;    // 8px
```

---

## 🎯 Mixin Usage Matrix

| Page Type          | Layout Mixin              | Header Mixin  | Content Mixin           |
|--------------------|---------------------------|---------------|-------------------------|
| Summary            | `page-layout-standard`    | `page-header` | `page-content-scrollable` |
| Add-Task           | `page-layout-standard`    | `page-header` | `page-content-scrollable` |
| Board              | `page-layout-board`       | `page-header` | `page-content-static`   |
| Contacts           | `page-layout-contacts`    | (custom)      | (custom split-view)     |
| Legal/Privacy/Help | `page-layout-standard`    | (inline h1)   | `page-content-scrollable` |
| Welcome/Auth       | (none - standalone)       | (none)        | (none)                  |

---

## 📐 Spacing System

```scss
$spacing-xs:  0.25rem;  // 4px
$spacing-sm:  0.5rem;   // 8px
$spacing-md:  1rem;     // 16px
$spacing-lg:  1.5rem;   // 24px
$spacing-xl:  2rem;     // 32px

// Verwendung
gap: $spacing-lg;        // Zwischen Cards
padding: $spacing-xl;    // Page Padding
margin-bottom: $spacing-xl;  // Header Margin
```

---

## ✅ Implementation Checklist

Für jede Page:

1. [ ] Layout Mixin identifiziert
2. [ ] Import hinzugefügt
3. [ ] Mixin angewendet
4. [ ] Alte CSS entfernt
5. [ ] Desktop getestet
6. [ ] Tablet getestet
7. [ ] Mobile getestet
8. [ ] Interaktionen getestet

---

**Diese Patterns sind jetzt implementiert und bereit zur Nutzung! 🎉**
