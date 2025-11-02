# Color System Documentation

## 📚 Overview

The Join project now has a comprehensive color system with SCSS variables, TypeScript constants, and reusable components.

## 🎨 SCSS Variables

### Location: `src/styles/_variables.scss`

### Primary Colors
```scss
$primary-color: #2A3647;        // Dark blue - main brand color
$primary-dark: #091931;          // Darker blue - hover states
$secondary-color: #29ABE2;       // Light blue - accent color
$accent-color: #0288d1;          // Alternative accent
```

### Background Colors
```scss
$background-color: #F6F7F8;              // Main background
$background-dragging-color: #ebeaeab0;   // Drag & drop state
```

### Text Colors
```scss
$text-color: #2A3647;            // Primary text
$text-underline-color: #29ABE2;  // Underlines, links
$font-color: #cdcdcd;            // Secondary/muted text
```

### Border Colors
```scss
$border-color: #D1D1D1;                    // Default borders
$border-color-focus-filled: #29ABE2;       // Focused/filled state
$border-color-required: #FF8190;           // Required fields
```

### State Colors
```scss
$hover-color: #29ABE2;           // Hover states
$highlight-color: #b2ebf2;       // Highlighted elements
$shadow-color: #00000040;        // Shadows
$error-color: #ff0000;           // Errors
$link-color: #007CEE;            // Links
```

### Priority Colors
```scss
$priority-color-low: #7AE229;      // Low priority (green)
$priority-color-medium: #FFA800;   // Medium priority (orange)
$priority-color-urgent: #FF3D00;   // Urgent priority (red)
```

### User Colors Map
```scss
$user-colors: (
  'FF7A00': #FF7A00,
  'FF5EB3': #FF5EB3,
  // ... 15 colors total
);
```

## 🛠️ SCSS Mixins

### Location: `src/styles/_mixins.scss`

### Generate User Colors
```scss
@include generate-user-colors();
// Generates .userColor-FF7A00, .userColor-FF5EB3, etc.
```

### Apply User Color
```scss
.my-element {
  @include user-color('FF7A00');
}
```

### Priority Indicator
```scss
.task-badge {
  @include priority-indicator('urgent');
}
```

## 📦 TypeScript Constants

### Location: `src/app/shared/constants/colors.constants.ts`

### User Colors Array
```typescript
import { USER_COLORS } from '@shared/constants/colors.constants';

const color = USER_COLORS[0]; // '#FF7A00'
```

### Priority Enum
```typescript
import { Priority } from '@shared/constants/colors.constants';

const priority = Priority.URGENT; // 'urgent'
```

### Helper Functions

#### Get User Color by Index
```typescript
import { getUserColor } from '@shared/constants/colors.constants';

const color = getUserColor(5); // Returns color at index 5
```

#### Get Consistent Color for User
```typescript
import { getUserColorByIdentifier } from '@shared/constants/colors.constants';

const color = getUserColorByIdentifier('user123');
// Always returns same color for 'user123'
```

#### Get User Initials
```typescript
import { getUserInitials } from '@shared/constants/colors.constants';

const initials = getUserInitials('John Doe'); // 'JD'
```

#### Get Color CSS Class
```typescript
import { getUserColorClass } from '@shared/constants/colors.constants';

const className = getUserColorClass('#FF7A00'); // 'userColor-FF7A00'
```

#### Get Random Color
```typescript
import { getRandomUserColor } from '@shared/constants/colors.constants';

const color = getRandomUserColor(); // Returns random color
```

## 🧩 User Avatar Component

### Location: `src/app/shared/components/user-avatar/`

### Basic Usage
```html
<app-user-avatar 
  name="John Doe"
  size="md">
</app-user-avatar>
```

### With Custom Color
```html
<app-user-avatar 
  name="Jane Smith"
  color="#FF7A00"
  size="lg">
</app-user-avatar>
```

### With Image
```html
<app-user-avatar 
  name="Alice Johnson"
  imageUrl="/assets/images/alice.jpg"
  size="sm">
</app-user-avatar>
```

### With User ID (Consistent Color)
```html
<app-user-avatar 
  name="Bob Wilson"
  userId="user123"
  size="md">
</app-user-avatar>
```

### Props
- `name` (required): User's full name
- `userId` (optional): User ID for consistent color
- `imageUrl` (optional): Profile image URL
- `size` (optional): 'sm' | 'md' | 'lg' (default: 'md')
- `color` (optional): Custom color hex code

## 🎯 Utility Classes

### Location: `src/styles/_utilities.scss`

### User Color Classes
```html
<div class="userColor-FF7A00">Orange background</div>
<div class="userColor-6E52FF">Purple background</div>
```

### Priority Badges
```html
<span class="priority-badge priority-low">Low</span>
<span class="priority-badge priority-medium">Medium</span>
<span class="priority-badge priority-urgent">Urgent</span>
```

### Background Colors
```html
<div class="bg-primary">Primary background</div>
<div class="bg-secondary">Secondary background</div>
<div class="bg-accent">Accent background</div>
```

### Text Colors
```html
<p class="text-primary">Primary text</p>
<p class="text-secondary">Secondary text</p>
<p class="text-link">Link text</p>
<p class="text-error">Error text</p>
```

### Border Colors
```html
<input class="border-primary">
<input class="border-focus">
<input class="border-required">
```

## 💡 Best Practices

### 1. Use Variables in SCSS
```scss
// ✅ Good
.my-button {
  background-color: $primary-color;
  &:hover {
    background-color: $hover-color;
  }
}

// ❌ Bad
.my-button {
  background-color: #2A3647;
  &:hover {
    background-color: #29ABE2;
  }
}
```

### 2. Use Constants in TypeScript
```typescript
// ✅ Good
import { Priority, PRIORITY_COLORS } from '@shared/constants/colors.constants';

const taskPriority = Priority.URGENT;
const color = PRIORITY_COLORS[taskPriority];

// ❌ Bad
const taskPriority = 'urgent';
const color = '#FF3D00';
```

### 3. Use User Avatar Component
```html
<!-- ✅ Good -->
<app-user-avatar name="John Doe" userId="123"></app-user-avatar>

<!-- ❌ Bad -->
<div class="userColor-FF7A00" style="width: 48px; height: 48px; border-radius: 50%;">
  JD
</div>
```

### 4. Consistent User Colors
```typescript
// ✅ Good - Same user always gets same color
import { getUserColorByIdentifier } from '@shared/constants/colors.constants';

users.forEach(user => {
  const color = getUserColorByIdentifier(user.id);
  // user.id '123' always gets same color
});

// ❌ Bad - Random color each time
users.forEach(user => {
  const color = getRandomUserColor();
  // Different color every render
});
```

## 🔄 Migration from Old System

### Before (CSS Variables)
```css
:root {
  --primary-color: #2A3647;
  --hover-color: #29ABE2;
}

.element {
  background-color: var(--primary-color);
}

.userColor-FF7A00 {
  background-color: #FF7A00;
}
```

### After (SCSS Variables + TypeScript)
```scss
// In SCSS
@import 'styles/variables';

.element {
  background-color: $primary-color;
}

// Utility classes auto-generated
```

```typescript
// In TypeScript
import { getUserColorByIdentifier } from '@shared/constants/colors.constants';

const color = getUserColorByIdentifier(userId);
```

## 📋 All Available Colors

### User Colors (15 total)
1. `#FF7A00` - Orange
2. `#FF5EB3` - Pink
3. `#6E52FF` - Purple
4. `#9327FF` - Violet
5. `#00BEE8` - Cyan
6. `#1FD7C1` - Teal
7. `#FF745E` - Coral
8. `#FFA35E` - Light Orange
9. `#FC71FF` - Magenta
10. `#FFC701` - Yellow
11. `#0038FF` - Blue
12. `#C3FF2B` - Lime
13. `#FFE62B` - Yellow-Green
14. `#FF4646` - Red
15. `#FFBB2B` - Amber

---

**The color system is now fully integrated and ready to use!** 🎨
