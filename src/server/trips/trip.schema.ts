// src/server/trips/trip.schema.ts
import { z } from 'zod';
import { TripStatusSchema } from '@/server/shared/enums';

export const TripFilterSchema = z.object({
  carBrand: z.string().optional(),
  status: TripStatusSchema.optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  department: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  sortBy: z.enum(['createdAt', 'date']).optional().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});
export type TripFilterInput = z.infer<typeof TripFilterSchema>;

export const CreateTripSchema = z.object({
  startPoint: z.string().min(1, 'Start point is required'),
  endPoint: z.string().min(1, 'End point is required'),
  // A trip books a specific vehicle (CarDetail), not just a brand name — see
  // the note on Trip.carId in prisma/schema.prisma.
  carId: z.number().int().positive('Please select a car'),
  date: z
    .string()
    .refine((val) => !isNaN(Date.parse(val)), 'Invalid date format'),
  time: z.string().optional(),
  purpose: z.string().optional(),
  purposeText: z.string().optional(),
  remark: z.string().optional(),
  // Must be one of the official departments (checked server-side too).
  department: z.string().trim().min(1, 'กรุณาเลือกแผนก'),
  // Any one of these approvers can settle the trip (first decision wins).
  approverEmails: z
    .array(z.string().trim().email('อีเมลผู้อนุมัติไม่ถูกต้อง'))
    .max(10)
    .optional(),
  items: z
    .array(z.object({ startPoint: z.string(), endPoint: z.string() }))
    .optional(),
  driverIds: z.array(z.number().int()).optional(),
});
export type CreateTripInput = z.infer<typeof CreateTripSchema>;

export const UpdateTripDetailsSchema = z.object({
  purpose: z.string().optional(),
});
export type UpdateTripDetailsInput = z.infer<typeof UpdateTripDetailsSchema>;

export const SetApprovalStatusSchema = z.object({
  status: z.enum(['APPROVED', 'REJECTED']),
});
export type SetApprovalStatusInput = z.infer<typeof SetApprovalStatusSchema>;

export const SendApprovalSchema = z.object({
  approverEmails: z
    .array(z.string().trim().email('อีเมลผู้อนุมัติไม่ถูกต้อง'))
    .min(1)
    .max(10),
});
export type SendApprovalInput = z.infer<typeof SendApprovalSchema>;
