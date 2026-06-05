"use client";

import Link from "next/link";
import { Button } from "@/components/ui/Button";

const STAT_ROW = [
  { value: "0.18s", label: "closed loop, end-to-end" },
  { value: "73 / 73", label: "package tests passing" },
  { value: "0%", label: "CI flake rate" },
  { value: "Chrome ext", label: "first-party recorder shipping" },
];

export function Hero() {
  const scrollToDemo = () => {
    document.getElementById("demo")?.scrollIntoView({ behavior: "smooth" });
  };

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
          <p className="font-mono text-xs uppercase tracking-widest text-[var(--color-mute-4)] mb-6 flex items-center gap-2">
            <span
              className="inline-block w-4 h-px bg-[var(--color-accent)]"
              aria-hidden="true"
            />
            The closed-loop feedback layer for agentic UI engineering
          </p>

          {/* Headline */}
          <h1
            id="hero-headline"
            className="text-5xl sm:text-6xl md:text-7xl font-bold leading-[0.95] tracking-tight text-[var(--text-primary)] mb-6"
          >
            Claude Code can write a UI.{" "}
            <br className="hidden sm:block" />
            <span
              className="relative inline-block"
              style={{
                WebkitTextStroke: "0",
                background:
                  "linear-gradient(135deg, var(--color-paper) 0%, var(--color-mute-5) 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              Now it can verify one.
            </span>
          </h1>

          {/* Subheadline */}
          <p className="text-lg md:text-xl text-[var(--text-secondary)] max-w-2xl leading-relaxed mb-10">
            <strong className="text-[var(--text-primary)] font-semibold">
              complex-ui-tester
            </strong>{" "}
            is the recorder + harness + spec-gen that gives agentic coding
            models the one thing they&apos;re missing: a deterministic feedback
            signal for UI changes.{" "}
            <span className="text-[var(--text-primary)]">Observe. Propose. Verify. Gate.</span>{" "}
            Closed loop in 0.18s.
          </p>

          {/* CTAs */}
          <div className="flex flex-wrap items-center gap-3 mb-16">
            <Button variant="primary" size="lg" onClick={scrollToDemo}>
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
              See the 90-second demo
            </Button>
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
