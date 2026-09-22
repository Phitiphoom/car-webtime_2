// src/app/api/departments/route.ts
//
// Read-only — the list is the official one imported from SAP; nothing creates
// departments implicitly (see DepartmentService).
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/server/auth/guards';
import { DepartmentService } from '@/server/reference-data/department.service';
import { handleError } from '@/utils/error-handler';

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);
  if (!auth.ok) return auth.response;

  try {
    const departments = await DepartmentService.list();
    return NextResponse.json(departments);
  } catch (err) {
    return handleError(err);
  }
}
