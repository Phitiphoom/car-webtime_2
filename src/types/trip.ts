// src/types/trip.ts
//
// The rest of this file's old content (Trip, Driver, TripFilters,
// TripStats, TripCreatePayload, TripUpdatePayload, ApprovalPayload) was the
// hand-maintained, drifted DTO set the rebuild replaced — trip shapes now
// come from src/server/trips/trip.mapper.ts's TripDTO (Prisma-derived,
// camelCase), and request/response types are inferred from
// src/server/trips/trip.schema.ts's Zod schemas. Only PaginationMeta is
// still a plain shared type, since it isn't domain-specific.
export interface PaginationMeta {
  page: number;
  limit: number;
  totalCount: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}
