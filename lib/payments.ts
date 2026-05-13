import { createHmac } from "node:crypto";

import Razorpay from "razorpay";

import { env, isRazorpayConfigured } from "@/lib/env";
import { AppError } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { confirmReservation } from "@/lib/reservations";

function getPaymentErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  if (error && typeof error === "object") {
    if ("description" in error && typeof error.description === "string") {
      return error.description;
    }

    if ("message" in error && typeof error.message === "string") {
      return error.message;
    }

    if ("error" in error && error.error && typeof error.error === "object") {
      const nested = getPaymentErrorMessage(error.error, fallback);

      if (nested) {
        return nested;
      }
    }
  }

  return fallback;
}

function getRazorpayClient() {
  if (!isRazorpayConfigured()) {
    throw new AppError(
      500,
      "Razorpay keys are not configured.",
      "PAYMENT_NOT_CONFIGURED",
    );
  }

  return new Razorpay({
    key_id: env.razorpayKeyId,
    key_secret: env.razorpayKeySecret,
  });
}

function buildReceipt(reservationId: string) {
  return `res_${reservationId.replaceAll("-", "").slice(0, 32)}`;
}

async function getPendingReservationForUser(id: string, userId: string) {
  const reservation = await prisma.reservation.findFirst({
    where: {
      id,
      userId,
    },
    include: {
      inventory: {
        include: {
          product: true,
          warehouse: true,
        },
      },
      user: true,
    },
  });

  if (!reservation) {
    throw new AppError(404, "Reservation not found.", "RESERVATION_NOT_FOUND");
  }

  if (reservation.status !== "PENDING") {
    throw new AppError(
      409,
      `Reservation is already ${reservation.status.toLowerCase()}.`,
      "INVALID_RESERVATION_STATE",
    );
  }

  if (reservation.expiresAt.getTime() <= Date.now()) {
    throw new AppError(410, "Reservation has expired.", "RESERVATION_EXPIRED");
  }

  return reservation;
}

export async function createPaymentOrderForReservation(
  reservationId: string,
  userId: string,
) {
  const reservation = await getPendingReservationForUser(reservationId, userId);
  const client = getRazorpayClient();
  const amount = Math.round(
    reservation.inventory.product.price * reservation.quantity * 100,
  );

  let order: {
    id: string;
    amount: string | number;
    currency: string;
  };

  try {
    order = await client.orders.create({
      amount,
      currency: "INR",
      receipt: buildReceipt(reservation.id),
      notes: {
        reservationId: reservation.id,
        inventoryId: reservation.inventoryId,
        userId,
      },
    });
  } catch (error) {
    throw new AppError(
      502,
      getPaymentErrorMessage(
        error,
        "Razorpay could not create a payment order.",
      ),
      "PAYMENT_ORDER_CREATE_FAILED",
    );
  }

  try {
    await prisma.reservation.update({
      where: {
        id: reservation.id,
      },
      data: {
        paymentOrderId: order.id,
        paymentId: null,
        paymentSignature: null,
        paymentVerifiedAt: null,
      },
    });
  } catch {
    throw new AppError(
      500,
      "Reservation payment fields are not available in the database yet. Run `npm run db:push` and try again.",
      "PAYMENT_SCHEMA_NOT_APPLIED",
    );
  }

  return {
    keyId: env.razorpayKeyId,
    orderId: order.id,
    amount: order.amount,
    currency: order.currency,
    reservationId: reservation.id,
    productName: reservation.inventory.product.name,
    description: reservation.inventory.product.description,
    customer: {
      name:
        [reservation.user?.firstName, reservation.user?.lastName]
          .filter(Boolean)
          .join(" ") || undefined,
      email: reservation.user?.email ?? undefined,
    },
  };
}

export async function verifyReservationPayment(
  reservationId: string,
  userId: string,
  input: {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
  },
) {
  const reservation = await getPendingReservationForUser(reservationId, userId);

  if (!reservation.paymentOrderId) {
    throw new AppError(
      409,
      "Start a payment attempt before verification.",
      "PAYMENT_ORDER_MISSING",
    );
  }

  if (reservation.paymentOrderId !== input.razorpay_order_id) {
    throw new AppError(
      409,
      "Payment order does not match the active reservation payment attempt.",
      "PAYMENT_ORDER_MISMATCH",
    );
  }

  const expectedSignature = createHmac("sha256", env.razorpayKeySecret)
    .update(`${reservation.paymentOrderId}|${input.razorpay_payment_id}`)
    .digest("hex");

  if (expectedSignature !== input.razorpay_signature) {
    throw new AppError(400, "Payment signature is invalid.", "INVALID_SIGNATURE");
  }

  await prisma.reservation.update({
    where: {
      id: reservation.id,
    },
    data: {
      paymentId: input.razorpay_payment_id,
      paymentSignature: input.razorpay_signature,
      paymentVerifiedAt: new Date(),
    },
  });

  return confirmReservation(reservation.id, userId);
}
