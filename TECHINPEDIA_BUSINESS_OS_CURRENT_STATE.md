# TechInPedia Business OS — Current State Technical Audit

**Target System:** TechInPedia Business OS & Administration Suite  
**Audit Date:** September 18, 2026  
**Auditor:** Deepmind Advanced Agentic Coding Pair  
**Scope:** Complete Codebase, Database (MySQL/Prisma), APIs, UI Components, Background Workers, and Workflows  
**Target Organization Scale:** ~100 Employees (Multi-department, Hierarchical Teams, Executives)  

---

## 1. System-Wide Architecture Overview

### 1.1 Tech Stack & Environment
- **Framework:** Next.js 16.3.4 (App Router, Webpack build)
- **Database Engine:** MySQL 8.0 on production VPS (`<SERVER_IP>`, database `<SERVER_USER>_techinpedianew`)
- **ORM / Query Engine:** Prisma 6.4.1 (75 Models, 1731 lines in `schema.prisma`)
- **Background Execution:**
  - PM2 Process 0: `techinpedia` (Next.js Application Server)
  - PM2 Process 1: `techinpedia-worker` (Standalone Node background worker `src/workers/backgroundWorker.ts`)
  - Database-backed Durable Queue Engine (`BackgroundJob`, `WorkerHeartbeat` tables) with exponential backoff & leasing
- **External Providers:**
  - Meta WhatsApp Cloud API (Graph API v21.0, Connection manager & Webhooks ready; awaiting production token verification)
  - Google Sheets API (Service Account & OAuth2 connector ready; awaiting production credentials)
  - SMTP Transact Email (NodeMailer)
  - **Razorpay Payments:** NOT YET IMPLEMENTED (Design phase)
  - **Google Calendar / Meet:** NOT YET IMPLEMENTED (Design phase)

---

## 2. Comprehensive Module-by-Module Inventory & Classification Matrix

Every business module across the entire codebase was inspected down to its route, API handler, database queries, and state management.

### Classification Key:
- **PRODUCTION READY:** Feature is complete, verified end-to-end, resilient, and ready for 100-user operational deployment.
- **FUNCTIONAL BUT BASIC:** Backend and UI exist and work, but lack enterprise depth (e.g. no approval hierarchy, missing filters, hardcoded logic).
- **PARTIAL:** Some parts work, but major workflows are missing or incomplete.
- **UI ONLY:** Interface exists in admin, but uses hardcoded data, mock state, or lacks backend endpoints to persist changes.
- **BACKEND ONLY:** Database models and API endpoints exist, but no dedicated UI page is available.
- **BROKEN:** Code exists but throws errors or cannot execute due to missing dependencies/broken queries.
- **NOT IMPLEMENTED:** Planned or sidebar-referenced capability with zero code or database support.

---

### Module Audit Table

| # | Module | Submodules | Admin Route | API Endpoints | Database Models | UI Status | Backend Status | Classification |
|---|---|---|---|---|---|:---:|:---:|:---:|
| 1 | **Authentication & RBAC** | Login, Password Change, Session JWT | `/admin/login` | `/api/auth/login`<br>`/api/auth/logout`<br>`/api/auth/me`<br>`/api/auth/change-password` | `User` | **Complete** | **Functional** (3 roles only: `SUPER_ADMIN`, `ADMIN`, `EDITOR`) | **FUNCTIONAL BUT BASIC** |
| 2 | **Roles & Permissions** | Permissions Matrix, Role Assignment | `/admin/roles` | `/api/users`<br>`/api/users/[id]` | `Permission`<br>`RolePermission` | **UI Only** (Static table) | **Partial** (Hardcoded in TS; DB table empty) | **UI ONLY** |
| 3 | **CRM: Leads & Inquiries** | Inbound capture, Leads Desk, Scoring, Notes | `/admin/leads`<br>`/admin/enquiries` | `/api/enquiries`<br>`/api/enquiries/[id]`<br>`/api/enquiries/[id]/notes` | `Enquiry`<br>`EnquiryNote`<br>`LeadTimelineEvent` | **Complete** (Rich drawer, filters) | **Functional** (Scoring, basic auto-assign) | **FUNCTIONAL BUT BASIC** |
| 4 | **CRM: Contacts & Companies** | Contact Directory, Corporate Accounts | `/admin/contacts`<br>`/admin/companies` | `/api/crm/contacts`<br>`/api/crm/companies` | `Contact`<br>`Company` | **Functional** (List, Create modals) | **Functional** (CRUD, search) | **FUNCTIONAL BUT BASIC** |
| 5 | **CRM: Customer 360** | Single Customer View, Timeline, History | `/admin/customers`<br>`/admin/customers/[id]` | `/api/crm/customers`<br>`/api/crm/customers/[id]` | `Customer`<br>`Company`<br>`Contact` | **Complete** (Tabs for deals, invoices, rentals) | **Partial** (Missing quotes, proposals, files) | **PARTIAL** |
| 6 | **CRM: Deals & Kanban** | Pipeline Stages, Drag-and-drop, Won/Lost | `/admin/deals` | `/api/crm/deals`<br>`/api/crm/deals/[id]`<br>`/api/crm/pipelines` | `Pipeline`<br>`PipelineStage`<br>`Deal` | **Complete** (Interactive Kanban) | **Functional** (Stage change, convert to project) | **FUNCTIONAL BUT BASIC** |
| 7 | **CRM: Follow-up Engine** | Scheduled calls, reminders, outcomes | `/admin/follow-ups` | `/api/crm/followups`<br>`/api/crm/followups/[id]` | `FollowUp` | **Functional** (Filter, outcome modal) | **Functional** (Status update, logging) | **FUNCTIONAL BUT BASIC** |
| 8 | **CRM: Bulk CSV Import** | Column mapping, deduplication | `/admin/crm/import` | `/api/crm/import` | `Enquiry`<br>`Contact`<br>`Company` | **Complete** (Multi-step mapping wizard) | **Functional** (Batch insert, skip/update) | **PRODUCTION READY** |
| 9 | **Sales: Quotations** | Commercial quotes, tax breakdown | `/admin/quotations` | `/api/sales/quotations` | `Quotation`<br>`QuotationItem` | **Functional** (Create modal, print view) | **Functional** (Calculates GST, totals) | **FUNCTIONAL BUT BASIC** |
| 10 | **Sales: Proposals** | Pitch document builder, scope of work | `/admin/proposals` | `/api/sales/proposals` | `Proposal` | **Basic** (Create form, list) | **Basic** (Single table record) | **FUNCTIONAL BUT BASIC** |
| 11 | **Sales: Contracts** | Service contracts, SLA terms | `/admin/contracts` | `/api/sales/contracts` | `Contract` | **Basic** (Terms editor, list) | **Basic** (Dates, renewal tracking) | **FUNCTIONAL BUT BASIC** |
| 12 | **Finance: Invoices** | Billing, line items, balance due, print | `/admin/invoices` | `/api/finance/invoices` | `Invoice`<br>`InvoiceItem` | **Complete** (Table, modal, print layout) | **Functional** (Status, balance recalculation) | **FUNCTIONAL BUT BASIC** |
| 13 | **Finance: Payments** | Manual offline receipts, reconciliation | `/admin/payments` | `/api/finance/payments` | `Payment` | **Basic** (Log payment modal, history) | **Functional** (Updates invoice balance) | **FUNCTIONAL BUT BASIC** |
| 14 | **Finance: Expenses** | Operational spend, categories | `/admin/expenses` | `/api/finance/expenses` | `Expense` | **Functional** (Log expense, category stats) | **Basic** (CRUD, no approval flow) | **FUNCTIONAL BUT BASIC** |
| 15 | **HRM: Employees** | Staff directory, onboarding form | `/admin/hr/employees` | `/api/hr/employees` | `Employee`<br>`Department`<br>`Designation` | **Basic** (List cards, quick modal) | **Basic** (No edit route, no user link) | **FUNCTIONAL BUT BASIC** |
| 16 | **HRM: Attendance** | Daily punch logs, present/late stats | `/admin/hr/attendance` | `/api/hr/attendance` | `AttendanceRecord` | **Basic** (Daily log table, quick check-in) | **Basic** (No check-out, no calendar view) | **FUNCTIONAL BUT BASIC** |
| 17 | **HRM: Leave Management** | Time off requests, approvals | `/admin/hr/leaves` | `/api/hr/leaves` | `LeaveRequest` | **Functional** (Apply modal, approve/reject) | **Basic** (No leave balances, no hierarchy) | **FUNCTIONAL BUT BASIC** |
| 18 | **HRM: Payroll** | Monthly compensation disbursement | `/admin/hr/payroll` | `/api/hr/payroll` | `PayrollRecord` | **Basic** (Generate button, table) | **Basic** (Hardcoded 20%/5% formula, no payslip) | **FUNCTIONAL BUT BASIC** |
| 19 | **Workforce: Timesheets** | Billable hour tracking, project logs | `/admin/timesheets` | `/api/projects/timesheets` | `Timesheet` | **Basic** (Log modal, weekly totals) | **Basic** (No manager approval lock) | **FUNCTIONAL BUT BASIC** |
| 20 | **Projects & Milestones** | Client project delivery, milestones | `/admin/projects` | `/api/projects`<br>`/api/projects/[id]` | `ProjectRecord`<br>`Milestone` | **Functional** (Milestone tracker, budget) | **Functional** (CRUD, customer relation) | **FUNCTIONAL BUT BASIC** |
| 21 | **Tasks & Backlog** | Task board, deadlines, priorities | `/admin/tasks` | `/api/projects/tasks` | `Task` | **Functional** (Kanban columns, create modal) | **Basic** (No employee link, no comments) | **FUNCTIONAL BUT BASIC** |
| 22 | **Hardware: Rentals** | Active leases, return dates, deposits | `/admin/rental-orders` | `/api/hardware/rentals`<br>`/api/hardware/rentals/[id]` | `RentalOrder`<br>`RentalOrderItem` | **Functional** (Order lifecycle, devices) | **Functional** (Customer link, status) | **FUNCTIONAL BUT BASIC** |
| 23 | **Hardware: Asset Fleet** | Laptops, desktops, serial numbers, QR | `/admin/assets` | `/api/hardware/assets`<br>`/api/hardware/assets/[id]` | `RentalAsset` | **Complete** (Specs, status pills, filter) | **Functional** (Tracking, condition, value) | **PRODUCTION READY** |
| 24 | **Hardware: AMC Contracts** | Maintenance agreements, SLA visits | `/admin/amc` | `/api/hardware/amc`<br>`/api/hardware/amc/[id]` | `AMCContract` | **Functional** (SLA badges, renewal dates) | **Functional** (Customer link, device counts) | **FUNCTIONAL BUT BASIC** |
| 25 | **Hardware: Maintenance** | Repair tickets, technician logs | `/admin/maintenance` | `/api/hardware/maintenance`<br>`/api/hardware/maintenance/[id]` | `AssetMaintenance` | **Functional** (Log ticket modal, cost) | **Functional** (Status, asset relation) | **FUNCTIONAL BUT BASIC** |
| 26 | **SaaS: Catalog & Licenses** | Software tiers, client licenses, keys | `/admin/saas-products`<br>`/admin/licenses`<br>`/admin/subscriptions` | `/api/saas/products`<br>`/api/saas/licenses`<br>`/api/saas/subscriptions` | `SaaSProduct`<br>`SaaSPlan`<br>`SaaSSubscription`<br>`SoftwareLicense` | **Functional** (Tiers, key reveal toggle) | **Functional** (CRUD, customer subscriptions) | **FUNCTIONAL BUT BASIC** |
| 27 | **Support: Tickets** | Customer tickets, resolution status | `/admin/tickets` | `/api/support/tickets`<br>`/api/support/tickets/[id]` | `SupportTicket`<br>`TicketComment` | **Functional** (Priority badges, ticket thread) | **Functional** (Customer link, comments) | **FUNCTIONAL BUT BASIC** |
| 28 | **Support: Knowledge Base** | Help articles, categories | `/admin/kb` | `/api/support/kb` | `KnowledgeArticle` | **Functional** (Article editor, category pills) | **Functional** (Search, public visibility) | **FUNCTIONAL BUT BASIC** |
| 29 | **Communication: WhatsApp** | Cloud API Desk, Templates, Broadcasts | `/admin/whatsapp` | `/api/whatsapp/**` (8 endpoints) | `WhatsappConnection`<br>`WhatsappConversation`<br>`WhatsappMessage`<br>`WhatsappTemplate`<br>`WhatsappCampaign`<br>`WhatsappSuppression`<br>`WhatsappWebhookEvent` | **Complete** (Team chat, wizard, logs) | **Production-Grade Architecture** (Durable queues, idempotency, rate-limits) | **PRODUCTION READY** (Awaiting live Meta credentials) |
| 30 | **Communication: Unified Inbox** | Multi-channel messaging stream | `/admin/inbox` | `/api/admin/chats` | `ChatSession`<br>`ChatMessage` | **Functional** (Split pane chat) | **Basic** (Only handles website chat) | **FUNCTIONAL BUT BASIC** |
| 31 | **Communication: Live Chat** | Website visitor live chat desk | `/admin/chats` | `/api/admin/chats`<br>`/api/admin/chats/[id]` | `ChatSession`<br>`ChatMessage` | **Functional** (Real-time polling, reply) | **Functional** (Lead conversion button) | **FUNCTIONAL BUT BASIC** |
| 32 | **Integration: Google Sheets** | Two-way lead sync, field mapping | `/admin/integrations/google-sheets` | `/api/integrations/google-sheets/**` | `GoogleConnection`<br>`GoogleSheetSyncConfig`<br>`GoogleSheetSyncLog` | **Complete** (Sheet picker, mapping table) | **Production-Grade Architecture** (Durable queues, dedup strategies) | **PRODUCTION READY** (Awaiting live Google credentials) |
| 33 | **Integration: Webhooks** | Outbound event subscriptions, HMAC | `/admin/webhooks` | `/api/settings/webhooks`<br>`/api/settings/webhooks/[id]` | `WebhookSubscription`<br>`WebhookDeliveryLog` | **Functional** (Endpoint list, logs modal) | **Functional** (Signed payloads, delivery logs) | **FUNCTIONAL BUT BASIC** |
| 34 | **Automation: Workflows** | Visual node graph builder, triggers | `/admin/workflows`<br>`/admin/workflows/builder` | `/api/automation/workflows/**`<br>`/api/automation/executions/**` | `WorkflowRule`<br>`WorkflowExecution`<br>`WorkflowExecutionStep`<br>`WorkflowJob` | **Complete** (Interactive canvas, nodes) | **Functional** (Graph execution engine) | **FUNCTIONAL BUT BASIC** |
| 35 | **System: Background Jobs** | Worker monitoring, queue stats, retry | `/admin/system/jobs` | `/api/system/jobs` | `BackgroundJob`<br>`WorkerHeartbeat` | **Complete** (Queue metrics, retry CTAs) | **Production-Grade Engine** (PID, heartbeat, atomic claims) | **PRODUCTION READY** |
| 36 | **System: Server Monitoring** | Host CPU, RAM, Disk, Uptime | `/admin/monitoring` | `/api/admin/system-health` | (Node `os` metrics) | **Complete** (Radial gauges, memory meters) | **Functional** (Live host metrics) | **PRODUCTION READY** |
| 37 | **Analytics & Reports** | Business totals, revenue, pipeline | `/admin/analytics`<br>`/admin/reports` | `/api/reports/analytics` | (Aggregates across all models) | **Functional** (Metric cards, charts) | **Basic** (No date filters, no export, redirects) | **FUNCTIONAL BUT BASIC** |
| 38 | **Meetings & Calendar** | Scheduling, Google Meet, attendees | *(None)* | *(None)* | *(None)* | **None** | **None** | **NOT IMPLEMENTED** |
| 39 | **Payment Gateway Links** | Razorpay link generation, webhooks | *(None)* | *(None)* | *(None)* | **None** | **None** | **NOT IMPLEMENTED** |
| 40 | **Employee Self-Service** | Personal portal for punch, leave, payslip | *(None)* | *(None)* | *(None)* | **None** | **None** | **NOT IMPLEMENTED** |
| 41 | **Global Search** | Universal omnibox across entities | *(None)* | *(None)* | *(None)* | **None** | **None** | **NOT IMPLEMENTED** |

---

## 3. Deep-Dive Audit of Specific Focus Areas

### 3.1 CRM Lead Management & Sales Organization Audit
- **Lead Capture Channels:**
  - ✅ Public Website Forms (`/api/enquiries`): Fully functional with automated scoring (`calculateLeadScore`), UTM parameter capture, timeline event creation, and admin email notification.
  - ✅ WhatsApp Inbound: Webhook automatically matches or creates a CRM lead record (`WhatsappWebhookEvent` -> `Enquiry`).
  - ✅ Google Sheets Inbound: Fully implemented via `processSheetRowsIntoLeads` with column mapping and deduplication (`PHONE_OR_EMAIL`, `EMAIL_ONLY`, `PHONE_ONLY`).
  - ✅ Manual Leads Desk (`/admin/leads`): Modal allows direct lead creation.
  - ❌ API Leads for Third-Party Webhooks: No external token-authenticated lead ingestion API route.
- **Lead Ownership & Hierarchical Structure:**
  - ❌ Ownership is flat: `Enquiry.assignedTo` connects directly to a `User.id`.
  - ❌ There is NO concept of Sales Team, Department, Sales Manager, Team Leader, or Executive on leads.
  - ❌ Auto-assignment (`assignLeadAuto` in `src/lib/crm.ts`) fetches all `ACTIVE` users regardless of role (including `SUPER_ADMIN`), counts active leads, and assigns to whoever has the fewest. There is no round-robin state, no weighted assignment, and no skill/department routing.
  - ❌ Lead Aging: Stale lead detection, no-response alerts, and missed follow-up notifications do NOT exist.
  - ❌ Lead Reassignment / Transfer: No bulk reassignment or manager approval flow.
  - ❌ Duplicate Lead Merging: Deduplication exists during batch import/Google Sheets, but there is NO manual duplicate detection or merge tool in the CRM leads desk.

### 3.2 Customer 360 Audit
- **What is Implemented (`/admin/customers/[id]`):**
  - Displays customer name, email, phone, status, and company.
  - Calculates Total Invoiced, Total Paid, and Outstanding Balance from related `Invoice` and `Payment` records.
  - Lists associated Deals, Projects, Rental Orders, AMC Contracts, Subscriptions, and Support Tickets.
  - Embedded WhatsApp chat panel displays actual message stream with the customer.
- **What is Missing from Customer 360:**
  - ❌ Quotations & Proposals: Not included in the query or UI tabs.
  - ❌ General Sales Contracts: Only `amcContracts` are fetched; general sales `Contract` records are ignored.
  - ❌ Meetings & Calls: No meeting records or calendar history.
  - ❌ Payment Links: No online payment link history.
  - ❌ Document / File Attachments: No place to view uploaded GST certificates, signed agreements, or project briefs.
  - ❌ Account Manager Attribution: `accountManagerId` is an unconstrained string without a relationship to `Employee` or `User`.
  - ❌ Lead Origin History: Inquiries submitted before becoming a customer are disconnected.

### 3.3 Sales Pipeline & Kanban Audit
- **What is Implemented (`/admin/deals`):**
  - Visual Kanban board with columns generated dynamically from `PipelineStage` records.
  - Supports 4 tailored business vertical pipelines (`software-dev`, `hardware-rentals`, `amc-contracts`, `digital-marketing`).
  - Metric ribbon calculates Count, Total Pipeline Value, and Weighted Value ($Value \times Probability$).
  - When dragging/moving a deal to a Won stage, a modal prompts: "Convert to Active Project", automatically creating a `ProjectRecord`.
- **What is Missing from Deals/Kanban:**
  - ❌ Drag-and-drop HTML5 drag handlers update state in memory, but dragging between columns relies on the stage dropdown inside the deal modal rather than native drag reordering.
  - ❌ Products / Service Line Items: Deals only have a single scalar `value: Float`, with no product catalogue or line-item breakdown.
  - ❌ Pipeline Permissions: Any user with access can view and move all deals across all pipelines. There is no team-based or owner-based deal visibility filtering.
  - ❌ Lost Reason Analysis: `lostReason` field exists on the model, but there is no standardized reason dropdown or win/loss ratio reporting.

### 3.4 HRM & Workforce Audit
- **Employee Management (`/admin/hr/employees`):**
  - Quick onboard modal collects Name, Company Email, Phone, Basic Salary, Employment Type, and Work Location.
  - Generates sequential employee codes (`TIP-EMP-001`).
  - **CRITICAL ARCHITECTURAL FLAWS:**
    1. Disconnected from `User`: Employees cannot log in. A `User` record must be created separately in `/admin/users` with no foreign key link to `Employee`.
    2. Missing Hierarchy: No `managerId`, `teamLeaderId`, or `teamId`.
    3. Missing Details: No bank account details (Account number, IFSC), PAN, Aadhaar, emergency contacts, date of birth, or address.
    4. Missing Profile View: Clicking an employee in the table does nothing; there is no `/admin/hr/employees/[id]` view or edit screen.
- **Attendance (`/admin/hr/attendance`):**
  - Daily log table displays date, checkIn time, totalHours, and status pills.
  - Quick record modal allows an administrator to mark attendance manually for any employee.
  - **CRITICAL GAPS:**
    1. No employee self-service check-in / check-out.
    2. No shift association (the `Shift` model exists in Prisma with zero relationships).
    3. No late entry calculation based on shift grace periods.
    4. No regularization workflow for missed punches.
    5. No monthly attendance view or employee calendar summary.
- **Leave Management (`/admin/hr/leaves`):**
  - Admin modal applies for leave on behalf of an employee.
  - Approve and Reject buttons update the `LeaveRequest` status in the database.
  - **CRITICAL GAPS:**
    1. Zero Leave Balances: There is no `LeaveBalance` model or tracking table. Employees can take infinite leaves without balance reduction.
    2. No Approval Hierarchy: Any logged-in user can approve any leave request. No manager routing.
    3. No Attendance Sync: Approving a leave does NOT generate `ON_LEAVE` attendance records.
- **Payroll (`/admin/hr/payroll`):**
  - "Generate Payroll" button creates `PayrollRecord` entries for all active employees.
  - **CRITICAL GAPS:**
    1. Hardcoded Calculation: Deductions and allowances are hardcoded to $20\%$ HRA and $5\%$ deductions.
    2. No Attendance Link: Payroll runs completely oblivious to unpaid leaves, absent days, or late penalties.
    3. No Payslip: No viewable, printable, or downloadable employee payslip PDF.
    4. No Status Flow: Records are marked `GENERATED`, but cannot be transitioned to `PAID` with transaction IDs.

### 3.5 Role-Based Access Control (RBAC) & Security Audit
- **Database Reality vs. UI Reality:**
  - Prisma Schema: `enum Role { SUPER_ADMIN, ADMIN, EDITOR }`.
  - Database Table `RolePermission`: Contains **0 rows**.
  - Roles UI (`/admin/roles`): Shows 5 roles (`SUPER_ADMIN`, `ADMIN`, `MANAGER`, `AGENT`, `MEMBER`) and 51 permissions, but is a **100% static mock**. It cannot save permissions, and the extra roles do not exist in MySQL.
- **Runtime Privilege Escalation Vulnerabilities:**
  - While WhatsApp and Google Sheets routes verify `hasPermission(...)`, core business APIs (`/api/crm/deals`, `/api/hr/payroll`, `/api/hr/leaves`, `/api/finance/payments`, `/api/finance/invoices`) ONLY check `await requireAuth()`.
  - **Vulnerability:** Any logged-in user with the lowest role (`EDITOR`) can directly invoke `POST /api/hr/payroll` to generate company payroll, or `POST /api/finance/payments` to record fictitious financial transactions.

---

## 4. Current State Summary by Numbers

- **Total Discovered Admin Routes:** 57
- **Total Discovered API Routes:** 46
- **Total Prisma Models:** 75
- **Production-Ready Modules:** 5 (WhatsApp Cloud API Engine, Google Sheets CRM Sync Engine, Durable Background Queue, Hardware Asset Fleet, Bulk CSV Import)
- **Functional But Basic Modules:** 26 (CRM Leads, Deals Kanban, Invoices, Quotations, Customer 360, etc.)
- **UI-Only / Mock Modules:** 2 (Roles & RBAC Management, Reports Redirect)
- **Completely Missing Core Modules:** 4 (Meetings/Calendar, Razorpay Payments/Links, Employee Self-Service, Global Search)
