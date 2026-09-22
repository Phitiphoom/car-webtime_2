// src/env.ts
//
// Validates required environment variables at process startup instead of
// letting individual modules silently fall back to insecure defaults
// (the old JWTService/middleware fell back to 'your-secret-key' when
// JWT_SECRET was unset). Import this module once, early, so a missing/weak
// secret fails the boot instead of shipping a forgeable token to production.
import { z } from 'zod';

const envSchema = z.object({
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),

  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  JWT_REFRESH_SECRET: z
    .string()
    .min(32, 'JWT_REFRESH_SECRET must be at least 32 characters'),
  APPROVAL_TOKEN_SECRET: z
    .string()
    .min(32, 'APPROVAL_TOKEN_SECRET must be at least 32 characters'),

  // Webtime (TigerSoft HR) — second login source, replacing LDAP/AD. A
  // separate SQL Server from DATABASE_URL; see src/services/webtime-service.ts.
  WEBTIME_DB_HOST: z.string().min(1, 'WEBTIME_DB_HOST is required'),
  WEBTIME_DB_PORT: z.coerce.number().int().positive().optional().default(1433),
  WEBTIME_DB_NAME: z.string().min(1, 'WEBTIME_DB_NAME is required'),
  WEBTIME_DB_USER: z.string().min(1, 'WEBTIME_DB_USER is required'),
  WEBTIME_DB_PASSWORD: z.string().min(1, 'WEBTIME_DB_PASSWORD is required'),
  // Some older SQL Server setups fail the LOGIN step specifically when TDS
  // encryption is forced (works fine unencrypted, and unlike a TLS handshake
  // failure this surfaces as a plain "Login failed for user" — see the
  // module comment in webtime-service.ts). Default true (encrypted); set to
  // 'false' only if the server is confirmed not to need/support it.
  WEBTIME_DB_ENCRYPT: z
    .enum(['true', 'false'])
    .optional()
    .default('true')
    .transform((v) => v === 'true'),
  BYPASS_WEBTIME: z
    .enum(['true', 'false'])
    .optional()
    .transform((v) => v === 'true'),

  EMAIL_HOST: z.string().min(1, 'EMAIL_HOST is required'),
  EMAIL_PORT: z.coerce.number().int().positive(),
  EMAIL_USER: z.string().min(1, 'EMAIL_USER is required'),
  EMAIL_PASSWORD: z.string().min(1, 'EMAIL_PASSWORD is required'),
  EMAIL_FROM: z.string().min(1, 'EMAIL_FROM is required'),

  NEXT_PUBLIC_APP_URL: z.string().url(),
  NEXT_PUBLIC_API_BASE_URL: z.string().url(),

  LOG_LEVEL: z
    .enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace'])
    .optional()
    .default('info'),
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .optional()
    .default('development'),
});

export type Env = z.infer<typeof envSchema>;

function loadEnv(): Env {
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((issue) => `  - ${issue.path.join('.')}: ${issue.message}`)
      .join('\n');
    throw new Error(
      `Invalid environment configuration, refusing to start:\n${issues}`
    );
  }
  return parsed.data;
}

export const env = loadEnv();
