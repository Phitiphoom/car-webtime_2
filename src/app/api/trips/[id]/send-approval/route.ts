// src/app/api/trips/[id]/send-approval/route.ts
//
// Adds approvers to a pending trip and emails each one their own
// approve/reject links. Approvers already on the trip are re-sent a fresh
// email (a reminder) rather than duplicated.
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAuth } from '@/server/auth/guards';
import { TripService } from '@/server/trips/trip.service';
import { SendApprovalSchema } from '@/server/trips/trip.schema';
import { handleError } from '@/utils/error-handler';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth(request);
  if (!auth.ok) return auth.response;

  try {
    const { id: idStr } = await params;
    const tripId = Number(idStr);
    if (Number.isNaN(tripId)) {
      return NextResponse.json({ error: 'Invalid trip id' }, { status: 400 });
    }

    const { approverEmails } = SendApprovalSchema.parse(await request.json());
    const emails = [...new Set(approverEmails.map((e) => e.toLowerCase()))];

    // Throws 404 / 409 (already decided) before anything is sent.
    await TripService.addApprovers(tripId, emails);

    const trip = await TripService.getById(tripId);
    if (!trip)
      return NextResponse.json({ error: 'Trip not found' }, { status: 404 });

    const results = await TripService.notifyApprovers(trip, emails);
    if (results.every((r) => !r.success)) {
      return NextResponse.json(
        { success: false, error: 'ส่งอีเมลไม่สำเร็จ', results },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, results });
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
