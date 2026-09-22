// src/server/trips/trip.service.ts
import prisma from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { toTripDTO, tripWithRelationsInclude, TripDTO } from './trip.mapper';
import { CreateTripInput, TripFilterInput } from './trip.schema';
import { Role, TripStatus } from '@/server/shared/enums';
import { DepartmentService } from '@/server/reference-data/department.service';
import { claimApprovalToken } from '@/server/auth/approval-token';
import { EmailService } from '@/services/email-service';
import { logger } from '@/lib/logger';

function notFound(message: string) {
  const err = new Error(message) as Error & { status?: number };
  err.status = 404;
  return err;
}

function badRequest(message: string) {
  const err = new Error(message) as Error & { status?: number };
  err.status = 400;
  return err;
}

/** "HH:mm" (or a full ISO string) -> Date for a SQL Time column. */
function parseTimeOfDay(value?: string): Date | null {
  if (!value) return null;
  const m = /^(\d{1,2}):(\d{2})(?::(\d{2}))?$/.exec(value.trim());
  if (m) {
    return new Date(Date.UTC(1970, 0, 1, +m[1], +m[2], +(m[3] ?? 0)));
  }
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

function httpError(status: number, message: string) {
  const err = new Error(message) as Error & { status?: number };
  err.status = status;
  return err;
}

class DecisionRaceLost extends Error {}

const normalizeEmails = (emails: string[] = []) => [
  ...new Set(emails.map((e) => e.trim().toLowerCase()).filter(Boolean)),
];

/** Who is deciding: a logged-in user, or an emailed-link recipient. */
export interface ApprovalActor {
  userId?: number;
  role?: Role;
  /** Email-link flow: the address the link was sent to. */
  approverEmail?: string | null;
  /** Email-link flow: token consumed in the same transaction as the decision. */
  claimJti?: string;
}

async function lookupNames(emails: string[]) {
  if (!emails.length) return new Map<string, string>();
  const users = await prisma.user.findMany({
    where: { email: { in: emails } },
    select: { email: true, name: true },
  });
  return new Map(
    users.filter((u) => u.email).map((u) => [u.email!.toLowerCase(), u.name])
  );
}

export class TripService {
  /** Email each approver their own approve/reject links (best effort). */
  static async notifyApprovers(dto: TripDTO, emails: string[]) {
    const names = await lookupNames(emails);
    return Promise.all(
      emails.map(async (email) => {
        try {
          const success = await EmailService.sendApprovalRequest(
            dto,
            email,
            names.get(email)
          );
          return { email, success };
        } catch (err) {
          logger.warn(
            { err, tripId: dto.id },
            'Failed to send approval request email'
          );
          return { email, success: false };
        }
      })
    );
  }

  /** Add approvers to a still-pending trip (ignores ones already listed). */
  static async addApprovers(id: number, emails: string[]) {
    const wanted = normalizeEmails(emails);
    const trip = await prisma.trip.findFirst({
      where: { id, deletedAt: null },
      include: { approvers: true },
    });
    if (!trip) throw notFound('Trip not found');
    if (trip.status !== 'PENDING') {
      throw httpError(409, 'ทริปนี้ตัดสินไปแล้ว ไม่สามารถเพิ่มผู้อนุมัติได้');
    }
    const known = new Set(trip.approvers.map((a) => a.email));
    const fresh = wanted.filter((e) => !known.has(e));
    if (fresh.length) {
      const names = await lookupNames(fresh);
      await prisma.tripApprover.createMany({
        data: fresh.map((email) => ({
          tripId: id,
          email,
          name: names.get(email) ?? null,
        })),
      });
    }
  }

  static async list(filters: TripFilterInput) {
    const where: Prisma.TripWhereInput = { deletedAt: null };

    if (filters.carBrand) where.car = { brand: { name: filters.carBrand } };
    if (filters.status) where.status = filters.status;
    if (filters.department) where.department = { name: filters.department };
    if (filters.startDate && filters.endDate) {
      where.date = {
        gte: new Date(filters.startDate),
        lte: new Date(filters.endDate),
      };
    }

    const skip = (filters.page - 1) * filters.limit;

    const [trips, totalCount] = await Promise.all([
      prisma.trip.findMany({
        where,
        include: tripWithRelationsInclude,
        orderBy: { [filters.sortBy]: filters.sortOrder },
        skip,
        take: filters.limit,
      }),
      prisma.trip.count({ where }),
    ]);

    return {
      data: trips.map(toTripDTO),
      pagination: {
        page: filters.page,
        limit: filters.limit,
        totalCount,
        totalPages: Math.ceil(totalCount / filters.limit),
        hasNext: filters.page * filters.limit < totalCount,
        hasPrev: filters.page > 1,
      },
    };
  }

  static async getById(id: number) {
    const trip = await prisma.trip.findFirst({
      where: { id, deletedAt: null },
      include: tripWithRelationsInclude,
    });
    return trip ? toTripDTO(trip) : null;
  }

  static async create(input: CreateTripInput, recordById: number) {
    const [car, department] = await Promise.all([
      prisma.carDetail.findFirst({
        where: { id: input.carId, isActive: true },
      }),
      DepartmentService.requireByName(input.department),
    ]);
    if (!car) throw badRequest('Selected car was not found or is inactive');

    const approverEmails = normalizeEmails(input.approverEmails);
    const approverNames = await lookupNames(approverEmails);

    const trip = await prisma.$transaction(async (tx) => {
      const created = await tx.trip.create({
        data: {
          startPoint: input.startPoint,
          endPoint: input.endPoint,
          carId: car.id,
          date: new Date(input.date),
          time: parseTimeOfDay(input.time),
          purpose: input.purpose,
          purposeText: input.purposeText,
          remark: input.remark,
          departmentId: department.id,
          recordById,
          status: 'PENDING',
        },
      });

      if (approverEmails.length) {
        await tx.tripApprover.createMany({
          data: approverEmails.map((email) => ({
            tripId: created.id,
            email,
            name: approverNames.get(email) ?? null,
          })),
        });
      }

      if (input.items?.length) {
        await tx.tripItem.createMany({
          data: input.items.map((item) => ({
            tripId: created.id,
            startPoint: item.startPoint,
            endPoint: item.endPoint,
          })),
        });
      }

      if (input.driverIds?.length) {
        await tx.tripDriver.createMany({
          data: input.driverIds.map((driverId) => ({
            tripId: created.id,
            driverId,
          })),
        });
      }

      return tx.trip.findUniqueOrThrow({
        where: { id: created.id },
        include: tripWithRelationsInclude,
      });
    });

    const dto = toTripDTO(trip);

    void this.notifyApprovers(dto, approverEmails);

    return dto;
  }

  static async updateDetails(id: number, data: { purpose?: string }) {
    const existing = await prisma.trip.findFirst({
      where: { id, deletedAt: null },
    });
    if (!existing) throw notFound('Trip not found');

    const updated = await prisma.trip.update({
      where: { id },
      data,
      include: tripWithRelationsInclude,
    });
    return toTripDTO(updated);
  }

  /**
   * Single approval code path used by BOTH the authenticated in-app
   * approve/reject action and the email-link flow.
   *
   * Any ONE listed approver's decision settles the trip. The guard is a single
   * atomic UPDATE ... WHERE status = 'PENDING': if two approvers act at the
   * same moment exactly one UPDATE matches a row, the other affects 0 rows and
   * gets a 409. The link token (email flow) is consumed in the same
   * transaction, so a failed save never burns it, and once the trip is decided
   * every other outstanding link for it is invalidated.
   */
  static async setApprovalStatus(
    id: number,
    status: Extract<TripStatus, 'APPROVED' | 'REJECTED'>,
    actor: ApprovalActor
  ) {
    const trip = await prisma.trip.findFirst({
      where: { id, deletedAt: null },
      include: { approvers: true, recordBy: true },
    });
    if (!trip) throw notFound('Trip not found');

    let approverEmail = actor.approverEmail?.toLowerCase() ?? null;
    let approvedById: number | null = null;
    if (actor.userId) {
      const user = await prisma.user.findUnique({
        where: { id: actor.userId },
      });
      approvedById = user?.id ?? null;
      approverEmail = user?.email?.toLowerCase() ?? null;
      // An APPROVER may only decide trips they were named on; ADMIN may decide
      // any trip. Trips with no named approvers stay open to both roles.
      if (
        actor.role !== 'ADMIN' &&
        trip.approvers.length > 0 &&
        !trip.approvers.some((a) => a.email === approverEmail)
      ) {
        throw httpError(403, 'คุณไม่ได้เป็นผู้อนุมัติของทริปนี้');
      }
    } else if (approverEmail) {
      const user = await prisma.user.findFirst({
        where: { email: approverEmail },
      });
      approvedById = user?.id ?? null;
    }

    let updated;
    try {
      updated = await prisma.$transaction(async (tx) => {
        if (actor.claimJti) await claimApprovalToken(tx, actor.claimJti, id);

        const now = new Date();
        const res = await tx.trip.updateMany({
          where: { id, status: 'PENDING', deletedAt: null },
          data: { status, approvedAt: now, approvedById },
        });
        if (res.count === 0) throw new DecisionRaceLost();

        if (approverEmail) {
          await tx.tripApprover.updateMany({
            where: { tripId: id, email: approverEmail },
            data: { decision: status, decidedAt: now },
          });
        }
        // Trip is settled: kill every other outstanding approve/reject link.
        await tx.approvalToken.updateMany({
          where: { tripId: id, usedAt: null },
          data: { usedAt: now },
        });

        return tx.trip.findUniqueOrThrow({
          where: { id },
          include: tripWithRelationsInclude,
        });
      });
    } catch (err) {
      if (err instanceof DecisionRaceLost) throw await this.alreadyDecided(id);
      throw err;
    }

    const dto = toTripDTO(updated);
    const recipientEmail = trip.recordBy.email;
    if (recipientEmail) {
      EmailService.sendTripStatusNotification(
        dto,
        recipientEmail,
        status
      ).catch((err) =>
        logger.warn(
          { err, tripId: id },
          'Failed to send status notification email'
        )
      );
    }

    return dto;
  }

  private static async alreadyDecided(id: number) {
    const t = await prisma.trip.findUnique({
      where: { id },
      include: { approvedBy: true, approvers: true },
    });
    const verdict = t?.status === 'REJECTED' ? 'ปฏิเสธ' : 'อนุมัติ';
    const decider = t?.approvers.find((a) => a.decision);
    const who = t?.approvedBy?.name ?? decider?.name ?? decider?.email;
    return httpError(
      409,
      `ทริปนี้ถูก${verdict}ไปแล้ว${who ? `โดย ${who}` : ''} ไม่สามารถตัดสินซ้ำได้`
    );
  }

  static async softDelete(id: number) {
    const trip = await prisma.trip.findFirst({
      where: { id, deletedAt: null },
    });
    if (!trip) throw notFound('Trip not found');

    await prisma.trip.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
