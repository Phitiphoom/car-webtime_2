// src/app/api/trips/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { verifyJwtMiddleware } from '@/lib/auth-middleware';
import { handleError } from '@/utils/error-handler';

/* ------------------------------ GET -------------------------------------- */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> } // เปลี่ยนเป็น Promise
) {
  try {
    const { id } = await params; // await เพื่อดึงค่าจริง
    const tripId = Number(id);
    if (Number.isNaN(tripId)) {
      return NextResponse.json({ error: 'Invalid trip id' }, { status: 400 });
    }
    // Fetch and enrich trip data
    const trip = await prisma.tRAVEL_DETAIL.findUnique({
      where: { TID: tripId },
      include: { items: true, drivers: true },
    });

    if (!trip) {
      return NextResponse.json({ error: 'Trip not found' }, { status: 404 });
    }

    // ดึงข้อมูลผู้ใช้สำหรับแสดงชื่อแทน ID
    let userName = trip.RECORD_BY;
    if (trip.RECORD_BY) {
      // ตรวจสอบว่า RECORD_BY เป็นตัวเลข (ID) หรือ USERNAME
      const isId = !isNaN(Number(trip.RECORD_BY));
      const user = await prisma.tV_USERNAME.findFirst({
        where: isId
          ? { ID: Number(trip.RECORD_BY) }
          : { USERNAME: trip.RECORD_BY },
        select: { NAME: true }
      });
      userName = user?.NAME || trip.RECORD_BY;
    }

    const enrichedTrip = {
      ...trip,
      DATE: trip.DATE?.toISOString(),
      TIME: trip.TIME?.toISOString(),
      CREATED_AT: trip.CREATED_AT?.toISOString(),
      UPDATED_AT: trip.UPDATED_AT?.toISOString(),
      APPROVED_AT: trip.APPROVED_AT?.toISOString(),
      deleted_at: trip.deleted_at?.toISOString(),
      RECORD_BY_NAME: userName || 'ไม่ระบุ',
    };

    return NextResponse.json(enrichedTrip);
  } catch (err) {
    console.error('GET /api/trips/[id] error:', err);
    return handleError(err);
  }
}

/* ------------------------------ PUT -------------------------------------- */
const BodySchema = z.object({
  APPROVE_STATUS: z.enum(['Approve', 'Rejected', 'Pending']).optional(),
  Approve_Email: z.string().email().optional(),
  PURPOSE: z.string().optional(),
});

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> } // เปลี่ยนเป็น Promise
) {
  try {
    const auth = await verifyJwtMiddleware(req);
    if (!auth.isAuthenticated) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { id } = await params; // await เพื่อดึง id
    const tripId = Number(id);
    if (Number.isNaN(tripId)) {
      return NextResponse.json({ error: 'Invalid trip id' }, { status: 400 });
    }

    const body = await req.json();
    const validatedBody = BodySchema.parse(body);

    const updated = await prisma.tRAVEL_DETAIL.update({
      where: { TID: tripId },
      data: {
        ...validatedBody,
        UPDATED_AT: new Date(),
        ...(validatedBody.APPROVE_STATUS === 'Approve' && {
          APPROVED_AT: new Date(),
        }),
      },
    });

    return NextResponse.json(updated);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: err.flatten().fieldErrors },
        { status: 400 }
      );
    }
    console.error('PUT /api/trips/[id] error:', err);
    return handleError(err);
  }
}
