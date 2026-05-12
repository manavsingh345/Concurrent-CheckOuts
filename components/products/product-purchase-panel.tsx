"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import type { ProductDetail } from "@/lib/data";
import { formatCurrency } from "@/lib/utils";

type ProductPurchasePanelProps = {
  product: ProductDetail;
  mrp: number;
  deliveryText: string;
};

export function ProductPurchasePanel({
  product,
  mrp,
  deliveryText,
}: ProductPurchasePanelProps) {
  const router = useRouter();
  const [selectedInventoryId, setSelectedInventoryId] = useState(
    product.inventories[0]?.inventoryId ?? "",
  );
  const [quantity, setQuantity] = useState(1);
  const [quantityInput, setQuantityInput] = useState("1");
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
  const reserveDisabled =
    isPending ||
    !selectedInventory ||
    selectedInventory.availableStock === 0 ||
    quantity > selectedInventory.availableStock;

  useEffect(() => {
    const nextQuantity = Math.min(quantity, maxQuantity);
    setQuantity(nextQuantity);
    setQuantityInput(String(nextQuantity));
  }, [maxQuantity, quantity]);

  function commitQuantity(value: string) {
    const parsed = Number(value);

    if (!Number.isFinite(parsed)) {
      setQuantity(1);
      setQuantityInput("1");
      return 1;
    }

    const nextQuantity = Math.max(1, Math.min(maxQuantity, Math.trunc(parsed)));
    setQuantity(nextQuantity);
    setQuantityInput(String(nextQuantity));
    return nextQuantity;
  }

  function reserve() {
    setError(null);
    const nextQuantity = commitQuantity(quantityInput);

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
            quantity: nextQuantity,
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
    <aside className="space-y-5 rounded-lg border border-[var(--border)] bg-white p-5">
      <div>
        <p className="text-3xl font-semibold text-[var(--ink)]">
          {formatCurrency(product.price)}
        </p>
        <p className="mt-1 text-sm text-[var(--muted-ink)]">
          M.R.P. <span className="line-through">{formatCurrency(mrp)}</span>
        </p>
      </div>

      <p className="text-sm leading-6 text-[var(--muted-ink)]">{deliveryText}</p>

      <div className="space-y-1">
        <p className="text-4xl font-medium text-[#007600]">In stock</p>
        <p className="text-sm text-[var(--muted-ink)]">
          Total available now: {product.totalAvailableStock} units
        </p>
      </div>

      <div className="grid gap-4">
        <label className="block">
          <span className="mb-2 block text-sm font-medium text-[var(--ink)]">
            Dispatch hub
          </span>
          <select
            className="h-11 w-full rounded-lg border border-[var(--border)] bg-white px-4 text-sm outline-none transition focus:border-[var(--accent-strong)]"
            value={selectedInventoryId}
            onChange={(event) => setSelectedInventoryId(event.target.value)}
          >
            {product.inventories.map((inventory) => (
              <option key={inventory.inventoryId} value={inventory.inventoryId}>
                {inventory.warehouseName} - {inventory.warehouseLocation}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="mb-2 block text-sm font-medium text-[var(--ink)]">
            Quantity
          </span>
          <input
            type="number"
            min={1}
            max={maxQuantity}
            value={quantityInput}
            onChange={(event) => setQuantityInput(event.target.value)}
            onBlur={(event) => commitQuantity(event.target.value)}
            className="h-11 w-full rounded-lg border border-[var(--border)] bg-white px-4 text-sm outline-none transition focus:border-[var(--accent-strong)]"
          />
        </label>
      </div>

      <div className="space-y-2 text-sm">
        <InfoRow label="Ships from" value={selectedInventory?.warehouseName ?? "-"} />
        <InfoRow label="Location" value={selectedInventory?.warehouseLocation ?? "-"} />
        <InfoRow
          label="Available in hub"
          value={`${selectedInventory?.availableStock ?? 0} units`}
        />
        <InfoRow label="Payment" value="Secure transaction" />
      </div>

      {error ? <Alert tone="danger">{error}</Alert> : null}

      <Button className="w-full rounded-full" onClick={reserve} disabled={reserveDisabled}>
        {isPending ? "Reserving..." : "Reserve product"}
      </Button>
      <Button className="w-full rounded-full" variant="secondary" disabled>
        Buy now
      </Button>
    </aside>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-[13px] text-[var(--muted-ink)]">{label}</span>
      <span className="text-right text-sm font-medium text-[var(--ink)]">
        {value}
      </span>
    </div>
  );
}
