/**
 * BrandMark — CUIT logo mark + wordmark lockup.
 *
 * The mark is a closed ouroboros loop rendered as a single continuous stroke:
 *   - RED dashed segment  → the failing snapshot (HEAD diverged)
 *   - SOLID GREEN segment → the passing trace (regression gate sealed)
 *   - The loop bites its own tail, completing the feedback cycle.
 *   - Interior negative space hints at a play/▶ symbol.
 *
 * Works on dark backgrounds (the brand default). On light backgrounds set
 * `invertBg` to receive a dark pill wrapper so the mark stays legible.
 *
 * Size scaling: the `size` prop controls mark height; wordmark scales proportionally.
 */

interface BrandMarkProps {
  /**
   * Mark diameter in px. Default 24.
   * The wordmark auto-scales with this value.
   */
  size?: number;
  /**
   * Show only the loop mark (no wordmark). Useful for compact navbars.
   * Default: false (show full lockup).
   */
  markOnly?: boolean;
  /**
   * Wrap the mark in a dark rounded square — use on light backgrounds.
   * Default: false.
   */
  invertBg?: boolean;
  className?: string;
  /** Override the word-mark label. Defaults to "CUIT". */
  label?: string;
}

// ─── Brand tokens (SpeechLab-aligned) ────────────────────────────────────────
const RED   = "#e5573a"; // alarm-red  — failing snapshot
const TEAL  = "#36decf"; // electric teal — sealed regression gate (signature accent)
const GREEN = TEAL;      // alias: the "pass" segment is teal in the SpeechLab palette
const INK   = "#121214"; // IDE-grade near-black background
const PAPER = "#fbfbff"; // near-white for wordmark on dark bg

// ─── Loop-mark geometry ──────────────────────────────────────────────────────
// Circle circumference for r=1: 2π ≈ 6.2832. We work in a 1-unit normalised
// coordinate space and scale via SVG transform. The path starts at 12 o'clock
// (top) via rotate(-90). A clean teal arc (pass) + short red arc (fail).
const CIRC = 6.2832;         // circumference at r=1

/**
 * The SVG loop mark — inline, no network request.
 * viewBox: 0 0 2.4 2.4 (r=1, center at 1.2,1.2).
 */
function LoopMark({ diameter }: { diameter: number }) {
  const cx = 1.2;
  const cy = 1.2;
  const r  = 1.0;
  const strokeW     = 0.19;   // main stroke width
  const tailR       = 0.145;  // tail-bite dot radius

  // Clean two-arc ring: ~72% teal (the sealed/pass segment) + a gap + a short
  // red arc (the failing snapshot). No background knockout, no heavy glow — so
  // it reads legibly on ANY background and never collapses into a scribble.
  const GAP = 0.04 * CIRC;              // breathing gap between the two arcs
  const tealLen = CIRC * 0.66;
  const redLen = CIRC * 0.22;

  return (
    <svg
      width={diameter}
      height={diameter}
      viewBox="0 0 2.4 2.4"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      style={{ display: "block", flexShrink: 0 }}
    >
      {/* Faint full ring for structure */}
      <circle
        cx={cx} cy={cy} r={r}
        stroke={TEAL}
        strokeWidth={strokeW}
        strokeOpacity={0.12}
      />

      {/* TEAL arc — the pass / sealed segment (starts at 12 o'clock) */}
      <circle
        cx={cx} cy={cy} r={r}
        stroke={TEAL}
        strokeWidth={strokeW}
        strokeLinecap="round"
        strokeDasharray={`${tealLen} ${CIRC - tealLen}`}
        pathLength={CIRC}
        transform={`rotate(-90 ${cx} ${cy})`}
      />

      {/* RED arc — the failing snapshot, after the gap */}
      <circle
        cx={cx} cy={cy} r={r}
        stroke={RED}
        strokeWidth={strokeW}
        strokeLinecap="round"
        strokeDasharray={`${redLen} ${CIRC - redLen}`}
        strokeDashoffset={-(tealLen + GAP)}
        pathLength={CIRC}
        transform={`rotate(-90 ${cx} ${cy})`}
      />

      {/* Tail dot where the teal arc begins (12 o'clock) */}
      <circle cx={cx} cy={cy - r} r={tailR} fill={TEAL} />

      {/* Interior play-triangle ▶ */}
      <path
        d={`M${cx - 0.36} ${cy - 0.34} L${cx + 0.42} ${cy} L${cx - 0.36} ${cy + 0.34} Z`}
        fill={TEAL}
        fillOpacity={0.9}
      />
    </svg>
  );
}

// ─── Full lockup ─────────────────────────────────────────────────────────────

export function BrandMark({
  size      = 24,
  markOnly  = false,
  invertBg  = false,
  className = "",
  label     = "CUIT",
}: BrandMarkProps) {
  // Typography scale relative to mark diameter
  const wordmarkSize = Math.round(size * 0.625);      // ~15px at size=24
  const subtitleSize = Math.round(size * 0.255);      // ~6px  at size=24
  const gap          = Math.round(size * 0.375);      // ~9px  at size=24

  const mark = <LoopMark diameter={size} />;

  if (markOnly) {
    if (invertBg) {
      return (
        <span
          className={className}
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            background: INK,
            borderRadius: Math.round(size * 0.22),
            padding: Math.round(size * 0.2),
          }}
        >
          {mark}
        </span>
      );
    }
    return (
      <span className={`inline-flex ${className}`} aria-label={label}>
        {mark}
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center ${className}`}
      style={{ gap }}
      aria-label={`${label} — complex-ui-tester`}
    >
      {/* Loop mark */}
      {invertBg ? (
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            background: INK,
            borderRadius: Math.round(size * 0.22),
            padding: Math.round(size * 0.18),
            flexShrink: 0,
          }}
        >
          {mark}
        </span>
      ) : mark}

      {/* Thin vertical rule */}
      <span
        aria-hidden="true"
        style={{
          display: "block",
          width: 1,
          alignSelf: "stretch",
          background: "var(--border-color, #2a2a2d)",
          opacity: 0.7,
          flexShrink: 0,
          minHeight: size * 0.6,
        }}
      />

      {/* Text lockup */}
      <span
        style={{
          display: "flex",
          flexDirection: "column",
          gap: Math.round(size * 0.08),
          lineHeight: 1,
        }}
      >
        {/* Wordmark */}
        <span
          style={{
            fontFamily: `'JetBrains Mono', 'SF Mono', 'Fira Code', 'Courier New', monospace`,
            fontSize: wordmarkSize,
            fontWeight: 700,
            letterSpacing: "0.08em",
            color: PAPER,
            lineHeight: 1,
            whiteSpace: "nowrap",
          }}
        >
          {label}
        </span>

        {/* Scan-line / trace accent: red→green gradient bar */}
        <span
          aria-hidden="true"
          style={{
            display: "block",
            height: Math.max(1, Math.round(size * 0.07)),
            borderRadius: 999,
            background: `linear-gradient(
              to right,
              ${RED}CC 0%,
              ${RED}88 36%,
              ${RED}00 38%,
              ${GREEN}00 38.1%,
              ${GREEN}66 60%,
              ${GREEN}44 100%
            )`,
            width: `${label.length * wordmarkSize * 0.62}px`,
          }}
        />

        {/* Subtitle */}
        <span
          style={{
            fontFamily: `'JetBrains Mono', 'SF Mono', 'Fira Code', 'Courier New', monospace`,
            fontSize: subtitleSize,
            fontWeight: 400,
            letterSpacing: "0.14em",
            color: "var(--text-tertiary, #71717a)",
            lineHeight: 1,
            whiteSpace: "nowrap",
          }}
        >
          complex-ui-tester
        </span>
      </span>
    </span>
  );
}
