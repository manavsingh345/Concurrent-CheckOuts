import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="border-t border-[var(--border)] bg-[var(--surface-alt)]">
      <div className="mx-auto grid max-w-[1280px] gap-8 px-4 py-10 lg:grid-cols-[1.1fr_0.9fr_0.9fr] lg:px-8">
        <div>
          <p className="text-lg font-semibold text-[var(--ink)]">Allo Health</p>
          <p className="mt-3 max-w-md text-sm leading-7 text-[var(--muted-ink)]">
            A clean product storefront for modern wellness commerce, backed by
            warehouse-aware reservation logic that protects checkout stock.
          </p>
        </div>

        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--muted-ink)]">
            Explore
          </p>
          <div className="mt-4 flex flex-col gap-3 text-sm text-[var(--ink)]">
            <a href="/#catalog">Shop products</a>
            <a href="/#collections">Collections</a>
            <Link href="/api/products">Product API</Link>
          </div>
        </div>

        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--muted-ink)]">
            Customer care
          </p>
          <div className="mt-4 space-y-3 text-sm text-[var(--muted-ink)]">
            <p>support@allohealth.com</p>
            <p>Mon-Sat, 9 AM to 8 PM</p>
            <p>Delhi NCR and Bengaluru fulfillment network</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
