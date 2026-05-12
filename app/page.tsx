import Image from "next/image";

import { SiteFooter } from "@/components/site/site-footer";
import { SiteHeader } from "@/components/site/site-header";
import { ProductCatalog } from "@/components/home/product-catalog";
import { listProducts, type ProductListItem } from "@/lib/data";
import { formatCurrency } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function Home() {
  let products: ProductListItem[] = [];
  let setupError: string | null = null;

  try {
    products = await listProducts();
  } catch (error) {
    setupError =
      error instanceof Error
        ? error.message
        : "The catalog is waiting for the database connection.";
  }

  const liveUnits = products.reduce(
    (sum, product) => sum + product.totalAvailableStock,
    0,
  );
  const warehouseCount = new Set(
    products.flatMap((product) =>
      product.inventories.map((inventory) => inventory.warehouseId),
    ),
  ).size;

  return (
    <>
      <SiteHeader warehouseCount={warehouseCount} liveUnits={liveUnits} />
      <main className="bg-white">
        {/* ── Hero Section ── */}
        <section className="border-b border-[var(--border)] bg-gradient-to-b from-[#fdf8f4] to-white">
          <div className="mx-auto grid max-w-[1280px] gap-10 px-4 py-14 lg:grid-cols-[1.1fr_0.9fr] lg:items-start lg:px-8 lg:py-20">
            {/* Left – Copy */}
            <div className="max-w-xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-[#e8d5c4] bg-[#fef6ee] px-4 py-1.5">
                <span className="h-2 w-2 rounded-full bg-[#e07a3a]" />
                <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[#b45e24]">
                  New arrivals in stock
                </span>
              </div>
              <h1 className="mt-6 text-4xl font-semibold leading-[1.15] tracking-tight text-[var(--ink)] sm:text-[52px]">
                Your daily wellness,{" "}
                <span className="text-[#c05e20]">delivered with care.</span>
              </h1>
              <p className="mt-5 text-[17px] leading-8 text-[var(--muted-ink)]">
                Doctor-reviewed supplements, smart health devices, and curated
                care kits — shipped from regional hubs across India with a
                10-minute checkout hold that guarantees your stock.
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-4">
                <a
                  href="#catalog"
                  className="inline-flex h-12 items-center justify-center rounded-full bg-[var(--ink)] px-7 text-sm font-semibold text-white shadow-[0_8px_30px_rgba(15,23,42,0.18)] transition hover:shadow-[0_12px_40px_rgba(15,23,42,0.25)]"
                >
                  Shop all products
                </a>
                <a
                  href="#catalog"
                  className="inline-flex h-12 items-center justify-center rounded-full border border-[var(--border)] bg-white px-7 text-sm font-semibold text-[var(--ink)] transition hover:bg-[var(--surface-alt)]"
                >
                  Bestsellers
                </a>
              </div>

              {/* Trust strip */}
              <div className="mt-10 flex flex-wrap gap-6 border-t border-[var(--border)] pt-6">
                <TrustItem icon="🚚" label="Free delivery" sub="Orders ₹499+" />
                <TrustItem icon="↩️" label="Easy returns" sub="7-day window" />
                <TrustItem icon="🔒" label="Secure checkout" sub="Stock held for you" />
              </div>
            </div>

            {/* Right – Image collage */}
            <div id="collections" className="space-y-2.5">
              {/* Large hero image */}
              <div className="group relative overflow-hidden rounded-2xl">
                <div className="relative aspect-[4/3] bg-[#f5ede6]">
                  <Image
                    src="/images/hero-lifestyle.png"
                    alt="Wellness essentials flat-lay"
                    fill
                    priority
                    className="object-cover transition duration-500 group-hover:scale-105"
                    sizes="(max-width: 768px) 100vw, 50vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                  <div className="absolute bottom-4 left-4 right-4">
                    <span className="inline-block rounded-full bg-white/90 px-3.5 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--ink)] backdrop-blur-sm">
                      ✨ Summer wellness edit
                    </span>
                  </div>
                </div>
              </div>

              {/* Product quick-strip — 4 thumbnails in one row */}
              <div className="grid grid-cols-4 gap-2">
                {products.slice(0, 4).map((product, index) => {
                  const images = [
                    "/images/performance-gummies.png",
                    "/images/smart-monitor.png",
                    "/images/sleep-kit.png",
                    "/images/care-speaker.png",
                  ];
                  return (
                    <a
                      key={product.id}
                      href={`/products/${product.id}`}
                      className="group overflow-hidden rounded-lg border border-[var(--border)] bg-white transition hover:border-slate-300 hover:shadow-[0_4px_16px_rgba(15,23,42,0.06)]"
                    >
                      <div className="relative aspect-square bg-[#f8fafc]">
                        <Image
                          src={images[index % images.length]}
                          alt={product.name}
                          fill
                          className="object-cover p-2 transition duration-500 group-hover:scale-110"
                          sizes="(max-width: 768px) 25vw, 12vw"
                        />
                      </div>
                      <div className="px-2 py-1.5">
                        <p className="text-[11px] font-medium text-[var(--ink)] line-clamp-1 group-hover:text-[var(--accent-strong)]">
                          {product.name}
                        </p>
                        <p className="text-[11px] font-semibold text-[var(--ink)]">
                          {formatCurrency(product.price)}
                        </p>
                      </div>
                    </a>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {/* ── Promotional banner strip ── */}
        <section className="border-b border-[var(--border)] bg-[#fdf8f4]">
          <div className="mx-auto grid max-w-[1280px] items-center gap-8 px-4 py-8 lg:grid-cols-[auto_1fr_auto] lg:px-8">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#fef0e5] text-xl">
                🎁
              </div>
              <div>
                <p className="text-sm font-semibold text-[var(--ink)]">
                  First order? Get 15% off
                </p>
                <p className="text-xs text-[var(--muted-ink)]">
                  Use code ALLO15 at checkout
                </p>
              </div>
            </div>
            <div className="hidden h-px bg-[var(--border)] lg:block" />
            <div className="flex flex-wrap items-center gap-8 text-sm text-[var(--muted-ink)]">
              <span className="flex items-center gap-2">
                <span className="text-base">📦</span> {liveUnits} units
                available now
              </span>
              <span className="flex items-center gap-2">
                <span className="text-base">🏭</span> Ships from{" "}
                {warehouseCount} regional hubs
              </span>
              <span className="flex items-center gap-2">
                <span className="text-base">⏱️</span> 10-min checkout hold
              </span>
            </div>
          </div>
        </section>

        {/* ── Catalog section ── */}
        <section className="mx-auto max-w-[1280px] px-4 py-10 lg:px-8">
          <ProductCatalog products={products} setupError={setupError} />
        </section>
      </main>
      <SiteFooter />
    </>
  );
}

function TrustItem({
  icon,
  label,
  sub,
}: {
  icon: string;
  label: string;
  sub: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-lg">{icon}</span>
      <div>
        <p className="text-sm font-semibold text-[var(--ink)]">{label}</p>
        <p className="text-xs text-[var(--muted-ink)]">{sub}</p>
      </div>
    </div>
  );
}
