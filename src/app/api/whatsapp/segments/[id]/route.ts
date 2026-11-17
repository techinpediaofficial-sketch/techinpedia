import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { logActivity } from '@/lib/activity';
import { getMatchingContactsForSegment } from '@/lib/segments';

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth();
    const { id } = await context.params;

    const segment = await db.contactSegment.findUnique({ where: { id } });
    if (!segment) {
      return NextResponse.json({ error: 'Segment not found' }, { status: 404 });
    }

    if (session.isTenant && session.companyId && segment.companyId !== session.companyId) {
      return NextResponse.json({ error: 'Unauthorized: Cross-tenant segment access denied' }, { status: 403 });
    }

    const matchedContacts = await getMatchingContactsForSegment(segment.companyId, segment.rulesJson);

    return NextResponse.json({
      success: true,
      segment: {
        ...segment,
        contactCount: matchedContacts.length,
      },
      previewContacts: matchedContacts.slice(0, 50),
    });
  } catch (error: any) {
    console.error('Fetch segment detail error:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch segment detail.' }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth();
    const { id } = await context.params;
    const body = await request.json();

    const existing = await db.contactSegment.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Segment not found' }, { status: 404 });
    }

    if (session.isTenant && session.companyId && existing.companyId !== session.companyId) {
      return NextResponse.json({ error: 'Unauthorized: Cross-tenant modification denied' }, { status: 403 });
    }

    const { name, description, rules } = body;
    const dataToUpdate: any = {};
    if (name !== undefined) dataToUpdate.name = name.trim();
    if (description !== undefined) dataToUpdate.description = description;
    if (rules !== undefined) {
      dataToUpdate.rulesJson = typeof rules === 'object' ? JSON.stringify(rules) : rules;
    }

    const updated = await db.contactSegment.update({
      where: { id },
      data: dataToUpdate,
    });

    const matched = await getMatchingContactsForSegment(updated.companyId, updated.rulesJson);
    await db.contactSegment.update({
      where: { id },
      data: { contactCount: matched.length },
    });

    await logActivity({
      userId: session.userId,
      userEmail: session.email,
      action: 'UPDATE_SMART_SEGMENT',
      entityType: 'ContactSegment',
      entityId: id,
      metadata: { name: updated.name, newCount: matched.length },
    });

    return NextResponse.json({
      success: true,
      segment: { ...updated, contactCount: matched.length },
    });
  } catch (error: any) {
    console.error('Update segment error:', error);
    return NextResponse.json({ error: error.message || 'Failed to update segment.' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth();
    const { id } = await context.params;

    const existing = await db.contactSegment.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Segment not found' }, { status: 404 });
    }

    if (session.isTenant && session.companyId && existing.companyId !== session.companyId) {
      return NextResponse.json({ error: 'Unauthorized: Cross-tenant deletion denied' }, { status: 403 });
    }

    await db.contactSegment.delete({ where: { id } });

    await logActivity({
      userId: session.userId,
      userEmail: session.email,
      action: 'DELETE_SMART_SEGMENT',
      entityType: 'ContactSegment',
      entityId: id,
      metadata: { name: existing.name },
    });

    return NextResponse.json({ success: true, message: 'Segment deleted successfully.' });
  } catch (error: any) {
    console.error('Delete segment error:', error);
    return NextResponse.json({ error: error.message || 'Failed to delete segment.' }, { status: 500 });
  }
}
