# TechInPedia Employee Mobile App — Phase 3 Architectural Plan
## Mobile HRM Workforce & Attendance Self-Service Suite

**Platform:** Flutter + Dart + Riverpod + Existing Next.js / MySQL Backend  
**Application ID:** `com.techinpedia.employee`  
**API Gateway:** `https://admin.techinpedia.com`  

---

## 1. Executive Summary & Context

With **Phase 1** (Authentication, RBAC, WhatsApp Team Inbox & Push Notifications) and **Phase 2** (CRM 360° Lead Hub, WhatsApp HSM Templates & Pipeline Management) complete and verified with 0 analyzer issues, the mobile app currently serves sales and support operations.

**Phase 3** elevates the app from a CRM tool into a daily company-wide **Employee Operating System** by introducing **HRM & Attendance Self-Service**. TechInPedia's backend already possesses complete database tables (`AttendanceRecord`, `LeaveRequest`, `LeaveBalance`, `PayrollRecord`, `Holiday`, `Shift`) and REST endpoints (`/api/hr/attendance/punch`, `/api/hr/leaves`, `/api/hr/payroll`).

---

## 2. Phase 3 Core Modules & Features

```text
┌────────────────────────────────────────────────────────────────────────┐
│                   PHASE 3: EMPLOYEE HRM MOBILE SUITE                   │
├──────────────────┬──────────────────┬─────────────────┬────────────────┤
│  1. ATTENDANCE   │  2. LEAVE PORTAL │  3. CALENDAR &  │  4. SALARY &   │
│   GEO-PUNCH      │  & APPROVALS     │ REGULARIZATION  │ COMPENSATION   │
├──────────────────┼──────────────────┼─────────────────┼────────────────┤
│ • 1-Tap Clock In │ • Live Balances  │ • Month Grid    │ • Salary Slips │
│ • 1-Tap Clock Out│   (Casual, Sick, │ • Color Codes:  │ • Basic, HRA,  │
│ • Live Work Timer│   Paid, Unpaid)  │   Present, Late,│   Deductions   │
│ • Shift Checks   │ • Apply Modal    │   Absent, Leave │ • Net Pay &    │
│   (09:30 Grace)  │ • Days Counter   │ • Missed Punch  │   Payment Date │
│ • GPS Geofence & │ • Manager Action │   Regularize    │ • Bank details │
│   Office Wi-Fi   │   (Approve/Deny) │ • Holiday List  │   verification │
└──────────────────┴──────────────────┴─────────────────┴────────────────┘
```

### Module 3.1: GPS-Aware Mobile Punch In / Punch Out
- **Live Status Header:**
  - `NOT_CHECKED_IN`: Glowing Emerald "Punch In" button.
  - `CHECKED_IN`: Live elapsed timer (`04h 32m logged today`), clock-in timestamp (e.g., `09:28 AM`), and Red "Punch Out" button.
  - `CHECKED_OUT`: Total hours summary (`08.5 hrs`), clock-in & clock-out timestamps, status chip (`PRESENT`, `LATE`, `HALF_DAY`).
- **Shift & Policy Automation (IST):**
  - Shift start: `09:30 AM` with a 15-minute grace period (`09:45 AM`). Check-ins past `09:45 AM` automatically flag `isLate: true`.
  - Check-outs before `06:00 PM` flag `isEarlyExit: true`.
  - Total work duration under 4 hours automatically computes `HALF_DAY`.
- **Geofence & Device Telemetry:**
  - Coordinates capture (Latitude, Longitude, Accuracy).
  - Office radius check or "Work From Home / Field Visit" toggle with optional visit notes.
  - Client details: Device model and IP address forwarded to `/api/hr/attendance/punch`.

---

### Module 3.2: Leave Management & Approval Portal
- **Live Balances Card:**
  - Synchronized via `/api/hr/leaves`: `CASUAL`, `SICK`, `PAID`, `UNPAID`.
  - Visual progress indicators displaying: `Allocated`, `Used`, `Pending`, and `Remaining`.
- **Apply for Leave Modal:**
  - Date Range Picker (Start Date to End Date).
  - Leave Type dropdown (`CASUAL`, `SICK`, `PAID`, `UNPAID`, `WFH`).
  - Auto-calculated business days count.
  - Reason text field with validation.
  - Instant balance pre-check (blocks submission if requested days exceed available quota).
- **Leave History & Manager Actions:**
  - Filter by `ALL`, `PENDING`, `APPROVED`, `REJECTED`.
  - Managers with `hr.leaves.manage` or `SUPER_ADMIN` see pending subordinate applications with 1-tap `Approve` / `Reject`.

---

### Module 3.3: Attendance Calendar, Holidays & Regularization
- **Monthly Attendance Grid:**
  - Interactive calendar month view with dot indicators:
    - 🟢 Green: Present / On-Time
    - 🟡 Amber: Late Arrival
    - 🔴 Red: Absent
    - 🔵 Blue: Approved Leave
    - 🟣 Purple: Public Holiday
- **Punch Regularization Requests:**
  - If an employee forgot to clock in/out, they can submit a Regularization Request with requested times and justification (`/api/hr/attendance/regularize`).
- **Upcoming Holidays:**
  - List of official company holidays retrieved from `/api/hr/holidays`.

---

### Module 3.4: Salary Slips & Compensation Overview
- **Monthly Payslip Summary:**
  - Month/Year selector connected to `/api/hr/payroll`.
  - Earnings Breakdown: Basic Salary, HRA, Special Allowance, Gross Pay.
  - Deductions Breakdown: Tax Deductions (TDS), Loss of Pay (LOP) for unexcused absences, other deductions.
  - Net Take-Home Salary (`₹`).
  - Payout Status (`PAID`, `APPROVED`, `PENDING`) and Payment Reference details.

---

## 3. Technical Architecture & File Plan

```text
mobile/lib/
├── features/
│   ├── attendance/
│   │   ├── data/repositories/attendance_repository.dart
│   │   ├── domain/models/
│   │   │   ├── attendance_record_model.dart
│   │   │   └── punch_status_model.dart
│   │   └── presentation/
│   │       ├── controllers/punch_controller.dart, calendar_controller.dart
│   │       ├── screens/attendance_screen.dart
│   │       └── widgets/
│   │           ├── punch_card.dart
│   │           ├── live_work_timer.dart
│   │           └── attendance_calendar.dart
│   │
│   ├── leaves/
│   │   ├── data/repositories/leave_repository.dart
│   │   ├── domain/models/
│   │   │   ├── leave_balance_model.dart
│   │   │   └── leave_request_model.dart
│   │   └── presentation/
│   │       ├── controllers/leaves_controller.dart
│   │       ├── screens/leaves_screen.dart
│   │       └── widgets/
│   │           ├── leave_balance_card.dart
│   │           └── apply_leave_dialog.dart
│   │
│   └── payroll/
│       ├── data/repositories/payroll_repository.dart
│       ├── domain/models/payroll_record_model.dart
│       └── presentation/
│           ├── controllers/payroll_controller.dart
│           └── screens/payroll_screen.dart
│
└── app/routes/main_shell.dart  # Expanded to 4 tabs: Inbox, Leads, Attendance/HR, Profile
```

---

## 4. API Endpoints Map (Reusing Existing Backend)

All endpoints already exist on `admin.techinpedia.com` and accept mobile Bearer tokens:

| Action | HTTP Method | Endpoint | Description |
|---|---|---|---|
| **Get Punch State** | `GET` | `/api/hr/attendance/punch` | Fetches today's record, punch state, and shift times |
| **Clock In / Out** | `POST` | `/api/hr/attendance/punch` | Submits `CLOCK_IN` or `CLOCK_OUT` with IP, device, and notes |
| **Fetch Leaves & Balances** | `GET` | `/api/hr/leaves` | Retrieves allocated/used balances and request history |
| **Submit Leave Request** | `POST` | `/api/hr/leaves` | Applies for leave with date range and auto balance check |
| **Review Leave (Manager)** | `PATCH` | `/api/hr/leaves` | Manager approve/reject with remarks |
| **Request Regularization** | `POST` | `/api/hr/attendance/regularize` | Submits missed punch regularization request |
| **Get My Payslip** | `GET` | `/api/hr/payroll` | Returns monthly salary breakdown for logged-in user |

---

## 5. Strategic Roadmap Alternatives

| Option | Primary Module | Target Users | Key Capabilities |
|---|---|---|---|
| **Option A (Recommended)** | **HRM & Attendance Self-Service** | All TechInPedia Employees | GPS Clock-in/out, Live timer, Leave balances & applications, Monthly calendar, Payslip breakdown |
| **Option B** | **Field Operations & IT Rentals** | IT Hardware / Field Staff | Rental orders fleet directory, dispatch check-in/out, hardware barcode scanning, customer digital signature capture |
| **Option C** | **Urban Marketplace Web (Phase 2)** | Marketplace Buyers & Vendors | `urban.techinpedia.com` public frontend identity, vendor onboarding flow, category directory, and DB subscription plans |
