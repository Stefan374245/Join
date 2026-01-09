# N8N Workflow - Feature Request Collector

## 🚀 Was wurde implementiert

Ein **Railway-gehosteter n8n Workflow**, der Feature Requests auf **zwei Wegen** empfängt:
1. **Webhook** (von Angular App)
2. **IMAP Email** (direkt per E-Mail an requests@stefan-helldobler.de)

Der Workflow analysiert Requests mit **Google Gemini AI**, speichert sie in **Firebase Firestore** und versendet Bestätigungs-E-Mails via **Resend REST API**.

**Railway App**: https://n8n-production-04d3.up.railway.app  
**Webhook**: https://n8n-production-04d3.up.railway.app/webhook/feature-request  
**E-Mail**: requests@stefan-helldobler.de

## ✅ Features

- ✅ **Dual Input**: Webhook (Angular App) + IMAP (E-Mail)
- ✅ **AI-Analyse**: Google Gemini generiert Subtasks, Priorität, Deadline
- ✅ **Firebase Integration**: Automatisches Speichern in Firestore
- ✅ **Resend E-Mail**: Bestätigungen von requests@stefan-helldobler.de
- ✅ **Daily Limit**: 10 Requests/Tag mit Firebase Counter
- ✅ **Railway Hosting**: 24/7 verfügbar, HTTPS, automatische Deployments


## 🧪 Workflow testen

### Option 1: Direkter Webhook-Test
```powershell
$body = @{
    type = "feature"
    title = "Test Feature Request vom Tutor"
    description = "Dies ist ein Test des n8n Workflows"
    userEmail = "tutor@example.com"
    userName = "Tutor"
} | ConvertTo-Json

Invoke-RestMethod -Uri "https://n8n-production-04d3.up.railway.app/webhook/feature-request" -Method POST -Body $body -ContentType "application/json"
```

**Was passiert:**
1. ✅ Railway n8n empfängt POST Request
2. ✅ AI analysiert und generiert Subtasks
3. ✅ Task wird in Firebase gespeichert
4. ✅ Bestätigungs-E-Mail via Resend API gesendet
5. ✅ Daily Limit Counter +1

### Option 2: Per E-Mail (IMAP Trigger)
Sende eine E-Mail an: **requests@stefan-helldobler.de**

Betreff: `[Feature] Deine Anfrage`  
Text: `Beschreibung der Feature Request`

**Was passiert:**
1. ✅ IMAP Trigger in n8n erkennt neue E-Mail
2. ✅ Workflow extrahiert Betreff + Text
3. ✅ Gleicher Ablauf wie Webhook (AI → Firebase → E-Mail)

### Option 3: Über Angular App
1. Öffne die Hostinger-gehostete App (https://stefan-helldobler.de/join-issuecollector/)
2. Navigiere zu "Help" → Feature Request Formular
3. Fülle Formular aus und sende ab
4. Frontend sendet POST an Railway Webhook

## 📊 Ergebnisse überprüfen

### E-Mail Postfach
- Check Postfach von `tutor@example.com`
- Bestätigungs-E-Mail von `requests@stefan-helldobler.de`


## 📧 E-Mail Integration (Resend + IMAP)

### Resend API (Ausgehende E-Mails)
- **Provider**: Resend (https://resend.com)
- **Domain**: stefan-helldobler.de (verifiziert mit DKIM/SPF)
- **Absender**: requests@stefan-helldobler.de
- **Methode**: REST API via HTTP Request Nodes
- **Warum kein SMTP?**: Railway blockiert Ports 465/587 → Umstieg auf REST API

### IMAP (Eingehende E-Mails)
- **E-Mail**: requests@stefan-helldobler.de
- **Trigger**: IMAP Email Read Node in n8n
- **Funktion**: Empfängt Feature Requests direkt per E-Mail
- **Parsing**: Extrahiert Betreff, Text und Absender automatisch

## ☁️ Railway Hosting

**URL**: https://n8n-production-04d3.up.railway.app

- ✅ 24/7 Uptime
- ✅ Automatische HTTPS
- ✅ Environment Variables für Credentials
- ✅ Git-basierte Deployments
- ✅ Logs und Monitoring im Dashboard
- ⚠️ Ports 465/587 blockiert → Resend REST API statt SMTP

## 🔒 Firebase Security Rules

Die Rules erlauben:
- Authenticated Users: voller Zugriff auf tasks/users
- Public Write: n8n kann Tasks mit `aiGenerated: true` erstellen
- Public Read/Write: `daily_limits` Collection für Counter

## ⚙️ Technischer Stack

- **n8n**: Workflow Engine (Railway)
- **Firebase**: Firestore Database (Backend only)
- **Resend**: Transactional Email API
- **Angular**: Frontend App (Hostinger via FileZilla FTP)
- **Railway**: Cloud Hosting für n8n
- **Hostinger**: Web Hosting für Angular App
