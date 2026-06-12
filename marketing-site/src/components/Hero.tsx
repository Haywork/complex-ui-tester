"use client";

import Link from "next/link";
import { Button } from "@/components/ui/Button";

const STAT_ROW = [
  { value: "0.18s", label: "loop closed, end-to-end" },
  { value: "73 / 73", label: "package tests passing" },
  { value: "0%", label: "CI flake rate" },
  { value: "Chrome ext", label: "first-party recorder shipping" },
];

/**
 * Three concrete steps shown in the hero as a horizontal mini-flow.
 * accent determines the dot / connector colour to signal pass vs in-progress vs fail.
 */
const STEPS: { step: string; label: string; accent: "green" | "red" | "neutral" }[] = [
  { step: "01", label: "Record interaction in Chrome", accent: "red" },
  { step: "02", label: "Run /cuit-loop in Claude Code", accent: "neutral" },
  { step: "03", label: "Regression gate committed to CI", accent: "green" },
];

export function Hero() {
  return (
    <section
      className="relative pt-24 pb-16 md:pt-28 md:pb-24 overflow-hidden"
      aria-labelledby="hero-headline"
    >
      {/* Subtle grid background */}
      <div
        className="absolute inset-0 opacity-[0.035]"
        aria-hidden="true"
        style={{
          backgroundImage:
            "linear-gradient(var(--color-mute-5) 1px, transparent 1px), linear-gradient(90deg, var(--color-mute-5) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      {/* Radial glow */}
      <div
        className="absolute inset-x-0 top-0 h-80 opacity-20"
        aria-hidden="true"
        style={{
          background:
            "radial-gradient(ellipse 60% 50% at 50% 0%, var(--color-accent) 0%, transparent 70%)",
        }}
      />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl">
          {/* Main slogan — the lead */}
          <p className="text-3xl sm:text-4xl font-semibold tracking-tight text-[var(--text-primary)] mb-6">
            The best UI feedback loop for{" "}
            <span style={{ color: "var(--color-accent)" }}>Claude Code</span>{" "}
            &amp;{" "}
            <span style={{ color: "var(--color-accent)" }}>Codex</span>
          </p>

          {/* Eyebrow */}
          <p className="font-mono text-xs uppercase tracking-widest text-[var(--text-tertiary)] mb-6 flex items-center gap-2">
            <span
              className="inline-block w-4 h-px bg-[var(--color-accent)]"
              aria-hidden="true"
            />
            MCP skill for Claude Code &amp; Codex · deterministic · CI-native
          </p>

          {/* Headline — concrete outcome first */}
          <h1
            id="hero-headline"
            className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-[1.05] tracking-tight text-[var(--text-primary)] mb-6"
          >
            Turn a recorded interaction into a committed{" "}
            {/* Dark mode: gradient from bright paper → mute-5. Light mode: solid text-primary. */}
            <span className="relative inline-block hero-gradient-text">
              regression gate.
            </span>
          </h1>

          {/* Subheadline — method, not slogan */}
          <p className="text-lg md:text-xl text-[var(--text-secondary)] max-w-2xl leading-relaxed mb-10">
            A deterministic harness — no pixel-coordinate tests, no fragile
            selectors. Run{" "}
            <code className="font-mono text-sm px-1.5 py-0.5 rounded bg-[var(--color-mute-1)] text-[var(--text-primary)]">
              /cuit-loop
            </code>{" "}
            in Claude Code: CUIT spec-gens a grounded Playwright spec from
            semantic events and commits a{" "}
            <span
              className="font-semibold"
              style={{ color: "var(--accent-green)" }}
            >
              green
            </span>{" "}
            CI gate — all in one conversation turn.
          </p>

          {/* Three-step mini-flow */}
          <ol
            aria-label="How it works in three steps"
            className="flex flex-wrap gap-x-0 gap-y-3 mb-10"
          >
            {STEPS.map(({ step, label, accent }, index) => {
              const dotColor =
                accent === "green"
                  ? "var(--accent-green)"
                  : accent === "red"
                  ? "var(--accent-red)"
                  : "var(--text-tertiary)";
              const isLast = index === STEPS.length - 1;

              return (
                <li
                  key={step}
                  className="flex items-center gap-3"
                >
                  {/* Step dot */}
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ background: dotColor }}
                    aria-hidden="true"
                  />
                  {/* Step label */}
                  <span className="font-mono text-xs text-[var(--text-secondary)]">
                    <span
                      className="mr-1.5 font-semibold"
                      style={{ color: dotColor }}
                    >
                      {step}
                    </span>
                    {label}
                  </span>
                  {/* Connector — hidden after last item */}
                  {!isLast && (
                    <span
                      className="hidden sm:block w-6 h-px mx-1 shrink-0"
                      style={{ background: "var(--border-color)" }}
                      aria-hidden="true"
                    />
                  )}
                </li>
              );
            })}
          </ol>

          {/* CTAs */}
          <div className="flex flex-wrap items-center gap-3 mb-16">
            <Link href="/signup" className="inline-flex">
              <Button variant="primary" size="lg">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="none"
                  aria-hidden="true"
                >
                  <path
                    d="M8 2v9M4 7l4 4 4-4M2 14h12"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                Get your token — free
              </Button>
            </Link>
            <Link href="/examples/claude-code-workflows" className="inline-flex">
              <Button variant="outline" size="lg">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="none"
                  aria-hidden="true"
                >
                  <path
                    d="M3 8L13 8M9 4l4 4-4 4"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                See 5 real conversations
              </Button>
            </Link>
          </div>

          {/* Stat row */}
          <div
            className="flex flex-wrap gap-x-8 gap-y-4 pt-8 border-t border-[var(--border-color)]"
            aria-label="Key metrics"
          >
            {STAT_ROW.map((stat) => (
              <div key={stat.label} className="flex flex-col gap-0.5">
                <span className="font-mono text-lg font-semibold text-[var(--text-primary)]">
                  {stat.value}
                </span>
                <span className="text-xs text-[var(--text-tertiary)]">
                  {stat.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
