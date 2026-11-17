import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthSession } from '@/lib/auth';

/**
 * POST /api/mobile/devices
 * Registers or updates an FCM push notification token for the logged-in employee
 */
export async function POST(request: Request) {
  try {
    const session = await getAuthSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const fcmToken = body.fcmToken || body.token;
    const platform = body.platform || body.deviceType || 'ANDROID';
    const deviceModel = body.deviceModel || 'Unknown';
    const osVersion = body.osVersion || 'Unknown';

    if (!fcmToken || typeof fcmToken !== 'string') {
      return NextResponse.json({ error: 'Valid fcmToken or token is required' }, { status: 400 });
    }


    const key = `user_devices_${session.userId}`;
    const existing = await db.setting.findUnique({ where: { key } });
    let devices: any[] = [];
    if (existing?.value) {
      try {
        devices = JSON.parse(existing.value);
        if (!Array.isArray(devices)) devices = [];
      } catch {}
    }

    // Filter out existing token if already registered
    devices = devices.filter((d: any) => d.fcmToken !== fcmToken);

    // Append new device
    devices.push({
      fcmToken,
      platform,
      deviceModel,
      osVersion,
      registeredAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // Keep up to 5 devices per employee to avoid stale bloat
    if (devices.length > 5) {
      devices = devices.slice(-5);
    }

    await db.setting.upsert({
      where: { key },
      create: { key, value: JSON.stringify(devices) },
      update: { value: JSON.stringify(devices) },
    });

    return NextResponse.json({
      success: true,
      message: 'FCM device token registered successfully.',
      devicesCount: devices.length,
    });
  } catch (error: any) {
    console.error('FCM device registration error:', error);
    return NextResponse.json({ error: error.message || 'Failed to register device' }, { status: 500 });
  }
}

/**
 * DELETE /api/mobile/devices
 * De-registers an FCM push token on employee logout
 */
export async function DELETE(request: Request) {
  try {
    const session = await getAuthSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const { fcmToken } = body;

    const key = `user_devices_${session.userId}`;
    const existing = await db.setting.findUnique({ where: { key } });
    if (existing?.value) {
      try {
        let devices: any[] = JSON.parse(existing.value);
        if (Array.isArray(devices)) {
          if (fcmToken) {
            devices = devices.filter((d: any) => d.fcmToken !== fcmToken);
          } else {
            devices = []; // Clear all if token not specified
          }
          await db.setting.update({
            where: { key },
            data: { value: JSON.stringify(devices) },
          });
        }
      } catch {}
    }

    return NextResponse.json({ success: true, message: 'Device token removed successfully.' });
  } catch (error: any) {
    console.error('FCM device deregistration error:', error);
    return NextResponse.json({ error: error.message || 'Failed to remove device' }, { status: 500 });
  }
}
