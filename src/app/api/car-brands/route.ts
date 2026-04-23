/* -------------------------------------------------------------------------- */
/*  src/app/api/car-brands/route.ts                                           */
/* -------------------------------------------------------------------------- */
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import prisma from '@/lib/prisma';
import { verifyJwtMiddleware } from '@/lib/auth-middleware';
import { handleError } from '@/utils/error-handler';

/* ── zod schema ------------------------------------------------------------ */
const NewBrandSchema = z.object({
  brand: z
    .string()
    .trim()
    .min(1, 'brand is required')
    .max(60, 'brand must be at most 60 characters'),
});

/* -------------------------------------------------------------------------- */
/*  GET – list distinct car brands                                            */
/* -------------------------------------------------------------------------- */
export async function GET(request: NextRequest) {
  try {
    /* auth guard */
    const auth = await verifyJwtMiddleware(request);
    if (!auth.isAuthenticated)
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );

    /* ดึงข้อมูลจากตาราง CAR_DETAIL แทน */
    const cars = await prisma.cAR_DETAIL.findMany({
      where: {
        IS_ACTIVE: true,
        DELETED_AT: null,
      },
      orderBy: { BRAND: 'asc' },
    });

    /* แปลงข้อมูลให้อยู่ในรูปแบบที่ต้องการ */
    const carOptions = cars.map(
      (car) => `${car.BRAND} ${car.MODEL} (${car.PLATE_NUMBER})`
    );

    console.log('Cars from database:', cars);
    console.log('Car brands returned from API:', carOptions);

    return NextResponse.json(carOptions);
  } catch (err) {
    console.error('Error fetching car brands:', err);
    return handleError(err);
  }
}

/* -------------------------------------------------------------------------- */
/*  POST – add brand (admin only)                                             */
/* -------------------------------------------------------------------------- */
export async function POST(request: NextRequest) {
  try {
    /* auth guard */
    const auth = await verifyJwtMiddleware(request);
    if (!auth.isAuthenticated)
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );

    if (auth.user?.role !== 'admin')
      return NextResponse.json(
        { error: 'Admin permission required' },
        { status: 403 }
      );

    /* validate body */
    const body = await request.json();
    const { brand } = NewBrandSchema.parse(body);

    /* write dummy row so brand appears in distinct list */
    await prisma.tRAVEL_DETAIL.create({
      data: {
        CARBARND: brand,
        START_POINT: 'Car Brand Registration',
        END_POINT: 'Car Brand Registration',
        DATE: new Date(),
        RECORD_BY: auth.user?.id ?? undefined,
        is_deleted: true,
        deleted_at: new Date(),
      },
    });

    /* fetch updated list */
    const rows = await prisma.tRAVEL_DETAIL.findMany({
      where: { CARBARND: { not: '' } },
      select: { CARBARND: true },
      distinct: ['CARBARND'],
      orderBy: { CARBARND: 'asc' },
    });
    const brands = rows.map((r) => r.CARBARND).filter(Boolean) as string[];

    return NextResponse.json({
      success: true,
      message: 'Car brand added successfully',
      carBrands: brands,
    });
  } catch (err) {
    if (err instanceof z.ZodError)
      return NextResponse.json(
        { error: err.flatten().fieldErrors },
        { status: 400 }
      );

    console.error('Error adding car brand:', err);
    return handleError(err);
  }
}
