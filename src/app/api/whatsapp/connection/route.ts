import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { hasPermission } from '@/lib/permissions';
import { encryptCredential, maskSecret } from '@/lib/encryption';
import { getActiveWhatsAppConfig, testMetaConnection } from '@/lib/whatsapp_service';

// 1. GET: Connection Status & Operational Health
export async function GET(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const rawCompanyId = searchParams.get('companyId');
    const targetCompanyId = session.isTenant || session.companyId
      ? session.companyId
      : (rawCompanyId && rawCompanyId !== 'master' && rawCompanyId !== 'ALL' ? rawCompanyId : null);

    let targetCompany: any = null;
    if (targetCompanyId) {
      targetCompany = await db.company.findUnique({
        where: { id: targetCompanyId },
        select: { id: true, name: true, isTenant: true, planName: true },
      });
    }

    let availableCompanies: Array<{
      id: string;
      name: string;
      hasWhatsApp: boolean;
      phoneNumber?: string | null;
      displayName?: string | null;
      status?: string | null;
    }> = [];

    if (!session.isTenant && (session.role === 'SUPER_ADMIN' || session.role === 'ADMIN')) {
      const companies = await db.company.findMany({
        select: {
          id: true,
          name: true,
          whatsappConnections: {
            where: { isActive: true },
            select: {
              id: true,
              businessPhoneNumber: true,
              displayName: true,
              status: true,
            },
            take: 1,
          },
        },
        orderBy: { name: 'asc' },
      });

      availableCompanies = companies.map((c) => ({
        id: c.id,
        name: c.name,
        hasWhatsApp: c.whatsappConnections.length > 0,
        phoneNumber: c.whatsappConnections[0]?.businessPhoneNumber || null,
        displayName: c.whatsappConnections[0]?.displayName || null,
        status: c.whatsappConnections[0]?.status || null,
      }));
    }

    const { config, configured, missing } = await getActiveWhatsAppConfig(targetCompanyId);

    const dbConn = await db.whatsappConnection.findFirst({
      where: { isActive: true, companyId: targetCompanyId || null },
      orderBy: { updatedAt: 'desc' },
    });

    // Compute basic statistics scoped to company
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const convWhere = targetCompanyId !== 'ALL' ? { companyId: targetCompanyId || null } : {};
    const msgWhere = targetCompanyId !== 'ALL' ? { conversation: { companyId: targetCompanyId || null } } : {};
    const tplWhere = targetCompanyId !== 'ALL' ? { companyId: targetCompanyId || null } : {};

    const [
      messagesToday,
      deliveredToday,
      readToday,
      failedToday,
      openConversations,
      webhookErrors,
      totalContacts,
      templatesCount,
      recentMessages,
    ] = await Promise.all([
      db.whatsappMessage.count({ where: { ...msgWhere, createdAt: { gte: today } } }),
      db.whatsappMessage.count({ where: { ...msgWhere, status: 'DELIVERED', createdAt: { gte: today } } }),
      db.whatsappMessage.count({ where: { ...msgWhere, status: 'READ', createdAt: { gte: today } } }),
      db.whatsappMessage.count({ where: { ...msgWhere, status: 'FAILED', createdAt: { gte: today } } }),
      db.whatsappConversation.count({ where: { ...convWhere, status: 'OPEN' } }),
      db.whatsappWebhookEvent.count({ where: { ...(targetCompanyId !== 'ALL' ? { companyId: targetCompanyId || null } : {}), status: 'FAILED' } }),
      db.whatsappConversation.count({ where: convWhere }),
      db.whatsappTemplate.count({ where: tplWhere }),
      db.whatsappMessage.findMany({
        where: msgWhere,
        orderBy: { createdAt: 'desc' },
        take: 15,
        include: {
          conversation: {
            select: {
              waNumber: true,
              customerName: true,
            },
          },
        },
      }),
    ]);

    // 3. Billing Ledger & Auto-Deduction Engine
    let billingLedger: any = {
      totalRecharged: 0,
      currency: 'INR',
      recharges: [],
      rates: {
        MARKETING: 0.7846,
        UTILITY: 0.1147,
        AUTHENTICATION: 0.1147,
        SERVICE: 0.3000,
      },
    };

    try {
      const ledgerSetting = await db.setting.findUnique({
        where: { key: 'whatsapp_billing_ledger' },
      });
      if (ledgerSetting?.value) {
        billingLedger = { ...billingLedger, ...JSON.parse(ledgerSetting.value) };
      }
    } catch (e) {
      console.error('Error loading billing ledger setting:', e);
    }

    // Auto-calculate total delivered messages cost
    const outboundMessages = await db.whatsappMessage.findMany({
      where: {
        direction: 'OUTBOUND',
        status: { in: ['SENT', 'DELIVERED', 'READ'] },
        ...(targetCompanyId !== 'ALL' ? { conversation: { companyId: targetCompanyId || null } } : {}),
      },
      select: {
        type: true,
        templateName: true,
        createdAt: true,
      },
    });

    let totalDeducted = 0;
    let marketingCount = 0;
    let utilityCount = 0;
    let serviceCount = 0;

    for (const msg of outboundMessages) {
      if (msg.templateName) {
        if (
          msg.templateName.includes('otp') ||
          msg.templateName.includes('confirm') ||
          msg.templateName.includes('update') ||
          msg.templateName.includes('order')
        ) {
          utilityCount++;
          totalDeducted += billingLedger.rates?.UTILITY ?? 0.1147;
        } else {
          marketingCount++;
          totalDeducted += billingLedger.rates?.MARKETING ?? 0.7846;
        }
      } else {
        serviceCount++;
        totalDeducted += billingLedger.rates?.SERVICE ?? 0.3000;
      }
    }

    const availableBalance = Math.max(0, (billingLedger.totalRecharged || 0) - totalDeducted);

    return NextResponse.json({
      configured,
      missing,
      isDbBacked: config?.isDbBacked || false,
      companyId: targetCompanyId,
      companyName: targetCompany?.name || session.companyName || (targetCompanyId ? 'Company' : 'TechInPedia Platform Master (Abdiel Aircon)'),
      isTenant: targetCompany ? Boolean(targetCompany.isTenant) : Boolean(session.isTenant),
      companyRole: session.companyRole,
      availableCompanies,
      connection: {
        id: dbConn?.id || null,
        phoneNumberId: config?.phoneNumberId || '',
        businessPhoneNumber: dbConn?.businessPhoneNumber || config?.businessPhoneNumber || '',
        displayName: dbConn?.displayName || config?.displayName || '',
        wabaId: dbConn?.wabaId || config?.wabaId || '',
        appId: dbConn?.appId || '',
        verifyToken: config?.verifyToken || 'techinpedia_verify_token_2026',
        apiVersion: config?.apiVersion || 'v21.0',
        status: dbConn?.status || (configured ? 'CONNECTED' : 'DISCONNECTED'),
        qualityRating: dbConn?.qualityRating || 'UNKNOWN',
        messagingLimit: dbConn?.messagingLimit || '1K',
        connectionHealth: dbConn?.connectionHealth || (configured ? 'HEALTHY' : 'NOT_CONFIGURED'),
        lastSuccessfulApiCall: dbConn?.lastSuccessfulApiCall || null,
        lastWebhookReceivedAt: dbConn?.lastWebhookReceivedAt || null,
        lastError: dbConn?.lastError || null,
        maskedToken: maskSecret(config?.accessToken),
        maskedSecret: maskSecret(config?.appSecret),
        hasSecret: Boolean(config?.appSecret),
      },
      metrics: {
        messagesToday,
        deliveredToday,
        readToday,
        failedToday,
        openConversations,
        webhookErrors,
        totalContacts,
        templates: templatesCount,
        templatesCount,
        activeConnections: configured ? 1 : 0,
      },
      billing: {
        currency: 'INR',
        totalRecharged: billingLedger.totalRecharged || 0,
        availableBalance: Number(availableBalance.toFixed(2)),
        totalDeducted: Number(totalDeducted.toFixed(2)),
        deductionSummary: {
          marketingCount,
          utilityCount,
          serviceCount,
          totalMessagesCharged: outboundMessages.length,
        },
        rates: billingLedger.rates || {
          MARKETING: 0.7846,
          UTILITY: 0.1147,
          SERVICE: 0.3000,
        },
        recharges: billingLedger.recharges || [],
        lastRechargedAt: billingLedger.recharges?.[0]?.date || null,
      },
      recentMessages,
    });
  } catch (error: any) {
    console.error('WhatsApp connection GET error:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch connection status' }, { status: 500 });
  }
}

// 2. POST: Save Credentials, Test, or Refresh Status
export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!hasPermission(session, 'whatsapp.configure')) {
      return NextResponse.json({ error: 'Forbidden: Missing whatsapp.configure permission' }, { status: 403 });
    }

    const body = await request.json();
    const { action } = body;

    // Action: Record New Recharge Top-up from Meta
    if (action === 'RECORD_RECHARGE') {
      const { amount, notes, reference } = body;
      const numAmount = parseFloat(amount);
      if (isNaN(numAmount) || numAmount <= 0) {
        return NextResponse.json({ error: 'Valid recharge amount is required' }, { status: 400 });
      }

      let ledger: any = {
        totalRecharged: 0,
        currency: 'INR',
        recharges: [],
        rates: {
          MARKETING: 0.7846,
          UTILITY: 0.1147,
          AUTHENTICATION: 0.1147,
          SERVICE: 0.3000,
        },
      };

      try {
        const existing = await db.setting.findUnique({
          where: { key: 'whatsapp_billing_ledger' },
        });
        if (existing?.value) {
          ledger = { ...ledger, ...JSON.parse(existing.value) };
        }
      } catch (err) {}

      ledger.totalRecharged = (ledger.totalRecharged || 0) + numAmount;
      ledger.recharges = [
        {
          id: `rec_${Date.now()}`,
          amount: numAmount,
          date: new Date().toISOString(),
          reference: reference || 'Meta Business Billing Hub',
          notes: notes || 'Prepaid Wallet Top-up on Meta',
        },
        ...(ledger.recharges || []),
      ];

      await db.setting.upsert({
        where: { key: 'whatsapp_billing_ledger' },
        update: { value: JSON.stringify(ledger) },
        create: {
          key: 'whatsapp_billing_ledger',
          value: JSON.stringify(ledger),
          category: 'COMPANY',
        },
      });

      return NextResponse.json({ success: true, ledger });
    }

    // Action: Directly Set Current Wallet Balance
    if (action === 'SET_BALANCE') {
      const { balance } = body;
      const numBalance = parseFloat(balance);
      if (isNaN(numBalance) || numBalance < 0) {
        return NextResponse.json({ error: 'Valid balance number is required' }, { status: 400 });
      }

      let ledger: any = {
        totalRecharged: numBalance,
        currency: 'INR',
        recharges: [
          {
            id: `rec_${Date.now()}`,
            amount: numBalance,
            date: new Date().toISOString(),
            reference: 'Meta Wallet Initial Opening Balance',
            notes: 'Opening Balance Configured by Admin',
          },
        ],
        rates: {
          MARKETING: 0.7846,
          UTILITY: 0.1147,
          AUTHENTICATION: 0.1147,
          SERVICE: 0.3000,
        },
      };

      await db.setting.upsert({
        where: { key: 'whatsapp_billing_ledger' },
        update: { value: JSON.stringify(ledger) },
        create: {
          key: 'whatsapp_billing_ledger',
          value: JSON.stringify(ledger),
          category: 'COMPANY',
        },
      });

      return NextResponse.json({ success: true, ledger });
    }

    // Action: Test Credentials without saving
    if (action === 'TEST') {
      const { phoneNumberId, accessToken, apiVersion = 'v21.0' } = body;
      if (!phoneNumberId || !accessToken) {
        return NextResponse.json({ error: 'Phone Number ID and Access Token are required for testing' }, { status: 400 });
      }

      const testResult = await testMetaConnection(phoneNumberId, accessToken, apiVersion);
      return NextResponse.json(testResult);
    }

    // Action: Refresh Live Status from Meta
    if (action === 'REFRESH') {
      const targetCompanyId = session.isTenant || session.companyId
        ? session.companyId
        : (body.companyId || null);

      const { config } = await getActiveWhatsAppConfig(targetCompanyId);
      if (!config) {
        return NextResponse.json({ error: 'No active connection to refresh' }, { status: 400 });
      }

      const testResult = await testMetaConnection(config.phoneNumberId, config.accessToken, config.apiVersion);
      if (!testResult.success) {
        if (config.id) {
          await db.whatsappConnection.update({
            where: { id: config.id },
            data: {
              status: 'ERROR',
              connectionHealth: 'FAILED',
              lastError: testResult.error,
            },
          });
        }
        return NextResponse.json({ success: false, error: testResult.error });
      }

      const metaData = testResult.data;
      if (config.id) {
        await db.whatsappConnection.update({
          where: { id: config.id },
          data: {
            status: 'CONNECTED',
            connectionHealth: 'HEALTHY',
            displayName: metaData?.verified_name || config.displayName,
            businessPhoneNumber: metaData?.display_phone_number || config.businessPhoneNumber,
            qualityRating: metaData?.quality_rating || 'UNKNOWN',
            lastSuccessfulApiCall: new Date(),
            lastError: null,
          },
        });
      }

      return NextResponse.json({
        success: true,
        data: metaData,
        message: 'WhatsApp connection status refreshed successfully.',
      });
    }

    // Action: Save and Connect
    const targetCompanyId = session.isTenant || session.companyId
      ? session.companyId
      : (body.companyId || null);

    const {
      phoneNumberId,
      wabaId,
      accessToken,
      appSecret,
      appId,
      verifyToken = 'techinpedia_verify_token_2026',
      apiVersion = 'v21.0',
    } = body;

    if (!phoneNumberId || !accessToken) {
      return NextResponse.json({ error: 'Phone Number ID and Access Token are required' }, { status: 400 });
    }

    // Validate with Meta API first
    const testResult = await testMetaConnection(phoneNumberId, accessToken, apiVersion);
    if (!testResult.success) {
      return NextResponse.json({
        error: `Meta Connection Failed: ${testResult.error}. Please verify your Phone Number ID and Access Token.`,
      }, { status: 400 });
    }

    const metaData = testResult.data;
    const encryptedToken = encryptCredential(accessToken);
    const encryptedSecret = appSecret ? encryptCredential(appSecret) : null;

    // Deactivate previous connections strictly for this company
    await db.whatsappConnection.updateMany({
      where: { companyId: targetCompanyId || null },
      data: { isActive: false },
    });

    const newConnection = await db.whatsappConnection.create({
      data: {
        companyId: targetCompanyId || null,
        phoneNumberId,
        wabaId: wabaId || null,
        appId: appId || null,
        businessPhoneNumber: metaData?.display_phone_number || null,
        displayName: metaData?.verified_name || null,
        accessTokenEncrypted: encryptedToken,
        appSecretEncrypted: encryptedSecret,
        verifyToken,
        apiVersion,
        status: 'CONNECTED',
        qualityRating: metaData?.quality_rating || 'UNKNOWN',
        connectionHealth: 'HEALTHY',
        lastSuccessfulApiCall: new Date(),
        isActive: true,
      },
    });

    // Log administrative action
    await db.activityLog.create({
      data: {
        userId: session.userId,
        userEmail: session.email,
        action: 'WHATSAPP_CONNECTED',
        entityType: 'WhatsAppConnection',
        entityId: newConnection.id,
        metadata: JSON.stringify({
          phoneNumberId,
          wabaId,
          displayName: metaData?.verified_name,
          companyId: targetCompanyId,
        }),
      },
    });

    return NextResponse.json({
      success: true,
      message: 'WhatsApp Business Platform connected successfully!',
      connection: {
        id: newConnection.id,
        displayName: newConnection.displayName,
        businessPhoneNumber: newConnection.businessPhoneNumber,
        qualityRating: newConnection.qualityRating,
        status: newConnection.status,
      },
    });
  } catch (error: any) {
    console.error('WhatsApp connection POST error:', error);
    return NextResponse.json({ error: error.message || 'Failed to update WhatsApp connection' }, { status: 500 });
  }
}

// 3. DELETE: Disconnect Integration
export async function DELETE(request: Request) {
  try {
    const session = await getSession();
    if (!session || !hasPermission(session, 'whatsapp.configure')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const targetCompanyId = session.isTenant || session.companyId
      ? session.companyId
      : (searchParams.get('companyId') || null);

    await db.whatsappConnection.updateMany({
      where: { companyId: targetCompanyId || null },
      data: {
        isActive: false,
        status: 'DISCONNECTED',
        connectionHealth: 'DISCONNECTED',
      },
    });

    await db.activityLog.create({
      data: {
        userId: session.userId,
        userEmail: session.email,
        action: 'WHATSAPP_DISCONNECTED',
        entityType: 'WhatsAppConnection',
        metadata: JSON.stringify({ companyId: targetCompanyId }),
      },
    });

    return NextResponse.json({ success: true, message: 'WhatsApp Business Platform disconnected.' });
  } catch (error: any) {
    console.error('WhatsApp disconnect error:', error);
    return NextResponse.json({ error: error.message || 'Failed to disconnect' }, { status: 500 });
  }
}
