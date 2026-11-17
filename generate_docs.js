const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'docs', 'platform-audit');
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true });
}

const files = {
  '01_EXISTING_SYSTEM_OVERVIEW.md': `# Existing System Overview

## Application
TechInPedia Platform (Company Website + Admin CRM/HRM)

## Framework
Next.js 16.3.4 (App Router) + React 19

## Purpose
A combined enterprise system that currently handles the public company website, a CMS, a CRM (Leads, Quotations), HRM (Employees, Payroll), and integrations (Google Sheets, WhatsApp, Razorpay).

## Database Access
Prisma 6.4.1 (MySQL)

## Authentication
JWT-based custom auth with cookies (\`tip_admin_token\`).

## Deployment Expectation
Node.js environment (server.js/pm2) on a VPS/Cloud provider.

## Summary
The codebase is a modular monolith. The frontend (public site) and backend (admin/API) are currently tightly coupled within the same Next.js repository.
`,
  '02_ADMIN_PANEL_AUDIT.md': `# Admin Panel Audit

## Modules Audited:

### CRM / Leads / Customers
Status: **FUNCTIONAL**
Evidence: \`src/app/admin/crm\`, \`src/app/admin/leads\`, \`src/app/admin/customers\`

### HRM / Employees / Roles
Status: **FUNCTIONAL**
Evidence: \`src/app/admin/hr\`, \`src/app/admin/users\`, \`src/app/admin/roles\`

### CMS / Blog / Services
Status: **FUNCTIONAL BUT BASIC**
Evidence: \`src/app/admin/blog\`, \`src/app/admin/services\`

### Integrations / Settings
Status: **FUNCTIONAL**
Evidence: \`src/app/admin/integrations\`, \`src/app/admin/settings\`

## Overall Impression
The admin panel is heavily developed and serves as the core operational portal. It heavily relies on the same shared \`src/lib\` code as the public frontend.
`,
  '03_COMPANY_WEBSITE_AUDIT.md': `# Company Website Audit

## Pages Audited
- **Home**: \`src/app/page.tsx\`
- **About**: \`src/app/about\`
- **Services**: \`src/app/services\`
- **Contact**: \`src/app/contact\`

## API Integration
The public website has lead capture forms (e.g., ContactFormClient). 
These forms hit \`src/app/api/enquiries\` or similar endpoints.

## Lead Flow Trace
\`Form (ContactFormClient)\` -> \`POST /api/enquiries\` -> \`Prisma (Enquiry model)\` -> \`CRM Admin Dashboard\`
This flow is **fully functional**.
`,
  '04_BACKEND_API_AUDIT.md': `# Backend API Audit

## Directories
- \`/api/admin\`: Admin management
- \`/api/auth\`: Custom JWT auth
- \`/api/crm\`, \`/api/enquiries\`: CRM routes
- \`/api/hr\`, \`/api/users\`: HRM and Auth
- \`/api/integrations\`, \`/api/whatsapp\`, \`/api/webhooks\`: External integrations

## Characteristics
- **Authentication**: JWT validation in middleware/API routes.
- **Database**: Direct Prisma calls.
- **Validation**: Uses Zod for payload validation in newer routes, manual checks in older ones.

## Issues
Some endpoints are tightly coupled to the Next.js App Router context and would require refactoring to serve multiple external domains reliably.
`,
  '05_DATABASE_ARCHITECTURE.md': `# Database Architecture

## ORM
Prisma 6.4.1

## Key Entities
- **User / Employee / AppRole / Permission**: Handles auth and HRM hierarchy.
- **Enquiry / Lead / Customer / Meeting / Payment**: Handles the CRM lifecycle.
- **Service / BlogPost / Setting**: CMS and configuration.

## Quality
The schema is robust and uses foreign keys appropriately. There are no obvious missing indexes for the current scale, though some tables use JSON heavily for metadata which could become a performance bottleneck at high scale.
`,
  '06_CRM_AUDIT.md': `# CRM Deep Audit

## Features
- **Lead Creation**: Handled via public forms, API, or manual entry.
- **Lead Stages**: Configurable ENUMs (\`NEW\`, \`CONTACTED\`, etc.).
- **Follow-ups / Notes**: Functional via \`EnquiryNote\` and \`ActivityLog\`.
- **Integrations**: Integrated with WhatsApp and Google Sheets (lead import).

## Business Unit Readiness
Currently, leads do not have a strong \`business_unit\` identifier. To support the multi-business platform (Company + Marketplace), we will need to add a \`businessUnit\` column or model to associate leads with their origin property.
`,
  '07_HRM_AUDIT.md': `# HRM Deep Audit

## Features
- **Employees**: \`Employee\` model linked to \`User\`.
- **Roles & Permissions**: RBAC engine via \`AppRole\` and \`Permission\`.

## Marketplace Readiness
The current HRM can easily support marketplace roles (e.g., \`Marketplace Sales\`, \`Vendor Verification\`) by defining new \`AppRole\` entries and granular \`Permissions\`. No structural database changes are strictly required, though scoping employees to a specific "Business Unit" may be necessary later.
`,
  '08_AUTH_AND_PERMISSIONS_AUDIT.md': `# Authentication and Permissions

## Current Architecture
- Custom JWT issued via \`/api/auth/login\`.
- Stored in a secure \`tip_admin_token\` cookie.
- \`middleware.ts\` protects \`/admin/*\` routes.
- RBAC is implemented dynamically using database tables (\`AppRolePermission\`).

## Multi-Domain Issues
Currently, cookies are set for the root domain. If the marketplace is on a separate domain (e.g., \`marketplace.com\`), the JWT cookie from \`portal.companydomain.com\` will not be automatically sent due to cross-site cookie restrictions (SameSite, Domain scoping).
`,
  '09_MULTI_DOMAIN_READINESS.md': `# Multi-Domain Readiness

Status: **PARTIALLY READY**

## Analysis
The backend API is robust, but the frontend and backend are currently merged in a single Next.js app. 
To support \`marketplace.com\` and \`companywebsite.com\` talking to \`api.companydomain.com\`:
1. We need to split the API into a dedicated service or domain.
2. We must configure CORS properly in Next.js to allow the other domains.
3. Authentication must shift from SameSite Strict/Lax cookies to either Bearer tokens or explicitly scoped cross-domain cookies, which is complex.
`,
  '10_SECURITY_AUDIT.md': `# Security Audit

## Hardcoded Secrets
**SECRET DETECTED — VALUE MASKED**
- Found in \`src/lib/encryption.ts\`
- Found in \`src/lib/auth.ts\`
- Found in \`src/app/api/automation/cron/route.ts\`
*Note: All hardcoded fallbacks have been scrubbed to \`CHANGE_ME_PRODUCTION_SECRET\` in the repository.*

## General Security
- Passwords are hashed using \`bcryptjs\`.
- JWTs are signed and verified.
- The Admin panel is protected by middleware.
- Prisma mitigates standard SQL injection.
`,
  '11_MARKETPLACE_GAP_ANALYSIS.md': `# Marketplace Gap Analysis

The current system has NO marketplace functionality.

## Required Features (Future)
- **Vendors/Businesses**: We need a \`Vendor\` or \`BusinessProfile\` model.
- **Listings/Categories**: Models for services, products, and categories.
- **Search Engine**: Geospatial search for local listings.
- **B2B RFQ System**: Lead routing from buyers to multiple vendors.
- **Monetization**: Subscription engine, lead credits, and payment gateways (Razorpay is already present).
`,
  '12_BUSINESS_UNIT_ARCHITECTURE_PROPOSAL.md': `# Business Unit Architecture Proposal

## Concept
Introduce a \`BusinessUnit\` model or ENUM (e.g., \`COMPANY_SERVICES\`, \`MARKETPLACE\`).

## Implementation
1. Add \`businessUnit\` to \`Enquiry\` / \`Lead\`.
2. Add \`businessUnit\` to \`Employee\` (to restrict which CRM leads they can see).
3. Add \`sourceDomain\` to track where the lead originated.

This allows the Central Portal to filter the CRM and HRM dashboards based on the selected Business Unit.
`,
  '13_FUTURE_ARCHITECTURE_PROPOSAL.md': `# Future Architecture Proposal

## The "Modular Monolith" Approach
Instead of microservices, keep the Central Portal and Backend API as a single Next.js/Node.js application.

1. **api.techinpedia.com**: Hosts the API routes, CRM, HRM, and Admin Portal.
2. **techinpedia.com**: The public company website, a separate Next.js app fetching data from the API.
3. **marketplace.com**: The B2B/B2C marketplace, a separate Next.js app fetching data from the API.

This avoids the complexity of Kubernetes/Kafka while providing clean separation of public user interfaces from internal business logic.
`,
  '14_RECOMMENDED_BUILD_PHASES.md': `# Recommended Build Phases

1. **Phase 1: Stabilization & API Separation**
   - Refactor the current repository to ensure the API can securely handle CORS and external Bearer tokens.
2. **Phase 2: CRM & Database Extension**
   - Implement the \`BusinessUnit\` architecture to support future marketplace entities.
3. **Phase 3: Marketplace Frontend Development**
   - Build the Next.js Marketplace application (independent repo or Monorepo workspace).
4. **Phase 4: Vendor Portal**
   - Extend the Central API to provide vendor-specific endpoints.
`,
  '15_TECHNICAL_DEBT_REGISTER.md': `# Technical Debt Register

1. **Auth Coupling**: Authentication relies heavily on Next.js cookies, making cross-domain mobile app or external frontend integration harder.
2. **API Organization**: Some endpoints mix business logic directly inside the Next.js Route Handlers rather than separating it into controller/service layers.
3. **Hardcoded URLs**: Several places in the code might assume the frontend and backend share the same \`window.location.origin\`.
`,
  '16_AUDIT_EXECUTIVE_SUMMARY.md': `# Audit Executive Summary

The TechInPedia Business OS is a powerful, highly functional monolithic system containing a CRM, HRM, CMS, and public website. 

The immediate next step before building the Marketplace is to structurally decouple the public frontend from the administrative backend, and extend the database schema to support the concept of "Business Units". The codebase is fundamentally sound, written in TypeScript with Prisma, and provides a solid foundation for the multi-business platform.
`
};

for (const [filename, content] of Object.entries(files)) {
  fs.writeFileSync(path.join(dir, filename), content);
}
console.log('Successfully generated all audit documentation.');
