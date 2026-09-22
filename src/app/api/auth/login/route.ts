import { NextResponse } from 'next/server';
import { z } from 'zod';
import { handleError } from '@/utils/error-handler';
import { AuthService } from '@/services/auth-service';
import { logger } from '@/lib/logger';
import { SESSION_COOKIE_NAME } from '@/server/auth/guards';

const SESSION_COOKIE_MAX_AGE_SECONDS = 60 * 30; // matches the 30m access token expiry

const LoginBodySchema = z.object({
  username: z.string().trim().min(1, 'username is required'),
  password: z.string().min(1, 'password is required'),
});

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => {
      throw new z.ZodError([
        { code: 'custom', path: [], message: 'Invalid JSON body' },
      ]);
    });

    const { username, password } = LoginBodySchema.parse(body);

    // Webtime/Database env vars are validated at process boot by src/env.ts —
    // no ad-hoc check needed here (the old LDAP-only check lived here because
    // it read process.env directly instead of the validated env module).

    // Role is decided entirely inside AuthService/UserService (from the DB
    // User.role column) — the route no longer re-derives it from department.
    const { token, user } = await AuthService.authenticate(username, password);

    // Cookie is httpOnly — client JS can never read the token (fixes the
    // old XSS token-theft exposure from storing it in localStorage). The
    // client relies on this cookie being sent automatically instead of
    // building an Authorization header itself.
    const response = NextResponse.json({ user });
    response.cookies.set(SESSION_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: SESSION_COOKIE_MAX_AGE_SECONDS,
    });
    return response;
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: err.flatten().fieldErrors },
        { status: 400 }
      );
    }

    logger.warn({ err }, 'Login route error');
    return handleError(err);
  }
}
