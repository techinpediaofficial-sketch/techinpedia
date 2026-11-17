import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { hasPermission } from '@/lib/permissions';

// 1. GET: Fetch Webhook Event Audit Logs
export async function GET(request: Request) {
  try {
    const session = await getSession();
    if (!session || !hasPermission(session, 'whatsapp.logs.view')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const eventType = searchParams.get('eventType');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const skip = (page - 1) * limit;
    const rawCompanyId = searchParams.get('companyId');
    const targetCompanyId = session.isTenant || session.companyId
      ? session.companyId
      : (rawCompanyId && rawCompanyId !== 'master' && rawCompanyId !== 'ALL' ? rawCompanyId : null);

    const where: any = {};
    if (targetCompanyId !== 'ALL') where.companyId = targetCompanyId || null;
    if (status && status !== 'ALL') where.status = status;
    if (eventType && eventType !== 'ALL') where.eventType = eventType;
    if (search) {
      where.OR = [
        { metaEventId: { contains: search } },
        { fromPhone: { contains: search } },
        { error: { contains: search } },
      ];
    }

    const [logs, total] = await Promise.all([
      db.whatsappWebhookEvent.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      db.whatsappWebhookEvent.count({ where }),
    ]);

    return NextResponse.json({
      logs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error('Webhook logs GET error:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch webhook logs' }, { status: 500 });
  }
}

// 2. POST: Safe Retry Execution for a Failed Event
export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session || !hasPermission(session, 'whatsapp.configure')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { eventId } = await request.json();
    if (!eventId) {
      return NextResponse.json({ error: 'Event ID is required' }, { status: 400 });
    }

    const event = await db.whatsappWebhookEvent.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      return NextResponse.json({ error: 'Webhook event not found' }, { status: 404 });
    }

    // Increment retry count and reset status to PENDING
    await db.whatsappWebhookEvent.update({
      where: { id: eventId },
      data: {
        status: 'PENDING',
        retryCount: { increment: 1 },
        error: null,
      },
    });

    // Re-dispatch internal POST to webhook processor
    const webhookUrl = new URL('/api/whatsapp/webhook', request.url);
    const retryRes = await fetch(webhookUrl.toString(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: event.payload,
    });

    const result = await retryRes.json();
    return NextResponse.json({
      success: true,
      message: 'Webhook retry triggered successfully',
      result,
    });
  } catch (error: any) {
    console.error('Webhook retry error:', error);
    return NextResponse.json({ error: error.message || 'Failed to retry webhook' }, { status: 500 });
  }
}
