"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
};

const variants: Record<NonNullable<ButtonProps["variant"]>, string> = {
  primary:
    "bg-[var(--accent-strong)] text-[var(--surface)] shadow-[0_18px_45px_rgba(216,99,34,0.24)] hover:bg-[var(--accent)]",
  secondary:
    "bg-[var(--panel-strong)] text-[var(--ink)] hover:bg-[var(--panel)]",
  ghost:
    "bg-transparent text-[var(--ink)] hover:bg-[var(--panel)]",
  danger: "bg-[#8f2f23] text-white hover:bg-[#772419]",
};

export function Button({
  className,
  variant = "primary",
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex h-11 items-center justify-center rounded-full px-5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50",
        variants[variant],
        className,
      )}
      {...props}
    />
  );
}
