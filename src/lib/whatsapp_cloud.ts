import crypto from 'crypto';
import { db } from './db';

export interface WhatsAppConfig {
  phoneNumberId: string;
  accessToken: string;
  verifyToken: string;
  appSecret?: string;
  businessAccountId?: string;
}

/**
 * Retrieves WhatsApp Cloud API configuration from env or database settings.
 */
export async function getWhatsAppConfig(): Promise<{ config: WhatsAppConfig | null; configured: boolean; missing: string[] }> {
  const missing: string[] = [];

  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID || '';
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN || '';
  const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN || '';
  const appSecret = process.env.WHATSAPP_APP_SECRET || '';
  const businessAccountId = process.env.WHATSAPP_BUSINESS_ACCOUNT_ID || '';

  if (!phoneNumberId) missing.push('WHATSAPP_PHONE_NUMBER_ID');
  if (!accessToken) missing.push('WHATSAPP_ACCESS_TOKEN');
  if (!verifyToken) missing.push('WHATSAPP_VERIFY_TOKEN');

  if (missing.length > 0) {
    return { config: null, configured: false, missing };
  }

  return {
    config: {
      phoneNumberId,
      accessToken,
      verifyToken,
      appSecret,
      businessAccountId,
    },
    configured: true,
    missing: [],
  };
}

/**
 * Cryptographically verifies Meta Webhook HMAC-SHA256 signature.
 */
export function verifyMetaSignature(rawBody: string, signatureHeader?: string | null, appSecret?: string): boolean {
  if (!signatureHeader || !appSecret) return false;

  const parts = signatureHeader.split('=');
  if (parts.length !== 2 || parts[0] !== 'sha256') return false;

  const expectedSignature = crypto
    .createHmac('sha256', appSecret)
    .update(rawBody, 'utf8')
    .digest('hex');

  return crypto.timingSafeEqual(Buffer.from(parts[1], 'hex'), Buffer.from(expectedSignature, 'hex'));
}

/**
 * Dispatches an outbound WhatsApp text message via Meta Graph API v21.0.
 */
export async function sendWhatsAppTextMessage(to: string, message: string): Promise<{ success: boolean; data?: any; error?: string }> {
  const { config, configured, missing } = await getWhatsAppConfig();
  if (!configured || !config) {
    return {
      success: false,
      error: `WhatsApp Cloud API is NOT CONFIGURED. Missing environment variables: ${missing.join(', ')}`,
    };
  }

  const cleanPhone = to.replace(/[^0-9]/g, '');

  try {
    const response = await fetch(`https://graph.facebook.com/v21.0/${config.phoneNumberId}/messages`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: cleanPhone,
        type: 'text',
        text: { preview_url: true, body: message },
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      return {
        success: false,
        error: data.error?.message || 'Meta WhatsApp API request failed',
      };
    }

    return { success: true, data };
  } catch (error: any) {
    console.error('WhatsApp API dispatch error:', error);
    return { success: false, error: error.message || 'Network error communicating with Meta API' };
  }
}
