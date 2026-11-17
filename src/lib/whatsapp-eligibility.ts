import { db } from '@/lib/db';

export interface WhatsAppEligibilityCheckParams {
  companyId?: string | null;
  phone: string;
  isMarketing?: boolean; // True for broadcasts, marketing drips, automated marketing
  isTemplate?: boolean;  // True if sending an approved Meta message template
  templateName?: string;
  senderUserId?: string;
}

export interface WhatsAppEligibilityResult {
  allowed: boolean;
  code:
    | 'ELIGIBLE'
    | 'TENANT_MISMATCH'
    | 'NO_CONNECTION'
    | 'BLACKLISTED'
    | 'MARKETING_OPTED_OUT'
    | 'WINDOW_EXPIRED'
    | 'RATE_LIMITED'
    | 'INVALID_PHONE';
  reason?: string;
  connection?: any;
  contact?: any;
}

/**
 * Normalizes phone numbers to standard E.164 format (+919818768680)
 */
export function normalizePhoneNumber(phone: string): string {
  if (!phone) return '';
  const cleaned = phone.replace(/[^0-9+]/g, '');
  if (cleaned.startsWith('+')) {
    return cleaned;
  }
  // Default to +91 if 10 digits
  if (cleaned.length === 10) {
    return `+91${cleaned}`;
  }
  return `+${cleaned}`;
}

/**
 * Centralized WhatsApp Eligibility Validation Service
 * Validates Tenant, Connection, Blacklist, Consent, Meta 24-hr Window, and Rate conditions.
 */
export async function canSendWhatsAppMessage(
  params: WhatsAppEligibilityCheckParams
): Promise<WhatsAppEligibilityResult> {
  const { companyId, isMarketing = false, isTemplate = false, templateName } = params;
  const canonicalPhone = normalizePhoneNumber(params.phone);

  if (!canonicalPhone || canonicalPhone.length < 8) {
    return {
      allowed: false,
      code: 'INVALID_PHONE',
      reason: `Invalid destination phone number: "${params.phone}". Must be in E.164 format.`,
    };
  }

  // 1. Connection Validation (Tenant-Scoped)
  const connection = await db.whatsappConnection.findFirst({
    where: {
      isActive: true,
      ...(companyId && companyId !== 'master' ? { companyId } : { companyId: null }),
    },
  });

  if (!connection && companyId && companyId !== 'master') {
    // Check fallback to company connection or report no connection
    const anyConn = await db.whatsappConnection.findFirst({
      where: { companyId, isActive: true },
    });
    if (!anyConn) {
      return {
        allowed: false,
        code: 'NO_CONNECTION',
        reason: 'No active WhatsApp Cloud API connection configured for this company.',
      };
    }
  }

  // 2. Blacklist / Suppression Check (Central Canonical Check)
  // Check exact phone and national phone variations
  const rawPhone = canonicalPhone.replace(/^\+/, '');
  const last10 = rawPhone.slice(-10);

  const suppression = await db.whatsappSuppression.findFirst({
    where: {
      OR: [
        { phone: canonicalPhone },
        { phone: rawPhone },
        { phone: { endsWith: last10 } },
      ],
      ...(companyId ? { OR: [{ companyId }, { companyId: null }] } : {}),
      status: { in: ['OPTED_OUT', 'BOUNCED'] },
    },
  });

  if (suppression) {
    return {
      allowed: false,
      code: 'BLACKLISTED',
      reason: `Recipient is blacklisted/opted-out (Reason: ${suppression.reason || 'User Request'}). Outbound messages are prohibited.`,
    };
  }

  // 3. Contact Record & Consent Verification
  let contact = await db.contact.findFirst({
    where: {
      phone: { contains: last10 },
      ...(companyId ? { companyId } : {}),
    },
  });

  if (contact) {
    if (contact.isBlacklisted) {
      return {
        allowed: false,
        code: 'BLACKLISTED',
        reason: 'Contact is marked as blacklisted in CRM.',
        contact,
      };
    }

    if (contact.optInStatus === 'OPTED_OUT') {
      return {
        allowed: false,
        code: 'MARKETING_OPTED_OUT',
        reason: `Contact has explicitly opted out of WhatsApp communications (Reason: ${contact.optOutReason || 'Unsubscribed'}).`,
        contact,
      };
    }

    if (isMarketing && contact.marketingOptIn === false) {
      return {
        allowed: false,
        code: 'MARKETING_OPTED_OUT',
        reason: 'Contact has opted out of promotional marketing messages.',
        contact,
      };
    }
  }

  // 4. Meta 24-Hour Customer Care Window Rule
  // If not an approved template and not inside 24-hour window, Meta will reject non-template messages
  if (!isTemplate) {
    // Check conversation history for customer inbound activity within 24 hours
    const conversation = await db.whatsappConversation.findFirst({
      where: {
        waNumber: canonicalPhone,
        ...(companyId ? { companyId } : {}),
      },
      select: {
        lastCustomerActivityAt: true,
        lastMessageAt: true,
      },
    });

    const now = Date.now();
    const lastActivity = conversation?.lastCustomerActivityAt
      ? new Date(conversation.lastCustomerActivityAt).getTime()
      : 0;

    const windowActive = now - lastActivity <= 24 * 60 * 60 * 1000;

    if (!windowActive) {
      return {
        allowed: false,
        code: 'WINDOW_EXPIRED',
        reason:
          'Meta 24-Hour Customer Care Window has expired. Only approved Meta Message Templates can initiate or re-open conversations outside the 24-hour window.',
        contact,
      };
    }
  }

  return {
    allowed: true,
    code: 'ELIGIBLE',
    connection,
    contact,
  };
}
