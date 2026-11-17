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

    const fields = await db.contactCustomField.findMany({
      where: {
        OR: [
          { companyId: companyId || null },
          { companyId: null },
        ],
      },
      orderBy: { createdAt: 'asc' },
    });

    return NextResponse.json({ success: true, fields });
  } catch (error: any) {
    console.error('Fetch custom fields error:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch custom fields.' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireAuth();
    const body = await request.json();

    const { name, fieldKey, fieldType = 'TEXT', options, isRequired = false } = body;
    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Field name is required.' }, { status: 400 });
    }

    const key = (fieldKey || name).toLowerCase().replace(/[^a-z0-9_]/g, '_').trim();
    const isTenant = session.isTenant;
    const companyId = isTenant && session.companyId ? session.companyId : body.companyId || null;

    const field = await db.contactCustomField.create({
      data: {
        name: name.trim(),
        fieldKey: key,
        fieldType,
        options: Array.isArray(options) ? JSON.stringify(options) : options || null,
        isRequired: !!isRequired,
        companyId,
      },
    });

    await logActivity({
      userId: session.userId,
      userEmail: session.email,
      action: 'CREATE_CUSTOM_FIELD',
      entityType: 'ContactCustomField',
      entityId: field.id,
      metadata: { name: field.name, key: field.fieldKey, fieldType, companyId },
    });

    return NextResponse.json({ success: true, field });
  } catch (error: any) {
    console.error('Create custom field error:', error);
    return NextResponse.json({ error: error.message || 'Failed to create custom field.' }, { status: 500 });
  }
}
