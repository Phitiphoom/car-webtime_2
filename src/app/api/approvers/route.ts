/* -------------------------------------------------------------------------- */
/*  src/app/api/approvers/route.ts                                            */
/* -------------------------------------------------------------------------- */
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import prisma from '@/lib/prisma';
import { handleError } from '@/utils/error-handler';
import { verifyJwtMiddleware } from '@/lib/auth-middleware';

/* ── 1. สร้าง schema สำหรับ query ---------------------------------------- */
const QuerySchema = z.object({
  department: z
    .string()
    .trim()
    .min(1, 'department must not be empty')
    .optional(),
});

export async function GET(request: NextRequest) {
  try {
    /* ── 2. ตรวจสอบ JWT --------------------------------------------------- */
    const authResult = await verifyJwtMiddleware(request);
    if (!authResult.isAuthenticated) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    /* ── 3. แปลง & validate query ---------------------------------------- */
    const query = QuerySchema.parse(
      Object.fromEntries(request.nextUrl.searchParams)
    );
    // query.department เป็น string | undefined ที่ผ่านการ trim แล้ว

    /* ── 4. สร้างเงื่อนไขค้นหา ------------------------------------------ */
    const where: Record<string, unknown> = {
      EMAIL: { not: null },
      ...(query.department ? { DEPARTMENT: query.department } : {}),
    };

    /* ── 5. คิวรีฐานข้อมูล ---------------------------------------------- */
    const approvers = await prisma.tV_USERNAME.findMany({
      where,
      select: {
        ID: true,
        USERNAME: true,
        NAME: true,
        EMAIL: true,
        DEPARTMENT: true,
        FLAG: true,
      },
      orderBy: { NAME: 'asc' },
    });

    /* ── 6. ส่งคืน ------------------------------------------------------- */
    return NextResponse.json(approvers);
  } catch (err) {
    /* zod error ➜ แสดง message อ่านง่าย */
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: err.flatten().fieldErrors },
        { status: 400 }
      );
    }

    console.error('Error fetching approvers:', err);
    return handleError(err);
  }
}
