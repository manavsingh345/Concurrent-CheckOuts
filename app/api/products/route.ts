export const dynamic = "force-dynamic";

import { listProducts } from "@/lib/data";
import { jsonError } from "@/lib/http";

export async function GET() {
  try {
    const products = await listProducts();
    return Response.json({ products });
  } catch (error) {
    return jsonError(error);
  }
}
