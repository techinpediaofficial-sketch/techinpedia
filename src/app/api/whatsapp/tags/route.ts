import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { logActivity } from '@/lib/activity';

export async function GET(request: Request) {
  try {
    const session = await requireAuth();
    const { searchParams } = new URL(request.url);

    const isTenant = session.isTenant;
    const requestedCompanyId = searchParams.get('companyId');
    const companyId = isTenant && session.companyId ? session.companyId : requestedCompanyId || undefined;

    const tags = await db.tag.findMany({
      where: {
        OR: [
          { companyId: companyId || null },
          { companyId: null }, // Global system tags
        ],
      },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json({ success: true, tags });
  } catch (error: any) {
    console.error('Fetch tags error:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch tags.' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireAuth();
    const body = await request.json();

    const { name, color = '#802ee3' } = body;
    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Tag name is required.' }, { status: 400 });
    }

    const isTenant = session.isTenant;
    const companyId = isTenant && session.companyId ? session.companyId : body.companyId || null;
    const cleanName = name.trim();

    const tag = await db.tag.upsert({
      where: { name: cleanName },
      update: { color, companyId },
      create: { name: cleanName, color, companyId },
    });

    await logActivity({
      userId: session.userId,
      userEmail: session.email,
      action: 'UPSERT_TAG',
      entityType: 'Tag',
      entityId: tag.id,
      metadata: { name: tag.name, color: tag.color, companyId },
    });

    return NextResponse.json({ success: true, tag });
  } catch (error: any) {
    console.error('Create tag error:', error);
    return NextResponse.json({ error: error.message || 'Failed to create tag.' }, { status: 500 });
  }
}
