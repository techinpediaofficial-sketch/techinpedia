# Entity Schema Audit

## Implemented
- **Centralized Entity Model**: Created `src/config/site.ts` which acts as the single source of truth for the TechInPedia entity.
- **Organization Schema**: Updated `src/app/layout.tsx` to pull from the central config. Removed fake phone numbers, fake locations, and inappropriate LocalBusiness markup.
- **Service & Breadcrumb Schema**: Added explicit `Service` JSON-LD schema on dynamic service pages with `areaServed` property pointing to India. Injected `BreadcrumbList` schema to establish hierarchical entity relationships (e.g. Home > Services > Laptop Rental).
- **Location Page Schemas**: Integrated `BreadcrumbList` on specific location landing pages.

## Needs Owner Verification
- **Phone Number**: The `phone` field in `src/config/site.ts` is currently empty. The owner must provide a verified, public-facing phone number to claim entity contact points safely.
- **Social Profiles**: Check that the URLs provided for Instagram, LinkedIn, and GitHub in the config actually point to active and correct pages.

## Future Recommendations
- Implement `CaseStudy` or `Article` schema for specific portfolio pieces once real metrics and evidence are attached.
