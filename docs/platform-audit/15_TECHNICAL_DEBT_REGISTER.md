# Technical Debt Register

1. **Auth Coupling**: Authentication relies heavily on Next.js cookies, making cross-domain mobile app or external frontend integration harder.
2. **API Organization**: Some endpoints mix business logic directly inside the Next.js Route Handlers rather than separating it into controller/service layers.
3. **Hardcoded URLs**: Several places in the code might assume the frontend and backend share the same `window.location.origin`.
