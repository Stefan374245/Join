# SCSS Struktur Dokumentation

## 📁 Verzeichnisstruktur

```
src/
├── styles/
│   ├── components/
│   │   ├── _animations.scss        # Keyframe Animations (shine, slideInFromRight, spin)
│   │   ├── _task-cards.scss        # Task Card gemeinsame Styles
│   │   ├── _buttons.scss           # Button Styles (action-btn, close-btn, etc.)
│   │   └── _overlays.scss          # Overlay & Dialog Patterns
│   ├── _variables.scss
│   ├── _mixins.scss
│   ├── _scrollbar.scss
│   └── _utilities.scss
│
└── app/
    └── components/
        └── board/
            ├── styles/
            │   ├── _board-variables.scss    # Board-spezifische Variablen
            │   ├── _board-layout.scss       # Board Container, Columns, Cards
            │   ├── _board-search.scss       # Search Wrapper Styles
            │   ├── _progress-bars.scss      # Progress Bar Styles (nur Board)
            │   └── _drag-drop.scss          # CDK Drag & Drop (nur Board)
            │
            ├── board-view/
            │   └── board-view.component.scss  (von 845 → ~15 Zeilen)
            │
            └── task-detail/
                └── task-detail.component.scss  (von 502 → ~150 Zeilen)
```

## 🎯 Wiederverwendbare Komponenten

### 1. `_animations.scss`
Enthält alle Keyframe-Animationen:
- `@keyframes shine` - Progress Bar Glanz-Effekt
- `@keyframes slideInFromRight` - Overlay Slide-In
- `@keyframes spin` - Loading Spinner

**Verwendung in:**
- Board View (Progress Bars)
- Task Detail (Overlay, Loading)

---

### 2. `_task-cards.scss`
Gemeinsame Task Card Styles:
- `.task-category` - User Story / Technical Task Badges
- `.task-title` - Titel mit line-clamp (2 Zeilen)
- `.task-description` - Beschreibung mit line-clamp (3 Zeilen)
- `.task-priority` - Priority Icon Layout
- `.task-content` overrides für Detail View

**Verwendung in:**
- Board View (Task Cards in Columns)
- Task Detail (Detail Overlay)

**Ersparnis:** ~80 Zeilen pro Component

---

### 3. `_buttons.scss`
Button-Varianten:
- `.btn-add-task` - Primärer Add Task Button
- `.btn-add-column-task` - Column Add Button (30x30px)
- `.action-btn` - Generic Action Button (Edit, Delete)
- `.close-btn` - Overlay Close Button (32x32px)

**Verwendung in:**
- Board View (Add Task, Column Tasks)
- Task Detail (Edit, Delete, Close)
- Andere Components (Contact Dialog, etc.)

**Ersparnis:** ~60 Zeilen pro Component

---

### 4. `_progress-bars.scss` (Board-spezifisch)
Subtask Progress System:
- `.task-progress` - Container mit States
- `.progress-bar` / `.progress-fill` - Bar Layout
- `.all-completed` State - Grüner Glow bei 100%
- `.has-incomplete` State - Roter Glow bei <100%
- `.subtask-count` - Count Label

**Verwendung in:**
- Board View (Task Cards)

**Ersparnis:** ~150 Zeilen

**Ort:** `src/app/components/board/styles/_progress-bars.scss`

---

### 5. `_drag-drop.scss` (Board-spezifisch)
CDK Drag & Drop Styles:
- `.cdk-drag-preview` - Dragging State
- `.drag-placeholder` - Drop Target Indicator
- `.cdk-drop-list-dragging` - Column States
- `.highlight-container` - Hover Effects

**Verwendung in:**
- Board View (Kanban Columns)

**Ersparnis:** ~70 Zeilen

**Ort:** `src/app/components/board/styles/_drag-drop.scss`

---

##
---

### 6. `_drag-drop.scss`
CDK Drag & Drop Styles:
- `.cdk-drag-preview` - Dragging State
- `.drag-placeholder` - Drop Target Indicator
- `.cdk-drop-list-dragging` - Column States
- `.highlight-container` - Hover Effects

**Verwendung in:**
- Board View (Kanban Columns)

**Ersparnis:** ~70 Zeilen

---

## 🏗️ Board-Spezifische Styles

### `_board-variables.scss`
Board-spezifische Variablen:
```scss
$board-padding: 60px;
$board-gap: 26px;
$card-spacing: 26px;
$card-radius: 30px;
$card-padding: 18px;
$column-count: 5;
$header-height: 54px;
```

### `_board-layout.scss`
Board Layout System:
- `.board-container` - Main Container
- `.board-header` - Header mit Titel & Actions
- `.board-columns` - 5-Column Grid Layout
- `.board-column` - Single Column
- `.task-card` - Card Base Layout
- Responsive Breakpoints (768px)

### `_board-search.scss`
Search Input Component:
- `.search-wrapper` - Container
- `.search-input` - Input Field
- `.search-icon` - Icon Button
- Mobile Breakpoint (1024px)

---

## 📦 Import-Reihenfolge

### Board View Component
```scss
@import "../../../../styles/variables";
@import "../../../../styles/mixins";
@import "../../../../styles/scrollbar";

// Shared Components
@import "../../../../styles/components/animations";
@import "../../../../styles/components/task-cards";
@import "../../../../styles/components/buttons";
@import "../../../../styles/components/progress-bars";
@import "../../../../styles/components/drag-drop";

// Board-Specific
@import "../styles/board-variables";
@import "../styles/board-layout";
@import "../styles/board-search";

// Component-specific overrides only
```

### Task Detail Component
```scss
@import "../../../../styles/variables";

// Board-Specific
@import "../styles/board-variables";
@import "../styles/board-layout";
@import "../styles/board-search";
@import "../styles/progress-bars";
@import "../styles/drag-dropponents/overlays";

// Component-specific styles
```

---

## 📊 Gesamte Einsparungen

| Component                  | Vorher | Nachher | Ersparnis |
|---------------------------|--------|---------|-----------|
| board-view.component.scss | 845    | ~15     | ~98%      |
| task-detail.component.scss| 502    | ~150    | ~70%      |
| **Gesamt**                | 1347   | ~165    | **~88%**  |

**Wiederverwendbare Partials:** ~600 Zeilen
**Netto-Ersparnis:** ~750 Zeilen (durch Wiederverwendung)

---

## 🔄 Wartbarkeit

### Vorteile:
✅ **DRY-Prinzip**: Kein duplizierter Code mehr
✅ **Zentrale Wartung**: Änderungen an einer Stelle wirken global
✅ **Bessere Übersicht**: Components nur mit spezifischen Styles
✅ **Wiederverwendbarkeit**: Einfach in neue Components importieren
✅ **Konsistenz**: Einheitliches Styling über alle Components

### Nachteile:
⚠️ **Mehrere Dateien**: Mehr Dateien zu verwalten
⚠️ **Import-Overhead**: Mehr Imports pro Component

---

## 🚀 Verwendung in neuen Components

Beispiel für neuen Summary Component:

```scss
@import "../../../../styles/variables";
@import "../../../../styles/mixins";

// Importiere nur was du brauchst
@import "../../../../styles/components/animations";
@import "../../../../styles/components/task-cards";
@import "../../../../styles/components/progress-bars";

// Component-specific styles
.summary-container {
  // Deine spezifischen Styles
}
```

---

## 📝 Best Practices

1. **Import nur was du brauchst** - Nicht alle Partials in jeder Component
2. **Component-specific zuletzt** - Überschreibt Shared Styles
3. **Variablen verwenden** - Nutze `$board-gap`, `$card-radius`, etc.
4. **Keine Duplikate** - Prüfe erst Shared Styles vor neuen Styles
5. **Dokumentation** - Kommentiere komplexe Overrides

---

## 🔧 Zukünftige Erweiterungen

Weitere mögliche Partials:
- `_forms.scss` - Formular Styles (Input, Textarea, etc.)
- `_tables.scss` - Tabellen Layouts
- `_modals.scss` - Additional Modal Patterns
- `_avatars.scss` - User Avatar Styles
- `_badges.scss` - Badge Components

---

**Erstellt am:** 15. Dezember 2024
**Autor:** Angular SCSS Refactoring
**Version:** 1.0
