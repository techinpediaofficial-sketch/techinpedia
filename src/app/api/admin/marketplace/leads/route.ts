import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { requirePermission } from '@/lib/permissions';
import { handleApiAuthError } from '@/lib/auth-errors';

export async function GET(request: Request) {
  try {
    const session = await requireAuth();
    requirePermission(session, 'crm.leads.view');

    const url = new URL(request.url);
    const search = url.searchParams.get('search') || '';
    const mode = url.searchParams.get('mode') || 'ALL'; // B2C, B2B, ALL
    const status = url.searchParams.get('status') || '';
    const city = url.searchParams.get('city') || '';
    const page = parseInt(url.searchParams.get('page') || '1', 10);
    const limit = parseInt(url.searchParams.get('limit') || '25', 10);
    const skip = (page - 1) * limit;

    const marketplaceBu = await db.businessUnit.findUnique({
      where: { code: 'MARKETPLACE' },
    });
    const buId = marketplaceBu?.id;

    const where: any = {
      AND: [
        {
          OR: [
            ...(buId ? [{ businessUnitId: buId }] : []),
            { source: { contains: 'Urban' } },
            { projectType: { in: ['B2B_RFQ', 'B2C_LOCAL_SERVICE'] } },
          ],
        },
        {
          projectType: { not: 'VENDOR_ONBOARDING' },
        },
      ],
    };

    if (mode === 'B2C') {
      where.AND.push({ projectType: 'B2C_LOCAL_SERVICE' });
    } else if (mode === 'B2B') {
      where.AND.push({ projectType: 'B2B_RFQ' });
    }

    if (status) {
      where.AND.push({ status });
    }

    if (city) {
      where.AND.push({ city: { contains: city } });
    }

    if (search.trim()) {
      where.AND.push({
        OR: [
          { name: { contains: search } },
          { email: { contains: search } },
          { phone: { contains: search } },
          { service: { contains: search } },
          { city: { contains: search } },
          { message: { contains: search } },
        ],
      });
    }

    const [total, leads] = await Promise.all([
      db.enquiry.count({ where }),
      db.enquiry.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          assignedEmployee: {
            select: {
              id: true,
              name: true,
              companyEmail: true,
            },
          },
          notes: {
            orderBy: { createdAt: 'desc' },
            take: 2,
          },
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      leads,
    });
  } catch (error: any) {
    const authResponse = handleApiAuthError(error);
    if (authResponse) return authResponse;
    console.error('Marketplace leads API error:', error);
    return NextResponse.json({ error: 'Failed to fetch marketplace leads.' }, { status: 500 });
  }
}
