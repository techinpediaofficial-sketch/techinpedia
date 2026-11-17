import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';

const LEGAL_KEYS = ['LEGAL_PRIVACY_POLICY', 'LEGAL_TERMS_OF_SERVICE', 'LEGAL_REFUND_POLICY'];

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const settings = await db.setting.findMany({
      where: {
        key: {
          in: LEGAL_KEYS,
        },
      },
    });

    const config = {
      LEGAL_PRIVACY_POLICY: '',
      LEGAL_TERMS_OF_SERVICE: '',
      LEGAL_REFUND_POLICY: '',
    };

    settings.forEach((s) => {
      if (s.key in config) {
        (config as any)[s.key] = s.value;
      }
    });

    return NextResponse.json({ config });
  } catch (error: any) {
    console.error('Error fetching legal settings:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    // Note: Assuming SUPER_ADMIN or ADMIN role check is handled or implicit if they can access the page.

    const body = await request.json();
    const { key, value } = body;

    if (!key || !LEGAL_KEYS.includes(key)) {
      return NextResponse.json({ error: 'Invalid setting key' }, { status: 400 });
    }

    // Upsert the setting
    const updated = await db.setting.upsert({
      where: { key },
      update: { value, category: 'COMPANY' },
      create: { key, value, category: 'COMPANY' },
    });

    return NextResponse.json({ success: true, setting: updated });
  } catch (error: any) {
    console.error('Error updating legal setting:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
