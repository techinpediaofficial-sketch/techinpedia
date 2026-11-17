# DO NOT BREAK - CRITICAL RULES

## Rule 1
`techinpedia.com` is live production. Never overwrite it with Urban.

## Rule 2
Do not deploy marketplace code to: `/home/<SERVER_USER>/public_html/techinpedia.com`

## Rule 3
Urban belongs at: `/home/<SERVER_USER>/public_html/urban.techinpedia.com`

## Rule 4
Admin belongs at: `admin.techinpedia.com`

## Rule 5
Do not commit credentials.

## Rule 6
Do not run: `prisma db push` against production.

## Rule 7
Do not run destructive migrations without explicit approval.

## Rule 8
Do not delete working CRM/HRM modules to rebuild them.

## Rule 9
Do not create a second CRM.

## Rule 10
Do not begin the next phase until the current phase has:
Code complete
Tests run
Build passes
GitHub pushed
Independent review completed

## Rule 11
Do not disrupt or overwrite the Platform Master WhatsApp Cloud API account (Abdiel Aircon, `companyId: null`, phone `+44 7472 198505`). All company/tenant WhatsApp connections must remain strictly multi-tenant isolated by `companyId`.

## Rule 12
Do not create duplicate customer models for WhatsApp marketing. Always use the canonical `Contact` entity extended with CRM and WhatsApp marketing telemetry (`leadStatus`, `optInStatus`, `marketingOptIn`, `isBlacklisted`, `tags`, `customFields`).

## Rule 13
Do not create a secondary automation engine. Always reuse and extend the central `WorkflowRule`, `WorkflowExecution`, `WorkflowJob` architecture and `worker.js` queues (e.g. `whatsapp-campaign`, `whatsapp-drip-step`, `whatsapp-chatbot-delay`, `ai-knowledge-index`).

## Rule 14
Do not bypass tenant isolation in AI knowledge retrieval, chatbot execution, or goal processing. Always derive `companyId` strictly from the authenticated server session or verified webhook context. Never trust client-supplied tenant IDs for knowledge chunk retrieval, and always run `inspectSecurityGuardrails` before dispatching user messages to external LLM providers.

## Rule 15
Do not hardcode WhatsApp template names, Meta template IDs, package IDs/prices, or button labels in backend controllers, action handlers, or services. All template associations, purpose mappings (`WELCOME`, `PACKAGE_MENU`, `BOOKING_DETAILS`), and button action behaviors must be resolved dynamically through `WhatsappTemplatePurpose`, `PackageWhatsAppConfig`, and `WhatsappTemplateButtonAction` scoped strictly by `companyId`.

## Rule 16
When associating staff to WhatsApp conversations or CRM enquiries, never mix `User(id)` with `Employee(id)`. In `Enquiry`, `assignedTo` maps to `User.id` and `assignedEmployeeId` maps to `Employee.id`. In `WhatsappConversation`, `assignedUserId` maps to `User.id`. When updating templates on Meta, never attempt to rename the template name or change language in-place on Meta WABA; preserve those identifiers and update the components (header, body text, footer, buttons).

## Rule 17
Never allow `urban.techinpedia.com` to serve `techinpedia.com` blogs (`/blog/*`) or IT/rental service pages with HTTP 200. Always maintain HTTP 301 Permanent Redirects in `src/middleware.ts` back to `https://techinpedia.com`. Never place static `robots.txt` or `sitemap.xml` inside `public/` that hardcode hostnames or shadow Next.js App Router dynamic metadata generators (`src/app/robots.ts` and `src/app/sitemap.ts`). Urban must only publish its own marketplace discovery URLs in its sitemap and robots directives.

## Rule 18
Never allow `src/app/services/[slug]/page.tsx` or any service catalog routes to render marketplace directories or hardcode `UrbanMarket` title metadata. Corporate IT services (`laptop-rental`, `computer-rental`, `macbook-rental`, `amc-maintenance`, `website-development`, `custom-software-development`, `crm-erp-solutions`, `mobile-application`, `cloud-services`, `digital-marketing`) belong strictly to `techinpedia.com`. If a requested slug matches a marketplace category, redirect (HTTP 301) to `https://urban.techinpedia.com/category/${slug}`.

