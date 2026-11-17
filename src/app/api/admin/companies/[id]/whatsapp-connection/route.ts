import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { encryptCredential } from '@/lib/encryption';
import { testMetaConnection } from '@/lib/whatsapp_service';
import { logActivity } from '@/lib/activity';

interface Params {
  params: Promise<{ id: string }>;
}

// 1. GET: Fetch Meta WhatsApp Connection for Company
export async function GET(request: Request, { params }: Params) {
  try {
    const session = await requireAuth();
    const { id } = await params;

    if (session.isTenant && session.companyId !== id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const connection = await db.whatsappConnection.findFirst({
      where: { companyId: id, isActive: true },
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        companyId: true,
        wabaId: true,
        phoneNumberId: true,
        businessPhoneNumber: true,
        displayName: true,
        qualityRating: true,
        status: true,
        connectionHealth: true,
        apiVersion: true,
        verifyToken: true,
        lastSuccessfulApiCall: true,
        lastWebhookReceivedAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    const company = await db.company.findUnique({
      where: { id },
      select: { webhookSecret: true, name: true },
    });

    const webhookUrl = `https://admin.techinpedia.com/api/whatsapp/webhook?companyId=${id}`;

    return NextResponse.json({
      success: true,
      connection,
      webhookUrl,
      verifyToken: connection?.verifyToken || company?.webhookSecret || 'techinpedia_verify_token_2026',
    });
  } catch (error: any) {
    console.error('Company WhatsApp Connection GET error:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch WhatsApp connection' }, { status: 500 });
  }
}

// 2. POST: Configure, Test, and Connect Company's Meta Cloud API
export async function POST(request: Request, { params }: Params) {
  try {
    const session = await requireAuth();
    const { id } = await params;

    const isSuperAdmin = session.role === 'SUPER_ADMIN';
    const isTenantOwner = session.companyId === id && (session.companyRole === 'OWNER' || session.role === 'ADMIN');

    if (!isSuperAdmin && !isTenantOwner) {
      return NextResponse.json({ error: 'Forbidden: Insufficient privileges.' }, { status: 403 });
    }

    const company = await db.company.findUnique({
      where: { id },
    });

    if (!company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }

    const body = await request.json();
    const {
      phoneNumberId,
      wabaId,
      accessToken,
      verifyToken,
      appSecret,
      appId,
      apiVersion = 'v21.0',
    } = body;

    if (!phoneNumberId || !accessToken) {
      return NextResponse.json({ error: 'Phone Number ID and Access Token are required.' }, { status: 400 });
    }

    // 1. Live Verification against Meta Graph API
    const testResult = await testMetaConnection(phoneNumberId.trim(), accessToken.trim(), apiVersion);
    if (!testResult.success) {
      return NextResponse.json({
        error: `Meta Connection Failed: ${testResult.error}. Please double-check your Phone Number ID and Access Token.`,
      }, { status: 400 });
    }

    const metaData = testResult.data;
    const finalVerifyToken = verifyToken?.trim() || company.webhookSecret || 'techinpedia_verify_token_2026';

    const encryptedToken = encryptCredential(accessToken.trim());
    const encryptedSecret = appSecret ? encryptCredential(appSecret.trim()) : null;

    // 2. Deactivate previous active connection for THIS COMPANY ONLY
    await db.whatsappConnection.updateMany({
      where: { companyId: id },
      data: { isActive: false },
    });

    // 3. Create fresh encrypted connection record for this company
    const newConnection = await db.whatsappConnection.create({
      data: {
        companyId: id,
        phoneNumberId: phoneNumberId.trim(),
        wabaId: wabaId ? wabaId.trim() : null,
        appId: appId ? appId.trim() : null,
        businessPhoneNumber: metaData?.display_phone_number || null,
        displayName: metaData?.verified_name || null,
        accessTokenEncrypted: encryptedToken,
        appSecretEncrypted: encryptedSecret,
        verifyToken: finalVerifyToken,
        apiVersion,
        status: 'CONNECTED',
        qualityRating: metaData?.quality_rating || 'UNKNOWN',
        connectionHealth: 'HEALTHY',
        lastSuccessfulApiCall: new Date(),
        isActive: true,
      },
    });

    await logActivity({
      userId: session.userId,
      userEmail: session.email,
      action: 'CONNECT_COMPANY_WHATSAPP',
      entityType: 'Company',
      entityId: id,
      metadata: {
        companyName: company.name,
        phoneNumberId,
        wabaId,
        verifiedName: metaData?.verified_name,
        displayPhone: metaData?.display_phone_number,
      },
    });

    const webhookUrl = `https://admin.techinpedia.com/api/whatsapp/webhook?companyId=${id}`;

    return NextResponse.json({
      success: true,
      message: `Meta WhatsApp Cloud API successfully connected for ${company.name}!`,
      connection: {
        id: newConnection.id,
        wabaId: newConnection.wabaId,
        phoneNumberId: newConnection.phoneNumberId,
        businessPhoneNumber: newConnection.businessPhoneNumber,
        displayName: newConnection.displayName,
        qualityRating: newConnection.qualityRating,
        status: newConnection.status,
        connectionHealth: newConnection.connectionHealth,
        verifyToken: newConnection.verifyToken,
      },
      webhookUrl,
    });
  } catch (error: any) {
    console.error('Company WhatsApp Connection POST error:', error);
    return NextResponse.json({ error: error.message || 'Failed to configure WhatsApp connection' }, { status: 500 });
  }
}
