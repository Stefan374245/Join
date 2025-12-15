# Click Outside Directive

## Beschreibung
Eine wiederverwendbare Angular Directive, die Click-Events außerhalb eines Elements erkennt.

## Verwendung

### 1. Import in Komponente
```typescript
import { ClickOutsideDirective } from '../../../shared/directives/click-outside.directive';

@Component({
  imports: [ClickOutsideDirective, /* andere imports */]
})
```

### 2. Template verwenden
```html
<div class="popup-container" (clickOutside)="closePopup()">
  <!-- Popup Content -->
</div>
```

### 3. Methode in Component
```typescript
closePopup() {
  this.showPopup = false;
}
```

## Beispiele

### User Dropdown Menu
```html
<div class="user-menu-container" (clickOutside)="closeUserMenu()">
  <button (click)="toggleUserMenu()">User</button>
  <div class="dropdown" *ngIf="showUserMenu">
    <!-- Menu items -->
  </div>
</div>
```

### FAB Action Menu
```html
<div class="fab-menu" (clickOutside)="closeActionMenu()">
  <button (click)="toggleActionMenu()">⋮</button>
  <div class="actions" *ngIf="showActionMenu">
    <!-- Actions -->
  </div>
</div>
```

### Modal/Dialog (Optional)
```html
<div class="modal-overlay" (clickOutside)="closeModal()">
  <div class="modal-content" (click)="$event.stopPropagation()">
    <!-- Modal content - clicks here won't close modal -->
  </div>
</div>
```

## Vorteile
- ✅ Wiederverwendbar im ganzen Projekt
- ✅ Konsistentes Verhalten
- ✅ Einfache Integration
- ✅ Keine duplizierte HostListener Logik
- ✅ Standalone Directive (Angular 18+)

## Bereits verwendet in:
- Header Component (User Dropdown)
- Contact Detail Component (FAB Menu)
- Contact List Component (FAB Menu)
