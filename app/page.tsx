import { ProductCatalog } from "@/components/home/product-catalog";
import { listProducts, type ProductListItem } from "@/lib/data";

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

  return (
    <main className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[30rem] bg-[radial-gradient(circle_at_top,_rgba(246,186,111,0.38),_transparent_55%),radial-gradient(circle_at_right,_rgba(224,104,51,0.18),_transparent_32%)]" />
      <section className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-10 px-6 py-12 lg:px-10 lg:py-16">
        <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-end">
          <div className="space-y-6">
            <p className="inline-flex rounded-full bg-[var(--surface)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-[var(--muted-ink)] shadow-[0_15px_40px_rgba(29,21,14,0.08)]">
              Allo checkout integrity
            </p>
            <div className="space-y-4">
              <h1 className="max-w-4xl text-5xl font-semibold tracking-[-0.04em] text-[var(--ink)] sm:text-6xl">
                Reserve inventory without letting concurrent checkouts oversell it.
              </h1>
              <p className="max-w-2xl text-lg leading-8 text-[var(--muted-ink)]">
                This demo uses atomic PostgreSQL updates for stock protection,
                Redis-backed idempotency for safe retries, and timed reservation
                expiry for release automation.
              </p>
            </div>
          </div>

          <div className="rounded-[32px] border border-black/5 bg-[var(--surface)] p-6 shadow-[0_30px_70px_rgba(44,25,12,0.08)]">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--muted-ink)]">
              Core behavior
            </p>
            <div className="mt-4 grid gap-3 text-sm leading-6 text-[var(--ink)]">
              <div className="rounded-2xl bg-[var(--panel)] px-4 py-4">
                Atomic `reservedStock` increments block oversells.
              </div>
              <div className="rounded-2xl bg-[var(--panel)] px-4 py-4">
                10-minute holds can be confirmed, cancelled, or auto-expired.
              </div>
              <div className="rounded-2xl bg-[var(--panel)] px-4 py-4">
                Idempotency support protects duplicate reserve submissions.
              </div>
            </div>
          </div>
        </div>

        <ProductCatalog products={products} setupError={setupError} />
      </section>
    </main>
  );
}
