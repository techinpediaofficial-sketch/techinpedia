# Database Architecture

## ORM
Prisma 6.4.1

## Key Entities
- **User / Employee / AppRole / Permission**: Handles auth and HRM hierarchy.
- **Enquiry / Lead / Customer / Meeting / Payment**: Handles the CRM lifecycle.
- **Service / BlogPost / Setting**: CMS and configuration.

## Quality
The schema is robust and uses foreign keys appropriately. There are no obvious missing indexes for the current scale, though some tables use JSON heavily for metadata which could become a performance bottleneck at high scale.
