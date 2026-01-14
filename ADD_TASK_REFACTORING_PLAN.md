# 🔧 AddTask Refactoring Plan
## Modular Component Architecture mit Presentational/Components Pattern

---

## 🎯 Ziele

1. **Modularität**: Wiederverwendbare UI-Komponenten extrahieren
2. **Best Practices**: Smart/Dumb Component Pattern umsetzen
3. **Wartbarkeit**: Klare Separation of Concerns
4. **Erweiterbarkeit**: Vorbereitung für File Upload Feature
5. **Konsistenz**: Gleiche Struktur wie Board (presentational/components)

---

## 📁 Neue Ordnerstruktur

```
features/add-task/
├── add-task.component.ts (Smart Component - bleibt)
├── add-task.component.html (Delegiert zu presentational)
├── add-task.component.scss
│
├── presentational/
│   └── add-task-form/
│       ├── add-task-form.component.ts (Presentational - Form Layout)
│       ├── add-task-form.component.html
│       └── add-task-form.component.scss
│
└── components/
    ├── form-field/
    │   ├── form-field.component.ts (Generisch!)
    │   ├── form-field.component.html
    │   └── form-field.component.scss
    │
    ├── dropdown/
    │   ├── dropdown.component.ts (Generisch!)
    │   ├── dropdown.component.html
    │   └── dropdown.component.scss
    │
    ├── button-group/
    │   ├── button-group.component.ts (Generisch!)
    │   ├── button-group.component.html
    │   └── button-group.component.scss
    │
    ├── badge-list/
    │   ├── badge-list.component.ts (Generisch!)
    │   ├── badge-list.component.html
    │   └── badge-list.component.scss
    │
    └── subtask-management/
        ├── subtask-management.component.ts (Domain-spezifisch)
        ├── subtask-management.component.html
        └── subtask-management.component.scss
```

---

## 💡 Überarbeiteter Ansatz: Generische Components!

### Warum generisch?
- ✅ **Weniger Components** (4 statt 8!)
- ✅ **Mehr Wiederverwendbarkeit** (überall einsetzbar)
- ✅ **Einfacher zu warten** (eine Stelle für Änderungen)
- ✅ **Flexibler** (konfigurierbar statt hardcoded)
- ✅ **DRY Prinzip** (Don't Repeat Yourself)

### Neue Component-Liste:

#### **Shared UI Components** (generisch, überall nutzbar):
1. 🎨 **FormFieldComponent** - Universelles Input/Textarea/Date
2. 📋 **DropdownComponent** - Generisches Select mit Multi-Select
3. 🔘 **ButtonGroupComponent** - Generische Button-Gruppe
4. 🏷️ **BadgeListComponent** - Generische Badge-Anzeige

#### **Domain Components** (AddTask-spezifisch):
5. 📝 **SubtaskManagementComponent** - Gesamte Subtask-Logik (bleibt eigenständig)

---

## 🧩 Component Breakdown

### 1️⃣ Smart Component (bleibt)

**`add-task.component.ts`**
- **Rolle**: Business Logic, State Management, API Calls
- **Verantwortlichkeiten**:
  - Signal-basierter State
  - TaskService/ContactService Integration
  - Form Validation
  - Submit Logic
  - Navigation
- **Template**: Nur Wrapper für Presentational Component

```typescript
@Component({
  selector: 'app-add-task',
  template: `
    <app-add-task-form
      [isOverlay]="isOverlay()"
      [isEditMode]="isEditMode()"
      [formData]="taskForm"
      [selectedPriority]="selectedPriority()"
      [selectedContacts]="selectedContacts()"
      [selectedCategory]="selectedCategory()"
      [subtasks]="subtasks()"
      [availableContacts]="availableContacts()"
      [categories]="categories"
      [minDate]="minDate()"
      (priorityChange)="selectPriority($event)"
      (contactsChange)="handleContactsChange($event)"
      (categoryChange)="selectCategory($event)"
      (subtaskAdd)="addSubtask($event)"
      (subtaskEdit)="editSubtask($event)"
      (subtaskDelete)="deleteSubtask($event)"
      (formSubmit)="onSubmit()"
      (formClear)="clearForm()"
      (close)="onClose()"
    />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AddTaskComponent { }
```

---

### 2️⃣ Presentational Component

**`add-task-form.component.ts`**
- **Rolle**: Layout & Struktur, keine Business Logic
- **Verantwortlichkeiten**:
  - Form Layout (2-Column Grid)
  - Component Orchestrierung
  - Event Delegation
  - UI States (Dropdowns, Focus)
- **Inputs**: Alle Daten via Signal Inputs
- **Outputs**: Alle Events via EventEmitter

```typescript
@Component({
  selector: 'app-add-task-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormInputComponent,
    FormTextareaComponent,
    FormDatePickerComponent,
    PrioritySelectorComponent,
    ContactDropdownComponent,
    ContactBadgeListComponent,
    CategoryDropdownComponent,
    SubtaskInputComponent,
    SubtaskListComponent
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AddTaskFormComponent {
  // Signal Inputs
  isOverlay = input<boolean>(false);
  isEditMode = input<boolean>(false);
  formData = input.required<FormGroup>();
  selectedPriority = input<'low' | 'medium' | 'high'>('medium');
  selectedContacts = input<Contact[]>([]);
  selectedCategory = input<string>('');
  subtasks = input<Subtask[]>([]);
  availableContacts = input<Contact[]>([]);
  categories = input<string[]>([]);
  minDate = input<string>('');
  
  // Outputs
  priorityChange = output<'low' | 'medium' | 'high'>();
  contactsChange = output<Contact[]>();
  categoryChange = output<string>();
  subtaskAdd = output<string>();
  subtaskEdit = output<Subtask>();
  subtaskDelete = output<string>();
  formSubmit = output<void>();
  formClear = output<void>();
  close = output<void>();
}
```

---

### 3️⃣ Generische Wiederverwendbare Components

**Neue vereinfachte Struktur - nur 5 Components (4 generisch + 1 domain-spezifisch):**

1. 🎨 **FormFieldComponent** - Universell für text/textarea/date/email/number
2. 📋 **DropdownComponent** - Generisch für alle Dropdown-Menüs mit Content Projection
3. 🔘 **ButtonGroupComponent** - Generisch für Button-Gruppen (Priority, Tabs, Filters, etc.)
4. 🏷️ **BadgeListComponent** - Generisch für Badge/Chip Listen (Contacts, Tags, etc.)
5. 📝 **SubtaskManagementComponent** - Domain-spezifisch für komplexe Subtask-Logik

---

#### **A) FormFieldComponent** (Universell!)

#### **A) FormFieldComponent** (Universell!)

```typescript
@Component({
  selector: 'app-form-field',
  standalone: true,
  template: `
    <fieldset class="form-group">
      <label [for]="id()" class="form-label">
        {{ label() }}
        @if (required()) {
          <span class="required" aria-label="required">*</span>
        }
      </label>
      
      @switch (type()) {
        @case ('textarea') {
          <textarea
            [id]="id()"
            [formControl]="control()"
            [placeholder]="placeholder()"
            [rows]="rows()"
            [class.error]="hasError()"
            class="form-textarea"
            [attr.spellcheck]="spellcheck()"
          ></textarea>
        }
        @case ('date') {
          <div class="input-wrapper">
            <input
              type="date"
              [id]="id()"
              [formControl]="control()"
              [min]="min()"
              [max]="max()"
              [class.error]="hasError()"
              class="form-input"
            />
          </div>
        }
        @default {
          <input
            [type]="type()"
            [id]="id()"
            [formControl]="control()"
            [placeholder]="placeholder()"
            [min]="min()"
            [max]="max()"
            [maxlength]="maxLength()"
            [class.error]="hasError()"
            class="form-input"
          />
        }
      }
      
      @if (hasError() && errorMessage()) {
        <span [id]="id() + '-error'" class="error-message" role="alert">
          {{ errorMessage() }}
        </span>
      }
      
      @if (hint()) {
        <span class="form-hint">{{ hint() }}</span>
      }
    </fieldset>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FormFieldComponent {
  // Core
  id = input.required<string>();
  label = input.required<string>();
  control = input.required<FormControl>();
  type = input<'text' | 'email' | 'number' | 'date' | 'textarea'>('text');
  
  // Options
  placeholder = input<string>('');
  required = input<boolean>(false);
  errorMessage = input<string>('');
  hint = input<string>('');
  
  // Type-specific
  rows = input<number>(4); // textarea
  min = input<string | number>(''); // date, number
  max = input<string | number>(''); // date, number
  maxLength = input<number>(1000);
  spellcheck = input<boolean>(false);
  
  // Computed
  hasError = computed(() => 
    this.control().touched && this.control().invalid
  );
}
```

**Verwendung - Alle Felder mit 1 Component:**
```html
<!-- Title Input -->
<app-form-field
  id="title"
  label="Title"
  [control]="form.get('title')"
  [required]="true"
  placeholder="Enter a title"
  errorMessage="Title is required (min. 3 characters)"
/>

<!-- Description Textarea -->
<app-form-field
  id="description"
  label="Description"
  type="textarea"
  [control]="form.get('description')"
  [rows]="4"
  placeholder="Enter a description"
/>

<!-- Due Date -->
<app-form-field
  id="dueDate"
  label="Due date"
  type="date"
  [control]="form.get('dueDate')"
  [required]="true"
  [min]="minDate()"
  errorMessage="Due date is required"
/>

<!-- Email (bonus) -->
<app-form-field
  id="email"
  label="Email"
  type="email"
  [control]="form.get('email')"
  placeholder="your@email.com"
/>
```

**💡 Hinweis**: Dieser eine Component ersetzt:
- ❌ FormInputComponent
- ❌ FormTextareaComponent  
- ❌ FormDatePickerComponent
- ❌ FormEmailComponent
- ❌ FormNumberComponent

**✅ Stattdessen**: 1 generischer FormFieldComponent mit `type` Parameter!

---

#### **B) DropdownComponent** (Mit Content Projection!)

#### **B) DropdownComponent** (Mit Content Projection!)

```typescript
@Component({
  selector: 'app-dropdown',
  standalone: true,
  imports: [CommonModule, ClickOutsideDirective],
  template: `
    <fieldset class="form-group">
      <legend class="form-label">
        {{ label() }}
        @if (required()) {
          <span class="required" aria-label="required">*</span>
        }
      </legend>
      
      <div 
        class="input-wrapper" 
        (click)="toggle()"
        (clickOutside)="close()"
      >
        <input
          type="text"
          [id]="id()"
          [placeholder]="displayValue()"
          [class.error]="hasError()"
          [attr.aria-expanded]="isOpen()"
          [attr.aria-haspopup]="'listbox'"
          class="form-input"
          readonly
        />
        <img 
          src="assets/images/arrow_drop_down.svg" 
          alt="" 
          class="dropdown-icon" 
          role="presentation" 
        />
      </div>

      @if (isOpen()) {
        <ul class="dropdown-menu" role="listbox">
          <!-- Content Projection für flexible Items -->
          <ng-content />
        </ul>
      }

      @if (hasError() && errorMessage()) {
        <span class="error-message" role="alert">
          {{ errorMessage() }}
        </span>
      }
    </fieldset>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DropdownComponent {
  // Core
  id = input.required<string>();
  label = input.required<string>();
  displayValue = input<string>('Select...');
  
  // Validation
  control = input<FormControl | null>(null);
  required = input<boolean>(false);
  errorMessage = input<string>('');
  
  // Outputs
  dropdownOpen = output<void>();
  dropdownClose = output<void>();
  
  // State
  isOpen = signal(false);
  
  // Computed
  hasError = computed(() => {
    const ctrl = this.control();
    return ctrl ? ctrl.touched && ctrl.invalid : false;
  });
  
  // Methods
  toggle(): void {
    this.isOpen.update(open => !open);
    if (this.isOpen()) {
      this.dropdownOpen.emit();
    }
  }
  
  close(): void {
    this.isOpen.set(false);
    this.dropdownClose.emit();
  }
}
```

**Verwendung - Category Dropdown:**
```html
<app-dropdown
  id="category"
  label="Category"
  [displayValue]="selectedCategory() || 'Select task category'"
  [required]="true"
  [control]="form.get('category')"
  errorMessage="Category is required"
>
  @for (category of categories; track category) {
    <li
      class="dropdown-item"
      [attr.aria-selected]="selectedCategory() === category"
      (click)="selectCategory(category)"
      role="option"
      tabindex="0"
    >
      {{ category }}
    </li>
  }
</app-dropdown>
```

**Verwendung - Contact Dropdown mit komplexem Template:**
```html
<app-dropdown
  id="contacts"
  label="Assigned to"
  [displayValue]="getContactsPlaceholder()"
>
  @for (contact of availableContacts(); track contact.id) {
    <li
      class="dropdown-item"
      [class.selected]="isContactSelected(contact)"
      (click)="toggleContact(contact)"
      role="option"
    >
      <div class="contact-info">
        <div class="avatar" [style.background-color]="contact.color">
          {{ contact.initials }}
        </div>
        <span>{{ contact.firstName }} {{ contact.lastName }}</span>
      </div>
      <img
        [src]="isContactSelected(contact) ? 'checkboxtruewhite.svg' : 'checkboxfalseblack.svg'"
        alt=""
        class="check-icon"
      />
    </li>
  }
</app-dropdown>
```

```

**💡 Hinweis**: Dieser eine Component ersetzt:
- ❌ ContactDropdownComponent
- ❌ CategoryDropdownComponent
- ❌ StatusDropdownComponent
- ❌ FilterDropdownComponent

**✅ Stattdessen**: 1 generisches DropdownComponent mit Content Projection für flexible Item-Templates!

---

#### **C) ButtonGroupComponent** (Generisch für Priority, Tabs, Filters!)

```typescript
@Component({
  selector: 'app-button-group',
  standalone: true,
  imports: [CommonModule],
  template: `
    <fieldset class="form-group">
      <legend class="form-label">{{ label() }}</legend>
      <div class="button-group" role="group" [attr.aria-label]="ariaLabel()">
        @for (button of buttons(); track button.value) {
          <button
            type="button"
            [class]="getButtonClasses(button)"
            [class.active]="isSelected(button.value)"
            [attr.aria-pressed]="isSelected(button.value)"
            [attr.aria-label]="button.ariaLabel || button.label"
            [disabled]="button.disabled"
            (click)="selectButton(button.value)"
          >
            @if (button.iconLeft && showIcons()) {
              <img
                [src]="getIconPath(button, 'left')"
                [alt]="button.iconLeftAlt || ''"
                class="button-icon-left"
                role="presentation"
              />
            }
            <span>{{ button.label }}</span>
            @if (button.iconRight && showIcons()) {
              <img
                [src]="getIconPath(button, 'right')"
                [alt]="button.iconRightAlt || ''"
                class="button-icon-right"
                role="presentation"
              />
            }
          </button>
        }
      </div>
    </fieldset>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ButtonGroupComponent {
  // Inputs
  label = input<string>('');
  ariaLabel = input<string>('Button group');
  buttons = input.required<ButtonConfig[]>();
  selectedValue = input<string | number | null>(null);
  showIcons = input<boolean>(true);
  
  // Output
  valueChange = output<string | number>();
  
  // Methods
  selectButton(value: string | number): void {
    this.valueChange.emit(value);
  }
  
  isSelected(value: string | number): boolean {
    return this.selectedValue() === value;
  }
  
  getButtonClasses(button: ButtonConfig): string {
    const baseClass = button.cssClass || 'button-group-item';
    return baseClass;
  }
  
  getIconPath(button: ButtonConfig, position: 'left' | 'right'): string {
    const isActive = this.isSelected(button.value);
    
    if (position === 'left') {
      const icon = isActive && button.iconLeftActive 
        ? button.iconLeftActive 
        : button.iconLeft;
      return icon || '';
    } else {
      const icon = isActive && button.iconRightActive 
        ? button.iconRightActive 
        : button.iconRight;
      return icon || '';
    }
  }
}

// Interface für Button-Konfiguration
export interface ButtonConfig {
  value: string | number;
  label: string;
  cssClass?: string;
  ariaLabel?: string;
  disabled?: boolean;
  iconLeft?: string;
  iconLeftActive?: string;
  iconLeftAlt?: string;
  iconRight?: string;
  iconRightActive?: string;
  iconRightAlt?: string;
}
```

**Verwendung - Priority Buttons:**
```html
<app-button-group
  label="Priority"
  ariaLabel="Select task priority"
  [selectedValue]="selectedPriority()"
  [buttons]="priorityButtons"
  (valueChange)="selectPriority($event)"
/>
```

```typescript
// In Component
priorityButtons: ButtonConfig[] = [
  { 
    value: 'high', 
    label: 'Urgent', 
    cssClass: 'priority-btn priority-btn-urgent',
    ariaLabel: 'Set priority to urgent',
    iconRight: 'assets/images/urgent.svg',
    iconRightActive: 'assets/images/urgentwhite.svg'
  },
  { 
    value: 'medium', 
    label: 'Medium', 
    cssClass: 'priority-btn priority-btn-medium',
    ariaLabel: 'Set priority to medium',
    iconRight: 'assets/images/medium.svg',
    iconRightActive: 'assets/images/mediumwhite.svg'
  },
  { 
    value: 'low', 
    label: 'Low', 
    cssClass: 'priority-btn priority-btn-low',
    ariaLabel: 'Set priority to low',
    iconRight: 'assets/images/low.svg',
    iconRightActive: 'assets/images/lowwhite.svg'
  }
];
```

**Verwendung - Tab Navigation:**
```html
<app-button-group
  ariaLabel="View selection"
  [selectedValue]="currentView()"
  [buttons]="viewButtons"
  [showIcons]="false"
  (valueChange)="changeView($event)"
/>
```

```typescript
viewButtons: ButtonConfig[] = [
  { value: 'board', label: 'Board', cssClass: 'tab-btn' },
  { value: 'list', label: 'List', cssClass: 'tab-btn' },
  { value: 'calendar', label: 'Calendar', cssClass: 'tab-btn' }
];
```

**💡 Hinweis**: Dieser eine Component ersetzt:
- ❌ PrioritySelectorComponent
- ❌ TabNavigationComponent
- ❌ FilterButtonsComponent
- ❌ ToggleGroupComponent

**✅ Stattdessen**: 1 generisches ButtonGroupComponent mit konfigurierbaren Buttons!

---

#### **D) BadgeListComponent** (Generisch für Contacts, Tags, Categories!)

```typescript
@Component({
  selector: 'app-badge-list',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (items().length > 0) {
      <div 
        class="badge-list" 
        role="list" 
        [attr.aria-label]="ariaLabel()"
        [class.badge-list-horizontal]="layout() === 'horizontal'"
        [class.badge-list-vertical]="layout() === 'vertical'"
      >
        @for (item of displayedItems(); track trackBy(item)) {
          <div
            class="badge"
            [class]="getBadgeClasses(item)"
            [style.background-color]="item.color"
            [style.color]="item.textColor"
            [attr.aria-label]="item.ariaLabel || item.label"
            role="listitem"
          >
            @if (item.icon) {
              <img
                [src]="item.icon"
                [alt]="item.iconAlt || ''"
                class="badge-icon"
                role="presentation"
              />
            }
            <span class="badge-label">{{ item.label }}</span>
            @if (removable() && !item.nonRemovable) {
              <img
                [src]="removeIcon()"
                alt="Remove"
                class="badge-remove"
                (click)="remove(item.id)"
                role="button"
                tabindex="0"
                [attr.aria-label]="'Remove ' + item.label"
              />
            }
          </div>
        }
        @if (hasMore()) {
          <div
            class="badge badge-more"
            [attr.aria-label]="remainingCount() + ' more items'"
            role="listitem"
          >
            +{{ remainingCount() }}
          </div>
        }
      </div>
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BadgeListComponent {
  // Inputs
  items = input<BadgeItem[]>([]);
  maxVisible = input<number | null>(null); // null = alle anzeigen
  removable = input<boolean>(true);
  removeIcon = input<string>('assets/images/close.svg');
  ariaLabel = input<string>('Items');
  layout = input<'horizontal' | 'vertical'>('horizontal');
  
  // Output
  itemRemove = output<string>();
  
  // Computed
  displayedItems = computed(() => {
    const max = this.maxVisible();
    return max ? this.items().slice(0, max) : this.items();
  });
  
  remainingCount = computed(() => {
    const max = this.maxVisible();
    return max ? Math.max(0, this.items().length - max) : 0;
  });
  
  hasMore = computed(() => this.remainingCount() > 0);
  
  // Methods
  remove(itemId: string): void {
    this.itemRemove.emit(itemId);
  }
  
  trackBy(item: BadgeItem): string {
    return item.id;
  }
  
  getBadgeClasses(item: BadgeItem): string {
    return item.cssClass || '';
  }
}

// Interface für Badge Items
export interface BadgeItem {
  id: string;
  label: string;
  color?: string;
  textColor?: string;
  icon?: string;
  iconAlt?: string;
  cssClass?: string;
  ariaLabel?: string;
  nonRemovable?: boolean;
}
```

**Verwendung - Contact Badges:**
```html
<app-badge-list
  ariaLabel="Selected contacts"
  [items]="contactBadges()"
  [maxVisible]="3"
  [removable]="true"
  (itemRemove)="removeContact($event)"
/>
```

```typescript
// In Component
contactBadges = computed(() => 
  this.selectedContacts().map(contact => ({
    id: contact.id,
    label: contact.initials,
    color: contact.color,
    textColor: '#ffffff',
    ariaLabel: `${contact.firstName} ${contact.lastName}`
  }))
);
```

**Verwendung - Category Tags:**
```html
<app-badge-list
  ariaLabel="Categories"
  [items]="categoryTags()"
  [removable]="false"
  layout="horizontal"
/>
```

```typescript
categoryTags: BadgeItem[] = [
  { id: '1', label: 'Technical', color: '#1FD7C1', cssClass: 'category-badge' },
  { id: '2', label: 'User Story', color: '#0038FF', cssClass: 'category-badge' }
];
```

**💡 Hinweis**: Dieser eine Component ersetzt:
- ❌ ContactBadgeListComponent
- ❌ CategoryBadgeComponent
- ❌ TagListComponent
- ❌ ChipListComponent

**✅ Stattdessen**: 1 generisches BadgeListComponent mit konfigurierbaren Items!

---

#### **E) SubtaskManagementComponent** (Domain-spezifisch, bleibt eigenständig!)

**Warum eigenständig?**
- ✅ Komplexe Business Logic (Add, Edit, Delete, Toggle)
- ✅ Mehrere Sub-Components (Input + List)
- ✅ Spezifische Domain-Regeln (max. Subtasks, Validierung)
- ✅ Eigener State (editing, expanding)
- ✅ Nicht generisch wiederverwendbar

```typescript
@Component({
  selector: 'app-subtask-management',
  standalone: true,
  imports: [
    CommonModule,
    SubtaskInputComponent,
    SubtaskListComponent
  ],
  template: `
    <div class="subtask-management">
      <!-- Input für neue/bearbeitete Subtasks -->
      <app-subtask-input
        [value]="subtaskInputValue()"
        [isEditMode]="isEditMode()"
        [maxLength]="35"
        (valueChange)="updateSubtaskInput($event)"
        (subtaskAdd)="addSubtask()"
        (subtaskUpdate)="updateSubtask()"
        (focusChange)="handleFocusChange($event)"
      />
      
      <!-- Liste der Subtasks -->
      @if (subtasks().length > 0) {
        <app-subtask-list
          [subtasks]="subtasks()"
          [maxVisible]="maxVisible()"
          [editingId]="editingSubtaskId()"
          [editValue]="subtaskInputValue()"
          (subtaskEdit)="startEdit($event)"
          (subtaskDelete)="deleteSubtask($event)"
          (subtaskToggle)="toggleSubtask($event)"
          (editValueChange)="updateSubtaskInput($event)"
          (editCancel)="cancelEdit()"
          (editSave)="saveEdit()"
        />
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SubtaskManagementComponent {
  // Inputs
  subtasks = input<Subtask[]>([]);
  maxVisible = input<number>(2);
  maxSubtasks = input<number>(10);
  
  // Outputs
  subtasksChange = output<Subtask[]>();
  
  // Local State
  subtaskInputValue = signal('');
  editingSubtaskId = signal<string | null>(null);
  isEditMode = computed(() => this.editingSubtaskId() !== null);
  
  // Methods
  addSubtask(): void {
    const value = this.subtaskInputValue().trim();
    if (!value || this.subtasks().length >= this.maxSubtasks()) return;
    
    const newSubtask: Subtask = {
      id: Date.now().toString(),
      title: value,
      completed: false
    };
    
    this.subtasksChange.emit([...this.subtasks(), newSubtask]);
    this.subtaskInputValue.set('');
  }
  
  startEdit(subtask: Subtask): void {
    this.editingSubtaskId.set(subtask.id);
    this.subtaskInputValue.set(subtask.title);
  }
  
  updateSubtask(): void {
    const editId = this.editingSubtaskId();
    if (!editId) return;
    
    const value = this.subtaskInputValue().trim();
    if (!value) return;
    
    const updated = this.subtasks().map(st =>
      st.id === editId ? { ...st, title: value } : st
    );
    
    this.subtasksChange.emit(updated);
    this.cancelEdit();
  }
  
  deleteSubtask(subtaskId: string): void {
    const filtered = this.subtasks().filter(st => st.id !== subtaskId);
    this.subtasksChange.emit(filtered);
  }
  
  toggleSubtask(subtaskId: string): void {
    const updated = this.subtasks().map(st =>
      st.id === subtaskId ? { ...st, completed: !st.completed } : st
    );
    this.subtasksChange.emit(updated);
  }
  
  updateSubtaskInput(value: string): void {
    this.subtaskInputValue.set(value);
  }
  
  cancelEdit(): void {
    this.editingSubtaskId.set(null);
    this.subtaskInputValue.set('');
  }
  
  saveEdit(): void {
    this.updateSubtask();
  }
  
  handleFocusChange(focused: boolean): void {
    if (!focused && !this.isEditMode()) {
      this.subtaskInputValue.set('');
    }
  }
}
```

**Verwendung:**
```html
<app-subtask-management
  [subtasks]="subtasks()"
  [maxVisible]="2"
  [maxSubtasks]="10"
  (subtasksChange)="handleSubtasksChange($event)"
/>
```

**💡 Hinweis**: Dieser Component bleibt domain-spezifisch und komplex!

---

### **Zusammenfassung: Von 8 auf 5 Components!**

#### ❌ Alte spezifische Struktur (8 Components):
1. FormInputComponent
2. FormTextareaComponent
3. FormDatePickerComponent
4. PrioritySelectorComponent
5. ContactDropdownComponent
6. ContactBadgeListComponent
7. CategoryDropdownComponent
8. SubtaskInputComponent

#### ✅ Neue generische Struktur (5 Components):
1. **FormFieldComponent** (ersetzt 1, 2, 3)
2. **DropdownComponent** (ersetzt 5, 7)
3. **ButtonGroupComponent** (ersetzt 4)
4. **BadgeListComponent** (ersetzt 6)
5. **SubtaskManagementComponent** (kombiniert 8 + SubtaskList)

**Ergebnis:**
- 🎯 **62% weniger Components** (5 statt 8)
- 🔄 **4 generische** wiederverwendbare UI-Components
- 🏢 **1 domain-spezifischer** Complex Component
- ✨ **Deutlich flexibler** und wartbarer!

---

#### **C) PrioritySelectorComponent** (Priority Buttons)



---

## 📋 Migrations-Schritte

### Phase 1: Ordnerstruktur erstellen ✅
```bash
# Generische Components
mkdir -p src/app/features/add-task/components/form-field
mkdir -p src/app/features/add-task/components/dropdown
mkdir -p src/app/features/add-task/components/button-group
mkdir -p src/app/features/add-task/components/badge-list

# Domain-specific Component
mkdir -p src/app/features/add-task/components/subtask-management

# Presentational Layer
mkdir -p src/app/features/add-task/presentational/add-task-form
```

### Phase 2: Generische Components erstellen (Bottom-Up) 🔧

**Reihenfolge (einfach → komplex):**

1. ✅ **BadgeListComponent**
   - Simplest component
   - Pure display logic
   - Nur visual rendering
   - Input: items[], Output: itemRemove
   - Keine externe Dependencies

2. ✅ **ButtonGroupComponent**
   - Button group logic
   - Selection state
   - Icons conditional
   - Input: buttons[], selectedValue, Output: valueChange
   - Dependency: CommonModule

3. ✅ **FormFieldComponent**
   - Universal input field
   - All input types (text, textarea, date, email, number)
   - Validation display
   - Input: control, type, label, Output: none
   - Dependency: ReactiveFormsModule

4. ✅ **DropdownComponent**
   - Content projection
   - Open/close state
   - Click outside handling
   - Input: label, displayValue, Output: dropdownOpen/Close
   - Dependency: ClickOutsideDirective

5. ✅ **SubtaskManagementComponent**
   - Most complex component
   - Combines SubtaskInput + SubtaskList
   - Add/Edit/Delete/Toggle logic
   - Local state management
   - Input: subtasks[], Output: subtasksChange
   - Dependency: SubtaskInputComponent, SubtaskListComponent

### Phase 3: Sub-Components für Subtasks (falls nötig erstellen) 🎨

**SubtaskInputComponent** (Teil von SubtaskManagement):
- Input field for adding/editing subtasks
- Focus state management
- Add/Update/Clear actions
- Input: value, isEditMode, Output: valueChange, subtaskAdd/Update

**SubtaskListComponent** (bereits vorhanden, anpassen):
- List display mit Expand/Collapse
- Edit/Delete actions per item
- Checkbox für completion
- Input: subtasks[], editingId, Output: subtaskEdit/Delete/Toggle

### Phase 4: Presentational Component 🎨

**AddTaskFormComponent erstellen:**
- Layout-Struktur (2 Columns, Separator)
- Alle neuen Components einbinden
- Event Delegation an Parent
- Styling übernehmen
- Inputs: formData, selectedPriority, selectedContacts, subtasks, etc.
- Outputs: priorityChange, contactsChange, subtaskAdd, formSubmit, etc.

### Phase 5: Smart Component anpassen 🧠

**AddTaskComponent refactoren:**
- Template vereinfachen → Nur noch `<app-add-task-form>`
- Alle Inputs/Outputs durchreichen
- Event Handler behalten
- Business Logic unverändert
- Services integriert (TaskService, ContactService)
- Form validation logic

### Phase 6: Testing & Validation ✅

- [ ] **FormFieldComponent**: Alle Typen testen (text, textarea, date, email, number)
- [ ] **DropdownComponent**: Open/Close, Content Projection, Click Outside
- [ ] **ButtonGroupComponent**: Selection, Icons, Multiple Groups
- [ ] **BadgeListComponent**: Display, Remove, Max Visible, Overflow
- [ ] **SubtaskManagementComponent**: Add, Edit, Delete, Toggle Complete
- [ ] **AddTaskFormComponent**: Layout, Event Delegation, Validation Display
- [ ] **Integration Test**: Full form flow, Submit, Clear, Edit Mode, Overlay Mode

---

## 🎁 Vorteile nach Refactoring

### ✅ Wiederverwendbarkeit überall im Projekt

#### FormFieldComponent
```typescript
// In AddTask
<app-form-field id="title" label="Title" type="text" [control]="form.get('title')" />

// In User Profile
<app-form-field id="email" label="Email" type="email" [control]="profileForm.get('email')" />

// In Settings
<app-form-field id="bio" label="Biography" type="textarea" [control]="settingsForm.get('bio')" />

// In Booking
<app-form-field id="date" label="Booking Date" type="date" [control]="bookingForm.get('date')" />
```

#### DropdownComponent
```typescript
// In AddTask - Category Selection
<app-dropdown id="category" label="Category" [displayValue]="selectedCategory()">
  <li *ngFor="let cat of categories" (click)="selectCategory(cat)">{{ cat }}</li>
</app-dropdown>

// In AddTask - Contact Selection
<app-dropdown id="contacts" label="Assigned to" [displayValue]="contactsPlaceholder()">
  <li *ngFor="let contact of contacts" (click)="toggleContact(contact)">
    <div class="contact-info">...</div>
  </li>
</app-dropdown>

// In Board - Status Filter
<app-dropdown id="statusFilter" label="Filter by Status" [displayValue]="currentStatus()">
  <li *ngFor="let status of statuses" (click)="filterByStatus(status)">{{ status }}</li>
</app-dropdown>

// In User Management - Role Selection
<app-dropdown id="role" label="User Role" [displayValue]="selectedRole()">
  <li *ngFor="let role of roles" (click)="assignRole(role)">{{ role.name }}</li>
</app-dropdown>
```

#### ButtonGroupComponent
```typescript
// In AddTask - Priority Selection
<app-button-group
  label="Priority"
  [buttons]="priorityButtons"
  [selectedValue]="selectedPriority()"
  (valueChange)="selectPriority($event)"
/>

// In Board - View Toggle
<app-button-group
  [buttons]="viewButtons"
  [selectedValue]="currentView()"
  [showIcons]="true"
  (valueChange)="changeView($event)"
/>
// viewButtons = [
//   { value: 'board', label: 'Board', iconLeft: 'board-icon.svg' },
//   { value: 'list', label: 'List', iconLeft: 'list-icon.svg' },
//   { value: 'calendar', label: 'Calendar', iconLeft: 'calendar-icon.svg' }
// ]

// In Summary - Time Range Filter
<app-button-group
  label="Time Range"
  [buttons]="timeRangeButtons"
  [selectedValue]="selectedRange()"
  [showIcons]="false"
  (valueChange)="updateRange($event)"
/>
// timeRangeButtons = [
//   { value: 'today', label: 'Today' },
//   { value: 'week', label: 'This Week' },
//   { value: 'month', label: 'This Month' }
// ]
```

#### BadgeListComponent
```typescript
// In AddTask - Selected Contacts
<app-badge-list
  ariaLabel="Selected contacts"
  [items]="contactBadges()"
  [maxVisible]="3"
  [removable]="true"
  (itemRemove)="removeContact($event)"
/>

// In Board Task Card - Categories
<app-badge-list
  ariaLabel="Task categories"
  [items]="categoryTags"
  [removable]="false"
  layout="horizontal"
/>

// In Profile - Skills
<app-badge-list
  ariaLabel="User skills"
  [items]="skillBadges"
  [maxVisible]="5"
  [removable]="isEditMode()"
  (itemRemove)="removeSkill($event)"
/>

// In Search Results - Tags
<app-badge-list
  ariaLabel="Active filters"
  [items]="filterTags()"
  [removable]="true"
  layout="horizontal"
  (itemRemove)="removeFilter($event)"
/>
```

---

### ✅ Testbarkeit (Isolierte Unit Tests)

```typescript
// FormFieldComponent Test
describe('FormFieldComponent', () => {
  it('should display error message when control is invalid and touched', () => {
    const control = new FormControl('', Validators.required);
    component.control = signal(control);
    control.markAsTouched();
    fixture.detectChanges();
    
    expect(component.hasError()).toBe(true);
    expect(fixture.nativeElement.querySelector('.error-message')).toBeTruthy();
  });
  
  it('should render textarea when type is textarea', () => {
    component.type = signal('textarea');
    fixture.detectChanges();
    
    expect(fixture.nativeElement.querySelector('textarea')).toBeTruthy();
  });
});

// ButtonGroupComponent Test
describe('ButtonGroupComponent', () => {
  it('should emit valueChange when button is clicked', () => {
    const emitSpy = spyOn(component.valueChange, 'emit');
    component.buttons = signal([
      { value: 'high', label: 'High' },
      { value: 'low', label: 'Low' }
    ]);
    fixture.detectChanges();
    
    const button = fixture.nativeElement.querySelector('button');
    button.click();
    
    expect(emitSpy).toHaveBeenCalledWith('high');
  });
});

// DropdownComponent Test
describe('DropdownComponent', () => {
  it('should toggle dropdown on click', () => {
    expect(component.isOpen()).toBe(false);
    
    component.toggle();
    expect(component.isOpen()).toBe(true);
    
    component.toggle();
    expect(component.isOpen()).toBe(false);
  });
  
  it('should close dropdown when clicking outside', () => {
    component.isOpen.set(true);
    
    component.close();
    
    expect(component.isOpen()).toBe(false);
    expect(component.dropdownClose.emit).toHaveBeenCalled();
  });
});
```

---

### ✅ Wartbarkeit (Änderungen an einer Stelle)

```
Szenario: Input-Styling ändern
├── ❌ Alt: 3 Components ändern (FormInput, FormTextarea, FormDatePicker)
└── ✅ Neu: 1 Component ändern (FormFieldComponent)

Szenario: Dropdown Animation hinzufügen
├── ❌ Alt: 2 Components ändern (ContactDropdown, CategoryDropdown)
└── ✅ Neu: 1 Component ändern (DropdownComponent)

Szenario: Badge hover effect
├── ❌ Alt: Überall im Code verstreut (ContactBadgeList, Tags, Chips)
└── ✅ Neu: 1 Component ändern (BadgeListComponent)

Szenario: Button accessibility verbessern
├── ❌ Alt: PrioritySelector + andere Button-Components
└── ✅ Neu: 1 Component ändern (ButtonGroupComponent)
```

---

### ✅ Performance (Granulare Change Detection)

```typescript
// Alle Components mit OnPush
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush
})

// Vorteile:
// 1. Nur bei Input-Änderungen wird gerendert
// 2. Signals triggern gezielt Updates
// 3. Keine unnötigen Renders bei Sibling-Changes
// 4. Bessere Performance bei vielen Components

// Beispiel AddTaskForm:
// - Priority Button Klick → Nur ButtonGroupComponent + Smart Component rerendern
// - Dropdown öffnen → Nur DropdownComponent rerendert
// - Badge entfernen → Nur BadgeListComponent + Smart Component rerendern
// - Form Input → Nur betroffenes FormFieldComponent rerendert
```

---

### ✅ DRY Prinzip (Don't Repeat Yourself)

**Vorher:**
```
Code-Duplikation:
- FormInput, FormTextarea, FormDatePicker → 80% gleicher Code
- ContactDropdown, CategoryDropdown → 70% gleicher Code
- Priority Buttons hardcoded → Nicht wiederverwendbar

Anzahl Components: 8
Anzahl Code-Zeilen: ~2000
Wartungsaufwand: Hoch
```

**Nachher:**
```
Kein Code-Duplikation:
- FormFieldComponent → Alle Input-Typen in einem
- DropdownComponent → Universell mit Content Projection
- ButtonGroupComponent → Konfigurierbar für alle Use Cases

Anzahl Components: 5 (-38%)
Anzahl Code-Zeilen: ~1400 (-30%)
Wartungsaufwand: Niedrig
```

---

### ✅ Erweiterbarkeit (Neue Features einfach hinzufügen)

```typescript
// Neues Input-Type hinzufügen (z.B. color picker)
// ✅ Nur FormFieldComponent erweitern:
@switch (type()) {
  @case ('color') {
    <input type="color" ... />
  }
}

// Neues Button-Style hinzufügen (z.B. toggle buttons)
// ✅ Nur ButtonGroupComponent CSS erweitern:
.button-group-item.toggle-btn { ... }

// Neue Badge-Variation hinzufügen (z.B. mit Avatar)
// ✅ Nur BadgeListComponent Template erweitern:
@if (item.avatar) {
  <img [src]="item.avatar" class="badge-avatar" />
}

// Dropdown mit Search hinzufügen
// ✅ Nur DropdownComponent erweitern:
@if (searchable()) {
  <input type="text" [(ngModel)]="searchTerm" />
}
```

---

## 🚀 Vorbereitung für File Upload

### Zukünftige Component-Struktur:

```
components/
└── file-upload/
    ├── file-upload.component.ts
    ├── file-upload.component.html
    └── file-upload.component.scss
```

### Integration in AddTaskForm:

```html
<app-file-upload
  [maxFiles]="3"
  [maxSizeMB]="10"
  [acceptedTypes]="['image/*', '.pdf', '.doc']"
  [uploadedFiles]="attachedFiles()"
  (filesChange)="handleFilesChange($event)"
  (fileRemove)="removeFile($event)"
/>
```

### Features:
- Drag & Drop
- File Preview
- Progress Indicator
- Validation (Type, Size)
- Multiple Files
- Remove Files

---

## 📊 Component Dependency Graph

```
AddTaskComponent (Smart - Business Logic)
    ↓ (delegates to)
AddTaskFormComponent (Presentational - Layout & Orchestration)
    ├── FormFieldComponent (generisch)
    │   └── ReactiveFormsModule
    │
    ├── DropdownComponent (generisch) × 2 (Contacts, Category)
    │   └── ClickOutsideDirective
    │   └── <ng-content> (Content Projection für Items)
    │
    ├── ButtonGroupComponent (generisch)
    │   └── CommonModule
    │
    ├── BadgeListComponent (generisch)
    │   └── CommonModule
    │
    └── SubtaskManagementComponent (domain-specific)
        ├── SubtaskInputComponent
        │   └── Focus/Blur Logic
        └── SubtaskListComponent (bereits vorhanden)
            └── ClickOutsideDirective
```

**Legende:**
- 🧠 **Smart Component**: Business Logic, Services, State Management
- 🎨 **Presentational Component**: Layout, Event Delegation, UI Structure
- 🔧 **Generic Component**: Wiederverwendbar, konfigurierbar, UI-focused
- 🏢 **Domain Component**: Spezifische Business Domain, komplex

---

## 🎨 Style-Strategie & Design-Konsistenz

### ⚠️ Kritische Anforderung: Design muss identisch bleiben!

**Problem**: AddTask hat bereits perfektionierte Styles in `add-task/styles/*.scss`.  
**Lösung**: Bestehende Styles 1:1 übernehmen, nur umorganisieren!

---

### 📁 Bestehende Style-Struktur (zu erhalten)

```
src/styles/
├── _variables.scss           ✅ Global - unverändert
├── _mixins.scss              ✅ Global - unverändert
├── _page-layouts.scss        ✅ Global - unverändert
├── _scrollbar.scss           ✅ Global - unverändert
├── _utilities.scss           ✅ Global - unverändert
└── components/
    ├── _animations.scss      ✅ Global - unverändert
    └── _buttons.scss         ✅ Global - unverändert

src/app/features/add-task/styles/
├── _form-elements.scss       🔄 Migration zu Components
├── _priority-buttons.scss    🔄 Migration zu ButtonGroupComponent
├── _dropdowns.scss           🔄 Migration zu DropdownComponent
├── _subtasks.scss            🔄 Migration zu SubtaskManagement
├── _overlay.scss             ✅ Bleibt in AddTaskForm
└── _responsive.scss          ✅ Bleibt in AddTaskForm
```

---

### 🎯 Style-Migrations-Plan

#### **Phase 1: Extraktion der Component-spezifischen Styles**

**Von `_form-elements.scss` → FormFieldComponent.scss:**
```scss
// FormFieldComponent übernimmt:
.form-group { }          // ✅ Fieldset wrapper
.form-label { }          // ✅ Label mit required indicator
.form-input { }          // ✅ Text/Email/Number Input
.form-textarea { }       // ✅ Textarea
.error-message { }       // ✅ Validation error
.input-wrapper { }       // ✅ Date input wrapper
input[type="date"] { }   // ✅ Date picker styles
```

**Von `_priority-buttons.scss` → ButtonGroupComponent.scss:**
```scss
// ButtonGroupComponent übernimmt:
.priority-buttons { }                // ✅ Container flexbox
.priority-btn { }                    // ✅ Base button styles
.priority-btn-urgent { }             // ✅ Urgent color (wird zu cssClass)
.priority-btn-medium { }             // ✅ Medium color (wird zu cssClass)
.priority-btn-low { }                // ✅ Low color (wird zu cssClass)
.priority-btn-active { }             // ✅ Active state per variant
```

**Von `_dropdowns.scss` → DropdownComponent.scss + BadgeListComponent.scss:**
```scss
// DropdownComponent übernimmt:
.dropdown-menu { }       // ✅ Absolute positioned menu
.dropdown-item { }       // ✅ Item hover/selected
.contact-info { }        // ✅ Optional (via ng-content)
.avatar { }              // ✅ Optional (via ng-content)

// BadgeListComponent übernimmt:
.selected-contacts { }   // ✅ → .badge-list
.contact-badge { }       // ✅ → .badge
.contact-badge .remove-icon { }  // ✅ → .badge-remove
.more-badge { }          // ✅ → .badge-more
```

**Von `_subtasks.scss` → SubtaskManagementComponent.scss:**
```scss
// SubtaskManagement übernimmt alle Subtask-Styles
// (werden hier nicht umbenannt, bleiben identisch)
```

---

### 🔧 Component SCSS Struktur (konsistent!)

**Jeder generischer Component erhält:**
```scss
// 1. Imports (IMMER diese!)
@import '../../../../../styles/variables';
@import '../../../../../styles/mixins';

// 2. Component-spezifische Styles
// 3. Variants/Modifiers
// 4. States (hover, focus, active, disabled)
// 5. Responsive (falls nötig)
```

---

### 📋 Detaillierte Style-Migration pro Component

#### **1. FormFieldComponent.scss**

```scss
@import '../../../../../styles/variables';
@import '../../../../../styles/mixins';
@import '../../../../../styles/scrollbar';

// Base fieldset
.form-group {
  @include flex(column, flex-start, stretch);
  position: relative;
  margin-bottom: 8px;
}

fieldset.form-group {
  border: none;
  padding: 0;
  margin: 0 0 8px 0;
}

// Label
.form-label {
  display: flex;
  margin-bottom: 8px;
  font-size: 20px;
  font-weight: 400;
  color: #2a3647;

  .required {
    color: #ff3d00;
    margin-left: 4px;
  }
}

// Input/Textarea Base (IDENTISCH zu bestehendem!)
.form-input,
.form-textarea {
  width: 100%;
  height: 48px;
  padding: 0 16px;
  border: 1px solid #d1d1d1;
  border-radius: 10px;
  font-size: 20px;
  color: #2a3647;
  font-family: inherit;
  transition: border-color 0.2s;
  box-sizing: border-box;

  &:focus {
    outline: none;
    border-color: $accent-color;
  }

  &::placeholder {
    color: #a8a8a8;
  }

  &.error {
    border-color: #ff3d00;
  }
}

// Textarea specific
.form-textarea {
  resize: none;
  min-height: 119px;
  padding-top: 16px;
  @include hide-scrollbar;
}

// Error message
.error-message {
  font-size: 12px;
  color: #ff3d00;
  margin-top: 4px;
  display: block;
}

// Date input wrapper
.input-wrapper {
  position: relative;
  @include flex(row, flex-start, center);
}

input[type="date"] {
  position: relative;
  padding-right: 50px;

  &::-webkit-calendar-picker-indicator {
    position: absolute;
    right: 10px;
    cursor: pointer;
    width: 20px;
    height: 20px;
  }
}
```

---

#### **2. ButtonGroupComponent.scss**

```scss
@import '../../../../../styles/variables';
@import '../../../../../styles/mixins';

// Container (generic button-group)
.button-group {
  @include flex(row, flex-start, center);
  padding: 0;
  gap: 12px;
  width: 100%;
  height: auto;
}

// Base button (generic)
.button-group-item {
  @include flex(row, center, center);
  padding: 12px 8px;
  gap: 6px;
  flex: 1;
  min-width: 90px;
  max-width: 136px;
  height: 48px;
  background: #ffffff;
  box-shadow: 0px 0px 4px rgba(0, 0, 0, 0.1);
  border-radius: 10px;
  border: none;
  font-family: 'Inter';
  font-style: normal;
  font-weight: 400;
  font-size: 18px;
  line-height: 120%;
  color: #000000;
  cursor: pointer;
  transition: all 0.2s;

  img {
    width: 18px;
    height: 18px;
    flex-shrink: 0;
  }

  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0px 4px 8px rgba(0, 0, 0, 0.15);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

// Active state (generic)
.button-group-item.active {
  color: white;

  img {
    filter: brightness(0) invert(1);
  }
}

// Priority-specific variants (via cssClass)
.priority-btn {
  @extend .button-group-item;
}

.priority-btn-urgent.active {
  background: #ff3d00;
}

.priority-btn-medium.active {
  background: #ffa800;
}

.priority-btn-low.active {
  background: #7ae229;
}
```

---

#### **3. DropdownComponent.scss**

```scss
@import '../../../../../styles/variables';
@import '../../../../../styles/mixins';

// Dropdown wrapper (inherits from FormFieldComponent)
.form-group {
  position: relative;
}

// Input wrapper (clickable area)
.input-wrapper {
  position: relative;
  @include flex(row, flex-start, center);
  cursor: pointer;

  .form-input {
    cursor: pointer;
    user-select: none;
  }

  .dropdown-icon {
    position: absolute;
    right: 16px;
    width: 10px;
    height: 10px;
    pointer-events: none;
  }
}

// Dropdown menu (absolute positioned)
.dropdown-menu {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: #ffffff;
  border: 1px solid #d1d1d1;
  border-radius: 10px;
  margin-top: 0.25rem;
  max-height: 200px;
  overflow: auto;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  z-index: 10;
  list-style: none;
  padding: 0;
}

// Dropdown item (generic)
.dropdown-item {
  padding: 12px 16px;
  @include flex(row, space-between, center);
  cursor: pointer;
  transition: background-color 0.2s;
  font-size: 16px;

  &:hover {
    background-color: #f6f7f8;
  }

  &.selected {
    background-color: $primary-color;
    color: white;

    .check-icon {
      filter: brightness(0) invert(1);
    }
  }

  .check-icon {
    width: 16px;
    height: 16px;
    transition: all 0.2s ease;
  }
}

// Für Contact Dropdown (via ng-content)
.contact-info {
  @include flex(row, flex-start, center);
  gap: 12px;
}

.avatar {
  width: 42px;
  height: 42px;
  border-radius: 50%;
  @include flex(row, center, center);
  color: #ffffff;
  font-weight: 600;
  font-size: 12px;
}
```

---

#### **4. BadgeListComponent.scss**

```scss
@import '../../../../../styles/variables';
@import '../../../../../styles/mixins';

// Badge list container
.badge-list {
  @include flex(row, flex-start, stretch);
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 8px;

  &.badge-list-horizontal {
    flex-direction: row;
  }

  &.badge-list-vertical {
    flex-direction: column;
  }
}

// Individual badge
.badge {
  width: 42px;
  height: 42px;
  border-radius: 50%;
  @include flex(row, center, center);
  color: #ffffff;
  font-weight: 600;
  font-size: 12px;
  position: relative;
  cursor: pointer;
  transition: transform 0.2s;

  &:hover {
    transform: scale(1.05);
  }

  .badge-icon {
    width: 16px;
    height: 16px;
  }

  .badge-label {
    // Text inside badge
  }
}

// Remove icon (appears on hover)
.badge-remove {
  position: absolute;
  top: -4px;
  right: -4px;
  width: 16px;
  height: 16px;
  background: rgba(211, 211, 211, 0.9);
  border-radius: 50%;
  display: none;
  cursor: pointer;
  padding: 3px;
  filter: brightness(1.2);
  opacity: 0.7;
  transition: all 0.2s ease;
}

.badge:hover .badge-remove {
  display: block;
  opacity: 0.9;
}

// "More" badge
.badge-more {
  background-color: $primary-color;
  cursor: default;
  font-size: 14px;
  font-weight: 700;

  &:hover {
    transform: none;

    .badge-remove {
      display: none;
    }
  }
}
```

---

#### **5. AddTaskFormComponent.scss** (Presentational)

```scss
@import '../../../../../styles/variables';
@import '../../../../../styles/mixins';

// Form wrapper (2-column layout)
.form-wrapper {
  @include flex(column, flex-start, stretch);
  max-width: 850px;
  width: 100%;
}

.add-task-form {
  @include flex(row, flex-start, stretch);
  gap: 20px;
  flex: 1;
  margin-bottom: 0;
}

.form-column {
  width: 50%;
  @include flex(column, flex-start, stretch);
  gap: 8px;
}

// Separator (vertikale Linie)
.separator {
  width: 1px;
  background-color: #d1d1d1;
  align-self: stretch;
  border: none;
  margin: 0;
}

// Form actions (von _form-elements.scss übernehmen)
.form-actions {
  @include flex(row, flex-end, center);
  gap: 32px;
  padding-top: 24px;
  margin-top: auto;
  position: sticky;
  bottom: 0;
}

.required-label {
  position: relative;
  width: fit-content;
  font-size: 12px;
  color: #2a3647;
  margin-top: 24px;

  span {
    color: #ff3d00;
  }
}

// Responsive (von _responsive.scss übernehmen)
@media (max-width: $breakpoint-lg) {
  .add-task-form {
    flex-direction: column;
  }

  .form-column {
    width: 100%;
  }

  .separator {
    width: 100%;
    height: 1px;
  }
}
```

---

### ✅ Style-Checkliste für jede Component-Migration

**Beim Erstellen jedes Components:**

- [ ] Imports korrekt (`variables`, `mixins`, `scrollbar` falls nötig)
- [ ] Klassen-Namen IDENTISCH zu bestehendem Code
- [ ] Farben via `$variables` (nicht hardcoded)
- [ ] Spacing via `$spacing-*` Variablen
- [ ] Flex/Grid via `@mixin flex()` / `@mixin grid()`
- [ ] Transitions identisch (0.2s ease)
- [ ] Border-radius identisch (10px für Inputs)
- [ ] Font-sizes identisch (20px Label, 16px Items)
- [ ] Hover-States identisch
- [ ] Focus-States identisch (accent-color border)
- [ ] Error-States identisch (#ff3d00 border)
- [ ] Responsive funktioniert (Breakpoints aus `_variables.scss`)

---

### 🎯 Style-Testing nach Migration

**Visueller Vergleich (Before/After):**

1. Screenshot **VORHER** von aktuellem AddTask machen
2. Nach Migration Screenshot **NACHHER** machen
3. Pixel-Perfect Vergleich:
   - Input heights (48px)
   - Border radius (10px)
   - Font sizes (20px Label, 16px Text)
   - Spacing (8px gap between form-groups)
   - Colors (exact hex values)
   - Hover effects
   - Focus effects
   - Error states
   - Priority button active states
   - Dropdown positioning

**Browser DevTools:**
```
Computed Styles checken:
- .form-input → height: 48px ✓
- .form-input → border-radius: 10px ✓
- .priority-btn → height: 48px ✓
- .dropdown-menu → max-height: 200px ✓
```

---

### 🚨 Kritische Style-Aspekte (NICHT ändern!)

❌ **Niemals ändern:**
- Input height: `48px`
- Border radius: `10px`
- Font size label: `20px`
- Font size input: `20px`
- Error color: `#ff3d00`
- Accent color: `$accent-color` (#29ABE2)
- Priority colors: urgent (#ff3d00), medium (#ffa800), low (#7ae229)
- Avatar size: `42px`
- Gap between form-groups: `8px`
- Dropdown max-height: `200px`

✅ **Erlaubt:**
- Code-Organisation (Klassen umbenennen innerhalb Component)
- Hinzufügen von Modifiers (z.B. `.button-group-item.active`)
- BEM-Struktur innerhalb Component (falls sinnvoll)
- CSS Custom Properties für Variants

---

### 📦 Migration-Reihenfolge mit Style-Focus

**Tag 1: BadgeListComponent**
1. Copy `.contact-badge`, `.badge-remove`, `.more-badge` from `_dropdowns.scss`
2. Rename zu `.badge`, `.badge-remove`, `.badge-more`
3. Test: Visual identical zu current contact badges

**Tag 2: ButtonGroupComponent**
1. Copy `.priority-buttons`, `.priority-btn*` from `_priority-buttons.scss`
2. Generalize zu `.button-group`, `.button-group-item`
3. Keep `.priority-btn*` als aliases/extends
4. Test: Priority buttons look EXACTLY the same

**Tag 3: FormFieldComponent**
1. Copy `.form-group`, `.form-label`, `.form-input`, `.form-textarea` from `_form-elements.scss`
2. Add switch for input types
3. Test: Title input, Description textarea, Due Date identical

**Tag 4: DropdownComponent**
1. Copy `.dropdown-menu`, `.dropdown-item` from `_dropdowns.scss`
2. Add Content Projection support
3. Test: Category dropdown, Contact dropdown identical

**Tag 5: SubtaskManagementComponent**
1. Copy ALL from `_subtasks.scss` (no changes!)
2. Test: Subtask input, list, edit, delete identical

---

## ✅ Checkliste vor Start

- [ ] Board-Struktur als Referenz prüfen
- [ ] Signals Migration abgeschlossen
- [ ] Styles dokumentiert
- [ ] Git Backup Branch erstellen
- [ ] Tests vorbereiten
- [ ] Documentation aktualisieren

---

## 🚦 Nächste Schritte

### 📋 Pre-Implementation Checklist

Bevor wir mit der Implementierung starten:

- [ ] **✅ Diesen Plan reviewen und freigeben**
- [ ] Board-Struktur als Referenz prüfen ([board/presentational](src/app/features/board/presentational))
- [ ] Signals Migration verifiziert (alle Services + Components auf Signals)
- [ ] Current AddTask Styles dokumentieren
- [ ] Git Backup Branch erstellen: `git checkout -b backup/before-addtask-refactoring`
- [ ] Test-Szenarien definieren (Critical User Flows)

---

### 🎯 Implementierungs-Reihenfolge (Step-by-Step)

#### **Sprint 1: Foundation - Generische UI Components**

**Tag 1: BadgeListComponent + ButtonGroupComponent**
```bash
# Einfachste Components zuerst
1. BadgeListComponent erstellen & testen
   - SCSS: Copy von _dropdowns.scss (.contact-badge → .badge)
   - Visual Test: Badge aussehen IDENTISCH
   
2. ButtonGroupComponent erstellen & testen
   - SCSS: Copy von _priority-buttons.scss
   - Keep .priority-btn class names!
   - Visual Test: Priority buttons IDENTISCH
   
3. Unit Tests schreiben
4. Screenshot-Vergleich machen
5. Commit: "feat: add generic BadgeList & ButtonGroup components"
```

**Tag 2: FormFieldComponent**
```bash
# Universal Input Component
1. FormFieldComponent erstellen (text, textarea, date)
   - SCSS: Copy von _form-elements.scss
   - Keep .form-input, .form-textarea, .form-label exakt!
   - Height 48px, border-radius 10px beibehalten
   
2. Alle Input-Types testen
3. Validation Display testen (error border #ff3d00)
4. Focus state testen (border $accent-color)
5. Screenshot-Vergleich mit aktuellem AddTask
6. Commit: "feat: add generic FormField component with all input types"
```

**Tag 3: DropdownComponent**
```bash
# Content Projection Component
1. DropdownComponent Basis erstellen
   - SCSS: Copy von _dropdowns.scss
   - Keep .dropdown-menu, .dropdown-item exakt!
   - Max-height 200px, border-radius 10px
   
2. Content Projection Setup
3. Click Outside Integration
4. Open/Close States testen
5. Screenshot: Category Dropdown + Contact Dropdown identisch
6. Commit: "feat: add generic Dropdown component with content projection"
```

---

#### **Sprint 2: Domain Components + Integration**

**Tag 4: SubtaskManagementComponent**
```bash
# Komplexer Domain Component
1. SubtaskInputComponent erstellen (falls nötig refactoren)
   - SCSS: Copy bestehende Subtask-Input Styles
   
2. SubtaskListComponent anpassen/integrieren
   - SCSS: Keine Änderung! Bleibt identisch
   
3. SubtaskManagementComponent als Container
   - SCSS: Copy von _subtasks.scss (1:1!)
   
4. Add/Edit/Delete/Toggle Logic
5. Visual Test: Subtask-Bereich sieht IDENTISCH aus
6. Commit: "feat: add SubtaskManagement domain component"
```

**Tag 5: AddTaskFormComponent (Presentational)**
```bash
# Layout & Orchestration
1. AddTaskFormComponent Struktur erstellen
   - SCSS: Copy _form-elements.scss (form-wrapper, add-task-form, form-column)
   - SCSS: Copy _overlay.scss für Overlay Mode
   - SCSS: Copy _responsive.scss für Breakpoints
   
2. Alle 5 Components integrieren
3. 2-Column Layout + Separator
4. Event Delegation Setup
5. ⚠️ KRITISCHER TEST: Gesamtes Form muss PIXEL-GENAU identisch aussehen!
   - Screenshot Vorher/Nachher Side-by-Side
   - Alle Abstände prüfen
   - Responsive testen (Mobile, Tablet, Desktop)
6. Commit: "feat: add AddTaskForm presentational component"
```

**Tag 6: AddTaskComponent Refactoring (Smart)**
```bash
# Smart Component Vereinfachung
1. Template auf <app-add-task-form> reduzieren
2. Alle Inputs durchreichen
3. Alle Outputs verbinden
4. Business Logic unverändert lassen
5. Commit: "refactor: simplify AddTask smart component"
```

---

#### **Sprint 3: Testing, Styling & Polish**

**Tag 7: Integration Testing**
```bash
# End-to-End Form Tests
1. Form Submit Flow testen
2. Validation States testen
3. Dropdown Interactions testen
4. Priority Selection testen
5. Contact Assignment testen
6. Subtask Management testen
7. Edit Mode testen
8. Overlay Mode testen
```

**Tag 8: Styling & Accessibility**
```bash
# Visual Polish & A11y
1. Final Style-Check - Pixel-Perfect Vergleich:
   □ Title Input: height 48px, border-radius 10px ✓
   □ Description Textarea: min-height 119px ✓
   □ Date Input: padding-right 50px, calendar icon positioned ✓
   □ Priority Buttons: height 48px, gap 12px ✓
   □ Priority Active States: urgent #ff3d00, medium #ffa800, low #7ae229 ✓
   □ Dropdown Menu: max-height 200px, z-index 10 ✓
   □ Dropdown Items: padding 12px 16px ✓
   □ Contact Badges: 42px × 42px, border-radius 50% ✓
   □ Avatar Initials: font-size 12px, font-weight 600 ✓
   □ Form Column Gap: 20px between columns ✓
   □ Separator: 1px width, #d1d1d1 color ✓
   □ Error Border: #ff3d00 ✓
   □ Focus Border: $accent-color (#29ABE2) ✓
   □ Hover States: transform translateY(-2px) on priority buttons ✓
   
2. Screenshot Side-by-Side Comparison
   - Desktop (1920px): ✓
   - Tablet (768px): ✓
   - Mobile (390px): ✓
   
3. Accessibility Audit (ARIA labels, keyboard nav)
4. Focus Management prüfen
5. Screen Reader Testing
6. Commit: "style: ensure pixel-perfect design consistency"
```

**Tag 9: Documentation & Cleanup**
```bash
# Finalize & Document
1. JSDoc Comments für alle Components
2. Usage Examples in README
3. Migration Guide aktualisieren
4. Alte unused Components entfernen (falls vorhanden)
5. Final Review & Merge
```

---

### ✅ Success Criteria (Definition of Done)

#### Functionality
- [x] Form Submit funktioniert (Create + Edit Mode)
- [x] Alle Validierungen aktiv
- [x] Priority Selection funktioniert
- [x] Contact Dropdown öffnet/schließt korrekt
- [x] Contact Multi-Select funktioniert
- [x] Contact Badges angezeigt mit Remove
- [x] Category Dropdown funktioniert
- [x] Subtask Add/Edit/Delete funktioniert
- [x] Form Clear funktioniert
- [x] Overlay Mode funktioniert
- [x] Close Button funktioniert

#### Design & Styling
- [x] **⚠️ PIXEL-PERFECT**: Form sieht identisch aus wie vorher
- [x] Input height: 48px (nicht 46px oder 50px!)
- [x] Border radius: 10px (nicht 8px!)
- [x] Font sizes: Label 20px, Input 20px, Items 16px
- [x] Colors exakt: Error #ff3d00, Accent #29ABE2
- [x] Priority colors: urgent #ff3d00, medium #ffa800, low #7ae229
- [x] Avatar size: 42px × 42px
- [x] Form column gap: 20px
- [x] Form-group margin: 8px
- [x] Hover effects identisch (translateY, box-shadow)
- [x] Focus effects identisch (accent-color border)
- [x] Error effects identisch (#ff3d00 border)
- [x] Transitions identisch (0.2s ease)
- [x] Responsive Breakpoints funktionieren
- [x] Alle Components OnPush
- [x] Alle Properties sind Signals
- [x] Input/Output mit input()/output()
- [x] Keine Code-Duplikation
- [x] DRY Prinzip eingehalten
- [x] Clean Code (< 200 Zeilen pro Component)
- [x] TypeScript strict mode
- [x] No console.log in production code

#### Testing
- [x] Unit Tests für alle Components (min. 80% coverage)
- [x] Integration Test für AddTaskForm
- [x] E2E Test für Complete Flow
- [x] No failing tests
- [x] No TypeScript errors
- [x] No ESLint warnings

#### Accessibility
- [x] ARIA labels vorhanden
- [x] Keyboard Navigation funktioniert
- [x] Focus Management korrekt
- [x] Screen Reader compatible
- [x] Color Contrast ratio erfüllt (WCAG AA)

#### Documentation
- [x] JSDoc für alle Public Methods
- [x] README mit Usage Examples
- [x] Component API dokumentiert
- [x] Migration Guide aktualisiert

---

### 🎯 Command Checklist (Zum Ausführen)

```bash
# 1. Backup Branch erstellen
git checkout -b backup/before-addtask-refactoring
git push origin backup/before-addtask-refactoring
git checkout main

# 2. Feature Branch erstellen
git checkout -b feature/addtask-modular-architecture

# 3. Ordnerstruktur erstellen
mkdir -p src/app/features/add-task/components/{form-field,dropdown,button-group,badge-list,subtask-management}
mkdir -p src/app/features/add-task/presentational/add-task-form

# 4. Nach jedem Component:
git add .
git commit -m "feat: add [ComponentName]"

# 5. Nach Integration:
git add .
git commit -m "refactor: integrate presentational layer"

# 6. Testing:
npm run test
npm run lint

# 7. Final Merge:
git checkout main
git merge feature/addtask-modular-architecture
git push origin main
```

---

### 🚨 Potenzielle Herausforderungen & Lösungen

#### Challenge 1: FormControl Integration
**Problem**: FormFieldComponent muss ReactiveFormsModule korrekt integrieren  
**Lösung**: `input<FormControl>()` statt `@Input()`, computed für hasError

#### Challenge 2: Content Projection in Dropdown
**Problem**: Verschiedene Item-Templates für Contact vs Category  
**Lösung**: `<ng-content>` verwenden, Parent definiert Item-Template

#### Challenge 3: SubtaskManagement Complexity
**Problem**: State Management zwischen Input + List  
**Lösung**: Container Component mit lokalem Signal-State

#### Challenge 4: Style-Migration ohne Design-Änderungen ⚠️
**Problem**: Styles von `add-task/styles/*.scss` in Components übernehmen ohne dass sich visuell etwas ändert  
**Lösung**: 
- Bestehende SCSS 1:1 kopieren (nicht umschreiben!)
- Klassen-Namen beibehalten (z.B. `.form-input` bleibt `.form-input`)
- Pixel-Werte exakt übernehmen (48px height, 10px border-radius)
- Screenshot-Vergleich VORHER/NACHHER machen
- Browser DevTools Computed Styles vergleichen

#### Challenge 5: Type Safety mit ButtonConfig/BadgeItem
**Problem**: Generic Interfaces müssen typsicher sein  
**Lösung**: Strict TypeScript Interfaces exportieren

#### Challenge 6: Priority Button Styles in generischem ButtonGroup
**Problem**: ButtonGroupComponent muss Priority-Button Styles unterstützen UND generisch bleiben  
**Lösung**: 
```scss
// Base generic class
.button-group-item { /* generic styles */ }

// Extend/Alias für Priority Buttons
.priority-btn {
  @extend .button-group-item;
}

// Priority-specific variants (via cssClass parameter)
.priority-btn-urgent.active { background: #ff3d00; }
.priority-btn-medium.active { background: #ffa800; }
.priority-btn-low.active { background: #7ae229; }
```

#### Challenge 7: Dropdown Content Projection mit bestehenden Styles
**Problem**: Contact-Dropdown hat `.avatar`, `.contact-info` Styles - müssen diese in DropdownComponent?  
**Lösung**: 
- DropdownComponent styled nur `.dropdown-menu`, `.dropdown-item`
- Parent (AddTaskForm) definiert `.contact-info`, `.avatar` via `ng-content`
- Styles bleiben dort wo sie thematisch hingehören

---

### 💬 Kommunikation während Implementation

**Bei jedem Commit:**
```
feat: add BadgeList generic component

- Display badges with color + label
- Max visible + "more" indicator
- Remove functionality optional
- Horizontal/vertical layout support

Related to: #AddTaskRefactoring
```

**Bei Problemen:**
```
"Houston, wir haben ein Problem mit [X]"
→ Sofort stoppen, Problem beschreiben
→ Gemeinsam Lösung finden
→ Dokumentieren für Zukunft
```

**Nach jedem Sprint:**
```
"Sprint [N] abgeschlossen:"
✅ [Liste der fertigen Components]
⏳ [Was fehlt noch]
🐛 [Bekannte Issues]
```

---

## 🎉 Bereit zum Start?

### 📊 Plan Summary

**Components**: 5 (4 generisch + 1 domain)  
**Style Files**: 6 SCSS zu migrieren  
**Duration**: ~9 Tage (3 Sprints)  
**Risk**: LOW (bei Style 1:1 Übernahme)

### ⚠️ WICHTIGSTE REGEL: DESIGN BLEIBT IDENTISCH!

```
Vor jedem Commit:
1. Screenshot machen ✓
2. Visuell vergleichen ✓
3. DevTools Computed Styles checken ✓
4. Erst dann committen!
```

### 🎨 Style-Migration Prinzipien

1. **Copy, don't rewrite** - Bestehende SCSS 1:1 übernehmen
2. **Keep class names** - `.form-input` bleibt `.form-input`
3. **Preserve pixels** - 48px bleibt 48px, nicht "refactoren" zu 3rem
4. **Test visually** - Screenshots sind Pflicht!
5. **Use variables** - Aber nur die bestehenden aus `_variables.scss`

---

**Wenn dieser Plan OK ist, sage:**
> "Lass uns starten! Beginnen wir mit BadgeListComponent."

**Oder wenn noch Anpassungen nötig:**
> "Ich möchte noch [X] ändern/hinzufügen."

**Bei Style-Fragen:**
> "Wie genau soll [Component X] Style aussehen?"

**Motto: "Measure twice, cut once - and keep it pixel-perfect!"** 📐✂️🎨

---

**Erstellt**: 2024  
**Version**: 2.1 (mit Style-Strategie & Design-Konsistenz)  
**Status**: 📋 Planning Complete - Ready for Implementation
