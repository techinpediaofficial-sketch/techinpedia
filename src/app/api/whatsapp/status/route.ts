import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { getWhatsAppConfig } from '@/lib/whatsapp_cloud';

export async function GET() {
  try {
    await requireAuth();
    const { configured, missing } = await getWhatsAppConfig();
    return NextResponse.json({ configured, missing });
  } catch (error) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}
