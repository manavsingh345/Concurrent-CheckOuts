export const dynamic = "force-dynamic";

import { z } from "zod";

import { requireAppUser } from "@/lib/auth";
import { jsonError } from "@/lib/http";
import { verifyReservationPayment } from "@/lib/payments";

const verifyPaymentSchema = z.object({
  razorpay_order_id: z.string().min(1),
  razorpay_payment_id: z.string().min(1),
  razorpay_signature: z.string().min(1),
});

type Context = {
  params: Promise<{
    id: string;
  }>;
};

export async function POST(request: Request, context: Context) {
  try {
    const user = await requireAppUser();
    const { id } = await context.params;
    const body = await request.json();
    const input = verifyPaymentSchema.parse(body);
    const reservation = await verifyReservationPayment(id, user.id, input);

    return Response.json(reservation);
  } catch (error) {
    return jsonError(error);
  }
}
