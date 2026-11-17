import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';
import { requireRole } from '@/lib/auth';
import { logActivity } from '@/lib/activity';
import { Role, SettingCategory } from '@prisma/client';

export async function GET() {
  try {
    const settings = await db.setting.findMany();
    const map: Record<string, string> = {};
    settings.forEach((s: { key: string; value: string }) => {
      map[s.key] = s.value;
    });
    return NextResponse.json({ settings: map, raw: settings });
  } catch (error) {
    console.error('Fetch settings error:', error);
    return NextResponse.json({ error: 'Failed to fetch settings.' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const session = await requireRole([Role.SUPER_ADMIN, Role.ADMIN]);
    const rawBody = await request.json();
    if (typeof rawBody !== 'object' || rawBody === null) {
      return NextResponse.json({ error: 'Invalid settings payload format.' }, { status: 400 });
    }

    const payload: Record<string, any> =
      rawBody.settings && typeof rawBody.settings === 'object' && !Array.isArray(rawBody.settings)
        ? { ...rawBody.settings }
        : { ...rawBody };

    // Maintain backwards compatibility: sync first primary phone to company_phone
    if (payload.company_phones) {
      try {
        const phones = JSON.parse(payload.company_phones);
        if (Array.isArray(phones) && phones.length > 0) {
          const primary = phones.find((p: any) => p.isPrimary) || phones[0];
          if (primary && primary.number) {
            payload.company_phone = primary.number;
          }
        }
      } catch {
        // ignore parse failure
      }
    }

    // Maintain backwards compatibility: sync first primary address to company_address
    if (payload.company_addresses) {
      try {
        const addresses = JSON.parse(payload.company_addresses);
        if (Array.isArray(addresses) && addresses.length > 0) {
          const primary = addresses.find((a: any) => a.isPrimary) || addresses[0];
          if (primary && primary.address) {
            payload.company_address = primary.address;
          }
        }
      } catch {
        // ignore parse failure
      }
    }

    const updates: Promise<unknown>[] = [];

    for (const [key, value] of Object.entries(payload)) {
      if (typeof value === 'string') {
        let category: SettingCategory = SettingCategory.COMPANY;
        if (key.startsWith('social_')) category = SettingCategory.SOCIAL;
        if (key.startsWith('seo_') || key.includes('analytics')) category = SettingCategory.SEO;
        if (key.startsWith('website_')) category = SettingCategory.WEBSITE;

        updates.push(
          db.setting.upsert({
            where: { key },
            update: { value, category },
            create: { key, value, category },
          })
        );
      }
    }

    await Promise.all(updates);

    await logActivity({
      userId: session.userId,
      userEmail: session.email,
      action: 'UPDATE_SETTINGS',
      entityType: 'Setting',
      metadata: { keysUpdated: Object.keys(payload) },
    });

    // Instantly invalidate public website cache across layout and all pages
    try {
      revalidatePath('/', 'layout');
      revalidatePath('/');
      revalidatePath('/contact');
      revalidatePath('/about');
      revalidatePath('/services');
      revalidatePath('/work');
      revalidatePath('/workflows');
    } catch (revalidateErr) {
      console.warn('Revalidate cache warning:', revalidateErr);
    }

    return NextResponse.json({ success: true, message: 'Settings updated successfully.' });
  } catch (error) {
    console.error('Update settings error:', error);
    return NextResponse.json({ error: 'Failed to update settings.' }, { status: 500 });
  }
}
