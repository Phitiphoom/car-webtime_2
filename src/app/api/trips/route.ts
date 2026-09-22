// src/app/api/trips/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAuth } from '@/server/auth/guards';
import { TripService } from '@/server/trips/trip.service';
import { CreateTripSchema, TripFilterSchema } from '@/server/trips/trip.schema';
import { handleError } from '@/utils/error-handler';

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);
  if (!auth.ok) return auth.response;

  try {
    const searchParams = Object.fromEntries(
      request.nextUrl.searchParams.entries()
    );
    const filters = TripFilterSchema.parse(searchParams);
    const result = await TripService.list(filters);
    return NextResponse.json(result);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid filter parameters', details: err.format() },
        { status: 400 }
      );
    }
    return handleError(err);
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request);
  if (!auth.ok) return auth.response;

  try {
    const body = await request.json();
    const input = CreateTripSchema.parse(body);
    const trip = await TripService.create(input, auth.user.id);
    return NextResponse.json({
      success: true,
      message: 'Trip created successfully',
      data: trip,
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input data', details: err.format() },
        { status: 400 }
      );
    }
    return handleError(err);
  }
}
