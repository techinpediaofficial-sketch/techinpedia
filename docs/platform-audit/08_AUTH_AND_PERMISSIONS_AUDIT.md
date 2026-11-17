# Authentication and Permissions

## Current Architecture
- Custom JWT issued via `/api/auth/login`.
- Stored in a secure `tip_admin_token` cookie.
- `middleware.ts` protects `/admin/*` routes.
- RBAC is implemented dynamically using database tables (`AppRolePermission`).

## Multi-Domain Issues
Currently, cookies are set for the root domain. If the marketplace is on a separate domain (e.g., `marketplace.com`), the JWT cookie from `portal.companydomain.com` will not be automatically sent due to cross-site cookie restrictions (SameSite, Domain scoping).
