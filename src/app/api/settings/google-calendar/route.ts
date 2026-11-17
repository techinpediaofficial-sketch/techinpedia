import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { getGoogleCalendarConfig } from '@/lib/googleCalendar';

export async function GET() {
  try {
    const session = await requireAuth();
    if (session.role !== 'SUPER_ADMIN' && session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const config = await getGoogleCalendarConfig();

    return NextResponse.json({
      success: true,
      config: {
        isConfigured: config.isConfigured,
        clientEmail: config.clientEmail
          ? `${config.clientEmail.slice(0, 5)}...${config.clientEmail.slice(-15)}`
          : '',
        calendarId: config.calendarId || 'primary',
        hasPrivateKey: Boolean(config.privateKey),
      },
    });
  } catch (error: any) {
    console.error('Error reading Google Calendar settings:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to read settings' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireAuth();
    if (session.role !== 'SUPER_ADMIN' && session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { clientEmail, privateKey, calendarId = 'primary' } = body;

    const upsertSetting = async (key: string, value: string) => {
      await db.setting.upsert({
        where: { key },
        update: { value, updatedAt: new Date() },
        create: {
          key,
          value,
          category: 'WEBSITE',
        },
      });
    };

    if (clientEmail !== undefined) {
      await upsertSetting('google_client_email', clientEmail.trim());
    }
    if (privateKey !== undefined) {
      await upsertSetting('google_private_key', privateKey.trim());
    }
    if (calendarId !== undefined) {
      await upsertSetting('google_calendar_id', calendarId.trim());
    }

    return NextResponse.json({
      success: true,
      message: 'Google Calendar credentials saved successfully',
    });
  } catch (error: any) {
    console.error('Error saving Google Calendar settings:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to save settings' },
      { status: 500 }
    );
  }
}
