# Join - Kanban Project Management

**Angular 19 Kanban Board mit intelligentem Bild-Upload und AI-Integration**

## 🚀 Live App

- **Frontend**: https://stefan-helldobler.de/join-issuecollector
- **Feature Requests**: requests@stefan-helldobler.de

## 📋 Was ist Join?

Moderne Kanban-Plattform für Task-Management mit **zwei verschiedenen Bild-Upload-Strategien** (Base64 + Firebase Storage) und optionaler AI-Integration für externe Feature Requests.

### 🎯 Hauptfunktionen

- **📎 Bild-Upload System**: Zwei Storage-Strategien (Base64 für Tasks, Storage für Avatare)
- **📊 Kanban Board**: Drag & Drop zwischen 5 Status-Spalten
- **👥 Kontakte**: Team-Management mit Avatar-Upload
- **✅ Subtasks**: Aufgaben in kleine Schritte unterteilen
- **🎯 Prioritäten**: High/Medium/Low Kennzeichnung
- **🤖 AI-Integration**: Externe Feature Requests via Email (optional)
- **🔥 Firebase**: Echtzeit-Synchronisation

## 💾 Bild-Upload: Zwei verschiedene Wege

### 📎 Task-Anhänge (Attachments)
**Speicherung:** Bilder werden komprimiert und als **Base64 direkt im Task** gespeichert

**Workflow:**
```
User wählt Bild → Validierung (JPEG/PNG) → Kompression (max 800x800px) 
→ Base64-Encoding → Direkt in Firestore Task-Dokument
```

**Vorteile:**
- Task und Bilder bleiben zusammen (keine extra Abfragen nötig)
- Bild ist immer da, wenn der Task geladen wird
- Gut für wenige Bilder pro Task

**Limits:** Max 1MB pro Task nach Kompression

### 👤 Kontakt-Avatare
**Speicherung:** Bilder werden in **Firebase Storage hochgeladen**, nur URL wird gespeichert

**Workflow:**
```
User uploaded Avatar → Validierung → Kompression → Upload zu Firebase Storage 
→ URL wird im Kontakt gespeichert → Bild lädt über URL
```

**Vorteile:**
- Viele Bilder möglich (nicht begrenzt durch Firestore-Dokument-Größe)
- Bilder werden gecacht (schnelles Laden)
- Separate Speicher-Verwaltung

**Storage-Path:** `users/{contactId}/avatar.jpg`

### 🔐 Sicherheit für beide Wege
- **Format-Check**: Nur JPEG/PNG erlaubt
- **Magic Bytes**: Prüft echten Dateityp (verhindert .exe → .jpg Umbenennungen)
- **Größen-Limit**: Max 15MB vor Kompression
- **Automatische Kompression**: Bilder werden auf 800x800px verkleinert

## 🔒 Firebase Datenbank

**tasks** - Alle Aufgaben
```javascript
{
  id: "task_123",
  title: "Login-Bug beheben",
  status: "triage" | "todo" | "in-progress" | "await-feedback" | "done",
  priority: "low" | "medium" | "high",
  attachments: [
    {
      filename: "screenshot.png",
      base64: "iVBORw0KG...",  // ← Bild direkt im Task!
      size: 245000
    }
  ],
  assignedTo: ["user@example.com"]
}
```

**users** - Alle Kontakte/User
```javascript
{
  email: "user@example.com",
  firstName: "Max",
  lastName: "Mustermann",
  avatarUrl: "https://firebasestorage.../avatar.jpg"  // ← Nur URL!
}
```

## 📁 Projekt-Struktur

```
src/app/
├── features/
│   ├── attachments/                    ⭐ Bild-Upload Module
│   │   ├── components/
│   │   │   ├── attachment-upload/      # Bilder hochladen + verwalten
│   │   │   ├── attachments-display/    # Bilder anzeigen + Download
│   │   │   └── image-viewer/           # Lightbox für Vollbild-Ansicht
│   │   ├── services/
│   │   │   ├── file-validation.service.ts      # Magic Bytes Check
│   │   │   ├── image-compression.service.ts    # Bilder kleiner machen
│   │   │   └── attachment-storage.service.ts   # Upload zu Firebase
│   │   └── helpers/
│   │       ├── base64-formatter.helper.ts      # Base64 Konvertierung
│   │       ├── blob-downloader.helper.ts       # Download-Logik
│   │       └── zip-creator.helper.ts           # ZIP für mehrere Bilder
│   │
│   ├── board/                          # Kanban Board
│   │   ├── components/
│   │   │   ├── board-column/           # Spalten (Triage, Todo, Done...)
│   │   │   ├── task-card/              # Task-Karten mit Drag & Drop
│   │   │   └── task-detail/            # Task-Details mit Attachments
│   │   └── styles/                     # Board-spezifische Styles
│   │
│   ├── add-task/                       # Task erstellen/bearbeiten
│   │   ├── components/
│   │   │   ├── dropdown/               # Dropdowns (Kategorie, Kontakte)
│   │   │   ├── subtask-management/     # Subtasks verwalten
│   │   │   └── badge-list/             # Zugewiesene Kontakte
│   │   └── presentational/
│   │       └── add-task-view/          # Komplettes Task-Formular
│   │
│   ├── contacts/                       # Kontakt-Verwaltung
│   │   ├── contacts-list/              # Kontakt-Liste mit Suche
│   │   ├── contact-dialog/             # Kontakt hinzufügen/bearbeiten
│   │   └── contact-detail/             # Kontakt-Details-Ansicht
│   │
│   ├── summary/                        # Dashboard
│   ├── landing/                        # Öffentliche Seiten
│   └── help/                           # Hilfe-Seite
│
├── core/
│   ├── services/
│   │   ├── task.service.ts             # Task CRUD + Firestore
│   │   ├── contact.service.ts          # Kontakt-Management + Avatar-Upload
│   │   ├── auth.service.ts             # Login, Signup, Guest
│   │   └── toast.service.ts            # Notifications
│   └── models/
│       ├── task.interface.ts           # Task mit Attachments[]
│       ├── contact.interface.ts        # Contact mit avatarUrl
│       └── firestore-types.interface.ts
│
├── auth/                               # Login, Signup
├── layout/                             # Header, Sidebar
└── shared/                             # Wiederverwendbare Components
    ├── components/                     # Toast, Spinner, Avatar...
    ├── directives/                     # Drag & Drop, Click Outside...
    └── constants/                      # File-Upload Limits, etc.
```

## 🛠️ Technologien

- **Angular 19** - Frontend Framework (Standalone Components, Signals)
- **Firebase** - Datenbank (Firestore) + Speicher (Storage) + Login (Auth)
- **TypeScript** - Typ-Sicherheit
- **SCSS** - Styling mit Mixins
- **n8n** - Workflow-Automatisierung (optional)
- **Google Gemini AI** - Feature Request Analyse (optional)

## 🤖 Bonus: AI Feature Request System

**Optional:** Externe Stakeholder können Feature Requests per Email einreichen

```
User sendet Email → n8n auf Railway → Google AI analysiert → Task wird erstellt
```

### Wie testen?

1. Öffne: https://stefan-helldobler.de/join-issuecollector
2. Klick auf "Help" → "Feature Request einreichen"
3. Formular ausfüllen → Task erscheint automatisch im Board

**Oder per Email:** requests@stefan-helldobler.de

**Was macht die AI?**
- Erkennt ob Bug oder Feature
- Setzt Priorität automatisch
- Erstellt 2-4 Subtasks

**Limits:** Max 10 Requests pro Tag, Emails werden alle 1-2 Min geprüft

## 📋 Wichtige Limits

### Bild-Upload
- **Formate**: Nur JPEG und PNG
- **Größe**: Max 15MB vor Kompression
- **Kompression**: Automatisch auf 800x800px
- **Task-Limit**: Max 1MB gesamt (alle Attachments zusammen)
- **Sicherheit**: Magic Bytes Check verhindert Fake-Extensions

### Feature Requests (AI)
- Max 10 pro Tag
- Emails: Verzögerung 1-2 Min
- Bei AI-Fehler: Task ohne Subtasks

---

**Entwickelt mit Angular 19 + Firebase**


