# Join - Task Management Platform

<p align="center">
  <img src="https://img.shields.io/badge/Angular-19.2-red?style=for-the-badge&logo=angular" alt="Angular 19.2">
  <img src="https://img.shields.io/badge/Firebase-12.5-orange?style=for-the-badge&logo=firebase" alt="Firebase">
  <img src="https://img.shields.io/badge/TypeScript-5.x-blue?style=for-the-badge&logo=typescript" alt="TypeScript">
</p>

**Join** ist eine moderne, kollaborative Task-Management-Plattform entwickelt mit Angular 19. Die Anwendung kombiniert ein intuitives Kanban-Board mit intelligenter Email-Integration, um Teams und externe Stakeholder nahtlos zusammenzuarbeiten zu lassen.

> 🎯 **Besonderheit**: Automatischer Email-basierter Issue-Kollektor für reibungslose Kommunikation mit externen Stakeholdern

## 🚀 Demo-Nutzung

### Schnellstart - Anwendung testen

Sie können Join sofort ausprobieren:

1. **Öffentlicher Zugang** (ohne Login):
   - Navigieren Sie zur Welcome-Seite
   - Wählen Sie "Stakeholder" um den Issue-Kollektor zu testen
   - Erstellen Sie ein Demo-Feature-Request per E-Mail

2. **Mit Account** (vollständiger Zugriff):
   ```bash
   # Demo-Zugangsdaten
   Email: demo@join.com
   Passwort: demo123
   ```
   - Zugriff auf Task Board mit Drag & Drop
   - Erstellen und verwalten Sie Tasks
   - Fügen Sie Kontakte hinzu
   - Testen Sie alle Features

3. **Lokale Installation**:
   ```bash
   git clone https://github.com/IHR-USERNAME/angular-based-join.git
   cd angular-based-join
   npm install
   ng serve
   ```
   Öffnen Sie `http://localhost:4200/` im Browser

### Was können Sie testen?

- ✅ **Task Board**: Drag & Drop Tasks zwischen Status-Spalten
- ✅ **Task-Erstellung**: Neue Tasks mit Priorität, Deadline und Subtasks anlegen
- ✅ **Kontakte**: Team-Mitglieder verwalten und Tasks zuweisen
- ✅ **Email Issue-Kollektor**: Feature-Requests per E-Mail einreichen (als Stakeholder)
- ✅ **Responsive Design**: Testen auf verschiedenen Geräten

## ✨ Features

### 📋 Core Features

- **🎯 Kanban Board**: Drag & Drop Interface mit 5 Status-Spalten (Triage, To-Do, In Progress, Await Feedback, Done)
- **✓ Subtasks**: Detaillierte Aufgabenunterteilung mit Fortschrittsanzeige
- **👥 Kontaktverwaltung**: Zentrale Verwaltung von Team-Mitgliedern mit Avatar-Generierung
- **⚡ Priorisierung**: Visuell unterscheidbare Prioritätsstufen (Low, Medium, High)
- **🔥 Firebase Backend**: Echtzeit-Synchronisation und sichere Authentifizierung
- *📧 Email Issue-Kollektor

Die Plattform bietet einen innovativen Issue-Kollektor, der es externen Stakeholdern ermöglicht, Feature-Requests oder Tickets per E-Mail einzureichen. Diese werden automatisch verarbeitet und ins System übernommen.

**Problem gelöst**: Externe Stakeholder können Anfragen stellen, ohne sich registrieren oder in komplexe Tools einarbeiten zu müss

- **Angular 19.2**: Moderne Standalone Components & Signals
- **TypeScript**: Typ-sichere Entwicklung
- **SCSS**: Modulares Styling mit Mixins und Variables
- **Responsive Design**: Optimiert für Desktop, Tablet und Mobile
- **Firebase Integration**: Firestore Database + Authentication

## 📧 Email Issue-Kollektor

Die Plattform bietet einen innovativen Issue-Kollektor, der es externen Stakeholdern ermöglicht, Feature-Requests oder Tickets per E-Mail einzureichen. Diese werden automatisch verarbeitet und ins System übernommen.

**Problem gelöst**: Externe Stakeholder können Anfragen stellen, ohne sich registrieren oder in komplexe Tools einarbeiten zu müssen.

### Automatisierung mit N8N

Die E-Mail-zu-Task-Konvertierung wird durch einen N8N Workflow automatisiert:

📁 **Workflow-Dateien**: [`n8n-workflows/`](./n8n-workflows/)

Der N8N Workflow überwacht eingehende E-Mails und erstellt automatisch Tasks in Firebase. Eine vollständige Anleitung zum Import und zur Konfiguration finden Sie im [N8N Workflows README](./n8n-workflows/README.md).

### Wie funktioniert es?

1. **Stakeholder-Zugang**: Externe Nutzer können über die öffentliche Welcome-Seite auf den Issue-Kollektor zugreifen
2. **E-Mail-Erstellung**: Eine vorgefertigte E-Mail-Vorlage wird generiert
3. **Automatische Verarbeitung**: Eingehende E-Mails werden automatisch als Tasks mit Priorität und Deadline ins System übernommen
4. **Daily Limit**: Pro Tag können 10 automatische Tickets erstellt werden (danach manuelle Review)

### Issue-Kollektor nutzen

**Für Stakeholder:**
- Besuche die Welcome-Seite der Anwendung
- Wähle "Stakeholder" als Rolle
- Nutze den "Send Request"-Button um eine E-Mail zu erstellen
- Die E-Mail wird an `requests@stefan-helldobler.de` gesendet

**Für Entwickler - Anpassungen:**

Die Issue-Kollektor-Konfiguration befindet sich in:
- `src/app/components/public/welcome/role-page/role-page.component.ts`

Dort können Sie anpassen:
```typescript
// E-Mail-Empfänger ändern
email: 'your-email@example.com'

// Daily Limit anpassen
dailyLimit: 10  // Standard: 10 Requests pro Tag

// E-Mail-Template anpassen
// Siehe Methode: composeGmailMessage()
```

**Task-Eigenschaften vom Issue-Kollektor:**
```typescript
{
  source: 'email',           // Markierung als Email-Request
  creatorType: 'external',   // Externer Ersteller
  creatorEmail: '...',       // E-Mail des Stakeholders
  aiGenerated: true          // Optional: AI-generierte Tasks
}
```

## Installation & Setup

### Voraussetzungen

- Node.js (empfohlen: LTS Version)
- Angular CLI (`npm install -g @angular/cli`)
- Firebase Account (für Backend-Services)

### Projekt einrichten

1. Repository klonen und Dependencies installieren:
```bash
git clone https://github.com/IHR-USERNAME/angular-based-join.git
cd angular-based-join
npm install
```

2. **Firebase-Konfiguration einrichten** (WICHTIG):
   
   Die Environment-Dateien im Repository enthalten Mock-Daten. Für die lokale Entwicklung wurden bereits echte Credentials in `.local.ts` Dateien gespeichert (werden von Git ignoriert).
   
   **Für neue Entwickler:**
   - Kopieren Sie Ihre Firebase-Config aus [Firebase Console](https://console.firebase.google.com)
   - Ersetzen Sie die Werte in `src/environments/environment.local.ts` (Development)
   - Ersetzen Sie die Werte in `src/environments/environment.prod.local.ts` (Production)
   
   **Angular ist bereits konfiguriert**, diese lokalen Dateien automatisch zu verwenden:
   - `ng serve` → nutzt `environment.local.ts`
   - `ng build --configuration production` → nutzt `environment.prod.local.ts`
   
   ⚠️ **WICHTIG**: Die `.local.ts` Dateien sind in `.gitignore` und werden NICHT committet!

3. Development Server starten:
```bash
ng serve
```

Die Anwendung läuft unter `http://localhost:4200/`

## Wichtige Anpassungen

### Firebase-Konfiguration

Bearbeiten Sie `src/environments/environment.ts` und `environment.prod.ts`:
```typescript
export const environment = {
  production: false,
  firebase: {
    apiKey: "IHR_API_KEY",
    authDomain: "ihr-projekt.firebaseapp.com",
    projectId: "ihr-projekt-id",
    // ...
  }
};
```

### Styling anpassen

Zentrale Styles befinden sich in:
- `src/styles/_variables.scss` - Farben, Schriftarten, Abstände
- `src/styles/components/_buttons.scss` - Button-Styles
- `src/styles/_mixins.scss` - Wiederverwendbare Style-Mixins

### Routen konfigurieren

Haupt-Routing in `src/app/app.routes.ts`:
```typescript
// Neue Route hinzufügen
{ path: 'my-feature', component: MyFeatureComponent }
```

## Build für Produktion

```bash
ng build --configuration production
```

Build-Artefakte werden im `dist/` Verzeichnis gespeichert und sind optimiert für Deployment.## Projektstruktur

```
src📸 Screenshots

_Fügen Sie hier Screenshots Ihrer Anwendung ein:_
- Task Board Ansicht
- Task Detail Dialog
- Kontakte Übersicht
- Email Issue-Kollektor Flow

## 🤝 Contributing

Beiträge sind willkommen! So können Sie helfen:

1. Forken Sie das Projekt
2. Erstellen Sie einen Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Committen Sie Ihre Änderungen (`git commit -m 'Add some AmazingFeature'`)
4. Pushen Sie zum Branch (`git push origin feature/AmazingFeature`)
5. Öffnen Sie einen Pull Request

## 📝 Lizenz

Dieses Projekt ist für Bildungszwecke und persönliche Nutzung erstellt.

## 🔗 Weitere Ressourcen

- [Angular CLI Dokumentation](https://angular.dev/tools/cli)
- [Angular Firebase Integration](https://github.com/angular/angularfire)
- [Firebase Dokumentation](https://firebase.google.com/docs)

---

**Entwickelt mit ❤️ und Angular**

Haben Sie Fragen? [Erstellen Sie ein Issue](https://github.com/IHR-USERNAME/angular-based-join/issue
│   └── public/         # Öffentliche Bereiche (inkl. Issue-Kollektor)
├── services/           # Business Logic & API Calls
├── models/             # TypeScript Interfaces
├── guards/             # Route Guards
└── layout/             # Layout-Komponenten (Header, Sidebar)
```

## Weitere Ressourcen

- [Angular CLI Dokumentation](https://angular.dev/tools/cli)
- [Angular Firebase Integration](https://github.com/angular/angularfire)
- [Firebase Dokumentation](https://firebase.google.com/docs)
