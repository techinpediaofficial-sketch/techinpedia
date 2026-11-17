# TECHINPEDIA PROJECT CONTEXT

## Company Platform

TechInPedia operates the central company platform.

Existing modules include:
- Company Website
- Admin Panel
- CRM
- HRM
- Employees
- Roles/Permissions
- Leads
- Communications
- WhatsApp
- Google Sheets
- Finance
- Projects
- Automation
- CMS

Existing working modules should be reused.

## Urban Marketplace

Urban is a future marketplace combining concepts similar to:
Justdial-style Local Discovery + IndiaMART-style B2B Marketplace

But it must have original:
- branding
- design
- UI
- content
- implementation

Do not copy copyrighted UI/assets/code.

## URBAN FUTURE BUSINESS MODEL

### Local Discovery

Future features:
- service providers
- businesses
- categories
- subcategories
- cities
- local areas
- service areas
- nearby search
- business profile
- reviews
- ratings
- enquiries
- call leads
- WhatsApp leads
- service requirements
- provider matching

Customer requirements are LEADS, not traditional service bookings.

### B2B Marketplace

Future:
- manufacturers
- suppliers
- wholesalers
- distributors
- products
- catalogues
- product enquiries
- RFQs
- buyer requirements
- buy leads
- quotations
- supplier matching

## MONETIZATION

Urban will eventually support dynamic subscription/entitlement architecture.

Potential concepts:
- subscription plans
- lead limits
- lead unlock credits
- RFQ credits
- product limits
- category limits
- city limits
- radius limits
- priority listings
- featured listings
- sponsored placement
- team member limits
- buyer contact access
- WhatsApp access
- CRM access
- analytics access

Do NOT hardcode plan names like `Gold`, `Silver`, `Platinum` unless configured by Admin. Plans must eventually be DB-driven.

## CENTRAL CRM RULE

All lead sources eventually enter the existing central CRM.

Examples:
- techinpedia.com Contact Form → COMPANY_SERVICES → Central CRM
- urban.techinpedia.com Post Requirement → MARKETPLACE → Central CRM

Existing `Enquiry` remains the central lead entity unless an approved architecture change says otherwise.

Do NOT create duplicate tables such as CompanyLead, UrbanLead, MarketplaceLead unless there is a genuinely marketplace-specific entity that references the central lead.

## BUSINESS UNIT SECURITY

Existing foundation contains:
- BusinessUnit
- Site
- SiteDomain
- EmployeeBusinessUnit
- Enquiry.businessUnitId
- Enquiry.siteId

Business Unit access must always be enforced SERVER-SIDE.

Required rule:
RBAC Permission + Business Unit Access = Allowed

Frontend filtering alone is NOT security.

## SUPER ADMIN

`SUPER_ADMIN` has global Business Unit access.

Normal employees only receive Business Units explicitly assigned to them.

## PUBLIC CLIENT TRUST RULE

Never trust anonymous browser inputs such as `businessUnitId`, `siteId`, `X-Business-Unit`, `X-Site-ID` as authoritative context.

Site/Business Unit must be resolved by trusted server-side logic.

## CURRENT STACK

Current confirmed stack:
- Next.js 16
- React 19
- TypeScript
- Prisma
- MySQL
- Tailwind CSS 4
- Custom JWT Admin Authentication

Keep the current modular-monolith architecture.
Do NOT randomly rewrite to NestJS, Laravel, Supabase, Firebase, microservices, Kubernetes, Kafka, or MongoDB unless explicitly approved.

## FUTURE MOBILE APPS

Later:
- Urban User App (Flutter / Dart)
- Urban Vendor App (Flutter / Dart)

Do NOT build them until approved. They should eventually reuse the central backend/API.
