export const dynamic = "force-dynamic";

import { requireAppUser } from "@/lib/auth";
import { jsonError } from "@/lib/http";
import { createPaymentOrderForReservation } from "@/lib/payments";

type Context = {
  params: Promise<{
    id: string;
  }>;
};

export async function POST(_: Request, context: Context) {
  try {
    const user = await requireAppUser();
    const { id } = await context.params;
    const order = await createPaymentOrderForReservation(id, user.id);

    return Response.json({ order });
  } catch (error) {
    return jsonError(error);
  }
}
