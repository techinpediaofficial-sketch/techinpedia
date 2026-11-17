import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { getRazorpayConfig } from '@/lib/razorpay';

export async function GET() {
  try {
    const session = await requireAuth();

    // Check if Super Admin or Admin
    if (!['SUPER_ADMIN', 'ADMIN'].includes(session.role)) {
      return NextResponse.json({ error: 'Unauthorized to view payment credentials.' }, { status: 403 });
    }

    const config = await getRazorpayConfig();

    const maskKey = (key: string) => {
      if (!key) return '';
      if (key.length <= 8) return '********';
      return `${key.substring(0, 8)}...${key.substring(key.length - 4)}`;
    };

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://techinpedia.com';
    const webhookUrl = `${siteUrl}/api/webhooks/razorpay`;

    return NextResponse.json({
      success: true,
      isConfigured: config.isConfigured,
      isTestMode: config.isTestMode,
      keyId: maskKey(config.keyId),
      hasSecret: Boolean(config.keySecret),
      hasWebhookSecret: Boolean(config.webhookSecret),
      webhookUrl,
    });
  } catch (error: any) {
    console.error('Settings Razorpay GET error:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch Razorpay settings' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireAuth();

    if (!['SUPER_ADMIN', 'ADMIN'].includes(session.role)) {
      return NextResponse.json({ error: 'Unauthorized to modify payment credentials.' }, { status: 403 });
    }

    const body = await request.json();
    const { keyId, keySecret, webhookSecret } = body;

    const upsertSetting = async (key: string, value: string) => {
      if (!value) return;
      await db.setting.upsert({
        where: { key },
        create: {
          key,
          value: value.trim(),
          category: 'COMPANY',
        },
        update: {
          value: value.trim(),
        },
      });
    };

    if (keyId) await upsertSetting('razorpay_key_id', keyId);
    if (keySecret) await upsertSetting('razorpay_key_secret', keySecret);
    if (webhookSecret) await upsertSetting('razorpay_webhook_secret', webhookSecret);

    // Audit log
    try {
      await db.activityLog.create({
        data: {
          action: 'RAZORPAY_CONFIG_UPDATED',
          userId: session.userId,
          userEmail: session.email,
          entityType: 'SystemSetting',
          entityId: 'razorpay',
        },
      });
    } catch {
      // Non-blocking
    }

    return NextResponse.json({
      success: true,
      message: 'Razorpay configuration saved successfully.',
    });
  } catch (error: any) {
    console.error('Settings Razorpay POST error:', error);
    return NextResponse.json({ error: error.message || 'Failed to update Razorpay settings' }, { status: 500 });
  }
}
