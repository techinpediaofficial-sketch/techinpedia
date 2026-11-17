# Phase 0 Security Hardening

## Problems Found
1. **Cron Authorization Bypass**: The \`/api/automation/cron\` route allowed execution if \`process.env.CRON_SECRET\` was missing by falling back to a hardcoded string, meaning anyone who guessed or found the fallback string could trigger side-effects.
2. **Predictable Cryptographic Fallbacks**: Both \`JWT_SECRET\` and \`ENCRYPTION_MASTER_KEY\` defaulted to hardcoded strings when missing from the environment.
3. **Missing Granular CRM Permissions**: The CRM Enquiries API endpoints (\`/api/enquiries\`) verified that a user was authenticated (logged in) but failed to verify if they explicitly possessed the \`crm.leads.view\` or \`crm.leads.edit\` permissions.

## Critical Fixes
- Removed the fallback \`CRON_SECRET\` string. The endpoint now fails closed (401 Unauthorized) and immediately halts execution.
- **Phase 0.1**: Cron authentication strictly requires \`Authorization: Bearer <CRON_SECRET>\`. Query string parameters (\`?secret=\`) have been completely removed, and timing-safe comparison is used.
- Removed hardcoded default secrets in \`src/lib/encryption.ts\` and \`src/lib/auth.ts\`.

## Authentication Changes
- No structural changes to the JWT cookie approach, but the underlying secret generation is now strictly enforced by the environment via \`src/lib/env.ts\`.
- **Phase 0.1**: \`ENCRYPTION_MASTER_KEY\` and \`JWT_SECRET\` are strictly separated.

## Authorization Changes
- Introduced \`src/lib/env.ts\` to act as a centralized, validated environment configuration layer.
- **Phase 0.2**: Reintroduced \`import 'server-only';\` to \`src/lib/env.ts\` to strictly prevent leaks into the client bundle.

## Refactoring and Testing
- **Phase 0.2**: Extracted pure, side-effect free Cron authentication logic into \`src/lib/cron-auth.ts\`.
- **Phase 0.2**: Cron tests now only exercise the pure authentication helper. They **DO NOT EXECUTE**:
  - queue jobs
  - invoice workflows
  - rental workflows
  - database mutations
  - notifications
- **Phase 0.2**: Consolidated AuthenticationError and AuthorizationError into a single source of truth \`src/lib/auth-errors.ts\` and implemented a reusable \`handleApiAuthError\` to centralize API route error responses.
- Added \`requirePermission(session, 'crm.leads.view')\`, \`crm.leads.edit\`, and \`crm.leads.delete\` to the respective \`/api/enquiries\` endpoints.
- **Phase 0.1**: Enquiries API now returns proper HTTP codes (401 Unauthorized, 403 Forbidden) via typed \`AuthenticationError\` and \`AuthorizationError\` instead of throwing 500s.

## Environment Changes
- Created a centralized \`env.ts\` config block.
- Updated \`.env.example\` to scrub all real values, leaving only placeholders for required secrets.

## CORS / Multi-Domain Preparation
- Added \`ALLOWED_ORIGINS\` to \`env.ts\` to parse and expose allowed origin URLs. This lays the groundwork for splitting the API to \`api.company-domain.com\` without relying on \`*\` CORS headers.

## Tests Performed
- Tested \`/api/automation/cron\` with missing/invalid/valid secrets manually via code analysis.
- Validated \`requirePermission\` propagation in CRM Enquiries API.
- Verified Next.js build (\`npm run build\`).

## Remaining Security Debt
- The HR, Finance, and Settings APIs need a sweeping \`requirePermission()\` audit.
- Authentication must eventually transition to Bearer tokens to support multiple domains (Marketplace, Company Site, Admin Portal) cleanly.

## Files Changed
- \`src/app/api/automation/cron/route.ts\`
- \`src/app/api/enquiries/route.ts\`
- \`src/app/api/enquiries/[id]/route.ts\`
- \`src/lib/auth.ts\`
- \`src/lib/encryption.ts\`
- \`src/lib/env.ts\`
- \`.env.example\`
- \`docs/platform-audit/10_SECURITY_AUDIT.md\`
- \`docs/platform-audit/17_API_AUTHORIZATION_MATRIX.md\`
- \`docs/platform-audit/18_PHASE_0_SECURITY_HARDENING.md\`
