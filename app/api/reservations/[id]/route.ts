export const dynamic = "force-dynamic";

import { getReservationById } from "@/lib/data";
import { AppError, jsonError } from "@/lib/http";

type Context = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(_: Request, context: Context) {
  try {
    const { id } = await context.params;
    const reservation = await getReservationById(id);

    if (!reservation) {
      throw new AppError(404, "Reservation not found.", "RESERVATION_NOT_FOUND");
    }

    return Response.json({ reservation });
  } catch (error) {
    return jsonError(error);
  }
}
