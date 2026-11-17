# Future Architecture Proposal

## The "Modular Monolith" Approach
Instead of microservices, keep the Central Portal and Backend API as a single Next.js/Node.js application.

1. **api.techinpedia.com**: Hosts the API routes, CRM, HRM, and Admin Portal.
2. **techinpedia.com**: The public company website, a separate Next.js app fetching data from the API.
3. **marketplace.com**: The B2B/B2C marketplace, a separate Next.js app fetching data from the API.

This avoids the complexity of Kubernetes/Kafka while providing clean separation of public user interfaces from internal business logic.
