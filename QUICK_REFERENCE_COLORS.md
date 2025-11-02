# 🎨 Color System - Quick Reference Card

## SCSS Variables (Most Used)

```scss
// Import first
@import 'styles/variables';

// Colors
$primary-color: #2A3647;
$secondary-color: #29ABE2;
$background-color: #F6F7F8;
$text-color: #2A3647;
$hover-color: #29ABE2;
$border-color: #D1D1D1;
$error-color: #ff0000;
$link-color: #007CEE;

// Priority
$priority-color-low: #7AE229;
$priority-color-medium: #FFA800;
$priority-color-urgent: #FF3D00;
```

## HTML Utility Classes

```html
<!-- User Colors -->
<div class="userColor-FF7A00"></div>
<div class="userColor-6E52FF"></div>

<!-- Priority Badges -->
<span class="priority-badge priority-low">Low</span>
<span class="priority-badge priority-medium">Medium</span>
<span class="priority-badge priority-urgent">Urgent</span>

<!-- User Avatar -->
<div class="user-avatar size-md userColor-FF5EB3">
  <span class="avatar-initials">JD</span>
</div>

<!-- Backgrounds -->
<div class="bg-primary"></div>
<div class="bg-secondary"></div>

<!-- Text -->
<p class="text-link">Link</p>
<p class="text-error">Error</p>

<!-- Borders -->
<input class="border-focus">
<input class="border-required">
```

## TypeScript Functions

```typescript
import { 
  getUserColorByIdentifier,
  getUserInitials,
  getUserColorClass,
  Priority,
  PRIORITY_COLORS 
} from '@shared/constants/colors.constants';

// Get user color (consistent for same ID)
const color = getUserColorByIdentifier('user123');

// Get user initials
const initials = getUserInitials('John Doe'); // 'JD'

// Get CSS class name
const className = getUserColorClass('#FF7A00'); // 'userColor-FF7A00'

// Get priority color
const color = PRIORITY_COLORS[Priority.URGENT]; // '#FF3D00'
```

## Angular Component

```html
<app-user-avatar 
  name="John Doe"
  userId="user123"
  size="md">
</app-user-avatar>
```

```typescript
// Props:
// name: string (required)
// userId?: string
// imageUrl?: string
// size?: 'sm' | 'md' | 'lg'
// color?: string
```

## SCSS Mixins

```scss
@import 'styles/mixins';

// Generate all user color classes
@include generate-user-colors();

// Apply specific user color
.element {
  @include user-color('FF7A00');
}

// Apply priority color
.badge {
  @include priority-indicator('urgent');
}
```

## 15 User Colors

```
#FF7A00  #FF5EB3  #6E52FF  #9327FF  #00BEE8
#1FD7C1  #FF745E  #FFA35E  #FC71FF  #FFC701
#0038FF  #C3FF2B  #FFE62B  #FF4646  #FFBB2B
```

---
📖 See `COLOR_SYSTEM.md` for complete documentation
