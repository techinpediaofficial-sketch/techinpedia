import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { logActivity } from '@/lib/activity';
import { getMatchingContactsForSegment } from '@/lib/segments';

export async function GET(request: Request) {
  try {
    const session = await requireAuth();
    const { searchParams } = new URL(request.url);

    const isTenant = session.isTenant;
    const requestedCompanyId = searchParams.get('companyId');
    const companyId = isTenant && session.companyId ? session.companyId : requestedCompanyId || undefined;

    const segments = await db.contactSegment.findMany({
      where: {
        ...(companyId && companyId !== 'master' ? { companyId } : {}),
      },
      orderBy: { updatedAt: 'desc' },
    });

    // Optionally calculate dynamic count for each segment
    const enriched = await Promise.all(
      segments.map(async (seg) => {
        try {
          const matched = await getMatchingContactsForSegment(seg.companyId, seg.rulesJson);
          return {
            ...seg,
            contactCount: matched.length,
          };
        } catch {
          return seg;
        }
      })
    );

    return NextResponse.json({ success: true, segments: enriched });
  } catch (error: any) {
    console.error('Fetch segments error:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch segments.' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireAuth();
    const body = await request.json();

    const { name, description, rules } = body;
    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Segment name is required.' }, { status: 400 });
    }

    const isTenant = session.isTenant;
    const companyId = isTenant && session.companyId ? session.companyId : body.companyId || null;
    const rulesJson = typeof rules === 'object' ? JSON.stringify(rules) : rules || '{"groups":[]}';

    // Calculate initial matched count
    const matched = await getMatchingContactsForSegment(companyId, rulesJson);

    const segment = await db.contactSegment.create({
      data: {
        name: name.trim(),
        description: description || null,
        rulesJson,
        isDynamic: true,
        contactCount: matched.length,
        companyId,
      },
    });

    await logActivity({
      userId: session.userId,
      userEmail: session.email,
      action: 'CREATE_SMART_SEGMENT',
      entityType: 'ContactSegment',
      entityId: segment.id,
      metadata: { name: segment.name, initialCount: matched.length, companyId },
    });

    return NextResponse.json({ success: true, segment: { ...segment, contactCount: matched.length } });
  } catch (error: any) {
    console.error('Create segment error:', error);
    return NextResponse.json({ error: error.message || 'Failed to create segment.' }, { status: 500 });
  }
}
