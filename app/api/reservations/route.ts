export const dynamic = "force-dynamic";

import { requireAppUser } from "@/lib/auth";
import { createReservation } from "@/lib/reservations";
import { jsonError } from "@/lib/http";
import { createReservationSchema } from "@/lib/validators";

export async function POST(request: Request) {
  try {
    const user = await requireAppUser();
    const body = await request.json();
    const input = createReservationSchema.parse(body);
    const reservation = await createReservation(
      input,
      request.headers.get("Idempotency-Key"),
      user.id,
    );

    return Response.json(reservation, { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}
