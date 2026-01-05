# 🎯 Angular Layout Refactoring - Quick Reference

## Das Problem (Was ihr vorher hattet)

```scss
// ❌ BAD - Absolute Positioning Chaos
.board-container {
  position: absolute;
  left: calc($sidebar-width + 24px);
  top: $header-height;
  height: calc(100vh - $header-height);
  
  @media (max-width: $breakpoint-lg-xl) {
    left: 110px;
  }
  @media (max-width: $breakpoint-lg) {
    left: 0;
    height: calc(100vh - $header-height - 80px);
  }
}
```

**Probleme:**
- 🐛 Position manuell berechnen
- 🐛 Bei jedem Resize verschieben sich Dinge
- 🐛 Jede Komponente hat eigene Media Queries
- 🐛 Magic Numbers überall

---

## Die Lösung (Was ihr jetzt habt)

### 1. **CSS Grid Layout** (main-layout.component.scss)

```scss
// ✅ GOOD - CSS Grid übernimmt alles
.app-grid {
  display: grid;
  height: 100vh;
  
  // Desktop: Header oben, Sidebar links
  grid-template-columns: 200px 1fr;
  grid-template-rows: 90px 1fr;
  grid-template-areas:
    "header header"
    "sidebar content";

  // Mobile: Sidebar unten
  @media (max-width: 992px) {
    grid-template-columns: 1fr;
    grid-template-rows: 90px 1fr 80px;
    grid-template-areas:
      "header"
      "content"
      "sidebar";
  }
}
```

### 2. **Page Komponenten** (board, contacts, etc.)

```scss
// ✅ GOOD - Einfach und clean
.page-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 2rem;
}

.page-header {
  flex-shrink: 0; // Nimmt nur nötigen Platz
}

.page-content {
  flex: 1;         // Nimmt restlichen Platz
  min-height: 0;   // ⭐ WICHTIG für Scrolling
  overflow-y: auto;
}
```

---

## Flexbox Scrolling Pattern

```scss
// Parent Container
.container {
  display: flex;
  flex-direction: column;
  height: 100%;          // Volle Höhe des Parents
}

// Fixed Header
.header {
  flex-shrink: 0;        // Nimmt nur nötigen Platz
  height: auto;
}

// Scrollable Content
.content {
  flex: 1;               // Nimmt restlichen Platz
  min-height: 0;         // ⭐ MAGIC - ermöglicht Scrolling
  overflow-y: auto;
}
```

**Warum `min-height: 0`?**
- Flexbox Children haben default `min-height: auto`
- Das verhindert Scrolling
- `min-height: 0` erlaubt Shrinking → Scrollbar erscheint

---

## Component Struktur Pattern

```html
<!-- board-view.component.html -->
<div class="board-container">
  
  <!-- Header: Fixed Size -->
  <header class="board-header">
    <h1>Board</h1>
    <div class="actions">...</div>
  </header>

  <!-- Content: Scrollable -->
  <section class="board-columns">
    <!-- Columns mit eigenem Scroll -->
  </section>

</div>
```

```scss
.board-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 2rem;
}

.board-header {
  flex-shrink: 0;
  margin-bottom: 2rem;
}

.board-columns {
  flex: 1;
  min-height: 0;
  // Columns Layout (Grid oder Flex)
}
```

---

## Media Query Strategie

### ⭐ Zentral im Layout (main-layout.component.scss):
```scss
// Alle Breakpoint-Logik HIER
.app-grid {
  @media (max-width: 1064px) { /* schmale sidebar */ }
  @media (max-width: 992px)  { /* mobile layout */ }
}
```

### Component-Level (nur für interne Anpassungen):
```scss
.board-columns {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr; // Single column
  }
}
```

---

## Debugging Checklist

### Problem: Content scrollt nicht
```scss
// ✅ Fix: height chain + min-height: 0
.parent {
  height: 100%;  // ← Parent muss height haben
}

.child {
  flex: 1;
  min-height: 0;  // ← Das!
  overflow-y: auto;
}
```

### Problem: Element nimmt nicht volle Höhe
```scss
// ✅ Fix: height chain überprüfen
html, body {
  height: 100%;
}

:host {
  display: block;
  height: 100%;
}

.container {
  height: 100%;
}
```

### Problem: Content wird unter Sidebar versteckt (Mobile)
```scss
// ❌ BAD - position: fixed
.sidebar {
  position: fixed;
  bottom: 0;
}

// ✅ GOOD - CSS Grid
.app-grid {
  @media (max-width: 992px) {
    grid-template-areas:
      "header"
      "content"
      "sidebar";  // ← Grid managed Position
  }
}
```

---

## Variables Usage

```scss
// _variables.scss
$header-height: 90px;
$sidebar-width: 200px;
$sidebar-width-collapsed: 80px;
$sidebar-mobile-height: 80px;

$breakpoint-lg-xl: 1064px;  // Collapsed sidebar
$breakpoint-lg: 992px;       // Mobile layout
$breakpoint-md: 768px;
```

```scss
// Verwendung
.app-grid {
  grid-template-columns: $sidebar-width 1fr;
  grid-template-rows: $header-height 1fr;
}
```

---

## Component Communication Pattern

### ❌ BAD - Components wissen über Layout:
```typescript
// board.component.ts
ngOnInit() {
  this.contentHeight = window.innerHeight - 90 - 180; // Magic!
}
```

### ✅ GOOD - Components sind layout-agnostic:
```typescript
// board.component.ts
ngOnInit() {
  this.loadTasks(); // Nur Business Logik
}
```

```scss
// board.component.scss
.board-container {
  height: 100%; // CSS übernimmt Layout
}
```

---

## Häufige Fehler vermeiden

### 1. Kein `position: absolute` für Layout
```scss
// ❌ NIEMALS
.page {
  position: absolute;
  top: 90px;
  left: 200px;
}

// ✅ IMMER
.page {
  height: 100%;
  // Grid/Flex managed Position
}
```

### 2. Kein `calc()` für Layout-Höhen
```scss
// ❌ NIEMALS
.content {
  height: calc(100vh - 90px - 80px - 40px);
}

// ✅ IMMER
.content {
  flex: 1;
  min-height: 0;
}
```

### 3. Kein `margin-top` für Spacing vom Header
```scss
// ❌ NIEMALS
.main-content {
  margin-top: 90px;
}

// ✅ IMMER
.app-grid {
  grid-template-rows: 90px 1fr; // CSS Grid
}
```

---

## Migration Steps für neue Pages

Wenn ihr eine neue Page hinzufügt:

1. **Erstelle im `/pages` Ordner:**
```
src/app/pages/my-page/
├── my-page.component.ts
├── my-page.component.html
└── my-page.component.scss
```

2. **Template Pattern:**
```html
<div class="page-container">
  <header class="page-header">
    <h1>Page Title</h1>
    <div class="actions">...</div>
  </header>
  
  <section class="page-content">
    <!-- Scrollable content -->
  </section>
</div>
```

3. **SCSS Pattern:**
```scss
.page-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 2rem;
}

.page-header {
  flex-shrink: 0;
  margin-bottom: 2rem;
}

.page-content {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
}
```

4. **Keine Media Queries nötig!**
   - Layout managed vom CSS Grid
   - Nur interne Component-Anpassungen

---

## Testing Checklist

Für jede geänderte Page:

- [ ] Desktop: Scrollt Content, Header/Sidebar fixed
- [ ] Tablet: Schmale Sidebar funktioniert
- [ ] Mobile: Bottom Sidebar, Content sichtbar
- [ ] Resize: Kein "Springen" der UI
- [ ] Overlays: Öffnen über Content
- [ ] Drag & Drop: Funktioniert

---

## Quick Wins

Diese Änderungen haben **sofort** große Verbesserung:

1. ✅ **MainLayoutComponent** - Eine Stelle für Layout
2. ✅ **CSS Grid** - Keine position: absolute mehr
3. ✅ **Flexbox + min-height: 0** - Perfektes Scrolling
4. ✅ **Variables** - Keine Magic Numbers
5. ✅ **Zentrale Media Queries** - Ein Ort für Responsive

---

**Happy Coding! 🚀**
