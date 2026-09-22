// src/server/stats/car-usage.schema.ts
import { z } from 'zod';

export const CarUsageQuerySchema = z.object({
  period: z.enum(['day', 'week', 'month', 'year']).default('month'),
  startDate: z.preprocess(
    (v) => (typeof v === 'string' && v.trim() ? new Date(v) : undefined),
    z.date().optional()
  ),
  endDate: z.preprocess(
    (v) => (typeof v === 'string' && v.trim() ? new Date(v) : undefined),
    z.date().optional()
  ),
});
export type CarUsageQuery = z.infer<typeof CarUsageQuerySchema>;
