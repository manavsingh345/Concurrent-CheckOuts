"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";

import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import type { ProductListItem } from "@/lib/data";
import { getProductMerch, productCategories } from "@/lib/product-merch";
import { cn, formatCurrency } from "@/lib/utils";

type ProductCatalogProps = {
  products: ProductListItem[];
  setupError?: string | null;
};

export function ProductCatalog({
  products,
  setupError,
}: ProductCatalogProps) {
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] =
    useState<(typeof productCategories)[number]>("All");

  const decoratedProducts = useMemo(
    () =>
      products.map((product, index) => ({
        product,
        merch: getProductMerch(product, index),
      })),
    [products],
  );

  const filteredProducts = useMemo(() => {
    const search = query.trim().toLowerCase();

    return decoratedProducts.filter(({ product, merch }) => {
      const matchesCategory =
        activeCategory === "All" || merch.category === activeCategory;
      const matchesQuery =
        search.length === 0 ||
        product.name.toLowerCase().includes(search) ||
        merch.title.toLowerCase().includes(search) ||
        merch.subtitle.toLowerCase().includes(search);

      return matchesCategory && matchesQuery;
    });
  }, [activeCategory, decoratedProducts, query]);

  const liveUnits = products.reduce(
    (sum, product) => sum + product.totalAvailableStock,
    0,
  );
  const fastestProduct =
    decoratedProducts
      .slice()
      .sort(
        (left, right) =>
          right.product.totalAvailableStock - left.product.totalAvailableStock,
      )[0]?.merch.title ?? "Live catalog";

  return (
    <div className="space-y-10">
      {setupError ? (
        <Alert tone="danger">
          {setupError} Add working database credentials, run `npm run db:push` and
          `npm run db:seed`, then refresh.
        </Alert>
      ) : null}

      <section
        id="catalog"
        className="grid gap-8 border-t border-[var(--border)] py-10 lg:grid-cols-[minmax(0,1fr)_320px]"
      >
        <div className="space-y-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted-ink)]">
                Shop All
              </p>
              <h2 className="mt-2 text-3xl font-semibold text-[var(--ink)]">
                Browse cards first, then open a dedicated product page
              </h2>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <StatChip label="Sellable now" value={`${liveUnits} units`} />
              <StatChip label="Trending" value={fastestProduct} />
            </div>
          </div>

          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <label className="block w-full lg:max-w-md">
              <span className="sr-only">Search products</span>
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search products, collections, or care categories"
                className="h-12 w-full rounded-full border border-[var(--border)] bg-white px-5 text-sm outline-none transition focus:border-[var(--accent-strong)]"
              />
            </label>
            <div className="flex flex-wrap gap-2">
              {productCategories.map((category) => (
                <button
                  key={category}
                  className={cn(
                    "h-10 rounded-full border px-4 text-sm font-medium",
                    activeCategory === category
                      ? "border-[var(--ink)] bg-[var(--ink)] text-white"
                      : "border-[var(--border)] bg-white text-[var(--muted-ink)]",
                  )}
                  onClick={() => setActiveCategory(category)}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {filteredProducts.map(({ product, merch }, index) => (
              <ProductCard
                key={product.id}
                product={product}
                merch={merch}
                priority={index < 2}
              />
            ))}
          </div>
        </div>

        <aside className="space-y-6">
          <div className="rounded-lg border border-[var(--border)] bg-white p-6">
            <p className="text-sm font-semibold text-[var(--ink)]">Shopping support</p>
            <div className="mt-4 space-y-4 text-sm text-[var(--muted-ink)]">
              <InfoRow label="Delivery promise" value="2-4 business days" />
              <InfoRow label="Reserve flow" value="Held at checkout only" />
              <InfoRow label="Coverage" value="Delhi NCR and Bengaluru" />
              <InfoRow label="Customer help" value="Priority support chat" />
            </div>
          </div>

          <div className="rounded-lg border border-[var(--border)] bg-white p-6">
            <p className="text-sm font-semibold text-[var(--ink)]">Why it works</p>
            <div className="mt-4 space-y-4 text-sm text-[var(--muted-ink)]">
              <InfoRow label="Storefront" value="Clean retail browsing" />
              <InfoRow label="Inventory" value="Warehouse-aware underneath" />
              <InfoRow label="Checkout" value="Race-safe reservation logic" />
            </div>
          </div>
        </aside>
      </section>
    </div>
  );
}

function ProductCard({
  product,
  merch,
  priority,
}: {
  product: ProductListItem;
  merch: ReturnType<typeof getProductMerch>;
  priority: boolean;
}) {
  const mrp = Math.round(product.price * merch.mrpMultiplier);
  const discount = Math.max(
    1,
    Math.round(((mrp - product.price) / mrp) * 100),
  );

  return (
    <Link
      href={`/products/${product.id}`}
      className="group overflow-hidden rounded-lg border border-[var(--border)] bg-white transition hover:border-slate-300 hover:shadow-[0_10px_30px_rgba(15,23,42,0.08)]"
    >
      <div className="relative aspect-[4/3] bg-[#f8fafc]">
        <Image
          src={merch.image}
          alt={merch.title}
          fill
          priority={priority}
          className="object-cover"
          sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
        />
      </div>

      <div className="space-y-3 p-4">
        <div className="flex items-start justify-between gap-3">
          <Badge>{merch.badge}</Badge>
          <span className="text-xs font-medium text-[var(--muted-ink)]">
            {merch.category}
          </span>
        </div>

        <h3 className="line-clamp-3 text-[22px] leading-8 text-[var(--ink)] group-hover:text-[var(--accent-strong)]">
          {product.name}
        </h3>

        <div className="text-sm text-[var(--muted-ink)]">
          <span className="font-medium text-[var(--ink)]">{merch.rating}</span>{" "}
          {"★★★★★"} ({merch.reviewCount})
        </div>

        <p className="text-sm text-[var(--muted-ink)]">{merch.monthlyBought}</p>

        <div className="inline-flex rounded-sm bg-[#cc0c39] px-2.5 py-1 text-sm font-semibold text-white">
          {merch.offerLabel}
        </div>

        <div className="space-y-1">
          <p className="text-4xl font-semibold text-[var(--ink)]">
            {formatCurrency(product.price)}
          </p>
          <p className="text-sm text-[var(--muted-ink)]">
            M.R.P. <span className="line-through">{formatCurrency(mrp)}</span>{" "}
            <span className="text-[var(--ink)]">({discount}% off)</span>
          </p>
        </div>

        <p className="text-sm text-[var(--muted-ink)]">{merch.delivery}</p>
      </div>
    </Link>
  );
}

function StatChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-full border border-[var(--border)] bg-white px-4 py-3">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--muted-ink)]">
        {label}
      </p>
      <p className="mt-1 text-sm font-semibold text-[var(--ink)]">{value}</p>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-[var(--border)] pb-3 last:border-b-0 last:pb-0">
      <span className="text-[13px] text-[var(--muted-ink)]">{label}</span>
      <span className="text-right text-sm font-medium text-[var(--ink)]">
        {value}
      </span>
    </div>
  );
}
