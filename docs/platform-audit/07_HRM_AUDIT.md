# HRM Deep Audit

## Features
- **Employees**: `Employee` model linked to `User`.
- **Roles & Permissions**: RBAC engine via `AppRole` and `Permission`.

## Marketplace Readiness
The current HRM can easily support marketplace roles (e.g., `Marketplace Sales`, `Vendor Verification`) by defining new `AppRole` entries and granular `Permissions`. No structural database changes are strictly required, though scoping employees to a specific "Business Unit" may be necessary later.
