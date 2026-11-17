# TECHINPEDIA BUSINESS OS — GOOGLE CALENDAR & MEETINGS INTEGRATION ARCHITECTURE

**Document Version**: 1.0.0  
**Target Organization**: TechInPedia (~100 Employees)  
**Date**: September 18, 2026  
**Status**: Architectural Specification (Pre-Implementation)  
**Auditor**: Antigravity Core Architecture Team  

---

## 1. Executive Summary & Existing Infrastructure Evaluation

An exhaustive code audit confirmed that **no meeting or calendar module currently exists** in TechInPedia:
- Zero tables in Prisma schema (`Meeting`, `CalendarEvent`, or `Appointment` do not exist).
- Zero API routes under `/api/crm/**` or `/api/calendar/**`.
- No Google API SDKs (`googleapis`, `@google-cloud/**`) are installed in `package.json`.

This architecture outlines the complete design for a robust, enterprise-grade Meeting and Google Calendar integration. It enables sales and client delivery staff to schedule meetings directly from Leads, Contacts, and Customer 360 records, automatically provisioning Google Meet video links, dispatching synchronized calendar invitations, and maintaining an auditable CRM activity timeline.

---

## 2. Authentication & Calendar Connection Strategy

For an organization of ~100 employees, two architectural approaches for Google Calendar integration were evaluated:

### 2.1 Evaluated Approaches
1. **Per-User Individual OAuth2 Consent (High Complexity & Fragile)**:
   - Each employee logs into their personal Google account via OAuth consent flow.
   - Requires storing, refreshing, and rotating 100 individual refresh tokens in MySQL.
   - Fragile: If an employee's refresh token expires or they change their Google password, calendar sync quietly breaks.
2. **Google Workspace Domain-Wide Service Account (Recommended Enterprise Pattern)**:
   - TechInPedia provisions a single Google Cloud Service Account with Domain-Wide Delegation in Google Workspace.
   - The server can impersonate the organizer (e.g. `sales.rep@techinpedia.com`) using JWT assertions without individual employee OAuth prompts.
   - Centralized, reliable, zero token expiration friction, and immediate revocation upon employee offboarding.

### 2.2 Fallback/Hybrid Mode (System Calendar Pattern)
For initial rollout, a dedicated system calendar (e.g. `meetings@techinpedia.com` or `calendar-service@techinpedia.iam.gserviceaccount.com`) creates events on behalf of the company, inviting both the internal employee and the client as attendees. This requires **zero individual OAuth tokens** and guarantees 100% reliability from day one.

---

## 3. Database Schema Specification (Prisma)

```prisma
model Meeting {
  id                  String               @id @default(cuid())
  title               String
  description         String?              @db.Text
  meetingType         MeetingType          @default(GOOGLE_MEET)
  status              MeetingStatus        @default(SCHEDULED)
  
  // Timing & Timezones
  startTime           DateTime
  endTime             DateTime
  timezone            String               @default("Asia/Kolkata")
  
  // Location & Conferencing
  location            String?              // Physical office address or room
  conferenceLink      String?              // https://meet.google.com/xxx-yyyy-zzz
  conferenceId        String?              // Google Meet conference code
  
  // Google Calendar Integration Details
  googleEventId       String?              @unique // Google Calendar event ID
  googleCalendarId    String?              // Calendar ID (primary or system)
  icalUid             String?              // RFC 5545 iCalendar UID
  htmlLink            String?              // Web link to Google Calendar UI
  
  // Business Entity Associations
  customerId          String?
  customer            Customer?            @relation(fields: [customerId], references: [id], onDelete: SetNull)
  contactId           String?
  contact             Contact?             @relation(fields: [contactId], references: [id], onDelete: SetNull)
  leadId              String?
  lead                Lead?                @relation(fields: [leadId], references: [id], onDelete: SetNull)
  dealId              String?
  deal                Deal?                @relation(fields: [dealId], references: [id], onDelete: SetNull)
  projectId           String?
  project             Project?             @relation(fields: [projectId], references: [id], onDelete: SetNull)
  
  // Host & Staff Ownership
  hostEmployeeId      String
  hostEmployee        Employee             @relation("MeetingHost", fields: [hostEmployeeId], references: [id])
  createdById         String
  createdByUser       User                 @relation("MeetingCreator", fields: [createdById], references: [id])
  
  // Post-Meeting Tracking
  outcome             MeetingOutcome?
  outcomeNotes        String?              @db.Text
  followUpTaskId      String?
  
  // Auditing
  createdAt           DateTime             @default(now())
  updatedAt           DateTime             @updatedAt
  
  participants        MeetingParticipant[]

  @@index([status, startTime, hostEmployeeId])
  @@index([customerId, leadId, dealId])
}

enum MeetingType {
  GOOGLE_MEET
  PHONE_CALL
  OFFICE_MEETING
  CLIENT_LOCATION
}

enum MeetingStatus {
  SCHEDULED
  IN_PROGRESS
  COMPLETED
  RESCHEDULED
  CANCELLED
  NO_SHOW
}

enum MeetingOutcome {
  INTERESTED_PROPOSAL_REQUIRED
  FOLLOW_UP_NEEDED
  QUALIFIED_OPPORTUNITY
  NOT_INTERESTED
  DEAL_WON
  NO_SHOW
}

model MeetingParticipant {
  id                  String               @id @default(cuid())
  meetingId           String
  meeting             Meeting              @relation(fields: [meetingId], references: [id], onDelete: Cascade)
  
  // Either Internal Employee or External Contact
  employeeId          String?
  employee            Employee?            @relation(fields: [employeeId], references: [id], onDelete: SetNull)
  email               String               // Email address for invite dispatch
  name                String?
  role                String               @default("ATTENDEE") // ORGANIZER, ATTENDEE, OPTIONAL
  responseStatus      String               @default("NEEDS_ACTION") // NEEDS_ACTION, ACCEPTED, DECLINED, TENTATIVE
  
  createdAt           DateTime             @default(now())
  updatedAt           DateTime             @updatedAt

  @@unique([meetingId, email])
}
```

---

## 4. End-to-End Meeting Creation & Google Calendar Sync Flow

```mermaid
sequenceDiagram
    autonumber
    actor Rep as Sales / Delivery Staff
    participant UI as CRM Web Interface (Lead / Customer 360)
    participant API as /api/meetings (Next.js Server)
    participant Auth as Session & Staff Context
    participant GCal as Google Calendar API v3
    participant DB as MySQL Database
    participant Mail as Email Dispatcher (Resend / SMTP)

    Rep->>UI: Clicks "Schedule Meeting"
    UI->>UI: Modal opens (Prefills Client Name, Email, Phone, Deal)
    Rep->>UI: Selects Meeting Type: "Google Meet", Date/Time (Sept 22, 11:00 AM IST), Duration (45 mins)
    Rep->>UI: Adds internal attendees (e.g. Solution Architect, Team Leader)
    UI->>API: POST /api/meetings { leadId, title, startTime, endTime, type: "GOOGLE_MEET", participants }

    API->>Auth: Validate user session & resolve Employee identity
    API->>GCal: calendar.events.insert() with conferenceDataVersion=1
    Note over GCal: Generates Google Meet URL & event ID
    GCal-->>API: 200 OK { id: "gcal_123", conferenceData: { uri: "https://meet.google.com/abc-defg-hij" } }

    API->>DB: Insert Meeting record with googleEventId & conferenceLink
    API->>DB: Insert MeetingParticipants (Client + Employees)
    API->>DB: Insert Activity Timeline event on Lead/Customer
    API->>DB: Record AuditLog ("MEETING_SCHEDULED")

    API->>Mail: Send branded HTML invite with .ics calendar attachment
    API-->>UI: Returns { success: true, meeting: { id, meetLink } }
    UI->>Rep: Renders confirmation card with "Copy Google Meet Link"
```

---

## 5. Meeting Lifecycle & Operational States

```mermaid
stateDiagram-v2
    [*] --> SCHEDULED: Create Meeting (Google Meet link generated)
    SCHEDULED --> RESCHEDULED: Reschedule Time (Sync update to Google Calendar & Send update email)
    SCHEDULED --> CANCELLED: Cancel Meeting (Delete/Cancel event on Google Calendar)
    SCHEDULED --> COMPLETED: Host logs outcome & notes
    SCHEDULED --> NO_SHOW: Client fails to attend
    
    RESCHEDULED --> COMPLETED
    RESCHEDULED --> NO_SHOW
    RESCHEDULED --> CANCELLED

    COMPLETED --> [*]
    NO_SHOW --> [*]
    CANCELLED --> [*]
```

### 5.1 Detailed Lifecycle Handlers
1. **Rescheduling (`PATCH /api/meetings/[id]/reschedule`)**:
   - Updates `startTime`, `endTime`, and increments reschedule count.
   - Calls Google Calendar API: `calendar.events.patch(eventId, { start, end })`.
   - Sends automated update notification to all attendees with new `.ics` file.
   - Logs `MEETING_RESCHEDULED` in the customer activity timeline.
2. **Cancellation (`POST /api/meetings/[id]/cancel`)**:
   - Updates status to `CANCELLED` and captures cancellation reason.
   - Calls Google Calendar API: `calendar.events.delete(eventId)` or updates summary to `[Cancelled]`.
   - Dispatches polite cancellation notice to client.
3. **Outcome & Next Action Logging (`POST /api/meetings/[id]/outcome`)**:
   - Host records call minutes, key takeaways, and selects outcome:
     - `INTERESTED_PROPOSAL_REQUIRED`: Prompts one-click Quotation/Proposal creation.
     - `FOLLOW_UP_NEEDED`: Automatically generates a `FollowUp` task in the CRM.
     - `QUALIFIED_OPPORTUNITY`: Advances Lead to `QUALIFIED` or Deal to next stage.
     - `NO_SHOW`: Flags lead with a warning badge and schedules automated re-engagement email.

---

## 6. Timezone Handling & Internationalization

Given clients and remote staff may operate in diverse timezones:
- **Database Storage Standard**: All timestamps (`startTime`, `endTime`, `createdAt`) are stored in strict **UTC (Coordinated Universal Time)** in MySQL.
- **Client Presentation**: Timestamps are parsed with the user's browser timezone via `Intl.DateTimeFormat` or `date-fns-tz`.
- **Google Calendar RFC 3339**: Timestamps sent to Google API specify explicit timezone offsets:
  ```json
  {
    "start": { "dateTime": "2026-09-22T11:00:00+05:30", "timeZone": "Asia/Kolkata" },
    "end": { "dateTime": "2026-09-22T11:45:00+05:30", "timeZone": "Asia/Kolkata" }
  }
  ```

---

## 7. Configuration & Environment Requirements

To activate the Google Calendar integration in production, the following credentials must be configured:

```env
# Google Cloud Service Account Integration
GOOGLE_PROJECT_ID="techinpedia-business-os"
GOOGLE_CLIENT_EMAIL="calendar-service@techinpedia-business-os.iam.gserviceaccount.com"
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQC...\n-----END PRIVATE KEY-----\n"

# Primary / Master Calendar ID
GOOGLE_CALENDAR_ID="primary"
```

### Setup Directives
- Ensure the Google Service Account has `https://www.googleapis.com/auth/calendar` and `https://www.googleapis.com/auth/calendar.events` scopes enabled.
- If using Google Workspace Domain-Wide Delegation, specify the admin subject email for impersonation: `GOOGLE_WORKSPACE_ADMIN_EMAIL="admin@techinpedia.com"`.
