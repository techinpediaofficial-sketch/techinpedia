# ARCHITECTURE DECISIONS

There is ONE central company platform.

Architecture:
```text
                     CENTRAL PLATFORM
                            │
                    Admin / CRM / HRM
                            │
                       Backend/API
                            │
          ┌─────────────────┴─────────────────┐
          │                                   │
 Company Website                     Urban Marketplace
 techinpedia.com                  urban.techinpedia.com
 BUSINESS: COMPANY_SERVICES          BUSINESS: MARKETPLACE
```

Important:
- There is ONE central CRM.
- There is ONE central HRM.
- Do NOT create another CRM for Urban.
- Do NOT create another HRM for Urban.
- Marketplace-specific modules may extend the central platform.
- Public websites remain independent frontends/brands.

## Business Units

Current approved Business Units:
- COMPANY_SERVICES (represents the existing TechInPedia company/services business)
- MARKETPLACE (represents the Urban marketplace)

Do NOT confuse Site with Business Unit.

## Central Admin

`https://admin.techinpedia.com`

Purpose: Central Super Admin, CRM, HRM, Employees, Leads, Sales, Finance, Marketplace Management, Company Management, Settings, Reports.

This admin manages MULTIPLE Business Units. It is NOT a marketplace-only admin.

---

## ADR-001 — Central CRM
Decision: Use existing CRM for all Business Units.
Reason: Avoid duplicate customer/lead systems.
Status: APPROVED

## ADR-002 — Business Unit Isolation
Decision: Use `BusinessUnit`, `Site`, `SiteDomain`, and employee mappings.
Status: IMPLEMENTED PHASE 1

## ADR-003 — Urban Deployment
Decision: Urban frontend lives at `urban.techinpedia.com`. Separate from `techinpedia.com`.
Status: APPROVED

## ADR-004 — Marketplace Stack
Decision: Continue Next.js + MySQL + Prisma.
Status: APPROVED

## ADR-005 — Mobile Apps
Decision: Flutter later.
Status: PLANNED

## ADR-006 — Multi-Tenant WhatsApp CRM SaaS & Client Company Isolation
Decision: Isolate WhatsApp Business Platform records by `companyId` across database models (`WhatsappConnection`, `WhatsappConversation`, `WhatsappTemplate`, `WhatsappCampaign`, `WhatsappSuppression`, `WhatsappWebhookEvent`). Platform Admin connection has `companyId = null`. Tenant users authenticate via unified login and are granted scoped workspaces with module entitlements and role sub-permissions (`INBOX_ONLY` vs `OWNER`/`ADMIN`).
Status: IMPLEMENTED & LIVE

## ADR-007 — TechInPedia Admin Mobile App & Executive Role-Aware Architecture
Decision: Unify mobile employee operations and executive administration into a single Flutter application via role-aware dynamic shells. When a user with `user.isAdmin` (`SUPER_ADMIN` or `ADMIN`) logs in, the primary shell mounts `Admin Hub` as Tab 0 with an Executive Command Center (MRR runrate, financials, operational KPIs, pending approval banners, quick navigation shortcuts) and dedicated administrative desks for Leave Approvals, Company Staff Directory with BU mappings, Invoices & Receivables, Helpdesk Ticket SLA Resolution, and Live Daily Attendance Rosters. Standard non-admin staff retain the employee workflow shell.
Status: IMPLEMENTED & LIVE

## ADR-008 — Security, Visibility Policy, Configurable SLA & Reassignment Audit Layer
Decision: Enforce strict multi-tenant isolation, role-based visibility, and configurable SLA rules server-side across all CRM and WhatsApp communication streams:
1. Access Policy: Core authorization logic in `src/lib/access-policy.ts` evaluates tenant isolation, explicit `ResourceVisibility` policies (with 8 granular types), role tiers, and assignment state before returning any conversation or lead data.
2. Server-side Query Filters: All list endpoints use `buildConversationAccessFilter` and `buildLeadAccessFilter` so agents never query or count unassigned or cross-team records.
3. Dashboard Separation: Server-side routing in `src/app/admin/page.tsx` renders `CompanyDashboard` for Owners/Managers and `EmployeeDashboard` for agents, completely insulating company financials from frontline staff.
4. Immutable Reassignment History: Every reassignment creates a permanent audit row in `ReassignmentHistory`, resets the acceptance SLA timer, and logs a timeline event.
Status: IMPLEMENTED & LIVE IN PRODUCTION

## ADR-009 — WhatsApp Marketing Suite, Customer Data Platform & Security Clarifications
Decision:
1. Part 0 Security Clarifications:
   - Clarify `HIDDEN` semantics to `HIDDEN_FROM_EMPLOYEES`: Allows Company Owner & Company Admin (and privileged roles with explicit permission), while strictly hiding from regular Employees, Agents, and unauthorized Managers.
   - Platform-level restriction (`PLATFORM_RESTRICTED`): Retained exclusively for Super Admin platform diagnostics.
   - Manager Dashboard Team Scoping: By default, Managers only view analytics for their direct team. Viewing full company operations requires explicit `VIEW_COMPANY_ANALYTICS` permission.
2. Canonical Unified Customer Model:
   - Reuse existing `Contact` table as the single source of truth for both CRM contacts and WhatsApp marketing recipients, extended with `leadStatus`, `optInStatus`, `marketingOptIn`, `isBlacklisted`, `tags`, and `customFields`.
   - Contact custom field definitions in `ContactCustomField` supporting string, number, boolean, date, and select types.
3. Smart Dynamic Segments & Static Lists:
   - Dynamic audience segments (`ContactSegment`) with json rule evaluation (`evaluateContactInSegment`) supporting multi-condition AND/OR grouping across tags, lead stage, source, assigned agent, city, and recency.
   - Static targeted lists (`ContactList` and `ContactListMember`) for manual audience curation.
4. Compliance & Meta Policy Gate:
   - Centralized eligibility validator `canSendWhatsAppMessage` enforcing tenant WhatsApp Cloud API connectivity, blacklist/suppression checking (`WhatsappSuppression`), consent/opt-in status, and Meta 24-hour customer care window (freeform text vs pre-approved HSM template requirement).
5. Central Workflow & Drip Queue Extension:
   - Reuse existing `WorkflowRule`, `WorkflowExecution`, and `worker.js` architecture. Extended `JobQueueName` with `whatsapp-drip-step` to manage scheduled message steps, evaluate delay hours, and enforce automatic sequence termination upon customer reply or opt-out.
Status: IMPLEMENTED, TESTED & LIVE IN PRODUCTION

## ADR-010 — Multi-Tenant AI Engine, Visual Chatbot Builder & Smart Human Handoff with SLA Activation
Decision:
1. Multi-Tenant AI Engine (`AIEngine`):
   - Multi-provider LLM caller supporting OpenAI, Anthropic, Gemini, and Smart Fallback with token/cost estimation and encrypted tenant API keys via AES-256-GCM.
   - Server-side guardrails (`inspectSecurityGuardrails`) blocking prompt injection, developer mode jailbreaks, and cross-tenant data leakage attempts prior to model dispatch.
2. Vectorless Tenant-Isolated Knowledge Retrieval (RAG):
   - Ingestion engine splitting company documents, manuals, and FAQs into ~200-word chunks with 30-word overlap stored in `AiKnowledgeChunk`.
   - Strict tenant scoping in MySQL query (`where: { companyId }`), making cross-tenant data leakage architecturally impossible.
3. Visual Chatbot Builder & Execution Engine:
   - Graph-based flowchart editor supporting 10 node types (entry, message, question, condition, set_field, add_tag, assign_lead, webhook, delay, human_handoff).
   - Pre-activation validator enforcing graph integrity (single entry, no broken handles, template presence, no infinite self-loops).
   - Turn-based server flow runner (`ChatbotEngine`) with 10-step turn execution cap and Meta compliance checks.
4. Intent Detection & Action Dispatcher:
   - Two-stage intent classifier (instant exact keyword matching for `STOP`, `AGENT`, `PRICING`, `HELP` + semantic model evaluation).
   - Deterministic action dispatcher executing handoff, opt-out suppression, or chatbot triggers.
5. Smart Human Handoff & SLA Integration:
   - When bot encounters an agent request, negative sentiment, or repeated unhandled questions, `executeHumanHandoff` pauses AI (`isAiPaused: true`), assigns to least-loaded active team member, and crucially sets `assignmentAcceptedAt: null`, which immediately activates the company's SLA acceptance timer across Employee and Manager dashboards.
Status: IMPLEMENTED, 100% TESTED & LIVE IN PRODUCTION

## ADR-011 — WhatsApp Template Media Headers & Multi-Tenant Workflow Automation Isolation
Decision:
1. Media (IMAGE) Header Support in WhatsApp Templates:
   - Extend template creation API and UI to support `format: IMAGE` in Meta templates.
   - Sample images must be uploaded to Meta Graph API via the Resumable Upload protocol (`POST /{appId}/uploads` -> `POST /{uploadSessionId}`) to obtain the required `header_handle`.
   - Store header metadata (`headerType: 'IMAGE'`, `headerContent: <sampleUrl>`) in `WhatsappTemplate` database table.
2. Multi-Tenant Automation & Workflow Isolation:
   - Dynamic Template Registry: Purge hardcoded platform master templates from workflow action registry. Load templates dynamically per company via `/api/automation/registry?companyId=...` restricted to approved templates.
   - Strict Isolation in Workflows: Tenant companies can only view, edit, duplicate, delete, and execute workflows where `companyId == session.companyId`. Super Admins can manage all companies using `CompanySwitcher`.
   - Execution & Event Scoping: `eventEmitter.ts` triggers only workflows matching the event's `companyId`. `actionRunner.ts` scopes conversation and message resolution to `companyId`.
Status: IMPLEMENTED, 100% TESTED & LIVE IN PRODUCTION

## ADR-012 — Database-Driven WhatsApp Template Purpose Routing & Dynamic Package Dispatch
Decision:
1. Zero Hardcoding Rule:
   - Backend business logic must not reference template names, Meta template IDs, package IDs, or hardcoded button text.
   - All mapping and routing are driven by five relational models: `WhatsappTemplatePurpose`, `PackageWhatsAppConfig`, `WhatsappTemplateButtonAction`, `WhatsappTemplateParameterMapping`, and `WhatsappTemplateAuditLog`.
2. Purpose Resolution (`WhatsappTemplatePurpose`):
   - Decouples conversational stages (`WELCOME`, `PACKAGE_MENU`, `BOOKING_DETAILS`) from specific Meta template names. If a company updates or creates a new template in Meta, admins simply remap the purpose key in the database without code modification.
3. Multi-Package Selection Parser & Sequential Iteration:
   - Parses customer reply formats ("1", "1, 2", "1 2 4", "Reply 3") into distinct selection keys.
   - Enforces configurable `maxSelection` ceiling per tenant to prevent spam.
   - Replaces exponential combinatoric branching (e.g. templates for 1+2, 1+3, 1+2+3) with generic linear sequential dispatch.
4. Static Template Commercial Data Consistency Tracking:
   - When linking a static package template to commercial data, the system computes a SHA256 snapshot hash of `packageName`, `packagePrice`, `servicesSummary`, `freeService`, and `importantNote`.
   - Any later database change to price or services flags `requiresMetaUpdate = true` and creates an audit record, preventing stale or legally contradictory quotes.
5. Dynamic Button Action Resolution:
   - Maps actions (`OPEN_PACKAGE_MENU`, `BOOK_NOW`, `OPEN_APP_URL`) by `(companyId, templateId, buttonIndex)` rather than fragile customer-facing button text labels.
6. Multi-Tenant Safety & Audit Trail:
   - Strict `where: { companyId }` scoping on all queries.
   - Every mapping adjustment, toggle, fallback execution, and Meta sync event is permanently recorded in `WhatsappTemplateAuditLog`.
Status: IMPLEMENTED, 100% TESTED & LIVE IN PRODUCTION

## ADR-013 — Strict RBAC Enforcement, Dynamic Permission Seeding & Central HRM Integration
Decision:
1. Strict AppRole Priority & Fallback Prevention:
   - In `src/lib/permissions.ts`, if a user has an explicit `AppRole` or explicit permissions array, they are strictly evaluated against those permissions.
   - Prevent fallback to legacy `session.role === 'ADMIN'`. This guarantees that assigning an `AppRole` (e.g. `SALES_EXECUTIVE`) cannot accidentally leak root admin privileges.
2. Granular Sidebar Access Mapping:
   - De-duplicate shared generic permissions in `AdminSidebar.tsx`. Specific modules (WhatsApp Broadcasts, Drips, Contacts, Single Send, Analytics, Marketplaces) require their corresponding specific permissions.
3. Automatic Permission Seeding in Roles Studio:
   - `GET /api/admin/roles` and `PUT /api/admin/roles/[id]` dynamically verify and upsert missing definitions from `ALL_PERMISSIONS` into `db.permission` to eliminate silent permission drops.
4. Central HRM Integration:
   - Expose "Roles & Permissions" directly within HRM navigation and HRM & Workforce sidebar group (`admin.roles.manage`).
   - Add full employee profile and credential management (`EditEmployeeModal` & `PUT /api/hr/employees/[id]`) covering Role assignment (`appRoleId`), bcrypt password updates, force password change, and profile attributes.
Status: IMPLEMENTED, 100% TESTED & LIVE IN PRODUCTION

