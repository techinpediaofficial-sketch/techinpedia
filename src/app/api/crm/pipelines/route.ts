import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    await requireAuth();
    const { searchParams } = new URL(request.url);
    const includeDeals = searchParams.get('includeDeals') === 'true';

    const pipelines = await db.pipeline.findMany({
      orderBy: { createdAt: 'asc' },
      include: {
        stages: {
          orderBy: { order: 'asc' },
          include: includeDeals
            ? {
                deals: {
                  orderBy: { updatedAt: 'desc' },
                  include: {
                    customer: { select: { id: true, name: true } },
                    company: { select: { id: true, name: true } },
                  },
                },
              }
            : undefined,
        },
      },
    });

    return NextResponse.json({ success: true, pipelines });
  } catch (error) {
    console.error('Fetch pipelines error:', error);
    return NextResponse.json({ error: 'Failed to fetch pipelines.' }, { status: 500 });
  }
}
