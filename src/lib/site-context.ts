import { db } from './db';

export interface SiteContext {
  businessUnitId: string | null;
  businessUnitCode: string | null;
  siteId: string | null;
  siteCode: string | null;
  siteType: string | null;
}

/**
 * Normalizes hostname (e.g. removing www, port numbers)
 */
export function normalizeHostname(hostname: string | null | undefined): string {
  if (!hostname) return '';
  let normalized = hostname.toLowerCase().trim();
  if (normalized.startsWith('http://')) normalized = normalized.substring(7);
  if (normalized.startsWith('https://')) normalized = normalized.substring(8);
  if (normalized.includes(':')) normalized = normalized.split(':')[0];
  if (normalized.startsWith('www.')) normalized = normalized.substring(4);
  return normalized;
}

/**
 * PHASE 1.1 FIX:
 * Resolves the trusted site context from an incoming hostname via SiteDomain registry.
 *
 * Returns null if hostname is not registered in SiteDomain.
 * Unknown/unregistered hosts are NOT silently mapped to COMPANY_SERVICES.
 *
 * Callers must decide how to handle an unresolved context.
 */
export async function resolveSiteContextOrNull(hostname: string | null | undefined): Promise<SiteContext | null> {
  const normalizedHost = normalizeHostname(hostname);

  if (!normalizedHost) return null;

  const siteDomain = await db.siteDomain.findUnique({
    where: { hostname: normalizedHost },
    include: {
      site: {
        include: { businessUnit: true }
      }
    }
  });

  if (siteDomain?.isActive && siteDomain.site?.isActive) {
    return {
      businessUnitId: siteDomain.site.businessUnitId,
      businessUnitCode: siteDomain.site.businessUnit?.code || null,
      siteId: siteDomain.site.id,
      siteCode: siteDomain.site.code,
      siteType: siteDomain.site.type,
    };
  }

  return null;
}

/**
 * Explicitly resolves the Company (COMPANY_PUBLIC) site context.
 * Use ONLY when server-side code explicitly intends company context
 * (e.g. company website contact form, Google Sheets company integration).
 *
 * Never call this for unknown/unregistered hosts. Use resolveSiteContextOrNull() instead.
 */
export async function resolveCompanySiteContext(): Promise<SiteContext> {
  const site = await db.site.findUnique({
    where: { code: 'COMPANY_PUBLIC' },
    include: { businessUnit: true }
  });

  if (!site) {
    throw new Error(
      'COMPANY_PUBLIC site not found. Run the backfill script to register site domains.'
    );
  }

  return {
    businessUnitId: site.businessUnitId,
    businessUnitCode: site.businessUnit?.code || 'COMPANY_SERVICES',
    siteId: site.id,
    siteCode: site.code,
    siteType: site.type,
  };
}

/**
 * Resolves the Marketplace (MARKETPLACE_PUBLIC) site context explicitly.
 * Use ONLY when server-side code explicitly intends marketplace context.
 */
export async function resolveMarketplaceSiteContext(): Promise<SiteContext> {
  const site = await db.site.findUnique({
    where: { code: 'MARKETPLACE_PUBLIC' },
    include: { businessUnit: true }
  });

  if (!site) {
    throw new Error(
      'MARKETPLACE_PUBLIC site not found. Run the backfill script to register site domains.'
    );
  }

  return {
    businessUnitId: site.businessUnitId,
    businessUnitCode: site.businessUnit?.code || 'MARKETPLACE',
    siteId: site.id,
    siteCode: site.code,
    siteType: site.type,
  };
}

/**
 * PHASE 1.1 MAIN RESOLVER:
 * Resolves site context from a hostname. Falls back to COMPANY_PUBLIC
 * ONLY if the hostname matches the registered company domain.
 *
 * If hostname is unknown/unregistered, returns a null-BU unresolved context
 * so callers can handle appropriately (e.g. reject, or default to company
 * only via explicit server-side logic).
 *
 * Replaces the old `resolveSiteContext()` which silently fell back to
 * COMPANY_SERVICES for ANY unknown host — which was unsafe.
 */
export async function resolveSiteContext(hostname: string | null | undefined): Promise<SiteContext> {
  // Try to resolve from authoritative SiteDomain registry first
  const fromRegistry = await resolveSiteContextOrNull(hostname);
  if (fromRegistry) return fromRegistry;

  // PHASE 1.1 FIX: Unknown host does NOT silently become COMPANY_SERVICES.
  // Return an unresolved context. Business Unit and Site will be null.
  // This allows createEnquiry() to store the lead without BU (admin can triage).
  // A SUPER_ADMIN can see null-BU records for cleanup.
  return {
    businessUnitId: null,
    businessUnitCode: null,
    siteId: null,
    siteCode: null,
    siteType: null,
  };
}
