import { db } from './db';
import { recordLeadTimelineEvent, calculateLeadScore } from './crm';
import { createEnquiry } from '@/lib/crm/create-lead';

export interface SheetFieldMapping {
  nameCol: string;
  emailCol: string;
  phoneCol?: string;
  companyCol?: string;
  serviceCol?: string;
  messageCol?: string;
}

/**
 * Validates whether Google service account credentials exist in environment.
 */
export function isGoogleSheetsConfigured(): { configured: boolean; missing: string[] } {
  const missing: string[] = [];
  if (!process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL) missing.push('GOOGLE_SERVICE_ACCOUNT_EMAIL');
  if (!process.env.GOOGLE_PRIVATE_KEY) missing.push('GOOGLE_PRIVATE_KEY');

  return {
    configured: missing.length === 0,
    missing,
  };
}

/**
 * PHASE 1.1 FIX:
 * Processes an array of mapped sheet rows into CRM leads with duplicate strategies.
 *
 * REQUIRES businessUnitId and siteId to be provided by the caller (the Google Sheets
 * integration config or admin context). These must come from trusted server-side config,
 * NOT from spreadsheet row values.
 *
 * Duplicate detection is scoped to the provided Business Unit only,
 * preventing cross-BU data leakage.
 */
export async function processSheetRowsIntoLeads(params: {
  rows: Record<string, string>[];
  mapping: SheetFieldMapping;
  duplicateStrategy: 'SKIP' | 'UPDATE' | 'CREATE_NEW';
  sourceName?: string;
  // PHASE 1.1: REQUIRED — BU context from trusted server-side config, never from sheet data
  businessUnitId: string;
  siteId?: string | null;
}): Promise<{ created: number; updated: number; skipped: number; errors: string[] }> {
  let created = 0;
  let updated = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (let i = 0; i < params.rows.length; i++) {
    const row = params.rows[i];
    const name = row[params.mapping.nameCol]?.trim();
    const email = row[params.mapping.emailCol]?.trim().toLowerCase();
    const phone = params.mapping.phoneCol ? row[params.mapping.phoneCol]?.trim() : null;
    const company = params.mapping.companyCol ? row[params.mapping.companyCol]?.trim() : null;
    const service = params.mapping.serviceCol ? row[params.mapping.serviceCol]?.trim() : 'Google Sheets Lead';
    const message = params.mapping.messageCol ? row[params.mapping.messageCol]?.trim() : 'Imported from Google Sheet';

    if (!name || !email) {
      errors.push(`Row ${i + 1}: Skipped due to missing name or email.`);
      continue;
    }

    // PHASE 1.1 FIX: Duplicate detection scoped to the SAME Business Unit.
    // A Company and Urban lead with the same email/phone are NOT duplicates of each other.
    const duplicateConditions: any[] = [];
    if (email) duplicateConditions.push({ email });
    if (phone) duplicateConditions.push({ phone });

    const existing = await db.enquiry.findFirst({
      where: {
        businessUnitId: params.businessUnitId, // SCOPED TO BU
        OR: duplicateConditions,
      },
    });

    if (existing) {
      if (params.duplicateStrategy === 'SKIP') {
        skipped++;
        continue;
      } else if (params.duplicateStrategy === 'UPDATE') {
        await db.enquiry.update({
          where: { id: existing.id },
          data: {
            name,
            phone: phone || existing.phone,
            company: company || existing.company,
            service: service || existing.service,
          },
        });
        await recordLeadTimelineEvent({
          enquiryId: existing.id,
          type: 'STATUS_CHANGE',
          title: 'Lead Updated from Google Sheet',
          description: `Updated via ${params.sourceName || 'Google Sheets'} sync.`,
          actorEmail: 'system@techinpedia.com',
        });
        updated++;
        continue;
      }
    }

    // Create New Lead with trusted BU context
    const score = calculateLeadScore({ phone, email, company, service, message });
    const newLead = await createEnquiry({
      name,
      email,
      phone,
      company: company || undefined,
      service,
      message,
      source: params.sourceName || 'Google Sheets Sync',
      // PHASE 1.1: Force BU context from trusted server-side integration config
      forceBusinessUnitId: params.businessUnitId,
      forceSiteId: params.siteId || undefined,
    });

    await db.enquiry.update({
      where: { id: newLead.id },
      data: {
        status: 'NEW',
        score,
        temperature: score >= 60 ? 'HOT' : 'WARM',
        priority: score >= 60 ? 'HIGH' : 'MEDIUM',
      }
    });

    await recordLeadTimelineEvent({
      enquiryId: newLead.id,
      type: 'CREATED',
      title: 'Lead Imported from Google Sheet',
      description: `Inbound lead synced from ${params.sourceName || 'Google Sheet'}. Initial score: ${score}/100.`,
      actorEmail: 'system@techinpedia.com',
    });

    created++;
  }

  return { created, updated, skipped, errors };
}
