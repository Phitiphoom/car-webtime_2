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
    const driverId = Number(id);
    if (Number.isNaN(driverId)) {
      return NextResponse.json({ error: 'Invalid driver id' }, { status: 400 });
    }

    const driver = await prisma.dRIVER_DETAIL.findUnique({
      where: { DRIVER_ID: driverId },
    });
    if (!driver || driver.DELETED_AT) {
      return NextResponse.json({ error: 'Driver not found' }, { status: 404 });
    }

    await prisma.dRIVER_DETAIL.update({
      where: { DRIVER_ID: driverId },
      data: {
        IS_ACTIVE: false,
        DELETED_AT: new Date(),
        UPDATED_AT: new Date(),
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting driver:', error);
    return NextResponse.json(
      { error: 'Failed to delete driver' },
      { status: 500 }
    );
  }
}
