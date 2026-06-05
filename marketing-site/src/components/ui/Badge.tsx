import React from "react";

type BadgeVariant = "default" | "success" | "warning" | "error" | "accent" | "mono";

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  className?: string;
}

const variantClasses: Record<BadgeVariant, string> = {
  default:
    "bg-[var(--bg-secondary)] text-[var(--text-secondary)] border border-[var(--border-color)]",
  success:
    "bg-green-950/60 text-green-400 border border-green-900/50",
  warning:
    "bg-amber-950/60 text-amber-400 border border-amber-900/50",
  error:
    "bg-red-950/60 text-red-400 border border-red-900/50",
  accent:
    "bg-orange-950/60 text-[var(--color-accent)] border border-orange-900/50",
  mono:
    "bg-[var(--bg-secondary)] text-[var(--text-primary)] border border-[var(--border-color)] font-mono",
};

export function Badge({ variant = "default", children, className = "" }: BadgeProps) {
  return (
    <span
      className={[
        "inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-[var(--radius-sm)]",
        variantClasses[variant],
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
    </span>
  );
}
