import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { requirePermission } from '@/lib/permissions';
import { handleApiAuthError } from '@/lib/auth-errors';

export async function GET() {
  try {
    const session = await requireAuth();
    requirePermission(session, 'admin.business_units.manage');

    const sites = await db.site.findMany({
      orderBy: { createdAt: 'asc' },
      include: {
        businessUnit: { select: { id: true, code: true, name: true } },
        domains: { orderBy: { isPrimary: 'desc' } },
        _count: { select: { enquiries: true } },
      },
    });

    return NextResponse.json({ sites });
  } catch (error: any) {
    const authResponse = handleApiAuthError(error);
    if (authResponse) return authResponse;
    console.error('Sites fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch sites.' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireAuth();
    requirePermission(session, 'admin.business_units.manage');

    const body = await request.json();
    const { code, name, type, businessUnitId, domain } = body;

    if (!code || !name || !type || !domain) {
      return NextResponse.json({ error: 'code, name, type, and domain are required.' }, { status: 400 });
    }

    // If BU provided, validate it
    if (businessUnitId) {
      const bu = await db.businessUnit.findUnique({ where: { id: businessUnitId } });
      if (!bu || !bu.isActive) {
        return NextResponse.json({ error: 'Invalid or inactive Business Unit.' }, { status: 400 });
      }
    }

    const site = await db.site.create({
      data: {
        code: code.toUpperCase().trim(),
        name: name.trim(),
        type,
        domain: domain.trim(),
        businessUnitId: businessUnitId || null,
        isPrimary: false,
      },
    });

    // Auto-create primary SiteDomain entry
    await db.siteDomain.create({
      data: {
        siteId: site.id,
        hostname: domain.trim().toLowerCase(),
        isPrimary: true,
        isActive: true,
      },
    });

    return NextResponse.json({ site }, { status: 201 });
  } catch (error: any) {
    const authResponse = handleApiAuthError(error);
    if (authResponse) return authResponse;
    console.error('Site create error:', error);
    return NextResponse.json({ error: 'Failed to create site.' }, { status: 500 });
  }
}
