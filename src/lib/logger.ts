// src/lib/logger.ts
//
// Structured logging to replace the old console.log-of-PII scattered through
// auth-middleware.ts, auth-service.ts and webtime-service.ts (usernames, emails,
// departments, bind DNs logged unconditionally at every request). Fields
// listed in REDACT_PATHS are masked automatically; call sites should still
// avoid passing raw PII objects to `msg` positions that bypass structured
// fields.
import pino from 'pino';

const REDACT_PATHS = [
  'password',
  'email',
  'name',
  'department',
  'ip',
  '*.password',
  '*.email',
  '*.name',
  '*.department',
  '*.ip',
];

export const logger = pino({
  level: process.env.LOG_LEVEL ?? 'info',
  redact: {
    paths: REDACT_PATHS,
    censor: '[redacted]',
  },
  formatters: {
    level: (label) => ({ level: label }),
  },
});
