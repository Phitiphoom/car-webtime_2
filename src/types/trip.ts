// src/types/trip.ts
interface TripItem {
  TID?: number;
  START_POINT?: string | null;
  END_POINT?: string | null;
  ITEM_ID: number;
}

export interface Driver {
  DriverID: number;
  TID?: number;
  DRIVER_NAME: string;
}

export interface Trip {
  TID: number;
  START_POINT: string;
  END_POINT: string;
  CARBARND: string;
  REMARK?: string | null;
  TIME?: Date | string | null;
  DATE: Date | string;
  RECORD_BY?: string | null;
  RECORD_BY_NAME?: string | null;
  APPROVED_BY?: string | null;
  CREATED_AT?: Date | string | null;
  UPDATED_AT?: Date | string | null;
  is_deleted?: boolean | null;
  deleted_at?: Date | string | null;
  APPROVE_STATUS?: string | null;
  LOCATIONS?: string | null;
  APPROVED_AT?: Date | string | null;
  Approve_Email?: string | null;
  PURPOSE?: string | null;
  PURPOSE_TEXT?: string | null;
  DEPARTMENT?: string | null;
  items?: TripItem[];

  drivers?: Driver[];
}

export interface TripFilters {
  search: string;
  carBrand?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  userId?: string;
  department?: string;
}

// เพิ่มอินเตอร์เฟสใหม่สำหรับ pagination
export interface PaginationOptions {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginationMeta {
  page: number;
  limit: number;
  totalCount: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// อินเตอร์เฟสสำหรับการตอบกลับแบบมี pagination
export interface ApiResponse<T> {
  data: T;
  pagination: PaginationMeta;
  filter?: TripFilters;
}

export interface TripStats {
  totalTrips: number;
  period: {
    start: Date | string;
    end: Date | string;
    type: string;
  };
  byStatus: {
    status: string;
    count: number;
  }[];
  byCarBrand: {
    carBrand: string;
    count: number;
  }[];
  byPurpose: {
    purpose: string;
    count: number;
  }[];
  byDepartment: {
    department: string;
    count: number;
  }[];
  timeSeriesData: {
    date_group: string;
    count: number;
  }[];
}

// เพิ่มสำหรับการสร้างการเดินทางใหม่
export interface TripCreatePayload {
  START_POINT: string;
  END_POINT: string;
  CARBARND: string;
  DATE: Date | string;
  TIME?: Date | string | null;
  RECORD_BY?: string;
  DEPARTMENT?: string;
  PURPOSE?: string;
  PURPOSE_TEXT?: string;
  REMARK?: string;
  Approve_Email?: string;
  items?: Array<{
    START_POINT: string;
    END_POINT: string;
  }>;
  drivers?: Array<{
    DRIVER_NAME: string;
  }>;
}

// สำหรับการอัปเดตการเดินทาง
export interface TripUpdatePayload {
  START_POINT?: string;
  END_POINT?: string;
  CARBARND?: string;
  DATE?: Date | string;
  TIME?: Date | string | null;
  DEPARTMENT?: string;
  PURPOSE?: string;
  PURPOSE_TEXT?: string;
  REMARK?: string;
  APPROVE_STATUS?: string;
  APPROVED_BY?: string;
  APPROVED_AT?: Date | string;
  Approve_Email?: string;
  items?: Array<{
    ITEM_ID?: number;
    START_POINT: string;
    END_POINT: string;
  }>;
  drivers?: Array<{
    DriverID?: number;
    DRIVER_NAME: string;
  }>;
}

// อินเตอร์เฟสสำหรับการอนุมัติ
export interface ApprovalPayload {
  TID: number;
  status: 'approve' | 'reject';
  notes?: string;
  approvedBy: string;
}
