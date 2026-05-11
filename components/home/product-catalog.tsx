"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { ProductListItem } from "@/lib/data";
import { formatCurrency } from "@/lib/utils";

type ProductCatalogProps = {
  products: ProductListItem[];
  setupError?: string | null;
};

export function ProductCatalog({
  products,
  setupError,
}: ProductCatalogProps) {
  return (
    <div className="space-y-6">
      {setupError ? (
        <Alert tone="danger">
          {setupError} Add working database credentials, run `npm run db:push` and
          `npm run db:seed`, then refresh.
        </Alert>
      ) : null}
      <div className="grid gap-5 lg:grid-cols-2">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
}

function ProductCard({ product }: { product: ProductListItem }) {
  const router = useRouter();
  const [selectedInventoryId, setSelectedInventoryId] = useState(
    product.inventories[0]?.inventoryId ?? "",
  );
  const [quantity, setQuantity] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const selectedInventory = useMemo(
    () =>
      product.inventories.find(
        (inventory) => inventory.inventoryId === selectedInventoryId,
      ) ?? product.inventories[0],
    [product.inventories, selectedInventoryId],
  );

  const maxQuantity = Math.max(1, selectedInventory?.availableStock ?? 1);

  async function reserve() {
    setError(null);

    startTransition(async () => {
      try {
        const response = await fetch("/api/reservations", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Idempotency-Key": crypto.randomUUID(),
          },
          body: JSON.stringify({
            inventoryId: selectedInventoryId,
            quantity,
          }),
        });

        const payload = await response.json();

        if (!response.ok) {
          setError(payload.error?.message ?? "Unable to create reservation.");
          return;
        }

        router.push(`/reservations/${payload.reservation.id}`);
      } catch {
        setError("The reservation request did not complete.");
      }
    });
  }

  return (
    <Card className="flex h-full flex-col gap-5">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--muted-ink)]">
            Inventory reservation
          </p>
          <h2 className="text-2xl font-semibold text-[var(--ink)]">
            {product.name}
          </h2>
          <p className="text-sm leading-6 text-[var(--muted-ink)]">
            {product.description}
          </p>
        </div>
        <Badge tone="stock">{product.totalAvailableStock} units open</Badge>
      </div>

      <div className="flex items-end justify-between gap-4 rounded-[24px] bg-[var(--panel)] px-4 py-5">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted-ink)]">
            Unit price
          </p>
          <p className="text-3xl font-semibold text-[var(--ink)]">
            {formatCurrency(product.price)}
          </p>
        </div>
        <div className="text-right text-sm text-[var(--muted-ink)]">
          <p>{product.inventories.length} warehouse options</p>
          <p>Atomic stock reservation</p>
        </div>
      </div>

      <label className="space-y-2 text-sm font-medium text-[var(--ink)]">
        <span>Warehouse</span>
        <select
          className="h-12 w-full rounded-2xl border border-[var(--border)] bg-white px-4 outline-none transition focus:border-[var(--accent)]"
          value={selectedInventoryId}
          onChange={(event) => setSelectedInventoryId(event.target.value)}
        >
          {product.inventories.map((inventory) => (
            <option key={inventory.inventoryId} value={inventory.inventoryId}>
              {inventory.warehouseName} - {inventory.warehouseLocation} (
              {inventory.availableStock} available)
            </option>
          ))}
        </select>
      </label>

      <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
        <label className="space-y-2 text-sm font-medium text-[var(--ink)]">
          <span>Quantity</span>
          <input
            type="number"
            min={1}
            max={maxQuantity}
            value={quantity}
            onChange={(event) =>
              setQuantity(
                Math.max(
                  1,
                  Math.min(maxQuantity, Number(event.target.value || 1)),
                ),
              )
            }
            className="h-12 w-full rounded-2xl border border-[var(--border)] bg-white px-4 outline-none transition focus:border-[var(--accent)]"
          />
        </label>
        <div className="self-end rounded-2xl border border-[var(--border)] px-4 py-3 text-sm text-[var(--muted-ink)]">
          <p>Available now</p>
          <p className="text-lg font-semibold text-[var(--ink)]">
            {selectedInventory?.availableStock ?? 0} units
          </p>
        </div>
      </div>

      {error ? <Alert tone="danger">{error}</Alert> : null}

      <div className="mt-auto flex items-center justify-between gap-4">
        <p className="text-sm text-[var(--muted-ink)]">
          Reservations auto-expire after 10 minutes.
        </p>
        <Button
          onClick={reserve}
          disabled={
            isPending ||
            !selectedInventory ||
            selectedInventory.availableStock === 0 ||
            quantity > selectedInventory.availableStock
          }
        >
          {isPending ? "Reserving..." : "Reserve stock"}
        </Button>
      </div>
    </Card>
  );
}
