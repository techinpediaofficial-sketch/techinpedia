import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { logActivity } from '@/lib/activity';
import { normalizePhoneNumber } from '@/lib/whatsapp-eligibility';

export async function POST(request: Request) {
  try {
    const session = await requireAuth();
    const body = await request.json();

    const {
      rows = [],
      mapping = {},
      mergeStrategy = 'SKIP_DUPLICATES', // SKIP_DUPLICATES or UPDATE_EXISTING
      previewOnly = false,
      defaultTags = [],
      source = 'CSV_IMPORT',
    } = body;

    const isTenant = session.isTenant;
    const companyId = isTenant && session.companyId ? session.companyId : body.companyId || null;

    if (!Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json({ error: 'No data rows provided for import.' }, { status: 400 });
    }

    if (rows.length > 2000) {
      return NextResponse.json({ error: 'Import batch size exceeds 2,000 rows limit.' }, { status: 400 });
    }

    // Process rows
    let imported = 0;
    let updated = 0;
    let skipped = 0;
    let invalid = 0;
    let duplicate = 0;
    const errors: Array<{ row: number; error: string }> = [];
    const previewList: any[] = [];

    // Map rows based on provided column mappings:
    // mapping = { name: "Full Name", phone: "Mobile", email: "Email", tags: "Tags", leadStatus: "Stage" }
    for (let i = 0; i < rows.length; i++) {
      const raw = rows[i];
      const nameKey = mapping.name || 'name';
      const phoneKey = mapping.phone || 'phone';
      const emailKey = mapping.email || 'email';
      const tagsKey = mapping.tags || 'tags';
      const leadStatusKey = mapping.leadStatus || 'leadStatus';
      const cityKey = mapping.city || 'city';

      const rawName = String(raw[nameKey] || '').trim();
      const rawPhone = String(raw[phoneKey] || '').trim();
      const rawEmail = String(raw[emailKey] || '').trim();
      const rawTags = raw[tagsKey];
      const rawLeadStatus = String(raw[leadStatusKey] || '').trim();
      const rawCity = String(raw[cityKey] || '').trim();

      const normalizedPhone = rawPhone ? normalizePhoneNumber(rawPhone) : '';

      if (!normalizedPhone && !rawEmail && !rawName) {
        invalid++;
        errors.push({ row: i + 1, error: 'Row is empty or missing name/phone/email' });
        continue;
      }

      if (rawPhone && (!normalizedPhone || normalizedPhone.length < 8)) {
        invalid++;
        errors.push({ row: i + 1, error: `Invalid phone format: "${rawPhone}"` });
        continue;
      }

      // Merge tags
      let parsedTags: string[] = [...defaultTags];
      if (typeof rawTags === 'string') {
        const split = rawTags.split(/[,;|]/).map((t) => t.trim()).filter(Boolean);
        parsedTags.push(...split);
      } else if (Array.isArray(rawTags)) {
        parsedTags.push(...rawTags.map((t) => String(t).trim()).filter(Boolean));
      }
      parsedTags = Array.from(new Set(parsedTags));

      const contactData: any = {
        name: rawName || normalizedPhone || rawEmail.split('@')[0] || 'Imported Contact',
        phone: normalizedPhone || null,
        email: rawEmail || `${normalizedPhone || Date.now()}@placeholder.techinpedia.com`,
        leadStatus: rawLeadStatus || 'NEW',
        source: source || 'CSV_IMPORT',
        tags: JSON.stringify(parsedTags),
        customFields: rawCity ? JSON.stringify({ city: rawCity }) : null,
        companyId,
        optInStatus: 'OPTED_IN',
        marketingOptIn: true,
        consentSource: 'CSV_IMPORT',
        consentTimestamp: new Date(),
        lastInteractionAt: new Date(),
      };

      if (previewOnly) {
        if (previewList.length < 10) {
          previewList.push({ rowNumber: i + 1, parsed: contactData });
        }
        continue;
      }

      // Check duplicate in company
      let existing: any = null;
      if (normalizedPhone) {
        existing = await db.contact.findFirst({
          where: { phone: normalizedPhone, companyId },
        });
      }
      if (!existing && rawEmail) {
        existing = await db.contact.findFirst({
          where: { email: rawEmail.toLowerCase(), companyId },
        });
      }

      if (existing) {
        duplicate++;
        if (mergeStrategy === 'UPDATE_EXISTING') {
          await db.contact.update({
            where: { id: existing.id },
            data: {
              name: contactData.name,
              tags: contactData.tags,
              leadStatus: contactData.leadStatus,
              customFields: contactData.customFields || existing.customFields,
            },
          });
          updated++;
        } else {
          skipped++;
        }
      } else {
        await db.contact.create({
          data: contactData,
        });
        imported++;
      }
    }

    if (!previewOnly) {
      await logActivity({
        userId: session.userId,
        userEmail: session.email,
        action: 'IMPORT_CONTACTS_CSV',
        entityType: 'Contact',
        metadata: {
          totalRows: rows.length,
          imported,
          updated,
          skipped,
          invalid,
          companyId,
        },
      });
    }

    return NextResponse.json({
      success: true,
      previewOnly,
      summary: {
        totalRows: rows.length,
        imported,
        updated,
        skipped,
        invalid,
        duplicate,
      },
      errors: errors.slice(0, 50),
      previewRows: previewList,
    });
  } catch (error: any) {
    console.error('Import contacts error:', error);
    return NextResponse.json({ error: error.message || 'Failed to import contacts.' }, { status: 500 });
  }
}
