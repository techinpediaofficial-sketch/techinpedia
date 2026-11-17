# API Authorization Matrix

| API / Route Group | Public/Auth Required | Required Permission | Current Status | Fixed This Phase | Notes |
| ----------------- | -------------------- | ------------------- | -------------- | ---------------- | ----- |
| \`POST /api/enquiries\` | Public | None | VERIFIED | Yes | Open for public lead capture. No admin leak. |
| \`GET /api/enquiries\` | Auth Required | \`crm.leads.view\` | VERIFIED | Yes | Was previously auth-only, now explicitly requires CRM view permission. |
| \`GET /api/enquiries/[id]\` | Auth Required | \`crm.leads.view\` | VERIFIED | Yes | Restricted to CRM users. |
| \`PATCH /api/enquiries/[id]\` | Auth Required | \`crm.leads.edit\` | VERIFIED | Yes | Restricted to CRM users with edit rights. |
| \`DELETE /api/enquiries/[id]\` | Auth Required | \`crm.leads.delete\` | VERIFIED | Yes | Restricted to CRM admins. |
| \`/api/automation/cron\` | Secret Required | \`CRON_SECRET\` | VERIFIED | Yes | Strictly requires \`Authorization: Bearer <CRON_SECRET>\`. Query parameter authentication removed. |
| \`/api/hr/*\` | Auth Required | \`hr.*\`, \`attendance.*\`, etc | PARTIALLY REVIEWED | No | Deferred to next phase. |
| \`/api/finance/*\` | Auth Required | \`finance.*\`, \`sales.*\` | PARTIALLY REVIEWED | No | Deferred to next phase. |
| \`/api/settings/*\` | Auth Required | \`admin.settings.manage\` | PARTIALLY REVIEWED | No | Admin-only routes. |

*Note: APIs marked as PARTIALLY REVIEWED were audited generally but will have granular \`requirePermission()\` rules enforced across all endpoints in the upcoming phases, prioritizing high-risk APIs.*
