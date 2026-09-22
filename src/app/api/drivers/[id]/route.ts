import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/server/auth/guards';
import { DriverService } from '@/server/reference-data/driver.service';
import { handleError } from '@/utils/error-handler';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireRole(request, ['ADMIN']);
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const driverId = Number(id);
  if (Number.isNaN(driverId)) {
    return NextResponse.json({ error: 'Invalid driver id' }, { status: 400 });
  }

  try {
    await DriverService.deactivate(driverId);
    return NextResponse.json({ success: true });
  } catch (err) {
    return handleError(err);
  }
}
