# TechInPedia Employee Mobile App — Roadmap & Phase 2 Blueprint

## 1. Roadmap Overview

```
[Phase 1 — COMPLETED ✅]
WhatsApp CRM Team Inbox + Chat Messaging + Auth Persistence + FCM Push Notifications

[Phase 2 — RECOMMENDED NEXT 🎯]
CRM 360° Lead Hub + WhatsApp HSM Template Sender + Pipeline Stage Switcher + Customer Contact Directory

[Phase 3 — EMPLOYEE WORKFORCE 👥]
HRM Self-Service: Attendance Punch (GPS/Geofence), Leave Requests & Approvals, Payslip Downloads

[Phase 4 — FIELD OPERATIONS & REVENUE 📦]
IT Hardware Rentals, AMC Service Contracts & Ticket Dispatch, On-Site Customer Signature Capture
```

---

## 2. Phase 2 Detailed Scope: CRM 360° & WhatsApp Template Suite

Phase 2 builds directly on top of the Phase 1 WhatsApp Inbox foundation without breaking existing architecture.

### Module 2.1: In-Chat WhatsApp HSM Template Messaging
*Directly solves Meta's 24-hour customer service window.*
- **Template Browser Modal in Chat:**
  - View approved WhatsApp templates (`/api/whatsapp/templates`).
  - Preview template body with dynamic variable chips (`{{1}} = Customer Name`, `{{2}} = Service`).
  - 1-Click dispatch to reopen expired 24h conversation windows.
- **Media Messaging (Images, PDFs, Documents):**
  - Send quotation PDFs, brochures, and photos directly from the mobile chat composer.

### Module 2.2: Lead 360° Drawer & Pipeline Management
- **In-Chat CRM Sidebar/Drawer:**
  - Swipe or tap customer profile in chat header to open Lead details.
  - **Pipeline Stage Selector:** Instant switcher (`NEW` → `CONTACTED` → `QUALIFIED` → `PROPOSAL_SENT` → `NEGOTIATION` → `WON` → `LOST`).
  - **Lead Temperature & Score:** Hot / Warm / Cold badges with numerical deal score.
  - **Estimated Deal Value (₹):** View and update budget / potential revenue.
  - **Internal Team Notes:** Add private agent notes (amber cards) visible only to employees.

### Module 2.3: Leads & Contacts Directory
- **Leads Screen (New Navigation Tab):**
  - Searchable directory of all CRM leads.
  - Filter by Stage, Temperature, Assigned Agent, and Date range.
  - Quick action: "Chat on WhatsApp" button opens the conversation immediately.
  - Quick action: "Call Customer" directly dials via mobile phone dialer.

### Module 2.4: Follow-up Reminders & Schedule
- Schedule follow-up dates and times directly from chat.
- Push notification alarm when a customer follow-up is due.

---

## 3. Alternative Expansion Paths

| Option | Primary Module | Target Audience | Key Features |
|---|---|---|---|
| **Option A (Recommended)** | **CRM 360° & WhatsApp Templates** | Sales & Support Teams | Pipeline switcher, HSM templates, Lead notes, Deal values, Contact directory |
| **Option B** | **HRM & Attendance Self-Service** | All Employees | GPS punch in/out, Leave balance, Leave applications, Payslip PDF downloads |
| **Option C** | **Rental Orders & Field Service** | Operations & Field Staff | IT rental orders, system asset tracking, AMC service tickets, customer signature |

---

## 4. Phase 2 Implementation Deliverables

1. **Backend Integration:**
   - Expose `/api/crm/leads` and `/api/whatsapp/templates` for mobile Bearer authentication.
   - Lead stage PATCH endpoint with activity timeline logging.
2. **Flutter Domain & Repositories:**
   - `LeadModel`, `TemplateModel`, `InternalNoteModel`.
   - `LeadRepository`, `TemplateRepository`.
3. **Flutter UI Screens & Components:**
   - `TemplatePickerBottomSheet` in Chat screen.
   - `LeadDetailsDrawer` with pipeline stage chips.
   - `LeadsListScreen` added to bottom navigation shell.
4. **Automated Testing & Analysis:**
   - 100% null-safe with 0 `flutter analyze` warnings.
   - Unit tests covering Lead stage transitions and template variable interpolation.
