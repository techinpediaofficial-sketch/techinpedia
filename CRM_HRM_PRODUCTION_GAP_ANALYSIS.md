# TECHINPEDIA BUSINESS OS — CRM & HRM PRODUCTION GAP ANALYSIS

**Document Version**: 1.0.0  
**Audit Target**: Internal Business Operating System (~100 Employees)  
**Date**: September 18, 2026  
**Auditor**: Antigravity Core Architecture Team  
**Scope**: Codebase, MySQL Database Schema, API Endpoints, Role/Permission Layer, and UI Workflows  

---

## 1. Executive Summary & Methodology

This gap analysis provides an exhaustive evaluation of the existing CRM, HRM, and supporting business operational modules in TechInPedia. Every functional capability has been verified directly against:
1. The active Prisma schema (`prisma/schema.prisma` — 1,731 lines, 75 tables)
2. Live production MySQL schema (`<SERVER_USER>_techinpedianew` on VPS `<SERVER_IP>`)
3. Next.js App Router API endpoints (`src/app/api/**`)
4. Admin UI implementation and server actions (`src/app/admin/**`)
5. Permissions engine (`src/lib/permissions.ts`) and background queue infrastructure (`src/lib/queue/**`)

### Classification Taxonomy
- **P0 — Required for Professional Production**: Critical blockers. Absence causes operational failure, data integrity loss, privacy breach, or inability for an organization of 100 people to operate.
- **P1 — Important**: High-value capabilities needed for manager oversight, accountability, reporting accuracy, and daily operational efficiency.
- **P2 — Useful Later**: Advanced enhancements that add polish or automation but can wait until the foundation is solid.
- **NOT NEEDED — Unnecessary Complexity**: Enterprise ERP/SAP-style overhead (e.g., multi-tier nested cost centers, complex biometric SDK integrations, multi-entity tax treaty consolidation) that introduces friction for a 100-person company.

---

## 2. Global Architectural & Security Gaps

| Area | Current Codebase State | Reality & Vulnerability | Production Impact | Priority |
| :--- | :--- | :--- | :--- | :---: |
| **User vs. Employee Silo** | `User` table (auth, roles) is completely decoupled from `Employee` table (HR). No foreign key exists. | An employee cannot log in to see their attendance or submit leaves; an admin cannot assign a lead or task to an authenticated employee record. | Complete breakdown of self-service, ownership, and audit trail attribution. | **P0** |
| **Organizational Hierarchy** | Only `Department` exists. No `Team` model, no `managerId` / `reportingToId`, no `headOfDepartmentId`. | Hardcoded flat org structure. Cannot model Sales Team A vs Sales Team B, cannot identify reporting managers for leave/task escalation. | Managers cannot oversee their teams without becoming full system Admins. | **P0** |
| **RBAC Enforcement Gap** | `User.role` is a rigid 3-value enum (`SUPER_ADMIN`, `ADMIN`, `EDITOR`). `/admin/roles` displays 5 roles and 51 permissions, but is a 100% static client mock. `RolePermission` table has 0 rows. | Core APIs (`/api/crm/deals`, `/api/hr/payroll`, `/api/hr/leaves`, `/api/finance/payments`) only verify `requireAuth()`. Any authenticated user with an `EDITOR` role can execute company payroll or alter deal pipelines. | Severe privilege escalation risk; violation of employee compensation privacy. | **P0** |
| **Audit Logging Coverage** | `AuditLog` model exists with basic action strings, but core mutation APIs (deal drag-and-drop, leave approval, payroll generation, employee status change) do NOT log `before` and `after` snapshots. | Inability to determine who modified an employee's salary, who approved an irregular attendance, or who reassigned a high-value deal. | Inability to investigate operational disputes or compliance audits. | **P0** |
| **Global Omnibox Search** | No cross-entity search API. Each table (contacts, deals, employees) has isolated single-column filters. | Staff must navigate to 6 different tabs to locate a customer, their active deal, their company, and their assigned employee. | Severe workflow friction and slow administrative turnaround. | **P1** |

---

## 3. CRM Module Gap Analysis

### 3.1 Lead Management & Capture

| Feature / Requirement | Current Implementation State | Production Gap & Technical Findings | Priority |
| :--- | :--- | :--- | :---: |
| **Lead & Enquiry Unification** | Both `Enquiry` and `Lead` models exist. Both `/admin/enquiries` and `/admin/leads` exist, both querying `/api/enquiries`. Sidebar only shows "Inquiries". | Conceptual fragmentation. Marketing inquiries and sales leads are split into two parallel tables with overlapping fields (`service`, `budget`, `status`). | **P0** |
| **Multi-Channel Capture** | Manual form, Google Sheets integration, and inbound WhatsApp webhook exist. | No unified deduplication on email/phone across channels. Webhook leads do not automatically tag marketing UTM parameters. | **P1** |
| **Lead Ownership Hierarchy** | `Lead.assignedToId` links directly to a `User`. No department, team, team leader, or manager ownership. | High-tier managers cannot view "Leads in Team A" vs "Leads in Team B". Leads cannot be assigned to an employee profile. | **P0** |
| **Lead Stages & Qualification** | `EnquiryStatus`: `NEW`, `CONTACTED`, `QUALIFIED`, `IN_PROGRESS`, `CONVERTED`, `REJECTED`, `SPAM`. `LeadStatus`: `NEW`, `CONTACTED`, `QUALIFIED`, `PROPOSAL_SENT`, `NEGOTIATION`, `WON`, `LOST`. | Two conflicting sets of stage enums across tables. No formal "Disqualification / Lost Reason" capture modal. | **P0** |
| **Round Robin & Assignment Logic** | `assignLeadAuto` in `src/lib/crm.ts` picks the active user with the lowest lead count. | Completely ignores department, working shifts, sales rep availability, or service specialization. No weighted or least-loaded rules. | **P1** |
| **Follow-up Scheduling & Overdue Tracking** | Follow-up datetime exists on `Enquiry`, but no dedicated `FollowUp` task engine. | No overdue badge indicators, no automated manager escalation when a sales rep ignores a follow-up for >48 hours. | **P0** |
| **Lead Aging & Stale Detection** | No database queries or background jobs compute lead velocity or idle days. | Stale leads sit in "NEW" or "CONTACTED" indefinitely without automated alerts or recycling back to the general pool. | **P1** |
| **Duplicate Detection & Merge** | Basic duplicate check during Google Sheets sync only. No manual or automated deduplication in admin UI. | Reps can create duplicate leads with identical phones/emails, leading to conflicting client communications. | **P1** |
| **Lead Scoring** | Hardcoded numerical score field on `Lead` model without dynamic rules. | Score is manually edited rather than computed based on engagement (email opens, WhatsApp replies, budget size). | **P2** |
| **AI Predictive Lead Scoring** | None. | Machine learning scoring is unnecessary bloat for ~100 employees. Rule-based scoring is sufficient. | **NOT NEEDED** |

---

### 3.2 Customer 360 & Contact Management

| Feature / Requirement | Current Implementation State | Production Gap & Technical Findings | Priority |
| :--- | :--- | :--- | :---: |
| **Customer 360 Unified Record** | `/admin/crm/customers/[id]` exists and renders Contacts, Deals, Support Tickets, Projects, and Invoices. | **Missing Critical Entities**: Does not link Quotations, Proposals, Sales Contracts, Meetings, Payment Links, or WhatsApp conversations. | **P0** |
| **Account Manager Attribution** | `Customer.accountManagerId` is an unconstrained string with no foreign key relation to `User` or `Employee`. | Broken relation integrity; account manager names cannot be populated reliably or filtered by department. | **P0** |
| **Company & Multi-Contact Hierarchy** | `Company` model exists with 1-to-many `Contact` and `Deal` relations. | No primary contact designation flag; no organizational chart or decision-maker tagging within a company. | **P1** |
| **Unified Activity Timeline** | Timeline merges deals and invoices chronologically in the client component. | Timeline does not capture manual notes, phone call logs, meeting summaries, or automated webhook events. | **P0** |
| **Document / Attachment Vault** | Only deals have a generic file attachment field. | Customer record has no centralized repository for NDA, Tax Certificates, GST documents, or Brand Guidelines. | **P1** |

---

### 3.3 Sales Pipeline & Deals

| Feature / Requirement | Current Implementation State | Production Gap & Technical Findings | Priority |
| :--- | :--- | :--- | :---: |
| **Deal Pipeline & Stages** | `DealPipeline` and `DealStage` models exist with drag-and-drop Kanban UI. | Stage probability ($0-100\%$) is stored in the database but **not factored** into weighted pipeline revenue forecasts. | **P1** |
| **Deal Stage Audit Trail** | Deals update `stageId` in `/api/crm/deals/[id]` without recording a `DealStageHistory` row. | Cannot measure sales cycle length, time-in-stage bottlenecks, or rep conversion velocity. | **P0** |
| **Won / Lost Flow & Conversion** | Deal status updates to `WON` or `LOST` with a single click. | No mandatory "Lost Reason" selection (e.g., Price, Competitor, Feature Gap) and no automated trigger to create a delivery Project upon `WON`. | **P0** |
| **Deal Products & Services Line Items** | Deal has a single aggregate `value` and `currency`. No `DealItem` or service breakdown. | Rep cannot specify that a \$10,000 deal includes \$6,000 Web App, \$2,000 Design, and \$2,000 Annual Hosting. | **P1** |
| **Sales Target vs. Achievement** | `SalesTarget` model exists with target amount and period. | Target is calculated against raw deal values without filtering by payment realization or department quota. | **P1** |
| **Complex Multi-Currency Hedging** | Single currency stored per deal. | Complex multi-currency exchange hedging is not needed. Simple INR/USD conversion is sufficient. | **NOT NEEDED** |

---

### 3.4 Proposals, Quotations & Sales Contracts

| Feature / Requirement | Current Implementation State | Production Gap & Technical Findings | Priority |
| :--- | :--- | :--- | :---: |
| **Quotation & Proposal Management** | Models exist (`Quotation`, `Proposal`) with PDF export templates. | Disconnected from Customer 360 and Leads. Changing a quote does not reflect in deal expected revenue. | **P1** |
| **E-Signature & Client Approval** | Client view page with token link exists. | Missing formal IP/timestamp audit log of client acceptance. | **P2** |
| **Sales Contract Lifecycle** | `ClientContract` model exists under Project management, but no pre-sales contract template. | Contracts are created only post-project, leaving pre-sales agreements disconnected from Deals. | **P1** |

---

## 4. HRM Module Gap Analysis

### 4.1 Employee Directory & Organizational Structure

| Feature / Requirement | Current Implementation State | Production Gap & Technical Findings | Priority |
| :--- | :--- | :--- | :---: |
| **Employee & User Identity Link** | `Employee` table has `email`, `departmentId`, `designationId`. Zero link to `User.id`. | Employees cannot authenticate; admins must create a separate `User` with no link to HR records. | **P0** |
| **Department & Team Hierarchy** | Flat `Department` list. No `Team` model, no `headOfDepartmentId`, no `managerId` on `Employee`. | Cannot structure `Sales -> Team Alpha (Lead: Jane) -> Execs (John, Dave)`. Approvals cannot auto-route. | **P0** |
| **Employee Lifecycle Tracking** | `employmentType` and `status` exist (`ACTIVE`, `ON_LEAVE`, `TERMINATED`). | No probation end date, confirmation date, notice period tracking, or exit interview recording. | **P0** |
| **Bank Details & Statutory Data** | `bankDetails` JSON column exists on `Employee`. | Not encrypted at rest; lacks formal fields for PAN, Aadhaar, PF/UAN, or ESIC for Indian regulatory payroll. | **P1** |
| **Emergency Contacts & Documents** | `documents` JSON column exists. | No file upload interface for employee ID proofs, educational degrees, or signed offer letters. | **P1** |
| **Complex Multi-Entity Transfer** | Single company context. | Multi-company cross-entity tax transfers are unnecessary bloat for a 100-person organization. | **NOT NEEDED** |

---

### 4.2 Attendance, Shifts & Regularization

| Feature / Requirement | Current Implementation State | Production Gap & Technical Findings | Priority |
| :--- | :--- | :--- | :---: |
| **Check-In & Check-Out Tracking** | `Attendance` model only stores `date`, `status` (`PRESENT`, `ABSENT`, `HALF_DAY`, `ON_LEAVE`), and `workHours`. | No `checkInTime` or `checkOutTime` timestamps. Records are logged once per day manually by HR. | **P0** |
| **Employee Self-Service Clock In/Out** | Completely absent. | Employees cannot punch in/out from their desktop or mobile browser. | **P0** |
| **Late Entry & Early Exit Calculation** | Not supported. | Without punch timestamps, the system cannot detect tardiness, half-day threshold breaches, or overtime. | **P0** |
| **Work Shifts & Weekly Offs** | Zero models for `Shift`, `ShiftAssignment`, or `HolidayCalendar`. | System assumes a single implicit 9-5 shift Monday-Friday. Weekend shifts or rotating support teams cannot be scheduled. | **P1** |
| **Attendance Regularization Workflow** | Completely absent. | If an employee forgets to clock in or attends an off-site client meeting, they cannot request regularized approval from their manager. | **P0** |
| **HR Correction with Audit Trail** | HR can edit attendance via `/api/hr/attendance` with zero change justification or audit logging. | Prone to dispute and lack of historical accountability. | **P1** |
| **Biometric / Geofencing Hardware SDK** | None. | Dedicated hardware biometric sync is unnecessary friction; web-based timestamped clock-in with IP logging is standard and practical. | **NOT NEEDED** |

---

### 4.3 Leave Management & Approvals

| Feature / Requirement | Current Implementation State | Production Gap & Technical Findings | Priority |
| :--- | :--- | :--- | :---: |
| **Leave Balance Tracking** | No `LeaveBalance` model exists in the database. | The system cannot enforce annual entitlements (e.g., 18 Paid Leaves, 12 Casual Leaves). Reps can request infinite leaves. | **P0** |
| **Hierarchical Approval Flow** | `LeaveRequest` only has `approvedById` (unconstrained string). | Bypasses reporting managers. HR is forced to manually review every single leave request for 100 people. | **P0** |
| **Attendance Synchronization** | Approving a `LeaveRequest` does NOT create or update the corresponding `Attendance` record. | Approved leaves appear as "ABSENT" in monthly attendance reports, distorting payroll deductions. | **P0** |
| **Half-Day & Hourly Leaves** | `LeaveRequest` has `startDate` and `endDate` only. | No half-day (First Half / Second Half) selection for casual day-to-day leaves. | **P1** |
| **Leave Calendar & Team Conflicts** | Team lead cannot view overlapping leave requests on a shared team calendar. | Risk of entire support or sales shifts being unstaffed simultaneously. | **P1** |
| **Carry Forward & Accrual Rules** | No automated scheduler to accrue monthly leave or carry forward balances at year-end. | Requires manual HR database intervention annually. | **P2** |

---

### 4.4 Payroll & Compensation Management

| Feature / Requirement | Current Implementation State | Production Gap & Technical Findings | Priority |
| :--- | :--- | :--- | :---: |
| **Attendance-Driven Payroll** | `/api/hr/payroll` runs a hardcoded formula: `allowances = baseSalary * 0.2`, `deductions = baseSalary * 0.05`. | **Zero link to actual attendance or unpaid leaves**. An employee absent for 20 days receives 100% full salary. | **P0** |
| **Salary Structure Breakdown** | `SalaryStructure` has flat `basicSalary`, `allowances`, `deductions`. | Lacks standardized components: Basic (50%), HRA (40-50%), Special Allowance, PF deduction, Professional Tax (PT). | **P1** |
| **Monthly Payroll Lifecycle** | Payroll records are created directly as `PENDING` or `PAID`. | No formal stage gates: `DRAFT -> REVIEWED (by Manager/Finance) -> APPROVED -> LOCKED -> DISBURSED`. | **P0** |
| **Payslip PDF Generation** | `/admin/hr/payroll` has a simple view; no downloadable or emailed Payslip PDF. | Employees cannot obtain proof of income for banking, loans, or taxation. | **P0** |
| **Reimbursements & Expense Claims** | Isolated `Expense` table under finance; not linked to employee monthly payroll run. | Approved travel or client entertainment expenses must be manually tallied and paid outside payroll. | **P1** |
| **Salary Revision History** | Modifying `baseSalary` overwrites the current value with no historical revision log. | Cannot track annual appraisals, promotional increments, or effective date transitions. | **P1** |
| **Full Double-Entry Accounting ERP** | None. | Building general ledgers, journal entries, and balance sheets inside TechInPedia is unnecessary overhead. Standard HR payroll is all that is required. | **NOT NEEDED** |

---

### 4.5 Performance, Assets & Lifecycle

| Feature / Requirement | Current Implementation State | Production Gap & Technical Findings | Priority |
| :--- | :--- | :--- | :---: |
| **Sales Target & KPI Integration** | Isolated `SalesTarget` table. | Not linked to employee appraisals or variable incentive calculation. | **P1** |
| **Performance Review Cycles** | `PerformanceReview` model exists with self/manager rating. | No structured quarterly review cycles, 360 peer reviews, or approval sign-offs. | **P2** |
| **Asset / Laptop Management** | `Asset` model exists (`SERIAL_NUMBER`, `ASSIGNED_TO`). | Basic tracking is functional; lacks digital handover acknowledgement or return checklist. | **P2** |
| **Onboarding & Offboarding Checklists** | Completely absent. | No structured checklist for IT asset allocation, email setup, document collection, or exit clearances. | **P1** |
| **Grievances & Internal Inquiries** | Completely absent. | No confidential whistleblowing or HR complaint ticketing system. | **P2** |

---

## 5. Portals & Role-Based Dashboards Gap Analysis

### 5.1 Employee Self-Service (ESS)

| Feature / Requirement | Current Implementation State | Production Gap & Technical Findings | Priority |
| :--- | :--- | :--- | :---: |
| **Dedicated Employee Portal** | Non-existent. Non-admin users are dropped into `/admin` where they see empty data or forbidden errors. | Regular employees cannot see their own tasks, attendance, leaves, or payslips in a clean, restricted view. | **P0** |
| **My Attendance Dashboard** | Absent. | Cannot view monthly attendance percentage, clock in/out, or view regularizations. | **P0** |
| **My Leave & Balance Portal** | Absent. | Cannot view remaining casual/sick leaves or track approval status. | **P0** |
| **My Assigned Work** | `/admin/tasks` lists all tasks. | No personalized "My Tasks & Deadlines" view filtered strictly to the logged-in employee. | **P1** |
| **My Documents & Payslips** | Absent. | Cannot download monthly payslips or upload compliance documents. | **P0** |

---

### 5.2 Manager & Team Leader Dashboard

| Feature / Requirement | Current Implementation State | Production Gap & Technical Findings | Priority |
| :--- | :--- | :--- | :---: |
| **Team Oversight View** | Absent. | Managers have no view to see "Who in my team is present today?" or "Who is on leave?". | **P0** |
| **Pending Approval Queue** | Absent. | Managers cannot review, approve, or reject team leave requests or attendance corrections from a single hub. | **P0** |
| **Team Performance & Deals** | Deal Kanban shows all deals or none. | Sales Managers cannot filter pipelines specifically by their direct reporting executives. | **P1** |
| **Overdue Work & Escalations** | Absent. | No automated summary of overdue tasks or missed lead follow-ups across the team. | **P1** |

---

### 5.3 HR & Senior Management Dashboards

| Feature / Requirement | Current Implementation State | Production Gap & Technical Findings | Priority |
| :--- | :--- | :--- | :---: |
| **HR Daily Operations Hub** | `/admin/hr` renders total headcount and basic department cards. | Lacks daily operational metrics: Present Today, Absent Today, On Leave, Late Today, Pending Regularizations. | **P0** |
| **HR Lifecycle Alerts** | Absent. | No notifications for Upcoming Probations Ending, Work Anniversaries, or Expiring Contracts. | **P1** |
| **Executive Management Hub** | `/admin` has high-level counts. | Lacks holistic executive health: Realized Revenue vs Pipeline Value, Outstanding Invoices, Active vs Delayed Projects. | **P1** |

---

## 6. Integration Gaps: Razorpay & Google Calendar

### 6.1 Payment Links & Razorpay

| Feature / Requirement | Current Implementation State | Production Gap & Technical Findings | Priority |
| :--- | :--- | :--- | :---: |
| **Payment Link Data Model** | Completely absent. No `PaymentLink` table in Prisma. | Inability to issue shareable payment requests tied to Deals, Invoices, or Leads. | **P0** |
| **Employee Attribution** | Absent. | Inability to track which sales executive generated a payment link, which manager approved it, and which team gets credit. | **P0** |
| **Official Razorpay API & SDK** | `razorpay` package is not installed; no API route exists for generating order/link. | Cannot interface with official Razorpay APIs. | **P0** |
| **Webhook Engine & Verification** | No Razorpay webhook route; no HMAC-SHA256 signature verification. | Payments cannot be verified asynchronously; dangerous reliance on client callbacks would cause fraud. | **P0** |
| **Payment Link UI Integration** | Customer 360, Invoices, and Deals have no "Generate Payment Link" modal. | Staff cannot quickly generate and copy WhatsApp-friendly payment links. | **P0** |
| **Payment Status Lifecycle** | `Payment` model only supports manual status strings without provider reference. | Missing standardized lifecycle: `CREATED`, `SENT`, `PAID`, `EXPIRED`, `CANCELLED`, `FAILED`. | **P0** |

---

### 6.2 Meetings & Google Calendar

| Feature / Requirement | Current Implementation State | Production Gap & Technical Findings | Priority |
| :--- | :--- | :--- | :---: |
| **Meeting Data Model** | Completely absent. Zero models in Prisma schema. | Cannot record client meetings, schedule demo calls, or link conversations to Leads/Customers. | **P0** |
| **Google Calendar API Integration** | No Google Calendar API client or OAuth token management. | Cannot synchronize events, check rep availability, or auto-generate Google Meet conference links. | **P1** |
| **Multi-Channel Invitations** | Absent. | Cannot dispatch automated calendar invites (`.ics`) to external clients and internal team members. | **P1** |
| **Meeting Outcome & Notes** | Absent. | Sales reps cannot log call outcomes (Completed, Rescheduled, No Show) or record next action items directly in the CRM. | **P0** |

---

## 7. Priority Matrix Summary

```mermaid
quadrantChart
    title Feature Priority vs Operational Value
    x-axis Low Operational Value --> High Operational Value
    y-axis Low Urgency --> Immediate Blocker (P0)
    quadrant-1 Immediate Production Essentials (P0)
    quadrant-2 High Value Foundation (P0/P1)
    quadrant-3 Useful Later / Polish (P2)
    quadrant-4 Unnecessary ERP Bloat (Not Needed)
    "User <-> Employee Link": [0.95, 0.98]
    "Dynamic RBAC & Permissions": [0.92, 0.95]
    "Punch In/Out Attendance": [0.88, 0.92]
    "Attendance-Driven Payroll": [0.90, 0.90]
    "Leave Balance System": [0.85, 0.88]
    "Razorpay Payment Links": [0.89, 0.85]
    "Meeting System & Notes": [0.82, 0.82]
    "Customer 360 Completeness": [0.80, 0.80]
    "Team & Org Hierarchy": [0.87, 0.86]
    "Employee Self Service": [0.84, 0.83]
    "Google Calendar Sync": [0.70, 0.65]
    "Lead Stale Aging": [0.65, 0.60]
    "Quotation E-Signature": [0.45, 0.35]
    "Double-Entry General Ledger": [0.15, 0.10]
    "Biometric SDK Integration": [0.20, 0.15]
    "AI Lead Scoring": [0.25, 0.12]
```

### Actionable Takeaway
To evolve TechInPedia into a production-grade Business OS for 100 people, the engineering focus must strictly resolve the **P0 foundational architectural gaps** (User-Employee unification, genuine RBAC, real attendance/leave/payroll mechanics, Customer 360 completeness, and Razorpay payment attribution) while completely steering clear of unnecessary enterprise ERP bloat.
