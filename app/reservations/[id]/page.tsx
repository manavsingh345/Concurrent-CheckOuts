import Link from "next/link";

import { ReservationPanel } from "@/components/reservations/reservation-panel";
import { Alert } from "@/components/ui/alert";
import { getReservationById } from "@/lib/data";

export const dynamic = "force-dynamic";

type ReservationPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function ReservationPage({
  params,
}: ReservationPageProps) {
  const { id } = await params;
  let reservation = null;
  let errorMessage: string | null = null;

  try {
    reservation = await getReservationById(id);
  } catch (error) {
    errorMessage =
      error instanceof Error
        ? error.message
        : "The reservation page could not load.";
  }

  if (errorMessage) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col justify-center px-6 py-16">
        <Alert tone="danger">{errorMessage}</Alert>
      </main>
    );
  }

  if (!reservation) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col justify-center px-6 py-16">
        <Alert tone="danger">Reservation not found.</Alert>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-8 px-6 py-14 lg:px-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-[var(--muted-ink)]">
            Checkout flow
          </p>
          <h1 className="mt-2 text-4xl font-semibold text-[var(--ink)]">
            Reservation review
          </h1>
        </div>
        <Link
          href="/"
          className="rounded-full border border-[var(--border)] px-5 py-3 text-sm font-semibold text-[var(--ink)] transition hover:bg-[var(--panel)]"
        >
          Back to catalog
        </Link>
      </div>
      <ReservationPanel
        reservationId={id}
        initialReservation={reservation}
      />
    </main>
  );
}
