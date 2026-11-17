# Security Audit

## Hardcoded Secrets
**SECRET DETECTED — VALUE MASKED**
- Found in \`src/lib/encryption.ts\`
- Found in \`src/lib/auth.ts\`
- Found in \`src/app/api/automation/cron/route.ts\`
*Note: All hardcoded fallbacks have been permanently removed and replaced with a centralized, fail-closed environment loader (\`src/lib/env.ts\`) during Phase 0.*

## General Security
- Passwords are hashed using \`bcryptjs\`.
- JWTs are signed and verified using strict environment secrets.
- The Admin panel is protected by middleware.
- Prisma mitigates standard SQL injection.

## Phase 0 Updates
- **Cron Authorization**: FIXED. Route now fails closed and halts execution.
- **Predictable Secrets**: FIXED. Application crashes on boot if secrets are missing.
- **Granular Auth**: CRM APIs updated to use \`requirePermission()\`. Public POST forms remain open for lead capture.

## Phase 0.1 Corrections
- **Cron Authentication**: Strictly enforces \`Authorization: Bearer <CRON_SECRET>\`. Query string authentication has been completely removed to prevent secret leakage in logs. Comparison uses \`crypto.timingSafeEqual\`.
- **Encryption Secret**: Consistently uses \`ENCRYPTION_MASTER_KEY\` across the codebase, distinct from \`JWT_SECRET\`.
- **CRM Authorization Responses**: CRM endpoints correctly return HTTP 401 for unauthenticated requests, 403 for missing permissions, and 500 only for unexpected server errors.
