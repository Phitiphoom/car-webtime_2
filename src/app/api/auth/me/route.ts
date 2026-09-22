// src/app/api/auth/me/route.ts
//
// Session bootstrap endpoint — the client can't read the httpOnly session
// cookie itself, so it calls this on load to find out who (if anyone) is
// logged in.
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/server/auth/guards';
import { UserService } from '@/server/users/user.service';
import { handleError } from '@/utils/error-handler';

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);
  if (!auth.ok) return auth.response;

  try {
    const user = await UserService.getById(auth.user.id);
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });
    return NextResponse.json(user);
  } catch (err) {
    return handleError(err);
  }
}
