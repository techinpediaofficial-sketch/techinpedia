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

    const lists = await db.contactList.findMany({
      where: {
        ...(companyId && companyId !== 'master' ? { companyId } : {}),
      },
      include: {
        _count: { select: { members: true } },
      },
      orderBy: { updatedAt: 'desc' },
    });

    const enriched = lists.map((l) => ({
      ...l,
      memberCount: l._count.members,
    }));

    return NextResponse.json({ success: true, lists: enriched });
  } catch (error: any) {
    console.error('Fetch lists error:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch contact lists.' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireAuth();
    const body = await request.json();

    const { name, description, initialContactIds = [] } = body;
    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'List name is required.' }, { status: 400 });
    }

    const isTenant = session.isTenant;
    const companyId = isTenant && session.companyId ? session.companyId : body.companyId || null;

    const list = await db.contactList.create({
      data: {
        name: name.trim(),
        description: description || null,
        companyId,
      },
    });

    if (Array.isArray(initialContactIds) && initialContactIds.length > 0) {
      await db.contactListMember.createMany({
        data: initialContactIds.map((cId: string) => ({
          listId: list.id,
          contactId: cId,
        })),
        skipDuplicates: true,
      });
    }

    await logActivity({
      userId: session.userId,
      userEmail: session.email,
      action: 'CREATE_STATIC_CONTACT_LIST',
      entityType: 'ContactList',
      entityId: list.id,
      metadata: { name: list.name, memberCount: initialContactIds.length, companyId },
    });

    return NextResponse.json({
      success: true,
      list: { ...list, memberCount: initialContactIds.length },
    });
  } catch (error: any) {
    console.error('Create list error:', error);
    return NextResponse.json({ error: error.message || 'Failed to create contact list.' }, { status: 500 });
  }
}
