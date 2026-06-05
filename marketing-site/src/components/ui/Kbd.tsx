import React from "react";

interface KbdProps {
  children: React.ReactNode;
  className?: string;
}

export function Kbd({ children, className = "" }: KbdProps) {
  return (
    <kbd
      className={[
        "inline-flex items-center justify-center min-w-[1.5rem] h-6 px-1.5",
        "font-mono text-xs text-[var(--text-secondary)]",
        "rounded border border-[var(--border-color)] bg-[var(--bg-secondary)]",
        "shadow-[0_1px_0_0_var(--border-color)]",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
    </kbd>
  );
}
