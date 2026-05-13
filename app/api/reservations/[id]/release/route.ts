export const dynamic = "force-dynamic";

import { requireAppUser } from "@/lib/auth";
import { jsonError } from "@/lib/http";
import { releaseReservation } from "@/lib/reservations";

type Context = {
  params: Promise<{
    id: string;
  }>;
};

export async function POST(_: Request, context: Context) {
  try {
    const user = await requireAppUser();
    const { id } = await context.params;
    const reservation = await releaseReservation(id, user.id);

    return Response.json(reservation);
  } catch (error) {
    return jsonError(error);
  }
}
