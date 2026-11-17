import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { logActivity } from '@/lib/activity';

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth();
    const { id } = await context.params;
    const body = await request.json();

    const { contactIds = [], action = 'ADD' } = body; // action: 'ADD' | 'REMOVE'
    if (!Array.isArray(contactIds) || contactIds.length === 0) {
      return NextResponse.json({ error: 'No contact IDs provided.' }, { status: 400 });
    }

    const list = await db.contactList.findUnique({ where: { id } });
    if (!list) {
      return NextResponse.json({ error: 'Contact list not found' }, { status: 404 });
    }

    if (session.isTenant && session.companyId && list.companyId !== session.companyId) {
      return NextResponse.json({ error: 'Unauthorized: Cross-tenant list access denied' }, { status: 403 });
    }

    if (action === 'ADD') {
      await db.contactListMember.createMany({
        data: contactIds.map((cId: string) => ({
          listId: id,
          contactId: cId,
        })),
        skipDuplicates: true,
      });
    } else {
      await db.contactListMember.deleteMany({
        where: {
          listId: id,
          contactId: { in: contactIds },
        },
      });
    }

    const count = await db.contactListMember.count({ where: { listId: id } });

    await logActivity({
      userId: session.userId,
      userEmail: session.email,
      action: action === 'ADD' ? 'ADD_LIST_MEMBERS' : 'REMOVE_LIST_MEMBERS',
      entityType: 'ContactList',
      entityId: id,
      metadata: { count: contactIds.length, totalMembers: count },
    });

    return NextResponse.json({ success: true, action, memberCount: count });
  } catch (error: any) {
    console.error('List members error:', error);
    return NextResponse.json({ error: error.message || 'Failed to update list members.' }, { status: 500 });
  }
}
