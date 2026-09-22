// src/app/api/admin/users/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireRole } from '@/server/auth/guards';
import { UserService } from '@/server/users/user.service';
import { UpdateUserSchema } from '@/server/users/user.schema';
import { handleError } from '@/utils/error-handler';

function parseId(idStr: string) {
  const id = parseInt(idStr, 10);
  if (Number.isNaN(id)) return null;
  return id;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireRole(request, ['ADMIN']);
  if (!auth.ok) return auth.response;

  const id = parseId((await params).id);
  if (id === null)
    return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 });

  try {
    const user = await UserService.getById(id);
    if (!user)
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    return NextResponse.json(user);
  } catch (err) {
    return handleError(err);
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireRole(request, ['ADMIN']);
  if (!auth.ok) return auth.response;

  const id = parseId((await params).id);
  if (id === null)
    return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 });

  try {
    const body = await request.json();
    const input = UpdateUserSchema.parse(body);
    const user = await UserService.update(id, input);
    return NextResponse.json(user);
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

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireRole(request, ['ADMIN']);
  if (!auth.ok) return auth.response;

  const id = parseId((await params).id);
  if (id === null)
    return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 });

  try {
    if (id === auth.user.id) {
      return NextResponse.json(
        { error: 'ไม่สามารถปิดใช้งานบัญชีของตัวเองได้' },
        { status: 400 }
      );
    }
    await UserService.deactivate(id);
    return NextResponse.json({ success: true });
  } catch (err) {
    return handleError(err);
  }
}
