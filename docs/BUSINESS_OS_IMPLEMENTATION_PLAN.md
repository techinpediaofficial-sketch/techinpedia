# TechInPedia Business OS — Master Implementation Plan
**Document:** `docs/BUSINESS_OS_IMPLEMENTATION_PLAN.md`  
**Target:** Production-Grade Internal Business Operating System  

---

## 1. Architectural Strategy & Phased Roadmap

To progressively elevate the TechInPedia backoffice into a full-scale Business OS without disrupting ongoing agency operations or database integrity, development is structured into **18 distinct phases**.

```
[Phase 0: Audit & Architecture] (Completed)
       ↓
[Phase 1: RBAC 2.0 & Navigation Modernization]
       ↓
[Phase 2: CRM Core Engine (Leads, Custom Fields, Tags, Scoring)]
       ↓
[Phase 3: Contacts, Companies & Customer 360 View]
       ↓
[Phase 4: Sales Pipeline, Kanban Deals & Follow-Up Engine]
       ↓
[Phase 5: WhatsApp Cloud API, Email CRM & Unified Inbox]
       ↓
[Phase 6: Google Sheets Sync & Lead Import/Export Hub]
       ↓
[Phase 7: Workflow Automation Engine (Triggers, Conditions, Actions)]
       ↓
[Phase 8: Quotations, Proposals & Contract Management]
       ↓
[Phase 9: Invoices, Payments & Expense Tracking]
       ↓
[Phase 10: Projects, Milestones, Tasks & Timesheets]
       ↓
[Phase 11: HRM Core (Employees, Attendance, Leaves, Holidays, Shifts, Payroll)]
       ↓
[Phase 12: Recruitment / ATS, Performance Reviews & HR Documents]
       ↓
[Phase 13: Support Ticket Desk, SLAs & Knowledge Base]
       ↓
[Phase 14: IT Hardware Rental Asset Management & AMC Contracts]
       ↓
[Phase 15: SaaS Product Catalog, Subscriptions & Software Licensing]
       ↓
[Phase 16: Executive Analytics, Custom Reports & Marketing Attribution]
       ↓
[Phase 17: Security Hardening, Command Palette (Cmd+K) & Global Search]
       ↓
[Phase 18: End-to-End Verification & Production Readiness]
```

---

## 2. Detailed Phase Specifications

### Phase 1: RBAC 2.0 & Admin Navigation
- **Database:**
  - `Permission`: Unique permission codes (e.g. `crm.leads.view`, `crm.leads.create`, `sales.invoice.manage`, `hr.employee.salary.view`).
  - `RolePermission`: Many-to-many relationship mapping roles to permissions.
  - `UserRole`: Assignment of users to roles, with optional data-scope overrides (`ALL`, `TEAM`, `OWN`).
- **Backend:**
  - Centralized permission check helper: `hasPermission(session, 'crm.leads.create')`.
  - Middleware route protection in `src/middleware.ts` for `/admin/*` and `/api/admin/*`.
- **UI:**
  - Update `AdminSidebar.tsx` to group into logical sections: **CRM, Communication, Sales, Projects, HRM, Support, Hardware/Rental, SaaS, Finance, Marketing, Automation, Reports, Content, Administration**.
  - Permission-aware navigation filtering.

### Phase 2: CRM Core Engine (Leads, Custom Fields, Tags, Scoring)
- **Database:**
  - Expand `Enquiry` into a comprehensive `Lead` model (or extend `Enquiry` with rich fields: temperature `COLD`/`WARM`/`HOT`, priority `LOW`..`URGENT`, score, value, address, alternate phone, assigned salesperson).
  - `CustomFieldDefinition` & `CustomFieldValue`: Dynamic fields without schema changes.
  - `Tag` & `EntityTag`: Polymorphic tagging system.
- **Backend:**
  - Configurable lead scoring evaluator (website form submission = +10, demo request = +25, valid company email = +15, bounced/invalid = -20).
  - Automated round-robin or service-based lead assignment.
- **UI:**
  - Advanced lead management table with column toggling, multi-criteria filters, and server-side pagination.

### Phase 3: Contacts, Companies & Customer 360 View
- **Database:**
  - `Company`: Multi-contact organization entity (`name`, `industry`, `domain`, `phone`, `address`, `gstNumber`).
  - `Contact`: Individuals linked to companies (`firstName`, `lastName`, `email`, `phone`, `jobTitle`).
  - `Customer`: Converted account entity holding lifetime value, account manager, and links to deals, invoices, and assets.
- **UI:**
  - `/admin/customers/[id]`: Unified **Customer 360** with tabbed navigation: Overview, Contacts, Deals, Projects, Invoices, Subscriptions, Rentals, Tickets, Documents, and Notes.

### Phase 4: Sales Pipeline, Kanban Deals & Follow-Up Engine
- **Database:**
  - `Pipeline` & `PipelineStage`: Configurable multi-pipeline stages (e.g., Software Development vs. IT Rental vs. Marketing).
  - `Deal`: Value, probability, expected close date, owner, stage history.
  - `FollowUp`: Reminder date/time, type (`CALL`, `WHATSAPP`, `EMAIL`, `MEETING`, `DEMO`), status (`PENDING`, `COMPLETED`, `MISSED`, `RESCHEDULED`).
- **UI:**
  - Drag-and-drop Kanban pipeline board with column totals, weighted pipeline value calculation, and quick stage transitions.
  - Follow-up calendar widget on the admin dashboard.

### Phase 5: WhatsApp Cloud API, Email CRM & Unified Inbox
- **Database:**
  - `WhatsAppAccount`: Phone number ID, WhatsApp Business Account ID, webhook verification token, access token.
  - `Conversation` & `ConversationMessage`: Universal channel messaging (`WHATSAPP`, `LIVE_CHAT`, `EMAIL`).
- **Backend:**
  - Official Meta Webhook verification (`hub.verify_token`, `hub.challenge`) and HMAC signature validation (`X-Hub-Signature-256`).
  - Message ingestion, contact resolution, and auto-lead creation.
- **UI:**
  - `/admin/inbox`: 3-pane unified communication desk (left: conversations list, center: chat feed, right: live CRM contact drawer with quick lead conversion).

### Phase 6: Google Sheets Sync & Lead Import/Export Hub
- **Database:**
  - `SheetIntegration`: Spreadsheet ID, tab name, column mappings, sync schedule, last sync timestamp, status.
- **Backend:**
  - Google Sheets API integration via Service Account credentials.
  - Bi-directional sync with deduplication logic (`email`, `phone`, `whatsapp`).
  - CSV / XLSX upload parser with interactive preview, column mapping, and import validation report.

### Phase 7: Workflow Automation Engine
- **Database:**
  - `WorkflowRule`: Trigger event (`LEAD_CREATED`, `STAGE_CHANGED`, `INVOICE_OVERDUE`), Conditions (JSON), Actions (JSON), active toggle.
  - `WorkflowExecution`: Run log, status (`SUCCESS`, `FAILED`), retry count, execution context.
- **Backend:**
  - Decoupled event dispatcher with infinite loop protection, timeout limits, and idempotency keys.

### Phase 8: Quotations, Proposals & Contract Management
- **Database:**
  - `Quotation` & `QuotationItem`: Rate, quantity, tax, discount, total, terms, expiry.
  - `Proposal`: Multi-section rich builder (Cover, Scope, Deliverables, Pricing, Timeline).
  - `Contract`: Start/end dates, value, auto-renewal alerts, attached PDF agreements.
- **UI:**
  - Interactive quotation and proposal builder with print/PDF layout.

### Phase 9: Invoices, Payments & Expense Tracking
- **Database:**
  - `Invoice` & `InvoiceItem`: Due date, subtotal, tax rate, discount, amount paid, balance.
  - `Payment`: Reference ID, method (`BANK_TRANSFER`, `UPI`, `CARD`, `CHEQUE`), recorded by.
  - `Expense`: Category, vendor, receipt upload, employee claim, approval status.
- **Backend:**
  - Automatic invoice balance updates on payment recording inside atomic transactions.

### Phase 10: Projects, Milestones, Tasks & Timesheets
- **Database:**
  - `ProjectRecord`: Customer relation, manager, budget, dates, status (`PLANNING`, `ACTIVE`, `COMPLETED`).
  - `Milestone`: Due date, percentage completion.
  - `Task`: Assignee, priority, status (`TODO`, `IN_PROGRESS`, `REVIEW`, `DONE`), estimated hours.
  - `Timesheet`: Employee, project, task, date, duration, billable flag.
- **UI:**
  - Project task Kanban view, milestone progress bars, and weekly employee timesheet entry form.

### Phase 11: HRM Core
- **Database:**
  - `Employee`: Employee code, department, designation, manager, joining date, employment type, salary structure.
  - `AttendanceRecord`: Date, check-in, check-out, total hours, status (`PRESENT`, `LATE`, `HALF_DAY`, `ABSENT`).
  - `LeaveRequest`: Leave type, dates, reason, manager approval status.
  - `Holiday` & `Shift`: Shift timings, grace period, weekly offs, company holidays.
  - `PayrollRecord`: Basic, allowances, deductions, net salary, payslip generation.

### Phase 12: Recruitment / ATS & Performance Management
- **Database:**
  - `JobOpening`, `Candidate`, `JobApplication`, `InterviewRound`, `InterviewFeedback`.
  - `PerformanceReview`: KPI goals, manager feedback, ratings.
  - `EmployeeDocument`: Encrypted/protected file records (appointment letter, ID, payslips).

### Phase 13: Support Ticket Desk, SLAs & Knowledge Base
- **Database:**
  - `SupportTicket`: Customer relation, subject, description, priority, category, SLA due date, assigned agent, status.
  - `TicketComment`: Public reply vs. internal team note.
  - `KnowledgeArticle`: Categories, tags, visibility (`INTERNAL`, `CUSTOMER`, `PUBLIC`).

### Phase 14: IT Hardware Rental Asset Management & AMC Contracts
- **Database:**
  - `RentalAsset`: Serial number, brand, model, specs, purchase cost, status (`AVAILABLE`, `RENTED`, `MAINTENANCE`, `RETIRED`).
  - `RentalOrder` & `RentalOrderItem`: Customer, allocated assets, rental tenure, monthly rate, security deposit.
  - `AMCContract`: Customer, covered assets, SLA response time, quarterly visit schedule, renewal reminder.
  - `AssetMaintenance`: Repair logs, issue description, parts cost, assigned technician.

### Phase 15: SaaS Product Catalog, Subscriptions & Licensing
- **Database:**
  - `SaaSProduct` & `SaaSPlan`: Plan billing frequency (Monthly, Quarterly, Annual, Lifetime).
  - `SaaSSubscription`: Customer, product, plan, start/renewal date, auto-renew flag, status (`ACTIVE`, `PAST_DUE`, `EXPIRED`).
  - `SoftwareLicense`: Cryptographically generated license key, domain/device activations limit, activation status.

### Phase 16: Executive Analytics, Reports & Marketing Attribution
- **Features:**
  - Real-time aggregation of Revenue, Outstanding, Pipeline value, Won/Lost deals, Lead conversion rate by source/campaign.
  - Automated UTM tracking from public website inquiries into revenue attribution reports.
  - Exportable CSV/XLSX summaries for CRM, Finance, Projects, and HRM.

### Phase 17: Security Hardening, Command Palette & Global Search
- **Features:**
  - Keyboard-accessible Command Palette (`Cmd+K` / `Ctrl+K`) for instantaneous navigation and rapid action execution.
  - Global indexed search across Leads, Customers, Deals, Invoices, Employees, Assets, and Tickets.
  - Strict CSRF protection, HttpOnly cookies, server-side data visibility filters (`ALL`, `TEAM`, `OWN`), rate limiting.

### Phase 18: End-to-End Verification & Documentation
- **Verification:**
  - Run the full simulated business journey: Visitor inquiry -> Lead -> Deal -> Quotation -> Customer -> Project -> Invoice -> Payment -> Support Ticket -> Asset Return.
  - Full TypeScript compilation (`tsc --noEmit`), build verification, and clean documentation in `docs/`.
