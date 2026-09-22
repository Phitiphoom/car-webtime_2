import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/server/auth/guards';
import { CarService } from '@/server/reference-data/car.service';
import { handleError } from '@/utils/error-handler';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireRole(request, ['ADMIN']);
  if (!auth.ok) return auth.response;

  const id = Number((await params).id);
  if (Number.isNaN(id)) {
    return NextResponse.json({ error: 'Invalid car id' }, { status: 400 });
  }

  try {
    await CarService.restore(id);
    return NextResponse.json({ success: true });
  } catch (err) {
    return handleError(err);
  }
}
