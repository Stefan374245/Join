# Core Module - Globale Services, Models & Guards

## 📁 Struktur

```
core/
├── services/          # Globale Services (ehemals app/services/)
├── models/            # Globale Interfaces (ehemals app/models/)
└── guards/            # Route Guards (ehemals app/guards/)
```

## 🎯 Zweck

Der `core/` Ordner enthält alle **globalen, applikationsweiten** Services, Models und Guards.

### **Services** (`core/services/`)
- `auth.service.ts` - Authentifizierung & User Management
- `task.service.ts` - Task CRUD Operations
- `contact.service.ts` - Contact CRUD Operations
- `toast.service.ts` - Toast Notifications
- `daily-limit.service.ts` - Rate Limiting

### **Models** (`core/models/`)
- `task.interface.ts` - Task & Subtask Interfaces
- `contact.interface.ts` - Contact Interface
- `user.interface.ts` - User Interface

### **Guards** (`core/guards/`)
- `auth.guard.ts` - Route Protection (authGuard, guestGuard)

## ✅ Migrations-Status

### Phase 1 - ABGESCHLOSSEN ✅

- [x] Ordnerstruktur `features/` und `core/` angelegt
- [x] Services von `app/services/` → `core/services/` kopiert
- [x] Models von `app/models/` → `core/models/` kopiert
- [x] Guards von `app/guards/` → `core/guards/` kopiert
- [x] Alle Imports aktualisiert:
  - [x] app.routes.ts
  - [x] app.config.ts
  - [x] Board Components (board-view, task-detail, add-task)
  - [x] Contacts Components (contacts-list, contact-detail, contact-dialog)
  - [x] Summary Component
  - [x] Auth Components (login, signup, logo-animation)
  - [x] Public Components (email-mask, role-page)
  - [x] Layout Components (header)
  - [x] Shared Components (toast)

## 📝 Import-Beispiele

### Vorher (Alt)
```typescript
import { TaskService } from '../../services/task.service';
import { Task } from '../../models/task.interface';
import { authGuard } from './guards/auth.guard';
```

### Nachher (Neu)
```typescript
import { TaskService } from '../../core/services/task.service';
import { Task } from '../../core/models/task.interface';
import { authGuard } from './core/guards/auth.guard';
```

## 🔄 Nächste Schritte

**Phase 2**: Board Feature - Atomic Components erstellen
- Presentational Components aufteilen
- Container Component erstellen
- Styles migrieren

## ⚠️ Hinweise

- Die alten Ordner (`app/services/`, `app/models/`, `app/guards/`) können **nach vollständigem Test** gelöscht werden
- Core-Services bleiben **global** und werden in Features injiziert
- Feature-spezifische Services kommen in `features/{feature}/services/`
