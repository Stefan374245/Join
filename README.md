# Join - Kanban Project Management Tool

**Angular-basiertes Kanban Board mit AI-gesteuertem Feature Request Collector**

## 🚀 Live App

**Frontend**: https://[deine-hostinger-url]  
**AI Workflow (n8n)**: https://n8n-production-04d3.up.railway.app  
**Feature Request E-Mail**: requests@stefan-helldobler.de

## 📋 Was ist Join?

Join ist eine Kanban-basierte Task-Management-Plattform mit einem besonderen Feature: **Externe Stakeholder können Feature Requests per E-Mail oder Webformular einreichen**, ohne sich registrieren zu müssen. Ein AI-gesteuerter Workflow analysiert die Requests automatisch und erstellt Tasks im System.

### 🎯 Kern-Features

- **📊 Kanban Board**: Drag & Drop Tasks zwischen 5 Status-Spalten (Triage, To-Do, In Progress, Await Feedback, Done)
- **✅ Subtasks**: Detaillierte Aufgaben mit AI-generierten Subtasks
- **👥 Kontakte**: Team-Mitglieder verwalten und Tasks zuweisen
- **🎯 Prioritäten**: High, Medium, Low mit visueller Kennzeichnung
- **📧 Feature Request Collector**: Externe können Requests per E-Mail oder Formular senden
- **🤖 AI-Integration**: Google Gemini analysiert Requests und generiert Subtasks
- **🔥 Firebase Backend**: Echtzeit-Synchronisation aller Tasks und Kontakte

## 🔄 Wie funktioniert der Feature Request Workflow?

### Übersicht

```
User sendet Request (Web-Formular oder E-Mail)
            ↓
    [Railway n8n Workflow]
            ↓
    Parse & Validate Daten
            ↓
    Check Daily Limit (max 10/Tag)
            ↓
    Google Gemini AI Analyse
            ↓
    Task in Firebase erstellen
            ↓
    Bestätigungs-E-Mail senden
            ↓
    ✅ Task erscheint im Board
```

### Schritt-für-Schritt

**1. Input (Dual-System)**
- **Webformular**: User füllt Formular auf Help-Seite aus → POST an n8n Webhook
- **E-Mail**: User sendet E-Mail an requests@stefan-helldobler.de → IMAP Trigger in n8n

**2. Parsing & Validation**
- Extrahiert: Typ (Feature/Bug/Question), Titel, Beschreibung, User-E-Mail
- Bereinigt Text (entfernt Signaturen, Grüße, unnötige Formatierung)

**3. Daily Limit Check**
- Firebase Collection `daily_limits` mit globalem Tages-Counter
- Maximum: 10 Requests pro Tag
- Bei Überschreitung: Limit-Warnung per E-Mail

**4. AI-Analyse (Google Gemini)**
- Eingabe: Bereinigte Beschreibung
- AI generiert: 2-3 konkrete Subtasks
- Beispiel: "User Login" → Subtasks: ["Erstelle Login-Formular", "Implementiere JWT-Auth", "Error Handling"]

**5. Firebase Integration**
- Task wird in `tasks` Collection gespeichert
- Status: "triage" (zur Review durch Team)
- Eigenschaften: Priorität (low/medium/high), Kategorie (User Story/Technical Task), Deadline (AI-berechnet)

**6. E-Mail Bestätigung**
- Resend API sendet Bestätigung an User
- Von: requests@stefan-helldobler.de
- Inhalt: Task-Details, Subtasks, Tracking-Info

**7. Board Update**
- Task erscheint sofort im Board (Echtzeit via Firebase)
- Team kann Task bearbeiten, priorisieren, zuweisen

## 🧪 App testen

### Option 1: Über die Web-App (Empfohlen)

1. **Öffne die Live-URL** in deinem Browser
2. **Ohne Login:**
   - Navigiere zu "Help" → Feature Request Formular
   - Fülle aus:
     - Typ: Feature / Bug / Question / Improvement
     - Titel: "Deine Feature-Idee"
     - Beschreibung: "Detaillierte Beschreibung..."
     - Deine E-Mail: "test@example.com"
   - Klick "Submit"
   - ✅ Task wird automatisch erstellt

3. **Mit Login:**
   - Registriere Test-Account ODER nutze Guest-Login
   - Navigiere zum Board
   - ✅ Sieh den neu erstellten Task in "Triage" Spalte
   - Teste Drag & Drop zwischen Spalten
   - Click auf Task → Details mit Subtasks ansehen

### Option 2: Per E-Mail (IMAP Trigger)

**Sende E-Mail an**: requests@stefan-helldobler.de

**Format:**
```
Betreff: [Feature] Deine Feature-Idee
Text: 
Ich hätte gerne eine Funktion zum...
Bitte implementiert das.

Viele Grüße
Dein Name
```

**Was passiert:**
1. ✅ IMAP Trigger in n8n erkennt neue E-Mail (kann 1-2 Min dauern)
2. ✅ Workflow extrahiert Betreff + Text
3. ✅ Google Gemini AI analysiert Content
4. ✅ Task wird in Firebase erstellt
5. ✅ Du erhältst Bestätigungs-E-Mail

### Option 3: Direkter Webhook-Test (PowerShell)

```powershell
$body = @{
    type = "feature"
    title = "Test Feature Request"
    description = "Dies ist ein Test des Workflows"
    userEmail = "test@example.com"
    userName = "Test User"
} | ConvertTo-Json

Invoke-RestMethod -Uri "https://n8n-production-04d3.up.railway.app/webhook/feature-request" -Method POST -Body $body -ContentType "application/json"
```

**Erwartetes Ergebnis:** Task wird sofort erstellt, Bestätigungs-E-Mail innerhalb 10 Sekunden

## 📊 Ergebnisse überprüfen

### 1. Firebase Console
1. Öffne [Firebase Console](https://console.firebase.google.com)
2. Projekt: `join-angular-based`
3. Firestore Database → Collection `tasks`
4. Neuer Task mit:
   - `status: "triage"`
   - `aiGenerated: true`
   - `source: "webhook"` oder `"email"`
   - `subtasks: [{...}, {...}]`
5. Collection `daily_limits` → Counter erhöht

### 2. E-Mail Postfach
- Check Postfach der angegebenen E-Mail
- Bestätigung von `requests@stefan-helldobler.de`
- Enthält: Task-Titel, Beschreibung, generierte Subtasks

### 3. n8n Workflow Logs (Advanced)
- Öffne https://n8n-production-04d3.up.railway.app
- Login erforderlich
- "Executions" → Letzte Ausführung ansehen
- Jeder Node zeigt Input/Output

### 4. Angular App
- Reload der App
- Board → "Triage" Spalte
- Task ist sichtbar
- Click → Details mit AI-Subtasks

## 📧 E-Mail Integration Details

### Resend API (Ausgehend)
- **Provider**: Resend (https://resend.com)
- **Domain**: stefan-helldobler.de (DKIM/SPF verifiziert)
- **Methode**: REST API (kein SMTP, da Railway Ports 465/587 blockiert)
- **Nodes**: 2x HTTP Request Nodes in n8n
  - Success Confirmation (nach Task-Erstellung)
  - Limit Email (bei Daily Limit erreicht)

### IMAP (Eingehend)
- **E-Mail**: requests@stefan-helldobler.de
- **Trigger**: Email Read IMAP Node in n8n
- **Check-Intervall**: Alle 1-2 Minuten
- **Parsing**: Automatisch Betreff + Body + Absender

## 🔒 Firebase Backend

### Collections

**tasks**: Alle Kanban Tasks
```javascript
{
  id: "auto-generated-id",
  title: "Feature Request Title",
  description: "Detaillierte Beschreibung...",
  status: "triage|todo|in-progress|await-feedback|done",
  priority: "low|medium|high",
  category: "User Story|Technical Task",
  dueDate: "2026-01-16T10:00:00Z",
  subtasks: [
    {id: "subtask_1", title: "Erstelle UI", completed: false},
    {id: "subtask_2", title: "Backend Logic", completed: false}
  ],
  creatorEmail: "user@example.com",
  creatorName: "User Name",
  aiGenerated: true,
  source: "webhook|email",
  createdAt: "2026-01-09T15:30:00Z"
}
```

**users**: Authentifizierte User + Kontakte
```javascript
{
  id: "user-id-or-email",
  email: "user@example.com",
  firstName: "Max",
  lastName: "Mustermann",
  color: "#FF7A00",  // Auto-generiert
  initials: "MM"
}
```

**daily_limits**: Request Counter
```javascript
{
  id: "global_2026-01-09",
  count: 7,
  dailyLimit: 10,
  lastUpdated: "2026-01-09T15:30:00Z",
  lastRequestTitle: "Feature XYZ"
}
```

### Security Rules

Siehe `firestore.rules`:

- **Authenticated Users**: Voller Zugriff auf tasks/users (CRUD)
- **Public Write**: n8n kann Tasks mit `aiGenerated: true` erstellen
- **Public Read/Write**: daily_limits Collection für Counter

## 🛠️ Technologie-Stack

| Komponente | Technologie | Zweck |
|------------|-------------|-------|
| **Frontend** | Angular 19 (Standalone) | UI, Routing, State Management |
| **Backend** | Firebase Firestore | NoSQL Database, Echtzeit-Sync |
| **Auth** | Firebase Authentication | User Login, Guards |
| **AI** | Google Gemini | Subtask-Generierung, Analyse |
| **Workflow** | n8n (Railway) | Automation Engine |
| **E-Mail (Out)** | Resend API | Transactional Emails |
| **E-Mail (In)** | IMAP | Request-Empfang |
| **Hosting** | Hostinger | Static Hosting via FTP |

## 📁 Projekt-Struktur

```
src/app/
├── components/
│   ├── board/
│   │   ├── board-view/          # Kanban Board mit Drag & Drop
│   │   └── task-detail/         # Task-Detail Modal
│   ├── contacts/
│   │   ├── contacts-list/       # Kontakt-Übersicht
│   │   ├── contact-dialog/      # Erstellen/Bearbeiten
│   │   └── contact-detail/      # Detail-Ansicht
│   ├── help/                    # Feature Request Formular
│   ├── summary/                 # Dashboard
│   └── public/welcome/          # Landing Page für Stakeholder
├── services/
│   ├── task.service.ts          # Task CRUD (Firebase)
│   ├── contact.service.ts       # Kontakte (Firebase)
│   ├── auth.service.ts          # Authentication
│   └── toast.service.ts         # Notifications
├── models/
│   ├── task.interface.ts        # Task Type
│   └── contact.interface.ts     # Contact Type
└── guards/
    └── auth.guard.ts            # Route Protection

n8n-workflows/
└── Email to Kanban Task Converter with AI Analysis.json
```

## 🚨 Bekannte Einschränkungen

- **Daily Limit**: Max 10 Feature Requests/Tag (Counter in Firebase)
- **IMAP Delay**: E-Mail-Trigger kann 1-2 Minuten dauern (nicht Echtzeit)
- **SMTP blockiert**: Railway blockiert Ports → Resend REST API statt SMTP
- **AI-Fehler**: Bei Gemini-Fehler werden Tasks ohne Subtasks erstellt (Fallback)

## 📚 Weitere Dokumentation

- **[N8N Workflow Details](./n8n-workflows/README.md)**: Komplette Workflow-Dokumentation
- **[Routing Guide](./ROUTING_INTEGRATION_GUIDE.md)**: Angular Routing Setup
- **[Migration Plan](./MIGRATION_STEP_BY_STEP_PLAN.md)**: Architektur-Änderungen

## 💡 FAQ

**Q: Warum erscheint mein Task nicht sofort?**  
A: Bei E-Mail-Requests: IMAP Check alle 1-2 Min. Bei Webhook: Sofort, aber App-Reload nötig.

**Q: Kann ich mehr als 10 Requests/Tag senden?**  
A: Nein, Daily Limit ist hardcoded. Du erhältst eine Limit-E-Mail.

**Q: Werden Subtasks immer generiert?**  
A: Nein, bei AI-Fehler oder zu kurzer Beschreibung: Task ohne Subtasks.

**Q: Kann ich den Workflow selbst hosten?**  
A: Ja, siehe `n8n-workflows/README.md` für Import-Anleitung.

---

**Entwickelt mit ❤️ und Angular**  
Bei Fragen: Check n8n Workflow Logs oder Firebase Console
