import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { hasPermission } from '@/lib/permissions';
import { setPhoneSuppression } from '@/lib/whatsapp_suppression';

// 1. GET: List All Suppressions / Opt-Outs
export async function GET(request: Request) {
  try {
    const session = await getSession();
    if (!session || (!hasPermission(session, 'whatsapp.suppression.manage') && !hasPermission(session, 'whatsapp.view'))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');

    const rawCompanyId = searchParams.get('companyId');
    const targetCompanyId = session.isTenant || session.companyId
      ? session.companyId
      : (rawCompanyId && rawCompanyId !== 'master' && rawCompanyId !== 'ALL' ? rawCompanyId : null);

    const where: any = {};
    if (targetCompanyId !== 'ALL') where.companyId = targetCompanyId || null;
    if (search) {
      where.OR = [
        { phone: { contains: search } },
        { reason: { contains: search } },
        { notes: { contains: search } },
      ];
    }

    const suppressions = await db.whatsappSuppression.findMany({
      where,
      orderBy: { optedOutAt: 'desc' },
    });

    return NextResponse.json({ suppressions });
  } catch (error: any) {
    console.error('Suppression GET error:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch suppressions' }, { status: 500 });
  }
}

// 2. POST: Add or Modify Suppression Record
export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session || !hasPermission(session, 'whatsapp.suppression.manage')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { phone, status = 'OPTED_OUT', reason = 'ADMIN_MANUAL', notes } = body;

    if (!phone) {
      return NextResponse.json({ error: 'Phone number is required' }, { status: 400 });
    }

    const record = await setPhoneSuppression(phone, status, reason, notes);

    await db.activityLog.create({
      data: {
        userId: session.userId,
        userEmail: session.email,
        action: `WHATSAPP_SUPPRESSION_${status}`,
        entityType: 'WhatsAppSuppression',
        entityId: record.id,
        metadata: JSON.stringify({ phone: record.phone, reason }),
      },
    });

    return NextResponse.json({ success: true, record });
  } catch (error: any) {
    console.error('Suppression POST error:', error);
    return NextResponse.json({ error: error.message || 'Failed to update suppression' }, { status: 500 });
  }
}

// 3. DELETE: Remove Number from Suppression List
export async function DELETE(request: Request) {
  try {
    const session = await getSession();
    if (!session || !hasPermission(session, 'whatsapp.suppression.manage')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    await db.whatsappSuppression.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: 'Number removed from suppression list.' });
  } catch (error: any) {
    console.error('Suppression DELETE error:', error);
    return NextResponse.json({ error: error.message || 'Failed to remove suppression' }, { status: 500 });
  }
}
