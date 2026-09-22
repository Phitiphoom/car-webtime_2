// src/server/shared/enums.ts
//
// SQL Server has no native enum type, so Prisma's `enum` isn't usable on
// this connector (role/status/action are plain VarChar columns in
// schema.prisma). These const arrays + Zod schemas are the single source of
// truth for the valid values instead — every read/write of role, trip
// status, or approval action should go through these types, not a raw
// string literal. This is the fix for the old bug where trip status had
// three different casings ('Pending'/'Approve'/'Rejected' in the DB,
// 'approve'/'reject' in the email-token flow, 'approved'/'rejected' in
// EmailService) because nothing enforced one canonical spelling.
import { z } from 'zod';

export const ROLES = ['ADMIN', 'APPROVER', 'USER'] as const;
export const RoleSchema = z.enum(ROLES);
export type Role = z.infer<typeof RoleSchema>;

export const TRIP_STATUSES = [
  'PENDING',
  'APPROVED',
  'REJECTED',
  'CANCELLED',
] as const;
export const TripStatusSchema = z.enum(TRIP_STATUSES);
export type TripStatus = z.infer<typeof TripStatusSchema>;

export const APPROVAL_ACTIONS = ['APPROVE', 'REJECT'] as const;
export const ApprovalActionSchema = z.enum(APPROVAL_ACTIONS);
export type ApprovalAction = z.infer<typeof ApprovalActionSchema>;
