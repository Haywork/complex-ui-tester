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

// ─── Brand tokens ────────────────────────────────────────────────────────────
const RED   = "#ef4444"; // alarm-red  — failing snapshot
const GREEN = "#22c55e"; // pass-green — sealed regression gate
const INK   = "#0a0a0b"; // IDE-grade near-black background
const PAPER = "#fafaf7"; // near-white for wordmark on dark bg

// ─── Loop-mark geometry ──────────────────────────────────────────────────────
// Circle circumference for r=1: 2π ≈ 6.2832.
// We work in a 1-unit normalised coordinate space and scale via SVG transform.
// The path starts at 12 o'clock (top) via rotate(-90).
//
// Split: 38% red dashes, 62% green solid.
// Circumference (r=1): 6.2832
// Red segment  length : 6.2832 × 0.38 ≈ 2.3876
// Green segment length: 6.2832 × 0.62 ≈ 3.8956
const CIRC = 6.2832;         // circumference at r=1
const RED_LEN   = CIRC * 0.38;   // 2.3876
const GREEN_LEN = CIRC * 0.62;   // 3.8956
const DASH_SIZE = 0.35;           // individual red dash length (normalised)
const DASH_GAP  = 0.30;           // gap between red dashes

/**
 * The SVG loop mark — inline, no network request.
 * viewBox: 0 0 2.4 2.4 (r=1, center at 1.2,1.2).
 */
function LoopMark({ diameter }: { diameter: number }) {
  const cx = 1.2;
  const cy = 1.2;
  const r  = 1.0;
  const strokeW     = 0.19;   // main stroke width
  const glowW       = strokeW * 3.5;
  const tailR       = 0.145;  // tail-bite dot radius

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
      {/* ── Ambient phosphor glow behind the full ring ── */}
      <circle
        cx={cx} cy={cy} r={r}
        stroke={GREEN}
        strokeWidth={glowW * 1.6}
        strokeOpacity={0.07}
      />

      {/* ── RED dashed segment — first 38% of loop ── */}
      <circle
        cx={cx} cy={cy} r={r}
        stroke={RED}
        strokeWidth={strokeW}
        strokeLinecap="round"
        strokeDasharray={`${DASH_SIZE} ${DASH_GAP}`}
        pathLength={CIRC}
        transform={`rotate(-90 ${cx} ${cy})`}
      />

      {/* ── Knockout: overdraw red beyond 38% mark with bg ink ── */}
      <circle
        cx={cx} cy={cy} r={r}
        stroke={INK}
        strokeWidth={strokeW * 1.4}
        strokeLinecap="butt"
        strokeDasharray={`${GREEN_LEN} ${RED_LEN}`}
        strokeDashoffset={-RED_LEN}
        pathLength={CIRC}
        transform={`rotate(-90 ${cx} ${cy})`}
      />

      {/* ── GREEN solid segment — outer phosphor glow ── */}
      <circle
        cx={cx} cy={cy} r={r}
        stroke={GREEN}
        strokeWidth={glowW}
        strokeOpacity={0.18}
        strokeLinecap="round"
        strokeDasharray={`${GREEN_LEN} ${RED_LEN}`}
        strokeDashoffset={-RED_LEN}
        pathLength={CIRC}
        transform={`rotate(-90 ${cx} ${cy})`}
      />

      {/* ── GREEN solid segment — main stroke ── */}
      <circle
        cx={cx} cy={cy} r={r}
        stroke={GREEN}
        strokeWidth={strokeW}
        strokeLinecap="round"
        strokeDasharray={`${GREEN_LEN} ${RED_LEN}`}
        strokeDashoffset={-RED_LEN}
        pathLength={CIRC}
        transform={`rotate(-90 ${cx} ${cy})`}
      />

      {/* ── Tail-bite dot — where green endpoint bites back to red start ──
           The green arc ends at exactly 12 o'clock (cx, cy−r).
      ── */}
      {/* Outer halo */}
      <circle
        cx={cx} cy={cy - r}
        r={tailR * 2.2}
        fill={GREEN}
        fillOpacity={0.2}
      />
      {/* Core dot */}
      <circle
        cx={cx} cy={cy - r}
        r={tailR}
        fill={GREEN}
      />

      {/* ── Interior play-triangle ▶ — negative space hint ──
           Three vertices chosen to sit cleanly inside the ring.
           Left point: (cx − 0.44, cy)
           Right-top:  (cx + 0.46, cy − 0.32)
           Right-bot:  (cx + 0.46, cy + 0.32)
      ── */}
      <path
        d={`M${cx - 0.44} ${cy - 0.3} L${cx + 0.46} ${cy} L${cx - 0.44} ${cy + 0.3} Z`}
        fill={GREEN}
        fillOpacity={0.28}
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
