import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { requirePermission } from '@/lib/permissions';
import { handleApiAuthError } from '@/lib/auth-errors';

export async function GET() {
  try {
    const session = await requireAuth();
    requirePermission(session, 'crm.leads.view');

    const marketplaceBu = await db.businessUnit.findUnique({
      where: { code: 'MARKETPLACE' },
    });

    const buId = marketplaceBu?.id;

    // Conditions for marketplace leads
    const marketplaceFilter = {
      OR: [
        ...(buId ? [{ businessUnitId: buId }] : []),
        { source: { contains: 'Urban' } },
        { projectType: { in: ['B2B_RFQ', 'B2C_LOCAL_SERVICE', 'VENDOR_ONBOARDING'] } },
      ],
    };

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      totalMarketplaceLeads,
      leadsToday,
      b2cCount,
      b2bCount,
      vendorsCount,
      convertedCount,
      recentLeads,
    ] = await Promise.all([
      db.enquiry.count({
        where: {
          ...marketplaceFilter,
          projectType: { not: 'VENDOR_ONBOARDING' },
        },
      }),
      db.enquiry.count({
        where: {
          ...marketplaceFilter,
          createdAt: { gte: today },
          projectType: { not: 'VENDOR_ONBOARDING' },
        },
      }),
      db.enquiry.count({
        where: {
          ...marketplaceFilter,
          projectType: 'B2C_LOCAL_SERVICE',
        },
      }),
      db.enquiry.count({
        where: {
          ...marketplaceFilter,
          projectType: 'B2B_RFQ',
        },
      }),
      db.enquiry.count({
        where: {
          OR: [
            { projectType: 'VENDOR_ONBOARDING' },
            { source: 'Urban Vendor Onboarding' },
          ],
        },
      }),
      db.enquiry.count({
        where: {
          ...marketplaceFilter,
          status: 'WON',
        },
      }),
      db.enquiry.findMany({
        where: {
          ...marketplaceFilter,
          projectType: { not: 'VENDOR_ONBOARDING' },
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          city: true,
          service: true,
          projectType: true,
          status: true,
          score: true,
          createdAt: true,
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      metrics: {
        totalMarketplaceLeads,
        leadsToday,
        b2cCount,
        b2bCount,
        vendorsCount,
        convertedCount,
        conversionRate: totalMarketplaceLeads > 0
          ? ((convertedCount / totalMarketplaceLeads) * 100).toFixed(1)
          : '0.0',
      },
      recentLeads,
    });
  } catch (error: any) {
    const authResponse = handleApiAuthError(error);
    if (authResponse) return authResponse;
    console.error('Marketplace metrics API error:', error);
    return NextResponse.json({ error: 'Failed to fetch marketplace metrics.' }, { status: 500 });
  }
}
