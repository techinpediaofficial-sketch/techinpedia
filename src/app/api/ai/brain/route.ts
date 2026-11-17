import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { handleApiAuthError } from '@/lib/auth-errors';
import { hasPermission } from '@/lib/permissions';
import { encryptCredential, decryptCredential, maskSecret } from '@/lib/encryption';
import { AIEngine } from '@/lib/ai/ai-engine';
import { resolveEffectiveCompanyId, getAvailableCompaniesForAdmin } from '@/lib/access-policy';

export async function GET(request: Request) {
  try {
    const session = await requireAuth();
    const isAuthorized =
      session.role === 'SUPER_ADMIN' ||
      session.role === 'ADMIN' ||
      session.companyRole === 'OWNER' ||
      session.companyRole === 'ADMIN' ||
      hasPermission(session, 'ai.brain.view') ||
      hasPermission(session, 'whatsapp.view');

    if (!isAuthorized) {
      return NextResponse.json({ error: 'Unauthorized to view AI Brain' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const companyId = await resolveEffectiveCompanyId(session, searchParams.get('companyId'));

    if (!companyId) {
      return NextResponse.json({ error: 'No active company found. Please create or configure a company first.' }, { status: 400 });
    }

    const [config, availableCompanies] = await Promise.all([
      AIEngine.getConfig(companyId),
      getAvailableCompaniesForAdmin(session),
    ]);

    // Return sanitized config with masked raw API key
    let maskedKey: string | null = null;
    if (config.apiKeyEncrypted) {
      try {
        const decrypted = decryptCredential(config.apiKeyEncrypted);
        if (decrypted) maskedKey = maskSecret(decrypted);
      } catch {}
    }

    const sanitizedConfig = {
      ...config,
      apiKeyEncrypted: undefined,
      hasApiKey: Boolean(config.apiKeyEncrypted),
      maskedApiKey: maskedKey,
    };

    return NextResponse.json({
      success: true,
      companyId,
      availableCompanies,
      config: sanitizedConfig,
    });
  } catch (error: any) {
    const authRes = handleApiAuthError(error);
    if (authRes) return authRes;
    console.error('Error fetching AI Brain config:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await requireAuth();
    const isAuthorized =
      session.role === 'SUPER_ADMIN' ||
      session.role === 'ADMIN' ||
      session.companyRole === 'OWNER' ||
      session.companyRole === 'ADMIN' ||
      hasPermission(session, 'ai.brain.manage');

    if (!isAuthorized) {
      return NextResponse.json({ error: 'Unauthorized to modify AI Brain' }, { status: 403 });
    }

    const body = await request.json();
    const { searchParams } = new URL(request.url);
    const companyId = await resolveEffectiveCompanyId(session, body.companyId || searchParams.get('companyId'));

    if (!companyId) {
      return NextResponse.json({ error: 'No active company found. Please create or configure a company first.' }, { status: 400 });
    }

    // Ensure config exists
    await AIEngine.getConfig(companyId);

    const updateData: any = {};

    // Provider & Model
    if (body.provider !== undefined) updateData.provider = body.provider;
    if (body.model !== undefined) updateData.model = body.model;
    if (body.keyStrategy !== undefined) updateData.keyStrategy = body.keyStrategy;
    if (body.fallbackProvider !== undefined) updateData.fallbackProvider = body.fallbackProvider || null;
    if (body.fallbackModel !== undefined) updateData.fallbackModel = body.fallbackModel || null;
    if (body.temperature !== undefined) updateData.temperature = parseFloat(body.temperature);
    if (body.maxTokens !== undefined) updateData.maxTokens = parseInt(body.maxTokens);

    // Encrypt API key if provided
    if (body.apiKey && typeof body.apiKey === 'string' && body.apiKey.trim() !== '') {
      updateData.apiKeyEncrypted = encryptCredential(body.apiKey.trim());
      updateData.keyStrategy = 'TENANT_PROVIDED';
    }

    // Persona & Tone
    if (body.botName !== undefined) updateData.botName = body.botName.trim();
    if (body.role !== undefined) updateData.role = body.role.trim();
    if (body.primaryTone !== undefined) updateData.primaryTone = body.primaryTone.trim();
    if (body.basePersonality !== undefined) updateData.basePersonality = body.basePersonality;
    if (body.dynamicPersonaEnabled !== undefined) updateData.dynamicPersonaEnabled = Boolean(body.dynamicPersonaEnabled);

    // Brand Context
    if (body.brandName !== undefined) updateData.brandName = body.brandName;
    if (body.brandDescription !== undefined) updateData.brandDescription = body.brandDescription;
    if (body.productsSummary !== undefined) updateData.productsSummary = body.productsSummary;
    if (body.workingHours !== undefined) updateData.workingHours = body.workingHours;
    if (body.supportPolicies !== undefined) updateData.supportPolicies = body.supportPolicies;
    if (body.refundPolicy !== undefined) updateData.refundPolicy = body.refundPolicy;
    if (body.disclaimers !== undefined) updateData.disclaimers = body.disclaimers;
    if (body.defaultLanguage !== undefined) updateData.defaultLanguage = body.defaultLanguage;

    // Policy & Limits
    if (body.responsePolicy !== undefined) updateData.responsePolicy = body.responsePolicy;
    if (body.autoHandoffOnFrustration !== undefined) updateData.autoHandoffOnFrustration = Boolean(body.autoHandoffOnFrustration);
    if (body.monthlyTokenLimit !== undefined) updateData.monthlyTokenLimit = parseInt(body.monthlyTokenLimit);
    if (body.dailyRequestLimit !== undefined) updateData.dailyRequestLimit = parseInt(body.dailyRequestLimit);
    if (body.enabled !== undefined) updateData.enabled = Boolean(body.enabled);

    const updated = await db.aiConfig.update({
      where: { companyId },
      data: updateData,
    });

    let maskedKey: string | null = null;
    if (updated.apiKeyEncrypted) {
      try {
        const decrypted = decryptCredential(updated.apiKeyEncrypted);
        if (decrypted) maskedKey = maskSecret(decrypted);
      } catch {}
    }

    return NextResponse.json({
      success: true,
      config: {
        ...updated,
        apiKeyEncrypted: undefined,
        hasApiKey: Boolean(updated.apiKeyEncrypted),
        maskedApiKey: maskedKey,
      },
    });
  } catch (error: any) {
    const authRes = handleApiAuthError(error);
    if (authRes) return authRes;
    console.error('Error updating AI Brain config:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
