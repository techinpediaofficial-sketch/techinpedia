# Multi-Domain Readiness

Status: **PARTIALLY READY**

## Analysis
The backend API is robust, but the frontend and backend are currently merged in a single Next.js app. 
To support `marketplace.com` and `companywebsite.com` talking to `api.companydomain.com`:
1. We need to split the API into a dedicated service or domain.
2. We must configure CORS properly in Next.js to allow the other domains.
3. Authentication must shift from SameSite Strict/Lax cookies to either Bearer tokens or explicitly scoped cross-domain cookies, which is complex.
