import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAuth } from '@/server/auth/guards';
import { DriverService } from '@/server/reference-data/driver.service';
import { CreateDriverSchema } from '@/server/reference-data/driver.schema';
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
    const drivers = await DriverService.list(includeInactive);
    return NextResponse.json({ data: drivers });
  } catch (err) {
    return handleError(err);
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request);
  if (!auth.ok) return auth.response;

  try {
    const body = await request.json();
    const input = CreateDriverSchema.parse(body);
    const driver = await DriverService.create(input);
    return NextResponse.json({ data: driver }, { status: 201 });
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
