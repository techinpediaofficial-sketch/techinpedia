import 'server-only';
// Server-only environment configuration

function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`CRITICAL CONFIGURATION ERROR: Missing required environment variable: ${key}`);
  }
  if (process.env.NODE_ENV === 'production' && value === 'CHANGE_ME_PRODUCTION_SECRET') {
    throw new Error(`CRITICAL CONFIGURATION ERROR: Production environment is using insecure fallback for ${key}`);
  }
  return value;
}

export const env = {
  JWT_SECRET: requireEnv('JWT_SECRET'),
  ENCRYPTION_MASTER_KEY: requireEnv('ENCRYPTION_MASTER_KEY'),
  CRON_SECRET: requireEnv('CRON_SECRET'),
  DATABASE_URL: requireEnv('DATABASE_URL'),
  ALLOWED_ORIGINS: (process.env.ALLOWED_ORIGINS || '').split(',').map(o => o.trim()).filter(Boolean),
  NODE_ENV: process.env.NODE_ENV || 'development',
};
