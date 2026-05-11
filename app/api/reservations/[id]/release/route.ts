export const dynamic = "force-dynamic";

import { jsonError } from "@/lib/http";
import { releaseReservation } from "@/lib/reservations";

type Context = {
  params: Promise<{
    id: string;
  }>;
};

export async function POST(_: Request, context: Context) {
  try {
    const { id } = await context.params;
    const reservation = await releaseReservation(id);

    return Response.json(reservation);
  } catch (error) {
    return jsonError(error);
  }
}
