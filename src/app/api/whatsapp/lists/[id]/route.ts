import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { logActivity } from '@/lib/activity';

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth();
    const { id } = await context.params;

    const list = await db.contactList.findUnique({
      where: { id },
      include: {
        members: {
          include: {
            contact: {
              select: {
                id: true,
                name: true,
                phone: true,
                email: true,
                leadStatus: true,
                tags: true,
                optInStatus: true,
                marketingOptIn: true,
                isBlacklisted: true,
              },
            },
          },
          take: 100,
        },
        _count: { select: { members: true } },
      },
    });

    if (!list) {
      return NextResponse.json({ error: 'Contact list not found' }, { status: 404 });
    }

    if (session.isTenant && session.companyId && list.companyId !== session.companyId) {
      return NextResponse.json({ error: 'Unauthorized: Cross-tenant list access denied' }, { status: 403 });
    }

    return NextResponse.json({
      success: true,
      list: {
        ...list,
        memberCount: list._count.members,
        contacts: list.members.map((m) => m.contact),
      },
    });
  } catch (error: any) {
    console.error('Fetch list error:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch contact list.' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth();
    const { id } = await context.params;

    const existing = await db.contactList.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Contact list not found' }, { status: 404 });
    }

    if (session.isTenant && session.companyId && existing.companyId !== session.companyId) {
      return NextResponse.json({ error: 'Unauthorized: Cross-tenant deletion denied' }, { status: 403 });
    }

    await db.contactList.delete({ where: { id } });

    await logActivity({
      userId: session.userId,
      userEmail: session.email,
      action: 'DELETE_STATIC_CONTACT_LIST',
      entityType: 'ContactList',
      entityId: id,
      metadata: { name: existing.name },
    });

    return NextResponse.json({ success: true, message: 'Contact list deleted successfully.' });
  } catch (error: any) {
    console.error('Delete list error:', error);
    return NextResponse.json({ error: error.message || 'Failed to delete contact list.' }, { status: 500 });
  }
}
