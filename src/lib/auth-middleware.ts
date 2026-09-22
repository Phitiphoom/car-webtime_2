// src/lib/auth-middleware.ts
//
// Thin backward-compatible wrapper around src/server/auth/guards.ts for
// route handlers not yet migrated to call requireAuth/requireRole directly.
// It no longer re-derives role from department on every request — role is
// trusted straight from the JWT (itself minted from User.role in the DB),
// same as guards.ts. See src/server/auth/role-mapping.ts for why per-request
// re-derivation was the source of the old LDAP privilege-escalation bug (LDAP
// itself has since been replaced by Webtime auth; the JWT/guards design is unchanged).
import { NextRequest } from 'next/server';
import {
  requireAuth,
  requireRole as requireRoleGuard,
} from '@/server/auth/guards';
import { Role, RoleSchema } from '@/server/shared/enums';
import { User } from '@/types/user';

export interface AuthResult {
  isAuthenticated: boolean;
  user: User | null;
  message?: string;
  tokenExpired?: boolean;
}

export async function verifyJwtMiddleware(
  request: NextRequest,
  requireRoles?: Role[]
): Promise<AuthResult> {
  const result = requireRoles
    ? await requireRoleGuard(request, requireRoles)
    : await requireAuth(request);

  if (!result.ok) {
    const status = result.response.status;
    return {
      isAuthenticated: false,
      user: null,
      message: status === 401 ? 'Unauthorized' : 'Access denied',
      tokenExpired: status === 401,
    };
  }

  const user: User = {
    id: result.user.id.toString(),
    name: result.user.name,
    email: result.user.email,
    role: RoleSchema.parse(result.user.role),
  };

  return { isAuthenticated: true, user };
}
