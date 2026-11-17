# PHASE 1: BUSINESS UNIT FOUNDATION

This document outlines the Phase 1 architectural implementation which introduces multi-tenant Business Unit isolation to the central TechInPedia CRM.

## Architecture Implemented

The architecture maintains the monolith structure while abstracting context into reusable helpers.
- **Business Units:** Represents an independent commercial branch (e.g., `COMPANY_SERVICES`, `MARKETPLACE`).
- **Sites:** Represents a specific web property or API gateway belonging to a Business Unit.
- **SiteDomains:** Tracks domains mapped to Sites, allowing dynamic resolution of context.
- **Enquiry:** Extended to track both `businessUnitId` and `siteId`.
- **EmployeeBusinessUnit:** Many-to-many relationship tracking which employees have access to which units.

## Schema Modifications

### BusinessUnit Schema
```prisma
model BusinessUnit {
  id          String   @id @default(uuid())
  code        String   @unique
  name        String
  description String?
  isActive    Boolean  @default(true)
  isSystem    Boolean  @default(false)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  sites       Site[]
  employees   EmployeeBusinessUnit[]
  enquiries   Enquiry[]
}
```

### Site Registry
```prisma
model Site {
  id             String        @id @default(uuid())
  businessUnitId String?
  code           String        @unique
  name           String
  domain         String
  type           SiteType      // PUBLIC_WEBSITE, MARKETPLACE, INTERNAL_PORTAL, API
  isPrimary      Boolean       @default(false)
  isActive       Boolean       @default(true)
}
```

### Staff Access Mapping
```prisma
model EmployeeBusinessUnit {
  id             String       @id @default(uuid())
  employeeId     String
  businessUnitId String
  @@unique([employeeId, businessUnitId])
}
```

### Enquiry Changes
The `Enquiry` model was extended with:
- `businessUnitId String?` (nullable for safe migration)
- `siteId String?`
- Foreign keys to `BusinessUnit` and `Site` (onDelete: Restrict)
- Appropriate compound indexes for filtering by Business Unit.

## Lead Resolution Flow

Incoming requests to `POST /api/enquiries` now invoke the central `createEnquiry` helper in `src/lib/crm/create-lead.ts`.
This helper reads the incoming `Host` header, looks up the corresponding `SiteDomain`, and attaches the correct `Site` and `BusinessUnit` to the `Enquiry` before creation.
- Fallback logic safely sets `COMPANY_SERVICES` for backward compatibility of current integrations.

## Historical Backfill Strategy

An idempotent script `scripts/backfill-business-units.ts` has been created.
It upserts the `COMPANY_SERVICES` and `MARKETPLACE` core units and sites, then updates all existing `Enquiry` records to `COMPANY_SERVICES`.
Production databases must run this script safely before the next phase makes `businessUnitId` required.

## Business Unit Authorization

- `getAccessibleBusinessUnits(session)` retrieves an array of IDs from the user's JWT. `SUPER_ADMIN` receives `['*']`.
- `requireBusinessUnitAccess(session, buId)` throws an `AuthorizationError` (403 Forbidden) if access is denied.
- `GET /api/enquiries` automatically injects a Prisma `where: { businessUnitId: { in: accessibleUnits } }` filter.
- `GET`, `PATCH`, and `DELETE` endpoints for individual leads perform authorization checks to prevent IDOR vulnerabilities.
- `PATCH /api/enquiries/[id]` validates that newly assigned employees possess the correct Business Unit access via `canEmployeeAccessBusinessUnit()`.

## Admin UI
No significant UI rewrites occurred in Phase 1. Endpoints now respond securely. The front-end filters and Admin CRUD UI for Business Units will be fully integrated during the Phase 1 UI polish or as part of Phase 2 preparation.

## Tests

Unit tests are written in `tests/business-units.test.ts` covering:
- Super Admin global access.
- Employee constrained access.
- Denied access validation (AuthorizationError).
- Hostname normalization logic.

Run via: `npx -y tsx --env-file=.env --conditions react-server tests/business-units.test.ts`

## Migration Instructions

1. Deploy code.
2. Run Prisma migration / push carefully on the target environment.
3. Execute `npx tsx scripts/backfill-business-units.ts` to hydrate historical records.

## Known Remaining Work

- Admin UI for `Settings / Business Units` and `Settings / Sites & Domains`.
- Updating other entities (Deals, Companies, Contacts) to include Business Unit scope (if applicable).
- Full front-end integration for Business Unit selectors in manual lead creation.
