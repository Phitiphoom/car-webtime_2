import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAuth } from '@/server/auth/guards';
import { CarService } from '@/server/reference-data/car.service';
import { CreateCarSchema } from '@/server/reference-data/car.schema';
import { handleError } from '@/utils/error-handler';

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);
  if (!auth.ok) return auth.response;

  try {
    // Only admins may ask for deactivated rows (admin screens); everyone
    // else — including the trip form — only ever sees active ones.
    const includeInactive =
      auth.user.role === 'ADMIN' &&
      request.nextUrl.searchParams.get('includeInactive') === '1';
    const cars = await CarService.list(includeInactive);
    return NextResponse.json({ data: cars });
  } catch (err) {
    return handleError(err);
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request);
  if (!auth.ok) return auth.response;

  try {
    const body = await request.json();
    const input = CreateCarSchema.parse(body);
    const car = await CarService.create(input);
    return NextResponse.json({ data: car }, { status: 201 });
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
