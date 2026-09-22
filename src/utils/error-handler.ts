// src/utils/error-handler.ts
import { NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

const KNOWN_AUTH_FAILURE_MESSAGES = new Set([
  'Invalid Credentials',
  'Authentication failed',
  'Invalid username or password',
]);

export function handleError(error: unknown): NextResponse {
  logger.error({ err: error }, 'Request failed');

  const message = error instanceof Error ? error.message : 'Unknown error';

  // Prefer an explicit .status set by the throw site (see e.g.
  // UserService.findOrCreateFromCredentials) over guessing from the message.
  const statusCandidate =
    error instanceof Error
      ? (error as unknown as { status?: unknown }).status
      : undefined;
  const explicitStatus =
    typeof statusCandidate === 'number' ? statusCandidate : undefined;

  const status =
    explicitStatus ??
    (error instanceof Error && KNOWN_AUTH_FAILURE_MESSAGES.has(error.message)
      ? 401
      : 500);

  return NextResponse.json({ error: message }, { status });
}
