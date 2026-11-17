import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { logActivity } from '@/lib/activity';
import { normalizePhoneNumber } from '@/lib/whatsapp-eligibility';

export async function GET(request: Request) {
  try {
    const session = await requireAuth();
    const { searchParams } = new URL(request.url);

    const isTenant = session.isTenant;
    const requestedCompanyId = searchParams.get('companyId');
    const companyId = isTenant && session.companyId ? session.companyId : requestedCompanyId || undefined;

    const search = searchParams.get('search')?.trim() || '';

    const where: any = {};
    if (companyId && companyId !== 'master') {
      where.OR = [
        { companyId },
        { companyId: null },
      ];
    }
    if (search) {
      where.phone = { contains: search };
    }

    const items = await db.whatsappSuppression.findMany({
      where,
      orderBy: { optedOutAt: 'desc' },
      take: 200,
    });

    return NextResponse.json({ success: true, items });
  } catch (error: any) {
    console.error('Fetch blacklist error:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch blacklist.' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireAuth();
    const body = await request.json();

    const { phone, reason = 'USER_REQUEST', source = 'ADMIN_MANUAL', notes } = body;
    if (!phone || !phone.trim()) {
      return NextResponse.json({ error: 'Phone number is required.' }, { status: 400 });
    }

    const canonicalPhone = normalizePhoneNumber(phone);
    const isTenant = session.isTenant;
    const companyId = isTenant && session.companyId ? session.companyId : body.companyId || null;

    const item = await db.whatsappSuppression.upsert({
      where: { phone: canonicalPhone },
      update: {
        status: 'OPTED_OUT',
        reason,
        source,
        notes,
        companyId,
        optedOutAt: new Date(),
        addedById: session.userId,
      },
      create: {
        phone: canonicalPhone,
        status: 'OPTED_OUT',
        reason,
        source,
        notes,
        companyId,
        addedById: session.userId,
      },
    });

    // Mark matching contact in CRM as blacklisted and opted out
    const last10 = canonicalPhone.slice(-10);
    await db.contact.updateMany({
      where: {
        phone: { contains: last10 },
        ...(companyId ? { companyId } : {}),
      },
      data: {
        isBlacklisted: true,
        optInStatus: 'OPTED_OUT',
        marketingOptIn: false,
        optOutReason: reason,
        optOutTimestamp: new Date(),
      },
    });

    await logActivity({
      userId: session.userId,
      userEmail: session.email,
      action: 'ADD_TO_BLACKLIST',
      entityType: 'WhatsappSuppression',
      entityId: item.id,
      metadata: { phone: canonicalPhone, reason, companyId },
    });

    return NextResponse.json({ success: true, item });
  } catch (error: any) {
    console.error('Add to blacklist error:', error);
    return NextResponse.json({ error: error.message || 'Failed to add number to blacklist.' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await requireAuth();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const phone = searchParams.get('phone');

    if (!id && !phone) {
      return NextResponse.json({ error: 'ID or phone number is required.' }, { status: 400 });
    }

    const where: any = {};
    if (id) where.id = id;
    else if (phone) where.phone = normalizePhoneNumber(phone);

    const existing = await db.whatsappSuppression.findFirst({ where });
    if (!existing) {
      return NextResponse.json({ error: 'Suppression record not found.' }, { status: 404 });
    }

    // Tenant check
    if (session.isTenant && session.companyId && existing.companyId && existing.companyId !== session.companyId) {
      return NextResponse.json({ error: 'Unauthorized: Cross-tenant modification denied' }, { status: 403 });
    }

    await db.whatsappSuppression.delete({ where: { id: existing.id } });

    // Unmark matching contact
    const last10 = existing.phone.slice(-10);
    await db.contact.updateMany({
      where: {
        phone: { contains: last10 },
        ...(existing.companyId ? { companyId: existing.companyId } : {}),
      },
      data: {
        isBlacklisted: false,
        optInStatus: 'OPTED_IN',
        marketingOptIn: true,
      },
    });

    await logActivity({
      userId: session.userId,
      userEmail: session.email,
      action: 'REMOVE_FROM_BLACKLIST',
      entityType: 'WhatsappSuppression',
      entityId: existing.id,
      metadata: { phone: existing.phone },
    });

    return NextResponse.json({ success: true, message: 'Removed from blacklist successfully.' });
  } catch (error: any) {
    console.error('Remove from blacklist error:', error);
    return NextResponse.json({ error: error.message || 'Failed to remove from blacklist.' }, { status: 500 });
  }
}
