# Company Website Audit

## Pages Audited
- **Home**: `src/app/page.tsx`
- **About**: `src/app/about`
- **Services**: `src/app/services`
- **Contact**: `src/app/contact`

## API Integration
The public website has lead capture forms (e.g., ContactFormClient). 
These forms hit `src/app/api/enquiries` or similar endpoints.

## Lead Flow Trace
`Form (ContactFormClient)` -> `POST /api/enquiries` -> `Prisma (Enquiry model)` -> `CRM Admin Dashboard`
This flow is **fully functional**.
