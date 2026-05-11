import type * as React from "react";

import { cn } from "@/lib/utils";

type CardProps = React.HTMLAttributes<HTMLDivElement>;

export function Card({ className, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-[28px] border border-black/5 bg-[var(--surface)] p-6 shadow-[0_24px_60px_rgba(45,29,15,0.08)]",
        className,
      )}
      {...props}
    />
  );
}
