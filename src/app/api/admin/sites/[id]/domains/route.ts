import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { requirePermission } from '@/lib/permissions';
import { handleApiAuthError } from '@/lib/auth-errors';
import { normalizeHostname } from '@/lib/site-context';

// PATCH /api/admin/sites/[id]/domains — add a domain alias to a site
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireAuth();
    requirePermission(session, 'admin.business_units.manage');

    const { id: siteId } = await params;
    const body = await request.json();
    const { hostname, isPrimary } = body;

    if (!hostname) {
      return NextResponse.json({ error: 'hostname is required.' }, { status: 400 });
    }

    const site = await db.site.findUnique({ where: { id: siteId } });
    if (!site) return NextResponse.json({ error: 'Site not found.' }, { status: 404 });

    const normalized = normalizeHostname(hostname);
    if (!normalized) {
      return NextResponse.json({ error: 'Invalid hostname.' }, { status: 400 });
    }

    // If marking as primary, demote existing primary
    if (isPrimary) {
      await db.siteDomain.updateMany({
        where: { siteId, isPrimary: true },
        data: { isPrimary: false },
      });
    }

    const siteDomain = await db.siteDomain.upsert({
      where: { hostname: normalized },
      update: { siteId, isPrimary: !!isPrimary, isActive: true },
      create: { siteId, hostname: normalized, isPrimary: !!isPrimary, isActive: true },
    });

    return NextResponse.json({ siteDomain }, { status: 201 });
  } catch (error: any) {
    const authResponse = handleApiAuthError(error);
    if (authResponse) return authResponse;
    console.error('Site domain add error:', error);
    return NextResponse.json({ error: 'Failed to add domain.' }, { status: 500 });
  }
}
