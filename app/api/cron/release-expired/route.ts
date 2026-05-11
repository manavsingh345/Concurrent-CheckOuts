export const dynamic = "force-dynamic";

import { env } from "@/lib/env";
import { AppError, jsonError } from "@/lib/http";
import { releaseExpiredReservations } from "@/lib/reservations";

export async function GET(request: Request) {
  try {
    if (env.cronSecret) {
      const authHeader = request.headers.get("authorization");

      if (authHeader !== `Bearer ${env.cronSecret}`) {
        throw new AppError(401, "Unauthorized cron request.", "UNAUTHORIZED");
      }
    }

    const result = await releaseExpiredReservations();
    return Response.json(result);
  } catch (error) {
    return jsonError(error);
  }
}
