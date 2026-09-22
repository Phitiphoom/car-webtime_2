// src/app/api/trips/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAuth, requireRole } from '@/server/auth/guards';
import { TripService } from '@/server/trips/trip.service';
import {
  UpdateTripDetailsSchema,
  SetApprovalStatusSchema,
} from '@/server/trips/trip.schema';
import { handleError } from '@/utils/error-handler';

function parseId(idStr: string) {
  const id = Number(idStr);
  return Number.isNaN(id) ? null : id;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth(request);
  if (!auth.ok) return auth.response;

  const id = parseId((await params).id);
  if (id === null)
    return NextResponse.json({ error: 'Invalid trip id' }, { status: 400 });

  try {
    const trip = await TripService.getById(id);
    if (!trip)
      return NextResponse.json({ error: 'Trip not found' }, { status: 404 });
    return NextResponse.json(trip);
  } catch (err) {
    return handleError(err);
  }
}

// Status transitions (approve/reject) require APPROVER or ADMIN — the old
// code had NO role check here at all, letting any authenticated user decide
// any trip's outcome. Editing trip details (purpose) is
// separate and open to any authenticated user, matching the old behavior.
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;

  const id = parseId((await params).id);
  if (id === null)
    return NextResponse.json({ error: 'Invalid trip id' }, { status: 400 });

  try {
    const body = await req.json();

    if ('status' in body) {
      const roleCheck = await requireRole(req, ['APPROVER', 'ADMIN']);
      if (!roleCheck.ok) return roleCheck.response;

      const { status } = SetApprovalStatusSchema.parse(body);
      const trip = await TripService.setApprovalStatus(id, status, {
        userId: roleCheck.user.id,
        role: roleCheck.user.role,
      });
      return NextResponse.json(trip);
    }

    const input = UpdateTripDetailsSchema.parse(body);
    const trip = await TripService.updateDetails(id, input);
    return NextResponse.json(trip);
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

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth(request);
  if (!auth.ok) return auth.response;

  const id = parseId((await params).id);
  if (id === null)
    return NextResponse.json({ error: 'Invalid trip id' }, { status: 400 });

  try {
    await TripService.softDelete(id);
    return NextResponse.json({ success: true });
  } catch (err) {
    return handleError(err);
  }
}
