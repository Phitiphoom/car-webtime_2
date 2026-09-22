// src/app/api/approvers/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAuth } from '@/server/auth/guards';
import { ApproverService } from '@/server/reference-data/approver.service';
import { handleError } from '@/utils/error-handler';

const QuerySchema = z.object({
  department: z
    .string()
    .trim()
    .min(1, 'department must not be empty')
    .optional(),
});

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);
  if (!auth.ok) return auth.response;

  try {
    const query = QuerySchema.parse(
      Object.fromEntries(request.nextUrl.searchParams)
    );
    const approvers = await ApproverService.list(query.department);
    return NextResponse.json(approvers);
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
