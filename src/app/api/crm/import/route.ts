import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { requirePermission } from '@/lib/permissions';
import { handleApiAuthError } from '@/lib/auth-errors';
import { processSheetRowsIntoLeads } from '@/lib/google_sheets';
import { resolveCompanySiteContext } from '@/lib/site-context';
import { db } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const session = await requireAuth();
    requirePermission(session, 'crm.leads.create');

    const body = await request.json();
    const { rows, mapping, duplicateStrategy, sourceName, businessUnitId } = body;

    if (!Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json({ error: 'No rows provided for import.' }, { status: 400 });
    }
    if (!mapping || !mapping.nameCol || !mapping.emailCol) {
      return NextResponse.json({ error: 'Name and Email column mappings are required.' }, { status: 400 });
    }

    // PHASE 1.1: Resolve trusted Business Unit context.
    // If a businessUnitId is provided by the admin in the request, validate it.
    // Do NOT blindly trust arbitrary body values — verify it's in the session's accessible units.
    let resolvedBusinessUnitId: string;
    let resolvedSiteId: string | null = null;

    if (businessUnitId) {
      // Validate the BU is accessible and real
      const bu = await db.businessUnit.findUnique({ where: { id: businessUnitId } });
      if (!bu || !bu.isActive) {
        return NextResponse.json({ error: 'Invalid or inactive Business Unit specified.' }, { status: 400 });
      }

      const accessibleUnits = session.businessUnitIds || [];
      const isSuperAdmin = session.role === 'SUPER_ADMIN';
      if (!isSuperAdmin && !accessibleUnits.includes(businessUnitId)) {
        return NextResponse.json({ error: 'Forbidden: Access to specified Business Unit denied.' }, { status: 403 });
      }

      resolvedBusinessUnitId = businessUnitId;

      // Find associated primary site
      const site = await db.site.findFirst({ where: { businessUnitId, isPrimary: true, isActive: true } });
      resolvedSiteId = site?.id || null;
    } else {
      // Default to COMPANY_SERVICES for backward compat when no BU specified
      const ctx = await resolveCompanySiteContext();
      if (!ctx.businessUnitId) {
        return NextResponse.json({ error: 'Could not resolve Business Unit. Run the site domain backfill first.' }, { status: 500 });
      }
      resolvedBusinessUnitId = ctx.businessUnitId;
      resolvedSiteId = ctx.siteId;
    }

    const report = await processSheetRowsIntoLeads({
      rows,
      mapping,
      duplicateStrategy: duplicateStrategy || 'SKIP',
      sourceName: sourceName || 'Batch Import',
      businessUnitId: resolvedBusinessUnitId,
      siteId: resolvedSiteId,
    });

    return NextResponse.json({ success: true, report });
  } catch (error: any) {
    const authResponse = handleApiAuthError(error);
    if (authResponse) return authResponse;

    console.error('Lead import error:', error);
    return NextResponse.json({ error: error.message || 'Import failed.' }, { status: 500 });
  }
}
