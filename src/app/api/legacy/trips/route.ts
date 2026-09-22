// src/app/api/legacy/trips/route.ts
//
// Read-only list of the OLD trips (see LegacyTripService). GET only — there is
// deliberately no way to create, edit, approve or delete legacy data.
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAuth } from '@/server/auth/guards';
import { LegacyTripService } from '@/server/legacy/legacy-trip.service';
import { handleError } from '@/utils/error-handler';

const QuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(25),
  search: z.string().trim().max(100).optional(),
});

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);
  if (!auth.ok) return auth.response;

  try {
    const params = QuerySchema.parse(
      Object.fromEntries(request.nextUrl.searchParams)
    );
    return NextResponse.json(await LegacyTripService.list(params));
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid parameters' },
        { status: 400 }
      );
    }
    return handleError(err);
  }
}
