"use client";

import Script from "next/script";
import { useEffect, useState, useTransition } from "react";
import useSWR from "swr";

import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { ReservationView } from "@/lib/data";
import { formatCurrency, formatDate, formatDuration } from "@/lib/utils";

type ReservationPanelProps = {
  reservationId: string;
  initialReservation: ReservationView;
};

type RazorpayOrderPayload = {
  order: {
    keyId: string;
    orderId: string;
    amount: number;
    currency: string;
    reservationId: string;
    productName: string;
    description: string | null;
    customer: {
      name?: string;
      email?: string;
    };
  };
};

type ApiErrorPayload = {
  error?: {
    message?: string;
  };
};

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => {
      open: () => void;
    };
  }
}

async function readApiPayload(response: Response) {
  const contentType = response.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    return response.json();
  }

  const body = await response.text();

  if (response.redirected || body.toLowerCase().includes("<html")) {
    return {
      error: {
        message: "Your session needs attention. Please sign in again.",
      },
    };
  }

  return {
    error: {
      message: body || "The server returned an unexpected response.",
    },
  };
}

const fetcher = async (url: string) => {
  const response = await fetch(url, { cache: "no-store" });
  const payload = await readApiPayload(response);

  if (!response.ok) {
    throw new Error(payload.error?.message ?? "Unable to load reservation.");
  }

  return payload as { reservation: ReservationView };
};

function getTone(status: ReservationView["status"]) {
  switch (status) {
    case "PENDING":
      return "pending";
    case "CONFIRMED":
      return "confirmed";
    case "CANCELLED":
      return "cancelled";
    case "EXPIRED":
      return "expired";
  }
}

export function ReservationPanel({
  reservationId,
  initialReservation,
}: ReservationPanelProps) {
  const { data, error, isLoading, mutate } = useSWR(
    `/api/reservations/${reservationId}`,
    fetcher,
    {
      fallbackData: { reservation: initialReservation },
      refreshInterval: 15000,
      revalidateOnFocus: true,
    },
  );
  const reservation = data?.reservation ?? initialReservation;
  const [timeLeft, setTimeLeft] = useState(0);
  const [actionError, setActionError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [razorpayReady, setRazorpayReady] = useState(false);

  useEffect(() => {
    const updateCountdown = () => {
      setTimeLeft(new Date(reservation.expiresAt).getTime() - Date.now());
    };
    const timeout = window.setTimeout(updateCountdown, 0);
    const interval = window.setInterval(updateCountdown, 1000);

    return () => {
      window.clearTimeout(timeout);
      window.clearInterval(interval);
    };
  }, [reservation.expiresAt]);

  async function submitAction(action: "confirm" | "release") {
    setActionError(null);

    startTransition(async () => {
      try {
        const response = await fetch(`/api/reservations/${reservationId}/${action}`, {
          method: "POST",
        });
        const payload = await readApiPayload(response);

        if (!response.ok) {
          setActionError(payload.error?.message ?? `Unable to ${action} reservation.`);
          await mutate();
          return;
        }

        await mutate(payload, { revalidate: false });
      } catch (error) {
        setActionError(
          error instanceof Error
            ? error.message
            : `The ${action} request did not complete.`,
        );
      }
    });
  }

  async function startPayment() {
    setActionError(null);

    startTransition(async () => {
      try {
        if (!window.Razorpay) {
          throw new Error("Razorpay checkout is still loading. Please try again.");
        }

        const orderResponse = await fetch(
          `/api/reservations/${reservationId}/payment-order`,
          {
            method: "POST",
          },
        );
        const orderPayload = (await readApiPayload(orderResponse)) as
          | RazorpayOrderPayload
          | ApiErrorPayload;

        if (!orderResponse.ok) {
          const errorPayload = orderPayload as ApiErrorPayload;
          setActionError(
            errorPayload.error?.message ?? "Unable to start Razorpay checkout.",
          );
          await mutate();
          return;
        }

        const orderData = orderPayload as RazorpayOrderPayload;

        const checkout = new window.Razorpay({
          key: orderData.order.keyId,
          amount: orderData.order.amount,
          currency: orderData.order.currency,
          name: "Allo Health",
          description:
            orderData.order.description ??
            `Payment for ${orderData.order.productName}`,
          order_id: orderData.order.orderId,
          prefill: {
            name: orderData.order.customer.name,
            email: orderData.order.customer.email,
          },
          theme: {
            color: "#0f172a",
          },
          handler: async (response: {
            razorpay_order_id: string;
            razorpay_payment_id: string;
            razorpay_signature: string;
          }) => {
            const verifyResponse = await fetch(
              `/api/reservations/${reservationId}/payment-verify`,
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify(response),
              },
            );
            const verifyPayload = await readApiPayload(verifyResponse);

            if (!verifyResponse.ok) {
              setActionError(
                verifyPayload.error?.message ??
                  "Payment verification failed for this reservation.",
              );
              await mutate();
              return;
            }

            await mutate(verifyPayload, { revalidate: false });
          },
          modal: {
            ondismiss: () => {
              setActionError("Payment was not completed. Your reservation is still held.");
            },
          },
        });

        checkout.open();
      } catch (error) {
        setActionError(
          error instanceof Error
            ? error.message
            : "Unable to start Razorpay checkout.",
        );
      }
    });
  }

  const isPendingStatus = reservation.status === "PENDING";

  return (
    <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
      <Script
        src="https://checkout.razorpay.com/v1/checkout.js"
        strategy="afterInteractive"
        onLoad={() => setRazorpayReady(true)}
      />
      <Card className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--muted-ink)]">
              Active reservation
            </p>
            <h1 className="mt-2 text-3xl font-semibold text-[var(--ink)]">
              {reservation.inventory.product.name}
            </h1>
          </div>
          <Badge tone={getTone(reservation.status)}>{reservation.status}</Badge>
        </div>

        <p className="max-w-xl text-sm leading-6 text-[var(--muted-ink)]">
          {reservation.inventory.product.description}
        </p>

        {error ? <Alert tone="danger">{error.message}</Alert> : null}
        {actionError ? <Alert tone="danger">{actionError}</Alert> : null}

        <div className="grid gap-4 md:grid-cols-3">
          <Metric label="Quantity" value={`${reservation.quantity} units`} />
          <Metric
            label="Warehouse"
            value={reservation.inventory.warehouse.name}
            subvalue={reservation.inventory.warehouse.location}
          />
          <Metric
            label="Value"
            value={formatCurrency(
              reservation.inventory.product.price * reservation.quantity,
            )}
          />
        </div>

        <div className="rounded-[28px] bg-[var(--panel)] p-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--muted-ink)]">
                Countdown
              </p>
              <p className="mt-2 text-4xl font-semibold text-[var(--ink)]">
                {reservation.status === "PENDING"
                  ? formatDuration(timeLeft)
                  : "00:00"}
              </p>
            </div>
            <div className="text-sm leading-6 text-[var(--muted-ink)]">
              <p>Created {formatDate(reservation.createdAt)}</p>
              <p>Expires {formatDate(reservation.expiresAt)}</p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <Button
            onClick={startPayment}
            disabled={!isPendingStatus || isPending || timeLeft <= 0 || !razorpayReady}
          >
            {isPending ? "Starting payment..." : "Pay with Razorpay"}
          </Button>
          <Button
            variant="secondary"
            onClick={() => submitAction("release")}
            disabled={!isPendingStatus || isPending}
          >
            Cancel reservation
          </Button>
        </div>
      </Card>

      <Card className="space-y-5">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--muted-ink)]">
            Inventory snapshot
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-[var(--ink)]">
            Warehouse availability
          </h2>
        </div>

        <Metric
          label="Available after current state"
          value={`${reservation.inventory.availableStock} units`}
        />
        <Metric
          label="Reserved in this warehouse"
          value={`${reservation.inventory.reservedStock} units`}
        />
        <Metric
          label="Total on hand"
          value={`${reservation.inventory.totalStock} units`}
        />

        <Alert tone={reservation.status === "CONFIRMED" ? "success" : "neutral"}>
          {reservation.status === "PENDING"
            ? "This hold is still consuming reserved stock. Pay with Razorpay before the timer ends or cancel it to release the units."
            : reservation.status === "CONFIRMED"
              ? "The purchase is confirmed and total stock has been permanently reduced."
              : reservation.status === "CANCELLED"
                ? "The reservation was cancelled and the held stock was returned."
                : "The reservation expired and the held stock was released."}
        </Alert>

        {isLoading ? (
          <p className="text-sm text-[var(--muted-ink)]">Refreshing reservation...</p>
        ) : null}
      </Card>
    </div>
  );
}

function Metric({
  label,
  value,
  subvalue,
}: {
  label: string;
  value: string;
  subvalue?: string;
}) {
  return (
    <div className="rounded-[24px] border border-[var(--border)] bg-white px-4 py-4">
      <p className="text-xs uppercase tracking-[0.18em] text-[var(--muted-ink)]">
        {label}
      </p>
      <p className="mt-2 text-lg font-semibold text-[var(--ink)]">{value}</p>
      {subvalue ? <p className="text-sm text-[var(--muted-ink)]">{subvalue}</p> : null}
    </div>
  );
}
