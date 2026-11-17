import { db } from './db';
import { normalizePhone } from './phone';

/**
 * Checks whether a phone number is opted out/suppressed.
 */
export async function isPhoneSuppressed(phone: string): Promise<boolean> {
  const norm = normalizePhone(phone);
  if (!norm.canonical) return false;

  const record = await db.whatsappSuppression.findUnique({
    where: { phone: norm.canonical },
  });

  return Boolean(record && record.status === 'OPTED_OUT');
}

/**
 * Filters an audience list and returns valid contacts and excluded suppressed contacts.
 */
export async function filterSuppressedAudience<T extends { phone?: string | null }>(
  audience: T[]
): Promise<{
  eligible: T[];
  suppressed: T[];
  invalid: T[];
}> {
  const eligible: T[] = [];
  const suppressed: T[] = [];
  const invalid: T[] = [];

  // Fetch all suppressed numbers
  const allSuppressed = await db.whatsappSuppression.findMany({
    where: { status: 'OPTED_OUT' },
    select: { phone: true },
  });
  const suppressedSet = new Set(allSuppressed.map((s) => s.phone));

  for (const contact of audience) {
    if (!contact.phone) {
      invalid.push(contact);
      continue;
    }

    const norm = normalizePhone(contact.phone);
    if (!norm.isValid) {
      invalid.push(contact);
      continue;
    }

    if (suppressedSet.has(norm.canonical)) {
      suppressed.push(contact);
    } else {
      eligible.push(contact);
    }
  }

  return { eligible, suppressed, invalid };
}

/**
 * Manually opts in or opts out a phone number.
 */
export async function setPhoneSuppression(
  phone: string,
  status: 'OPTED_OUT' | 'OPTED_IN',
  reason: string = 'ADMIN_MANUAL',
  notes?: string
) {
  const norm = normalizePhone(phone);
  if (!norm.canonical) throw new Error('Invalid phone number');

  return await db.whatsappSuppression.upsert({
    where: { phone: norm.canonical },
    update: {
      status,
      reason,
      source: 'ADMIN_MANUAL',
      optedOutAt: new Date(),
      notes,
    },
    create: {
      phone: norm.canonical,
      status,
      reason,
      source: 'ADMIN_MANUAL',
      notes,
    },
  });
}
