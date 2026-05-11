"use client";

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

const fetcher = async (url: string) => {
  const response = await fetch(url, { cache: "no-store" });
  const payload = await response.json();

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
        const payload = await response.json();

        if (!response.ok) {
          setActionError(payload.error?.message ?? `Unable to ${action} reservation.`);
          await mutate();
          return;
        }

        await mutate(payload, { revalidate: false });
      } catch {
        setActionError(`The ${action} request did not complete.`);
      }
    });
  }

  const isPendingStatus = reservation.status === "PENDING";

  return (
    <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
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
            onClick={() => submitAction("confirm")}
            disabled={!isPendingStatus || isPending || timeLeft <= 0}
          >
            {isPending ? "Saving..." : "Confirm purchase"}
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
            ? "This hold is still consuming reserved stock and will be released automatically when it expires."
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
