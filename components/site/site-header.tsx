"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

type SessionUser = {
  name: string;
  email: string;
};

type SiteHeaderProps = {
  warehouseCount?: number;
  liveUnits?: number;
};

export function SiteHeader({
  warehouseCount,
  liveUnits,
}: SiteHeaderProps) {
  const [sessionUser, setSessionUser] = useState<SessionUser | null>(null);

  useEffect(() => {
    const stored = window.localStorage.getItem("allo-demo-user");

    if (stored) {
      try {
        setSessionUser(JSON.parse(stored) as SessionUser);
      } catch {
        window.localStorage.removeItem("allo-demo-user");
      }
    }
  }, []);

  function signOut() {
    setSessionUser(null);
    window.localStorage.removeItem("allo-demo-user");
  }

  return (
    <header className="border-b border-[var(--border)] bg-white">
      <div className="mx-auto flex max-w-[1280px] items-center justify-between gap-6 px-4 py-5 lg:px-8">
        <Link href="/" className="flex items-center gap-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[var(--ink)] text-sm font-semibold text-white">
            A
          </div>
          <div>
            <p className="text-lg font-semibold text-[var(--ink)]">Allo Health</p>
            <p className="text-sm text-[var(--muted-ink)]">
              D2C wellness storefront
            </p>
          </div>
        </Link>

        <nav className="hidden items-center gap-8 text-sm text-[var(--muted-ink)] md:flex">
          <a href="/#catalog">Shop</a>
          <a href="/#collections">Collections</a>
          <a href="/api/products">Inventory API</a>
        </nav>

        <div className="flex items-center gap-3">
          {typeof warehouseCount === "number" && typeof liveUnits === "number" ? (
            <div className="hidden items-center gap-3 lg:flex">
              <Pill label="Warehouses" value={`${warehouseCount}`} />
              <Pill label="Sellable units" value={`${liveUnits}`} />
            </div>
          ) : null}

          <div className="hidden items-center gap-3 rounded-full border border-[var(--border)] bg-white px-3 py-2 lg:flex">
            <Image
              src="/images/customer-avatar.png"
              alt="User account"
              width={36}
              height={36}
              className="h-9 w-9 rounded-full border border-[var(--border)] object-cover"
            />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-[var(--ink)]">
                {sessionUser?.name ?? "Guest account"}
              </p>
              <p className="truncate text-xs text-[var(--muted-ink)]">
                {sessionUser?.email ?? "Sign in from the home page"}
              </p>
            </div>
            {sessionUser ? (
              <button
                className="rounded-full bg-[var(--panel-strong)] px-3 py-2 text-xs font-semibold text-[var(--ink)]"
                onClick={signOut}
              >
                Sign out
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </header>
  );
}

function Pill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-full border border-[var(--border)] bg-[var(--surface-alt)] px-4 py-2">
      <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--muted-ink)]">
        {label}
      </span>
      <span className="ml-2 text-sm font-semibold text-[var(--ink)]">{value}</span>
    </div>
  );
}
