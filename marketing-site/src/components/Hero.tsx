"use client";

import Link from "next/link";
import { Button } from "@/components/ui/Button";

const STAT_ROW = [
  { value: "73 / 73", label: "package tests passing" },
  { value: "0%", label: "CI flake rate" },
  { value: "0.18s", label: "loop closed, end-to-end" },
  { value: "Chrome ext", label: "first-party recorder shipping" },
];

export function Hero() {
  return (
    <section
      className="relative pt-32 pb-16 md:pt-40 md:pb-24 overflow-hidden"
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
          {/* Eyebrow */}
          <p className="font-mono text-xs uppercase tracking-widest text-[var(--text-tertiary)] mb-6 flex items-center gap-2">
            <span
              className="inline-block w-4 h-px bg-[var(--color-accent)]"
              aria-hidden="true"
            />
            MCP skill for Claude Code · model-invariant · CI-native
          </p>

          {/* Headline */}
          <h1
            id="hero-headline"
            className="text-5xl sm:text-6xl md:text-7xl font-bold leading-[0.95] tracking-tight text-[var(--text-primary)] mb-6"
          >
            Close the loop in{" "}
            <br className="hidden sm:block" />
            {/* Dark mode: gradient from bright paper → mute-5. Light mode: solid text-primary. */}
            <span
              className="relative inline-block hero-gradient-text"
            >
              Claude Code.
            </span>
          </h1>

          {/* Subheadline */}
          <p className="text-lg md:text-xl text-[var(--text-secondary)] max-w-2xl leading-relaxed mb-10">
            The feedback loop is the durable substrate — not the model, not
            the recorder, not the test runner.{" "}
            <strong className="text-[var(--text-primary)] font-semibold">
              CUIT
            </strong>{" "}
            is a Claude Code MCP skill that captures what your agent ships,
            generates a grounded Playwright spec from semantic events, and
            locks it in as a CI gate — compressing days of manual QA into a
            single conversation turn.{" "}
            <span className="text-[var(--text-primary)]">
              Your agent should verify what it ships.
            </span>
          </p>

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
                Get early access
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
                See Claude Code workflows
              </Button>
            </Link>
            <Link
              href="https://github.com/speechlabinc/complex-ui-tester/blob/main/ARCHITECTURE.md"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 text-base font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors focus-visible:outline-2 focus-visible:outline-[var(--color-accent)] focus-visible:outline-offset-2 rounded-[var(--radius-md)]"
            >
              Read the architecture
              <svg
                width="14"
                height="14"
                viewBox="0 0 14 14"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="M2.5 7h9M8 4l3.5 3L8 10"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </Link>
          </div>

          {/* Stat row */}
          <div
            className="flex flex-wrap gap-x-8 gap-y-4 pt-8 border-t border-[var(--border-color)]"
            aria-label="Key metrics from Branch B"
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
