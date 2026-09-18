import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyJwtMiddleware } from '@/lib/auth-middleware';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await verifyJwtMiddleware(request);
    if (!auth.isAuthenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const carId = Number(id);
    if (Number.isNaN(carId)) {
      return NextResponse.json({ error: 'Invalid car id' }, { status: 400 });
    }

    const car = await prisma.cAR_DETAIL.findUnique({ where: { CAR_ID: carId } });
    if (!car || car.DELETED_AT) {
      return NextResponse.json({ error: 'Car not found' }, { status: 404 });
    }

    await prisma.cAR_DETAIL.update({
      where: { CAR_ID: carId },
      data: {
        IS_ACTIVE: false,
        DELETED_AT: new Date(),
        UPDATED_AT: new Date(),
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting car:', error);
    return NextResponse.json(
      { error: 'Failed to delete car' },
      { status: 500 }
    );
  }
}
