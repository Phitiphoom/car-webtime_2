// src/server/auth/approval-token.ts
//
// Replaces the old unsigned base64 `tripId:action` token used by the
// email-approval link (GET /api/trips/approve) — that token was just
// Buffer.from('42:approve').toString('base64'), trivially forgeable by
// anyone who could guess a trip id, with no expiry and no single-use
// guarantee. This issues a signed, expiring JWT and records its `jti` in the
// ApprovalToken table so it can be marked used and rejected on replay.
import { SignJWT, jwtVerify } from 'jose';
import { randomUUID } from 'crypto';
import { Prisma } from '@prisma/client';
import prisma from '@/lib/prisma';
import { env } from '@/env';
import { ApprovalAction, ApprovalActionSchema } from '@/server/shared/enums';

const APPROVAL_TOKEN_TTL_SECONDS = 60 * 60 * 24 * 3; // 3 days — long enough for an approver to act on an email

function secretKey() {
  return new TextEncoder().encode(env.APPROVAL_TOKEN_SECRET);
}

export async function issueApprovalToken(
  tripId: number,
  action: ApprovalAction,
  approverEmail?: string
) {
  const jti = randomUUID();
  const expiresAt = new Date(Date.now() + APPROVAL_TOKEN_TTL_SECONDS * 1000);

  await prisma.approvalToken.create({
    data: {
      jti,
      tripId,
      action,
      expiresAt,
      approverEmail: approverEmail?.toLowerCase(),
    },
  });

  const token = await new SignJWT({ tripId, action })
    .setProtectedHeader({ alg: 'HS256' })
    .setJti(jti)
    .setIssuedAt()
    .setExpirationTime(Math.floor(expiresAt.getTime() / 1000))
    .sign(secretKey());

  return token;
}

export interface VerifiedApprovalToken {
  tripId: number;
  action: ApprovalAction;
  jti: string;
  approverEmail: string | null;
}

/** Thrown when a link was already used (by this or another approver). */
export class ApprovalLinkUsedError extends Error {
  constructor(public tripId: number) {
    super('Approval link has already been used');
  }
}

/**
 * Verifies signature, expiry and that the link is still unused — WITHOUT
 * consuming it. Consumption happens inside the same DB transaction as the
 * status change (see TripService.setApprovalStatus / claimApprovalToken), so
 * a failed save never burns the approver's link.
 */
export async function verifyApprovalToken(
  token: string
): Promise<VerifiedApprovalToken> {
  const { payload } = await jwtVerify(token, secretKey());

  const jti = payload.jti;
  const tripId = payload.tripId;
  const action = ApprovalActionSchema.parse(payload.action);
  if (typeof jti !== 'string' || typeof tripId !== 'number') {
    throw new Error('Invalid approval token payload');
  }

  const record = await prisma.approvalToken.findUnique({ where: { jti } });
  if (!record) throw new Error('Approval token not recognized');
  if (record.usedAt) throw new ApprovalLinkUsedError(tripId);
  if (record.expiresAt < new Date())
    throw new Error('Approval link has expired');

  return { tripId, action, jti, approverEmail: record.approverEmail };
}

/**
 * Atomically claims a token (usedAt set only if still null). Call inside the
 * transaction that records the decision.
 */
export async function claimApprovalToken(
  tx: Prisma.TransactionClient,
  jti: string,
  tripId: number
) {
  const claimed = await tx.approvalToken.updateMany({
    where: { jti, usedAt: null },
    data: { usedAt: new Date() },
  });
  if (claimed.count === 0) throw new ApprovalLinkUsedError(tripId);
}
