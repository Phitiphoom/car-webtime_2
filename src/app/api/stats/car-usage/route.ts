import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAuth } from '@/server/auth/guards';
import { CarUsageStatsService } from '@/server/stats/car-usage.service';
import { CarUsageQuerySchema } from '@/server/stats/car-usage.schema';
import { handleError } from '@/utils/error-handler';

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);
  if (!auth.ok) return auth.response;

  try {
    const query = CarUsageQuerySchema.parse(
      Object.fromEntries(request.nextUrl.searchParams)
    );
    const stats = await CarUsageStatsService.getStats(query, auth.user);
    return NextResponse.json(stats);
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
