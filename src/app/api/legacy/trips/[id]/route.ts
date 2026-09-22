// src/app/api/legacy/trips/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/server/auth/guards';
import { LegacyTripService } from '@/server/legacy/legacy-trip.service';
import { handleError } from '@/utils/error-handler';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth(request);
  if (!auth.ok) return auth.response;

  const id = Number((await params).id);
  if (!Number.isInteger(id)) {
    return NextResponse.json({ error: 'Invalid trip id' }, { status: 400 });
  }

  try {
    const trip = await LegacyTripService.getById(id);
    if (!trip)
      return NextResponse.json({ error: 'Trip not found' }, { status: 404 });
    return NextResponse.json(trip);
  } catch (err) {
    return handleError(err);
  }
}
