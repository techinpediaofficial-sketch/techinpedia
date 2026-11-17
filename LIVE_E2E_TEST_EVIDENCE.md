# TECHINPEDIA — LIVE E2E INTEGRATION TEST EVIDENCE
## Meta WhatsApp Business Platform & Google Sheets CRM Integration

**Document Date**: September 18, 2026  
**Environment**: Production (`https://techinpedia.com` / VPS `<SERVER_IP>`)  
**Application Processes**:
- `techinpedia` (PM2 PID `3118094`, Web Next.js 16.3.4, online)
- `techinpedia-worker` (PM2 PID `3118554`, Worker Daemon, online)  
**Production Database**: MySQL (`<SERVER_USER>_techinpedianew`)  
**Current Phase**: Phase 1 (Meta WhatsApp Connection) & Phase 8 (Google Sheets Connection)  
**Overall Status**: `AWAITING LIVE PROVIDER CREDENTIALS`  

---

## 1. Provider Connection Readiness Audit

Direct inspection of production database on `<SERVER_IP>` at `2026-09-18T14:58:22Z`:
```sql
SELECT id, wabaId, phoneNumberId, businessPhoneNumber, displayName, status FROM WhatsappConnection;
-- Result: 0 rows

SELECT id, clientEmail, authType, status FROM GoogleConnection;
-- Result: 0 rows
```

Server environment check on `<SERVER_IP>`:
```bash
grep -iE "meta|whatsapp|token|waba|google" /home/<SERVER_USER>/public_html/techinpedia.com/.env
# Result: WHATSAPP_NUMBER="919876543210" (Placeholder only)
```

**Verdict**: The production database and environment contain 0 live provider credentials. In strict accordance with the acceptance protocol (*"Do not fake, mock or simulate any test in this phase; stop at the exact blocked step"*), the live integration tests are paused pending administrator input.

---

## 2. Phase-by-Phase E2E Acceptance Matrix

| Phase | Description | Target Provider | Status | Blocked By / Evidence |
|---|---|---|---|---|
| **Phase 1** | Meta WhatsApp Connection & Validation | Meta Graph API v21.0 | `BLOCKED` | Awaiting WABA ID, Phone Number ID, App Secret, and System User Access Token. |
| **Phase 2** | Real Meta Webhook Handshake & HMAC | Meta Webhooks | `BLOCKED` | Awaiting Phase 1 connection & Meta Developer Console callback setup. |
| **Phase 3** | Real Inbound WhatsApp ("Live Test") | Real Device ➔ Meta ➔ CRM | `BLOCKED` | Awaiting Phase 2 webhook activation. |
| **Phase 4** | Real Outbound Reply from Team Inbox | TechInPedia ➔ Meta ➔ Device | `BLOCKED` | Awaiting Phase 1 & Phase 3. |
| **Phase 5** | Meta Template Sync & Approved Dispatch | Meta WABA Templates | `BLOCKED` | Awaiting Phase 1 connection & approved template in Meta Manager. |
| **Phase 6** | Media Inbound / Outbound (Image/Doc) | Meta Graph Media API | `BLOCKED` | Awaiting Phase 1 connection. |
| **Phase 7** | Live Workflow (Delay & Follow-up) | TechInPedia Workflow Engine | `READY TO TEST` | Code, durable queue, and PM2 restart recovery verified. |
| **Phase 8** | Google Service Account Authentication | Google Sheets API v4 | `BLOCKED` | Awaiting Google Cloud Service Account JSON credentials. |
| **Phase 9** | Spreadsheet & Worksheet Discovery | Google Drive / Sheets API | `BLOCKED` | Awaiting Phase 8 authentication & test spreadsheet access. |
| **Phase 10**| Automated Sheet ➔ CRM Lead Sync | Worker Scheduler ➔ CRM | `BLOCKED` | Awaiting Phase 8 & Phase 9. |
| **Phase 11**| Cross-Integration E2E Flow | Sheet ➔ Lead ➔ WhatsApp ➔ Reply | `BLOCKED` | Awaiting Phase 1 & Phase 8. |
| **Phase 12**| Small Real Campaign (Now & Sched) | WhatsApp Campaign Queue | `BLOCKED` | Awaiting Phase 1 & Phase 5 approved template. |
| **Phase 13**| Failure & Edge Case Testing | Invalid Num, Opt-out, Backoff | `READY TO TEST` | Internal logic verified; provider responses awaiting Phase 1. |
| **Phase 14**| Final Acceptance & Status Signoff | End-to-End Both Chains | `BLOCKED` | Awaiting completion of Phases 1 – 13. |

---

## 3. Required Administrator Action Items

To proceed with live validation without exposing credentials:

### For Meta WhatsApp Business Platform (Phase 1):
The administrator can either enter these securely at `https://techinpedia.com/admin/whatsapp` (Click **Connect** or **Reconfigure**) or supply them in the chat:
1. **WhatsApp Business Account ID (WABA ID)**: e.g. `123456789012345`
2. **Phone Number ID**: e.g. `109876543210987`
3. **Meta App ID**: e.g. `987654321098765`
4. **Meta App Secret**: (Used for cryptographic HMAC-SHA256 signature verification)
5. **System User Permanent Access Token**: (Token beginning with `EAAB...` with permissions `whatsapp_business_messaging` and `whatsapp_business_management`)
6. **Webhook Verify Token**: Custom string (default: `techinpedia_verify_token_2026`)
7. **Authorized Test Phone Number**: Real WhatsApp number on your mobile device for sending/receiving the test messages in Phase 3 and 4.

### For Google Sheets CRM Integration (Phase 8):
The administrator can enter these securely at `https://techinpedia.com/admin/integrations/google-sheets` or supply them:
1. **Service Account Email**: e.g. `techinpedia-crm@project-id.iam.gserviceaccount.com`
2. **Private Key**: (The complete `-----BEGIN RSA PRIVATE KEY-----...` block from Google Cloud Console Service Account JSON key)
3. **Test Google Spreadsheet ID**: (The long ID from your spreadsheet URL: `https://docs.google.com/spreadsheets/d/{SPREADSHEET_ID}/edit`)
   - *Requirement*: Share this spreadsheet with the Service Account email as **Editor**.
