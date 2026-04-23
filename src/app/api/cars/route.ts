import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyJwtMiddleware } from '@/lib/auth-middleware';

export async function GET(request: NextRequest) {
  try {
    const auth = await verifyJwtMiddleware(request);
    if (!auth.isAuthenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const cars = await prisma.cAR_DETAIL.findMany({
      where: {
        IS_ACTIVE: true,
        DELETED_AT: null,
      },
      orderBy: {
        BRAND: 'asc',
      },
    });

    return NextResponse.json({ data: cars });
  } catch (error) {
    console.error('Error fetching cars:', error);
    return NextResponse.json(
      { error: 'Failed to fetch cars' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await verifyJwtMiddleware(request);
    if (!auth.isAuthenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();
    const car = await prisma.cAR_DETAIL.create({
      data: {
        CAR_CODE: data.carCode,
        BRAND: data.brand,
        MODEL: data.model,
        PLATE_NUMBER: data.plateNumber,
        COLOR: data.color,
        YEAR: data.year,
        STATUS: data.status || 'Available',
        CREATED_AT: new Date(),
        UPDATED_AT: new Date(),
      },
    });

    return NextResponse.json({ data: car });
  } catch (error) {
    console.error('Error creating car:', error);
    return NextResponse.json(
      { error: 'Failed to create car' },
      { status: 500 }
    );
  }
}
