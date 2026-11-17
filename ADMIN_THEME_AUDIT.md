# TechInPedia Admin Panel — Complete Light + Dark Theme Audit
**Target System:** TechInPedia Business OS (`/admin/**`)  
**Audit Date:** September 18, 2026  
**Status:** Initial Visual & Architecture Audit Complete — Migration Plan Ready

---

## 1. Executive Summary & Audit Findings

A recursive audit of the entire `/admin` codebase discovered **57 distinct admin routes** and **5 shared admin components**.

### Core Issues Discovered in Current Baseline:
1. **Layout Lock:** `src/app/admin/layout.tsx` was hardcoded with `bg-slate-950 text-slate-100 min-h-screen flex`, forcing all admin pages onto a pitch-black background regardless of user preference.
2. **Body Override:** `src/components/PublicLayout.tsx` contained an effect that forced `document.body.classList.add('bg-slate-950')` whenever navigating to any `/admin/*` route.
3. **Severe Palette Inconsistency Across Pages:**
   - **27 routes** (e.g. Dashboard, Enquiries, Monitoring, Activity, Roles, Users) were coded with dark hardcoded surfaces (`bg-slate-900`, `bg-slate-950`, `border-slate-800`, `text-white`). If viewed in Light Mode, these pages remain pitch-dark boxes.
   - **28 routes** (e.g. Leads, Invoices, Deals Kanban, Follow-ups, HRM Employees, HRM Attendance, Projects, Tasks, Google Sheets) were coded with light hardcoded surfaces (`bg-white`, `bg-gray-50`, `border-gray-100`, `text-gray-900`). In the previous dark layout, these appeared as blinding white cards surrounded by pitch black. In a global dark theme, these would retain dark text on white backgrounds or fail contrast tests.
   - **Multi-variant pages** (e.g. `/admin/whatsapp`, `/admin/workflows/builder`) contained a mixture of light inputs, dark sidebars, and hardcoded text colors.
   - **Only 1 route** (`/admin/system/jobs`) had begun implementing dual `dark:` classes.
4. **Header & Sidebar Missing Theme Controls:**
   - `AdminHeader.tsx` had hardcoded `bg-slate-900 border-slate-800 text-white` and zero theme switching controls.
   - `AdminSidebar.tsx` was fixed to `bg-slate-950 border-slate-800` without light theme token support.
5. **No Anti-FOUC & No Theme Provider:**
   - No `localStorage` or `prefers-color-scheme` persistence.
   - No pre-hydration script in `src/app/layout.tsx`, leading to theme flashing.

---

## 2. Complete Inventory of All Discovered Routes

| # | Route | Source File | Current Baseline Style | Contrast Risk (Light/Dark) | Target Verification Status |
|---|-------|-------------|------------------------|----------------------------|----------------------------|
| 1 | `/admin` | `src/app/admin/page.tsx` | Dark (`bg-slate-900`, `text-white`) | **High:** In Light mode remains black card; needs semantic tokens | PENDING AUDIT |
| 2 | `/admin/activity` | `src/app/admin/activity/page.tsx` | Dark (`bg-slate-900`, `border-slate-800`) | **High:** Audit log table and filters dark locked | PENDING AUDIT |
| 3 | `/admin/amc` | `src/app/admin/amc/page.tsx` | Dark (`bg-slate-900`, `text-white`) | **High:** AMC contract cards dark locked | PENDING AUDIT |
| 4 | `/admin/analytics` | `src/app/admin/analytics/page.tsx` | Dark (`bg-slate-900`, `text-white`) | **High:** Charts & stats numbers dark locked | PENDING AUDIT |
| 5 | `/admin/assets` | `src/app/admin/assets/page.tsx` | Dark (`bg-slate-900`, `text-white`) | **High:** Asset cards, modals & status badges dark locked | PENDING AUDIT |
| 6 | `/admin/blog` | `src/app/admin/blog/page.tsx` | Dark (`bg-slate-900`, `text-white`) | **High:** Post editor & list dark locked | PENDING AUDIT |
| 7 | `/admin/chats` | `src/app/admin/chats/page.tsx` | Dark (`bg-slate-900`, `border-slate-800`) | **High:** Live chat messages, bubble colors & composer | PENDING AUDIT |
| 8 | `/admin/companies` | `src/app/admin/companies/page.tsx` | Dark (`bg-slate-900`, `text-white`) | **High:** Company cards & modal inputs dark locked | PENDING AUDIT |
| 9 | `/admin/contacts` | `src/app/admin/contacts/page.tsx` | Dark (`bg-slate-900`, `text-white`) | **High:** Contact directory table & details | PENDING AUDIT |
| 10 | `/admin/contracts` | `src/app/admin/contracts/page.tsx` | Dark (`bg-slate-900`, `text-white`) | **High:** Legal contracts; must preserve print safety | PENDING AUDIT |
| 11 | `/admin/crm/import` | `src/app/admin/crm/import/page.tsx` | Light (`bg-white`, `text-gray-900`) | **High:** White box in dark mode; dark text unreadable | PENDING AUDIT |
| 12 | `/admin/customers` | `src/app/admin/customers/page.tsx` | Dark (`bg-slate-900`, `text-white`) | **High:** Customer directory & search input | PENDING AUDIT |
| 13 | `/admin/customers/[id]` | `src/app/admin/customers/[id]/page.tsx` | Mixed | **High:** Customer 360 timeline & profile tabs | PENDING AUDIT |
| 14 | `/admin/deals` | `src/app/admin/deals/page.tsx` | Light (`bg-white`, `text-gray-900`) | **High:** Kanban columns, dragged deal cards & badges | PENDING AUDIT |
| 15 | `/admin/enquiries` | `src/app/admin/enquiries/page.tsx` | Dark (`bg-slate-900`, `text-white`) | **High:** Leads table, status filter pills, notes drawer | PENDING AUDIT |
| 16 | `/admin/expenses` | `src/app/admin/expenses/page.tsx` | Light (`bg-white`, `text-gray-900`) | **High:** Expense cards, receipts table & category badges | PENDING AUDIT |
| 17 | `/admin/faqs` | `src/app/admin/faqs/page.tsx` | Dark (`bg-slate-900`, `text-white`) | **High:** Accordion & FAQ forms dark locked | PENDING AUDIT |
| 18 | `/admin/follow-ups` | `src/app/admin/follow-ups/page.tsx` | Light (`bg-white`, `text-gray-900`) | **High:** Follow-up calendar schedule & reminder cards | PENDING AUDIT |
| 19 | `/admin/hr/attendance` | `src/app/admin/hr/attendance/page.tsx` | Light (`bg-white`, `text-gray-900`) | **High:** Attendance check-in matrix & punch logs | PENDING AUDIT |
| 20 | `/admin/hr/employees` | `src/app/admin/hr/employees/page.tsx` | Light (`bg-white`, `text-gray-900`) | **High:** Employee cards, salary info, onboarding status | PENDING AUDIT |
| 21 | `/admin/hr/leaves` | `src/app/admin/hr/leaves/page.tsx` | Light (`bg-white`, `text-gray-900`) | **High:** Leave requests, balance badges & approval modal | PENDING AUDIT |
| 22 | `/admin/hr/payroll` | `src/app/admin/hr/payroll/page.tsx` | Light (`bg-white`, `text-gray-900`) | **High:** Salary breakdown table & pay slip generator | PENDING AUDIT |
| 23 | `/admin/inbox` | `src/app/admin/inbox/page.tsx` | Light (`bg-white`, `text-gray-900`) | **High:** Unified inbox conversation list & message thread | PENDING AUDIT |
| 24 | `/admin/integrations/google-sheets` | `src/app/admin/integrations/google-sheets/page.tsx` | Light (`bg-white`, `text-gray-900`) | **High:** Sync sheet selector, field mapping table & modal | PENDING AUDIT |
| 25 | `/admin/invoices` | `src/app/admin/invoices/page.tsx` | Light (`bg-white`, `text-gray-900`) | **High:** Invoice volume cards, table, invoice print view | PENDING AUDIT |
| 26 | `/admin/kb` | `src/app/admin/kb/page.tsx` | Dark (`bg-slate-900`, `text-white`) | **High:** KB article editor & category badges | PENDING AUDIT |
| 27 | `/admin/leads` | `src/app/admin/leads/page.tsx` | Light (`bg-white`, `text-gray-900`) | **High:** Full CRM leads table, modal form, filter pills | PENDING AUDIT |
| 28 | `/admin/licenses` | `src/app/admin/licenses/page.tsx` | Dark (`bg-slate-900`, `text-white`) | **High:** License keys & client assignments | PENDING AUDIT |
| 29 | `/admin/login` | `src/app/admin/login/page.tsx` | Dark (`bg-slate-900`, `text-white`) | **Medium:** Standalone login card (needs clean theme support) | PENDING AUDIT |
| 30 | `/admin/maintenance` | `src/app/admin/maintenance/page.tsx` | Dark (`bg-slate-900`, `text-white`) | **High:** Maintenance tickets & service records | PENDING AUDIT |
| 31 | `/admin/media` | `src/app/admin/media/page.tsx` | Dark (`bg-slate-900`, `text-white`) | **High:** Media thumbnail grid & upload dropzone | PENDING AUDIT |
| 32 | `/admin/monitoring` | `src/app/admin/monitoring/page.tsx` | Dark (`bg-slate-900`, `text-white`) | **High:** Server memory/CPU meters & process table | PENDING AUDIT |
| 33 | `/admin/payments` | `src/app/admin/payments/page.tsx` | Light (`bg-white`, `text-gray-900`) | **High:** Payment reconciliation & transaction records | PENDING AUDIT |
| 34 | `/admin/portfolio` | `src/app/admin/portfolio/page.tsx` | Dark (`bg-slate-900`, `text-white`) | **High:** Portfolio project cards & image previews | PENDING AUDIT |
| 35 | `/admin/projects` | `src/app/admin/projects/page.tsx` | Light (`bg-white`, `text-gray-900`) | **High:** Project timeline, client assignments & progress | PENDING AUDIT |
| 36 | `/admin/proposals` | `src/app/admin/proposals/page.tsx` | Dark (`bg-slate-900`, `text-white`) | **High:** Proposal builder & print preview | PENDING AUDIT |
| 37 | `/admin/quotations` | `src/app/admin/quotations/page.tsx` | Light (`bg-white`, `text-gray-900`) | **High:** Rental quotes, line items & calculation table | PENDING AUDIT |
| 38 | `/admin/rental-orders` | `src/app/admin/rental-orders/page.tsx` | Dark (`bg-slate-900`, `text-white`) | **High:** Active leases, return dates & serial number tables | PENDING AUDIT |
| 39 | `/admin/reports` | `src/app/admin/reports/page.tsx` | Redirects to `/admin/analytics` | Clean redirect | PENDING AUDIT |
| 40 | `/admin/roles` | `src/app/admin/roles/page.tsx` | Dark (`bg-slate-900`, `text-white`) | **High:** Role permission checkboxes & matrix table | PENDING AUDIT |
| 41 | `/admin/saas-products` | `src/app/admin/saas-products/page.tsx` | Dark (`bg-slate-900`, `text-white`) | **High:** Software catalog, tier pricing & feature flags | PENDING AUDIT |
| 42 | `/admin/services` | `src/app/admin/services/page.tsx` | Dark (`bg-slate-900`, `text-white`) | **High:** Service catalog, pricing tiers & descriptions | PENDING AUDIT |
| 43 | `/admin/settings` | `src/app/admin/settings/page.tsx` | Dark (`bg-slate-900`, `text-white`) | **High:** Multi-tab settings (Company, SEO, Email, Security) | PENDING AUDIT |
| 44 | `/admin/settings/integrations` | `src/app/admin/settings/integrations/page.tsx` | Light (`bg-white`, `text-gray-900`) | **High:** API keys, webhook URLs & secret tokens | PENDING AUDIT |
| 45 | `/admin/subscriptions` | `src/app/admin/subscriptions/page.tsx` | Dark (`bg-slate-900`, `text-white`) | **High:** Recurring billing cycles, client subscriptions | PENDING AUDIT |
| 46 | `/admin/system/jobs` | `src/app/admin/system/jobs/page.tsx` | Dual (`dark:` variants partial) | **Medium:** Queue stats, worker heartbeat, retry buttons | PENDING AUDIT |
| 47 | `/admin/tasks` | `src/app/admin/tasks/page.tsx` | Light (`bg-white`, `text-gray-900`) | **High:** Task cards, priority badges, checklist items | PENDING AUDIT |
| 48 | `/admin/testimonials` | `src/app/admin/testimonials/page.tsx` | Dark (`bg-slate-900`, `text-white`) | **High:** Testimonial cards, star ratings, client quotes | PENDING AUDIT |
| 49 | `/admin/tickets` | `src/app/admin/tickets/page.tsx` | Dark (`bg-slate-900`, `text-white`) | **High:** Ticket list, message thread, resolution modal | PENDING AUDIT |
| 50 | `/admin/timesheets` | `src/app/admin/timesheets/page.tsx` | Light (`bg-white`, `text-gray-900`) | **High:** Employee time logs & approval buttons | PENDING AUDIT |
| 51 | `/admin/users` | `src/app/admin/users/page.tsx` | Dark (`bg-slate-900`, `text-white`) | **High:** User accounts table, role badges, create modal | PENDING AUDIT |
| 52 | `/admin/webhooks` | `src/app/admin/webhooks/page.tsx` | Dark (`bg-slate-900`, `text-white`) | **High:** Webhook endpoints, secret keys, delivery logs | PENDING AUDIT |
| 53 | `/admin/whatsapp` | `src/app/admin/whatsapp/page.tsx` | Mixed (`bg-white` & `bg-slate-900`) | **High:** Connection manager, inbox, campaign wizard, logs | PENDING AUDIT |
| 54 | `/admin/workflows` | `src/app/admin/workflows/page.tsx` | Light (`bg-white`, `text-gray-900`) | **High:** Workflow list, status badges, trigger descriptions | PENDING AUDIT |
| 55 | `/admin/workflows/builder` | `src/app/admin/workflows/builder/page.tsx` | Mixed | **High:** Visual node canvas, trigger/action blocks, drawer | PENDING AUDIT |
| 56 | `/admin/workflows/[id]/executions` | `src/app/admin/workflows/[id]/executions/page.tsx` | Light (`bg-white`, `text-gray-900`) | **High:** Execution history table, duration & status pills | PENDING AUDIT |
| 57 | `/admin/workflow-executions/[executionId]` | `src/app/admin/workflow-executions/[executionId]/page.tsx` | Mixed | **High:** Step-by-step trace & JSON input/output viewer | PENDING AUDIT |

---

## 3. Shared Admin Components Audit

| Component | Path | Baseline Status | Required Upgrades |
|-----------|------|-----------------|-------------------|
| `AdminLayout` | `src/app/admin/layout.tsx` | Hardcoded `bg-slate-950 text-slate-100` | Change to `bg-[var(--background)] text-[var(--foreground)]` with responsive transitions. |
| `AdminHeader` | `src/components/admin/AdminHeader.tsx` | Hardcoded `bg-slate-900 border-slate-800` | Add Light/Dark/System theme switcher with icon & persistent dropdown. Adapt surfaces. |
| `AdminSidebar` | `src/components/admin/AdminSidebar.tsx` | Hardcoded `bg-slate-950 border-slate-800` | Full light & dark sidebar styles: crisp borders, brand violet active indicator, high-contrast text. |
| `PasswordChangeModal` | `src/components/admin/PasswordChangeModal.tsx` | Hardcoded `bg-slate-900 text-white` | Modal dialog surface, input fields, close buttons adapted for both themes. |
| `RichTextEditor` | `src/components/admin/RichTextEditor.tsx` | Hardcoded dark/light mixed | Toolbar buttons, dropdowns, textarea content editable surface theme awareness. |
| `AdminChatInboxClient` | `src/components/admin/AdminChatInboxClient.tsx` | Dark fixed chat panel | Chat bubbles, conversation list, input field contrast in both themes. |
| `PublicLayout` | `src/components/PublicLayout.tsx` | Body background override | Remove forced `bg-slate-950` on admin route enter. |

---

## 4. Next Step
Proceed with implementation plan creation and user approval before code modifications.
