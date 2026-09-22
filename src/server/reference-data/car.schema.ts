// src/server/reference-data/car.schema.ts
import { z } from 'zod';

export const CreateCarSchema = z.object({
  carCode: z.string().trim().optional(),
  brand: z.string().trim().min(1, 'brand is required'),
  model: z.string().trim().min(1, 'model is required'),
  plateNumber: z.string().trim().min(1, 'plateNumber is required'),
  color: z.string().trim().optional(),
  year: z.number().int().optional(),
  status: z.string().trim().optional(),
});
export type CreateCarInput = z.infer<typeof CreateCarSchema>;
