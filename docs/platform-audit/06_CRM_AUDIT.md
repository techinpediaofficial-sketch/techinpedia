# CRM Deep Audit

## Features
- **Lead Creation**: Handled via public forms, API, or manual entry.
- **Lead Stages**: Configurable ENUMs (`NEW`, `CONTACTED`, etc.).
- **Follow-ups / Notes**: Functional via `EnquiryNote` and `ActivityLog`.
- **Integrations**: Integrated with WhatsApp and Google Sheets (lead import).

## Business Unit Readiness
Currently, leads do not have a strong `business_unit` identifier. To support the multi-business platform (Company + Marketplace), we will need to add a `businessUnit` column or model to associate leads with their origin property.
