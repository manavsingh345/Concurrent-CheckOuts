export const dynamic = "force-dynamic";

import { listWarehouses } from "@/lib/data";
import { jsonError } from "@/lib/http";

export async function GET() {
  try {
    const warehouses = await listWarehouses();
    return Response.json({ warehouses });
  } catch (error) {
    return jsonError(error);
  }
}
