// src/app/api/car-brands/route.ts
//
// Read-only — brands are created implicitly (upsert-by-name) when an admin
// adds a car with a new brand name (see CarService.create). There's no
// standalone "add brand" UI, so no POST handler here.
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/server/auth/guards';
import { CarBrandService } from '@/server/reference-data/car-brand.service';
import { handleError } from '@/utils/error-handler';

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);
  if (!auth.ok) return auth.response;

  try {
    const brands = await CarBrandService.list();
    return NextResponse.json(brands);
  } catch (err) {
    return handleError(err);
  }
}
