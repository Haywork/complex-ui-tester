import React from "react";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  as?: React.ElementType;
}

export function Card({ children, className = "", hover = false, as: Tag = "div" }: CardProps) {
  return (
    <Tag
      className={[
        "rounded-[var(--radius-lg)] border border-[var(--border-color)] bg-[var(--bg-secondary)]",
        "p-6",
        hover &&
          "transition-all duration-200 hover:border-[var(--color-mute-4)] hover:shadow-[var(--shadow-card-hover)] hover:-translate-y-0.5 cursor-pointer",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
    </Tag>
  );
}
