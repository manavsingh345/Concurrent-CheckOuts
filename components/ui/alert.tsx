import type * as React from "react";

import { cn } from "@/lib/utils";

type AlertProps = React.HTMLAttributes<HTMLDivElement> & {
  tone?: "neutral" | "danger" | "success";
};

const toneStyles: Record<NonNullable<AlertProps["tone"]>, string> = {
  neutral: "border-[color:var(--border)] bg-[var(--panel)] text-[var(--muted-ink)]",
  danger: "border-[#d9a39b] bg-[#fff0ec] text-[#7d2f23]",
  success: "border-[#9ec5aa] bg-[#edf8f0] text-[#245139]",
};

export function Alert({
  className,
  tone = "neutral",
  ...props
}: AlertProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border px-4 py-3 text-sm leading-6",
        toneStyles[tone],
        className,
      )}
      {...props}
    />
  );
}
