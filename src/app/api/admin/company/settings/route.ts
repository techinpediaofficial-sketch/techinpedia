import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { isOwnerOrAdmin } from '@/lib/access-policy';

/**
 * GET /api/admin/company/settings
 * PUT /api/admin/company/settings
 * 
 * Tenant-scoped settings management for Company Owners and Admins:
 * - whatsapp_auto_lead: automatically create CRM lead from inbound WhatsApp message
 * - sla_warning_percent: percentage threshold before breach (e.g. 80%)
 */
export async function GET() {
  try {
    const session = await requireAuth();
    const companyId = session.companyId;

    if (!companyId && session.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'No company account associated' }, { status: 400 });
    }

    const targetCompanyId = companyId || 'platform';

    const [autoLeadSetting, warningThresholdSetting] = await Promise.all([
      db.setting.findFirst({ where: { key: `whatsapp_auto_lead_${targetCompanyId}` } }),
      db.setting.findFirst({ where: { key: `sla_warning_percent_${targetCompanyId}` } }),
    ]);

    return NextResponse.json({
      settings: {
        autoCreateLeadFromWhatsApp: autoLeadSetting ? autoLeadSetting.value !== 'false' : true,
        slaWarningPercent: warningThresholdSetting ? parseInt(warningThresholdSetting.value) || 80 : 80,
      },
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const session = await requireAuth();
    const companyId = session.companyId;

    if (!companyId && session.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'No company account associated' }, { status: 400 });
    }

    if (!isOwnerOrAdmin(session)) {
      return NextResponse.json({ error: 'Forbidden: Only owners and admins can modify company settings' }, { status: 403 });
    }

    const targetCompanyId = companyId || 'platform';
    const body = await request.json();
    const { autoCreateLeadFromWhatsApp, slaWarningPercent } = body;

    const updates: Promise<any>[] = [];

    if (autoCreateLeadFromWhatsApp !== undefined) {
      const val = autoCreateLeadFromWhatsApp ? 'true' : 'false';
      updates.push(
        db.setting.upsert({
          where: { key: `whatsapp_auto_lead_${targetCompanyId}` },
          update: { value: val },
          create: { key: `whatsapp_auto_lead_${targetCompanyId}`, value: val, category: 'COMPANY' },
        })
      );
    }

    if (slaWarningPercent !== undefined) {
      const val = String(Math.max(10, Math.min(99, parseInt(slaWarningPercent) || 80)));
      updates.push(
        db.setting.upsert({
          where: { key: `sla_warning_percent_${targetCompanyId}` },
          update: { value: val },
          create: { key: `sla_warning_percent_${targetCompanyId}`, value: val, category: 'COMPANY' },
        })
      );
    }

    await Promise.all(updates);

    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export const POST = PUT;

