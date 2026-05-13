import { Prisma } from "@prisma/client";

import type { ReservationView } from "@/lib/data";
import { env } from "@/lib/env";
import { AppError } from "@/lib/http";
import {
  buildIdempotencyCacheKey,
  getCachedMutation,
  setCachedMutation,
} from "@/lib/idempotency";
import { prisma } from "@/lib/prisma";
import { idempotencyKeySchema, type CreateReservationInput } from "@/lib/validators";

const reservationInclude = {
  inventory: {
    include: {
      product: true,
      warehouse: true,
    },
  },
} as const;

type MutationResponse = {
  reservation: ReservationView;
  meta: {
    replayed: boolean;
  };
};

type CreatedReservationRow = {
  id: string;
  replayed: boolean;
};

type ReservationRecord = Prisma.ReservationGetPayload<{
  include: typeof reservationInclude;
}>;

function mapReservation(reservation: ReservationRecord): ReservationView {
  return {
    id: reservation.id,
    quantity: reservation.quantity,
    status: reservation.status,
    expiresAt: reservation.expiresAt.toISOString(),
    createdAt: reservation.createdAt.toISOString(),
    updatedAt: reservation.updatedAt.toISOString(),
    idempotencyKey: reservation.idempotencyKey,
    inventory: {
      id: reservation.inventory.id,
      totalStock: reservation.inventory.totalStock,
      reservedStock: reservation.inventory.reservedStock,
      availableStock:
        reservation.inventory.totalStock - reservation.inventory.reservedStock,
      product: {
        id: reservation.inventory.product.id,
        name: reservation.inventory.product.name,
        description: reservation.inventory.product.description,
        price: reservation.inventory.product.price,
      },
      warehouse: {
        id: reservation.inventory.warehouse.id,
        name: reservation.inventory.warehouse.name,
        location: reservation.inventory.warehouse.location,
      },
    },
  };
}

function normalizeIdempotencyKey(value: string | null) {
  if (!value) {
    return null;
  }

  const parsed = idempotencyKeySchema.safeParse(value);

  if (!parsed.success) {
    throw new AppError(
      400,
      "Idempotency-Key must be 8-200 characters.",
      "INVALID_IDEMPOTENCY_KEY",
    );
  }

  return parsed.data;
}

async function getReservationOrThrowForUser(id: string, userId?: string) {
  const reservation = await prisma.reservation.findFirst({
    where: {
      id,
      ...(userId ? { userId } : {}),
    },
    include: reservationInclude,
  });

  if (!reservation) {
    throw new AppError(404, "Reservation not found.", "RESERVATION_NOT_FOUND");
  }

  return reservation;
}

async function expirePendingReservation(id: string, userId?: string) {
  const expiredRows = await prisma.$queryRaw<{ id: string }[]>`
    WITH expired AS (
      UPDATE "Reservation"
      SET status = 'EXPIRED',
          "updatedAt" = NOW()
      WHERE id = ${id}
        ${userId ? Prisma.sql`AND "userId" = ${userId}` : Prisma.empty}
        AND status = 'PENDING'
        AND "expiresAt" <= NOW()
      RETURNING id, "inventoryId", quantity
    ),
    released AS (
      UPDATE "Inventory"
      SET "reservedStock" = "reservedStock" - expired.quantity,
          "updatedAt" = NOW()
      FROM expired
      WHERE "Inventory".id = expired."inventoryId"
      RETURNING "Inventory".id
    )
    SELECT id FROM expired;
  `;

  return expiredRows.length > 0;
}

export async function createReservation(
  input: CreateReservationInput,
  rawIdempotencyKey: string | null,
  userId: string,
): Promise<MutationResponse> {
  const idempotencyKey = normalizeIdempotencyKey(rawIdempotencyKey);
  const reservationId = crypto.randomUUID();
  const cacheKey = idempotencyKey
    ? buildIdempotencyCacheKey(idempotencyKey, { ...input, userId })
    : null;

  if (cacheKey) {
    const cached = await getCachedMutation<MutationResponse>(cacheKey);

    if (cached) {
      return {
        ...cached.body,
        meta: {
          ...cached.body.meta,
          replayed: true,
        },
      };
    }
  }

  const expiresAt = new Date(
    Date.now() + env.reservationTtlMinutes * 60 * 1000,
  );

  let createdRows: CreatedReservationRow[];

  if (idempotencyKey) {
    createdRows = await prisma.$queryRaw<CreatedReservationRow[]>`
      WITH existing AS (
        SELECT id, TRUE AS replayed
        FROM "Reservation"
        WHERE "idempotencyKey" = ${idempotencyKey}
          AND "userId" = ${userId}
      ),
      updated AS (
        UPDATE "Inventory"
        SET "reservedStock" = "reservedStock" + ${input.quantity},
            "updatedAt" = NOW()
        WHERE id = ${input.inventoryId}
          AND NOT EXISTS (SELECT 1 FROM existing)
          AND ("totalStock" - "reservedStock") >= ${input.quantity}
        RETURNING id
      ),
      inserted AS (
        INSERT INTO "Reservation" (id, "inventoryId", "userId", quantity, status, "expiresAt", "idempotencyKey", "createdAt", "updatedAt")
        SELECT ${reservationId}, ${input.inventoryId}, ${userId}, ${input.quantity}, 'PENDING', ${expiresAt}, ${idempotencyKey}, NOW(), NOW()
        FROM updated
        RETURNING id, FALSE AS replayed
      )
      SELECT id, replayed FROM inserted
      UNION ALL
      SELECT id, replayed FROM existing;
    `;
  } else {
    createdRows = await prisma.$queryRaw<CreatedReservationRow[]>`
      WITH updated AS (
        UPDATE "Inventory"
        SET "reservedStock" = "reservedStock" + ${input.quantity},
            "updatedAt" = NOW()
        WHERE id = ${input.inventoryId}
          AND ("totalStock" - "reservedStock") >= ${input.quantity}
        RETURNING id
      ),
      inserted AS (
        INSERT INTO "Reservation" (id, "inventoryId", "userId", quantity, status, "expiresAt", "createdAt", "updatedAt")
        SELECT ${reservationId}, ${input.inventoryId}, ${userId}, ${input.quantity}, 'PENDING', ${expiresAt}, NOW(), NOW()
        FROM updated
        RETURNING id, FALSE AS replayed
      )
      SELECT id, replayed FROM inserted;
    `;
  }

  if (createdRows.length === 0) {
    throw new AppError(
      409,
      "Not enough stock is available for this reservation.",
      "INSUFFICIENT_STOCK",
    );
  }

  const created = createdRows[0];

  const reservation = await prisma.reservation.findUnique({
    where: {
      id: created.id,
    },
    include: reservationInclude,
  });

  if (!reservation) {
    throw new AppError(
      500,
      "Reservation was created but could not be loaded.",
      "RESERVATION_READ_FAILED",
    );
  }

  const payload: MutationResponse = {
    reservation: mapReservation(reservation),
    meta: {
      replayed: created.replayed,
    },
  };

  if (cacheKey) {
    await setCachedMutation(cacheKey, {
      status: 201,
      body: payload,
    });
  }

  return payload;
}

export async function confirmReservation(
  id: string,
  userId: string,
): Promise<MutationResponse> {
  const confirmedRows = await prisma.$queryRaw<{ id: string }[]>`
    WITH confirmed AS (
      UPDATE "Reservation"
      SET status = 'CONFIRMED',
          "updatedAt" = NOW()
      WHERE id = ${id}
        AND "userId" = ${userId}
        AND status = 'PENDING'
        AND "expiresAt" > NOW()
      RETURNING id, "inventoryId", quantity
    ),
    consumed AS (
      UPDATE "Inventory"
      SET "totalStock" = "totalStock" - confirmed.quantity,
          "reservedStock" = "reservedStock" - confirmed.quantity,
          "updatedAt" = NOW()
      FROM confirmed
      WHERE "Inventory".id = confirmed."inventoryId"
      RETURNING "Inventory".id
    )
    SELECT id FROM confirmed;
  `;

  if (confirmedRows.length === 0) {
    const wasExpired = await expirePendingReservation(id, userId);

    if (wasExpired) {
      throw new AppError(410, "Reservation has expired.", "RESERVATION_EXPIRED");
    }

    const existing = await getReservationOrThrowForUser(id, userId);

    throw new AppError(
      409,
      `Reservation is already ${existing.status.toLowerCase()}.`,
      "INVALID_RESERVATION_STATE",
    );
  }

  const reservation = await getReservationOrThrowForUser(id, userId);

  return {
    reservation: mapReservation(reservation),
    meta: {
      replayed: false,
    },
  };
}

export async function releaseReservation(
  id: string,
  userId: string,
): Promise<MutationResponse> {
  const cancelledRows = await prisma.$queryRaw<{ id: string }[]>`
    WITH cancelled AS (
      UPDATE "Reservation"
      SET status = 'CANCELLED',
          "updatedAt" = NOW()
      WHERE id = ${id}
        AND "userId" = ${userId}
        AND status = 'PENDING'
        AND "expiresAt" > NOW()
      RETURNING id, "inventoryId", quantity
    ),
    released AS (
      UPDATE "Inventory"
      SET "reservedStock" = "reservedStock" - cancelled.quantity,
          "updatedAt" = NOW()
      FROM cancelled
      WHERE "Inventory".id = cancelled."inventoryId"
      RETURNING "Inventory".id
    )
    SELECT id FROM cancelled;
  `;

  if (cancelledRows.length === 0) {
    const wasExpired = await expirePendingReservation(id, userId);

    if (wasExpired) {
      throw new AppError(410, "Reservation has expired.", "RESERVATION_EXPIRED");
    }

    const existing = await getReservationOrThrowForUser(id, userId);

    throw new AppError(
      409,
      `Reservation is already ${existing.status.toLowerCase()}.`,
      "INVALID_RESERVATION_STATE",
    );
  }

  const reservation = await getReservationOrThrowForUser(id, userId);

  return {
    reservation: mapReservation(reservation),
    meta: {
      replayed: false,
    },
  };
}

export async function releaseExpiredReservations() {
  return prisma.$transaction(async (tx) => {
    const expired = await tx.$queryRaw<{ inventoryId: string; quantity: number }[]>`
      UPDATE "Reservation"
      SET status = 'EXPIRED',
          "updatedAt" = NOW()
      WHERE status = 'PENDING'
        AND "expiresAt" <= NOW()
      RETURNING "inventoryId", quantity;
    `;

    if (expired.length === 0) {
      return {
        expiredReservations: 0,
        releasedUnits: 0,
      };
    }

    const aggregated = expired.reduce<Map<string, number>>((acc, row) => {
      acc.set(row.inventoryId, (acc.get(row.inventoryId) ?? 0) + row.quantity);
      return acc;
    }, new Map());

    await Promise.all(
      [...aggregated.entries()].map(([inventoryId, quantity]) =>
        tx.inventory.update({
          where: { id: inventoryId },
          data: {
            reservedStock: {
              decrement: quantity,
            },
          },
        }),
      ),
    );

    return {
      expiredReservations: expired.length,
      releasedUnits: expired.reduce((sum, row) => sum + row.quantity, 0),
    };
  });
}
