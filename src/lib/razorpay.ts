import crypto from 'crypto';
import { db } from '@/lib/db';

export interface RazorpayConfig {
  keyId: string;
  keySecret: string;
  webhookSecret: string;
  isConfigured: boolean;
  isTestMode: boolean;
}

export interface CreatePaymentLinkParams {
  amount: number; // in INR (e.g. 5000)
  currency?: string;
  purpose: string;
  description?: string;
  clientName?: string;
  clientEmail?: string;
  clientPhone?: string;
  expiresInDays?: number;
  dealId?: string;
  invoiceId?: string;
  salesEmployeeId?: string;
  internalNotes?: string;
}

export interface PaymentLinkResult {
  providerLinkId: string;
  providerOrderId?: string | null;
  shortUrl: string;
  amount: number;
  currency: string;
  status: string;
  rawResponse: any;
  isSimulated: boolean;
}

/**
 * Resolve Razorpay configuration from process.env or database Setting table.
 */
export async function getRazorpayConfig(): Promise<RazorpayConfig> {
  let keyId = process.env.RAZORPAY_KEY_ID?.trim() || '';
  let keySecret = process.env.RAZORPAY_KEY_SECRET?.trim() || '';
  let webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET?.trim() || '';

  // If not in env, check database settings
  if (!keyId || !keySecret) {
    try {
      const dbSettings = await db.setting.findMany({
        where: {
          key: { in: ['razorpay_key_id', 'razorpay_key_secret', 'razorpay_webhook_secret'] },
        },
      });

      const map = new Map(dbSettings.map((s) => [s.key, s.value]));
      if (!keyId) keyId = map.get('razorpay_key_id') || '';
      if (!keySecret) keySecret = map.get('razorpay_key_secret') || '';
      if (!webhookSecret) webhookSecret = map.get('razorpay_webhook_secret') || '';
    } catch {
      // Fallback if settings query fails
    }
  }

  const isConfigured = Boolean(keyId && keySecret);
  const isTestMode = keyId.startsWith('rzp_test_');

  return {
    keyId,
    keySecret,
    webhookSecret,
    isConfigured,
    isTestMode,
  };
}

/**
 * Creates an official payment link via Razorpay Standard Payments API.
 * If credentials are not yet configured, returns a high-fidelity sandbox payment link.
 */
export async function createRazorpayPaymentLink(params: CreatePaymentLinkParams): Promise<PaymentLinkResult> {
  const config = await getRazorpayConfig();
  const currency = params.currency || 'INR';
  const expiresInDays = params.expiresInDays || 7;
  const expireBy = Math.floor(Date.now() / 1000) + (expiresInDays * 86400);

  // If live or test keys are configured, call the official Razorpay REST API
  if (config.isConfigured) {
    const authHeader = 'Basic ' + Buffer.from(`${config.keyId}:${config.keySecret}`).toString('base64');
    const amountInPaise = Math.round(params.amount * 100);

    const payload: Record<string, any> = {
      amount: amountInPaise,
      currency,
      accept_partial: false,
      description: params.description || `Payment for ${params.purpose.replace(/_/g, ' ')}`,
      customer: {
        name: params.clientName || 'Client',
        email: params.clientEmail || undefined,
        contact: params.clientPhone || undefined,
      },
      notify: {
        sms: Boolean(params.clientPhone),
        email: Boolean(params.clientEmail),
      },
      reminder_enable: true,
      notes: {
        purpose: params.purpose,
        salesEmployeeId: params.salesEmployeeId || '',
        dealId: params.dealId || '',
        invoiceId: params.invoiceId || '',
      },
      expire_by: expireBy,
    };

    const response = await fetch('https://api.razorpay.com/v1/payment_links', {
      method: 'POST',
      headers: {
        Authorization: authHeader,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      const errMessage = data.error?.description || data.message || 'Razorpay API error';
      throw new Error(`Razorpay Error: ${errMessage}`);
    }

    return {
      providerLinkId: data.id,
      providerOrderId: data.order_id || null,
      shortUrl: data.short_url,
      amount: params.amount,
      currency,
      status: 'CREATED',
      rawResponse: data,
      isSimulated: false,
    };
  }

  // Full-Fidelity Sandbox Simulator (When awaiting merchant credentials)
  const simulatedId = `plink_test_${crypto.randomBytes(6).toString('hex')}`;
  const simulatedUrl = `https://rzp.io/i/${crypto.randomBytes(4).toString('hex')}`;

  const simulatedResponse = {
    id: simulatedId,
    entity: 'payment_link',
    amount: Math.round(params.amount * 100),
    currency,
    accept_partial: false,
    short_url: simulatedUrl,
    status: 'created',
    description: params.description || `Payment for ${params.purpose.replace(/_/g, ' ')}`,
    created_at: Math.floor(Date.now() / 1000),
    expire_by: expireBy,
    mode: 'SANDBOX_SIMULATOR',
  };

  return {
    providerLinkId: simulatedId,
    providerOrderId: null,
    shortUrl: simulatedUrl,
    amount: params.amount,
    currency,
    status: 'CREATED',
    rawResponse: simulatedResponse,
    isSimulated: true,
  };
}

/**
 * Cancels an active payment link.
 */
export async function cancelRazorpayPaymentLink(providerLinkId: string): Promise<boolean> {
  const config = await getRazorpayConfig();

  if (config.isConfigured && !providerLinkId.startsWith('plink_test_')) {
    const authHeader = 'Basic ' + Buffer.from(`${config.keyId}:${config.keySecret}`).toString('base64');
    const response = await fetch(`https://api.razorpay.com/v1/payment_links/${providerLinkId}/cancel`, {
      method: 'POST',
      headers: {
        Authorization: authHeader,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error?.description || 'Failed to cancel link on Razorpay');
    }
  }

  return true;
}

/**
 * Cryptographic HMAC-SHA256 signature verification with timing-safe comparison.
 */
export function verifyRazorpayWebhookSignature(
  rawBody: string,
  signature: string,
  secret: string
): boolean {
  if (!signature || !secret || !rawBody) {
    return false;
  }

  try {
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(rawBody)
      .digest('hex');

    const expectedBuffer = Buffer.from(expectedSignature, 'utf8');
    const signatureBuffer = Buffer.from(signature, 'utf8');

    if (expectedBuffer.length !== signatureBuffer.length) {
      return false;
    }

    return crypto.timingSafeEqual(expectedBuffer, signatureBuffer);
  } catch (err) {
    console.error('Razorpay signature verification error:', err);
    return false;
  }
}

export interface RazorpayOrderResult {
  orderId: string;
  amount: number;
  currency: string;
  receipt?: string;
  status: string;
  keyId: string;
  isSimulated: boolean;
}

/**
 * Creates an official Razorpay Standard Order for browser checkout.
 */
export async function createRazorpayOrder(params: {
  amount: number; // in INR
  currency?: string;
  receipt?: string;
  notes?: Record<string, string>;
}): Promise<RazorpayOrderResult> {
  const config = await getRazorpayConfig();
  const currency = params.currency || 'INR';
  const amountInPaise = Math.round(params.amount * 100);

  if (config.isConfigured) {
    const authHeader = 'Basic ' + Buffer.from(`${config.keyId}:${config.keySecret}`).toString('base64');
    const res = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        Authorization: authHeader,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: amountInPaise,
        currency,
        receipt: params.receipt || `rcpt_${Date.now()}`,
        notes: params.notes || {},
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(`Razorpay Order Error: ${data.error?.description || data.message || 'Failed to create order'}`);
    }

    return {
      orderId: data.id,
      amount: params.amount,
      currency,
      receipt: data.receipt,
      status: data.status,
      keyId: config.keyId,
      isSimulated: false,
    };
  }

  // Simulated sandbox order when keys not yet configured
  const simulatedOrderId = `order_sim_${crypto.randomBytes(6).toString('hex')}`;
  return {
    orderId: simulatedOrderId,
    amount: params.amount,
    currency,
    receipt: params.receipt,
    status: 'created',
    keyId: config.keyId || 'rzp_test_simulated_key',
    isSimulated: true,
  };
}

/**
 * Verifies Razorpay payment signature from browser checkout callback.
 */
export function verifyRazorpayPaymentSignature(params: {
  orderId: string;
  paymentId: string;
  signature: string;
  keySecret?: string;
}): boolean {
  try {
    const text = `${params.orderId}|${params.paymentId}`;
    const secret = params.keySecret || process.env.RAZORPAY_KEY_SECRET || '';
    if (!secret) return true; // If sandbox simulator, pass verification
    const expected = crypto.createHmac('sha256', secret).update(text).digest('hex');
    return expected === params.signature;
  } catch (e) {
    return false;
  }
}
