import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import prisma from '@/lib/prisma';
import { verifyJwtMiddleware } from '@/lib/auth-middleware';
import { EmailService } from '@/services/email-service';
import { handleError } from '@/utils/error-handler';
import type { Trip } from '@/types/trip';

// Define a minimal RawTrip type to avoid using any
interface RawTrip {
  items: Array<{
    TID?: number | null;
    START_POINT?: string | null;
    END_POINT?: string | null;
    [key: string]: unknown;
  }>;
  drivers: Array<{
    TID?: number | null;
    [key: string]: unknown;
  }>;
  APPROVE_STATUS?: string;
  RECORD_BY?: string;
  [key: string]: unknown;
}

/* ---------------- zod schemas ---------------- */
const ParamSchema = z.object({
  id: z.string().regex(/^\d+$/, 'id must be number'),
});
const BodySchema = z.object({
  approverEmail: z.string().email('approverEmail must be a valid email'),
  additionalApprovers: z.array(z.string().email()).optional(),
});

// Normalize raw trip data using a proper type instead of any
function normalizeTrip(raw: RawTrip): Trip {
  return {
    ...raw,
    items: raw.items.map((i) => ({
      ...i,
      TID: i.TID ?? undefined,
      START_POINT: i.START_POINT ?? undefined,
      END_POINT: i.END_POINT ?? undefined,
    })),
    drivers: raw.drivers.map((d) => ({
      ...d,
      TID: d.TID ?? undefined,
    })),
  } as Trip;
}

/*  POST – send approval email  */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // ── auth guard ───────────────────────────────────
    const auth = await verifyJwtMiddleware(request);
    if (!auth.isAuthenticated) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // ── validate params / body ───────────────────────
    const { id: idStr } = ParamSchema.parse(await params); // await params then parse
    const { approverEmail, additionalApprovers } = BodySchema.parse(
      await request.json()
    );
    const tripId = Number(idStr);

    // ── fetch trip ────────────────────────────────────
    const rawTrip = await prisma.tRAVEL_DETAIL.findFirst({
      where: { TID: tripId, is_deleted: false },
      include: { items: true, drivers: true },
    });
    if (!rawTrip) {
      return NextResponse.json({ error: 'Trip not found' }, { status: 404 });
    }
    if (rawTrip.APPROVE_STATUS && rawTrip.APPROVE_STATUS !== 'Pending') {
      return NextResponse.json(
        { error: 'Trip has already been approved or rejected' },
        { status: 400 }
      );
    }

    // ── update approver email ────────────────────────
    await prisma.tRAVEL_DETAIL.update({
      where: { TID: tripId },
      data: { Approve_Email: approverEmail, UPDATED_AT: new Date() },
    });

    // ── lookup approver name ──────────────────────────
    const approver = await prisma.tV_USERNAME.findFirst({
      where: { EMAIL: approverEmail },
      select: { NAME: true },
    });
    const approverName = approver?.NAME ?? '';

    // ── normalize & send email ───────────────────────
    const trip = normalizeTrip(rawTrip as RawTrip);
    const emailSent = await EmailService.sendApprovalRequest(
      trip,
      approverEmail,
      approverName
    );

    // ── send to additional approvers (if any) ─────────
    let additionalEmailResults: (
      | { email: string; success: boolean; error?: undefined }
      | { email: string; success: boolean; error: string }
    )[] = [];
    if (additionalApprovers && additionalApprovers.length > 0) {
      // ดึงชื่อผู้อนุมัติเพิ่มเติม
      const additionalNames = await prisma.tV_USERNAME.findMany({
        where: { EMAIL: { in: additionalApprovers } },
        select: { EMAIL: true, NAME: true },
      });

      // สร้าง map ชื่อ - อีเมล
      const nameMap = new Map<string, string>();
      additionalNames.forEach((user) => {
        nameMap.set(user.EMAIL || '', user.NAME || '');
      });

      // ส่งอีเมลหาผู้อนุมัติเพิ่มเติมแต่ละคน
      additionalEmailResults = await Promise.all(
        additionalApprovers.map(async (email) => {
          try {
            const name = nameMap.get(email) || '';
            const sent = await EmailService.sendApprovalRequest(
              trip,
              email,
              name
            );
            return { email, success: sent };
          } catch (err) {
            console.error(`Error sending approval email to ${email}:`, err);
            return {
              email,
              success: false,
              error: err instanceof Error ? err.message : 'Unknown error',
            };
          }
        })
      );

      // บันทึกข้อมูลผู้อนุมัติเพิ่มเติมลงในระบบ (หากต้องการในอนาคต)
      // อาจจะต้องสร้างตาราง trip_approvers เพิ่มเติม
      console.log(
        'Sent approval requests to additional approvers:',
        additionalEmailResults
      );
    }

    if (!emailSent) {
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to send approval email, but approver updated',
          additionalResults: additionalEmailResults,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Approval request sent successfully',
      additionalResults: additionalEmailResults,
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: err.flatten().fieldErrors },
        { status: 400 }
      );
    }
    console.error('Error sending approval request:', err);
    return handleError(err);
  }
}
