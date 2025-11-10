# N8N Integration Setup Guide

## 🎯 Ziel
E-Mails automatisch per KI analysieren und als Tickets in der "Triage"-Spalte anlegen.

---

## 📋 Voraussetzungen

### 1. Gmail Account
- [ ] Gmail-Konto vorhanden
- [ ] Labels erstellt:
  - `Erledigt` (für erfolgreich verarbeitete Mails)
  - `Zu bearbeiten` (für fehlgeschlagene Verarbeitungen)

### 2. Google Cloud Console
- [ ] Projekt erstellt: "Join-Automation"
- [ ] Gmail API aktiviert
- [ ] OAuth 2.0 Credentials erstellt für n8n

### 3. Firebase Service Account
- [ ] Firebase Console → Project Settings → Service Accounts
- [ ] "Generate new private key" geklickt
- [ ] JSON-Datei heruntergeladen: `firebase-service-account.json`
- [ ] Datei NICHT in Git commiten (bereits in .gitignore)

### 4. OpenAI API Key
- [ ] OpenAI Account erstellt
- [ ] API Key generiert
- [ ] Key sicher notiert

---

## 🔐 Firestore Security Rules

Die Rules wurden bereits vorbereitet in `firestore.rules`.

**Wichtig:** Rules in Firebase Console deployen:

```bash
# Option 1: Über Firebase Console UI
# 1. Firebase Console öffnen
# 2. Firestore Database → Rules
# 3. Inhalt aus firestore.rules kopieren
# 4. "Publish" klicken

# Option 2: Über Firebase CLI (falls installiert)
firebase deploy --only firestore:rules
```

**Was die Rules erlauben:**
- ✅ Authentifizierte User können Tasks lesen/schreiben
- ✅ Service Account kann Tasks mit `createdBy: "ai-agent"` erstellen
- ✅ AI-generierte Tasks müssen `status: "triage"` und `aiGenerated: true` haben

---

## ⚙️ N8N Credentials Setup

### 1. Gmail OAuth2 Credential
```
Name: Gmail - Join Feature Requests
Type: Gmail OAuth2
Client ID: [Aus Google Cloud Console]
Client Secret: [Aus Google Cloud Console]
```
Nach Speichern: OAuth-Flow durchlaufen → Zugriff erlauben

### 2. Google Firestore Credential
```
Name: Firestore - Join Database
Type: Google Cloud Firestore
Service Account Email: [Aus firebase-service-account.json → client_email]
Private Key: [Aus firebase-service-account.json → private_key]
```

### 3. OpenAI Credential
```
Name: OpenAI - Task Analysis
Type: OpenAI
API Key: [Dein OpenAI API Key]
```

---

## 🔄 N8N Workflow Structure

```
┌─────────────────────┐
│  Gmail Trigger      │ ← Neue E-Mail empfangen
└──────────┬──────────┘
           │
┌──────────▼──────────┐
│ Extract Email Data  │ ← Absender, Betreff, Body extrahieren
└──────────┬──────────┘
           │
┌──────────▼──────────┐
│  AI Agent (OpenAI)  │ ← E-Mail analysieren & strukturieren
└──────────┬──────────┘
           │
┌──────────▼──────────┐
│ Transform to Task   │ ← JSON für Firestore vorbereiten
└──────────┬──────────┘
           │
┌──────────▼──────────┐
│ Create in Firestore │ ← Ticket in "triage" anlegen
└──────────┬──────────┘
           │
     ┌─────┴─────┐
     │           │
┌────▼────┐ ┌───▼────┐
│ SUCCESS │ │ ERROR  │
│ Move to │ │ Move to│
│Erledigt │ │Zu bear.│
└─────────┘ └────────┘
```

---

## 🤖 AI Prompt Template

**In n8n OpenAI Node verwenden:**

```
Du bist ein intelligenter Ticket-Assistent. Analysiere folgende E-Mail und extrahiere strukturierte Informationen:

E-Mail:
Von: {{$json.from}}
Betreff: {{$json.subject}}
Text: {{$json.text}}

Erstelle ein JSON-Objekt mit:
{
  "category": "Technical Task" | "User Story" | "Bug Request",
  "title": "Prägnanter Titel (max 80 Zeichen)",
  "priority": "low" | "medium" | "high",
  "description": "Aufbereiteter Text mit allen relevanten Details",
  "dueDate": "YYYY-MM-DD" oder null,
  "extractedFrom": "{{$json.from}}"
}

Regeln:
- Priorität "high" bei: dringend, asap, kritisch, bug, sofort, urgent
- Priorität "medium" bei: sollte, wichtig, feature, bald
- Priorität "low" bei: nice-to-have, optional, später, irgendwann
- Kategorie "Bug Request" bei: fehler, bug, problem, crash, funktioniert nicht
- Kategorie "Technical Task" bei: technik, refactoring, migration, deployment
- Kategorie "User Story" bei: feature, funktion, möchte, wünsche, könnte
- Deadline nur aus expliziten Datumsangaben extrahieren
```

---

## 📊 Firestore Document Structure

**Das Task-Dokument, das in Firestore erstellt wird:**

```javascript
{
  id: "auto-generated",
  title: "{{ AI Output: title }}",
  description: "🤖 KI-generiert aus E-Mail von {{ sender }}\n\n{{ AI Output: description }}",
  category: "{{ AI Output: category }}",
  assignedTo: [],
  dueDate: Timestamp.fromDate(new Date("{{ AI Output: dueDate }}")),
  priority: "{{ AI Output: priority }}",
  status: "triage",
  subtasks: [],
  createdAt: Timestamp.now(),
  updatedAt: Timestamp.now(),
  createdBy: "ai-agent",
  sourceEmail: "{{ sender }}",
  aiGenerated: true
}
```

---

## 🧪 Testing Checklist

### Test 1: Feature Request
**Test-E-Mail senden:**
```
Betreff: Neue Dashboard-Ansicht
Text: Hallo Team, wir würden gerne eine neue Dashboard-Ansicht 
mit Statistiken haben. Das wäre super hilfreich für unsere Meetings.
```

**Erwartung:**
- ✅ Ticket erstellt mit Status "triage"
- ✅ Kategorie: "User Story"
- ✅ Priorität: "medium"
- ✅ E-Mail in "Erledigt"

### Test 2: Bug Report
**Test-E-Mail senden:**
```
Betreff: DRINGEND: Login funktioniert nicht
Text: Der Login-Button reagiert nicht mehr! Das ist kritisch, 
niemand kann sich einloggen. Bitte asap fixen!
```

**Erwartung:**
- ✅ Ticket erstellt mit Status "triage"
- ✅ Kategorie: "Bug Request"
- ✅ Priorität: "high"
- ✅ E-Mail in "Erledigt"

### Test 3: Task mit Deadline
**Test-E-Mail senden:**
```
Betreff: Deployment bis Ende des Monats
Text: Wir müssen das neue Feature bis zum 30.11.2025 deployen. 
Bitte entsprechend planen.
```

**Erwartung:**
- ✅ Ticket erstellt mit Status "triage"
- ✅ DueDate: 2025-11-30
- ✅ E-Mail in "Erledigt"

### Test 4: Error Handling
**Test-E-Mail senden:**
```
Betreff: (leer)
Text: (leer)
```

**Erwartung:**
- ✅ Workflow schlägt fehl
- ✅ E-Mail in "Zu bearbeiten"

---

## 📝 Nächste Schritte

1. ✅ Firestore Rules deployen
2. ⏳ Gmail Labels erstellen
3. ⏳ Google Cloud Console Setup
4. ⏳ Firebase Service Account erstellen
5. ⏳ OpenAI API Key generieren
6. ⏳ N8N Credentials konfigurieren
7. ⏳ Workflow mit Error Handling optimieren
8. ⏳ Testing durchführen

---

## 🆘 Troubleshooting

### Problem: "Permission denied" in Firestore
**Lösung:** Prüfe ob Rules korrekt deployed sind und Service Account verwendet wird

### Problem: Gmail API Quota exceeded
**Lösung:** In Google Cloud Console Quota erhöhen oder Rate Limiting in n8n einstellen

### Problem: AI generiert falsche Kategorie
**Lösung:** Prompt Template optimieren mit mehr Beispielen

---

## 📚 Weitere Ressourcen

- [Firebase Security Rules Dokumentation](https://firebase.google.com/docs/firestore/security/get-started)
- [N8N Workflow Dokumentation](https://docs.n8n.io/)
- [OpenAI API Best Practices](https://platform.openai.com/docs/guides/prompt-engineering)
