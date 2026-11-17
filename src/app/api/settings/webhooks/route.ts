import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { logActivity } from '@/lib/activity';
import crypto from 'crypto';

export async function GET() {
  try {
    await requireAuth();

    const subscriptions = await db.webhookSubscription.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        deliveries: {
          orderBy: { deliveredAt: 'desc' },
          take: 5,
        },
      },
    });

    const activeCount = subscriptions.filter(s => s.isActive).length;
    const totalDeliveries = subscriptions.reduce((acc, s) => acc + s.deliveries.length, 0);

    return NextResponse.json({
      success: true,
      subscriptions,
      metrics: {
        total: subscriptions.length,
        active: activeCount,
        deliveries: totalDeliveries,
      },
    });
  } catch (error) {
    console.error('Fetch webhooks error:', error);
    return NextResponse.json({ error: 'Failed to fetch webhooks.' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireAuth();
    const body = await request.json();
    const { action, subscriptionId, url, event } = body;

    // Test dispatch simulation
    if (action === 'TEST_DISPATCH' && subscriptionId) {
      const sub = await db.webhookSubscription.findUnique({ where: { id: subscriptionId } });
      if (!sub) {
        return NextResponse.json({ error: 'Webhook subscription not found.' }, { status: 404 });
      }

      const testPayload = JSON.stringify({
        event: sub.event,
        timestamp: new Date().toISOString(),
        test: true,
        data: {
          id: 'test_record_123',
          message: 'TechInPedia Business OS Webhook Verification Ping',
        },
      });

      // Compute HMAC-SHA256 signature
      const signature = crypto
        .createHmac('sha256', sub.secretKey)
        .update(testPayload)
        .digest('hex');

      let responseCode = 200;
      let responseBody = 'Simulated Delivery Successful';
      let status = 'DELIVERED';

      // Attempt outbound fetch if url is public https
      if (sub.url.startsWith('http')) {
        try {
          const res = await fetch(sub.url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-TechInPedia-Signature': signature,
              'X-TechInPedia-Event': sub.event,
            },
            body: testPayload,
          });
          responseCode = res.status;
          responseBody = await res.text();
          status = res.ok ? 'DELIVERED' : 'FAILED';
        } catch (fetchErr: any) {
          responseCode = 502;
          responseBody = fetchErr.message || 'Connection Refused';
          status = 'FAILED';
        }
      }

      const log = await db.webhookDeliveryLog.create({
        data: {
          subscriptionId: sub.id,
          event: sub.event,
          payload: testPayload,
          responseCode,
          responseBody: responseBody.slice(0, 500),
          status,
        },
      });

      return NextResponse.json({ success: true, delivery: log });
    }

    if (!url || !event) {
      return NextResponse.json({ error: 'Target URL and event type are required.' }, { status: 400 });
    }

    const secretKey = `whsec_${crypto.randomBytes(24).toString('hex')}`;

    const subscription = await db.webhookSubscription.create({
      data: {
        url,
        event,
        secretKey,
        isActive: true,
      },
    });

    await logActivity({
      userId: session.userId,
      action: 'CREATE',
      entityType: 'WEBHOOK_SUBSCRIPTION',
      entityId: subscription.id,
      details: `Created webhook subscription for ${event} -> ${url}`,
    });

    return NextResponse.json({ success: true, subscription });
  } catch (error) {
    console.error('Create webhook error:', error);
    return NextResponse.json({ error: 'Failed to create webhook.' }, { status: 500 });
  }
}
