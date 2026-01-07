# N8N Workflows

Dieses Verzeichnis enthält die N8N Workflow-Definitionen für die automatische Verarbeitung von eingehenden E-Mails.

## Workflows

### Email to Kanban Task Converter
**Datei**: `email-to-task-converter.json`

Dieser Workflow wandelt eingehende E-Mails automatisch in Tasks um und fügt sie in die Firebase-Datenbank ein.

**Funktionsweise:**
1. Überwacht eingehende E-Mails an `requests@stefan-helldobler.de`
2. Extrahiert Informationen aus der E-Mail (Betreff, Text, Absender)
3. Erstellt automatisch ein Task-Objekt mit:
   - Titel aus Betreff
   - Beschreibung aus E-Mail-Text
   - Priorität und Deadline (AI-generiert)
   - Markierung als `source: 'email'` und `creatorType: 'external'`
4. Speichert den Task in Firebase Firestore

**Daily Limit**: 10 automatische Konvertierungen pro Tag

## Workflow importieren

1. Öffnen Sie N8N
2. Klicken Sie auf "Workflows" → "Import from File"
3. Wählen Sie die entsprechende JSON-Datei aus
4. Passen Sie die Credentials an:
   - E-Mail-Provider (Gmail, IMAP, etc.)
   - Firebase Service Account
5. Aktivieren Sie den Workflow

## Konfiguration anpassen

### E-Mail-Empfänger ändern
Im ersten Node (Email Trigger) die Empfänger-E-Mail anpassen.

### Firebase-Verbindung
1. Erstellen Sie einen Firebase Service Account
2. Laden Sie die JSON-Credentials herunter
3. Fügen Sie die Credentials in N8N hinzu (Settings → Credentials)
4. Verknüpfen Sie die Credentials mit dem Firebase-Node

### Daily Limit anpassen
Im Workflow-Node "Check Daily Limit" die Zahl `10` anpassen.

## Voraussetzungen

- N8N Installation (Self-hosted oder Cloud)
- Firebase Projekt mit Firestore
- E-Mail-Provider mit API-Zugang (Gmail, IMAP, etc.)
- Webhook oder E-Mail-Trigger eingerichtet

## Hinweise

- Die JSON-Dateien enthalten KEINE sensiblen Credentials
- Credentials müssen nach dem Import manuell in N8N konfiguriert werden
- Testen Sie den Workflow zunächst mit Test-E-Mails
