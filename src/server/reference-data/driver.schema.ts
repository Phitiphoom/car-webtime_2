// src/server/reference-data/driver.schema.ts
import { z } from 'zod';

export const CreateDriverSchema = z.object({
  driverCode: z.string().trim().optional(),
  driverName: z.string().trim().min(1, 'driverName is required'),
  department: z.string().trim().optional(),
  licenseNumber: z.string().trim().optional(),
  phone: z.string().trim().optional(),
  email: z.string().email().optional(),
});
export type CreateDriverInput = z.infer<typeof CreateDriverSchema>;
