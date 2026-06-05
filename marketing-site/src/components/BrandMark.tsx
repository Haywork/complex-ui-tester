interface BrandMarkProps {
  size?: number;
  className?: string;
}

/**
 * CUIT brand mark — a terminal-cursor square in the accent color.
 * Inline SVG, no asset pipeline dependency.
 */
export function BrandMark({ size = 20, className = "" }: BrandMarkProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className={className}
    >
      {/* Rounded square container */}
      <rect
        x="0.75"
        y="0.75"
        width="18.5"
        height="18.5"
        rx="4.5"
        fill="var(--color-accent)"
        fillOpacity="1"
      />
      {/* Terminal cursor "▍" — a thick left-aligned block */}
      <rect
        x="4"
        y="5"
        width="5"
        height="10"
        rx="1"
        fill="white"
        fillOpacity="0.95"
      />
      {/* Thin right stroke — the blink line */}
      <rect
        x="11"
        y="5"
        width="5"
        height="3"
        rx="0.75"
        fill="white"
        fillOpacity="0.6"
      />
      <rect
        x="11"
        y="10"
        width="5"
        height="3"
        rx="0.75"
        fill="white"
        fillOpacity="0.4"
      />
    </svg>
  );
}
