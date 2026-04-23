import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyJwtMiddleware } from '@/lib/auth-middleware';

export async function GET(request: NextRequest) {
  try {
    const auth = await verifyJwtMiddleware(request);
    if (!auth.isAuthenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const drivers = await prisma.dRIVER_DETAIL.findMany({
      where: {
        IS_ACTIVE: true,
        DELETED_AT: null,
      },
      orderBy: {
        DRIVER_NAME: 'asc',
      },
    });

    return NextResponse.json({ data: drivers });
  } catch (error) {
    console.error('Error fetching drivers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch drivers' },
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
    const driver = await prisma.dRIVER_DETAIL.create({
      data: {
        DRIVER_NAME: data.driverName,
        DRIVER_CODE: data.driverCode,
        DEPARTMENT: data.department,
        LICENSE_NUMBER: data.licenseNumber,
        PHONE: data.phone,
        EMAIL: data.email,
        CREATED_AT: new Date(),
        UPDATED_AT: new Date(),
      },
    });

    return NextResponse.json({ data: driver });
  } catch (error) {
    console.error('Error creating driver:', error);
    return NextResponse.json(
      { error: 'Failed to create driver' },
      { status: 500 }
    );
  }
}
