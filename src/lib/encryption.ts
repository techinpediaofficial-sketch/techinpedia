import crypto from 'crypto';
import { env } from './env';

// Master key derived from environment secrets or system salt
function getMasterKey(): Buffer {
  return crypto.createHash('sha256').update(env.ENCRYPTION_MASTER_KEY).digest();
}

/**
 * Encrypts a string using AES-256-GCM authenticated encryption.
 * Output format: iv:authTag:encryptedHex
 */
export function encryptCredential(plainText: string): string {
  if (!plainText) return '';
  const key = getMasterKey();
  const iv = crypto.randomBytes(12); // 96-bit IV for GCM
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);

  let encrypted = cipher.update(plainText, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');

  return `${iv.toString('hex')}:${authTag}:${encrypted}`;
}

/**
 * Decrypts a string previously encrypted with encryptCredential.
 */
export function decryptCredential(cipherText?: string | null): string {
  if (!cipherText) return '';
  const parts = cipherText.split(':');
  if (parts.length !== 3) {
    // If not in encrypted format, return as-is (e.g. legacy or unencrypted during migration)
    return cipherText;
  }

  try {
    const key = getMasterKey();
    const iv = Buffer.from(parts[0], 'hex');
    const authTag = Buffer.from(parts[1], 'hex');
    const encrypted = parts[2];

    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (error) {
    console.error('Failed to decrypt credential:', error);
    return '';
  }
}

/**
 * Masks a sensitive secret for frontend rendering (e.g. EAAG...***...XYZ).
 */
export function maskSecret(secret?: string | null): string {
  if (!secret) return '';
  if (secret.length <= 8) return '••••••••';
  return `${secret.slice(0, 4)}••••••••${secret.slice(-4)}`;
}
