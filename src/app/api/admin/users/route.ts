// src/app/api/admin/users/route.ts
//
// Single user-management endpoint, replacing the old /api/users*,
// /api/auth/users trio. Every handler is guarded up front — the old
// /api/users* routes had NO auth check at all.
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireRole } from '@/server/auth/guards';
import { UserService } from '@/server/users/user.service';
import { CreateUserSchema } from '@/server/users/user.schema';
import { handleError } from '@/utils/error-handler';

export async function GET(request: NextRequest) {
  const auth = await requireRole(request, ['ADMIN']);
  if (!auth.ok) return auth.response;

  try {
    const includeInactive =
      request.nextUrl.searchParams.get('includeInactive') === '1';
    const users = await UserService.list(includeInactive);
    return NextResponse.json(users);
  } catch (err) {
    return handleError(err);
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireRole(request, ['ADMIN']);
  if (!auth.ok) return auth.response;

  try {
    const body = await request.json();
    const input = CreateUserSchema.parse(body);
    const user = await UserService.create(input);
    return NextResponse.json(user, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: err.flatten().fieldErrors },
        { status: 400 }
      );
    }
    return handleError(err);
  }
}
