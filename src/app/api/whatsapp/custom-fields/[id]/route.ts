import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { logActivity } from '@/lib/activity';

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth();
    const { id } = await context.params;

    const existing = await db.contactCustomField.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Custom field not found' }, { status: 404 });
    }

    if (session.isTenant && session.companyId && existing.companyId !== session.companyId) {
      return NextResponse.json({ error: 'Unauthorized: Cross-tenant modification denied' }, { status: 403 });
    }

    await db.contactCustomField.delete({ where: { id } });

    await logActivity({
      userId: session.userId,
      userEmail: session.email,
      action: 'DELETE_CUSTOM_FIELD',
      entityType: 'ContactCustomField',
      entityId: id,
      metadata: { name: existing.name, key: existing.fieldKey },
    });

    return NextResponse.json({ success: true, message: 'Custom field deleted successfully.' });
  } catch (error: any) {
    console.error('Delete custom field error:', error);
    return NextResponse.json({ error: error.message || 'Failed to delete custom field.' }, { status: 500 });
  }
}
