# Business Unit Architecture Proposal

## Concept
Introduce a `BusinessUnit` model or ENUM (e.g., `COMPANY_SERVICES`, `MARKETPLACE`).

## Implementation
1. Add `businessUnit` to `Enquiry` / `Lead`.
2. Add `businessUnit` to `Employee` (to restrict which CRM leads they can see).
3. Add `sourceDomain` to track where the lead originated.

This allows the Central Portal to filter the CRM and HRM dashboards based on the selected Business Unit.
