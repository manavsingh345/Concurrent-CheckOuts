export const dynamic = "force-dynamic";

import { jsonError } from "@/lib/http";
import { confirmReservation } from "@/lib/reservations";

type Context = {
  params: Promise<{
    id: string;
  }>;
};

export async function POST(_: Request, context: Context) {
  try {
    const { id } = await context.params;
    const reservation = await confirmReservation(id);

    return Response.json(reservation);
  } catch (error) {
    return jsonError(error);
  }
}
