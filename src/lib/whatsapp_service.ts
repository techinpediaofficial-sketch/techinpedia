/**
 * TechInPedia Official Meta WhatsApp Business Platform (Cloud API v21.0) Service
 * Enterprise DB-backed credential management, AES-256 decrypted tokens, and full API lifecycle.
 */

import { db } from './db';
import { decryptCredential, maskSecret } from './encryption';
import { normalizePhone } from './phone';

export interface ResolvedWhatsAppConfig {
  id?: string;
  companyId?: string;
  wabaId?: string;
  phoneNumberId: string;
  businessPhoneNumber?: string;
  displayName?: string;
  accessToken: string;
  appSecret?: string;
  verifyToken: string;
  apiVersion: string;
  status: string;
  isDbBacked: boolean;
}

/**
 * Resolves active WhatsApp configuration from database (priority) or environment variables.
 * When companyId is provided, resolves strictly for that tenant company without admin fallback.
 */
export async function getActiveWhatsAppConfig(companyId?: string | null): Promise<{
  config: ResolvedWhatsAppConfig | null;
  configured: boolean;
  missing: string[];
}> {
  const missing: string[] = [];

  // 1. If companyId is specified (Tenant WhatsApp Configuration)
  if (companyId) {
    try {
      const dbConn = await db.whatsappConnection.findFirst({
        where: { isActive: true, companyId },
        orderBy: { updatedAt: 'desc' },
      });

      if (dbConn && dbConn.phoneNumberId && dbConn.accessTokenEncrypted) {
        const decryptedToken = decryptCredential(dbConn.accessTokenEncrypted);
        const decryptedSecret = dbConn.appSecretEncrypted ? decryptCredential(dbConn.appSecretEncrypted) : null;

        if (decryptedToken) {
          return {
            config: {
              id: dbConn.id,
              companyId: dbConn.companyId || undefined,
              wabaId: dbConn.wabaId || undefined,
              phoneNumberId: dbConn.phoneNumberId,
              businessPhoneNumber: dbConn.businessPhoneNumber || undefined,
              displayName: dbConn.displayName || undefined,
              accessToken: decryptedToken,
              appSecret: decryptedSecret || undefined,
              verifyToken: dbConn.verifyToken,
              apiVersion: dbConn.apiVersion || 'v21.0',
              status: dbConn.status,
              isDbBacked: true,
            },
            configured: true,
            missing: [],
          };
        }
      }

      return {
        config: null,
        configured: false,
        missing: ['COMPANY_META_API_NOT_CONFIGURED'],
      };
    } catch (error) {
      console.error('Error fetching tenant WhatsApp connection:', error);
      return {
        config: null,
        configured: false,
        missing: ['DATABASE_ERROR'],
      };
    }
  }

  // 2. Try DB Connection record for Platform Master Account (companyId: null)
  try {
    const dbConn = await db.whatsappConnection.findFirst({
      where: { isActive: true, companyId: null },
      orderBy: { updatedAt: 'desc' },
    });

    if (dbConn && dbConn.phoneNumberId && dbConn.accessTokenEncrypted) {
      const decryptedToken = decryptCredential(dbConn.accessTokenEncrypted);
      const decryptedSecret = dbConn.appSecretEncrypted ? decryptCredential(dbConn.appSecretEncrypted) : null;

      if (decryptedToken) {
        return {
          config: {
            id: dbConn.id,
            companyId: undefined,
            wabaId: dbConn.wabaId || undefined,
            phoneNumberId: dbConn.phoneNumberId,
            businessPhoneNumber: dbConn.businessPhoneNumber || undefined,
            displayName: dbConn.displayName || undefined,
            accessToken: decryptedToken,
            appSecret: decryptedSecret || undefined,
            // PHASE 1.1: verifyToken must be configured in the DB record.
            verifyToken: dbConn.verifyToken,
            apiVersion: dbConn.apiVersion || 'v21.0',
            status: dbConn.status,
            isDbBacked: true,
          },
          configured: true,
          missing: [],
        };
      }
    }
  } catch (error) {
    console.error('Error fetching DB WhatsApp connection:', error);
  }

  // 3. Fallback to Environment Variables (Platform Admin only)
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID || '';
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN || '';
  const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN || '';
  const appSecret = process.env.WHATSAPP_APP_SECRET || '';
  const wabaId = process.env.WHATSAPP_BUSINESS_ACCOUNT_ID || '';

  if (!phoneNumberId) missing.push('WHATSAPP_PHONE_NUMBER_ID');
  if (!accessToken) missing.push('WHATSAPP_ACCESS_TOKEN');

  if (missing.length > 0) {
    return { config: null, configured: false, missing };
  }

  return {
    config: {
      wabaId: wabaId || undefined,
      phoneNumberId,
      accessToken,
      verifyToken: verifyToken || 'techinpedia_verify_token_2026',
      appSecret: appSecret || undefined,
      apiVersion: 'v21.0',
      status: 'CONNECTED',
      isDbBacked: false,
    },
    configured: true,
    missing: [],
  };
}

/**
 * Validates Meta WhatsApp API credentials by querying Phone Number details.
 */
export async function testMetaConnection(phoneNumberId: string, accessToken: string, apiVersion = 'v21.0'): Promise<{
  success: boolean;
  data?: {
    id: string;
    verified_name?: string;
    display_phone_number?: string;
    quality_rating?: string;
    code_verification_status?: string;
  };
  error?: string;
}> {
  try {
    const res = await fetch(`https://graph.facebook.com/${apiVersion}/${phoneNumberId}?fields=verified_name,display_phone_number,quality_rating,code_verification_status`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const body = await res.json();
    if (!res.ok) {
      return {
        success: false,
        error: body.error?.message || `Meta Graph API returned HTTP ${res.status}`,
      };
    }

    return {
      success: true,
      data: body,
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Network error connecting to Meta Graph API',
    };
  }
}

/**
 * Synchronizes approved message templates from Meta WABA into the local WhatsAppTemplate table.
 */
export async function syncMetaTemplates(companyId?: string | null): Promise<{
  success: boolean;
  count?: number;
  templates?: any[];
  error?: string;
}> {
  const { config, configured } = await getActiveWhatsAppConfig(companyId);
  if (!configured || !config) {
    return { success: false, error: 'WhatsApp is not configured.' };
  }

  if (!config.wabaId) {
    return { success: false, error: 'WhatsApp Business Account ID (WABA ID) is required to sync templates.' };
  }

  try {
    const url = `https://graph.facebook.com/${config.apiVersion}/${config.wabaId}/message_templates?limit=100`;
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${config.accessToken}` },
    });

    const data = await res.json();
    if (!res.ok) {
      return { success: false, error: data.error?.message || 'Failed to fetch templates from Meta' };
    }

    const templates = data.data || [];
    let syncedCount = 0;

    for (const tpl of templates) {
      const headerComp = tpl.components?.find((c: any) => c.type === 'HEADER');
      const bodyComp = tpl.components?.find((c: any) => c.type === 'BODY');
      const footerComp = tpl.components?.find((c: any) => c.type === 'FOOTER');
      const buttonsComp = tpl.components?.find((c: any) => c.type === 'BUTTONS');

      // Extract variables from body e.g. {{1}}, {{2}}
      const bodyText = bodyComp?.text || '';
      const varMatches = bodyText.match(/\{\{([0-9]+)\}\}/g) || [];
      const varIndices = Array.from(new Set(varMatches.map((m: string) => m.replace(/[^0-9]/g, ''))));

      const existingTpl = await db.whatsappTemplate.findUnique({
        where: { metaTemplateId: tpl.id },
      });
      const oldStatus = existingTpl?.status || 'UNKNOWN';
      const newStatus = tpl.status || 'APPROVED';

      const savedTpl = await db.whatsappTemplate.upsert({
        where: { metaTemplateId: tpl.id },
        update: {
          name: tpl.name,
          language: tpl.language,
          category: tpl.category || 'MARKETING',
          status: newStatus,
          headerType: headerComp?.format || 'NONE',
          headerContent: headerComp?.text || null,
          bodyText,
          footerText: footerComp?.text || null,
          buttonsConfig: buttonsComp?.buttons ? JSON.stringify(buttonsComp.buttons) : null,
          variablesJson: JSON.stringify(varIndices),
          rejectionReason: tpl.rejected_reason || null,
          companyId: companyId || null,
          lastSyncedAt: new Date(),
        },
        create: {
          metaTemplateId: tpl.id,
          companyId: companyId || null,
          name: tpl.name,
          language: tpl.language,
          category: tpl.category || 'MARKETING',
          status: newStatus,
          headerType: headerComp?.format || 'NONE',
          headerContent: headerComp?.text || null,
          bodyText,
          footerText: footerComp?.text || null,
          buttonsConfig: buttonsComp?.buttons ? JSON.stringify(buttonsComp.buttons) : null,
          variablesJson: JSON.stringify(varIndices),
          rejectionReason: tpl.rejected_reason || null,
          lastSyncedAt: new Date(),
        },
      });

      if (existingTpl && oldStatus !== newStatus) {
        try {
          const { TemplateRouter } = await import('@/lib/whatsapp/template_router');
          await TemplateRouter.onTemplateStatusUpdated(savedTpl.id, oldStatus, newStatus);
        } catch {}
      }

      syncedCount++;
    }

    // Remove stale templates strictly scoped to this company
    const liveMetaIds = templates.map((tpl: any) => tpl.id).filter(Boolean);
    if (liveMetaIds.length > 0) {
      await db.whatsappTemplate.deleteMany({
        where: {
          companyId: companyId || null,
          metaTemplateId: { notIn: liveMetaIds },
        },
      });
    }

    // Update connection timestamp
    if (config.id) {
      await db.whatsappConnection.update({
        where: { id: config.id },
        data: { lastSuccessfulApiCall: new Date() },
      });
    }

    return { success: true, count: syncedCount, templates };
  } catch (err: any) {
    console.error('Template sync error:', err);
    return { success: false, error: err.message || 'Template synchronization failed' };
  }
}

/**
 * Dispatches an outbound official WhatsApp text message.
 */
export async function sendWhatsAppTextMessage(
  to: string,
  message: string,
  options?: { conversationId?: string; senderUserId?: string; companyId?: string | null }
): Promise<{ success: boolean; data?: any; error?: string; messageId?: string; metaCode?: number; hint?: string }> {
  const { config, configured, missing } = await getActiveWhatsAppConfig(options?.companyId);
  if (!configured || !config) {
    return { success: false, error: `WhatsApp Cloud API not configured. Missing: ${missing.join(', ')}` };
  }

  const norm = normalizePhone(to);
  if (!norm.isValid) {
    return { success: false, error: `Invalid phone number: ${to}` };
  }

  // Check suppression scoped to company or global
  const isSuppressed = await db.whatsappSuppression.findFirst({
    where: {
      phone: norm.canonical,
      companyId: options?.companyId || null,
    },
  });
  if (isSuppressed && isSuppressed.status === 'OPTED_OUT') {
    return { success: false, error: `Recipient ${norm.canonical} is suppressed (opted-out). Message dispatch blocked.` };
  }

  try {
    const res = await fetch(`https://graph.facebook.com/${config.apiVersion}/${config.phoneNumberId}/messages`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: norm.digitsOnly,
        type: 'text',
        text: { preview_url: true, body: message },
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      const metaCode = data.error?.code;
      const metaMsg = data.error?.message || 'Meta WhatsApp API request failed';
      let hint: string | undefined = undefined;

      if (metaCode === 190 || metaMsg.includes('Authentication Error') || metaMsg.toLowerCase().includes('access token')) {
        hint = 'Your Meta Access Token has expired. Temporary tokens generated from the Meta Developer Dashboard expire after 24 hours. Please generate a Permanent System User Access Token from Meta Business Settings → System Users and update it in WhatsApp Settings.';
      } else if (metaCode === 131047 || metaMsg.includes('131047')) {
        hint = 'The 24-hour customer care window has expired. Meta policy requires an approved WhatsApp Template to message this user.';
      } else if (metaCode === 131030 || metaMsg.includes('131030') || metaMsg.toLowerCase().includes('not in allowed list')) {
        hint = `Phone number ${to} is not in your allowed test recipients list. Please add and verify it in developers.facebook.com → WhatsApp → API Setup.`;
      } else if (metaCode === 131058 || metaMsg.includes('131058')) {
        hint = "Meta limitation: 'hello_world' sample template can only be sent from Meta test sandbox numbers. For your live number, please create a custom approved template.";
      } else if (metaCode === 133010 || metaMsg.includes('133010') || metaMsg.toLowerCase().includes('account not registered')) {
        hint = 'Meta WhatsApp Error (#133010) Account not registered: This phone number (+91 98186 28880) is currently active in the WhatsApp / WhatsApp Business mobile app or is not registered with Meta Cloud API. To send messages via Cloud API, first delete/disconnect the account from the mobile app (WhatsApp > Settings > Account > Delete Account), then register the number with a 2-Step Verification PIN in Meta Business Manager.';
      }

      return {
        success: false,
        error: metaMsg,
        metaCode,
        hint,
        data,
      };
    }

    const metaMsgId = data.messages?.[0]?.id;

    // Record in WhatsAppMessage if conversationId provided
    if (options?.conversationId) {
      await db.whatsappMessage.create({
        data: {
          conversationId: options.conversationId,
          metaMessageId: metaMsgId,
          direction: 'OUTBOUND',
          senderType: options.senderUserId ? 'AGENT' : 'SYSTEM',
          senderUserId: options.senderUserId || null,
          type: 'text',
          textBody: message,
          status: 'SENT',
          sentAt: new Date(),
        },
      });

      await db.whatsappConversation.update({
        where: { id: options.conversationId },
        data: {
          lastMessageText: message,
          lastMessageSender: options.senderUserId ? 'AGENT' : 'SYSTEM',
          lastMessageAt: new Date(),
        },
      });
    }

    return { success: true, data, messageId: metaMsgId };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to dispatch WhatsApp message' };
  }
}

/**
 * Dispatches an approved official WhatsApp message template with variable values.
 */
export async function sendWhatsAppTemplateMessage(
  to: string,
  templateName: string,
  languageCode = 'en_US',
  bodyParameters: string[] = [],
  headerMediaUrl?: string,
  options?: { conversationId?: string; campaignId?: string; companyId?: string | null }
): Promise<{ success: boolean; data?: any; error?: string; messageId?: string; metaCode?: number; hint?: string }> {
  const { config, configured } = await getActiveWhatsAppConfig(options?.companyId);
  if (!configured || !config) {
    return { success: false, error: 'WhatsApp Cloud API not configured.' };
  }

  const norm = normalizePhone(to);
  if (!norm.isValid) {
    return { success: false, error: `Invalid recipient phone number: ${to}` };
  }

  // Check suppression scoped to company or global
  const isSuppressed = await db.whatsappSuppression.findFirst({
    where: {
      phone: norm.canonical,
      companyId: options?.companyId || null,
    },
  });
  if (isSuppressed && isSuppressed.status === 'OPTED_OUT') {
    return { success: false, error: `Recipient ${norm.canonical} is suppressed (opted-out). Template dispatch blocked.` };
  }

  const components: any[] = [];

  // Header component if image provided
  if (headerMediaUrl) {
    components.push({
      type: 'header',
      parameters: [{ type: 'image', image: { link: headerMediaUrl } }],
    });
  }

  // Body parameters
  if (bodyParameters.length > 0) {
    components.push({
      type: 'body',
      parameters: bodyParameters.map((param) => ({
        type: 'text',
        text: String(param || ''),
      })),
    });
  }

  try {
    const payload = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: norm.digitsOnly,
      type: 'template',
      template: {
        name: templateName,
        language: { code: languageCode },
        ...(components.length > 0 ? { components } : {}),
      },
    };

    const res = await fetch(`https://graph.facebook.com/${config.apiVersion}/${config.phoneNumberId}/messages`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    if (!res.ok) {
      const metaCode = data.error?.code;
      const metaMsg = data.error?.message || 'Meta Template API request failed';
      let hint: string | undefined = undefined;

      if (metaCode === 190 || metaMsg.includes('Authentication Error') || metaMsg.toLowerCase().includes('access token')) {
        hint = 'Your Meta Access Token has expired. Temporary tokens generated from the Meta Developer Dashboard expire after 24 hours. Please generate a Permanent System User Access Token from Meta Business Settings → System Users and update it in WhatsApp Settings.';
      } else if (metaCode === 131058 || metaMsg.includes('131058')) {
        hint = "Meta limitation: 'hello_world' sample template can only be sent from Meta test sandbox numbers. For your live number, please create a custom approved template from the Templates tab.";
      } else if (metaCode === 132001 || metaMsg.includes('132001')) {
        hint = `Template "${templateName}" does not exist in language "${languageCode}" on your Meta WABA account. Please verify template name or sync templates.`;
      } else if (metaCode === 132000 || metaMsg.includes('132000')) {
        hint = 'Template parameter count mismatch. Please provide all variable values required by the template.';
      } else if (metaCode === 131030 || metaMsg.includes('131030') || metaMsg.toLowerCase().includes('not in allowed list')) {
        hint = `Phone number ${to} is not in your allowed test recipients list. Add and verify it in developers.facebook.com → WhatsApp → API Setup.`;
      } else if (metaCode === 133010 || metaMsg.includes('133010') || metaMsg.toLowerCase().includes('account not registered')) {
        hint = 'Meta WhatsApp Error (#133010) Account not registered: This phone number is currently active in the mobile WhatsApp app. To use it with Meta Cloud API, first delete/disconnect the account from the mobile app, then set up the 2-step verification PIN in Meta Business Manager.';
      }

      return {
        success: false,
        error: metaMsg,
        metaCode,
        hint,
        data,
      };
    }

    const metaMsgId = data.messages?.[0]?.id;

    if (options?.conversationId) {
      let resolvedText = `[Template: ${templateName}]`;
      let tplRecord: any = null;
      try {
        tplRecord = await db.whatsappTemplate.findFirst({
          where: {
            name: templateName,
            ...(options.companyId ? { companyId: options.companyId } : {}),
          },
        });
        if (tplRecord?.bodyText) {
          resolvedText = tplRecord.bodyText;
          if (bodyParameters && bodyParameters.length > 0) {
            bodyParameters.forEach((val, idx) => {
              resolvedText = resolvedText.replace(new RegExp(`\\{\\{${idx + 1}\\}\\}`, 'g'), val);
            });
          }
        }
      } catch (tplLookupErr) {
        console.warn('Could not resolve template body text for history logging:', tplLookupErr);
      }

      await db.whatsappMessage.create({
        data: {
          conversationId: options.conversationId,
          metaMessageId: metaMsgId,
          direction: 'OUTBOUND',
          senderType: 'TEMPLATE',
          type: 'template',
          templateName,
          templateVariables: JSON.stringify(bodyParameters),
          textBody: resolvedText,
          campaignId: options.campaignId || null,
          status: 'SENT',
          sentAt: new Date(),
        },
      });

      await db.whatsappConversation.update({
        where: { id: options.conversationId },
        data: {
          lastMessageText: tplRecord?.name ? `📝 ${tplRecord.name}` : resolvedText.slice(0, 100),
          lastMessageSender: 'BOT',
          lastMessageAt: new Date(),
        },
      }).catch(() => {});
    }

    return { success: true, data, messageId: metaMsgId };
  } catch (err: any) {
    return { success: false, error: err.message || 'Template dispatch failed' };
  }
}

export interface CreateMetaTemplateInput {
  name: string;
  category: string; // 'MARKETING' | 'UTILITY' | 'AUTHENTICATION'
  language?: string; // default 'en_US'
  headerType?: string; // 'NONE' | 'TEXT' | 'IMAGE'
  headerText?: string;
  headerMediaUrl?: string;
  headerMediaBase64?: string;
  headerMediaHandle?: string;
  bodyText: string;
  bodySampleValues?: string[];
  footerText?: string;
  buttons?: Array<{
    type: 'QUICK_REPLY' | 'URL' | 'PHONE_NUMBER';
    text: string;
    url?: string;
    phoneNumber?: string;
  }>;
}

export interface UpdateMetaTemplateInput {
  id: string;
  category?: string;
  headerType?: string;
  headerText?: string;
  headerMediaUrl?: string;
  headerMediaBase64?: string;
  headerMediaHandle?: string;
  bodyText: string;
  bodySampleValues?: string[] | Record<string, string>;
  footerText?: string;
  buttons?: Array<{
    type: 'QUICK_REPLY' | 'URL' | 'PHONE_NUMBER';
    text: string;
    url?: string;
    phoneNumber?: string;
  }>;
}

/**
 * Uploads a sample media file to Meta Graph API via the Resumable Upload API
 * to obtain a `header_handle` required for submitting media templates (IMAGE, etc.).
 */
export async function uploadSampleMediaToMeta(
  config: any,
  mediaInput: {
    url?: string;
    base64?: string;
    buffer?: Buffer;
    mimeType?: string;
    filename?: string;
  }
): Promise<{ success: boolean; handle?: string; error?: string }> {
  if (!config) {
    return { success: false, error: 'WhatsApp config is missing.' };
  }

  // 1. Resolve Meta App ID
  let appId = config.appId;
  if (!appId) {
    try {
      const appRes = await fetch(`https://graph.facebook.com/${config.apiVersion}/app?access_token=${config.accessToken}`);
      const appData = await appRes.json();
      if (appData?.id) {
        appId = appData.id;
        if (config.id) {
          await db.whatsappConnection.update({
            where: { id: config.id },
            data: { appId: appData.id },
          }).catch(() => {});
        }
      } else {
        // Fallback: try debug_token
        const dbgRes = await fetch(`https://graph.facebook.com/${config.apiVersion}/debug_token?input_token=${config.accessToken}&access_token=${config.accessToken}`);
        const dbgData = await dbgRes.json();
        if (dbgData?.data?.app_id) {
          appId = dbgData.data.app_id;
          if (config.id) {
            await db.whatsappConnection.update({
              where: { id: config.id },
              data: { appId: dbgData.data.app_id },
            }).catch(() => {});
          }
        }
      }
    } catch (err: any) {
      console.warn('Could not auto-resolve App ID from Meta token:', err.message);
    }
  }

  if (!appId) {
    return {
      success: false,
      error: 'Meta App ID is required to upload template media headers. Please configure your App ID in WhatsApp Settings or check your Access Token permissions.',
    };
  }

  // 2. Resolve image buffer and MIME type
  let buffer: Buffer | null = mediaInput.buffer || null;
  let mimeType = mediaInput.mimeType || 'image/png';
  let filename = mediaInput.filename || 'template_header.png';

  if (!buffer && mediaInput.base64) {
    const matches = mediaInput.base64.match(/^data:([A-Za-z-+/]+);base64,(.+)$/);
    if (matches && matches.length === 3) {
      mimeType = matches[1];
      buffer = Buffer.from(matches[2], 'base64');
    } else {
      buffer = Buffer.from(mediaInput.base64, 'base64');
    }
  } else if (!buffer && mediaInput.url) {
    const rawUrl = mediaInput.url.trim();
    if (rawUrl.startsWith('/') || !rawUrl.startsWith('http')) {
      // Local file in public folder
      try {
        const fs = await import('fs/promises');
        const path = await import('path');
        const cleanPath = rawUrl.startsWith('/') ? rawUrl.slice(1) : rawUrl;
        const filePath = path.join(process.cwd(), 'public', cleanPath);
        buffer = await fs.readFile(filePath);
        if (rawUrl.endsWith('.jpg') || rawUrl.endsWith('.jpeg')) mimeType = 'image/jpeg';
        else if (rawUrl.endsWith('.webp')) mimeType = 'image/webp';
        else mimeType = 'image/png';
      } catch (fErr: any) {
        return { success: false, error: `Could not load local image file: ${fErr.message}` };
      }
    } else {
      // Remote URL
      try {
        const resp = await fetch(rawUrl);
        if (!resp.ok) {
          return { success: false, error: `Failed to download sample image from URL (${resp.status} ${resp.statusText})` };
        }
        const ab = await resp.arrayBuffer();
        buffer = Buffer.from(ab);
        const ct = resp.headers.get('content-type');
        if (ct) mimeType = ct.split(';')[0].trim();
      } catch (fetchErr: any) {
        return { success: false, error: `Failed to fetch image from URL: ${fetchErr.message}` };
      }
    }
  }

  if (!buffer || buffer.length === 0) {
    return { success: false, error: 'Sample image data is empty or could not be loaded.' };
  }

  // Meta accepts JPEG and PNG for templates
  if (!['image/jpeg', 'image/png', 'image/jpg'].includes(mimeType)) {
    mimeType = 'image/png';
  }

  const fileLength = buffer.length;

  try {
    // Step A: Initiate Upload Session
    const startUploadUrl = `https://graph.facebook.com/${config.apiVersion}/${appId}/uploads?file_length=${fileLength}&file_type=${encodeURIComponent(mimeType)}&file_name=${encodeURIComponent(filename)}`;
    const startRes = await fetch(startUploadUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.accessToken}`,
      },
    });

    const startData = await startRes.json();
    if (!startRes.ok || !startData?.id) {
      const errDetail = startData?.error?.message || JSON.stringify(startData);
      console.error('Meta Resumable Upload session init failed:', startData);
      return {
        success: false,
        error: `Meta failed to initiate media upload session: ${errDetail}`,
      };
    }

    const uploadSessionId = startData.id;

    // Step B: Upload Media Buffer
    const uploadUrl = `https://graph.facebook.com/${config.apiVersion}/${uploadSessionId}`;
    const uploadRes = await fetch(uploadUrl, {
      method: 'POST',
      headers: {
        Authorization: `OAuth ${config.accessToken}`,
        file_offset: '0',
        'Content-Type': mimeType,
      },
      body: new Uint8Array(buffer),
    });

    const uploadData = await uploadRes.json();
    if (!uploadRes.ok || !uploadData?.h) {
      const errDetail = uploadData?.error?.message || JSON.stringify(uploadData);
      console.error('Meta Resumable Upload data transfer failed:', uploadData);
      return {
        success: false,
        error: `Meta media upload failed: ${errDetail}`,
      };
    }

    return {
      success: true,
      handle: uploadData.h,
    };
  } catch (err: any) {
    console.error('Upload to Meta Resumable Upload error:', err);
    return {
      success: false,
      error: `Network error while uploading sample image to Meta: ${err.message}`,
    };
  }
}

/**
 * Creates a new message template and dispatches it directly to Meta Graph API for approval.
 * Also persists the initial template entry into the local WhatsappTemplate database.
 */
export async function createMetaTemplate(input: CreateMetaTemplateInput, companyId?: string | null): Promise<{
  success: boolean;
  template?: any;
  metaResponse?: any;
  error?: string;
}> {
  const { config, configured } = await getActiveWhatsAppConfig(companyId);
  if (!configured || !config) {
    return { success: false, error: 'WhatsApp Cloud API is not configured.' };
  }

  if (!config.wabaId) {
    return {
      success: false,
      error: 'WhatsApp Business Account ID (WABA ID) is required to submit templates to Meta.',
    };
  }

  // 1. Sanitize template name: Meta strictly enforces lowercase alphanumeric + underscores
  const rawName = input.name || '';
  const sanitizedName = rawName
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9_]/g, '_')
    .replace(/_{2,}/g, '_')
    .replace(/^_|_$/g, '');

  if (!sanitizedName || sanitizedName.length < 1) {
    return {
      success: false,
      error: 'Template name must contain valid characters (lowercase letters, numbers, and underscores).',
    };
  }

  // 2. Validate category & body text
  const category = (input.category || 'MARKETING').toUpperCase();
  if (!['MARKETING', 'UTILITY', 'AUTHENTICATION'].includes(category)) {
    return {
      success: false,
      error: 'Template category must be MARKETING, UTILITY, or AUTHENTICATION.',
    };
  }

  const bodyText = (input.bodyText || '').trim();
  if (!bodyText || bodyText.length < 2) {
    return {
      success: false,
      error: 'Template body text is required (minimum 2 characters).',
    };
  }

  const language = (input.language || 'en_US').trim();

  // 3. Assemble Meta components
  const components: any[] = [];

  // Header Component (Optional: TEXT or IMAGE)
  if (input.headerType === 'TEXT' && input.headerText && input.headerText.trim()) {
    const headerText = input.headerText.trim().slice(0, 60);
    const headerComp: any = {
      type: 'HEADER',
      format: 'TEXT',
      text: headerText,
    };
    const headerVarMatch = headerText.match(/\{\{([0-9]+)\}\}/);
    if (headerVarMatch) {
      headerComp.example = {
        header_text: [config.displayName || 'Customer'],
      };
    }
    components.push(headerComp);
  } else if (input.headerType === 'IMAGE') {
    let headerHandle = input.headerMediaHandle;
    if (!headerHandle && (input.headerMediaUrl || input.headerMediaBase64)) {
      const uploadRes = await uploadSampleMediaToMeta(config, {
        url: input.headerMediaUrl,
        base64: input.headerMediaBase64,
      });
      if (!uploadRes.success) {
        return {
          success: false,
          error: uploadRes.error || 'Failed to upload header sample image to Meta.',
        };
      }
      headerHandle = uploadRes.handle;
    }

    if (!headerHandle) {
      return {
        success: false,
        error: 'A sample image (file upload or image URL) is required when creating an Image header template for Meta approval.',
      };
    }

    components.push({
      type: 'HEADER',
      format: 'IMAGE',
      example: {
        header_handle: [headerHandle],
      },
    });
  }

  // Body Component & Dynamic Variables
  const varMatches = bodyText.match(/\{\{([0-9]+)\}\}/g) || [];
  const varIndices = Array.from(new Set(varMatches.map((m: string) => m.replace(/[^0-9]/g, '')))).sort(
    (a, b) => Number(a) - Number(b)
  );

  const bodyComp: any = {
    type: 'BODY',
    text: bodyText,
  };

  if (varIndices.length > 0) {
    // Meta requires example values for each dynamic variable in body_text: [ [ "val1", "val2" ] ]
    const sampleList: string[] = [];
    for (let i = 0; i < varIndices.length; i++) {
      const idx = varIndices[i];
      const provided = input.bodySampleValues?.[i] || input.bodySampleValues?.[Number(idx) - 1];
      const sampleVal = provided && provided.trim().length > 0 ? provided.trim() : `Sample ${idx}`;
      sampleList.push(sampleVal);
    }
    bodyComp.example = {
      body_text: [sampleList],
    };
  }

  components.push(bodyComp);

  // Footer Component (Optional, max 60 chars)
  if (input.footerText && input.footerText.trim()) {
    components.push({
      type: 'FOOTER',
      text: input.footerText.trim().slice(0, 60),
    });
  }

  // Buttons Component (Optional, max 3)
  if (input.buttons && input.buttons.length > 0) {
    const validButtons = input.buttons
      .filter((b) => b && b.text && b.text.trim())
      .slice(0, 3)
      .map((b) => {
        if (b.type === 'URL') {
          return {
            type: 'URL',
            text: b.text.trim().slice(0, 25),
            url: b.url?.trim() || 'https://techinpedia.com',
          };
        } else if (b.type === 'PHONE_NUMBER') {
          return {
            type: 'PHONE_NUMBER',
            text: b.text.trim().slice(0, 25),
            phone_number: b.phoneNumber?.trim() || '+919876543210',
          };
        } else {
          return {
            type: 'QUICK_REPLY',
            text: b.text.trim().slice(0, 25),
          };
        }
      });

    if (validButtons.length > 0) {
      components.push({
        type: 'BUTTONS',
        buttons: validButtons,
      });
    }
  }

  // 4. Dispatch to Meta Cloud API
  const metaPayload = {
    name: sanitizedName,
    category,
    language,
    components,
  };

  try {
    const url = `https://graph.facebook.com/${config.apiVersion}/${config.wabaId}/message_templates`;
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(metaPayload),
    });

    const data = await res.json();

    if (!res.ok || data.error) {
      const errMsg =
        data.error?.error_user_msg ||
        data.error?.message ||
        `Meta API returned status ${res.status}: ${JSON.stringify(data.error || data)}`;
      console.error('Meta template creation failed:', data);
      return {
        success: false,
        error: errMsg,
        metaResponse: data,
      };
    }

    const metaTemplateId = data.id || null;
    const initialStatus = data.status || 'PENDING';

    // 5. Upsert in local database scoped to companyId
    const existing = await db.whatsappTemplate.findFirst({
      where: {
        companyId: companyId || null,
        OR: [
          metaTemplateId ? { metaTemplateId } : undefined,
          { name: sanitizedName, language },
        ].filter(Boolean) as any,
      },
    });

    const templateData = {
      companyId: companyId || null,
      metaTemplateId,
      name: sanitizedName,
      language,
      category,
      status: initialStatus,
      headerType: input.headerType === 'TEXT' ? 'TEXT' : input.headerType === 'IMAGE' ? 'IMAGE' : 'NONE',
      headerContent: input.headerType === 'IMAGE' ? (input.headerMediaUrl || 'Image Header') : (input.headerText?.trim() || null),
      bodyText,
      footerText: input.footerText?.trim() || null,
      buttonsConfig: input.buttons?.length ? JSON.stringify(input.buttons) : null,
      variablesJson: JSON.stringify(varIndices),
      lastSyncedAt: new Date(),
    };

    let savedRecord;
    if (existing) {
      savedRecord = await db.whatsappTemplate.update({
        where: { id: existing.id },
        data: templateData,
      });
    } else {
      savedRecord = await db.whatsappTemplate.create({
        data: templateData,
      });
    }

    if (config.id) {
      await db.whatsappConnection.update({
        where: { id: config.id },
        data: { lastSuccessfulApiCall: new Date() },
      });
    }

    return {
      success: true,
      template: savedRecord,
      metaResponse: data,
    };
  } catch (err: any) {
    console.error('createMetaTemplate exception:', err);
    return {
      success: false,
      error: err.message || 'Network error occurred while submitting template to Meta',
    };
  }
}

/**
 * Deletes a template from Meta WABA and local database.
 */
export async function deleteMetaTemplate(templateName: string, companyId?: string | null): Promise<{
  success: boolean;
  error?: string;
}> {
  const { config, configured } = await getActiveWhatsAppConfig(companyId);
  if (!configured || !config || !config.wabaId) {
    return { success: false, error: 'WhatsApp Cloud API / WABA ID not configured' };
  }

  try {
    const url = `https://graph.facebook.com/${config.apiVersion}/${config.wabaId}/message_templates?name=${encodeURIComponent(templateName)}`;
    const res = await fetch(url, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${config.accessToken}`,
      },
    });
    const data = await res.json();
    if (!res.ok && data.error && data.error.code !== 100) {
      return { success: false, error: data.error.message || 'Failed to delete template from Meta' };
    }

    // Delete from local DB scoped to this company
    await db.whatsappTemplate.deleteMany({
      where: {
        name: templateName,
        companyId: companyId || null,
      },
    });

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Network error during template deletion' };
  }
}

/**
 * Updates an existing template locally and optionally dispatches the updated components to Meta Graph API.
 */
export async function updateMetaTemplate(
  input: UpdateMetaTemplateInput,
  companyId?: string | null
): Promise<{
  success: boolean;
  template?: any;
  metaResponse?: any;
  metaUpdated?: boolean;
  warning?: string;
  error?: string;
}> {
  const existing = await db.whatsappTemplate.findUnique({
    where: { id: input.id },
  });

  if (!existing) {
    return { success: false, error: 'Template not found.' };
  }

  // Tenant isolation check
  if (companyId && existing.companyId && existing.companyId !== companyId) {
    return { success: false, error: 'Unauthorized: Cannot modify template belonging to another company.' };
  }

  const effectiveCompanyId = existing.companyId || companyId || null;
  const { config, configured } = await getActiveWhatsAppConfig(effectiveCompanyId);

  const bodyText = (input.bodyText || '').trim();
  if (!bodyText || bodyText.length < 2) {
    return { success: false, error: 'Template body text is required (minimum 2 characters).' };
  }

  const category = (input.category || existing.category || 'MARKETING').toUpperCase();

  // Assemble components for Meta
  const components: any[] = [];

  // Header Component (Optional: TEXT or IMAGE)
  const headerType = input.headerType !== undefined ? input.headerType : existing.headerType;
  if (headerType === 'TEXT' && input.headerText && input.headerText.trim()) {
    const headerText = input.headerText.trim().slice(0, 60);
    const headerComp: any = {
      type: 'HEADER',
      format: 'TEXT',
      text: headerText,
    };
    const headerVarMatch = headerText.match(/\{\{([0-9]+)\}\}/);
    if (headerVarMatch) {
      headerComp.example = {
        header_text: [config?.displayName || 'Customer'],
      };
    }
    components.push(headerComp);
  } else if (headerType === 'IMAGE') {
    let headerHandle = input.headerMediaHandle;
    if (!headerHandle && (input.headerMediaUrl || input.headerMediaBase64) && config && configured) {
      try {
        const uploadRes = await uploadSampleMediaToMeta(config, {
          url: input.headerMediaUrl,
          base64: input.headerMediaBase64,
        });
        if (uploadRes.success) {
          headerHandle = uploadRes.handle;
        }
      } catch (uErr) {
        console.warn('Sample image upload warning during template update:', uErr);
      }
    }

    const headerComp: any = {
      type: 'HEADER',
      format: 'IMAGE',
    };
    if (headerHandle) {
      headerComp.example = {
        header_handle: [headerHandle],
      };
    }
    components.push(headerComp);
  }

  // Body Component & Dynamic Variables
  const varMatches = bodyText.match(/\{\{([0-9]+)\}\}/g) || [];
  const varIndices = Array.from(new Set(varMatches.map((m: string) => m.replace(/[^0-9]/g, '')))).sort(
    (a, b) => Number(a) - Number(b)
  );

  const bodyComp: any = {
    type: 'BODY',
    text: bodyText,
  };

  if (varIndices.length > 0) {
    const sampleList: string[] = [];
    for (let i = 0; i < varIndices.length; i++) {
      const idx = varIndices[i];
      let sampleVal = `Sample ${idx}`;
      if (Array.isArray(input.bodySampleValues)) {
        sampleVal = input.bodySampleValues[i] || input.bodySampleValues[Number(idx) - 1] || sampleVal;
      } else if (input.bodySampleValues && typeof input.bodySampleValues === 'object') {
        sampleVal = (input.bodySampleValues as Record<string, string>)[idx] || sampleVal;
      }
      sampleList.push(sampleVal.trim() || `Sample ${idx}`);
    }
    bodyComp.example = {
      body_text: [sampleList],
    };
  }

  components.push(bodyComp);

  // Footer Component (Optional, max 60 chars)
  const footerText = input.footerText !== undefined ? input.footerText?.trim() : existing.footerText;
  if (footerText) {
    components.push({
      type: 'FOOTER',
      text: footerText.slice(0, 60),
    });
  }

  // Buttons Component (Optional, max 3)
  if (input.buttons && input.buttons.length > 0) {
    const validButtons = input.buttons
      .filter((b) => b && b.text && b.text.trim())
      .slice(0, 3)
      .map((b) => {
        if (b.type === 'URL') {
          return {
            type: 'URL',
            text: b.text.trim().slice(0, 25),
            url: b.url?.trim() || 'https://techinpedia.com',
          };
        } else if (b.type === 'PHONE_NUMBER') {
          return {
            type: 'PHONE_NUMBER',
            text: b.text.trim().slice(0, 25),
            phone_number: b.phoneNumber?.trim() || '+919876543210',
          };
        } else {
          return {
            type: 'QUICK_REPLY',
            text: b.text.trim().slice(0, 25),
          };
        }
      });

    if (validButtons.length > 0) {
      components.push({
        type: 'BUTTONS',
        buttons: validButtons,
      });
    }
  }

  let metaUpdated = false;
  let metaResponse: any = null;
  let metaWarning: string | undefined = undefined;

  // Dispatch update to Meta Graph API if active and configured
  if (configured && config && config.accessToken) {
    try {
      let targetMetaId = existing.metaTemplateId;

      if (!targetMetaId && config.wabaId) {
        try {
          const lookupUrl = `https://graph.facebook.com/${config.apiVersion}/${config.wabaId}/message_templates?name=${encodeURIComponent(existing.name)}`;
          const lookupRes = await fetch(lookupUrl, {
            headers: { Authorization: `Bearer ${config.accessToken}` },
          });
          const lookupData = await lookupRes.json();
          if (lookupData?.data?.[0]?.id) {
            targetMetaId = lookupData.data[0].id;
          }
        } catch (lookErr) {
          console.warn('Meta template lookup warning:', lookErr);
        }
      }

      if (targetMetaId) {
        const metaUrl = `https://graph.facebook.com/${config.apiVersion}/${targetMetaId}`;
        const metaPayload: any = {
          components,
        };
        if (category) {
          metaPayload.category = category;
        }

        const res = await fetch(metaUrl, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${config.accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(metaPayload),
        });

        metaResponse = await res.json();
        if (res.ok && (metaResponse.success || metaResponse.id)) {
          metaUpdated = true;
        } else {
          metaWarning =
            metaResponse?.error?.error_user_msg ||
            metaResponse?.error?.message ||
            `Meta Graph API returned status ${res.status}`;
          console.warn('Meta template update warning:', metaWarning);
        }
      } else {
        metaWarning = 'Template does not have a verified Meta Template ID associated with this WABA.';
      }
    } catch (apiErr: any) {
      metaWarning = apiErr.message || 'Network error communicating with Meta API';
      console.warn('Meta template update exception:', apiErr);
    }
  } else {
    metaWarning = 'WhatsApp Cloud API connection is not currently configured or active.';
  }

  // Update local database record
  const updatedRecord = await db.whatsappTemplate.update({
    where: { id: existing.id },
    data: {
      category,
      headerType: headerType === 'TEXT' ? 'TEXT' : headerType === 'IMAGE' ? 'IMAGE' : 'NONE',
      headerContent: headerType === 'IMAGE' ? (input.headerMediaUrl || existing.headerContent) : (input.headerText?.trim() || null),
      bodyText,
      footerText: footerText || null,
      buttonsConfig: input.buttons?.length ? JSON.stringify(input.buttons) : null,
      variablesJson: JSON.stringify(varIndices),
      status: metaUpdated ? 'PENDING' : existing.status,
      lastSyncedAt: new Date(),
    },
  });

  return {
    success: true,
    template: updatedRecord,
    metaResponse,
    metaUpdated,
    warning: metaWarning,
  };
}


