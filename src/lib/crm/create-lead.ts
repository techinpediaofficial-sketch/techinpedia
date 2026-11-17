import { db } from '@/lib/db';
import { resolveSiteContext } from '@/lib/site-context';
import { Prisma } from '@prisma/client';

export interface CreateEnquiryInput {
  name: string;
  email: string;
  phone?: string | null;
  message: string;
  source?: string;
  leadSubSource?: string;
  company?: string;
  service?: string;
  budget?: string;
  timeline?: string;
  referrerUrl?: string;
  landingPage?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmTerm?: string;
  utmContent?: string;
  // Allows backend to force a unit (e.g. Google Sheets integration mapped to a specific BU)
  forceBusinessUnitId?: string;
  forceSiteId?: string;
  forceCompanyId?: string;
}

/**
 * Centralized Service to create an Enquiry.
 * Resolves Business Unit and Site context safely before database insertion.
 */
export async function createEnquiry(data: CreateEnquiryInput, originHostname?: string | null) {
  // 1. Resolve Trusted Site Context
  let finalBusinessUnitId = data.forceBusinessUnitId;
  let finalSiteId = data.forceSiteId;

  if (!finalBusinessUnitId || !finalSiteId) {
    const context = await resolveSiteContext(originHostname);
    if (!finalBusinessUnitId) finalBusinessUnitId = context.businessUnitId || undefined;
    if (!finalSiteId) finalSiteId = context.siteId || undefined;
  }

  // 2. Map input data to Prisma EnquiryCreateInput
  const createInput: Prisma.EnquiryCreateInput = {
    name: data.name,
    email: data.email,
    phone: data.phone,
    message: data.message,
    source: data.source || 'Direct',
    leadSubSource: data.leadSubSource,
    company: data.company,
    service: data.service,
    budget: data.budget,
    timeline: data.timeline,
    referrerUrl: data.referrerUrl,
    landingPage: data.landingPage,
    utmSource: data.utmSource,
    utmMedium: data.utmMedium,
    utmCampaign: data.utmCampaign,
    utmTerm: data.utmTerm,
    utmContent: data.utmContent,
    status: 'NEW',
    priority: 'MEDIUM',
    temperature: 'WARM',
    score: 10,
  };

  if (finalBusinessUnitId) {
    createInput.businessUnit = { connect: { id: finalBusinessUnitId } };
  }
  
  if (finalSiteId) {
    createInput.site = { connect: { id: finalSiteId } };
  }

  if (data.forceCompanyId) {
    createInput.tenantCompany = { connect: { id: data.forceCompanyId } };
  }

  // 3. Persist
  const enquiry = await db.enquiry.create({
    data: createInput,
  });

  return enquiry;
}
