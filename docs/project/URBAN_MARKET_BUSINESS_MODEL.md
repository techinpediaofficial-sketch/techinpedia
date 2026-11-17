# URBAN MARKET — BUSINESS MODEL SOURCE OF TRUTH

**Status:** DOCUMENTED — Phase 1.1
**Do NOT implement marketplace features until Phase 2 is approved.**

---

## Platform Identity

Urban is a dual-mode marketplace:

- **B2C** — Justdial-style Local Services Discovery
- **B2B** — IndiaMART-style Products & Suppliers

Urban is NOT a booking platform. Customer requirements are **LEADS**, not service bookings.

### Domain Portability

Current hostname: `urban.techinpedia.com`

Urban's permanent identity is:
- Site Code: `MARKETPLACE_PUBLIC`
- Business Unit: `MARKETPLACE`

The hostname is a routing alias only. Future domain migration:
1. Add new hostname to `SiteDomain` as primary
2. Demote old hostname
3. Update DNS/SSL/deployment
4. **Zero marketplace data rebuild required**

---

## B2C — Local Services

### What it is
Customers discover and contact local service providers.

### Example Categories
AC Repair, Plumber, Electrician, Salon, Carpenter, Packers & Movers, Pest Control, Home Repair, Painting

### Core Flow
```
User Search (with intent detection)
→ Local Service Results
→ Login required only for action (not for browsing)
→ Enquiry / Call Lead / WhatsApp Lead
→ Urban Lead created (MARKETPLACE BU)
→ Category + Location Matching
→ Lead distributed to eligible vendors (fanout)
→ Vendor receives lead notification
```

---

## B2B — Products & Suppliers

### What it is
Buyers discover manufacturers, suppliers, wholesalers, distributors and post product enquiries or buy requirements.

### Example Categories
AC Compressor, Copper Pipe, Industrial AC, Commercial Refrigeration, Raw Materials, Electronic Components

### Core Flow
```
User Product Search (with intent detection)
→ Products / Supplier Results
→ Product Enquiry / Buy Requirement / RFQ
→ Urban B2B Lead created (MARKETPLACE BU)
→ Supplier Matching
→ Lead distributed to eligible suppliers
```

---

## Search Intent Switching

Urban top-level search will support **B2C** and **B2B** modes.

Default mode is intent-driven based on query classification:

| Query | Detected Intent | Default Tab |
|---|---|---|
| `AC Repair` | Service | B2C |
| `Plumber` | Service | B2C |
| `AC Compressor` | Product | B2B |
| `Copper Pipe Supplier` | Product | B2B |
| `AC` | Ambiguous | Show both tabs |

For ambiguous queries: show both B2C Services and B2B Products & Suppliers. Allow manual tab switching.

Category architecture must support: B2C only / B2B only / BOTH.

---

## User Authentication

Browsing and searching does NOT require login.

Login required for actions:
- Send Enquiry
- Get Quote
- Post Requirement
- Product Enquiry
- RFQ
- WhatsApp/Call (where lead capture required)

Planned auth methods (future):
- Mobile OTP
- Google OAuth
- Mobile + Password

---

## Vendor Portal

Vendors access Urban via: `/vendor` on the Urban primary domain.

- Vendor sees only their own scoped information
- Vendor does NOT get internal TechInPedia Admin (`admin.techinpedia.com`) access
- Vendor must NEVER authenticate as a company employee
- Internal Admin and Vendor Portal are completely separate surfaces

---

## Subscriptions

B2C and B2B subscriptions are separate. Plans are DB-driven, not hardcoded.

### B2C Subscription Controls
- B2C lead allowance + duration
- B2C categories covered
- Location / service area limits
- Lead notification channels
- Listing features (priority, featured)
- Other B2C entitlements

### B2B Subscription Controls
- B2B lead allowance + duration
- Product enquiries / buy leads / RFQs
- Product catalogue limits
- B2B categories covered
- Quote capabilities
- Supplier visibility features
- Other B2B entitlements

### Hybrid / Special Subscription
Admin may assign a vendor BOTH B2C and B2B entitlements.

Example: A vendor who does AC Repair (B2C) AND sells AC Compressors (B2B) can have a single hybrid subscription configured by Admin.

**Rule:** Do NOT hardcode plan names like Gold/Silver/Platinum. Plans are DB-driven and configured by Admin.

---

## Lead Quota Rules

Urban sells / distributes leads. Platform does NOT guarantee conversion.

**Core rule:** A valid subscription lead delivery consumes quota regardless of outcome.

| Outcome | Quota consumed? |
|---|---|
| Customer buys | YES |
| Customer does not buy | YES |
| Customer does not answer | YES |
| Vendor marks LOST | YES |
| Vendor marks INVALID | YES |
| Vendor does not contact | YES |

**Exception:** Blurred/preview leads shown to expired vendors do NOT consume quota.

Admin must eventually be able to:
- Add / remove leads manually
- Promotional lead allocation
- All adjustments are auditable

---

## Expired Subscription / Blurred Leads

When a vendor's subscription expires:

1. Vendor continues receiving **relevant matched lead previews** (within their category/location)
2. Lead details are **BLURRED / LOCKED**:
   ```
   New AC Repair Lead

   Customer: A******
   Phone: **********
   Location: Gomti Nagar
   Requirement: AC Repair

   [Renew Subscription to View]
   ```
3. Vendor may receive notification: "New AC Repair lead available. Renew to view details."
4. Full lead details (phone, name, contact) are NOT sent via Panel, SMS, or WhatsApp

Architecture must distinguish:
- `MATCHED` — lead identified as relevant to vendor
- `FULLY_DELIVERED` / `UNLOCKED` — vendor has access to full details

---

## Lead Notification Channels

Three channels for vendor lead notifications:
1. Vendor Panel Notification
2. SMS
3. WhatsApp

Each must be individually ENABLE / DISABLE:
- Global defaults (Admin)
- Plan-level settings
- Possibly vendor-level overrides (future)

---

## Category Matching

Strict category matching is mandatory.

Vendor with categories: AC Repair, AC Installation, AC Gas Refill

Must receive:
- AC category / service leads ✅

Must NOT receive:
- Salon leads ❌
- Plumbing leads ❌
- Carpenter leads ❌

Future matching must include:
```
Business Unit + B2C/B2B Mode + Category + Subcategory
+ Location / Service Area
+ Vendor Capability
+ Lead Distribution Rules
```

---

## Lead Fanout

One customer lead may be distributed to **multiple vendors** (fanout).

Admin controls maximum fanout:
- Global default fanout
- Category-specific fanout
- Manual distribution override
- Automatic distribution
- Selected vendor override

Example: AC Repair max 10 recipients from 50 matched vendors.

**Do NOT hardcode 10.** This is an example. Fanout is admin-configurable.

---

## Master Lead vs Vendor Delivery

```
Master Lead: URB-L-1001
├── VendorDelivery → Vendor A (MATCHED → UNLOCKED → CONTACTED → WON)
├── VendorDelivery → Vendor B (MATCHED → UNLOCKED → NO_RESPONSE)
├── VendorDelivery → Vendor C (MATCHED → BLURRED — expired subscription)
└── VendorDelivery → Vendor D (MATCHED → UNLOCKED → LOST)
```

Each VendorDelivery has its own lifecycle state:
- MATCHED, BLURRED, UNLOCKED, NOTIFICATION_SENT, VIEWED, CONTACTED,
  FOLLOW_UP, WON, LOST, NO_RESPONSE, QUOTA_CHARGED, deliveredAt, viewedAt

---

## Won / Lost Reporting

Vendor updates their delivery status:
- NEW → VIEWED → CONTACTED → FOLLOW_UP → WON / LOST / NO_RESPONSE

When vendor reports **WON**:
- Internal Urban/Admin receives notification for analytics
- No additional automatic commission
- No second lead quota deduction

Urban earns from subscriptions/leads, NOT from vendor deal commissions.

---

## B2B Public Contact Control

Supplier/product pages may show:
- Company name, logo, city, supplier type, verification badge, public description, catalogue

Must NOT automatically expose:
- Direct phone number
- Direct WhatsApp number
- Direct email

All contact buttons (Call, WhatsApp, Email, Get Best Price, Enquire) must:
1. Generate / attribute a lead first
2. Route through Urban-controlled communication/workflow

Direct contact exposure may become plan-configurable in future, but is NOT default.

---

## Lead Types (Future)

Urban lead engine should eventually support:
- `LOCAL_SERVICE`
- `LOCAL_BUSINESS_ENQUIRY`
- `PRODUCT_ENQUIRY`
- `BUY_REQUIREMENT`
- `RFQ`
- `CALL_LEAD`
- `WHATSAPP_LEAD`
- `EMAIL_LEAD`
- `DIRECT_ENQUIRY`

---

## Future Mobile Apps

- Urban User App — Flutter / Dart
- Urban Vendor App — Flutter / Dart

Do NOT build until approved. Both will reuse the central backend/API.

---

## Data Isolation

TechInPedia Company leads and Urban Marketplace leads must NEVER mix.

- Company lead: `businessUnit = COMPANY_SERVICES`
- Urban lead: `businessUnit = MARKETPLACE`
- A TechInPedia website-development lead must NEVER be visible to an Urban vendor
- An Urban lead must NEVER enter Company Services workflows

**Business Unit isolation is SERVER-SIDE. Frontend filtering alone is NOT security.**
