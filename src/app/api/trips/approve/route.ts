// src/app/api/trips/approve/route.ts
//
// Public, unauthenticated (by design — decision: approvers act via emailed
// link without logging in) but now secured by a signed, expiring,
// single-use token (src/server/auth/approval-token.ts) instead of the old
// unsigned base64 `tripId:action` string, which anyone could forge by
// computing Buffer.from('<id>:approve').toString('base64').
import { NextRequest } from 'next/server';
import {
  verifyApprovalToken,
  ApprovalLinkUsedError,
} from '@/server/auth/approval-token';
import { TripService } from '@/server/trips/trip.service';
import { logger } from '@/lib/logger';

function renderStatusPage({
  success,
  message,
  details,
  tripId,
}: {
  success: boolean;
  message: string;
  details: string;
  tripId?: number;
}): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const viewUrl = tripId
    ? `${baseUrl}/trips/${tripId}`
    : `${baseUrl}/dashboard`;

  return `
    <!DOCTYPE html>
    <html lang="th">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>ระบบจองรถยนต์ - ${success ? 'สำเร็จ' : 'ผิดพลาด'}</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; text-align: center; }
        .container { background-color: #f9f9f9; border-radius: 8px; padding: 30px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); margin-top: 50px; }
        .status-icon { font-size: 64px; margin-bottom: 20px; }
        .success { color: #4CAF50; } .error { color: #F44336; }
        .message { font-size: 24px; font-weight: 600; margin-bottom: 16px; }
        .details { margin-bottom: 30px; color: #555; }
        .button { display: inline-block; background-color: #2196F3; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: 500; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="status-icon ${success ? 'success' : 'error'}">${success ? '✓' : '✗'}</div>
        <div class="message">${message}</div>
        <div class="details">${details}</div>
        <a href="${viewUrl}" class="button">${tripId ? 'ดูรายละเอียดทริป' : 'ไปที่แดชบอร์ด'}</a>
      </div>
    </body>
    </html>
  `;
}

function htmlResponse(body: string, status: number) {
  return new Response(body, {
    status,
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token');
  if (!token) {
    return htmlResponse(
      renderStatusPage({
        success: false,
        message: 'ไม่พบ token',
        details: 'ลิงก์นี้ไม่สมบูรณ์',
      }),
      400
    );
  }

  try {
    const { tripId, action, jti, approverEmail } =
      await verifyApprovalToken(token);
    const status = action === 'APPROVE' ? 'APPROVED' : 'REJECTED';

    // The link is consumed inside the same transaction as the decision, so a
    // failed save leaves it usable. First decision wins; later links get 409.
    await TripService.setApprovalStatus(tripId, status, {
      approverEmail,
      claimJti: jti,
    });

    return htmlResponse(
      renderStatusPage({
        success: true,
        message: `ทริปได้รับการ${action === 'APPROVE' ? 'อนุมัติ' : 'ปฏิเสธ'}เรียบร้อยแล้ว`,
        details: 'ผู้ขอใช้รถจะได้รับอีเมลแจ้งผลแล้ว',
        tripId,
      }),
      200
    );
  } catch (error) {
    logger.warn({ err: error }, 'Approval token redemption failed');
    const used = error instanceof ApprovalLinkUsedError;
    const status =
      (error as { status?: number }).status === 409 || used ? 409 : 400;
    const message = used
      ? 'ลิงก์นี้ถูกใช้แล้ว หรือมีผู้อนุมัติท่านอื่นตัดสินทริปนี้ไปแล้ว'
      : error instanceof Error
        ? error.message
        : 'เกิดข้อผิดพลาด';
    return htmlResponse(
      renderStatusPage({
        success: false,
        message: 'ไม่สามารถดำเนินการได้',
        tripId: used ? (error as ApprovalLinkUsedError).tripId : undefined,
        details: message,
      }),
      status
    );
  }
}
