// src/server/legacy/legacy-trip.types.ts
//
// Shape of the OLD trips (TRAVEL_DETAIL) as shown on the read-only "Log เก่า"
// page. Client-safe (types only). Values are exactly what the old system stored
// — free text, inconsistent spellings — and are shown as-is, not cleaned.
export interface LegacyTripRow {
  id: number;
  startPoint: string;
  endPoint: string;
  carBrand: string | null;
  date: string;
  time: string | null;
  department: string | null;
  status: string | null;
  purpose: string | null;
  purposeText: string | null;
  remark: string | null;
  recordBy: string | null;
  approvedBy: string | null;
  createdAt: string | null;
  approvedAt: string | null;
  isDeleted: boolean;
}

export interface LegacyTripDetail extends LegacyTripRow {
  approveEmail: string | null;
  items: { id: number; startPoint: string | null; endPoint: string | null }[];
  drivers: { id: number; name: string }[];
}

export interface LegacyTripList {
  data: LegacyTripRow[];
  pagination: {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}
