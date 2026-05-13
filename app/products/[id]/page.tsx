import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ProductPurchasePanel } from "@/components/products/product-purchase-panel";
import { SiteFooter } from "@/components/site/site-footer";
import { SiteHeader } from "@/components/site/site-header";
import { Badge } from "@/components/ui/badge";
import { getProductById } from "@/lib/data";
import { getProductMerch } from "@/lib/product-merch";
import { formatCurrency } from "@/lib/utils";

export const dynamic = "force-dynamic";

type ProductPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function ProductPage({ params }: ProductPageProps) {
  const { id } = await params;
  const product = await getProductById(id);

  if (!product) {
    notFound();
  }

  const merch = getProductMerch(product);
  const mrp = Math.round(product.price * merch.mrpMultiplier);
  const discount = Math.max(
    1,
    Math.round(((mrp - product.price) / mrp) * 100),
  );
  const warehouseCount = new Set(
    product.inventories.map((inventory) => inventory.warehouseId),
  ).size;

  return (
    <>
      <SiteHeader
        warehouseCount={warehouseCount}
        liveUnits={product.totalAvailableStock}
      />
      <main className="mx-auto max-w-[1440px] px-4 py-8 lg:px-8">
        <div className="mb-6 flex items-center gap-3 text-sm text-[var(--muted-ink)]">
          <Link href="/" className="hover:text-[var(--ink)]">
            Home
          </Link>
          <span>/</span>
          <span>{merch.category}</span>
          <span>/</span>
          <span className="text-[var(--ink)]">{product.name}</span>
        </div>

        <div className="grid gap-8 xl:grid-cols-[120px_minmax(0,1.2fr)_minmax(0,0.9fr)_340px]">
          <div className="hidden gap-3 xl:grid">
            {[0, 1, 2, 3].map((item) => (
              <div
                key={item}
                className="overflow-hidden rounded-lg border border-[var(--border)] bg-[#f8fafc]"
              >
                <Image
                  src={merch.image}
                  alt={product.name}
                  width={92}
                  height={92}
                  className="h-[92px] w-[92px] object-cover"
                />
              </div>
            ))}
          </div>

          <section className="rounded-lg border border-[var(--border)] bg-white p-6">
            <div className="relative aspect-square overflow-hidden rounded-lg bg-[#f8fafc]">
              <Image
                src={merch.image}
                alt={product.name}
                fill
                priority
                className="object-contain"
                sizes="(max-width: 1280px) 100vw, 45vw"
              />
            </div>
          </section>

          <section className="space-y-5">
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <Badge>{merch.badge}</Badge>
                <span className="text-sm text-[var(--muted-ink)]">{merch.category}</span>
              </div>

              <h1 className="mt-4 text-4xl leading-tight text-[var(--ink)]">
                {product.name}
              </h1>

              <p className="mt-4 text-lg leading-8 text-[var(--muted-ink)]">
                {product.description ?? merch.subtitle}
              </p>
            </div>

            <div className="border-b border-[var(--border)] pb-5">
              <p className="text-lg text-[var(--muted-ink)]">
                <span className="font-medium text-[var(--ink)]">{merch.rating}</span>{" "}
                {"★★★★★"} ({merch.reviewCount}) | {merch.monthlyBought}
              </p>
              <div className="mt-4 flex flex-wrap items-center gap-4">
                <span className="rounded-sm bg-[#cc0c39] px-2.5 py-1 text-sm font-semibold text-white">
                  {merch.offerLabel}
                </span>
                <span className="text-lg text-[var(--muted-ink)]">
                  -{discount}%{" "}
                  <span className="text-5xl text-[var(--ink)]">
                    {formatCurrency(product.price)}
                  </span>
                </span>
              </div>
              <p className="mt-3 text-sm text-[var(--muted-ink)]">
                M.R.P. <span className="line-through">{formatCurrency(mrp)}</span>
              </p>
            </div>

            <div className="space-y-4">
              <h2 className="text-2xl font-semibold text-[var(--ink)]">
                About this product
              </h2>
              <ul className="space-y-3 text-base leading-7 text-[var(--muted-ink)]">
                {merch.detailBullets.map((bullet) => (
                  <li key={bullet} className="flex gap-3">
                    <span className="mt-2 h-1.5 w-1.5 rounded-full bg-[var(--ink)]" />
                    <span>{bullet}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <FeatureBox label="Benefits" value={merch.benefits[0]} />
              <FeatureBox
                label="Fulfillment"
                value={`${product.inventories.length} hubs active`}
              />
              <FeatureBox
                label="Available now"
                value={`${product.totalAvailableStock} units`}
              />
            </div>
          </section>

          <section id="reserve">
            <ProductPurchasePanel
              product={product}
              mrp={mrp}
              deliveryText={`${merch.delivery}. Reserve stock for checkout from the warehouse that suits the customer best.`}
            />
          </section>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}

function FeatureBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-[var(--border)] bg-white p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted-ink)]">
        {label}
      </p>
      <p className="mt-2 text-base font-semibold text-[var(--ink)]">{value}</p>
    </div>
  );
}
