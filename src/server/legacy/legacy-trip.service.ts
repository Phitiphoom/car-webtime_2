// src/server/legacy/legacy-trip.service.ts
//
// READ-ONLY access to the old trips. The old tables are declared `@@ignore` in
// schema.prisma (so `db push` never drops them and no app code can write to
// them), which also means Prisma Client has no methods for them — raw SQL is
// the only way in, and it only ever SELECTs.
//
// The old data is kept for reference, not migrated: department, car and people
// were stored as free text and don't match the new master data.
import { Prisma } from '@prisma/client';
import prisma from '@/lib/prisma';
import type {
  LegacyTripDetail,
  LegacyTripList,
  LegacyTripRow,
} from './legacy-trip.types';

// The old RECORD_BY / APPROVED_BY hold a name, a username or an old user id;
// resolve to the old user's display name when there is one.
const rowSelect = Prisma.sql`
  SELECT
    t.TID                         AS id,
    t.START_POINT                 AS startPoint,
    t.END_POINT                   AS endPoint,
    t.CARBARND                    AS carBrand,
    t.[DATE]                      AS [date],
    t.[TIME]                      AS [time],
    t.DEPARTMENT                  AS department,
    t.APPROVE_STATUS              AS status,
    t.PURPOSE                     AS purpose,
    t.PURPOSE_TEXT                AS purposeText,
    t.REMARK                      AS remark,
    COALESCE(rb.NAME, t.RECORD_BY)    AS recordBy,
    COALESCE(ab.NAME, t.APPROVED_BY)  AS approvedBy,
    t.CREATED_AT                  AS createdAt,
    t.APPROVED_AT                 AS approvedAt,
    t.Approve_Email               AS approveEmail,
    CAST(CASE WHEN t.is_deleted = 1 THEN 1 ELSE 0 END AS bit) AS isDeleted
  FROM dbo.TRAVEL_DETAIL t
  OUTER APPLY (
    SELECT TOP 1 l.NAME FROM dbo.TV_USERNAME l
    WHERE CAST(l.ID AS nvarchar(20)) = t.RECORD_BY
       OR l.USERNAME = t.RECORD_BY OR l.NAME = t.RECORD_BY
    ORDER BY l.ID) rb
  OUTER APPLY (
    SELECT TOP 1 l.NAME FROM dbo.TV_USERNAME l
    WHERE CAST(l.ID AS nvarchar(20)) = t.APPROVED_BY
       OR l.USERNAME = t.APPROVED_BY OR l.NAME = t.APPROVED_BY
    ORDER BY l.ID) ab
`;

type RawRow = Omit<
  LegacyTripRow,
  'date' | 'time' | 'createdAt' | 'approvedAt'
> & {
  date: Date;
  time: Date | null;
  createdAt: Date | null;
  approvedAt: Date | null;
  approveEmail: string | null;
};

const iso = (d: Date | null) => (d ? d.toISOString() : null);

function toRow(r: RawRow): LegacyTripRow {
  return {
    id: r.id,
    startPoint: r.startPoint,
    endPoint: r.endPoint,
    carBrand: r.carBrand,
    date: r.date.toISOString(),
    time: iso(r.time),
    department: r.department,
    status: r.status,
    purpose: r.purpose,
    purposeText: r.purposeText,
    remark: r.remark,
    recordBy: r.recordBy,
    approvedBy: r.approvedBy,
    createdAt: iso(r.createdAt),
    approvedAt: iso(r.approvedAt),
    isDeleted: Boolean(r.isDeleted),
  };
}

export class LegacyTripService {
  static async list(params: {
    page: number;
    limit: number;
    search?: string;
  }): Promise<LegacyTripList> {
    const { page, limit } = params;
    const q = params.search?.trim();
    const like = q ? `%${q}%` : null;
    const filter = like
      ? Prisma.sql`AND (t.START_POINT LIKE ${like} OR t.END_POINT LIKE ${like}
          OR t.DEPARTMENT LIKE ${like} OR t.CARBARND LIKE ${like}
          OR t.RECORD_BY LIKE ${like} OR t.PURPOSE_TEXT LIKE ${like})`
      : Prisma.empty;
    // Trips the old system had soft-deleted stay hidden.
    const where = Prisma.sql`WHERE (t.is_deleted IS NULL OR t.is_deleted = 0) ${filter}`;

    const [rows, count] = await Promise.all([
      prisma.$queryRaw<RawRow[]>(Prisma.sql`
        ${rowSelect}
        ${where}
        ORDER BY t.TID DESC
        OFFSET ${(page - 1) * limit} ROWS FETCH NEXT ${limit} ROWS ONLY`),
      prisma.$queryRaw<{ total: number }[]>(Prisma.sql`
        SELECT COUNT(*) AS total FROM dbo.TRAVEL_DETAIL t ${where}`),
    ]);

    const totalCount = Number(count[0]?.total ?? 0);
    return {
      data: rows.map(toRow),
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
        hasNext: page * limit < totalCount,
        hasPrev: page > 1,
      },
    };
  }

  static async getById(id: number): Promise<LegacyTripDetail | null> {
    const rows = await prisma.$queryRaw<RawRow[]>(Prisma.sql`
      ${rowSelect}
      WHERE t.TID = ${id}`);
    if (rows.length === 0) return null;

    const [items, drivers] = await Promise.all([
      prisma.$queryRaw<
        { id: number; startPoint: string | null; endPoint: string | null }[]
      >(Prisma.sql`
        SELECT ITEM_ID AS id, START_POINT AS startPoint, END_POINT AS endPoint
        FROM dbo.TRAVEL_DETAIL_ITEMS WHERE TID = ${id} ORDER BY ITEM_ID`),
      prisma.$queryRaw<{ id: number; name: string }[]>(Prisma.sql`
        SELECT DriverID AS id, DRIVER_NAME AS name
        FROM dbo.TRAVEL_DRIVERS WHERE TID = ${id} ORDER BY DriverID`),
    ]);

    return {
      ...toRow(rows[0]),
      approveEmail: rows[0].approveEmail,
      items,
      drivers,
    };
  }
}
