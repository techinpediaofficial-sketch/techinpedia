import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { hasPermission } from '@/lib/permissions';
import { encryptCredential } from '@/lib/encryption';
import { getActiveGoogleCredentials, getGoogleAccessToken } from '@/lib/google_sheets_service';

export async function GET() {
  try {
    const session = await getSession();
    if (!session || (!hasPermission(session, 'google_sheets.view') && !hasPermission(session, 'admin.settings.manage'))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const creds = await getActiveGoogleCredentials();
    const isConfigured = Boolean(creds?.clientEmail && creds?.privateKey);

    return NextResponse.json({
      configured: isConfigured,
      clientEmail: creds?.clientEmail || null,
      authType: 'SERVICE_ACCOUNT',
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session || !hasPermission(session, 'google_sheets.configure')) {
      return NextResponse.json({ error: 'Forbidden: Missing google_sheets.configure permission' }, { status: 403 });
    }

    const body = await request.json();
    const { clientEmail, privateKey } = body;

    if (!clientEmail || !privateKey) {
      return NextResponse.json({ error: 'Client Email and Private Key are required' }, { status: 400 });
    }

    // Encrypt private key at rest
    const encryptedKey = encryptCredential(privateKey);

    await db.googleConnection.deleteMany(); // Single active connection
    const newConn = await db.googleConnection.create({
      data: {
        authType: 'SERVICE_ACCOUNT',
        clientEmail,
        privateKeyEncrypted: encryptedKey,
        status: 'CONNECTED',
        lastTestedAt: new Date(),
      },
    });

    // Test token retrieval
    try {
      await getGoogleAccessToken();
    } catch (authErr: any) {
      return NextResponse.json({
        error: `Google Authorization Failed: ${authErr.message}. Please verify your Service Account credentials.`,
      }, { status: 400 });
    }

    await db.activityLog.create({
      data: {
        userId: session.userId,
        userEmail: session.email,
        action: 'GOOGLE_SHEETS_CONNECTED',
        entityType: 'GoogleConnection',
        entityId: newConn.id,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Google Service Account connected and verified successfully!',
    });
  } catch (error: any) {
    console.error('Google connect error:', error);
    return NextResponse.json({ error: error.message || 'Failed to connect Google account' }, { status: 500 });
  }
}
