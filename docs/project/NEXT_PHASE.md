# NEXT PHASE

## 1. TechInPedia Admin & Workforce Mobile App — Completed Phases (1-5)
- **Phase 1 (Complete):** Auth, RBAC, WhatsApp Team Inbox, Messaging Timeline, FCM Push.
- **Phase 2 (Complete):** CRM 360° Lead Hub, Meta HSM Templates, In-Chat Notes, Leads Directory.
- **Phase 3 (Complete):** Workforce Suite, GPS & Adherence Attendance Punch, Leave Portal, Compensation.
- **Phase 4 (Complete):** IT Hardware Rental Fleet Directory, Dispatch & Return Check-In, Digital Touch Signature, Field Maintenance AMC Tickets.
- **Phase 5 (Complete — Admin Suite):** Full TechInPedia Admin Mobile App — Executive Command Center (MRR runrate, revenue & operational KPIs), Leave Approvals Desk (1-tap review), Staff Directory with Business Unit assignment, Invoices & Receivables Desk, Customer Support Helpdesk (SLA queues & status updates), and Daily Attendance Roster. (36 unit tests passing, 0 analyzer issues).

### Planned Admin Mobile Enhancements (Next):
1. **Push Notifications for Admin Actions:** Instant notifications when an employee submits a leave request, a new customer support ticket arrives, or an invoice becomes overdue.
2. **Camera Barcode & QR Code Scanner:** Instant serial number barcode scanning for dispatching and checking in hardware rental items.
3. **Admin Quick Reports Export:** PDF / CSV export for invoices, attendance logs, and staff rosters.

---

## 2. Central Web Platform — Urban Marketplace Phases
- **Phase 1.1 Business Unit Isolation & Admin UI Surfacing (Complete):**
  - Isolation rules, site-context resolution, and 25 unit tests verified.
  - Admin sidebar links, CRM Leads BU badges/filters/assignment, and HR Employee BU assignment complete.
- **Phase 2 Public Identity, Lead Engine & Vendor Hub (Complete & Live):**
  - Apache proxy fix to forward `urban.techinpedia.com` to port 3001.
  - Dual-mode frontend shell (B2C Services + B2B Industrial Suppliers).
  - Interactive "Post Requirement" modal capturing leads directly into central CRM under `MARKETPLACE` BU.
  - Vendor onboarding registration wizard at `/list-business`.
  - Vendor workspace hub at `/vendor` with matching leads feed and credit unlock mechanics.
- **Phase 3 Marketplace Management Desk in Central Admin (Complete & Live):**
  - Marketplace Cockpit (`/admin/marketplace`), Leads Triage Desk (`/admin/marketplace/leads`), and Vendors Directory (`/admin/marketplace/vendors`).
- **Phase 4 Automated Lead Fanout Engine & Unmasking (Complete & Live):**
  - Inbound buyer leads automatically fan out to matching verified vendors with automated WhatsApp alerts.
  - Real-time contact masking and 1-credit contact unmasking with 1-tap WhatsApp chat launcher.
- **Phase 5 Razorpay Vendor Monetization & Online Lead Credit Packs (Complete & Live):**
  - End-to-end Razorpay checkout modal with cryptographic HMAC-SHA256 signature verification and automatic wallet credit top-up.
- **Phase 6 Justdial/IndiaMART-Style Vendor 360 Profile Suite & Directory (Complete & Live):**
  - 100% database-driven architecture with zero hardcoding.
  - Production MySQL models: `MarketplaceVendor`, `MarketplaceVendorMedia`, `MarketplaceVendorService`, `MarketplaceVendorReview`.
  - Central Admin Vendor 360 Studio: `/admin/marketplace/vendors` & `/admin/marketplace/vendors/[id]/editor` with 5 editing tabs.
  - Public Vendor Profile 360: `/biz/[city]/[slug]` matching reference screenshots (Hero header, photo gallery with owner/user/video filters, price list cards, scanned rate cards document carousel, AI instant question box, quick info, testimonials, reviews & rating trend chips, sticky bottom bar).
  - Public Category Directory: `/services/[slug]` matching Screenshot 1 (photo slider cards, distance, verified badges, rating score, Call/WhatsApp/Enquire CTAs, right rail lead capture).

### Phase 7 Objectives (Planned):
1. **Multi-City Pincode Geo-Fencing & Radius Calculator:**
   - Real-time GPS distance calculation between buyer locality and vendor workshop.
2. **Vendor Self-Service Studio on `/vendor`:**
   - Allow logged-in vendors to upload their own photos, update service pricing cards, and reply to reviews directly from their vendor dashboard.
3. **Urban Mobile Apps (Flutter / Dart) for Customers and Vendors:**
   - Dedicated customer booking and vendor quote delivery app with real-time push notifications.

---

## 3. Central Web Platform — Multi-Tenant Communication, SLA & Workforce Security
- **Security & Visibility Architecture (Complete & Live):**
  - Server-side multi-tenant isolation and 8-tier polymorphic visibility permissions (`ResourceVisibility`).
  - Scoped WhatsApp folder metrics, leads list scoping, and `canUserAccessConversation` / `canUserAccessLead` policy enforcement.
- **Configurable SLA & Escalation Engine (Complete & Live):**
  - Database-backed `SlaRule` model with per-priority warning/breach rules and warning threshold percentage slider.
  - Automated status calculations (`SAFE`, `WARNING`, `BREACHED`).
- **Workforce Reassignment & Activity Telemetry (Complete & Live):**
  - Reassignment modal with live candidate workload telemetry and immutable audit trail (`ReassignmentHistory`).
  - Live employee presence tracking (`EmployeeStatus`) and normalized activity stream (`/admin/company/employees/[id]/activity`).
- **Dashboard Separation (Complete & Live):**
  - Role-based server-side routing delivering Company Dashboard for leadership and personal Workbench for staff.

---

## 4. Central Web Platform — WhatsApp Marketing Suite & AI Automation
- **Part 0 Security Corrections (Complete & Live):**
  - `HIDDEN_FROM_EMPLOYEES` allows Company Owner & Admin while denying staff; `PLATFORM_RESTRICTED` reserved for Super Admin.
  - Manager Dashboard automatically scoped to Team by default unless explicit permission `VIEW_COMPANY_ANALYTICS`.
- **Customer Data Platform (Complete & Live):**
  - Canonical `Contact` model extended with CRM and WhatsApp marketing fields, custom fields (`ContactCustomField`), smart dynamic segments (`ContactSegment`), and static lists (`ContactList`, `ContactListMember`).
- **Marketing Campaign Engine (Complete & Live):**
  - Broadcast campaign manager with 5-step wizard, audience resolution, and delivery/read rate metrics.
  - Automated drip campaign builder (`DripCampaign`) with multi-step delay execution via `worker.js` and queue `whatsapp-drip-step`.
  - Single send console with template variable mapping and Meta 24-hr care window compliance.
  - Suppression / Blacklist DND management.
- **Visual Chatbot & Autonomous AI Engagement Layer (Complete & Live):**
  - Visual Chatbot Builder (`/admin/whatsapp/chatbot`) with 10 node types, flow validation, draft/publish lifecycle, and turn execution engine (`ChatbotEngine`).
  - Context-Aware AI Brain (`/admin/ai/brain`) supporting multi-provider LLMs (OpenAI, Anthropic, Gemini, Fallback), persona/prompt tailoring, encrypted API keys, and safe test playground with explainability trace.
  - Vectorless RAG Knowledge Base (`/admin/ai/knowledge`) with automated overlapping chunk indexing, strict multi-tenant isolation, sync trigger, and unanswered suggestions review.
  - Conversational Goals Studio (`/admin/ai/goals`) with predefined blueprints, conversion objectives, and fallback actions.
  - Two-Stage Intent Router (`/admin/ai/intents`) with exact keyword matching (`STOP`, `AGENT`, `PRICING`, `HELP`) and semantic model evaluation.
  - AI Analytics & Telemetry Cockpit (`/admin/ai/analytics`) tracking token usage, estimated costs, average latency, and quota gauges.
  - Live WhatsApp Inbox AI Co-Pilot with 1-click Pause/Resume toggle, message source badges (Customer, Agent, AI Assistant, Automation), contextual suggestion generator, tone rewriter, conversation summarizer, and lead qualification extractor.
  - Smart Human Handoff with automatic assignment to least-loaded active staff and immediate SLA timer initiation (`assignmentAcceptedAt = null`).
  - 37/37 automated security/RBAC/injection unit tests and 29/29 live production E2E tests passing 100%.
- **Multi-Company `CompanySwitcher` UI Migration (Complete — PENDING DEPLOY):**
  - `CompanySwitcher` component added to all AI admin pages: brain, goals, knowledge, intents, analytics.
  - Also integrated in `/admin/whatsapp/chatbot`.
  - Super Admin can now switch between tenant companies from any AI admin page.
  - URL state-synced (`?companyId=`); backend isolation via `resolveEffectiveCompanyId` enforced on all routes.
  - 0 TypeScript errors across AI module. Deploy script: `scratch/deploy_ai_company_switcher.py`.

### Next Objectives (Future / Advanced):
1. **Advanced Campaign Link Attribution & URL Shortener:**
   - Branded short-links with UTM parameter injection and per-recipient click tracking for WhatsApp broadcasts.
2. **Multi-Model LLM Cost Arbitrage:**
   - Dynamic real-time router sending simple FAQ queries to lightweight models (e.g. Gemini Flash / GPT-4o-mini) and escalating complex technical questions to flagship models.
3. **Voice Note Transcriptions in WhatsApp Inbox:**
   - Inbound customer audio message transcription via Whisper API with automated summary and sentiment tagging.



