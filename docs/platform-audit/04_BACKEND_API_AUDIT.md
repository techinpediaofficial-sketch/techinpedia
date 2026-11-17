# Backend API Audit

## Directories
- `/api/admin`: Admin management
- `/api/auth`: Custom JWT auth
- `/api/crm`, `/api/enquiries`: CRM routes
- `/api/hr`, `/api/users`: HRM and Auth
- `/api/integrations`, `/api/whatsapp`, `/api/webhooks`: External integrations

## Characteristics
- **Authentication**: JWT validation in middleware/API routes.
- **Database**: Direct Prisma calls.
- **Validation**: Uses Zod for payload validation in newer routes, manual checks in older ones.

## Issues
Some endpoints are tightly coupled to the Next.js App Router context and would require refactoring to serve multiple external domains reliably.
