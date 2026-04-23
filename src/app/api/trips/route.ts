// File: src/app/api/trips/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { handleError } from '@/utils/error-handler';
import { verifyJwtMiddleware } from '@/lib/auth-middleware';
import { EmailService } from '@/services/email-service';
import { z } from 'zod';

// Schema for filtering trips
const filterSchema = z.object({
  carBrand: z.string().optional(),
  status: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  userId: z.string().optional(),
  department: z.string().optional(), // Changed from departmentFilter to department
  page: z.coerce.number().int().positive().default(1),
  drivers: z.array(z.object({ DRIVER_NAME: z.string() })).optional(),
  limit: z.coerce.number().int().positive().max(100).default(10),
  sortBy: z.string().optional().default('CREATED_AT'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

export async function GET(request: NextRequest) {
  try {
    // แปลงพารามิเตอร์
    const searchParams = Object.fromEntries(
      request.nextUrl.searchParams.entries()
    );

    // ตรวจสอบ authentication
    const auth = await verifyJwtMiddleware(request);
    if (!auth.isAuthenticated) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // ตรวจสอบและ validate พารามิเตอร์
    const parseResult = filterSchema.safeParse(searchParams);
    if (!parseResult.success) {
      return NextResponse.json(
        {
          error: 'Invalid filter parameters',
          details: parseResult.error.format(),
        },
        { status: 400 }
      );
    }

    const {
      carBrand,
      status,
      startDate,
      endDate,
      department,
      page,
      limit,
      sortBy,
      sortOrder,
    } = parseResult.data;

    // สร้าง where condition
    const where: Record<string, unknown> = {
      is_deleted: false,
    };

    // เพิ่มเงื่อนไขฟิลเตอร์
    if (carBrand) {
      where.CARBARND = carBrand;
    }

    if (status) {
      where.APPROVE_STATUS = status;
    }

    if (department && department !== 'all_departments') {
      where.DEPARTMENT = department;
    }

    if (startDate && endDate) {
      where.DATE = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    // คำนวณการแบ่งหน้า
    const skip = (page - 1) * limit;

    // กำหนดการเรียงลำดับ
    const orderBy = {
      [sortBy]: sortOrder,
    };

    // ดึงข้อมูล
    const [trips, totalCount] = await Promise.all([
      prisma.tRAVEL_DETAIL.findMany({
        where,
        include: { items: true, drivers: true },
        orderBy,
        skip,
        take: limit,
      }),
      prisma.tRAVEL_DETAIL.count({ where }),
    ]);

    // ดึงข้อมูลผู้ใช้สำหรับแสดงชื่อแทน ID
    const userIds = trips.map(trip => trip.RECORD_BY).filter((id): id is string => Boolean(id));

    // แยกระหว่าง ID (ตัวเลข) และ USERNAME (ข้อความ)
    const numericIds = userIds.filter(id => !isNaN(Number(id))).map(Number);
    const usernames = userIds.filter(id => isNaN(Number(id)));

    const users = await prisma.tV_USERNAME.findMany({
      where: {
        OR: [
          { ID: { in: numericIds } },
          { USERNAME: { in: usernames } }
        ]
      },
      select: {
        ID: true,
        USERNAME: true,
        NAME: true
      }
    });

    // สร้าง map ที่รองรับทั้ง ID และ USERNAME
    const userMap = new Map<string, string>();
    users.forEach(user => {
      userMap.set(String(user.ID), user.NAME);
      userMap.set(user.USERNAME, user.NAME);
    });

    // แปลงข้อมูล
    const enrichedTrips = trips.map((trip) => ({
      ...trip,
      DATE: trip.DATE?.toISOString(),
      TIME: trip.TIME?.toISOString(),
      CREATED_AT: trip.CREATED_AT?.toISOString(),
      UPDATED_AT: trip.UPDATED_AT?.toISOString(),
      APPROVED_AT: trip.APPROVED_AT?.toISOString(),
      deleted_at: trip.deleted_at?.toISOString(),
      RECORD_BY_NAME: userMap.get(trip.RECORD_BY || '') || trip.RECORD_BY || 'ไม่ระบุ',
    }));

    // ส่งผลลัพธ์
    return NextResponse.json({
      data: enrichedTrips,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
        hasNext: page * limit < totalCount,
        hasPrev: page > 1,
      },
      filter: {
        carBrand,
        status,
        startDate,
        endDate,
        department,
      },
    });
  } catch (error) {
    console.error('Error fetching trips:', error);
    return handleError(error);
  }
}

// Schema for creating a trip
const tripCreateSchema = z.object({
  START_POINT: z.string().min(1, 'Start point is required'),
  END_POINT: z.string().min(1, 'End point is required'),
  CARBARND: z.string().min(1, 'Vehicle is required'),
  DATE: z
    .string()
    .refine((val) => !isNaN(Date.parse(val)), 'Invalid date format'),
  TIME: z.string().optional(),
  PURPOSE: z.string().optional(),
  PURPOSE_TEXT: z.string().optional(),
  REMARK: z.string().optional(),
  DEPARTMENT: z.string().optional(),
  RECORD_BY: z.string().optional(),
  Approve_Email: z.string().email().optional(),
  items: z
    .array(z.object({ START_POINT: z.string(), END_POINT: z.string() }))
    .optional(),
  drivers: z.array(z.object({ DRIVER_NAME: z.string() })).optional(),
});

export async function POST(request: NextRequest) {
  try {
    // Authenticate
    const authResult = await verifyJwtMiddleware(request);
    if (!authResult.isAuthenticated) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Parse body
    const body = await request.json();
    const parseResult = tripCreateSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: 'Invalid input data', details: parseResult.error.format() },
        { status: 400 }
      );
    }
    const validated = parseResult.data;

    // Convert dates
    const tripDate = new Date(validated.DATE);
    const tripTime = validated.TIME ? new Date(validated.TIME) : null;

    // Transaction to create trip, items, drivers
    const createdTrip = await prisma.$transaction(async (tx) => {
      // Create main trip record
      const tripData = {
        START_POINT: validated.START_POINT,
        END_POINT: validated.END_POINT,
        CARBARND: validated.CARBARND,
        DATE: tripDate,
        TIME: tripTime,
        RECORD_BY: authResult.user?.id || validated.RECORD_BY,
        DEPARTMENT: validated.DEPARTMENT || authResult.user?.department,
        PURPOSE: validated.PURPOSE,
        PURPOSE_TEXT: validated.PURPOSE_TEXT,
        REMARK: validated.REMARK,
        APPROVE_STATUS: 'Pending',
        CREATED_AT: new Date(),
        UPDATED_AT: new Date(),
        is_deleted: false,
        Approve_Email: validated.Approve_Email,
      };

      const newTrip = await tx.tRAVEL_DETAIL.create({ data: tripData });

      // Create additional stops (items)
      if (validated.items?.length) {
        await Promise.all(
          validated.items.map((item) =>
            tx.tRAVEL_DETAIL_ITEMS.create({
              data: {
                TID: newTrip.TID,
                START_POINT: item.START_POINT,
                END_POINT: item.END_POINT,
              },
            })
          )
        );
      }

      // Create drivers
      if (validated.drivers?.length) {
        await Promise.all(
          validated.drivers.map((driver) =>
            tx.tRAVEL_DRIVERS.create({
              data: {
                TID: newTrip.TID,
                DRIVER_NAME: driver.DRIVER_NAME,  // ใช้ค่า DRIVER_NAME จาก request มาเซฟ
              },
            })
          )
        );
      }

      // Fetch the complete trip with related data
      const complete = await tx.tRAVEL_DETAIL.findUnique({
        where: { TID: newTrip.TID },
        include: { items: true, drivers: true },
      });

      return complete!;
    });

    if (!createdTrip) {
      throw new Error('Failed to create trip');
    }

    // Normalize data for response
    const modifiedTrip = {
      ...createdTrip,
      DATE: createdTrip.DATE?.toISOString(),
      TIME: createdTrip.TIME?.toISOString(),
      CREATED_AT: createdTrip.CREATED_AT?.toISOString(),
      UPDATED_AT: createdTrip.UPDATED_AT?.toISOString(),
      items: createdTrip.items.map((it) => ({
        ...it,
        TID: it.TID ?? undefined,
      })),
      drivers: createdTrip.drivers.map((d) => ({
        ...d,
        TID: d.TID ?? undefined,
      })),
    };

    // Send approval email if specified
    if (validated.Approve_Email) {
      let approverName = '';
      try {
        const approver = await prisma.tV_USERNAME.findFirst({
          where: { EMAIL: validated.Approve_Email },
          select: { NAME: true },
        });
        approverName = approver?.NAME || '';
      } catch {
        // ignore error looking up approver name
      }

      try {
        await EmailService.sendApprovalRequest(
          modifiedTrip,
          validated.Approve_Email,
          approverName
        );
      } catch (err) {
        console.error('Error sending approval email:', err);
        // Don't fail the request if email fails
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Trip created successfully',
      data: modifiedTrip,
    });
  } catch (error) {
    console.error('Error creating trip:', error);
    return handleError(error);
  }
}
