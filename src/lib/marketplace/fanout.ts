import { db } from '@/lib/db';
import { sendWhatsAppTextMessage } from '@/lib/whatsapp_service';
import { recordLeadTimelineEvent } from '@/lib/crm';
import { normalizePhone } from '@/lib/phone';

export interface MatchedVendor {
  id: string;
  businessName: string;
  ownerName: string;
  phone: string | null;
  email: string;
  city: string;
  categories: string[];
}

/**
 * Urban Marketplace Automated Lead Fanout Engine
 * Matches inbound buyer enquiries with eligible, verified vendors
 * based on category, service type, and city radius.
 */
export async function fanoutMarketplaceLead(enquiryId: string): Promise<{
  success: boolean;
  matchedCount: number;
  vendors: string[];
  error?: string;
}> {
  try {
    const lead = await db.enquiry.findUnique({
      where: { id: enquiryId },
      include: { notes: true },
    });

    if (!lead) {
      return { success: false, matchedCount: 0, vendors: [], error: 'Lead not found' };
    }

    // Never fanout vendor onboarding registrations
    if (lead.projectType === 'VENDOR_ONBOARDING' || lead.source === 'Urban Vendor Onboarding') {
      return { success: true, matchedCount: 0, vendors: [] };
    }

    // Verify lead belongs to Marketplace
    const isMarketplace =
      lead.businessUnitId === 'MARKETPLACE' ||
      lead.siteId === 'MARKETPLACE_PUBLIC' ||
      (lead.source && lead.source.toLowerCase().includes('urban'));

    if (!isMarketplace) {
      return { success: true, matchedCount: 0, vendors: [] };
    }

    // Find all active/verified marketplace vendors
    const vendorRecords = await db.enquiry.findMany({
      where: {
        OR: [
          { projectType: 'VENDOR_ONBOARDING' },
          { source: 'Urban Vendor Onboarding' },
        ],
        status: { in: ['QUALIFIED', 'WON', 'NEW'] },
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    // Parse vendor categories & cities
    const parsedVendors: MatchedVendor[] = vendorRecords.map((v) => {
      const lines = v.message ? v.message.split('\n') : [];
      let categories: string[] = v.service ? [v.service] : [];

      lines.forEach((line) => {
        if (line.startsWith('Categories:')) {
          const parsed = line.replace('Categories:', '').split(',').map((c) => c.trim()).filter(Boolean);
          if (parsed.length > 0) categories = parsed;
        }
      });

      return {
        id: v.id,
        businessName: v.company || v.name,
        ownerName: v.name,
        phone: v.phone,
        email: v.email,
        city: v.city || 'Delhi NCR',
        categories,
      };
    });

    // Match based on category keywords and location
    const leadService = (lead.service || '').toLowerCase();
    const leadMessage = (lead.message || '').toLowerCase();
    const leadCity = (lead.city || '').toLowerCase();

    let matched = parsedVendors.filter((vendor) => {
      // 1. Category match
      const hasCategoryMatch = vendor.categories.some((cat) => {
        const cLower = cat.toLowerCase();
        return leadService.includes(cLower) || leadMessage.includes(cLower) || cLower.includes(leadService);
      });

      // 2. City match (or PAN India)
      const vCityLower = vendor.city.toLowerCase();
      const hasCityMatch =
        !leadCity ||
        vCityLower.includes(leadCity) ||
        leadCity.includes(vCityLower) ||
        vCityLower.includes('all') ||
        vCityLower.includes('india');

      return hasCategoryMatch || hasCityMatch;
    });

    // Fallback: If no strict keyword matches, select top 3 active verified vendors so lead is handled
    if (matched.length === 0 && parsedVendors.length > 0) {
      matched = parsedVendors.slice(0, 3);
    } else {
      matched = matched.slice(0, 5); // Max 5 vendors per lead
    }

    const matchedNames: string[] = [];

    // Distribute lead to matched vendors
    for (const vendor of matched) {
      matchedNames.push(vendor.businessName);

      // Record distribution audit in CRM lead timeline
      await recordLeadTimelineEvent({
        enquiryId: lead.id,
        type: 'MARKETPLACE_LEAD_DISTRIBUTED',
        title: 'Lead Distributed to Vendor',
        description: `Fanned out to verified vendor: ${vendor.businessName} (${vendor.city}).`,
        metadata: {
          vendorId: vendor.id,
          vendorName: vendor.businessName,
          vendorPhone: vendor.phone,
          vendorEmail: vendor.email,
          distributedAt: new Date().toISOString(),
        },
        actorEmail: 'system@urban.techinpedia.com',
      });

      // Dispatch WhatsApp Lead Alert to vendor
      if (vendor.phone) {
        const norm = normalizePhone(vendor.phone);
        if (norm.isValid) {
          const alertMessage =
            `🔔 *New Lead Alert on Urban Marketplace!*\n\n` +
            `📋 *Requirement:* ${lead.service || 'Service Requirement'}\n` +
            `📍 *Location:* ${lead.city || 'Delhi NCR'}\n` +
            `💰 *Budget:* ${lead.budget || 'Market Best Rate'}\n` +
            `🕒 *Posted:* Just now\n\n` +
            `👉 *Login to your Vendor Portal to unlock buyer contact:*\n` +
            `https://urban.techinpedia.com/vendor`;

          sendWhatsAppTextMessage(norm.canonical, alertMessage).catch((err) => {
            console.warn(`[Marketplace Fanout] WhatsApp alert failed for vendor ${vendor.businessName}:`, err?.message || err);
          });
        }
      }
    }

    // Add summary note to the enquiry
    if (matchedNames.length > 0) {
      await db.enquiry.update({
        where: { id: lead.id },
        data: {
          leadSubSource: `FANNED_OUT_${matchedNames.length}`,
        },
      });
    }

    return {
      success: true,
      matchedCount: matched.length,
      vendors: matchedNames,
    };
  } catch (error: any) {
    console.error('[Marketplace Fanout] Fanout error:', error);
    return {
      success: false,
      matchedCount: 0,
      vendors: [],
      error: error?.message || 'Fanout processing failed',
    };
  }
}
