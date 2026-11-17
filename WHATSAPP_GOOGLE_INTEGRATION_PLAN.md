# TECHINPEDIA — PRODUCTION WHATSAPP BUSINESS PLATFORM + GOOGLE SHEETS CRM INTEGRATION PLAN

**Document Version:** 1.0.0  
**Target Platform:** TechInPedia Business OS  
**Integration Scope:** Meta Official WhatsApp Business Platform (Cloud API v21.0) & Official Google Sheets API v4 with Real CRM Lead Engine

---

## 1. Executive Summary & Audit

### 1.1 Existing Architecture
- **Framework & Runtime:** Next.js 16 (App Router), Node.js, TypeScript, Tailwind CSS, MySQL with Prisma ORM 6.4.1.
- **Process Management & Hosting:** Ubuntu VPS (`<SERVER_IP>`), Apache Reverse Proxy, PM2 managing process `techinpedia`.
- **CRM Engine:** Complete schema and services for `Enquiry` (Leads), `Contact`, `Company`, `Customer`, `Pipeline`, `PipelineStage`, `Deal`, `FollowUp`, `LeadTimelineEvent`.
- **Workflow Engine:** Visual Workflow Builder (`/admin/workflows/builder`), Graph Execution Engine (`queueEngine.ts`), 43 registered actions across 12 modules (`actionRunner.ts`), Database-backed job queue (`WorkflowJob`).
- **Communication Desk:** Website live chat (`ChatSession`, `ChatMessage`), basic WhatsApp status page (`/admin/whatsapp`) reading environment variables, basic WhatsApp webhook (`/api/whatsapp/webhook`).

### 1.2 Existing Functionality
1. Basic text dispatch via `sendWhatsAppTextMessage` using raw `fetch` to `https://graph.facebook.com/v21.0/${phoneNumberId}/messages`.
2. Static HMAC verification helper `verifyMetaSignature` using Node `crypto.timingSafeEqual`.
3. Minimal webhook route (`/api/whatsapp/webhook`) that logs incoming text to console and creates an `Enquiry` (Lead) without duplicate checking or media handling.
4. Basic Google Sheets lead import function (`processSheetRowsIntoLeads` in `src/lib/google_sheets.ts`) requiring environment variables.

### 1.3 Missing Functionality (To Be Implemented)
1. **DB-Backed WhatsApp Connection Manager:** Currently requires manual `.env` updates. Must be upgraded to secure, encrypted at rest, multi-field configuration in DB with Connect/Test/Refresh/Disconnect capabilities, quality ratings, and messaging limits.
2. **Production Webhook Engine:** Missing event types (images, documents, audio, video, locations, interactive button replies, list replies, message delivery updates, read receipts, failure statuses). Missing idempotency checks against duplicate Meta deliveries and audit logging with retry capabilities.
3. **WhatsApp Unified Team Inbox:** Missing 3-pane team inbox (Conversation list, Active chat thread with all media types & delivery statuses, CRM 360 sidebar, assignment/reassignment, internal notes, tags, unread counts).
4. **CRM 360 WhatsApp Section:** No embedded WhatsApp history or quick action inside Lead/Contact/Customer view.
5. **Template Management (`/admin/whatsapp/templates`):** No synchronization with Meta WABA message templates, dynamic parameter extraction, preview, or variable mapping to CRM fields.
6. **Campaign Manager (`/admin/whatsapp/campaigns`):** No 7-step wizard, no audience segmentation from CRM/Sheets, no background queue dispatching, and no scheduled execution.
7. **Consent, Suppression & Opt-Out (`/admin/whatsapp/suppression`):** No mechanism to honor user opt-outs ("STOP"), manage suppressions, or automatically exclude opted-out contacts from campaign audiences.
8. **Campaign Analytics:** Missing operational analytics (Attempted, Sent, Delivered, Read, Failed, Replied, Conversion attribution, error codes).
9. **Official Google Sheets Integration (`/admin/integrations/google-sheets`):** Missing OAuth / Service Account credential storage in DB, visual sheet/tab picker, and interactive column mapping UI without code/JSON.
10. **Bidirectional Sheet Sync & Deduplication:** Missing sync state, row-level tracking, deduplication by E.164 phone or email, and sync-loop prevention (origin hashes).
11. **Phone Number Normalization (`src/lib/phone.ts`):** Missing canonical E.164 normalization, international number preservation, and fuzzy matching to prevent duplicate contacts from different formats (`+91`, `91`, `0`, etc.).
12. **RBAC & Security:** Missing granular WhatsApp and Google Sheets permissions (`whatsapp.view`, `whatsapp.configure`, `whatsapp.send`, `whatsapp.templates.manage`, `whatsapp.campaigns.*`, `google_sheets.*`), encrypted credential storage at rest, and secret masking in UI.

---

## 2. Database Changes (Prisma Schema Extensions)

```prisma
// 1. WhatsApp Connection & Configuration
model WhatsAppConnection {
  id                   String    @id @default(uuid())
  wabaId               String?   // WhatsApp Business Account ID
  phoneNumberId       String
  businessPhoneNumber String?
  displayName          String?
  appId                String?
  appSecretEncrypted   String?   @db.Text
  accessTokenEncrypted String    @db.Text
  verifyToken          String
  apiVersion           String    @default("v21.0")
  status               String    @default("DISCONNECTED") // CONNECTED, DISCONNECTED, ERROR
  qualityRating        String?   // GREEN, YELLOW, RED, UNKNOWN
  messagingLimit       String?   // 1K, 10K, 100K, UNLIMITED
  connectionHealth     String?   // HEALTHY, DEGRADED, FAILED
  lastSuccessfulApiCall DateTime?
  lastWebhookReceivedAt DateTime?
  lastError            String?   @db.Text
  isActive             Boolean   @default(true)
  createdAt            DateTime  @default(now())
  updatedAt            DateTime  @updatedAt
}

// 2. Webhook Event Audit & Idempotency Store
model WhatsAppWebhookEvent {
  id                    String    @id @default(uuid())
  metaEventId           String?   @unique // Meta message id or status id for strict deduplication
  eventType             String    // messages, message_status, account_update, template_update
  fromPhone             String?
  toPhone               String?
  messageType           String?   // text, image, document, audio, video, location, interactive
  payload               String    @db.LongText // masked raw JSON
  status                String    @default("PENDING") // PENDING, PROCESSED, FAILED, IGNORED
  error                 String?   @db.Text
  retryCount            Int       @default(0)
  relatedContactId      String?
  relatedLeadId         String?
  relatedConversationId String?
  processedAt           DateTime?
  createdAt             DateTime  @default(now())

  @@index([metaEventId])
  @@index([eventType])
  @@index([fromPhone])
  @@index([status])
}

// 3. WhatsApp Conversation (Unified Shared Team Inbox)
model WhatsAppConversation {
  id                     String    @id @default(uuid())
  waNumber               String    // E.164 canonical normalized phone
  customerName           String?
  contactId              String?   // Relation to Contact
  leadId                 String?   // Relation to Enquiry (Lead)
  customerId             String?   // Relation to Customer
  assignedUserId         String?   // Relation to User
  assignedTeam           String?   @default("Sales")
  status                 String    @default("OPEN") // OPEN, CLOSED, PENDING
  priority               String    @default("MEDIUM") // LOW, MEDIUM, HIGH, URGENT
  unreadCount            Int       @default(0)
  lastMessageText        String?   @db.Text
  lastMessageSender      String    @default("CONTACT") // CONTACT, AGENT, SYSTEM, TEMPLATE
  lastMessageAt          DateTime  @default(now())
  lastCustomerActivityAt DateTime? // For 24-hour customer care window tracking
  labels                 String?   @db.Text // JSON array of labels
  internalNotes          String?   @db.Text
  createdAt              DateTime  @default(now())
  updatedAt              DateTime  @updatedAt

  messages               WhatsAppMessage[]

  @@index([waNumber])
  @@index([status])
  @@index([assignedUserId])
  @@index([leadId])
  @@index([contactId])
}

// 4. WhatsApp Messages
model WhatsAppMessage {
  id                String               @id @default(uuid())
  conversationId    String
  conversation      WhatsAppConversation @relation(fields: [conversationId], references: [id], onDelete: Cascade)
  metaMessageId     String?              @unique // wamid.xxx
  direction         String               // INBOUND, OUTBOUND
  senderType        String               // CONTACT, AGENT, SYSTEM, TEMPLATE, BOT
  senderUserId      String?
  type              String               @default("text") // text, image, document, audio, video, location, interactive, template
  textBody          String?              @db.Text
  mediaUrl          String?              @db.Text
  mimeType          String?
  mediaCaption      String?
  templateName      String?
  templateVariables String?              @db.Text
  interactiveData   String?              @db.Text
  status            String               @default("SENT") // QUEUED, SENT, DELIVERED, READ, FAILED
  failureReason     String?              @db.Text
  errorCode         String?
  campaignId        String?
  sentAt            DateTime?
  deliveredAt       DateTime?
  readAt            DateTime?
  createdAt         DateTime             @default(now())

  @@index([conversationId])
  @@index([metaMessageId])
  @@index([status])
  @@index([campaignId])
}

// 5. WhatsApp Message Templates (Synced from Meta)
model WhatsAppTemplate {
  id              String    @id @default(uuid())
  metaTemplateId  String?   @unique
  name            String
  language        String    @default("en_US")
  category        String    // MARKETING, UTILITY, AUTHENTICATION
  status          String    @default("APPROVED") // APPROVED, PENDING, REJECTED, PAUSED, DISABLED
  headerType      String?   // NONE, TEXT, IMAGE, DOCUMENT, VIDEO
  headerContent   String?   @db.Text
  bodyText        String    @db.Text
  footerText      String?
  buttonsConfig   String?   @db.Text // JSON representation of quick replies & CTAs
  variablesJson   String?   @db.Text // ["1", "2", "3"]
  crmMappingJson  String?   @db.Text // {"1": "lead.name", "2": "lead.service"}
  rejectionReason String?
  lastSyncedAt    DateTime  @default(now())
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  @@index([name, language])
  @@index([status])
  @@index([category])
}

// 6. WhatsApp Campaigns
model WhatsAppCampaign {
  id              String    @id @default(uuid())
  name            String
  description     String?   @db.Text
  type            String    @default("MARKETING") // MARKETING, UTILITY, FOLLOWUP
  status          String    @default("DRAFT") // DRAFT, SCHEDULED, PROCESSING, COMPLETED, PAUSED, CANCELLED, FAILED
  templateId      String
  variableMapping String    @db.Text // JSON mapping
  audienceSource  String    // CRM_LEADS, CONTACTS, CUSTOMERS, GOOGLE_SHEET, CSV, CUSTOM_FILTER
  audienceFilter  String?   @db.Text
  totalAudience   Int       @default(0)
  validCount      Int       @default(0)
  suppressedCount Int       @default(0)
  attemptedCount  Int       @default(0)
  sentCount       Int       @default(0)
  deliveredCount  Int       @default(0)
  readCount       Int       @default(0)
  failedCount     Int       @default(0)
  replyCount      Int       @default(0)
  scheduledAt     DateTime?
  startedAt       DateTime?
  completedAt     DateTime?
  createdById     String?
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  recipients      WhatsAppCampaignRecipient[]

  @@index([status])
  @@index([templateId])
  @@index([scheduledAt])
}

// 7. WhatsApp Campaign Recipients
model WhatsAppCampaignRecipient {
  id             String           @id @default(uuid())
  campaignId     String
  campaign       WhatsAppCampaign @relation(fields: [campaignId], references: [id], onDelete: Cascade)
  phone          String
  contactId      String?
  leadId         String?
  status         String           @default("PENDING") // PENDING, SENT, DELIVERED, READ, FAILED, REPLIED, SUPPRESSED
  metaMessageId  String?
  errorMessage   String?          @db.Text
  errorCode      String?
  variablesSent  String?          @db.Text
  sentAt         DateTime?
  deliveredAt    DateTime?
  readAt         DateTime?
  repliedAt      DateTime?

  @@index([campaignId, status])
  @@index([phone])
  @@index([metaMessageId])
}

// 8. WhatsApp Suppression & Consent Management
model WhatsAppSuppression {
  id         String   @id @default(uuid())
  phone      String   @unique // E.164 canonical phone
  status     String   @default("OPTED_OUT") // OPTED_OUT, OPTED_IN, BOUNCED
  reason     String?  // USER_REQUEST, STOP_REPLY, INVALID_NUMBER, COMPLAINT
  source     String   // INBOUND_REPLY, ADMIN_MANUAL, IMPORT, API
  optedOutAt DateTime @default(now())
  notes      String?  @db.Text

  @@index([phone])
  @@index([status])
}

// 9. Google Account Connection (OAuth2 / Service Account)
model GoogleConnection {
  id                    String    @id @default(uuid())
  authType              String    @default("SERVICE_ACCOUNT") // SERVICE_ACCOUNT, OAUTH2
  clientEmail           String?
  privateKeyEncrypted   String?   @db.Text
  refreshTokenEncrypted String?   @db.Text
  accessToken           String?   @db.Text
  tokenExpiresAt        DateTime?
  status                String    @default("CONNECTED")
  lastTestedAt          DateTime?
  createdAt             DateTime  @default(now())
  updatedAt             DateTime  @updatedAt
}

// 10. Google Sheet CRM Sync Configuration
model GoogleSheetSyncConfig {
  id                      String    @id @default(uuid())
  name                    String
  spreadsheetId           String
  sheetName               String    @default("Sheet1")
  syncDirection           String    @default("INBOUND") // INBOUND, OUTBOUND, BIDIRECTIONAL
  columnMapping           String    @db.Text // JSON mapping
  defaultPipelineId       String?
  defaultStageId          String?
  defaultSource           String    @default("Google Sheets Sync")
  defaultAssigneeId       String?
  assignmentStrategy      String    @default("ROUND_ROBIN") // ROUND_ROBIN, SPECIFIC_USER, UNASSIGNED
  tags                    String?
  dedupField              String    @default("PHONE_OR_EMAIL") // PHONE_OR_EMAIL, EMAIL_ONLY, PHONE_ONLY
  duplicateAction         String    @default("UPDATE") // UPDATE, SKIP, CREATE_NEW
  enableAutoWhatsApp      Boolean   @default(false)
  whatsAppTemplateId      String?
  autoSyncIntervalMinutes Int       @default(15) // 0 for manual
  lastSyncAt              DateTime?
  lastRowImported         Int       @default(0)
  status                  String    @default("ACTIVE") // ACTIVE, PAUSED, ERROR
  lastError               String?   @db.Text
  createdAt               DateTime  @default(now())
  updatedAt               DateTime  @updatedAt

  logs                    GoogleSheetSyncLog[]

  @@index([status])
  @@index([spreadsheetId])
}

// 11. Google Sheet Sync Logs
model GoogleSheetSyncLog {
  id                String                @id @default(uuid())
  configId          String
  config            GoogleSheetSyncConfig @relation(fields: [configId], references: [id], onDelete: Cascade)
  syncType          String                @default("MANUAL") // MANUAL, SCHEDULED, WEBHOOK, WORKFLOW
  rowsScanned       Int                   @default(0)
  leadsCreated      Int                   @default(0)
  leadsUpdated      Int                   @default(0)
  duplicatesSkipped Int                   @default(0)
  errorsCount       Int                   @default(0)
  details           String?               @db.LongText
  startedAt         DateTime              @default(now())
  completedAt       DateTime?
  status            String                @default("COMPLETED") // COMPLETED, FAILED, PARTIAL

  @@index([configId])
  @@index([startedAt])
}
```

---

## 3. Architecture & Integration Workflows

### 3.1 Meta Official WhatsApp Business Platform Architecture
- **API Standard:** Meta Graph API v21.0 using official Cloud API endpoints.
- **Outbound Messaging:**
  - In Customer Care Window (<= 24h since customer's last message): Free-form text and media messages.
  - Outside Customer Care Window (> 24h or new outbound): Pre-approved Meta Message Templates only.
- **Inbound Webhooks:**
  - GET: Hub challenge verification with configurable verify token.
  - POST: HMAC-SHA256 signature verification (`x-hub-signature-256`) using `appSecret`.
  - Storage: Immediate persistent storage in `WhatsAppWebhookEvent` table to guarantee zero data loss.
  - Idempotency: Deduplication on Meta's unique message ID (`wamid.xxx`) or status event ID.
  - Processing:
    1. Check `WhatsAppSuppression` table (if user replied "STOP" / "UNSUBSCRIBE", mark opted-out immediately and send auto-acknowledgment).
    2. Normalize phone via `normalizeToCanonicalE164`.
    3. Match Contact/Lead in CRM. If none exists, auto-create Contact & Lead (source = "WhatsApp Inbound").
    4. Link or create `WhatsAppConversation`.
    5. Append `WhatsAppMessage` with status `DELIVERED`/`READ` or incoming content.
    6. Record `LeadTimelineEvent`.
    7. Emit Workflow Engine Event `comm.whatsapp.received`.

### 3.2 Google Sheets Integration Architecture
- **Google API:** Google Sheets API v4 using authenticated Service Account / OAuth token.
- **Spreadsheet Explorer:** Discovers spreadsheet titles, sheets/tabs, and first-row column headers.
- **Visual Column Mapper:** Maps sheet columns (`Name`, `Phone`, `Email`, `Company`, `Budget`, etc.) to CRM fields.
- **Inbound Lead Sync Pipeline:**
  1. Read sheet rows starting from `lastRowImported + 1` (or all rows with deduplication).
  2. Normalize phone numbers and sanitize emails.
  3. Query existing CRM Leads by phone (canonical E.164, local 10-digit) and email.
  4. Perform duplicate action (`UPDATE`, `SKIP`, `CREATE_NEW`).
  5. Apply Round-Robin or designated sales executive assignment.
  6. Emit Workflow Engine Event `integrations.sheets.lead_imported`.
  7. If configured, immediately trigger welcome template via official WhatsApp API.
- **Bidirectional Outbound Sync (CRM -> Sheet) with Loop Prevention:**
  - CRM writes to Sheet with a hidden hash column `_crm_sync_hash` or origin flag.
  - When Sheet Inbound scanner reads the row, it checks if `_crm_sync_hash` matches the current record hash; if identical, import is skipped, preventing infinite sync loops.

### 3.3 Security & Encryption
- **Encryption at Rest:** AES-256-GCM encryption using a secret key derived from `JWT_SECRET` / `APP_SECRET`.
- **Frontend Masking:** Complete access tokens, private keys, and app secrets are never sent to the browser or logged in plain text. Masked format: `EAA...***...XYZ`.
- **RBAC Enforcement:** User permissions verified on every API route (`comm.whatsapp.view`, `comm.whatsapp.send`, `comm.whatsapp.configure`, `google_sheets.view`, `google_sheets.sync`, etc.).

---

## 4. Implementation Phases

- **Phase 1: Foundation, Security & Schema**
  - Add Prisma models to `prisma/schema.prisma` and execute `prisma db push`.
  - Create `src/lib/encryption.ts` (AES-256-GCM encryption/decryption with key derivation).
  - Create `src/lib/phone.ts` (Canonical E.164 normalization, international regex, fuzzy matching).
  - Update `src/lib/permissions.ts` with granular WhatsApp & Google Sheets RBAC codes.

- **Phase 2: WhatsApp Cloud API & Connection Manager**
  - Create `src/lib/whatsapp_service.ts` supporting DB-backed credential retrieval, token validation, WABA details fetching, and template retrieval.
  - Redesign `/admin/whatsapp` into a Connection Manager with Health Cards, Disconnect, Reconnect, Test, and Refresh capabilities.
  - Build connection test API `/api/whatsapp/connection`.

- **Phase 3: Webhook Engine & Webhook Logs**
  - Upgrade `/api/whatsapp/webhook` with strict HMAC validation, raw event storage, idempotency, media handling, and delivery/read updates.
  - Build Webhook Logs and Safe Retry view at `/admin/whatsapp/logs` and API `/api/whatsapp/logs`.

- **Phase 4: WhatsApp Unified Team Inbox**
  - Build `/admin/whatsapp/inbox` (or upgrade `/admin/whatsapp` tabbed view) featuring 3-pane layout:
    - Left: Filterable Conversation List (Open/Closed, Assigned/Unassigned, Unread counts, Priority, Search).
    - Center: Live Chat Thread (Incoming/Outgoing message bubbles, Media rendering, Delivery/Read checkmarks, 24h care window indicator, internal note toggle).
    - Right: Customer 360 Sidebar (Linked Lead/Contact, Deal stages, Quick Actions).
  - Build conversation and messaging APIs `/api/whatsapp/conversations` and `/api/whatsapp/messages`.

- **Phase 5: CRM 360 WhatsApp History & Actions**
  - Add WhatsApp Conversation History & Quick WhatsApp Send modal in Customer 360 (`/admin/customers/[id]`) and Lead details.

- **Phase 6: Template Management (`/admin/whatsapp/templates`)**
  - Build Template Sync API `/api/whatsapp/templates` to fetch approved templates from Meta Graph API.
  - UI with Status badges (APPROVED, PENDING, REJECTED), variable placeholder preview, and CRM mapping.

- **Phase 7: Campaign Manager & Suppression (`/admin/whatsapp/campaigns` & `/admin/whatsapp/suppression`)**
  - Build 7-step campaign creation wizard.
  - Create suppression service `src/lib/whatsapp_suppression.ts` and UI `/admin/whatsapp/suppression`.
  - Campaign queue runner with rate-limit compliance, batching, and analytics tracking (`/api/whatsapp/campaigns`).

- **Phase 8: Official Google Sheets Integration (`/admin/integrations/google-sheets`)**
  - Build Google credentials manager `/api/integrations/google-sheets/connect`.
  - Build spreadsheet explorer `/api/integrations/google-sheets/explore`.
  - Build visual column mapper and sync settings `/api/integrations/google-sheets/config`.
  - Build sync engine `src/lib/google_sheets_sync.ts` with deduplication and loop prevention.
  - Build manual/scheduled sync runner `/api/integrations/google-sheets/sync`.

- **Phase 9: Workflow Engine Integration**
  - Verify and register triggers: `comm.whatsapp.received`, `comm.whatsapp.delivered`, `integrations.sheets.lead_imported`.
  - Verify and register actions: `SEND_WHATSAPP_TEMPLATE`, `SEND_WHATSAPP_TEXT`, `GOOGLE_SHEETS_APPEND_ROW`, `GOOGLE_SHEETS_UPDATE_ROW`.
  - Link incoming webhooks and sheet sync events to `emitWorkflowEvent`.

- **Phase 10: Automated Tests & Verification**
  - Automated test suite `scripts/test-whatsapp-sheets-integration.js` covering webhook verification, idempotency, phone normalization, lead creation, template interpolation, suppression filtering, and sheet sync deduplication.
  - Compile build with `npm run build` (0 errors).
  - Deploy to production VPS and restart PM2.
  - Generate `WHATSAPP_GOOGLE_PRODUCTION_AUDIT.md`.
