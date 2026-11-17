# TechInPedia Business OS — Codebase Audit Report
**Document:** `docs/BUSINESS_OS_AUDIT.md`  
**Date:** September 2026  
**System:** TechInPedia Internal Business Operating System  
**Auditor:** Antigravity AI Engineering Agent  

---

## 1. Executive Summary
TechInPedia currently operates as a Next.js 16 (App Router) multi-service platform combining:
- A public-facing agency website for **Hardware Rentals**, **Custom Software Development**, and **Digital Marketing**.
- An initial admin backoffice managing basic enquiries, real-time live chat, dynamic website settings, catalog services, portfolio projects, blog posts, testimonials, FAQs, media uploads, and audit logs.

The objective of this project is to progressively transform this admin panel into a comprehensive, production-grade **TechInPedia Business OS** (incorporating full CRM, Sales, HRM, Projects, Support, IT Hardware Rentals & AMC, SaaS Management, Automation Workflows, and Third-Party Integrations) **without breaking existing public site operations, without deleting existing enquiry data, and without rewriting from scratch.**

---

## 2. Existing Modules & Architecture

| Module | Location | Purpose | Current State |
| :--- | :--- | :--- | :--- |
| **Public Website** | `src/app/(public)` & root pages | Homepage, Services, Portfolio, Blog, About, Contact, Start-Project Wizard | Fully operational, SEO optimized with Schema.org JSON-LD, Framer Motion animations |
| **Authentication** | `src/lib/auth.ts`, `src/app/admin/login`, `src/app/api/auth/*` | Admin login, password hashing (bcrypt), JWT cookie sessions | Basic role check (`SUPER_ADMIN`, `ADMIN`, `EDITOR`), 24h JWT cookie, account lockout logic on User model |
| **Enquiries CRM (V1)** | `src/app/admin/enquiries`, `src/app/api/enquiries/*` | Inbound web leads, status filter, notes | Simple table with 8 status stages (`NEW` -> `WON`/`LOST`), basic notes, no pipeline visualization, no deal linking |
| **Live Chat** | `src/components/LiveChatWidget.tsx`, `src/app/admin/chats`, `src/app/api/chat/*` | Visitor chat widget + Admin chat desk | Polling-based session and messaging, active/resolved status, no CRM deal conversion |
| **Services Catalog** | `src/app/admin/services`, `src/app/api/services/*` | 9 core offerings, SEO, icons | Full CRUD with display order, slug uniqueness |
| **Portfolio / Projects** | `src/app/admin/projects`, `src/app/api/projects/*` | Case studies, galleries, tags | Full CRUD with JSON features/tech/results |
| **Blog Engine** | `src/app/admin/blog`, `src/app/api/blog/*` | Articles, tags, SEO | Full CRUD with draft/publish status |
| **Testimonials** | `src/app/admin/testimonials`, `src/app/api/testimonials/*` | Client reviews, star ratings | Full CRUD with display order |
| **FAQs** | `src/app/admin/faqs`, `src/app/api/faqs/*` | Accordion questions by category | Full CRUD with category indexing |
| **Settings** | `src/app/admin/settings`, `src/app/api/settings/*` | Company, social, SEO, website config | Key-value storage in `Setting` table, cached in layouts |
| **Media Library** | `src/app/admin/media`, `src/app/api/media/*`, `src/lib/storage.ts` | Image uploads, local storage | Stored in `public/uploads/`, DB metadata, 5MB limit |
| **Activity Log** | `src/lib/activity.ts`, `src/app/admin/activity`, `src/app/api/activity/*` | Admin action trail | DB logging of entity actions, no visual diff |
| **Email Service** | `src/lib/email.ts` | Nodemailer SMTP notifications | Dispatches enquiry notifications, gracefully handles missing SMTP credentials |
| **WhatsApp Links** | `src/lib/whatsapp.ts` | Dynamic click-to-chat links | Reads phone number from DB/env, generates wa.me links |

---

## 3. Existing Database Tables (`prisma/schema.prisma`)

The database is MySQL 8.x managed by Prisma ORM (`6.4.1`):

1. **`User`**: Admin users (`id`, `name`, `email`, `password`, `role`: `SUPER_ADMIN` | `ADMIN` | `EDITOR`, `status`: `ACTIVE` | `INACTIVE`, `mustChangePassword`, `failedLoginAttempts`, `lockedUntil`).
2. **`Service`**: 9 Core offerings (`id`, `title`, `slug`, `shortDescription`, `description`, `icon`, `technologies`, `image`, `seoTitle`, `seoDescription`, `displayOrder`, `status`).
3. **`Project`**: Portfolio case studies (`id`, `title`, `slug`, `category`, `clientType`, `shortDesc`, `description`, `problem`, `solution`, `features`, `technologies`, `results`, `featuredImage`, `gallery`, `featured`, `status`, `displayOrder`).
4. **`BlogPost`**: Blog articles (`id`, `title`, `slug`, `excerpt`, `content`, `featuredImage`, `category`, `tags`, `author`, `seoTitle`, `seoDescription`, `status`, `publishedAt`).
5. **`Testimonial`**: Client reviews (`id`, `clientName`, `company`, `designation`, `testimonial`, `image`, `rating`, `displayOrder`, `status`).
6. **`Faq`**: FAQs (`id`, `question`, `answer`, `category`, `displayOrder`, `status`).
7. **`Enquiry`**: Inbound leads (`id`, `name`, `email`, `phone`, `company`, `website`, `service`, `projectType`, `budget`, `timeline`, `message`, `source`, `utmSource`, `utmMedium`, `utmCampaign`, `utmContent`, `status`: `NEW`..`WON`..`LOST`, `assignedTo`).
8. **`EnquiryNote`**: CRM notes on an enquiry (`id`, `enquiryId`, `userId`, `note`, `createdAt`).
9. **`ActivityLog`**: System audit trail (`id`, `userId`, `userEmail`, `action`, `entityType`, `entityId`, `metadata`, `createdAt`).
10. **`Media`**: File metadata (`id`, `filename`, `url`, `mimeType`, `size`, `width`, `height`, `altText`).
11. **`Setting`**: Key-value settings (`id`, `key`, `value`, `category`).
12. **`ChatSession`**: Visitor live chat session (`id`, `userName`, `userEmail`, `userPhone`, `status`, `lastMessage`, `lastSender`).
13. **`ChatMessage`**: Messages inside session (`id`, `sessionId`, `sender`, `message`, `emailSent`).

---

## 4. Existing API Surface (`src/app/api/*`)

| Endpoint | Methods | Auth Check | Notes |
| :--- | :--- | :--- | :--- |
| `/api/auth/login` | POST | Public | Validates credentials, sets `tip_admin_token` HttpOnly cookie |
| `/api/auth/logout` | POST | Authenticated | Clears auth cookie |
| `/api/auth/me` | GET | Authenticated | Returns current session user |
| `/api/auth/change-password` | POST | Authenticated | Updates password, clears `mustChangePassword` |
| `/api/admin/chats` & `/[id]` | GET, POST, PATCH | Authenticated | Admin side live chat management |
| `/api/chat/session` | POST | Public | Visitor creates/retrieves session |
| `/api/chat/messages` | GET, POST | Public (session-scoped) | Visitor sends/receives messages |
| `/api/enquiries` | GET, POST | POST: Public; GET: Authenticated | Creates leads from forms; lists leads for admin |
| `/api/enquiries/[id]` | GET, PATCH, DELETE | Authenticated | Updates lead status, fields |
| `/api/enquiries/[id]/notes` | GET, POST | Authenticated | Manages lead notes |
| `/api/services` & `/[id]` | GET, POST, PUT, DELETE | Public GET, Auth mutations | Service catalog |
| `/api/projects` & `/[id]` | GET, POST, PUT, DELETE | Public GET, Auth mutations | Portfolio |
| `/api/blog` & `/[id]` | GET, POST, PUT, DELETE | Public GET, Auth mutations | Blog posts |
| `/api/testimonials` & `/[id]` | GET, POST, PUT, DELETE | Public GET, Auth mutations | Testimonials |
| `/api/faqs` & `/[id]` | GET, POST, PUT, DELETE | Public GET, Auth mutations | FAQs |
| `/api/media` & `/[id]` | GET, POST, DELETE | Public GET, Auth mutations | File upload to `public/uploads` |
| `/api/settings` | GET, PUT | Public GET, Auth mutations | Site settings |
| `/api/users` & `/[id]` | GET, POST, PUT, DELETE | `SUPER_ADMIN` only | User management |
| `/api/activity` | GET | Authenticated | Activity log list |

---

## 5. Existing Permissions & Authorization System
- **Current Model:** 3 enum values in Prisma (`Role`: `SUPER_ADMIN`, `ADMIN`, `EDITOR`).
- **Enforcement:** `requireRole([Role.SUPER_ADMIN, Role.ADMIN])` helper in `src/lib/auth.ts`.
- **Limitation:** Coarse-grained. There are no granular permissions (e.g. `crm.leads.delete`, `finance.invoices.view`, `hr.payroll.view`), no data visibility rules (`ALL`, `TEAM`, `OWN`), and roles are hardcoded enums rather than dynamic database entities.

---

## 6. Reusable Components & UI Patterns
- **Layout:** `src/app/admin/layout.tsx` (dark theme: `bg-slate-950 text-slate-100 min-h-screen flex`).
- **Sidebar:** `src/components/admin/AdminSidebar.tsx` (responsive, icons, role-filtered).
- **Header:** `src/components/admin/AdminHeader.tsx` (user avatar, quick links, logout).
- **Rich Text:** `src/components/admin/RichTextEditor.tsx` (formatting buttons, Markdown/HTML).
- **Password Modal:** `src/components/admin/PasswordChangeModal.tsx`.
- **Chat Desk:** `src/components/admin/AdminChatInboxClient.tsx` (2-pane chat UI with polling).
- **Form Controls:** Clean Tailwind form inputs with violet/blue focus rings.

---

## 7. Gaps & Missing Functionality (The Business OS Scope)
The current system lacks the modules required of an enterprise Business OS:
1. **CRM & Pipeline:** No separate `Contact`, `Company`, or `Customer` models. No multi-stage customizable Kanban pipeline. No drag-and-drop deal tracking, temperature, or scoring.
2. **Sales & Finance:** No `Quotation`, `Proposal`, `Contract`, `Invoice`, `Payment`, `Expense`, or `Vendor` models.
3. **Projects:** No internal project tracking, milestones, tasks, or timesheets (only a public portfolio showcase exists).
4. **HRM:** No employee directory, departments, designations, attendance tracking, leave requests, shift configurations, or payroll records.
5. **Support:** No ticketing system, SLA rules, or internal knowledge base.
6. **Hardware Rentals & AMC:** No serial-tracked asset inventory, rental orders, check-in/checkout tracking, or AMC maintenance schedules.
7. **SaaS:** No product catalog, recurring plans, customer subscriptions, or license key management.
8. **Automation:** No trigger/condition/action workflow engine.
9. **Integrations:** No official WhatsApp Cloud API connector, no Google Sheets two-way sync, no webhook dispatcher.
10. **Data Export & Search:** No universal Command Palette (`Cmd+K`), no global cross-entity search, no CSV/Excel exporter.

---

## 8. Database Changes & Non-Destructive Extension Strategy
To preserve existing data:
- **`Enquiry` Table Preservation:** Retain the existing `Enquiry` table as the inbound capture layer or map it 1:1 to a new unified `Lead` model while keeping foreign keys intact.
- **Normalized New Models:**
  - `Permission`, `RolePermission`, `UserPermission` (RBAC 2.0).
  - `Contact`, `Company`, `Customer`.
  - `Pipeline`, `PipelineStage`, `Deal`.
  - `FollowUp`, `LeadTimelineEvent`.
  - `Quotation`, `QuotationItem`, `Proposal`, `Contract`.
  - `Invoice`, `InvoiceItem`, `Payment`, `Expense`, `Vendor`.
  - `ProjectRecord`, `ProjectMember`, `Task`, `Milestone`, `Timesheet`.
  - `Department`, `Designation`, `Employee`, `AttendanceRecord`, `LeaveType`, `LeaveRequest`, `PayrollRecord`.
  - `SupportTicket`, `TicketComment`, `TicketCategory`, `KnowledgeArticle`.
  - `RentalAsset`, `RentalOrder`, `RentalOrderItem`, `AMCContract`, `AssetMaintenance`.
  - `SaaSProduct`, `SaaSPlan`, `SaaSSubscription`, `SoftwareLicense`.
  - `WorkflowRule`, `WorkflowExecution`, `WebhookSubscription`, `WebhookDeliveryLog`.
  - `CustomFieldDefinition`, `CustomFieldValue`, `Tag`, `EntityTag`.
  - `Notification`.
- **Database Indexing:** Composite indexes on `[status, createdAt]`, `[assignedTo, status]`, `[customerId]`, `[companyId]`, `[email]`, `[phone]`.

---

## 9. Security Risks & Mitigations
1. **CloudLinux / Passenger Hosting Environment:**
   - Production uses `server.js` with single-thread threadpool (`UV_THREADPOOL_SIZE = '1'`) and 6-hour lifecycle restarts.
   - *Mitigation:* Avoid unmanaged background daemon threads and avoid requiring Redis/BullMQ. Use a reliable database-backed job table and HTTP/cron scheduling compatible with cPanel / CloudLinux.
2. **Missing Granular Middleware:**
   - Authorization was handled per-page; missing global middleware could leave new routes unprotected if developers omit `requireAuth()`.
   - *Mitigation:* Implement Next.js `middleware.ts` for `/admin/*` and `/api/admin/*` to enforce session verification and CSRF protection at the edge.
3. **Secret Storage in DB:**
   - WhatsApp access tokens, webhook secrets, and Google Service Account credentials must not be returned in public API payloads.
   - *Mitigation:* Store integration secrets in encrypted columns or masked configs. Never echo them back to the client.
4. **File Upload Security:**
   - `storage.ts` allows public images up to 5MB, but HR documents and contracts are sensitive.
   - *Mitigation:* Implement protected upload paths for private documents (`/api/documents/[id]`) that check user permissions before streaming files.

---

## 10. Migration & Delivery Strategy
Execute across **18 structured phases** following the continuous verification loop:
1. **Analyze & Plan:** Confirm requirements & dependencies.
2. **Prisma Schema Update:** Add modular models non-destructively; run `prisma db push` / `prisma generate`.
3. **Backend Service & APIs:** Centralized validation (Zod), server-side pagination, sorting, audit logging.
4. **UI Implementation:** Desktop-first, responsive, clean Tailwind dark theme matching existing aesthetics.
5. **Validation & Testing:** Typescript (`tsc --noEmit`), build verification, integration simulation.
6. **Documentation:** Continuous updates to `docs/` guides.
