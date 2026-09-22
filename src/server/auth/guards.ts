// src/server/auth/guards.ts
//
// Single place every route handler calls to authenticate/authorize a
// request. The old codebase had this logic (verifyJwtMiddleware) applied
// inconsistently — /api/users*, /api/cars*, /api/drivers* had NO auth check
// at all, and PUT /api/trips/[id] (approve/reject) had no role check either.
// Centralizing it here means a route can't accidentally skip it: every
// route.ts under src/app/api/** should start with requireAuth()/requireRole().
//
// Role now comes directly from the JWT (minted from User.role in the DB at
// login), not re-derived from department per request — see
// src/server/auth/role-mapping.ts for why that re-derivation was the source
// of the LDAP privilege-escalation bug.
import { NextRequest, NextResponse } from 'next/server';
import { Role } from '@/server/shared/enums';
import { JWTService, JwtPayload } from '@/services/jwt-service';
import { logger } from '@/lib/logger';

export interface AuthenticatedUser {
  id: number;
  name: string;
  email: string;
  role: Role;
}

export type GuardResult =
  | { ok: true; user: AuthenticatedUser }
  | { ok: false; response: NextResponse };

function unauthorized(message: string): GuardResult {
  return {
    ok: false,
    response: NextResponse.json({ error: message }, { status: 401 }),
  };
}

function forbidden(message: string): GuardResult {
  return {
    ok: false,
    response: NextResponse.json({ error: message }, { status: 403 }),
  };
}

export const SESSION_COOKIE_NAME = 'carWebtime_token';

function extractToken(request: NextRequest): string | null {
  // Cookie (httpOnly, set by the login route) is the primary transport now —
  // the client no longer stores the token in localStorage/JS-readable
  // cookies and builds an Authorization header itself. The header is kept
  // as a fallback for non-browser callers (scripts, curl, tests).
  const cookieToken = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (cookieToken) return cookieToken;

  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) return authHeader.substring(7);

  return null;
}

export async function requireAuth(request: NextRequest): Promise<GuardResult> {
  const token = extractToken(request);
  if (!token) {
    return unauthorized('Missing or invalid session');
  }

  let payload: JwtPayload;
  try {
    payload = await JWTService.verifyToken(token);
  } catch (error) {
    logger.warn({ err: error }, 'JWT verification failed');
    return unauthorized(
      error instanceof Error ? error.message : 'Invalid token'
    );
  }

  const userId = Number(payload.sub);
  if (Number.isNaN(userId)) {
    return unauthorized('Invalid token subject');
  }

  return {
    ok: true,
    user: {
      id: userId,
      name: payload.name,
      email: payload.email,
      role: payload.role,
    },
  };
}

export async function requireRole(
  request: NextRequest,
  allowed: Role[]
): Promise<GuardResult> {
  const result = await requireAuth(request);
  if (!result.ok) return result;

  if (!allowed.includes(result.user.role)) {
    logger.info(
      { userId: result.user.id, role: result.user.role, allowed },
      'Access denied: insufficient role'
    );
    return forbidden(`Access denied. Required role(s): ${allowed.join(', ')}`);
  }

  return result;
}
