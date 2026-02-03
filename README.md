# Join - Kanban Project Management

**Angular 19 Kanban Board mit AI-gesteuertem Feature Request System**

## 🚀 Live App

- **Frontend**: https://stefan-helldobler.de/join-issuecollector
- **AI Workflow**: https://n8n-production-04d3.up.railway.app (n8n auf Railway)
- **Feature Requests**: requests@stefan-helldobler.de

## 📋 Was ist Join?

Kanban-basierte Task-Management-Plattform mit AI-Integration. **Externe Stakeholder können Feature Requests per E-Mail oder Webformular einreichen** – ein n8n-Workflow auf Railway analysiert diese mit Google Gemini und erstellt automatisch Tasks in Firebase.

### 🎯 Features

- **📊 Kanban Board**: Drag & Drop zwischen 5 Status-Spalten
- **✅ Subtasks**: AI-generierte Subtasks via Google Gemini
- **👥 Kontakte**: Team-Management mit Farbcodes
- **📎 Attachments**: Bild-Upload (JPEG/PNG) mit Validierung & Kompression
- **🎯 Prioritäten**: High/Medium/Low mit visueller Kennzeichnung
- **📧 Request System**: E-Mail (IMAP) + Webhook-Integration
- **🤖 AI-Analyse**: Automatische Bug/Feature-Erkennung
- **🔥 Firebase**: Echtzeit-Synchronisation

## 🔄 Feature Request Workflow (Railway + Resend)

```
User sendet Request
    ↓
┌─────────────────────────────────────┐
│   Railway n8n Workflow              │
├─────────────────────────────────────┤
│ 1. Email Trigger (IMAP)             │ ← requests@stefan-helldobler.de
│    oder Webhook (POST)              │ ← Webformular
│ 2. Parse & Validate                 │
│ 3. Check Daily Limit (10/Tag)       │ ← Firebase Counter
│ 4. Google Gemini AI Analyse         │ ← Type, Subtasks generieren
│ 5. Firebase Task erstellen          │ ← Firestore Collection
│ 6. Resend API Email senden          │ ← Bestätigung via REST
└─────────────────────────────────────┘
    ↓
Task im Board sichtbar (Echtzeit)
```

### Workflow-Details

**1. Input-Kanäle**
- **IMAP**: Email an requests@stefan-helldobler.de (Check alle 1-2 Min)
- **Webhook**: POST https://n8n-production-04d3.up.railway.app/webhook/feature-request

**2. Parsing**
- Extrahiert: Type (auto-detect: bug/feature), Titel, Beschreibung, User-Email
- Bereinigt: Signaturen, Grüße, HTML-Tags entfernt
- Bug-Keywords: `vulnerability`, `security`, `error`, `broken` → type: "bug"

**3. Daily Limit (Firebase)**
- Collection: `daily_limits/global_YYYY-MM-DD`
- Max: 10 Requests/Tag (global)
- Bei Überschreitung: Email via Resend

**4. AI-Analyse (Gemini)**
- Model: `gemini-2.0-flash-001`
- Temperature: `0.1` (konsistente Ausgabe)
- Input: Bereinigte Beschreibung
- Output: 2-4 Subtasks (max 35 chars/Subtask)

**5. Firebase Speicherung**
```javascript
{
  title: "Fix XSS vulnerability in CommentFormComponent",
  description: "AI-generierte Zusammenfassung",
  status: "triage",
  priority: "high",  // Auto-erkannt via Keywords
  category: "Technical Task",  // bug → Technical Task
  subtasks: [
    {id: "...", title: "Sanitize input fields", completed: false},
    {id: "...", title: "Deploy hotfix", completed: false}
  ],
  aiGenerated: true,
  source: "email" | "webhook"
}
```

**6. Email-Benachrichtigung (Resend)**
- API: `POST https://api.resend.com/emails`
- Von: requests@stefan-helldobler.de
- Inhalt: Task-Details, Subtasks, Daily Limit Info
- **Warum Resend?** Railway blockiert SMTP-Ports (465, 587) → REST API nötig

## 🧪 App testen

### Option 1: Web-Formular (Empfohlen)

1. **Öffne**: https://stefan-helldobler.de/join-issuecollector
2. **Navigiere zu**: Help → "Feature Request einreichen"
3. **Fülle aus**:
   - Type: Feature/Bug
   - Titel: "Dein Feature-Wunsch"
   - Beschreibung: Mindestens 20 Zeichen
   - Email: deine@email.de
4. **Submit** → Task wird in 5-10 Sek erstellt
5. **Login** → Board → Task in "Triage" Spalte sehen

### Option 2: E-Mail (IMAP Trigger)

**Sende an**: requests@stefan-helldobler.de

```
Betreff: [Bug] Login funktioniert nicht

Beschreibung:
Seit gestern können Benutzer sich nicht mehr einloggen.
Fehlermeldung "Invalid credentials" erscheint.

Grüße
Max
```

**Erwartung**:
- ✅ IMAP Check (1-2 Min Delay)
- ✅ AI erkennt Bug → type: "bug", priority: "high"
- ✅ Subtasks generiert: ["Debug login flow", "Fix auth service"]
- ✅ Bestätigungs-Email innerhalb 30 Sek

### Option 3: Webhook (PowerShell)

```powershell
$body = @{
    type = "feature"
    title = "CSV Export für User-Daten"
    description = "Wir brauchen einen CSV-Export für die User-Liste mit allen Feldern."
    userEmail = "test@example.com"
    userName = "Test User"
} | ConvertTo-Json

Invoke-RestMethod -Uri "https://n8n-production-04d3.up.railway.app/webhook/feature-request" -Method POST -Body $body -ContentType "application/json"
```

## 📧 E-Mail Integration Details

### Resend API (Ausgehend)
- **Provider**: Resend (https://resend.com)
- **Domain**: stefan-helldobler.de (DKIM/SPF verifiziert)
- **Methode**: REST API via `POST https://api.resend.com/emails`
- **Warum REST?** Railway blockiert SMTP-Ports (465, 587)
- **Nodes**: 2x HTTP Request in n8n
  - Success Confirmation (nach Task-Erstellung)
  - Limit Email (bei Daily Limit erreicht)

### IMAP (Eingehend)
- **E-Mail**: requests@stefan-helldobler.de
- **Trigger**: Email Read IMAP Node in n8n
- **Check-Intervall**: Alle 1-2 Minuten
- **Parsing**: Automatisch Betreff + Body + Absender

## 🔒 Firebase Konfiguration

### Collections

**tasks**
```javascript
{
  id: "auto-id",
  title: "Fix XSS vulnerability in CommentFormComponent",
  description: "AI-generierte Zusammenfassung",
  status: "triage" | "todo" | "in-progress" | "await-feedback" | "done",
  priority: "low" | "medium" | "high",
  category: "User Story" | "Technical Task",
  dueDate: "2026-02-06T10:00:00Z",
  subtasks: [
    {id: "subtask_1", title: "Sanitize inputs", completed: false}
  ],
  attachments: [
    {id: "att_1", name: "screenshot.png", url: "https://...", type: "image/png"}
  ],
  assignedTo: ["user@example.com"],
  creatorEmail: "requests@stefan-helldobler.de",
  creatorType: "external",
  aiGenerated: true,
  source: "webhook" | "email",
  createdAt: "2026-02-03T12:00:00Z"
}
```

**users** (Auth + Kontakte)
```javascript
{
  id: "user-id",
  email: "user@example.com",
  firstName: "Max",
  lastName: "Mustermann",
  color: "#FF7A00",
  initials: "MM"
}
```

**daily_limits** (Request Counter für n8n)
```javascript
{
  id: "global_2026-02-03",
  count: 7,
  dailyLimit: 10,
  lastUpdated: "2026-02-03T15:30:00Z",
  lastRequestTitle: "CSV Export Feature"
}
```

## 🛠️ Technologie-Stack

| Layer | Technologie | Details |
|-------|-------------|---------|
| **Frontend** | Angular 19 Standalone | Signals, RxJS, TypeScript |
| **Styling** | SCSS | Mixins, Variables, Responsive |
| **Backend** | Firebase Firestore | NoSQL, Echtzeit-Sync |
| **Auth** | Firebase Authentication | Email/Password + Guest Login |
| **Storage** | Firebase Storage | Bild-Uploads (JPEG/PNG) |
| **AI** | Google Gemini 2.0 Flash | Task-Analyse, Subtask-Generierung |
| **Workflow** | n8n (Railway) | Automation, IMAP, Webhooks |
| **Email (Out)** | Resend API | REST (Railway blockiert SMTP-Ports) |
| **Email (In)** | IMAP | requests@stefan-helldobler.de |
| **Hosting** | Hostinger | Static Files via FTP |

### 🔑 Warum diese Tech-Wahl?

- **Railway**: Kostenlose n8n-Instanz, aber Ports 465/587 blockiert → Resend REST API
- **Resend**: Moderne Email-API, DKIM/SPF verifiziert, kein SMTP nötig
- **Firebase Storage**: Integriert mit Firestore, einfache Bild-Uploads
- **Gemini 2.0 Flash**: Schnell, günstig, gute JSON-Ausgabe

## 📁 Projekt-Struktur

```
src/app/
├── auth/                           # Authentication
│   ├── login/
│   ├── signup/
│   └── logo-animation/
│
├── core/                           # Services & Models
│   ├── guards/
│   │   └── auth.guard.ts           # Route Protection
│   ├── models/
│   │   ├── task.interface.ts
│   │   ├── contact.interface.ts
│   │   └── user.interface.ts
│   └── services/
│       ├── task.service.ts         # Task CRUD + Firestore
│       ├── contact.service.ts      # Contact Management
│       ├── auth.service.ts         # Login, Signup, Guest
│       ├── file-validation.service.ts  # Magic Bytes Check (PNG/JPEG)
│       ├── image-compression.service.ts  # Komprimierung vor Upload
│       ├── attachment-storage.service.ts  # Firebase Storage
│       ├── daily-limit.service.ts  # Request Counter (n8n)
│       ├── loading.service.ts      # Global Loading State
│       └── toast.service.ts        # Notifications
│
├── features/                       # Feature Modules
│   ├── add-task/
│   │   ├── components/
│   │   │   ├── badge-list/
│   │   │   ├── dropdown/
│   │   │   ├── subtask-management/
│   │   │   └── task-attachment-upload/  # 📎 Bild-Upload
│   │   └── presentational/
│   │       └── add-task-view/
│   │
│   ├── board/
│   │   ├── components/
│   │   │   ├── board-column/
│   │   │   ├── task-card/
│   │   │   ├── task-detail/
│   │   │   ├── task-attachments-display/
│   │   │   └── image-viewer/      # Lightbox für Bilder
│   │   └── presentational/
│   │       └── board-view/
│   │
│   ├── contacts/
│   │   ├── contacts-list/
│   │   ├── contact-dialog/
│   │   └── contact-detail/
│   │
│   ├── landing/                    # Public Pages
│   │   └── hero/
│   │       ├── request/            # Feature Request Form
│   │       └── email-form/
│   │
│   ├── summary/                    # Dashboard
│   ├── help/                       # Feature Request Info
│   ├── legal-notice/
│   └── privacy-policy/
│
├── layout/
│   ├── header/
│   ├── sidebar/
│   └── main-layout/
│
└── shared/
    ├── components/
    │   ├── user-avatar/
    │   ├── loading-spinner/
    │   ├── toast/
    │   └── footer-auth/
    ├── directives/
    │   ├── drag-drop.directive.ts  # Drag & Drop für Board
    │   ├── click-outside.directive.ts
    │   └── prevent-default.directive.ts
    ├── constants/
    │   ├── file-upload.constants.ts  # Allowed Types: image/jpeg, image/png
    │   ├── task.constants.ts
    │   └── colors.constants.ts
    └── utils/

n8n-workflows/
├── Email to Kanban Task Converter.json  # AI Feature Request Handler
└── Task Status Change.json              # Status Update Notifier
```

### 📎 File Upload Details

**Erlaubte Formate**: Nur Bilder (JPEG, PNG)

**Upload-Flow**:
1. `file-validation.service.ts`: Magic Bytes Check (verhindert fake Extensions)
2. `image-compression.service.ts`: Komprimierung (max 500KB, Quality 0.8)
3. `attachment-storage.service.ts`: Upload zu Firebase Storage
4. Task: Speichert Download-URLs in `attachments` Array

**Sicherheit**:
- Content-Type Validierung
- File Size Limit (5MB vor Kompression)
- Magic Bytes Check (echtes JPEG/PNG)
- Firebase Storage Rules (auth required)

## 🚨 Limits & Constraints

- **Daily Limit**: 10 Feature Requests/Tag (global Counter in Firebase)
- **IMAP Delay**: Email-Trigger 1-2 Min (nicht Echtzeit)
- **Railway Ports**: 465/587 blockiert → Resend REST API statt SMTP
- **File Upload**: Nur Bilder (JPEG, PNG), max 5MB vor Kompression
- **AI-Fallback**: Bei Gemini-Fehler → Task ohne Subtasks erstellt

## 💡 FAQ

**Q: Task erscheint nicht sofort?**  
A: Email (IMAP): 1-2 Min Delay. Webhook: Sofort, aber Browser-Reload nötig.

**Q: Mehr als 10 Requests/Tag?**  
A: Nein, hardcoded. Limit-Email via Resend bei Überschreitung.

**Q: Warum Resend statt SMTP?**  
A: Railway blockiert SMTP-Ports (465, 587) → REST API als Workaround.

**Q: Welche Dateien kann ich hochladen?**  
A: Nur Bilder (JPEG/PNG). Validierung via Magic Bytes + Content-Type Check.

**Q: AI generiert manchmal keine Subtasks?**  
A: Bei zu kurzer Beschreibung (<20 Zeichen) oder Gemini-API-Fehler.

---

**Entwickelt mit Angular 19 + Firebase + n8n auf Railway**  
Workflow Logs: https://railway.app/dashboard


