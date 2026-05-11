import type * as React from "react";

import { cn } from "@/lib/utils";

type BadgeProps = React.HTMLAttributes<HTMLSpanElement> & {
  tone?: "pending" | "confirmed" | "cancelled" | "expired" | "stock";
};

const toneStyles: Record<NonNullable<BadgeProps["tone"]>, string> = {
  pending: "bg-[#fff2d8] text-[#8a5a14]",
  confirmed: "bg-[#e8f5ec] text-[#245139]",
  cancelled: "bg-[#eef0f3] text-[#46525f]",
  expired: "bg-[#fde8e3] text-[#8c382a]",
  stock: "bg-[var(--panel)] text-[var(--ink)]",
};

export function Badge({
  className,
  tone = "stock",
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em]",
        toneStyles[tone],
        className,
      )}
      {...props}
    />
  );
}
