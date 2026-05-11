import { Prisma, ReservationStatus } from "@prisma/client";

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

type InventoryRow = {
  id: string;
};

type ReservationRecord = Prisma.ReservationGetPayload<{
  include: typeof reservationInclude;
}>;

function isExpired(expiresAt: Date) {
  return expiresAt.getTime() <= Date.now();
}

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

async function expireReservationInTransaction(
  tx: Prisma.TransactionClient,
  reservation: ReservationRecord,
) {
  if (reservation.status !== ReservationStatus.PENDING) {
    return reservation;
  }

  await tx.inventory.update({
    where: {
      id: reservation.inventoryId,
    },
    data: {
      reservedStock: {
        decrement: reservation.quantity,
      },
    },
  });

  return tx.reservation.update({
    where: {
      id: reservation.id,
    },
    data: {
      status: ReservationStatus.EXPIRED,
    },
    include: reservationInclude,
  });
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

export async function createReservation(
  input: CreateReservationInput,
  rawIdempotencyKey: string | null,
): Promise<MutationResponse> {
  const idempotencyKey = normalizeIdempotencyKey(rawIdempotencyKey);
  const cacheKey = idempotencyKey
    ? buildIdempotencyCacheKey(idempotencyKey, input)
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

  try {
    const expiresAt = new Date(
      Date.now() + env.reservationTtlMinutes * 60 * 1000,
    );

    const reservation = await prisma.$transaction(async (tx) => {
      const updatedRows = await tx.$queryRaw<InventoryRow[]>`
        UPDATE "Inventory"
        SET "reservedStock" = "reservedStock" + ${input.quantity},
            "updatedAt" = NOW()
        WHERE id = ${input.inventoryId}
          AND ("totalStock" - "reservedStock") >= ${input.quantity}
        RETURNING id;
      `;

      if (updatedRows.length === 0) {
        throw new AppError(
          409,
          "Not enough stock is available for this reservation.",
          "INSUFFICIENT_STOCK",
        );
      }

      return tx.reservation.create({
        data: {
          inventoryId: input.inventoryId,
          quantity: input.quantity,
          expiresAt,
          idempotencyKey,
        },
        include: reservationInclude,
      });
    });

    const payload: MutationResponse = {
      reservation: mapReservation(reservation),
      meta: {
        replayed: false,
      },
    };

    if (cacheKey) {
      await setCachedMutation(cacheKey, {
        status: 201,
        body: payload,
      });
    }

    return payload;
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002" &&
      idempotencyKey
    ) {
      const existing = await prisma.reservation.findUnique({
        where: {
          idempotencyKey,
        },
        include: reservationInclude,
      });

      if (!existing) {
        throw error;
      }

      const payload: MutationResponse = {
        reservation: mapReservation(existing),
        meta: {
          replayed: true,
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

    throw error;
  }
}

export async function confirmReservation(id: string): Promise<MutationResponse> {
  const reservation = await prisma.$transaction(async (tx) => {
    const existing = await tx.reservation.findUnique({
      where: { id },
      include: reservationInclude,
    });

    if (!existing) {
      throw new AppError(404, "Reservation not found.", "RESERVATION_NOT_FOUND");
    }

    if (existing.status !== ReservationStatus.PENDING) {
      throw new AppError(
        409,
        `Reservation is already ${existing.status.toLowerCase()}.`,
        "INVALID_RESERVATION_STATE",
      );
    }

    if (isExpired(existing.expiresAt)) {
      await expireReservationInTransaction(tx, existing);
      throw new AppError(410, "Reservation has expired.", "RESERVATION_EXPIRED");
    }

    await tx.inventory.update({
      where: {
        id: existing.inventoryId,
      },
      data: {
        totalStock: {
          decrement: existing.quantity,
        },
        reservedStock: {
          decrement: existing.quantity,
        },
      },
    });

    return tx.reservation.update({
      where: {
        id: existing.id,
      },
      data: {
        status: ReservationStatus.CONFIRMED,
      },
      include: reservationInclude,
    });
  });

  return {
    reservation: mapReservation(reservation),
    meta: {
      replayed: false,
    },
  };
}

export async function releaseReservation(id: string): Promise<MutationResponse> {
  const reservation = await prisma.$transaction(async (tx) => {
    const existing = await tx.reservation.findUnique({
      where: { id },
      include: reservationInclude,
    });

    if (!existing) {
      throw new AppError(404, "Reservation not found.", "RESERVATION_NOT_FOUND");
    }

    if (existing.status !== ReservationStatus.PENDING) {
      throw new AppError(
        409,
        `Reservation is already ${existing.status.toLowerCase()}.`,
        "INVALID_RESERVATION_STATE",
      );
    }

    if (isExpired(existing.expiresAt)) {
      await expireReservationInTransaction(tx, existing);
      throw new AppError(410, "Reservation has expired.", "RESERVATION_EXPIRED");
    }

    await tx.inventory.update({
      where: {
        id: existing.inventoryId,
      },
      data: {
        reservedStock: {
          decrement: existing.quantity,
        },
      },
    });

    return tx.reservation.update({
      where: {
        id: existing.id,
      },
      data: {
        status: ReservationStatus.CANCELLED,
      },
      include: reservationInclude,
    });
  });

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
