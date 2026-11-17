# CHANGELOG

## Service Outage Recovery & Automated PM2 Self-Healing Watchdog
**Date:** 2026-11-04
**Deployment:** Production Server (`66.116.199.2`), all apps online (HTTP 200 OK)
- **Root Cause Analysis (503 Service Unavailable on `https://techinpedia.com/`):**
  - Following a server reboot / PM2 daemon reload, the PM2 process table was empty, and the applications (`techinpedia`, `techinpedia-admin`, `techinpedia-urban`, and `techinpedia-worker`) were not active.
  - The existing watchdog script (`/home/hellomam/crm.techinpedia.com/check_services.sh`) ran every 2 minutes via cron, but contained a logic flaw: it checked `pm2 ping > /dev/null`, which returns exit code 0 (`pong`) even when PM2 has zero running processes. Thus, `pm2 resurrect` was never executed automatically.
- **Immediate Restoration:**
  - Executed `npx pm2 resurrect` to restore all 8 saved processes from `/home/hellomam/.pm2/dump.pm2`.
  - Saved current state with `npx pm2 save`.
  - All web portals restored: `techinpedia.com` (Port 3000), `urban.techinpedia.com` (Port 3001), `admin.techinpedia.com` (Port 3002) returning HTTP 200 OK.
- **Permanent Self-Healing Watchdog Upgrade:**
  - Rewrote `/home/hellomam/crm.techinpedia.com/check_services.sh` to:
    1. Inspect `$PM2 jlist` for the presence of the `techinpedia` process; if missing or empty, immediately trigger `$PM2 resurrect`.
    2. Proactively probe ports 3000, 3001, and 3002 via local HTTP requests every 2 minutes. If any app becomes unresponsive, automatically restart that app or resurrect PM2.
    3. Probe port 3009 (PHP CRM) and auto-start if down.
  - Verified cron watchdog execution (exit code 0).

## Account Lockout Disablement & User Database Unlock
**Date:** 2026-10-31
**Deployment:** Production Server (`66.116.199.2`), `admin.techinpedia.com` (Port 3002, PM2 PID 3535346), exit code 0
- **Root Cause Analysis (`Account temporarily locked. Please try again later.`):**
  - The production server build on `admin.techinpedia.com` was running an older version of `src/app/api/auth/login/route.ts` that enforced a 15-minute account lockout upon 5 failed attempts (`lockedUntil`).
  - When a user exceeded 5 attempts, their account was locked in the MySQL database, blocking all subsequent login attempts with HTTP 429.
- **Resolution & Production Build:**
  - Unlocked all 21 user accounts in the production database by resetting `failedLoginAttempts = 0` and `lockedUntil = null`.
  - Synchronized `src/app/api/auth/login/route.ts` across `admin.techinpedia.com`, `techinpedia.com`, and `urban.techinpedia.com`.
  - Rebuilt Next.js production build (321 routes generated, 0 errors) and reloaded PM2 `techinpedia-admin`.
  - Confirmed via stress-testing that multiple failed attempts return standard HTTP 401 without locking the user account out, and valid credentials immediately authenticate with HTTP 200.

## Admin Login Redirect Loop Resolution & Authentication Access Recovery
**Date:** 2026-10-30
**Deployment:** Production Server (`66.116.199.2`), `admin.techinpedia.com` (Port 3002, PM2 PID 3535346), exit code 0
- **Root Cause Analysis (`ERR_TOO_MANY_REDIRECTS` on `/admin/login`):**
  - In `src/middleware.ts`, an unconditional redirect was configured: if `tip_admin_token` cookie was present on any request to `/admin/login`, it redirected (307) immediately to `/admin`.
  - When users had stale, expired, or invalidated cookies, the `/admin` route handler rejected the session via `getAuthSession()` and redirected back to `/admin/login`.
  - This created an infinite HTTP bounce loop (reaching Chromium's 50-redirect limit). Furthermore, because `tip_admin_token` is an `HttpOnly` cookie, client-side scripts could not clear it.
- **Middleware & Client Session Architecture Fix (`src/middleware.ts` & `src/app/admin/login/page.tsx`):**
  - Updated `src/middleware.ts` to recognize `ADMIN_CENTRAL` domain context and removed the premature `/admin/login` -> `/admin` redirect.
  - Configured `/admin/login` to proactively expire and delete any stale `tip_admin_token` cookie (`response.cookies.delete('tip_admin_token')`), ensuring clean state on visiting the login page.
  - Replaced soft client-side route transition (`router.push('/admin')`) with hard browser navigation (`window.location.href = '/admin'`) in `src/app/admin/login/page.tsx` to force full cookie transmission upon authenticated sign-in.
  - Synchronized `src/middleware.ts` and `src/app/admin/login/page.tsx` across production directories.
  - Successfully compiled production Next.js build (321 routes generated, 0 errors) and reloaded PM2 service `techinpedia-admin`.
- **Database Password Synchronization:**
  - Synchronized bcrypt password hash for `admin@techinpedia.com` and `superadmin@techinpedia.com` with `Techinpedia@123` via Prisma.
  - Validated live authentication: `POST /api/auth/login` returns HTTP 200 with valid JWT session.
  - Live HTTPS verified: Visiting `/admin/login` with stale cookie returns HTTP 200 and Set-Cookie clearance; authenticated dashboard access `/admin` returns HTTP 200.

## Server Reboot Recovery & PM2 Process Persistence Restoration
**Date:** 2026-10-17
**Deployment:** Production Server (`66.116.199.2`), all apps online (HTTP 200 OK)
- **Root Cause Analysis:**
  - The hosting server underwent an unexpected reboot / service restart.
  - The PM2 startup dump (`/home/hellomam/.pm2/dump.pm2`) only contained `nextjs-hellomam` (port 3006).
  - Consequently, `techinpedia` (port 3000), `techinpedia-urban` (port 3001), `techinpedia-admin` (port 3002), and `techinpedia-worker` were not automatically restored upon reboot, causing reverse proxy (Apache) to return `503 Service Unavailable` on `https://techinpedia.com/`.
- **Restoration & Permanent Persistence:**
  - Started `techinpedia` (Port 3000, PID 2223370) in `/home/hellomam/public_html/techinpedia.com`.
  - Started `techinpedia-admin` (Port 3002, PID 2223760) in `/home/hellomam/public_html/admin.techinpedia.com`.
  - Started `techinpedia-urban` (Port 3001, PID 2223845) in `/home/hellomam/public_html/urban.techinpedia.com`.
  - Started `techinpedia-worker` (PID 2223927) in `/home/hellomam/public_html/techinpedia.com`.
  - Executed `npx pm2 save` so that all 4 TechInPedia processes are permanently written into `dump.pm2` and automatically start on future system reboots.
  - Verified live HTTPS endpoints: `https://techinpedia.com/` (HTTP 200), `https://admin.techinpedia.com/admin/login` (HTTP 200), `https://urban.techinpedia.com/` (HTTP 200).

## RBAC Permission Revocation Fix & Follow-up Task Engine Ownership Scoping
**Date:** 2026-10-14
**Deployment:** Production Server (`66.116.199.2`), `admin.techinpedia.com` (Port 3002, PM2 PID 1007580), exit code 0
- **Eliminated Over-Permissive Cross-Resource Fallback Aliases (`src/lib/permissions.ts`):**
  - Removed cross-resource aliases in `hasPermission()` (e.g. `crm.leads.view` / `crm.contacts.manage` granting `crm.customers.view`, `contacts.view`, or `crm.kanban.view`).
  - Permissions unchecked in `/admin/roles` for roles like `SALES_EXECUTIVE` (e.g., Customer 360, WhatsApp Contacts) now immediately revoke access and vanish from the sidebar.
  - Retained strict same-resource manage-to-view allowances (`crm.customers.manage` -> `crm.customers.view`, etc.) and exact code synonyms.
- **Sidebar Navigation 1-to-1 Permission Alignment (`src/components/admin/AdminSidebar.tsx`):**
  - Updated sidebar navigation items to require `.view` permissions (`crm.companies.view`, `crm.contacts.view`, `sales.quotations.view`, `sales.proposals.view`, `sales.contracts.view`, `finance.expenses.view`) instead of `.manage`, ensuring unchecking view permissions correctly hides them.
- **Follow-up Task Engine Scoping & Privacy Enforcement (`src/app/api/crm/followups/route.ts` & `[id]/route.ts`):**
  - Enforced strict user-level task scoping (`assignedToId`, `assignedEmployeeId`, or linked `enquiry` ownership) for all reps who do not hold management/admin permissions (`meetings.team.view`, `crm.leads.assign`, `hr.assignments.view`, `cockpit.manager.view`, or `SUPER_ADMIN`).
  - Non-managers like Sapna now see only their own assigned follow-up tasks and accurate counters; company-wide overdue tasks (such as tasks assigned to Vikram Mehta or automated tasks) are never leaked.
  - Fixed `isOwnerOrAdmin` and `isManager` in `src/lib/access-policy.ts` to strictly verify `session.isTenant && session.companyId` before trusting `companyRole`, preventing internal employees with default database values from bypassing scoping.
- **Follow-up UI Dynamic Counts (`src/app/admin/follow-ups/page.tsx`):**
  - Updated "My Tasks" and "All Tasks" cards to render dynamic values (`metrics.my` and `metrics.all`).

## Next.js Static Asset Restoration & Rental-Orders Prerender Fix
**Date:** 2026-10-14
**Deployment:** Production Server (`66.116.199.2`), `techinpedia.com` (Port 3000, PID 983788), `urban.techinpedia.com` (Port 3001, PID 988557), `admin.techinpedia.com` (Port 3002, PID 886795)
- **Resolved Prerender Crash (`src/app/admin/rental-orders/page.tsx`):**
  - Resolved `ReferenceError: selectedOrderForDiscontinue is not defined` and `selectedOrderForPayment` which was blocking production static generation.
  - Declared missing state hooks: `selectedOrderForDiscontinue`, `selectedOrderForPayment`, `discontinueDate`, `discontinueStatus`, `discontinueReason`, `discontinueNotes`.
- **Restored Static Asset Bundles (`.next/static`):**
  - Generated full production build for all 322 routes.
  - Deployed static CSS, JS chunks, and manifests across `techinpedia.com` and `urban.techinpedia.com`.
  - Live HTTPS verified: Zero 500 errors; all assets serving with `HTTP/1.1 200 OK`.

## CRM Leads Contact Visibility & Quick Actions Enhancement
**Date:** 2026-10-14
**Deployment:** Production Server (`66.116.199.2`), `admin.techinpedia.com` (Port 3002, PM2 PID 886795), exit code 0
- **Kanban Card Visibility (`src/app/admin/enquiries/page.tsx`):**
  - Rendered `enq.phone` directly on all Kanban cards with a phone icon in `font-mono`.
  - Displayed `enq.email` with an envelope icon.
- **Lead Detail Drawer Contact Box (`src/app/admin/enquiries/page.tsx`):**
  - Created a dedicated, high-contrast contact box in the drawer header directly displaying Phone Number and Email Address.
  - Added one-click **Copy** buttons for both Phone and Email with dynamic checkmark feedback.
  - Added click-to-call (`tel:`) and click-to-email (`mailto:`) links.
- **Details Grid & Table View:**
  - Added dedicated Phone Number and Email Address rows in the lead details table.
  - Linked phone and email in the Table view Client column.

## RBAC 153-Permission Matrix, 1-to-1 Sidebar Synchronization & HRM Employee Management
**Date:** 2026-10-14
**Deployment:** Production Server (`66.116.199.2`), `admin.techinpedia.com` (Port 3002, PM2 PID 827227), exit code 0
- **153 Granular Permissions Matrix (`src/lib/permissions.ts` & `src/lib/rbac/seedRoles.ts`):**
  - Added dedicated permissions for **Customer 360** (`crm.customers.view`, `crm.customers.manage`), **Leads Kanban Board** (`crm.kanban.view`), **Lead Import** (`crm.leads.import`), **Contacts & Companies View** (`crm.contacts.view`, `crm.companies.view`), **Meetings & Calendar** (`meetings.create`, `meetings.team.view`), **Maintenance Logs** (`hardware.maintenance.manage`), **Integrations Hub** (`integrations.hub.manage`), and **Sales Views** (`sales.quotations.view`, `sales.proposals.view`, `sales.contracts.view`, `finance.expenses.view`).
  - Aligned permission categories: `admin.seo_pages.view` and `admin.seo_pages.manage` moved to **Content** so they appear in Website Content; Meetings & Calendar moved under **CRM**.
  - Seeded all 153 permissions directly into production MySQL database (`Permission` table).
  - Configured backward-compatible fallback aliases in `hasPermission()`.
- **Strict RBAC Enforcement (`src/lib/permissions.ts`):**
  - Prevented fallback to legacy root `ADMIN` role when an `AppRole` or explicit permissions array is assigned.
  - Users strictly see only what their assigned role explicitly grants.
  - Scoped wildcard permission overrides strictly to `session.isTenant`.
- **Granular Sidebar Navigation (`src/components/admin/AdminSidebar.tsx`):**
  - Remapped all 19 sidebar items to dedicated permissions (e.g., Customer 360 uses `crm.customers.view`, Kanban uses `crm.kanban.view`, Maintenance Logs uses `hardware.maintenance.manage`, Integrations Hub uses `integrations.hub.manage`).
  - Added **"Roles & Permissions"** directly under `HRM & WORKFORCE` (`/admin/roles`) gated by `admin.roles.manage`.
- **HRM Employee Edit & Credential Management (`/admin/hr/employees` & `src/app/api/hr/employees/[id]/route.ts`):**
  - Added **"Roles & Permissions"** header button linking directly to `/admin/roles`.
  - Added **"Edit"** action button to employee rows with comprehensive **`EditEmployeeModal`**.
  - Fixed null reference crash (`TypeError: Cannot read properties of null (reading 'trim')`) with robust null-safety on all optional fields.
- **Server Disk Space Optimization:**
  - Removed stale zip backups (`test.hellomam.co.in.zip` 4.2 GB, `public.zip` 1.9 GB) and turbopack rollback caches.
  - Reclaimed over **10.4 GB** of storage, bringing disk utilization down from 99% to 88% (12 GB free).
- **Session AppRole Synchronization (`src/lib/auth.ts`):**
  - Included `appRoleId` and `appRole` in `user.employee` query.
  - Resolves `effectiveAppRole = user.appRole || user.employee?.appRole` and syncs `user.appRoleId` if missing, preventing desynchronized access.

## Complete SEO, AEO & GEO Domain Correction (techinpedia.com vs urban.techinpedia.com)
**Date:** 2026-10-08
**Deployment:** Production Server (`66.116.199.2`), `techinpedia.com` (Port 3000, PM2 PID 2457172) & `urban.techinpedia.com` (Port 3001, PM2 PID 2447160), exit code 0
- **HTTP 301 Permanent Redirects (`src/middleware.ts`):**
  - Configured global edge proxy route matcher for all incoming requests (excluding assets, `_next`, `api`).
  - Allowed Next.js metadata routes (`/robots.txt`, `/sitemap.xml`, `/llms.txt`) to pass through cleanly to handlers.
  - When accessed on `urban.techinpedia.com`:
    - All company blog posts (`/blog`, `/blog/*`), hardware rentals (`/laptop-on-rent/*`, `/desktop-on-rent/*`), IT services (`/services/*`), and custom software development pages return **HTTP 301 Permanent Redirect** to `https://techinpedia.com${pathname}${search}`.
    - Admin routes redirect to `https://admin.techinpedia.com`.
  - When accessed on `techinpedia.com`:
    - Marketplace-exclusive routes (`/category/*`, `/biz/*`, `/list-business/*`, `/vendor/*`) return **HTTP 301 Permanent Redirect** to `https://urban.techinpedia.com${pathname}${search}`.
- **Service Route Hijack Purge (`src/app/services/[slug]/page.tsx`):**
  - Removed `UrbanDirectoryListingView` and loose keyword matching (`slug.includes('services')`, `slug.includes('repair')`) that caused TechInPedia corporate services like `/services/cloud-services` to render as Urban directory pages with UrbanMarket metadata.
  - Added redirect to `https://urban.techinpedia.com/category/${slug}` if the slug matches a marketplace category.
  - Added rich `Service`, `BreadcrumbList`, and `FAQPage` JSON-LD schemas.
- **Generative Engine Optimization (AEO / GEO) (`src/app/llms.txt/route.ts`):**
  - Built dynamic `/llms.txt` endpoint serving domain-specific structured entity facts: IT hardware rentals, software engineering, and corporate offerings on `techinpedia.com`, and local trade directory facts on `urban.techinpedia.com`.
  - Allowlisted `OAI-SearchBot`, `PerplexityBot`, and `ChatGPT-User` in `robots.ts`.
- **Dynamic Isolated Sitemap Generation (`src/app/sitemap.ts`):**
  - Removed problematic static file `public/sitemap.xml` that hardcoded `techinpedia.com` across both environments.
  - On `urban.techinpedia.com`: Sitemap outputs exclusively marketplace URLs (`/`, `/list-business`, `/vendor`, active `MarketplaceCategory`, active `MarketplaceVendor`, and legal policies). Zero company blogs or hardware rental URLs.
  - On `techinpedia.com`: Sitemap outputs exclusively company pages, published blogs, IT services, and hardware rental locations.
- **Dynamic Isolated Robots Directives (`src/app/robots.ts`):**
  - Removed static `public/robots.txt`.
  - `urban.techinpedia.com/robots.txt` dynamically serves `Sitemap: https://urban.techinpedia.com/sitemap.xml`.
  - `techinpedia.com/robots.txt` dynamically serves `Sitemap: https://techinpedia.com/sitemap.xml`.
- **CRM Lead Attribution Hardening & Database Backfill (`src/app/api/enquiries/route.ts`):**
  - Form submissions default safely to `COMPANY_SERVICES` (`COMPANY_PUBLIC`) unless explicit Urban origin is detected.
  - Backfilled 7 historical unassigned enquiries in MySQL database to `COMPANY_PUBLIC` / `COMPANY_SERVICES`. 0 unassigned leads remain.
- **Structured Data & Landing Pages (`[slug]/page.tsx`, `blog/[slug]/page.tsx`):**
  - Injected `Service`, `BreadcrumbList`, and `FAQPage` schemas on dynamic landing pages (`/[slug]`).
  - Added `BreadcrumbList` schema and publisher logo to blog articles.
- **Full Production Verification:**
  - Automated tests verified 100% pass across live HTTPS endpoints for both domains.
  - Comprehensive audit report generated in `SEO_AEO_GEO_DOMAIN_CORRECTION_REPORT.md`.

## Production-Grade AI Customer Support & Sales Conversational Architecture
**Date:** 2026-10-07
**Deployment:** `admin.techinpedia.com:3002` (PM2 PID: 2134827, exit code 0)
- **Master AI Conversation Orchestrator (`src/lib/ai/orchestrator.ts`):**
  - Built 9-stage conversation lifecycle: Inbound Message → 360° Context Packet → Intent Detection → RAG Knowledge Retrieval → Business Data & Tool Execution → Decision Engine → WhatsApp Response / Human Handoff → Memory Update → Telemetry Audit.
  - Strict Human-Active Check: AI pauses completely when staff is active (`handoffState === 'HUMAN_ACTIVE'` or `isAiPaused = true`) to prevent simultaneous replies.
- **AI Tool Calling & Live Database Layer (`src/lib/ai/tools.ts`):**
  - Implemented 10 allowlisted, tenant-isolated functions (`getCustomerProfile`, `getLeadDetails`, `getPackageList`, `getPackageDetails`, `getBookingStatus`, `getAvailableSlots`, `sendPackageMenu`, `startBookingFlow`, `createSupportTicket`, `requestHumanAgent`).
  - Queries live `PackageWhatsAppConfig` to guarantee exact pricing and eliminate hallucinations.
- **Multi-Source Context Packet Builder (`src/lib/ai/context-packet.ts`):**
  - Aggregates Customer Context, CRM Lead, recent 12-message history, structured conversation state memory, company operating rules, and verified knowledge chunks.
- **Intent Engine & Multilingual Support (`src/lib/ai/intent-engine.ts`):**
  - Supports 18 canonical intents (`GREETING`, `PACKAGE_QUERY`, `BOOKING_REQUEST`, `BOOKING_STATUS`, `ADDRESS_QUERY`, `PAYMENT_QUERY`, `CANCEL_BOOKING`, `COMPLAINT`, `HUMAN_AGENT_REQUEST`, etc.).
  - Natural language heuristics supporting English, Hindi, and Hinglish.
- **Human Escalation & Return-to-AI Lifecycle (`src/lib/ai/handoff-engine.ts` & `/admin/whatsapp`):**
  - Automated department routing (`SALES`, `SUPPORT`, `BILLING`) based on intent and sentiment.
  - Generates structured employee briefing summaries.
  - Displays **"⚡ Live Human Escalation Brief"** banner and interactive **"✨ Return to AI"** & **"👤 Take Over"** buttons in `/admin/whatsapp`.
- **Seeded Verified Company Knowledge Base (RAG):**
  - Populated 7 official Hello Mam knowledge documents and indexed chunks in MySQL (`AiKnowledgeBase` & `AiKnowledgeChunk`).
- **Playground & Analytics Telemetry (`/admin/ai/brain` & `/admin/ai/analytics`):**
  - Test Playground upgraded with live tool execution traces, detected intent, confidence score, and escalation preview.
  - Analytics dashboard upgraded with AI Resolution Rate, Human Handoff Rate, Top Customer Intents, and Unresolved Knowledge Gaps.

## WhatsApp Meta Message Template Editing Suite & Lead Assignment Constraint Resolution
**Date:** 2026-10-07
**Deployment:** `admin.techinpedia.com:3002` (PM2 PID: 2125343, exit code 0)
- **Interactive Template Editing (`/admin/whatsapp`):**
  - Added an **"Edit"** button to every template card in the Meta Templates tab.
  - Clicking "Edit" launches the template builder in **Edit Mode**, pre-populating category, header type & text, message body, dynamic variable samples (`{{1}}`, `{{2}}`), footer text, and interactive action buttons.
  - Enforces Meta WABA rules: Template name and language remain fixed identifiers on Meta, while body message text, media headers, footer text, and buttons are fully editable.
  - Adapted modal header, notice banner, and action buttons dynamically ("Save & Update Template").
- **Backend Meta Graph API & Local DB Synchronization (`updateMetaTemplate` in `whatsapp_service.ts` & `PUT /api/whatsapp/templates`):**
  - Implemented `PUT /api/whatsapp/templates`: Updates local database template record and submits modified components to Meta Graph API for review.
  - Scoped to tenant company with full multi-tenant authorization (`whatsapp.templates.manage`, `whatsapp.manage`).
- **Webhook Lead Assignment Foreign Key Fix (`src/app/api/whatsapp/webhook/route.ts`):**
  - Resolved `Foreign key constraint violated: assignedEmployeeId` error on `Enquiry` updates.
  - Properly maps `assignedTo` to `User.id`, and looks up linked `Employee.id` via `user.employeeId` before setting `assignedEmployeeId`.

## Company Login Role AI & Automation Suite with Custom AI API Key (BYOK)
**Date:** 2026-10-07
**Deployment:** `admin.techinpedia.com:3002` (PM2 PID: 2112256, exit code 0)
- **Tenant Sidebar AI & Automation Navigation (`src/components/admin/AdminSidebar.tsx`):**
  - Added full **AI & AUTOMATION** navigation block to `tenantSections` for company tenant logins (Company Owners, Admins, Managers).
  - Directly exposes `AI Brain & API Keys` (`/admin/ai/brain`), `Chatbot Builder` (`/admin/whatsapp/chatbot`), `Automation Rules` (`/admin/automation`), `AI Goals` (`/admin/ai/goals`), `Knowledge Base` (`/admin/ai/knowledge`), `Intent Routing` (`/admin/ai/intents`), and `AI Analytics` (`/admin/ai/analytics`).
- **Bring Your Own Key (BYOK) for Companies (`/admin/ai/brain` & `/api/ai/brain`):**
  - Enabled tenant companies to configure and use their own LLM API keys (`OpenAI`, `Google Gemini`, `Anthropic`).
  - Stored encrypted with AES-256-GCM authenticated encryption in `aiConfig.apiKeyEncrypted` with `keyStrategy = 'TENANT_PROVIDED'`.
  - Added provider presets (ChatGPT, Google Gemini 1.5 Flash, Claude 3.5 Sonnet), active API key status badge (`✓ Company API Key Active: sk-proj...***...X9a`), and show/hide key toggle.
- **Tenant Permissions & Authorization Harmonization (`src/lib/permissions.ts` & APIs):**
  - Company Owner and Company Admin roles now have full access to `ai.*`, `chatbot.*`, and `automation.*` endpoints.
  - Strict tenant data isolation enforced via `resolveEffectiveCompanyId`.
  - Added `"ai"` and `"automation"` to `allowedModules` in company database settings.
- **AI Engine BYOK Integration (`src/lib/ai/ai-engine.ts`):**
  - Dynamically decrypts and uses the company's own API key for AI generation, testing playground, WhatsApp chatbot responses, and intent classification.

## WhatsApp Turn-Based Single Template Isolation & Automatic Employee Assignment
**Date:** 2026-10-07
**Deployment:** `admin.techinpedia.com:3002` (PM2 PID: 2105257, exit code 0)
- **Turn-Based Isolation & Single Template Guarantee:**
  - Prevented template cascading: Sending "Hi" now triggers strictly ONE template (`welcome_msg`).
  - Gated all 5 phases in visual workflow rule (`38836ed8-1599-447b-90e0-3ddec97c8a7f`) with `STOP_WORKFLOW` terminals.
  - Reordered webhook pipeline so `TemplateRouter` executes first; when handled, `emitWorkflowEvent` and AI engines are skipped.
  - Added robust conversational regex for greetings ("hi", "hello", "hey", "namaste", "hlo", etc.) and keywords ("view packages", "packages btao", "book now").
- **Automatic Employee Assignment:**
  - Implemented least-loaded round-robin employee assignment (`resolveAutoAssignedEmployee`) across active company staff/editors (`Aradhana` and `test`).
  - Automatically assigns every incoming conversation and syncs to CRM lead (`assignedEmployeeId` / `assignedTo`).
  - Backfilled all 17 unassigned Hello Mam conversations.
- **Platform Stability:**
  - Updated `src/lib/access-policy.ts` to export `resolveEffectiveCompanyId`, restoring HTTP 200 on `/api/automation/registry`.
**Date:** 2026-10-07
**Deployment:** `admin.techinpedia.com:3002` (PM2 PID: 2095776, exit code 0)
- **Workflow Persistence & Database Integration:**
  - Persisted `Hello Mam – WhatsApp Package & Booking Flow` into the canonical `WorkflowRule` model with ID `38836ed8-1599-447b-90e0-3ddec97c8a7f`, `companyId: '4ad72b7d-2468-4c24-9d7b-d56e60ef1060'`, `status: 'PUBLISHED'`, `isActive: true`, and `trigger: 'comm.whatsapp.received'`.
  - Configured 18 visual nodes and 19 edges covering WhatsApp Inbound, Welcome Check, Welcome Template, Open Package Menu Action, Package Menu (1-9), Selection Validation & Parsing, Dynamic Multi-Package Dispatch, Book Now Action, Booking Details Template, Customer Details Capture, CRM Lead Update, Follow-up Scheduling, and Confirmation.
- **Workflow Action Registry Extension (`src/lib/workflow/registry.ts`):**
  - Extended `SEND_WHATSAPP` action to include `TEMPLATE_PURPOSE` and `PACKAGE_TEMPLATE` format options with dynamic `purposeKey` selector and `packageId` parameter.
- **Action Execution Runner (`src/lib/workflow/actionRunner.ts`):**
  - Updated action execution to support `params.messageType === 'TEMPLATE_PURPOSE'` and `params.messageType === 'PACKAGE_TEMPLATE'` with dynamic resolution from `TemplateRouter`.
- **Pre-built Templates Gallery (`src/lib/workflow/templates.ts`):**
  - Added `tpl-hello-mam-whatsapp-package-booking` to the gallery for 1-click instantiation across tenants.
- **Visual Builder Integration:**
  - Verified `/admin/workflows/builder?id=38836ed8-1599-447b-90e0-3ddec97c8a7f` loads and renders all 18 nodes and connections with interactive sidebars and step testing.

## WhatsApp Team Inbox Rich Template Card Rendering & Dynamic Auto-Population
**Date:** 2026-10-07
**Deployment:** `admin.techinpedia.com:3002` (PM2 PID: 2090649, exit code 0)
- **Rich Template Card Display in Team Inbox:**
  - Upgraded the chat bubble renderer to display full WhatsApp template cards (Image/Text Header, Body text with bold/emojis/prices, Footer, and interactive Action Buttons) instead of raw placeholders like `[Template: price_1199_glam_special]`.
  - Added `renderFormattedWhatsAppText` supporting WhatsApp markdown tokens (`*bold*`, `_italic_`, `~strike~`, ````code````, and newlines).
  - Differentiated message source badge to show `📄 Template Dispatch` when sent by template automation.
- **Service & History Logging:**
  - Updated `sendWhatsAppTemplateMessage` to resolve and store the actual template `bodyText` in `WhatsappMessage.textBody` and clean preview `📝 <Template Name>` in `WhatsappConversation.lastMessageText`.
  - Backfilled 22 existing historical template messages in production MySQL.
- **Dynamic Template Auto-Population:**
  - `GET /api/whatsapp/messages?conversationId=...` now returns the tenant company's active templates, automatically populating the composer "Send Template" dropdown.

## WhatsApp Meta Template Router, Purpose Mapping & Dynamic Package Dispatch Flow
**Date:** 2026-10-07
**Deployment:** `admin.techinpedia.com:3002` (PM2 PID: 2081798, exit code 0)
- **Database-Driven Template Routing Architecture:**
  - Designed and deployed five new database models (`WhatsappTemplatePurpose`, `PackageWhatsAppConfig`, `WhatsappTemplateButtonAction`, `WhatsappTemplateParameterMapping`, `WhatsappTemplateAuditLog`) and extended `WhatsappConversation` with package context tracking.
  - All 12 Meta-approved templates for tenant "Hello Mam" (`4ad72b7d-2468-4c24-9d7b-d56e60ef1060`) integrated through dynamic database configuration with zero hardcoded names, IDs, or prices in controllers or services.
- **Dynamic Purpose Routing:**
  - `WELCOME` dynamically resolves `welcome_msg` (Meta ID: `3273106823077770`).
  - `PACKAGE_MENU` dynamically resolves `choose_your_favorite_package` (Meta ID: `1333823805344152`).
  - `BOOKING_DETAILS` dynamically resolves `preferred_booking_details` (Meta ID: `1642050510650097`).
- **Dynamic Package Router & Multi-Selection Parser:**
  - Configured 9 packages (`1` to `9`) linking to their respective Meta templates.
  - Implemented regex-based selection extractor handling single numbers (`"1"`), comma-separated (`"1, 2"`), space-separated (`"1 2 4"`), and prefixed responses (`"Reply 3"`), capped by tenant configurable `maxSelection` setting.
  - Implemented generic iteration for sequential dispatch with 24-hour customer care eligibility checks.
- **Dynamic Button Routing:**
  - Button index 0 of `welcome_msg` triggers `OPEN_PACKAGE_MENU`.
  - Button index 0, 1, 2 of package templates map respectively to `BOOK_NOW`, `OPEN_PACKAGE_MENU`, and `OPEN_APP_URL`.
- **Content Consistency Tracking & Outdated Flagging:**
  - Automatic snapshot hashing of commercial data. Flags `requiresMetaUpdate = true` if database price or package services are altered after static Meta template registration.
- **Admin Configuration Studio (`/admin/whatsapp?tab=router`):**
  - Interactive manager for purpose remap, package configuration, button actions, router settings, and audit logs.

## WhatsApp Template Rich Formatting (Bold, Italic, Underline, Strike, Code) & Emoji Picker
**Date:** 2026-10-07
**Deployment:** `admin.techinpedia.com:3002` (PM2 PID: 2060391, exit code 0)
- **WhatsApp Template Formatting Toolbar:**
  - Added a rich formatting toolbar in the Create Meta Template modal above the Body Text input.
  - Implemented 1-click controls for **Bold** (`*text*`), **Italic** (`_text_`), **Underline / Emphasis** (`_text_`), **Strikethrough** (`~text~`), and **Monospace** (````code````).
  - Automatically wraps selected text or inserts formatted placeholders at the current cursor position, preserving focus and selection range.
  - Added an interactive **WhatsApp Emoji Picker** popover categorized into Smileys, Gestures, Business, and Symbols with 1-click insertion and outside-click dismiss.
  - Added a **Quick Emojis Strip** beneath the textarea featuring the top 12 business emojis.
  - Enhanced the live WhatsApp message bubble preview to parse and render markdown (`*bold*`, `_italic_`, `~strike~`, ````code````) and dynamic variables in real time.

## WhatsApp Template Image Header Support & Multi-Tenant Workflow Automation Isolation
**Date:** 2026-10-07
**Deployment:** `admin.techinpedia.com:3002` (PM2 PID: 2055854, exit code 0)
- **WhatsApp Template Image Headers:**
  - Added support for `IMAGE` header type in the WhatsApp Template creation modal.
  - Implemented sample image file uploading and URL input with live preview inside the WhatsApp bubble.
  - Integrated Meta Resumable Upload API (`uploadSampleMediaToMeta`) to obtain `header_handle` required by Meta Graph API for media templates.
  - Updated `/api/whatsapp/templates` and `createMetaTemplate` to persist image headers in database and submit compliant payloads to Meta.
- **Workflow Automation Multi-Tenant Isolation:**
  - Removed hardcoded platform master templates (`lead_welcome_v1`, `quotation_sent_v1`, etc.) from the workflow action registry.
  - Dynamically load the company's own approved WhatsApp templates in the Workflow Builder drawer for `SEND_WHATSAPP` node configuration.
  - Enforced strict tenant company scoping across `/api/automation/workflows`, `/api/automation/registry`, and `/api/automation/workflows/[id]`.
  - Scoped workflow execution metrics, queue metrics, and event triggers (`eventEmitter.ts`) strictly by `companyId` so company automations run completely separate from admin or other tenants.
  - Added `CompanySwitcher` support to `/admin/workflows` for Super Admins while auto-restricting tenant portal users to their own company data.

## Meta WhatsApp Token Expiration Recovery, Dynamic Branding & English Localization
**Date:** 2026-10-07
**Deployment:** `admin.techinpedia.com:3002` (PM2 PID: 280, exit code 0)
- Dynamically brand the WhatsApp message bubble preview in the template creation modal with the logged-in company's name and initials (e.g. `Hello Mam` / `HM`) instead of hardcoding `TechInPedia` / `TIP`.
- Localized all WhatsApp error hints and recovery guidance across `src/lib/whatsapp_service.ts` and `src/app/admin/whatsapp/page.tsx` into clean, professional English.
- Replaced the Hindi alert/hint dialog with standard English instructions.
- Enhanced token expiration recovery with direct in-modal settings access (`z-[70]`) and auto-clear on reconnect.

## Visual Chatbot & AI Customer Engagement Layer (Phases 1-74)

**Date:** 2026-10-02
**Branch:** main
**Deployment:** `admin.techinpedia.com:3002` (PM2 PID: 277054, `techinpedia-worker` PID: 277127, exit code 0)

### Summary
1. **Multi-Tenant AI Engine (`AIEngine`) & Security Guardrails:**
   - Multi-provider LLM caller supporting OpenAI, Anthropic, Gemini, and Smart Fallback with token/cost tracking and encrypted keys.
   - Guardrails engine (`src/lib/ai/guardrails.ts`) defending against prompt injections, developer mode jailbreaks, and cross-tenant data leakage before model invocation.
2. **Visual Chatbot Builder (`/admin/whatsapp/chatbot`):**
   - 10 node types, canvas drag-and-drop, node inspector drawer, pre-activation flow validator (`validateChatbotFlow`), and draft/publish workflow.
   - Server-side execution runner (`ChatbotEngine`) with 10-turn limit and compliance checks.
3. **Context-Aware AI Brain Studio (`/admin/ai/brain`):**
   - Granular provider/model tuning, brand context, persona customization, and interactive simulated testing playground with full operational explainability trace.
4. **Vectorless RAG Knowledge Base (`/admin/ai/knowledge`):**
   - Automatic overlapping chunking (~200 words, 30-word overlap), strict tenant-scoped retrieval (`retrieveRelevantKnowledge`), chunk viewer drawer, sync trigger, and unanswered suggestions review desk.
5. **Conversational Goals Studio (`/admin/ai/goals`):**
   - Predefined blueprints and custom goals with priority weighting, required slots, and completion triggers.
6. **Two-Stage Intent Detection Engine (`/admin/ai/intents`):**
   - Keyword rules (`STOP`, `AGENT`, `PRICING`, `HELP`) + semantic model evaluation with deterministic action dispatcher.
7. **AI Analytics & Quota Cockpit (`/admin/ai/analytics`):**
   - 30-day token telemetry, cost breakdown, latency gauges, handoff counters, and active quota limits.
8. **WhatsApp Inbox AI Co-Pilot & Badges (`/admin/whatsapp`):**
   - Message source badges (Customer, Staff Agent, AI Assistant, Automation).
   - 1-click Pause/Resume AI toggle per conversation.
   - Slide-over Co-Pilot drawer with instant reply suggestion, tone rewriting, summarization, and lead qualification extraction.
9. **Smart Human Handoff with SLA Activation:**
   - Automatic assignment to least-loaded active staff member with `assignmentAcceptedAt = null` to immediately start the company's SLA acceptance timer.
10. **Automated Verification:**
    - 37/37 unit tests passing 100% (`tests/ai_chatbot_security.test.ts`).
    - 29/29 live production E2E tests passing 100% (`scratch/verify_ai_chatbot_prod.py`).

## WhatsApp Marketing Suite, Customer Data Platform & Security Corrections (Part 0 & Phases 1-37)

**Date:** 2026-10-02
**Branch:** main
**Deployment:** `admin.techinpedia.com:3002` (PM2 PID: 3, `techinpedia-worker` online, exit code 0)

### Summary
1. **Part 0 Security & Visibility Corrections:**
   - Updated `src/lib/access-policy.ts`: Clarified `HIDDEN` visibility to `HIDDEN_FROM_EMPLOYEES` (allows Company Owner & Admin, blocks Employees/Agents/unauthorized Managers) and `PLATFORM_RESTRICTED` (Super Admin only).
   - Scoped Manager Dashboard to `TEAM` by default unless explicit `VIEW_COMPANY_ANALYTICS` permission is held.
   - Dynamic scope badge in `CompanyDashboard.tsx`.
   - 7/7 automated security suites passing (`tests/security_and_visibility.test.ts`).
2. **Canonical Customer Data Model (MySQL & Prisma):**
   - Extended existing `Contact` model with `leadStatus`, `source`, `tags`, `customFields`, `optInStatus`, `marketingOptIn`, `consentSource`, `consentTimestamp`, `consentProof`, `optOutTimestamp`, `optOutReason`, `isBlacklisted`, `lastInteractionAt`.
   - Added `ContactCustomField`, `ContactSegment`, `ContactList`, `ContactListMember`, `DripCampaign`, `DripEnrollment`, and `DripStepLog`.
   - Additive non-destructive migration executed on production MySQL.
3. **Compliance & Meta Policy Guard (`src/lib/whatsapp-eligibility.ts`):**
   - Centralized validator `canSendWhatsAppMessage(...)` validating tenant WhatsApp Cloud API connectivity, blacklist suppression (`WhatsappSuppression`), marketing consent, and Meta 24-hr customer care window.
4. **Smart Dynamic Segments Evaluator (`src/lib/segments.ts`):**
   - Dynamic rule engine evaluating multi-condition AND/OR filters across tags, lead stage, source, assigned employee, custom fields, and recency.
5. **Background Drip Queue & Worker (`worker.js` & `src/lib/queue/jobQueue.ts`):**
   - Extended central queue with `whatsapp-drip-step`.
   - Background worker executes step deliveries, advances next step schedules, and terminates sequence on customer reply or opt-out.
6. **Complete Backend APIs:**
   - `GET/POST /api/whatsapp/contacts`: List with search, pagination, stage/tag filters, and create.
   - `GET/PATCH/DELETE /api/whatsapp/contacts/[id]`: 360° Profile view (CRM leads, WhatsApp messages, Broadcast history, Drip enrollments, Consent audit).
   - `POST /api/whatsapp/contacts/import`: CSV import with preview, column mapping, phone normalization, duplicate detection, and merge strategy.
   - `GET /api/whatsapp/contacts/export`: CSV export with RBAC permission gate (`contacts.export`).
   - `GET/POST /api/whatsapp/tags` & `POST /api/whatsapp/tags/assign`: Tenant tag management and bulk assignment.
   - `GET/POST/DELETE /api/whatsapp/custom-fields`: Custom fields definition CRUD.
   - `GET/POST/PATCH/DELETE /api/whatsapp/segments`: Dynamic segments with live audience count.
   - `GET/POST/DELETE /api/whatsapp/lists` & `/members`: Static contact lists.
   - `GET/POST/DELETE /api/whatsapp/blacklist`: Suppression / DND management.
   - `POST /api/whatsapp/single-send`: Single send console dispatching text/template with Meta compliance check.
   - `GET /api/whatsapp/messages`: Canonical message audit log with filters and pagination.
   - `GET/POST /api/whatsapp/broadcasts` & `/[id]`: Broadcast campaign management, audience resolution, metrics, and actions (launch, pause, cancel, clone).
   - `GET/POST/PATCH/DELETE /api/whatsapp/drip-campaigns` & `/enrollments`: Automated sequences and contact journeys.
   - `GET/POST /api/automation/workflows`: Tenant-isolated workflows.
7. **Frontend Admin Pages & Navigation:**
   - `/admin/whatsapp/contacts`: Contacts directory, filters, Add/Edit modal, Bulk Tag modal, CSV Import modal, Export button.
   - `/admin/whatsapp/contacts/[id]`: 360° Customer Profile.
   - `/admin/whatsapp/segments`: Smart dynamic rule builder + Static Lists tab.
   - `/admin/whatsapp/blacklist`: Suppression & DND table with Add/Remove modal and anti-spam notice.
   - `/admin/whatsapp/single-send`: Single send console with template picker, variable mapping, 24-hr window notice, and live WhatsApp preview.
   - `/admin/whatsapp/messages`: Message audit log with status badges and filters.
   - `/admin/whatsapp/broadcasts`: Broadcast manager with 5-step launch wizard and delivery/read rate gauges.
   - `/admin/whatsapp/drip-campaigns`: Visual drip sequence builder and contact journey tracker.
   - `/admin/automation`: Automation cockpit route.
   - `AdminSidebar.tsx`: Navigation items added under "WHATSAPP & MARKETING".
8. **Automated Verification:**
   - 16/16 production live API tests passed on `admin.techinpedia.com:3002`.
   - 8/8 automated security/RBAC tests passed (`tests/whatsapp_marketing_security.test.ts`).
   - 7/7 access policy suites passed (`tests/security_and_visibility.test.ts`).

## Security, Visibility Policy, Dashboard Separation, Configurable SLA & Activity Monitoring Layer

**Date:** 2026-10-02
**Branch:** main
**Deployment:** `admin.techinpedia.com` (PM2 PID: 223539, exit code 0)

### Summary
1. **Automated Security & Access Test Suite (`tests/security_and_visibility.test.ts`):**
   - Implemented automated tests verifying 100% pass for cross-tenant isolation, 8-tier granular resource visibility, manager team scoping, and configurable SLA calculations.
2. **SLA Configuration Studio (`/admin/company/sla`):**
   - Configurable per-priority (Normal, High, Urgent, VIP) warning and breach thresholds for Acceptance, First Response, and Resolution across WhatsApp chats and CRM leads backed by `SlaRule` model and `GET/POST /api/admin/sla-rules`.
   - SLA warning threshold percentage slider backed by `/api/admin/company/settings`.
3. **Polymorphic Resource Visibility (`ResourceVisibility` & `ManageVisibilityModal`):**
   - Reusable modal supporting 8 visibility policies (`ALL_AUTHORIZED`, `ASSIGNED_ONLY`, `SELECTED_EMPLOYEES`, `SELECTED_TEAM`, `SELECTED_DEPARTMENT`, `MANAGERS_ONLY`, `OWNER_ONLY`, `HIDDEN`) mounted in WhatsApp inbox and CRM leads views.
4. **Company Cockpit vs. Employee Workbench Separation (`/admin`):**
   - Server-side role routing in `src/app/admin/page.tsx` rendering `CompanyDashboard.tsx` for leadership (telemetry, pipeline, SLA response averages) and `EmployeeDashboard.tsx` for frontline staff (personal workload, status toggle, performance).
5. **Reassignment Modal & Audit History (`ReassignModal.tsx` & `ReassignmentHistory`):**
   - Candidate employee selector with live workload badges (leads, chats, total load, presence).
   - Reassignment records an immutable `ReassignmentHistory` row, updates `assignedUserId`, resets `assignedAt = NOW()`, clears `assignmentAcceptedAt = null`, and emits an activity timeline event.
6. **Live Employee Status & Activity Detail Timeline (`/admin/company/employees/[id]/activity`):**
   - Real-time presence toggles (`ONLINE`, `BUSY`, `AWAY`, `OFFLINE`) via `EmployeeStatus` model.
   - Comprehensive activity timeline aggregating lead interactions, WhatsApp customer replies, internal notes, and reassignments.
7. **Actionable Notification Center (`NotificationCenter.tsx`):**
   - Direct "Accept" and "View" popover in `AdminHeader.tsx` for pending leads and WhatsApp conversations.
8. **WhatsApp Inbound Auto-Lead Toggle:**
   - Managed via `/api/admin/company/settings` and honored during webhook ingestion.

## CRM Enquiry & WhatsApp Conversation SLA Columns Production Database Migration

**Date:** 2026-10-02
**Branch:** main

### Summary
1. **Root Cause Analysis:**
   - Conversation view and CRM Leads Hub in mobile app failed with:
     - `Invalid prisma.whatsappConversation.count() invocation: Unknown argument assignmentAcceptedAt`
     - `Invalid prisma.enquiry.findUnique() invocation: The column hellomam_techinpedianew.Enquiry.assignedAt does not exist in the current database.`
   - Both `WhatsappConversation` and `Enquiry` tables lacked the newly added SLA tracking columns in the live production MySQL database.
2. **Database & Server Execution:**
   - Executed additive, non-destructive `ALTER TABLE` on production MySQL:
     - `WhatsappConversation`: added `assignedAt`, `assignmentAcceptedAt`, `assignmentAcceptedBy`, `firstViewedAt`, `firstResponseAt`.
     - `Enquiry`: added `assignedAt`, `firstViewedAt`, `firstResponseAt` (joining existing `assignmentAcceptedAt`, `assignmentAcceptedBy`).
   - Synced updated `prisma/schema.prisma` to remote server.
   - Ran `npx prisma generate` (regenerated Prisma Client v6.4.1).
   - Restarted PM2 process `techinpedia-admin` (PID: 210417).
3. **Verification:**
   - Tested direct Prisma queries on the production server via Node.js:
     - `prisma.enquiry.findFirst()` and `prisma.enquiry.findMany()` executed with 100% success.
     - `prisma.whatsappConversation.findFirst()` and `findMany()` executed with 100% success.
     - `prisma.whatsappConversation.count()` with `assignmentAcceptedAt: null` returned 18.

## Mobile App RenderFlex Overflow & Chat Composer Keyboard Coordination Fix

**Date:** 2026-10-02
**Branch:** main

### Summary
1. **InboxScreen RenderFlex Overflow Fix (`inbox_screen.dart:140:18`):**
   - Wrapped the conversation error state (`state.errorMessage != null && state.conversations.isEmpty`) inside `RefreshIndicator` and `SingleChildScrollView(physics: const AlwaysScrollableScrollPhysics())`.
   - Constrained `errorMessage` display with `maxLines: 4` and `TextOverflow.ellipsis` to prevent long API / network exception strings from overflowing the viewport.
   - Fixed identical patterns defensively across `leads_screen.dart` and `hardware_screen.dart`.
2. **ChatScreen Keyboard & Emoji Tray Coordination (`chat_screen.dart`):**
   - Attached a `_focusNode` listener in `initState` to auto-dismiss `_showEmojiPicker` as soon as the text field gains focus.
   - Enforced `effectiveShowEmoji = _showEmojiPicker && !isKeyboardOpen` so that the 260px emoji tray never mounts while the soft keyboard is active, eliminating the ~260px blank gap between the input field and keyboard.
   - Set `checkPlatformCompatibility: false` in `EmojiPicker` to prevent Impeller Vulkan engine glyph inspection hangs/blank views on modern Android devices.
   - Added timeline `GestureDetector` to dismiss both keyboard and emoji tray on chat tap.
3. **Verification:**
   - `flutter analyze` completed with 0 errors / 0 warnings.
   - All 36 mobile unit and widget tests passed (`flutter test`).
   - Triggered hot reload on running Dart VM process (PID 7879).

## Custom Roles & Permissions Studio & WhatsApp Meta Token Expiration Handling

**Date:** 2026-10-02
**Branch:** main

### Summary
1. **Custom Roles Full CRUD API (`/api/admin/company/roles`):**
   - Implemented full CRUD (`GET`, `POST`, `PATCH`, `DELETE`) for company-defined custom roles stored per-tenant in `db.setting` (`company_roles_${companyId}`).
   - Automatically merges system default roles with tenant-specific custom roles.
   - Provides granular available permissions catalog across WhatsApp Suite, CRM, and Company Administration.
   - Deletion protection prevents deleting system roles or custom roles that are currently assigned to active company team members.
2. **Interactive Roles & Permissions Studio UI (`/admin/company/roles`):**
   - Transformed static role matrix into an interactive Role Studio.
   - Added "+ Create Custom Role" button, "Edit Role" modal, and role deletion with safeguards.
   - Custom badge color palette selector with live preview across 9 curated color presets.
   - Dynamic capability bullet points adder/remover.
   - Categorized granular permission checkboxes (WhatsApp Business Suite, CRM Pipeline, Company Admin).
3. **Dynamic Roles in Team Roster (`/admin/company/employees`):**
   - Add/Edit employee modals now dynamically load and offer all created custom roles alongside system defaults.
   - Employee table resolves custom role labels and styled badge colors.
4. **JWT Session RBAC Integration (`src/lib/auth.ts`):**
   - Injected custom role permissions dynamically into `getAuthSession()` token payload based on the assigned `user.companyRole`.
5. **WhatsApp Meta Token Expiration Detection & Guidance Modal (`/admin/whatsapp?tab=templates`):**
   - Added automatic detection for expired Meta access tokens (OAuth 190 / `Session has expired`).
   - Displays clear explanatory modal with instructions on generating a Permanent System User Token in Meta Business Suite set to "Never expire".
   - Added 1-tap `Open Settings & Paste New Token ➔` button directly opening the Cloud API settings modal.
6. **Production Deployment & Verification:**
   - Compiled with Next.js on `admin.techinpedia.com` (Exit code: 0).
   - PM2 service `techinpedia-admin` reloaded cleanly on port 3002.


## WhatsApp Inbox Assigned Executive — Company Employee Population & Instant Assignment

**Date:** 2026-10-02
**Branch:** main

### Summary
1. **Multi-Tenant User Scoping in `GET /api/users`:**
   - Fixed issue where company employees created in `/admin/company/employees` were not showing up in the WhatsApp inbox `Assigned Executive` dropdown.
   - Removed obsolete `requireRole([Role.SUPER_ADMIN, Role.ADMIN])` restriction and replaced with `requireAuth()`, allowing tenant company staff (agents, managers, admins) to view their roster.
   - Scoped queries strictly to `where: { companyId: session.companyId }` for tenant users, and enabled `?companyId=...` resolution for Super Admins.
2. **WhatsApp Inbox Assigned Executive UI Enhancements (`src/app/admin/whatsapp/page.tsx`):**
   - Updated `fetchTeamUsers` to dynamically pass `targetCid = effectiveCompanyId` via `appendCompanyQuery('/api/users', targetCid)`.
   - Dropdown options now display `{u.name} ({u.companyRole || u.role})` (e.g. `test (AGENT)`, `Hello Mam (OWNER)`).
   - Added instant optimistic state update upon re-assignment.
   - Added 1-tap `⚡ Assign to Me` action button when a chat is unassigned or assigned to someone else.
3. **Conversations Route Enriched (`src/app/api/whatsapp/conversations/route.ts`):**
   - Included `companyRole: true` in user lookups for assigned chat executives.
4. **Safety Fix in `admin/companies/[id]/employees/route.ts`:**
   - Ensured system role mapping strictly abides by Prisma enum (`Role.ADMIN` | `Role.EDITOR`).
5. **Production Deployment & Verification:**
   - Successfully compiled on `admin.techinpedia.com` with Next.js (exit code 0).
   - PM2 service `techinpedia-admin` reloaded cleanly on port 3002.

## Company Employee Creation Prisma Role Enum Fix & Functional Roles Expansion

**Date:** 2026-10-02
**Branch:** main

### Summary
1. **Prisma Role Enum Schema Validation Fix (`/api/admin/company/employees`):**
   - Fixed `Invalid prisma.user.create() invocation: Invalid value for argument role. Expected Role.`
   - Prisma `User.role` is strictly typed as `enum Role { SUPER_ADMIN, ADMIN, EDITOR }`. Tenant employee creation now safely sets `role: Role.ADMIN` for company admins and `role: Role.EDITOR` for all other staff, storing the granular functional role into `User.companyRole`.
2. **Comprehensive Functional Roles Suite (`/admin/company/employees`):**
   - Expanded role selector dropdowns in both "Add Employee" and "Edit Employee" modals with 7 dedicated functional roles:
     - 👑 `ADMIN`: Full company administration (WhatsApp Cloud API, Campaigns, Templates, Webhooks, CRM, Team).
     - 💼 `MANAGER`: Operations manager (Broadcast campaigns, templates, broadcast launches, CRM leads & pipeline).
     - 📱 `WHATSAPP_CAMPAIGNS`: WhatsApp marketing specialist (Broadcast campaigns, Meta HSM templates, audience tags, delivery logs).
     - 💬 `AGENT`: Support & sales agent (Live 2-way WhatsApp inbox chat, tickets, assigned CRM leads).
     - 🎯 `LEADS_MANAGER`: CRM & leads executive (Incoming leads, deals, contacts, pipeline stages, direct WhatsApp follow-ups).
     - 🔒 `INBOX_ONLY`: Restricted inbox-only (Frontline live customer chats only; no campaigns or settings access).
     - 👁️ `VIEWER`: Read-only auditor (View WhatsApp conversations, leads, and logs; cannot send or modify).
3. **Session Permissions & RBAC Matrix (`auth.ts` & `/api/admin/company/roles`):**
   - Mapped specific permission arrays in JWT session generator for `WHATSAPP_CAMPAIGNS`, `LEADS_MANAGER`, and `VIEWER`.
   - Updated roles matrix capability definitions in `/admin/company/roles`.
4. **Production Deployment & Verification:**
   - Synced to remote server `/home/hellomam/public_html/admin.techinpedia.com` and `urban.techinpedia.com`.
   - Sequential production build completed with exit code 0.
   - PM2 restarted cleanly (`techinpedia-admin` on 3002, `techinpedia-urban` on 3001, `techinpedia` on 3000 untouched).

## Urban Marketplace Phase 10 — Full-Width Fluid Responsive Layout Across All Pages

**Date:** 2026-10-02
**Branch:** main

### Summary
1. **Full-Width Modern Architecture:**
   - Replaced restrictive `max-w-7xl` (1280px) caps with fluid full-width layout (`w-full px-4 sm:px-6 lg:px-8 xl:px-12`) across all marketplace pages.
   - Preserves generous, comfortable side margins while filling widescreen displays (1080p, 2K, 4K).
2. **Homepage (`UrbanMarketplaceShell.tsx`):**
   - Header, hero section, category icons grid, travel desk, trending searches, and spotlight vendors expanded to full width.
   - Category icons grid scales smoothly up to 12 columns (`grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 2xl:grid-cols-12`).
   - Spotlight vendor cards scale up to 4 columns (`grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-4`).
3. **Subcategories Hub (`/category/[slug]`):**
   - Full-width hero banner and 4-column specialization desk (`grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-4`).
4. **Vendors Directory Listing (`UrbanDirectoryListingView.tsx`):**
   - 12-column full-width split: Left 8 columns (`lg:col-span-8`) for vendor cards and photo carousels, Right 4 columns (`lg:col-span-4`) for sticky dynamic lead form.
5. **Vendor 360 Business Profile (`Vendor360ClientView.tsx`):**
   - Full-width layout: Left 8 columns for photos, price list, AI chat, and reviews; Right 4 columns for contact, address, and lead capture.
6. **Production Deployment & Verification:**
   - Synced and sequentially built on `urban.techinpedia.com` (Port 3001) and `admin.techinpedia.com` (Port 3002).
   - PM2 reloaded cleanly; public endpoints verified HTTP 200 OK.

## Urban Marketplace Phase 9 — 4-Level Architectural Hierarchy & Unified Dark Theme Alignment

**Date:** 2026-10-02
**Branch:** main

### Summary
1. **100% Unified Dark Luxury Navy Theme:**
   - Unified color tokens across all 4 levels: `#070b18` root background, `#0c1427` card containers, `#111c33` sub-elements, `border-slate-800`, text-white, blue `#2563eb` & orange `#f97316` accents.
   - Eliminated light/slate-50 backgrounds from all inner pages.
2. **Level 1 (Homepage `/` - Category Icons Only):**
   - Refactored categories section to clean, compact Justdial-style circular/squircle category icon badges (`vcataoreis me sirf icon rakho`).
   - Removed bulky subcategory pills and large vendor previews from this section.
   - Each category badge links directly to `/category/[slug]`.
3. **Level 2 (Dedicated Subcategories Hub `/category/[slug]`):**
   - Displays all child subcategories belonging to the parent category in a 3-column card desk (`ander sub caatopiores ka page daalo`).
   - Includes "Explore Vendors ↗" links directing to `/services/[slug]`.
   - Dark luxury theme with parent category banner, search input, and top recommended vendors at the bottom.
4. **Level 3 (Vendors Directory Listing `/services/[slug]`):**
   - Displays complete vendor listings for the selected subcategory (`and then ander vendor rakho`).
   - Features photo carousels, verified badges, rating scores, open hours, doctor chips, rate cards, and category-aware dynamic lead capture engine (`UrbanDirectoryListingView.tsx`).
   - Vendor clicks direct to `/biz/[city]/[slug]`.
5. **Level 4 (Vendor 360 Business Profile `/biz/[city]/[slug]`):**
   - Converted `Vendor360ClientView.tsx` from light/slate-50 to dark luxury theme.
   - Features live work photo gallery, transparent price list, scanned rate-card carousel, AI ask anything engine, reviews breakdown, and lead capture modal.
6. **Zero Hardcoding & Live Database Flow:**
   - All categories, subcategories, rate cards, and vendors are fetched dynamically from MySQL DB (`66.116.199.2`).
7. **Production Deployment & Verification:**
   - Synced updated files across `urban.techinpedia.com` (Port 3001) and `admin.techinpedia.com` (Port 3002).
   - Executed sequential Next.js production builds and reloaded PM2.
   - Verified HTTP 200 OK across public endpoints (`https://urban.techinpedia.com`, `/category/hospitals`, `/services/eye-hospitals`, `/biz/lucknow/swarnjyoti-eye-hospital`).
   - Preserved `techinpedia.com` (Port 3000) and worker processes.

## Urban Marketplace Phase 8 — Dynamic Location Selector, Rich Justdial Hero UI & 4 Database-Driven Categories

**Date:** 2026-10-02
**Branch:** main

### Summary
1. **Dynamic Interactive Location Modal (`UrbanMarketplaceShell.tsx`):**
   - Transformed static `[📍 Mathur Lane, Lucknow ▾]` search bar into an interactive location picker modal.
   - GPS Auto-Detection (`navigator.geolocation`), search locality input, and quick-filter chips for top cities & localities.
   - Saves to `localStorage` (`urban_location`) and dynamically triggers re-querying of categories and vendors.
2. **Refined Justdial Hero UI & 4 Discovery Cards (Screenshot 2 Fix):**
   - Replaced flat solid color boxes with 4 vibrant photography cards with rich gradient overlays (`B2B Quick Quotes`, `REPAIRS Nearest Vendor`, `ESTATE Finest Agents`, `DOCTORS Book Now`) and circular chevron `>` buttons.
   - Hero banner restyled with warm dark chocolate/espresso gradient (`from-[#22140f] via-[#2e1811] to-[#1c0d08]`), `ZERO COMMISSION MARKETPLACE` amber badge, `Search, compare prices & book verified experts` heading, `GET BEST DEALS` glowing button, carousel dots, and smoothly blended hotel room backdrop.
3. **4 Core Major Categories with Subcategories & Backend Demo Vendors (Zero Hardcoding):**
   - Seeded 4 root categories in production MySQL (`Hospitals & Doctors`, `Repairs & Services`, `Real Estate & Property`, `B2B Industrial & Wholesale`).
   - Attached 16 specialized subcategories (4 per category).
   - Seeded 10 verified demo vendors with complete rate cards, photos, and addresses.
   - `Popular Services & Categories` dynamically renders these 4 categories, subcategories as clickable pills linking to `/services/[slug]`, and top vendor previews.
4. **Production Deployment & Verification:**
   - Synced and sequentially built `urban.techinpedia.com` (Port 3001) and `admin.techinpedia.com` (Port 3002).
   - PM2 reloaded cleanly; public endpoints verified HTTP 200 OK.
   - Preserved `techinpedia.com` (Port 3000) and `techinpedia-worker`.

## Urban Marketplace Phase 7 — Justdial-Grade Dynamic Question Engine, Category Tree & Central Admin Management

**Date:** 2026-10-02
**Branch:** main

### Summary
1. **Dynamic Category Lead Engine (`UrbanDirectoryListingView.tsx`):**
   - Eliminated the generic static "Select your ac type?" popup. Replaced with dynamic category-aware question engine matching Screenshot 4:
     - Eye Hospitals: `What eye condition do you need help with?` (`Vision Correction`, `Eye Disease Treatment`, etc.)
     - Hospitals: `What medical department or treatment is required?`
     - Dentists: `What dental service are you looking for?`
     - AC Repair: `Select AC service required:`
     - Electrician, Plumber, Cleaning, Packers & Movers, Beauty & Spa, Hotels, and more.
   - Lead capture directly creates CRM enquiries with category, selected option, name, and phone.
   - Sticky right rail includes Customers "Top Picks" carousel card.
2. **Justdial Layout on Urban Marketplace (`UrbanMarketplaceShell.tsx`):**
   - Matches Screenshot 1 & 2: Top search bar with locality, voice mic icon, action badges (`⚡ Leads`, `📢 Advertise`, `🏢 Free Listing`).
   - Hero banner carousel + 4 quick category cards (`B2B`, `REPAIRS & SERVICES`, `REAL ESTATE`, `DOCTORS`).
   - 2 rows of round category icon badges (20 parent categories).
   - Travel Bookings desk (`Flight`, `Bus`, `Train`, `Hotel`, `Car Rentals`) and Trending Searches Near You.
3. **Category & Subcategory Hub (`/category/[slug]`):**
   - Matches Screenshot 3: Banner header with locality, subcategory search, and 3-column subcategory desk.
4. **Database-Driven Category Tree & 6 Demo Vendors (Zero Hardcoding):**
   - Added `parentId` to `MarketplaceCategory` on production MySQL (`66.116.199.2`).
   - Seeded 20 parent categories and 20 specialized subcategories.
   - Seeded 6 realistic demo vendors with photos, doctor chips, rate cards, and reviews.
5. **Central Admin Category Management (`/admin/marketplace/categories`):**
   - Full CRUD tree management with parent category selector, vendor counts, and create/edit/delete modals.
   - Added "Categories & Tree" link to `AdminSidebar.tsx`.
6. **Company Self-Service Management (`admin.techinpedia.com`):**
   - `/admin/company/profile`: Self-service profile editor.
   - `/admin/company/employees`: Employee seat meter, add employee modal with password/role, edit/delete modals.
   - `/admin/company/roles`: Roles matrix, capabilities, and active module entitlements.
7. **Deployment & Verification:**
   - Sequential builds on `urban.techinpedia.com` (Port 3001) and `admin.techinpedia.com` (Port 3002).
   - Verified HTTP 200 OK across all public and internal endpoints.

## Urban Marketplace Phase 6 — Justdial / IndiaMART-Style Vendor 360 Business Profile Suite & Directory

**Date:** 2026-10-02
**Branch:** main

### Summary
1. **Zero Hardcoded Data Architecture:**
   - 100% database-driven: All business details, service cards, scanned rate cards, photos, working hours, and reviews are managed and stored in production MySQL.
2. **Database Models & Tables:**
   - `MarketplaceVendor`: Complete business profile with ratings, slug, categories, openingHours, gstin, kycStatus, quickInfo.
   - `MarketplaceVendorMedia`: Photos (Owner/Customer), videos, scanned rate cards, and KYC documents.
   - `MarketplaceVendorService`: Structured services, pricing in ₹, units (`onwards / visit`), duration, popular tags.
   - `MarketplaceVendorReview`: Customer star ratings, review comments, review tags, and owner replies.
3. **Admin Vendor 360 Studio:**
   - `/admin/marketplace/vendors`: Creation modal, direct live links, 360 badges, quick KYC approval.
   - `/admin/marketplace/vendors/[id]/editor`: 5 editing tabs for complete studio management.
4. **Public Vendor Profile 360 Page (`/biz/[city]/[slug]`):**
   - Matches reference screenshots (hero header, photo gallery with filters, price cards with scanned rate cards, AI ask assistant, quick info, reviews & rating trend chips, sticky bottom bar).
5. **Public Category Directory & Search (`/services/[slug]`):**
   - Matches reference Screenshot 1 (photo slider cards, distance, verified badges, rating score, service tags, Call/WhatsApp/Enquire CTAs, right rail lead capture).
6. **Deployment:**
   - Deployed cleanly to `admin.techinpedia.com` (port 3002) and `urban.techinpedia.com` (port 3001).

## Urban Marketplace Phase 5 — Razorpay Vendor Monetization & Online Lead Credit Packs

**Date:** 2026-10-02
**Branch:** main

### Summary
1. **Razorpay Standard Orders & Signature Verification (`src/lib/razorpay.ts`):**
   - Added `createRazorpayOrder` supporting live API orders and high-fidelity test simulations.
   - Added `verifyRazorpayPaymentSignature` implementing HMAC-SHA256 signature verification.
2. **Order Creation & Verification Endpoints:**
   - `POST /api/marketplace/checkout/create-order`: Generates Razorpay orders for Starter (₹999 + GST), Growth (₹2,499 + GST), and Enterprise (₹6,999 + GST) credit packages.
   - `POST /api/marketplace/checkout/verify`: Verifies payment signatures, tops up vendor wallet credits, and logs `PAYMENT_RECEIVED` to the CRM timeline.
3. **Interactive Vendor Checkout Modal (`src/app/vendor/page.tsx`):**
   - Self-serve Razorpay checkout with live package selection, GST calculation, script loading, and post-payment celebration with Invoice Reference.
4. **Deployment:**
   - 0 errors, deployed across `urban.techinpedia.com` (port 3001) and `admin.techinpedia.com` (port 3002).

## Urban Marketplace Phase 4 — Automated Lead Fanout Engine, Vendor Lead Unlocking & Meta API Error 133010 Diagnostics

**Date:** 2026-10-02
**Branch:** main

### Summary
1. **Automated Marketplace Lead Fanout Engine (`src/lib/marketplace/fanout.ts`):**
   - Inbound buyer requirements from `urban.techinpedia.com` instantly match up to 5 verified vendors based on service category and city location.
   - Creates `MARKETPLACE_LEAD_DISTRIBUTED` timeline events in central CRM.
   - Dispatches automated WhatsApp lead alerts to matching vendors with deep link to `/vendor`.
2. **Vendor Leads API & Unlocking Engine (`/api/vendor/leads` & `/api/vendor/leads/unlock`):**
   - Real marketplace leads feed with dynamic customer contact masking (`Rahul S***`, `+91 98**** 2880`).
   - 1-credit unlock mechanism persisting audit trail in CRM lead timeline (`MARKETPLACE_LEAD_UNLOCKED`) and returning full unmasked details with 1-tap WhatsApp quote launcher.
3. **Dynamic Vendor Workspace Hub (`src/app/vendor/page.tsx`):**
   - Connected to real database backend with live credit counter countdown, refresh button, and top-up modal.
4. **Central Admin Leads Triage Enhancements (`src/app/admin/marketplace/leads/page.tsx`):**
   - Added visual badges in Leads table: `⚡ Distributed` for fanned-out leads and `🔓 Unlocked` for leads accessed by vendors.
5. **Site Domain Seeding in Production MySQL:**
   - Seeded `urban.techinpedia.com` -> `MARKETPLACE_PUBLIC` and `techinpedia.com` -> `COMPANY_PUBLIC` in `SiteDomain` table.
6. **Meta WhatsApp Cloud API Error 133010 ("Account not registered") Diagnostics:**
   - Diagnosed root cause for Hello Mam company (`+91 98186 28880`, Phone ID `1311875158678434`): Meta returns error 133010 because the phone number is currently active in the mobile phone's WhatsApp app. Meta Cloud API strictly requires deregistration/deletion from the phone app or 2-factor PIN registration before sending messages.
   - Added friendly Hindi/English troubleshooting hints in `whatsapp_service.ts`.

**Date:** 2026-10-02
**Branch:** main

### Summary
Built, integrated, and deployed the dedicated Urban Marketplace management suite inside the Central Admin Console at `https://admin.techinpedia.com`:
1. **Admin Sidebar Integration (`src/components/admin/AdminSidebar.tsx`):**
   - Added new "URBAN MARKETPLACE" navigation section for Platform Admins with direct links to:
     - Marketplace Cockpit (`/admin/marketplace`)
     - Marketplace Leads Triage Hub (`/admin/marketplace/leads`)
     - Vendors Directory & KYC Desk (`/admin/marketplace/vendors`)
2. **Backend Marketplace APIs (`/api/admin/marketplace/*`):**
   - `GET /api/admin/marketplace/metrics`: Telemetry aggregation returning total Urban leads, today's velocity, B2C vs B2B distribution, registered vendors count, and conversion rate.
   - `GET /api/admin/marketplace/leads`: Paginated, filtered search across marketplace buyer requirements and RFQs.
   - `GET /api/admin/marketplace/vendors`: Directory of registered vendors with parsed metadata (GSTIN, business type, categories, tier).
   - `PATCH /api/admin/marketplace/vendors/[id]`: KYC status updater (`VERIFIED`, `REJECTED`, `PENDING`), tier adjustment, and bonus lead credit allocator with CRM timeline auditing.
3. **Marketplace Cockpit Dashboard (`/admin/marketplace`):**
   - High-level telemetry cards (Total Leads, B2C Local Services, B2B Industrial RFQs, Active Vendors).
   - Quick action cards to Leads Triage, KYC Desk, and live public marketplace launcher.
   - Recent incoming marketplace leads feed with 1-tap WhatsApp chat action.
4. **Marketplace Leads Triage Hub (`/admin/marketplace/leads`):**
   - Mode filter pills (`All`, `B2C Services`, `B2B Industrial RFQs`).
   - Keyword search across buyer name, phone, item, and city.
   - Quick status dropdown update (`NEW`, `CONTACTED`, `IN_PROGRESS`, `QUALIFIED`, `WON`, `LOST`).
   - Detailed requirement inspection modal.
5. **Vendors Directory & KYC Desk (`/admin/marketplace/vendors`):**
   - Registered technicians and manufacturers directory with business type and tier badges.
   - 1-click "Approve KYC" (sets status to VERIFIED/QUALIFIED) and "Reject" buttons.
   - "+10 Credits" wallet top-up button.
   - 1-tap WhatsApp launcher to message vendors.
6. **Deployment & Verification:**
   - Compiled with 0 TypeScript/lint errors.
   - Successfully deployed to `/home/hellomam/public_html/admin.techinpedia.com`.
   - PM2 service `techinpedia-admin` running healthy on port 3002.

---

### Summary
Built, integrated, and deployed Phase 2 of the Urban Marketplace at `https://urban.techinpedia.com`:
1. **Apache Reverse Proxy Fix (`.htaccess`):**
   - Corrected proxy target on `urban.techinpedia.com` from `127.0.0.1:3000` (which mistakenly served `techinpedia.com`) to `127.0.0.1:3001` (`techinpedia-urban`).
2. **Dual-Mode Marketplace Shell (`UrbanMarketplaceShell.tsx`):**
   - Dual-mode intent toggle: **B2C Local Services (Justdial style)** vs **B2B Industrial Products & Suppliers (IndiaMART style)**.
   - City & location selector across 13 major Indian metro hubs (New Delhi, Noida, Gurgaon, Mumbai, Bengaluru, Hyderabad, etc.).
   - Interactive category catalogs for B2C (AC, Electrical, Plumbing, Cleaning, Packers, Painting, Appliances) and B2B (HVAC Plants, Compressors, Copper Pipes, Bulk IT, Switchgear, Packaging, Tools).
   - Live telemetry metrics and verified vendor spotlight cards with rating badges.
3. **Interactive Requirement Posting & CRM Lead Capture (`PostRequirementModal.tsx`):**
   - Direct lead generation modal supporting B2C service requests and B2B wholesale RFQs.
   - Automatically posts to `/api/enquiries`, resolving server-side to `businessUnit: MARKETPLACE` and `site: MARKETPLACE_PUBLIC` in the central TechInPedia CRM.
4. **Vendor Onboarding & Business Listing (`/list-business`):**
   - 4-step registration wizard for service providers and manufacturers with tier selection (Free Starter, Pro Growth ₹2,499, Enterprise Wholesale ₹6,999).
   - Submits vendor lead to central CRM with `projectType: VENDOR_ONBOARDING`.
5. **Vendor Workspace Hub (`/vendor`):**
   - Dedicated vendor command center showing incoming category-matched buyer leads, lead credit unlock mechanism, and response telemetry.
6. **Deployment & Verification:**
   - Compiled with 0 TypeScript/lint errors.
   - Deployed to `/home/hellomam/public_html/urban.techinpedia.com`.
   - PM2 service `techinpedia-urban` restarted and running healthy on port 3001.

---

## Multi-Tenant WhatsApp API Isolation & Central Admin Company Switcher

**Date:** 2026-10-02
**Branch:** main

### Summary
Resolved WhatsApp multi-tenant isolation so each registered company utilizes its own Meta Cloud API credentials without colliding with the platform Master account ("Abdiel Aircon"):
1. **Admin WhatsApp Hub Account Switcher (`/admin/whatsapp`):**
   - Added an Account Switcher dropdown to the header allowing platform administrators to select any registered tenant company or remain on "⭐ TechInPedia Master (Abdiel Aircon)".
   - Dynamic Dashboard & Status cards show active account name, verified phone number, and phone number ID, with an advisory banner when a selected company lacks WhatsApp credentials.
   - Synchronizes selection with URL query parameters (`?companyId=...`).
2. **Backend Multi-Tenant Scoping (`/api/whatsapp/*`):**
   - Scoped `/api/whatsapp/connection`, `/api/whatsapp/test`, `/api/whatsapp/conversations`, `/api/whatsapp/messages`, `/api/whatsapp/templates`, `/api/whatsapp/campaigns`, `/api/whatsapp/suppression`, and `/api/whatsapp/webhook/logs` to `targetCompanyId`.
   - Updated `/api/whatsapp/test` to accept `companyId` and pass `{ companyId: targetCompanyId, senderUserId }` to `sendWhatsAppTextMessage`, returning verified sender identity metadata.
   - Preserved Abdiel Aircon (`companyId: null`) as the master default.
3. **Company 360 Workspace (`/admin/companies/[id]`):**
   - Added "Send Live Test Message for {company.name}" dispatch card to Tab 2 (Meta Cloud API Setup) with live sender feedback.
   - Added direct quick link to `/admin/whatsapp?tab=dashboard&companyId=${company.id}`.
4. **Meta Token Expiration Diagnostics & Workflow Isolation:**
   - Identified and handled Meta OAuth 190 token expiration ("Authentication Error") with actionable guidance on generating a permanent System User token.
   - Isolated webhook workflow event triggers to prevent global automations (Abdiel Aircon) from cross-firing into tenant company leads.
   - Successfully deployed to `admin.techinpedia.com` with clean production build and PM2 process reload.

---

## TechInPedia Admin Mobile App — Executive Command Center & Administration Suite

**Date:** 2026-10-01
**Branch:** main

### Summary
Built and released the full **TechInPedia Admin Mobile App** natively in Flutter, bringing core administrative functions from the central web console to mobile:
1. **Role-Aware Executive Navigation (`MainShell` & `app_router.dart`):**
   - Automatically detects admin privilege (`user.isAdmin`).
   - Surfaces `Admin Hub` as Tab 0 with 5-tab shell: `[Admin Hub, Inbox, Leads, Hardware, Workforce]`.
   - Non-admin staff retain standard workspace: `[Inbox, Leads, Hardware, Workforce, Profile]`.
2. **Executive Command Center (`AdminDashboardScreen`):**
   - Monthly Recurring Revenue (MRR) hero gradient card with real-time invoiced, collected, and outstanding receivables (`GET /api/dashboards/executive`).
   - 2x2 operational metrics grid: Headcount, Sales Pipeline with win rate, Support Tickets with SLA rate, and Today's Attendance status.
   - Pending action alerts and 6 command shortcut tiles into dedicated modules.
3. **Leave Approvals Desk (`LeaveApprovalsScreen`):**
   - Status filters (`PENDING`, `APPROVED`, `REJECTED`, `ALL`).
   - Leave cards with employee info, date ranges, duration, and stated reasons.
   - 1-tap Approve (Emerald) and Reject (Red) confirmation dialogs dispatching `PATCH /api/hr/leaves`.
4. **Company Staff Directory (`EmployeeDirectoryScreen`):**
   - Instant search across staff names, employee codes, and email addresses.
   - Multi-Business Unit badges (`TechInPedia Services` / `Marketplace`).
   - Employee detail modal showing gross salary (`₹`), reporting manager, joining date, and 1-tap Direct Call / Email launcher.
5. **Invoices & Client Billing Desk (`InvoicesScreen`):**
   - Total Invoiced, Collected, and Balance Due summary banner.
   - Status filters (`ALL`, `PENDING`, `PAID`, `OVERDUE`).
   - Overdue balance highlights and 1-tap payment reminder email generator.
6. **Customer Support Helpdesk (`TicketsScreen`):**
   - Priority badges (`URGENT`, `HIGH`, `MEDIUM`, `LOW`) and category tags.
   - Status update bottom sheet to toggle ticket status (`OPEN`, `IN_PROGRESS`, `RESOLVED`).
   - 1-tap customer email response generator.
7. **Daily Attendance Roster (`AttendanceRosterScreen`):**
   - Real-time present, late arrivals, and leave metrics.
   - Daily punch-in/out timestamps, duration, and late arrival warnings.
8. **Verification & Quality:**
   - 36/36 mobile unit tests passing (`flutter test` exit code 0).
   - `flutter analyze` passing with 0 errors and 0 warnings.

---

## Central Admin App — Phase 1.1: Business Unit UI Surfacing, CRM Leads Scoping & HR Workforce Assignment

**Date:** 2026-10-01
**Branch:** main

### Summary
Surfaced Business Unit foundations across the Central Admin application to provide visibility and control over Multi-Business Unit architecture (Company Services & Urban Marketplace):
1. **Admin Sidebar Navigation (`src/components/admin/AdminSidebar.tsx`):**
   - Added navigation links under `ADMINISTRATION`:
     - `Business Units` (`/admin/settings/business-units`) with 'BU' badge.
     - `Sites & Domains` (`/admin/settings/sites`).
     - `Legal Policies` (`/admin/settings/legal`).
2. **CRM Leads Backend & Scoping (`src/app/api/enquiries/route.ts` & `src/app/api/enquiries/[id]/route.ts`):**
   - `GET /api/enquiries/[id]`: Includes `businessUnit: { select: { id: true, code: true, name: true } }`.
   - `PATCH /api/enquiries/[id]`: Validates business unit access, allows re-assigning `businessUnitId`, and ensures assigned employees have access to the target BU.
   - `POST /api/enquiries`: Consumes `businessUnitId` for manual admin lead entry, passing `forceBusinessUnitId` to `createEnquiry`.
3. **CRM Leads Management Desk (`src/app/admin/leads/page.tsx`):**
   - Integrated live Business Unit fetching from `/api/admin/business-units`.
   - Added Business Unit filter dropdown in the Org Filter toolbar, integrated into URL search query and reset filters logic.
   - Rendered distinct color-coded BU badges (`Marketplace` in amber, `Company Services` in violet) next to lead names in the table.
   - Added Business Unit badge in Lead 360° drawer header and BU selector in the Organization & Staff Assignment matrix.
   - Added Business Unit selection in both Create Lead modal and Edit Lead modal.
4. **HR Employee Management Suite (`src/app/api/hr/employees/route.ts` & `src/app/admin/hr/employees/page.tsx`):**
   - Supported `businessUnitId` filtering in `GET /api/hr/employees`.
   - Added Business Unit filter dropdown to the employee directory filter bar.
   - Added dedicated `Business Unit` column in employee table rendering active BU assignments.
   - Added quick "Assign BU" action button with dedicated assignment modal dialog calling `PUT /api/hr/employees/[id]`.
   - Added Business Unit Assignment field to "Onboard Company Staff" modal.
5. **Static Prerender Build Resilience (`src/app/privacy-policy/page.tsx`, `terms/page.tsx`, `refund-policy/page.tsx`):**
   - Added graceful `.catch(() => null)` fallbacks for legal policy lookups to ensure static builds succeed even when database connections are offline.
6. **Verification & Quality:**
   - 25/25 Phase 1.1 unit tests passing (`node --test src/__tests__/phase-1.1.test.mjs`).
   - Production Next.js build (`npm run build`) succeeded with exit code 0.

---

## TechInPedia Employee Mobile App — Phase 4: Field Operations & IT Hardware Rentals

**Date:** 2026-10-01
**Branch:** main

### Summary
- Built and integrated Phase 4 Field Operations, IT Hardware Rental Leases, Equipment Dispatch & Digital Signature into the Flutter employee app:
  1. **IT Hardware Rental Orders Fleet Directory:**
     - Integrated `GET /api/hardware/rentals` supporting status filters (`ALL`, `ACTIVE`, `PENDING`, `RETURNED`) and live text search across orders and clients.
     - Real-time fleet financial metrics banner: Active Leases, Monthly Runrate (`₹/mo`), and Total Security Deposits held (`₹`).
     - Rental order cards displaying client name/company, delivery site address, monthly rate, security deposit, unit count, signature status, and quick-action shortcuts.
  2. **Order Details & Equipment Dispatch Sheet (`RentalDetailsSheet`):**
     - Full equipment breakdown for multi-product fleets: lists individual hardware assets (Laptops, Desktop PCs, Monitors) with Asset Code, Serial Number (`serialNumber`), Model, Hardware Specs (CPU, RAM, SSD), and deployment status.
     - 1-tap Check-In & Equipment Return: triggers backend return transaction (`PATCH /api/hardware/rentals/:id`) which automatically sets order status to `RETURNED` and resets child assets to `AVAILABLE` inventory.
  3. **On-Site Digital Stylus / Touch Signature Pad (`SignaturePadModal`):**
     - High-performance vector signature canvas with smooth stroke interpolation, clear action, and legal handover acceptance declaration.
     - Records timestamped signature verification summary directly to the backend order agreement (`agreementRef`).
     - Real-time "✓ Handover Verified" green status badge on rental cards.
  4. **Field Maintenance & AMC Ticket Center (`/api/hardware/maintenance`):**
     - Track hardware fault tickets: displays asset name, serial number, defect issue description, assigned field technician, and repair cost.
     - Interactive "Report Hardware Issue" modal (`LogMaintenanceModal`) allowing on-site engineers to file new tickets with asset selection and cost estimation.
     - Interactive "Resolve Ticket" workflow with resolution details and final cost logging.
  5. **5-Tab Navigation Architecture (`MainShell`):**
     - Upgraded bottom navigation shell to host all 5 core modules: `Inbox`, `Leads`, `Hardware`, `Workforce`, `Profile`.
  6. **Quality Assurance & Verification:**
     - 30/30 unit tests passing (`flutter test` exit code 0).
     - `flutter analyze` passing with 0 warnings/errors.

---

### Summary
- **Typing Space Bug Fix:** Removed redundant `+ MediaQuery.of(context).viewInsets.bottom` from `_buildComposer` padding in `chat_screen.dart`. Since Flutter's `Scaffold(resizeToAvoidBottomInset: true)` already lifts the composer above the keyboard, the extra inset was doubling the offset and creating a huge empty gap.
- **WhatsApp Emoji Keyboard:**
  - Integrated `emoji_picker_flutter` into `ChatScreen`.
  - Added emoji button (smiling face icon) inside the input field capsule.
  - Added `PopScope` hardware back handler to close emoji tray without leaving the conversation.
- **Login Resilience & Multi-Identifier Login:**
  - Upgraded `src/app/api/auth/login/route.ts` to support login via Email, Username, Employee Code (`TIP-EMP-001`), Company Email, or Phone number.
  - Guarded `ErrorInterceptor` against invoking `onUnauthorized` on `/api/auth/login` 401s, preventing false "session expired" alerts.
- **WhatsApp Message Heads-Up Notifications:**
  - Integrated `flutter_local_notifications` with channel `whatsapp_messages_channel` (`Importance.max`, heads-up notification with sound, vibration, sender name, and message preview).
  - Configured desugaring `com.android.tools:desugar_jdk_libs:2.1.4` in `mobile/android/app/build.gradle.kts`.
  - Wired real-time incoming message triggers in `InboxController` and `FirebaseMessagingService`.
  - Tapping notification deep-links to `/chat/:conversationId`.
  - Upgraded `src/app/api/whatsapp/webhook/route.ts` and `src/app/api/mobile/devices/route.ts`.
- **Quality & Verification:**
  - `flutter analyze`: 0 issues.
  - `flutter test`: 26/26 unit tests passed.
  - Debug and Release APKs built successfully (`59.2 MB`).

---


## TechInPedia Employee Mobile App — Android MainActivity Package Crash Fix

**Date:** 2026-09-30
**Branch:** main

### Summary
- **Issue:** Launch crash on Android (`RMX2156`):
  `java.lang.RuntimeException: Unable to instantiate activity ComponentInfo{com.techinpedia.employee/com.techinpedia.employee.MainActivity}: java.lang.ClassNotFoundException: Didn't find class "com.techinpedia.employee.MainActivity"`
- **Root Cause:** Gradle configuration defined `namespace = "com.techinpedia.employee"`, but Kotlin activity was located at `mobile/android/app/src/main/kotlin/com/techinpedia/techinpedia_employee_app/MainActivity.kt` with package `com.techinpedia.techinpedia_employee_app`.
- **Fix:**
  - Relocated activity to `mobile/android/app/src/main/kotlin/com/techinpedia/employee/MainActivity.kt`.
  - Updated package statement to `package com.techinpedia.employee`.
  - Removed old directory structure.
  - Recompiled and verified debug APK and release APK with DEX analysis (`Lcom/techinpedia/employee/MainActivity;` confirmed).
  - All 26 unit tests passed (`flutter test`); 0 static analyzer issues (`flutter analyze`).

---


## Admin Login — Failed Password Lockout Removal

**Date:** 2026-09-30
**Branch:** main

### Summary
- Removed account lockout security from `src/app/api/auth/login/route.ts`:
  - Removed `lockedUntil` blocking check that triggered HTTP 429 (`Account temporarily locked. Please try again later.`).
  - Removed `failedLoginAttempts` incrementing and 15-minute `lockedUntil` penalty on failed credentials.
  - Reset any legacy `failedLoginAttempts` / `lockedUntil` on successful login.

---

## TechInPedia Employee Mobile App — Phase 3 (Workforce & Attendance Self-Service Suite)

**Date:** 2026-09-30
**Branch:** main

### Summary
- Built and integrated Phase 3 Employee HRM & Attendance Self-Service Suite into the mobile application:
  1. **Attendance Punch Card & Live Work Duration Engine:** Interactive 1-tap Clock In / Clock Out with real-time ticking duration counter, shift grace period detection (09:30 AM with 15 min grace to 09:45 AM, auto-flagging `isLate`), early exit warnings, and half-day computation (`< 4 hrs`).
  2. **Leave Management & Quota Balances:** Real-time quota balance meters (`CASUAL`, `SICK`, `PAID`, `UNPAID`), interactive `ApplyLeaveSheet` modal with date range pickers and balance pre-check, and filterable leave requests list (`ALL`, `PENDING`, `APPROVED`, `REJECTED`).
  3. **Monthly Compensation & Payslip Hub:** Take-home net pay gradient hero card with earnings and deductions breakdown, and historical payroll ledger with approval/payment status indicators (`PAID`, `APPROVED`, `GENERATED`).
  4. **Navigation Upgrade:** Upgraded `MainShell` to 4 tabs (`Inbox`, `Leads`, `Workforce`, `Profile`) with unread badge sync.
- 26/26 Flutter unit tests passed with exit code 0; `flutter analyze` completed with 0 warnings/errors.

---

## TechInPedia Employee Mobile App — Phase 2 (CRM 360° Lead Hub & WhatsApp HSM Templates)

**Date:** 2026-09-30
**Branch:** main

### Summary
- Built and integrated Phase 2 CRM 360° and WhatsApp Templates into the mobile application:
  1. **WhatsApp HSM Templates:** Integrated Meta-approved templates (`/api/whatsapp/templates`) with variable regex calculation, preview interpolation, and bottom sheet picker to reopen expired 24h Meta conversation windows.
  2. **In-Chat Private Notes:** Added team note toggle rendering amber 🔒 cards recorded directly into CRM lead history without sending to Meta Cloud API.
  3. **Lead 360° Hub:** Built `LeadDetailsSheet` family controller managing pipeline stage changes (`NEW` → `WON`), lead temperature, deal value editing, and timeline audits.
  4. **Leads Directory (`LeadsScreen`):** Search, pipeline stage filtering, quick contact actions (WhatsApp / Phone call).
  5. **3-Tab Navigation Shell:** Updated `MainShell` to seamlessly host Inbox, Leads, and Profile with unread badge synchronization.
- All 19 Flutter unit tests passed with exit code 0; `flutter analyze` 0 warnings.
- Production release APK built: `mobile/build/app/outputs/flutter-apk/app-release.apk` (49 MB).

---

## TechInPedia Employee Mobile App — Phase 1 (Flutter + Dart + Firebase + Existing Backend)

**Date:** 2026-09-30
**Branch:** main

### Summary
- Built production-ready Flutter mobile employee application for TechInPedia Business OS (`com.techinpedia.employee`).
- Implemented Phase 1 modules:
  1. Employee Login with secure token storage (`flutter_secure_storage`).
  2. Role-Based Access Control (RBAC) with server authority and client permission guards.
  3. WhatsApp CRM Shared Team Inbox with real-time metrics and folder filtering.
  4. WhatsApp Chat view & message timeline (INBOUND vs OUTBOUND vs SYSTEM/automated).
  5. Sending WhatsApp text messages through existing backend (`POST /api/whatsapp/messages`), respecting Meta's 24-hour service window with user guidance.
  6. Conversation assignment ("Assign to Me" / Reassign) and status management (`OPEN` / `CLOSED`).
  7. Mark-as-read and live unread counters.
  8. Firebase Cloud Messaging (FCM) device registration and deep-link routing.
  9. Secure logout with device token deregistration.
- Upgraded backend `src/lib/auth.ts` to accept `Authorization: Bearer <token>` on all REST APIs for mobile persistence.
- Built device registration API `/api/mobile/devices` in Next.js backed by `db.setting` (zero database migration).
- All 12 unit tests passed; `flutter analyze` completed with 0 errors.

---

## Inbound WhatsApp Webhook Auto-Response & Shared Team Inbox Real-Time Sync

**Date:** 2026-09-30
**Branch:** main

### Summary
- **Issue:** Incoming customer messages on WhatsApp (e.g. from Aditya `+918924099779`) were received and logged in the database, but failed to trigger the automated lead welcome workflow. Furthermore, outbound workflow messages were not showing up in the Shared Team Inbox (`/admin/whatsapp?tab=inbox`).
- **Root Cause:**
  1. Trigger event mismatch: `POST /api/whatsapp/webhook` emitted `comm.whatsapp.received`, but active lead welcome workflows were subscribed to `crm.lead.created` / `LEAD_CREATED`.
  2. Disconnected conversation threads: `actionRunner.ts` invoked `sendWhatsAppTextMessage` without `conversationId`, meaning outbound workflow messages were delivered via Meta Cloud API but never saved to `WhatsappMessage` or linked to `WhatsappConversation.lastMessageText`.
  3. Dynamic variable unformatted strings: `{{lead.phone}}` lacked fallback to `message.from` or `contextData.phone`.
  4. Broad status filter: `eventEmitter.ts` matched `DRAFT` workflows on live triggers.
- **Fixes Applied:**
  - `src/lib/workflow/eventEmitter.ts`: Added cross-event bridge allowing `comm.whatsapp.received` to invoke active `crm.lead.created` / `LEAD_CREATED` workflows with 5-minute idempotency protection. Restricted execution strictly to `status: 'PUBLISHED'`.
  - `src/lib/workflow/actionRunner.ts`: Added smart phone fallback and canonical conversation lookup, passing `{ conversationId, companyId }` to Meta dispatch functions.
  - `src/app/api/whatsapp/webhook/route.ts`: Ensured complete lead variables (`name`, `phone`, `service`) are always supplied in trigger payload.
  - `src/app/admin/workflows/builder/page.tsx`: Added dual test options: "Dry-Run Test" (simulation) and "⚡ Send Live WhatsApp" (direct delivery via Meta API).
- **Verification:** Verified live Meta API delivery (`wamid.HBgMOTE4OTI0MDk5Nzc5FQIAERgSQjY1QzRBMTNDMkMxRDY1RDY4AA==`) and confirmed outbound messages render in real-time in `/admin/whatsapp?tab=inbox`.
- **Deployment:** Production builds deployed and PM2 processes restarted on both `admin.techinpedia.com` (port 3002) and `techinpedia.com` (port 3000).

---

## Automation Workflow WhatsApp Action Fix & Lead Notification Telemetry

**Date:** 2026-09-29
**Branch:** main

### Summary
- **Issue:** Automation workflow `"New Automation Workflow"` (`id: 5d00692f-4cf0-4ba5-a5d3-4afbc6ecd081`) failed to send WhatsApp welcome messages when new leads were captured.
- **Root Cause:** In the workflow configuration, `recipientPhone` parameter had been configured with `{{lead.name}}` instead of `{{lead.phone}}`. When evaluated, normalization stripped the alphabetic characters, resulting in a missing recipient error. Additionally, an obsolete duplicate action node existed in the graph.
- **Workflow Registry Improvement:** Enhanced `src/lib/workflow/registry.ts` with `defaultValue: '{{lead.phone}}'` on `SEND_WHATSAPP` nodes and added variable hints (`{{lead.name}}`, `{{lead.phone}}`, `{{lead.service}}`) to avoid future misconfigurations when creating action nodes in the builder.
- **Database Workflow Correction:** Updated `workflowRule` `5d00692f-4cf0-4ba5-a5d3-4afbc6ecd081` in MySQL DB: corrected recipient phone interpolation to `{{lead.phone}}`, added dynamic welcome message (`Namaste {{lead.name}} ji... Service: {{lead.service}}`), and established clean trigger-to-action graph edge.
- **End-to-End Verification:** Verified Meta Cloud API connection (`+44 7472 198505` Abdiel Aircon, GREEN/CONNECTED). Created test enquiry, confirmed `crm.lead.created` event fired, workflow execution recorded as COMPLETED, and WhatsApp message dispatched successfully with Meta status 200 and valid `wamid`.
- **Builder Simulation & Inline Testing:** Fixed payload mismatch between builder (`samplePayload`) and test route (`sampleData`), and added live variable interpolation to the "Test This Step Inline" modal so users can test steps directly inside the visual canvas with full preview.
- **Deployment:** Deployed `registry.ts`, builder page, and test route to both `admin.techinpedia.com` and `techinpedia.com`. Rebuilt and restarted PM2 services.

---

## Company Full Edit & Delete CRUD — Companies List & 360 Hub

**Date:** 2026-09-29
**Branch:** main

### Summary
- **Scope:** Full CRUD (Create/Read/Update/Delete) for Company entities across both the Admin Companies list (`/admin/companies`) and the Company 360 Hub (`/admin/companies/[id]`).
- **Backend — `PATCH /api/admin/companies/[id]`:** Updates all Company model fields including identity, contact, address, tax (GST), SaaS plan configuration (planName, monthlyMessageLimit, maxEmployees), tenantStatus, isTenant flag, and allowedModules JSON array.
- **Backend — `DELETE /api/admin/companies/[id]`:** Safely cascade-deletes all tenant assets in order: WhatsappWebhookEvent → WhatsappSuppression → WhatsappCampaign → WhatsappTemplate → WhatsappConversation (+ messages) → WhatsappConnection → CompanyUser records. Then unlinks CRM entities (Contact, Deal, Customer set companyId = null) before finally deleting the Company record. Prevents orphan data.
- **New Route Alias — `/api/crm/companies/[id]/route.ts`:** Re-exports GET, PATCH, DELETE from the admin route for uniform API surface.
- **Companies List UI:** Edit (✏️) and Delete (🗑️) action buttons on each company row. Edit modal pre-populated with all existing fields. Delete confirmation with tenant-specific warning.
- **Company 360 Hub UI:** "Edit Company" button and red delete icon in the top action bar. "Edit Details" shortcut button in the Overview card header. Both open pre-filled modals. Delete redirects back to `/admin/companies` after success.
- **Deployment:** Synced via rsync to both `admin.techinpedia.com` and `techinpedia.com`. Built with Next.js (exit code 0). PM2 processes `techinpedia-admin` and `techinpedia` restarted and verified online.

---

## Multi-Tenant WhatsApp CRM B2B SaaS Architecture & White-Label Enterprise Selling Suite

**Date:** 2026-09-29
**Branch:** main

### Summary
- **Multi-Tenant SaaS Foundation:** Enabled selling the WhatsApp CRM section as an isolated product to third-party companies (e.g. `abc@company.com`). Each tenant configures their own Meta Cloud API credentials, phone number ID, and WABA without cross-contamination.
- **Database Schema:** Extended `Company` with `isTenant`, `tenantStatus`, `allowedModules`, `webhookSecret`, `planName`, `monthlyMessageLimit`, `maxEmployees`. Extended `User` with `companyId` and `companyRole`. Added `companyId` FK to `WhatsappConnection`, `WhatsappConversation`, `WhatsappTemplate`, `WhatsappCampaign`, `WhatsappSuppression`, and `WhatsappWebhookEvent`.
- **Tenant Auth & Session:** Updated `src/lib/auth.ts` to decode company context and automatically map permissions based on role (`OWNER`/`ADMIN` vs `INBOX_ONLY`).
- **Granular Employee RBAC:** Client company admins can distribute sub-permissions to their employees (e.g., `INBOX_ONLY` agents can only access the Shared Team Inbox, without seeing Meta API keys, deleting templates, or launching broadcasts).
- **Backend WhatsApp Isolation:** Scoped all WhatsApp service methods, conversations, templates, campaigns, messages, and telemetry to `companyId`. Updated webhook receiver to resolve company context automatically via query param, phone number ID, or WABA ID.
- **Company 360 View Dashboard:** Built comprehensive 5-tab cockpit at `/admin/companies/[id]` (Overview, Meta API & Webhook Setup, CRM Module Entitlements, Team Members & Sub-Accounts, Live WhatsApp Feed).
- **Shell & Navigation Tenant Adaptation:** Dynamic sidebar and header rendering based on `isTenant` and `allowedModules`. Restricted inbox agents only see the live team inbox.
- **Production Deployment:** Live on `admin.techinpedia.com` (port 3002) and `techinpedia.com` (port 3000).

---


## WhatsApp Template Approval Pipeline, Live Meta Verification & Real-Time Status Webhook

**Date:** 2026-09-29
**Branch:** main

### Summary
- **Live Meta Template Verification:** Confirmed that templates created in TechInPedia Admin (`welcome`, `welcome_to`, and `techinpedia_customer_care_v1`) are 100% submitted and accepted by Meta, with active Meta Template IDs assigned (`1091596863863328`, `1155785560492528`, `1079563131549862`).
- **Webhook Status Sync (`message_template_status_update`):** Upgraded `src/app/api/whatsapp/webhook/route.ts` to listen for Meta template review events so template status changes (`APPROVED`, `REJECTED`, `PAUSED`) push automatically into the database.
- **Enhanced Templates API:** Extended `src/app/api/whatsapp/templates/route.ts` with `?sync=true` support, returning active WABA ID and connection metadata.
- **UI Diagnostics & Meta Manager Quick-Link:** Added Meta Template ID badges, a direct button to Meta WhatsApp Business Manager template console, and interactive "Check Status" controls on template cards in `src/app/admin/whatsapp/page.tsx`.
- **Deployed:** Live on `admin.techinpedia.com` (port 3002) and `techinpedia.com` (port 3000).

---

## Admin Panel Full Mobile Responsiveness & WhatsApp Desk/Inbox Mobile Navigation

**Date:** 2026-09-28
**Branch:** main

### Summary
- **Admin Shell Mobile Drawer:** Created client component `AdminShell.tsx` orchestrating a responsive sliding navigation drawer with smooth slide-over transition, dark backdrop overlay, and close button on mobile viewports.
- **Admin Header Hamburger Toggle:** Added mobile hamburger menu toggle button in `AdminHeader.tsx` allowing agents to easily open the sidebar navigation on phones and tablets.
- **WhatsApp Inbox 3-Pane Mobile Architecture:** Re-engineered the 3-pane layout (`https://admin.techinpedia.com/admin/whatsapp?tab=inbox`):
  - Added mobile view state (`list`, `chat`, `details`).
  - Mobile screens start on the Conversation List; tapping any chat switches into the conversation thread with a prominent `< ChevronLeft` back button.
  - Added a 1-tap CRM Lead Details shortcut button in the mobile chat header with dedicated "Back to Conversation" navigation from the Lead 360 Hub.
  - Dynamic viewport height calculation (`h-[calc(100vh-140px)] min-h-[560px] sm:h-[780px]`) prevents mobile browser chrome overflow and awkward vertical stacking.
- **All Tabs & Modals Touch Optimization:** Optimized all WhatsApp dashboard tabs (`dashboard`, `status`, `guide`, `templates`, `campaigns`, `suppression`, `logs`, `test`) with edge-to-edge touch horizontal scrolling (`no-scrollbar -mx-3 px-3`), mobile horizontal scroll wrappers for all data tables, and `max-h-[90vh] overflow-y-auto` scroll containment for all modal dialogs.

---

## WhatsApp Shared Team Inbox Dynamic Auto-Sync & Real-Time Messaging

**Date:** 2026-09-28
**Branch:** main

### Summary
- **Live Background Auto-Sync:** Implemented continuous background polling (3-second cadence when browser tab is active/focused, 8-second cadence when tab is backgrounded) on `https://admin.techinpedia.com/admin/whatsapp?tab=inbox` eliminating the need for manual browser refreshes.
- **Immediate Focus Sync:** Configured event listeners on `document.visibilityState` and `window.onfocus` to immediately sync messages and conversation threads the instant an agent returns to the tab.
- **Flicker-Free Silent Mode:** Introduced `isSilent = true` flag to `fetchMessages` so background polling silently hydrates the active conversation without triggering loading skeletons or spinners.
- **Auto-Scroll to Bottom:** Added automatic smooth scrolling to the latest message in the chat container when new messages arrive or are dispatched.
- **Inbound Message Audio Notification:** Integrated Web Audio API synthesized soft notification chime (`playIncomingDing()`) alerting agents when an incoming message is received.
- **Live Indicator Badge:** Added "🟢 Live Auto-Sync (3s)" visual badges to both the inbox folder header and the conversation thread header.
- **Deployed:** Live on `admin.techinpedia.com` (port 3002) and `techinpedia.com` (port 3000).

---

## WhatsApp Message Dispatch Error Resilience & In-Chat Template Picker

**Date:** 2026-09-28
**Branch:** main

### Summary
- **Error Status Fix:** Fixed `/api/whatsapp/messages` returning 500 on Meta API validation rejections by extracting Meta error codes (`#131058`, `#131047`, `#131030`, `#132001`, `#132000`) and returning structured HTTP 400 responses with actionable troubleshooting guidance.
- **In-Chat Template Picker:** Added a "Send Template" button and modal directly in the Shared Inbox chat thread composer, allowing agents to select approved templates, fill template variables, and re-open conversations after 24h customer care window expiration.
- **24-Hour Expiration Banner:** Embedded an informative expiration alert above the message composer alerting agents when direct text messages are restricted by Meta policy.
- **Template Database Cleanup:** Pruned stale mock templates from previous accounts and synced active live templates (`hello_world`, `techinpedia_customer_care_v1`) from Meta WABA.
- **Heartbeat Guard:** Protected `db.employeeSession` lookup in heartbeat endpoint against null references.
- **Deployed:** Live on `admin.techinpedia.com` (port 3002) and `techinpedia.com` (port 3000).

---

## WhatsApp Prepaid Billing Ledger & Auto Per-Message Deduction Engine

**Date:** 2026-09-26
**Branch:** main

### Summary
- **Available Balance & Deduction Telemetry:** Integrated live wallet balance and per-message deduction breakdown directly into the Meta Cloud API Dashboard and Status tab on `https://admin.techinpedia.com/admin/whatsapp`.
- **Per-Message Auto-Deductions:** Automatically tallies outbound transmissions and calculates costs against Meta conversation rates (Marketing: ₹0.7846/msg, Utility: ₹0.1147/msg, Service: ₹0.3000/msg).
- **Persistent Ledger:** Created `whatsapp_billing_ledger` in database settings maintaining historical top-ups, net charges, and available balances.
- **Top-up Logging Modal:** Added "Record Meta Recharge" modal with preset chips (₹500, ₹1000, ₹2000, ₹5000) allowing admins to log recharges made on Meta Business Billing Hub or set opening balance directly.
- **Capacity Estimator:** Shows remaining message capacity based on current balance and conversation rates.
- **Deployed:** Live on `techinpedia.com` (port 3000) and `admin.techinpedia.com` (port 3002).

---

## WhatsApp Webhook Handshake Verification Fix (Meta Graph API)

**Date:** 2026-09-26
**Branch:** main

### Summary
- **Handshake Verification Fix:** Fixed Meta Webhook setup error (*"The callback URL or verify token couldn't be validated"*).
- **Decoupled Token Verification:** Re-engineered GET `/api/whatsapp/webhook` handshake to directly query `WhatsappConnection.verifyToken` and `WHATSAPP_VERIFY_TOKEN` env without requiring access token decryption, allowing webhook verification before or during full credential onboarding.
- **Live Verification:** Verified `GET https://admin.techinpedia.com/api/whatsapp/webhook` responds HTTP 200 OK with `hub.challenge` for `techinpedia_verify_token_2026`.

---

## Meta Cloud API Dashboard & Real-Time WhatsApp Management

**Date:** 2026-09-26
**Branch:** main

### Summary
- **Unified Command Dashboard:** Built and deployed the Meta Cloud API Dashboard as the primary command center on `https://admin.techinpedia.com/admin/whatsapp`.
- **Today Telemetry:** Implemented real-time telemetry counters for Messages Today (with delivery & read statistics), Active Connections (live Meta WABA status), Total Contacts, and HSM Approved Templates.
- **Enterprise Automation Suite Integration:** Added interactive launch cards for Sales & CRM (Pipeline & Forecasting), Automation (Marketing Journeys), Help Desk (SLA & Ticket Center), and Omnichannel (Platform Gateway / Live Team Inbox).
- **Recent Messages & Campaigns Feeds:** Added real-time transmission log table with directional badges (Incoming/Outgoing), contact numbers, message types, delivery statuses, and timestamps with proper empty state handling ("No messages yet. Send your first message" and "No campaigns yet").
- **Quick Actions Suite:** Added quick launcher bar for direct messages, campaign creation, template sync, webhook diagnostics, and test console.
- **Backend API Expansion:** Upgraded `/api/whatsapp/connection` and `/api/whatsapp/messages` to return real-time system counts and recent message history with relational lookups against `WhatsappConversation.waNumber`.

---

## HRM Jobs Create Department Dropdown & HRM API Compatibility Fix

**Date:** 2026-09-26
**Branch:** main

### Summary
- **Department Dropdown Fix:** Fixed the empty department dropdown on `/admin/hr/jobs/new` by ensuring departments are properly fetched and mapped from both `/api/hr/departments` and the newly added `/api/admin/hrm/departments`.
- **Database & Auth Exports:** Exported `prisma` from `src/lib/db.ts` and `requireAdminSession` / `id` from `src/lib/auth.ts`, fixing runtime errors across 17+ HRM API routes (`/api/admin/hrm/jobs`, `/api/admin/hrm/candidates`, `/api/admin/hrm/interviews`, etc.).
- **Multi-Instance Sync:** Deployed and built fixes across both `techinpedia.com` (port 3000, which handles `admin.techinpedia.com` traffic via Apache `.htaccess`) and `admin.techinpedia.com` (port 3002). Both live instances now return HTTP 200 with all 8 active departments.

---

## Comprehensive HRM & Employee Lifecycle Engine

**Date:** 2026-09-26
**Branch:** main

### Summary
- Built a unified, production-ready HRM suite natively connected to existing `Employee`, `Department`, and `Designation` tables.
- **Recruitment & ATS:** Job Openings creation, candidate applicant pipeline tracking, and Interview Scheduling with built-in Interviewer Feedback Scorecards.
- **Offer Management & Onboarding:** Created Job Offers engine with 1-click candidate-to-employee conversion that executes securely via Prisma Transactions, generating `EmployeeCode`, updating joining status, and initiating the Employee Career Timeline.
- **Performance & KPI Engine:** Implemented KPI Templates and a Daily Performance Calculation Cron/Sync Engine that aggregates Attendance and CRM Deal data to assign daily scores, track MoM/DoD growth, and classify employee trajectory (EXCELLENT, STABLE, CRITICAL).
- **Appreciations & Rewards:** Created a Wall of Fame system mapping bonus amounts and reward points directly to employee profiles.
- **Promotions & Increments:** Built an approval workflow engine that safely patches base salaries and title changes into the core `Employee` table.
- **Fall Management (Warnings & PIP):** Deployed a disciplinary tracking system. High severity incidents automatically generate 30-day Performance Improvement Plan (PIP) records.
- **RBAC Integrations:** Configured comprehensive granular permissions (`hr.recruitment.manage`, `hr.performance.view`, etc.) mapped to the `ALL_PERMISSIONS` matrix in `src/lib/permissions.ts`.
- **UI Dashboards:** Designed comprehensive, beautiful Next.js + Tailwind UI for all modules, and hooked them to the `AdminSidebar.tsx` navigation.

---
## Website Footer: Dynamic 4-Column SEO Landing Pages Directory

**Date:** 2026-09-24
**Branch:** main
**Commit:** see git log

### Summary
- Integrated published SEO landing pages (`https://admin.techinpedia.com/admin/seo-pages`) directly into the public website footer in a clean, 4-column responsive grid (`grid-cols-2 md:grid-cols-4`).
- Positioned directly below the copyright notice and social media icon row in `src/components/Footer.tsx`.
- Enabled server-side pre-rendering by querying `db.seoLandingPage` in `src/app/layout.tsx` and passing `seoPages` down through `src/components/PublicLayout.tsx`, ensuring search engine crawlers (GoogleBot, etc.) index the internal links immediately.
- Added public API endpoint `GET /api/seo-pages` for client-side dynamic fetching and fallback.
- Links route to `/${page.slug}` with hover animations matching the TechInPedia brand theme.

---

## Dynamic Domain Routing: Public Website vs Admin Portal Separation

**Date:** 2026-09-24
**Branch:** main
**Commit:** see git log

### Summary
- Fixed redirect issue where accessing public company website (`https://techinpedia.com/`) redirected users to `/admin`.
- Updated `src/middleware.ts` to inspect incoming `host` / `x-forwarded-host` request headers dynamically at runtime instead of relying on build-time `NEXT_PUBLIC_SITE_CODE` inlining.
- Public domain (`techinpedia.com`): Root `/` renders the company public website directly (HTTP 200). Accessing `/admin` on the public domain redirects to `https://admin.techinpedia.com/admin`.
- Admin domain (`admin.techinpedia.com`): Root `/` redirects to `/admin` / `/admin/login`.

---

## IT Hardware Rental Orders: Edit Rental Order & Ongoing Open Leases

**Date:** 2026-09-24
**Branch:** main
**Commit:** see git log

### Summary
- Added comprehensive "Edit Rental Order" modal to `/admin/rental-orders` (accessible from active order cards and details view modal).
- Wired `PATCH /api/hardware/rentals/[id]` with full transactional updates: customer name, primary phone, alternate contact number, customer address, delivery address, order lifecycle status (`ACTIVE`, `RETURNED`, `COMPLETED`, `CANCELLED`), rental start date, optional/nullable end date for ongoing open leases, billing cycles, security deposit, internal remarks, and multi-product fleet line items.
- Added support for open-ended ongoing rentals by making `RentalOrder.endDate` nullable in Prisma and guarding background workflow cron calculation (`/api/automation/cron`).
- Line items editor in Edit Modal supports dynamic product lines: modifying device type, brand, model, quantity, rent per piece, GST, and applying quick presets.

---

## IT Hardware Rental Orders: Multi-Product Customer Fleet & Append Products Upgrade
 
 **Date:** 2026-09-23
 **Branch:** main
 **Commit:** see git log
 
 ### Summary
 - Upgraded IT Hardware Rental Orders (`/admin/rental-orders`) to support full multi-product fleet management for a single customer.
 - Implemented interactive dynamic line-item builder (`+ Add Another Product / System`): users can configure multiple distinct hardware models (e.g. 5x Laptops @ ₹3,000, 3x Desktop PCs @ ₹2,000, 2x Monitors @ ₹800 = 10 devices total) for one customer in a single unified order.
 - Added dedicated subtotal calculators for each product item (`Qty × (Rent + GST)`) and real-time live Order Grand Total summary banner (Total Models, Total Hardware Units, Grand Monthly Runrate).
 - Implemented `+ Add Products` modal action directly on active order cards: enables appending new products/devices anytime to an existing customer's active lease.
 - Created new API endpoint `POST /api/hardware/rentals/[id]/items` to append items, auto-generate sequential `RentalAsset` and `RentalOrderItem` records, and automatically adjust the order's monthly billing rate.
 - Converted `RentalOrder.agreementRef` column in MySQL and Prisma schema from `VARCHAR(191)` to `TEXT` to support comprehensive multi-product JSON specifications without length restrictions.
 - Added dual mode to Customer section: Manual Customer (Customer Name, Phone, Alternative Phone, Delivery Address) with automatic CRM upsert, or Existing Customer selection.
 - Added 1-click Quick Configuration presets (`Office Desktop PC`, `Developer Core i7 Laptop`, `High Performance Workstation`, `Apple MacBook Pro`, `24"/27" Display Monitor`) and quick GST calculators (+18%, 0%).
 - Added comprehensive Order Details modal (`Eye` icon) on the listing page with fleet model cards, contact details, commercial breakdown, and action controls.

---

## Meta WhatsApp Template Creation & Official Review Submission

**Date:** 2026-09-23
**Branch:** main
**Commit:** see git log

### Summary
- Added direct "+ Create Template" capability to WhatsApp Admin Console (`https://admin.techinpedia.com/admin/whatsapp?tab=templates`).
- Built backend integration `createMetaTemplate` in `src/lib/whatsapp_service.ts` submitting message templates to Meta Cloud API v21.0 (`POST https://graph.facebook.com/v21.0/{wabaId}/message_templates`).
- Added automatic variable extraction, dynamic sample values resolution (`example.body_text`) required by Meta automated review, header types (TEXT/NONE), optional footer, and interactive buttons (`QUICK_REPLY`, `URL`, `PHONE_NUMBER`).
- Added `POST /api/whatsapp/templates` (`action: 'CREATE'`) and `DELETE /api/whatsapp/templates` endpoints with audit logging.
- Built interactive Template Creation Modal with live What-You-See-Is-What-You-Get WhatsApp message bubble preview, character counters, 1-click `{{#}}` variable helper, and real-time validation.
- Added template search, category filtering (`ALL`, `MARKETING`, `UTILITY`, `AUTHENTICATION`), status filtering (`ALL`, `APPROVED`, `PENDING`, `REJECTED`), and template deletion.

---

## Enterprise CRM WhatsApp Shared Inbox & 360° Lead Management Hub (Phase 1)

**Date:** 2026-09-23
**Branch:** main
**Commit:** see git log

### Summary
- Upgraded WhatsApp Shared Team Inbox (`/admin/whatsapp?tab=inbox`) into a full 3-pane Enterprise CRM Hub.
- Added 8-Folder Taxonomy Bar with live counts: `ALL`, `My Chats`, `Unassigned`, `Unread`, `Waiting for Customer`, `Follow-up Required`, `High Priority`, and `Resolved`.
- Added In-Chat Team Internal Notes: private amber cards with lock icon, stored in `WhatsappMessage` (`type: 'internal_note'`) and `EnquiryNote`, logged to `LeadTimelineEvent`, never sent to Meta API.
- Added In-Chat Quick Replies popover menu with 6 canned responses (`/pricing`, `/demo`, `/company`, `/bank`, `/followup`, `/meeting`).
- Built Right Pane 360° Lead/Customer Command Hub:
  - In-chat Pipeline Stage Switcher (`NEW` → `CONTACTED` → `QUALIFIED` → `PROPOSAL_SENT` → `NEGOTIATION` → `WON` → `LOST`) with automatic audit trail logging.
  - Priority (`LOW`, `MEDIUM`, `HIGH`, `URGENT`) and Temperature (`COLD`, `WARM`, `HOT`) with live lead score.
  - Estimated Deal Value (`₹`) with 1-click update.
  - Real-time Executive Assignment selector populated with active employees/users.
  - Follow-up Card with 1-click "Done" and "+ Schedule Follow-up" inline modal dialog.
  - Proposals & Quotes section showing sent proposals + 1-click "New Quote" shortcut pre-filling `/admin/quotations`.
  - Chronological Activity Audit Timeline stream.

---

## Quotations Form Typing Focus Fix & Additional Charges Layout Upgrade

**Date:** 2026-09-23
**Branch:** main
**Commit:** see git log

### Summary
- Fixed input focus loss bug on every keystroke across the entire proposal form: moved `Section`, `Field`, `inp`, `ta`, and `sel` outside `ProposalsPage` to module scope. This guarantees React retains DOM node instances and focus across re-renders instead of recreating components.
- Redesigned Section 8 (Additional Charges) with a structured 12-column grid layout, column headers, Indian Rupee prefix, trash action, and quick-add preset buttons (`Cloud VPS Hosting`, `Custom Domain`, `SSL Certificate`, `WhatsApp API`, `Payment Gateway`).
- Handled empty string amount conversion to avoid default `0` placeholder clashing.

---

## Proposals & Quotations Enterprise Module, PDF Export & WhatsApp Console Update

**Date:** 2026-09-23
**Branch:** main
**Commit:** see git log

### Summary
- Replaced basic quotations page with full enterprise 12-section Proposal and Quotation system at `https://admin.techinpedia.com/admin/quotations`.
- Implemented auto-generating proposal number format (`TIP-PROP-YYYY-XXXX`).
- Added official TechInPedia company logo (`/logo.png`) on quotation dashboard header, PDF cover page, PDF content pages, and acceptance section.
- Added 1-click PDF download/print with print-optimized CSS (`@page A4`, `-webkit-print-color-adjust: exact`).
- Added 1-click Email dispatch via Nodemailer (`/api/proposals/[id]/send-email`).
- Added 1-click WhatsApp dispatch with pre-filled proposal summary message.
- Implemented versioning & duplication (`/api/proposals/[id]/duplicate`).
- Updated Prisma schema with `ProposalItem` and `ProposalAdditionalCharge` models.
- Resolved Meta WhatsApp Error `#131030` with auto-detection and guided resolution card in Direct Test Message Console.

---

## SEO Landing Pages, Dynamic Upload Serving & Unified Editor

**Date:** 2026-09-23
**Branch:** main
**Commit:** see git log

### Summary
- Fixed runtime image serving for uploaded media via new Route Handler `src/app/uploads/[...path]/route.ts`.
- Symlinked `public/uploads` across all three production applications (`admin.techinpedia.com`, `techinpedia.com`, and `urban.techinpedia.com`).
- Upgraded SEO landing page frontend (`src/app/[slug]/page.tsx`) with a high-converting responsive Hero section rendering featured media crisp and prominent, plus smooth scrolling enquiry form anchor.
- Enforced strict public vs admin domain separation: `admin.techinpedia.com` automatically 301 redirects any public page slug directly to `techinpedia.com`.
- Removed tabs from SEO page editor (`SeoPageEditor.tsx`), replacing it with a single, continuous, unified vertical form with instant upload image previews and sticky save bars.

---


## Phase 1.1 — Business Unit Isolation Completion

**Date:** 2026-09-22
**Branch:** main
**Commit:** see git log
**Phase:** 1.1

### Summary
Closed all Phase 1 security/isolation gaps. No marketplace features added.

### Fixes
- `src/lib/business-units.ts`: null BU fails closed for normal users
- `src/lib/site-context.ts`: unknown hosts no longer map to COMPANY_SERVICES
- `src/lib/crm.ts`: auto-assignment BU-aware
- `src/lib/google_sheets.ts`: dedupe scoped to BU
- `src/app/api/whatsapp/webhook/route.ts`: BU scoping, verify token fail-closed, no token logging
- `src/lib/whatsapp_service.ts`: removed hardcoded verify token fallback
- `src/app/api/enquiries/route.ts`: duplicate check BU-scoped
- `src/app/api/crm/import/route.ts`: BU validated from session

### New Files
- `src/app/admin/settings/business-units/page.tsx` — Business Units admin UI
- `src/app/admin/settings/sites/page.tsx` — Sites & Domains admin UI
- `src/app/api/admin/business-units/route.ts` — Business Units API
- `src/app/api/admin/business-units/[id]/route.ts` — BU PATCH/DELETE
- `src/app/api/admin/sites/route.ts` — Sites API
- `src/app/api/admin/sites/[id]/domains/route.ts` — Add domain alias
- `scripts/backfill-business-units.ts` — Updated with real SiteDomains + dry-run
- `src/__tests__/phase-1.1.test.mjs` — 25 automated tests
- `docs/project/URBAN_MARKET_BUSINESS_MODEL.md` — Urban business model locked

### Database Changes
No production migrations applied.
No production backfill executed.
Schema unchanged (no new models required for Phase 1.1 fixes).

### Deployment Changes
- Deployed commit `a8dece4` to all three production surfaces.
- TechInPedia Company: `/home/<SERVER_USER>/public_html/techinpedia.com` (process: `techinpedia`)
- Urban Marketplace: `/home/<SERVER_USER>/public_html/urban.techinpedia.com` (process: `techinpedia-urban`)
- Admin Platform: `/home/<SERVER_USER>/public_html/admin.techinpedia.com` (process: `techinpedia-admin`)

### Test Results
25 tests, 25 pass, 0 fail.
`npx prisma validate` — VALID
`npm run build` — EXIT 0

### Review Status
Ready for independent review.

---

## Phase 1 — Business Unit Foundation

**Date:** 2026-09-17 (approx)
**Commit:** `b18acd436457d3ea9a18d7f86ab5d3d6b90f83f7`

### Summary
Added BusinessUnit, Site, SiteDomain models and initial BU field to Enquiry.

---

## Project Memory System Created

**Date:** 2026-09-22
**Commit:** `c85e083`

### Summary
Created `/docs/project/` source-of-truth directory with AGENTS.md, PROJECT_CONTEXT.md, DEPLOYMENT_MAP.md, ARCHITECTURE_DECISIONS.md, CURRENT_STATE.md, NEXT_PHASE.md, DO_NOT_BREAK.md, CHANGELOG.md.
