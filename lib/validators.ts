import { z } from "zod";

export const createReservationSchema = z.object({
  inventoryId: z.string().min(1, "Inventory is required."),
  quantity: z.coerce
    .number({
      error: "Quantity must be a number.",
    })
    .int("Quantity must be an integer.")
    .positive("Quantity must be at least 1.")
    .max(100, "Quantity is too large."),
});

export const idempotencyKeySchema = z.string().trim().min(8).max(200);

export type CreateReservationInput = z.infer<typeof createReservationSchema>;
