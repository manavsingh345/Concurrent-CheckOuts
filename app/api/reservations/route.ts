export const dynamic = "force-dynamic";

import { createReservation } from "@/lib/reservations";
import { jsonError } from "@/lib/http";
import { createReservationSchema } from "@/lib/validators";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const input = createReservationSchema.parse(body);
    const reservation = await createReservation(
      input,
      request.headers.get("Idempotency-Key"),
    );

    return Response.json(reservation, { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}
