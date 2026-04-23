import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { verifyJwtMiddleware } from '@/lib/auth-middleware';
import { handleError } from '@/utils/error-handler';

// Schema สำหรับ validate query params
const QuerySchema = z.object({
  period: z.enum(['day', 'week', 'month', 'year']).default('month'),
  startDate: z.preprocess(
    (v) => (typeof v === 'string' && v.trim() ? new Date(v) : undefined),
    z.date().optional()
  ),
  endDate: z.preprocess(
    (v) => (typeof v === 'string' && v.trim() ? new Date(v) : undefined),
    z.date().optional()
  ),
});

export async function GET(request: NextRequest) {
  try {
    // ตรวจสอบการ authenticate
    const auth = await verifyJwtMiddleware(request);
    if (!auth.isAuthenticated) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Validate query params
    const query = QuerySchema.parse(
      Object.fromEntries(request.nextUrl.searchParams)
    );

    // คำนวณช่วงวันที่
    const today = new Date();
    let start: Date;
    let end: Date = query.endDate ?? today;

    if (query.startDate && query.endDate) {
      start = query.startDate;
      end = query.endDate;
    } else {
      start = new Date(end);
      switch (query.period) {
        case 'day':
          start.setHours(0, 0, 0, 0);
          break;
        case 'week':
          start.setDate(end.getDate() - 7);
          break;
        case 'month':
          start.setMonth(end.getMonth() - 1);
          break;
        case 'year':
          start.setFullYear(end.getFullYear() - 1);
          break;
      }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = { is_deleted: false, DATE: { gte: start, lte: end } };

    // ถ้าเป็น admin หรือ approver ให้ดูข้อมูลได้ตามสิทธิ์
    const { user } = auth;
    if (user?.role !== 'admin' && user?.role !== 'approver') {
      where.RECORD_BY = user?.id ?? '';
    } else if (user?.role === 'approver') {
      where.DEPARTMENT = user.department ?? '';
    }

    try {
      // ดึงข้อมูลจริงจาก database พร้อมทั้ง groupBy สำหรับการสรุปผล
      const [totalTrips, byStatus, byCar, byPurpose, byDept] =
        await Promise.all([
          prisma.tRAVEL_DETAIL.count({ where }),
          prisma.tRAVEL_DETAIL.groupBy({
            by: ['APPROVE_STATUS'],
            where,
            _count: { TID: true },
          }),
          prisma.tRAVEL_DETAIL.groupBy({
            by: ['CARBARND'],
            where,
            _count: { TID: true },
          }),
          prisma.tRAVEL_DETAIL.groupBy({
            by: ['PURPOSE'],
            where: { ...where, PURPOSE: { not: null } },
            _count: { TID: true },
          }),
          prisma.tRAVEL_DETAIL.groupBy({
            by: ['DEPARTMENT'],
            where: { ...where, DEPARTMENT: { not: null } },
            _count: { TID: true },
          }),
        ]);

      // ส่งข้อมูลกลับไป
      return NextResponse.json({
        totalTrips,
        period: { start, end, type: query.period },
        byStatus: byStatus.map((i) => ({
          status: i.APPROVE_STATUS ?? 'Unknown',
          count: i._count.TID,
        })),
        byCarBrand: byCar.map((i) => ({
          carBrand: i.CARBARND ?? 'Unknown',
          count: i._count.TID,
        })),
        byPurpose: byPurpose.map((i) => ({
          purpose: i.PURPOSE ?? 'Unknown',
          count: i._count.TID,
        })),
        byDepartment: byDept.map((i) => ({
          department: i.DEPARTMENT ?? 'Unknown',
          count: i._count.TID,
        })),
      });
    } catch (dbError) {
      console.error('Database error:', dbError);

      // ถ้าเกิดข้อผิดพลาดกับฐานข้อมูล ให้ส่งข้อมูลตัวอย่างกลับไปแทน
      return NextResponse.json({
        totalTrips: 0,
        period: { start, end, type: query.period },
        byStatus: [
          { status: 'Pending', count: 0 },
          { status: 'Approve', count: 0 },
          { status: 'Rejected', count: 0 },
        ],
        byCarBrand: [],
        byPurpose: [],
        byDepartment: [],
      });
    }
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: err.flatten().fieldErrors },
        { status: 400 }
      );
    }

    console.error('Error fetching car usage statistics:', err);
    return handleError(err);
  }
}
