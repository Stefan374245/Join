# Migration: Gmail → Webhook (Direkter n8n-Call)

## 🎯 Ziel
Angular Feature-Request-Formular sendet **direkt an n8n Webhook**, ohne E-Mail-Umweg.

---

## ✅ Was wir heute erreicht haben

1. ✅ n8n Workflow mit Gmail Trigger funktioniert
2. ✅ AI analysiert E-Mails und erstellt Tasks in Firestore
3. ✅ 10 E-Mails/Tag Limit in n8n implementiert
4. ✅ Angular Feature-Request Seite mit Gmail-Link erstellt
5. ✅ Tasks erscheinen im Board in "Triage" Spalte

---

## 🚀 Nächste Session: Webhook-Migration

### Schritt 1: n8n Webhook Trigger einrichten (10 Min)

**In n8n:**
1. Öffne Workflow "Email to Kanban Task Converter"
2. **Lösche** den "Gmail Trigger" Node (oder deaktiviere ihn)
3. **Erstelle neuen Node:** "Webhook"
4. **Konfiguration:**
   - HTTP Method: `POST`
   - Path: `feature-request` (oder individuell)
   - Authentication: `None` (oder Header Auth für Sicherheit)
   - Response Mode: `When Last Node Finishes`
5. **Kopiere die Webhook URL** (z.B. `https://shell-workflows.app.n8n.cloud/webhook/feature-request`)
6. **Teste mit Postman/Insomnia:**
   ```json
   {
     "name": "Test User",
     "email": "test@example.com",
     "subject": "Test Feature Request",
     "message": "Bitte Feature XYZ implementieren"
   }
   ```

### Schritt 2: n8n - Webhook-Daten für AI vorbereiten (5 Min)

**Nach dem Webhook-Node, VOR "Check Email Limit":**
1. **Erstelle "Code" Node:** "Transform Webhook to Email Format"
2. **Code:**
   ```javascript
   const webhookData = $input.first().json;
   
   // Webhook-Format in Gmail-ähnliches Format umwandeln
   return [{
     json: {
       from: webhookData.email || "unknown@example.com",
       subject: webhookData.subject || "Feature Request",
       text: `Name: ${webhookData.name}\nEmail: ${webhookData.email}\n\nMessage:\n${webhookData.message}`,
       // Für Check Email Limit
       emailProcessedToday: 0,
       dailyLimit: 10
     }
   }];
   ```

### Schritt 3: Angular - HTTP Service erstellen (10 Min)

**Erstelle `src/app/services/feature-request.service.ts`:**

```typescript
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface FeatureRequestData {
  name: string;
  email: string;
  subject: string;
  message: string;
}

@Injectable({
  providedIn: 'root'
})
export class FeatureRequestService {
  private n8nWebhookUrl = 'https://shell-workflows.app.n8n.cloud/webhook/feature-request';

  constructor(private http: HttpClient) {}

  sendRequest(data: FeatureRequestData): Observable<any> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });

    return this.http.post(this.n8nWebhookUrl, data, { headers });
  }
}
```

**In `app.config.ts` hinzufügen:**
```typescript
import { provideHttpClient } from '@angular/common/http';

export const appConfig: ApplicationConfig = {
  providers: [
    // ... existing providers
    provideHttpClient()
  ]
};
```

### Schritt 4: Angular - Feature Request Component anpassen (15 Min)

**Erweitere `feature-request.component.html`:**

```html
<article class="content">
  <h1>Send us your request</h1>

  <form [formGroup]="requestForm" (ngSubmit)="submitRequest()">
    <section class="form-section">
      <div class="form-group">
        <label for="name">Your Name *</label>
        <input type="text" id="name" formControlName="name" required>
      </div>

      <div class="form-group">
        <label for="email">Your Email *</label>
        <input type="email" id="email" formControlName="email" required>
      </div>

      <div class="form-group">
        <label for="subject">Subject *</label>
        <input type="text" id="subject" formControlName="subject" 
               placeholder="e.g., New Feature: Dark Mode" required>
      </div>

      <div class="form-group">
        <label for="message">Description *</label>
        <textarea id="message" formControlName="message" rows="8" 
                  placeholder="Please describe your request in detail..." required></textarea>
      </div>
    </section>

    <section class="action-section">
      <button type="submit" class="btn-primary" 
              [disabled]="requestForm.invalid || isSubmitting || requestsUsed >= maxRequests">
        {{ isSubmitting ? 'Sending...' : 'Submit Request' }}
      </button>
      
      @if (requestsUsed >= maxRequests) {
        <p class="limit-message">Daily request limit reached. Please try again tomorrow.</p>
      }
      
      @if (submitSuccess) {
        <p class="success-message">✅ Request submitted successfully!</p>
      }
      
      @if (submitError) {
        <p class="error-message">❌ Error: {{ submitError }}</p>
      }
    </section>
  </form>
</article>
```

**Erweitere `feature-request.component.ts`:**

```typescript
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { FooterAuthComponent } from '../../shared/components/footer-auth/footer-auth.component';
import { FeatureRequestService } from '../../services/feature-request.service';

@Component({
  selector: 'app-feature-request',
  imports: [CommonModule, ReactiveFormsModule, RouterLink, FooterAuthComponent],
  templateUrl: './feature-request.component.html',
  styleUrl: './feature-request.component.scss'
})
export class FeatureRequestComponent implements OnInit {
  requestForm!: FormGroup;
  requestsUsed = 0; // TODO: Fetch from Firestore
  maxRequests = 10;
  isSubmitting = false;
  submitSuccess = false;
  submitError: string | null = null;

  constructor(
    private fb: FormBuilder,
    private featureRequestService: FeatureRequestService
  ) {}

  ngOnInit() {
    this.requestForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      subject: ['', Validators.required],
      message: ['', [Validators.required, Validators.minLength(10)]]
    });
  }

  submitRequest() {
    if (this.requestForm.invalid || this.requestsUsed >= this.maxRequests) {
      return;
    }

    this.isSubmitting = true;
    this.submitSuccess = false;
    this.submitError = null;

    this.featureRequestService.sendRequest(this.requestForm.value).subscribe({
      next: (response) => {
        console.log('Request submitted successfully', response);
        this.submitSuccess = true;
        this.requestForm.reset();
        this.requestsUsed++; // Increment counter
        this.isSubmitting = false;
      },
      error: (error) => {
        console.error('Error submitting request', error);
        this.submitError = 'Failed to submit request. Please try again.';
        this.isSubmitting = false;
      }
    });
  }
}
```

### Schritt 5: Request-Counter in Firestore speichern (10 Min)

**Firestore Collection erstellen:**
```
/request-counter/
  - daily-counter-2025-11-10: { count: 5, date: "2025-11-10" }
```

**n8n Code Node erweitern (Check Email Limit):**
```javascript
const staticData = $getWorkflowStaticData('global');
const today = new Date().toISOString().split('T')[0];

// Counter aus Firestore holen (statt staticData)
// TODO: Firestore REST API Call hier einfügen

const DAILY_LIMIT = 10;
if (staticData.emailCounter[today] >= DAILY_LIMIT) {
  throw new Error(`Daily limit of ${DAILY_LIMIT} requests reached.`);
}

staticData.emailCounter[today]++;

return [{
  json: {
    ...($input.first().json),
    emailProcessedToday: staticData.emailCounter[today],
    dailyLimit: DAILY_LIMIT
  }
}];
```

**Angular Service für Counter:**
```typescript
// In feature-request.component.ts
ngOnInit() {
  // ... existing form init
  
  // Fetch current counter from Firestore
  this.loadRequestCounter();
}

loadRequestCounter() {
  const today = new Date().toISOString().split('T')[0];
  const counterDoc = doc(this.firestore, 'request-counter', `daily-counter-${today}`);
  
  getDoc(counterDoc).then(snapshot => {
    if (snapshot.exists()) {
      this.requestsUsed = snapshot.data()['count'] || 0;
    }
  });
}
```

### Schritt 6: Workflow testen (5 Min)

1. **In Angular:** Fülle Feature-Request-Formular aus
2. **Submit** → Sollte sofort n8n triggern
3. **n8n Executions:** Prüfe ob Workflow läuft
4. **Firestore:** Prüfe ob Task erstellt wurde
5. **Angular Board:** Task sollte in "Triage" erscheinen

---

## 🔄 Vorteile Webhook vs. Gmail

| Feature | Gmail Trigger | Webhook |
|---------|---------------|---------|
| **Geschwindigkeit** | 5 Min Polling | Sofort (< 1s) |
| **E-Mail nötig** | Ja | Nein |
| **Posteingang** | Wird voll | Bleibt sauber |
| **Formular-Daten** | Nein | Ja (strukturiert) |
| **Kosten** | Gmail API Limits | n8n Execution Limits |
| **Portfolio-Qualität** | Gut | Besser |

---

## 🛡️ Sicherheit (Optional)

**Webhook absichern mit Header Auth:**

1. **n8n Webhook:**
   - Authentication: `Header Auth`
   - Header Name: `X-API-Key`
   - Header Value: `dein-geheimer-key-12345`

2. **Angular Service:**
   ```typescript
   const headers = new HttpHeaders({
     'Content-Type': 'application/json',
     'X-API-Key': 'dein-geheimer-key-12345'
   });
   ```

---

## 📝 Notizen

- Gmail Trigger als **Backup** behalten für externe Stakeholder
- IMAP später hinzufügen für Outlook/GMX Support
- Workflow exportieren nach erfolgreichem Test
- Dokumentation für lokalen n8n Import erstellen

---

**Geschätzter Zeitaufwand:** 1-1.5 Stunden
**Schwierigkeitsgrad:** Mittel
**Ergebnis:** Professionelle, direkte Integration ohne E-Mail-Umweg 🚀
