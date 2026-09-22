// src/app/api/admin/users/import/route.ts
//
// Bulk user creation from the Excel import dialog. Rows are re-validated here
// — the client-side check is only for fast feedback.
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireRole } from '@/server/auth/guards';
import { UserService } from '@/server/users/user.service';
import { ImportUsersSchema } from '@/server/users/user.schema';
import { handleError } from '@/utils/error-handler';

export async function POST(request: NextRequest) {
  const auth = await requireRole(request, ['ADMIN']);
  if (!auth.ok) return auth.response;

  try {
    const { users } = ImportUsersSchema.parse(await request.json());
    return NextResponse.json(await UserService.importMany(users));
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'ข้อมูลในไฟล์ไม่ถูกต้อง' },
        { status: 400 }
      );
    }
    return handleError(err);
  }
}
