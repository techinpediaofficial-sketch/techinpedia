import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { db } from '@/lib/db';
import { sendWhatsAppTextMessage } from '@/lib/whatsapp_service';

export async function POST(request: Request) {
  try {
    const session = await requireAuth();
    const body = await request.json();
    const { to, message, companyId } = body;

    if (!to || !message) {
      return NextResponse.json({ error: 'Recipient phone and message are required' }, { status: 400 });
    }

    const url = new URL(request.url);
    const queryCompanyId = url.searchParams.get('companyId');
    const rawCompanyId = companyId || queryCompanyId;

    const targetCompanyId = session.isTenant || session.companyId
      ? session.companyId
      : (rawCompanyId && rawCompanyId !== 'master' && rawCompanyId !== 'ALL' ? rawCompanyId : null);

    const activeConn = await db.whatsappConnection.findFirst({
      where: { isActive: true, companyId: targetCompanyId || null },
      select: { displayName: true, businessPhoneNumber: true, companyId: true, wabaId: true },
    });

    const result = await sendWhatsAppTextMessage(to, message, {
      companyId: targetCompanyId,
      senderUserId: session.userId,
    });

    if (!result.success && (result.error?.includes('131030') || result.error?.toLowerCase().includes('not in allowed list'))) {
      return NextResponse.json({
        ...result,
        sender: {
          displayName: activeConn?.displayName || (targetCompanyId ? 'Tenant Account' : 'Abdiel Aircon'),
          phone: activeConn?.businessPhoneNumber,
          companyId: targetCompanyId,
        },
        hint: `Meta App is in Development Mode: Phone number ${to} must be added to your Meta allowed recipients list. Go to developers.facebook.com → Your App → WhatsApp → API Setup → 'To' dropdown → 'Manage phone number list' to add and verify OTP.`,
      });
    }

    return NextResponse.json({
      ...result,
      sender: {
        displayName: activeConn?.displayName || (targetCompanyId ? 'Tenant Account' : 'Abdiel Aircon'),
        phone: activeConn?.businessPhoneNumber,
        companyId: targetCompanyId,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Unauthorized' }, { status: 500 });
  }
}

