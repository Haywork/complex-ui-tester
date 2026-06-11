"use client";

/**
 * MaturityLadder — honest, three-tier shipping status.
 *
 * Tiers:
 *   SHIPPING NOW  — deterministic harness; generalized spec-gen; real spec
 *                   execution; recorder w/ console+error capture; local MCP
 *                   shim; 2 adapters; /cuit-loop + /cuit-instrument skills;
 *                   AX envelopes + step-back debug primitives.
 *   IN PROGRESS   — hosted SaaS warehouse (private pilot); LLM 3-pass
 *                   spec-gen; more interaction shapes; self-healing selectors.
 *   NOT YET       — AWS production; general step-extractor; SOC 2 report.
 *
 * Framing: honest confidence — "here's exactly what runs today."
 */

import React from "react";

/* ─── Content ─────────────────────────────────────────────────────────────── */

interface TierItem {
  text: string;
  /** Optional sub-note rendered in muted mono */
  note?: string;
}

interface Tier {
  id: string;
  label: string;
  /** Short descriptor below the label */
  descriptor: string;
  /** Tailwind / CSS-var class set for the left accent */
  accentClass: string;
  /** Badge text */
  badge: string;
  /** Badge color variant: "pass" | "warn" | "muted" */
  badgeVariant: "pass" | "warn" | "muted";
  items: TierItem[];
}

const TIERS: Tier[] = [
  {
    id: "shipping-now",
    label: "Shipping Now",
    descriptor: "Runs on your machine today. Pull the repo and go.",
    accentClass: "border-[var(--accent-green)]",
    badge: "v0.x — OSS",
    badgeVariant: "pass",
    items: [
      {
        text: "Deterministic harness",
        note: "rule-based spec-gen, zero LLM required",
      },
      {
        text: "Generalized spec-gen",
        note: "drag, click, and text-input shapes",
      },
      {
        text: "Real spec execution via primitive-exec",
      },
      {
        text: "Recorder with console + error capture",
        note: "Chrome extension, first-party",
      },
      {
        text: "Local MCP shim",
        note: "OSS runs fully standalone — no cloud dependency",
      },
      {
        text: "2 adapters: Jam + CUIT",
      },
      {
        text: "/cuit-loop + /cuit-instrument Claude Code skills",
      },
      {
        text: "AX envelopes + step-back debug primitives",
      },
    ],
  },
  {
    id: "in-progress",
    label: "In Progress",
    descriptor: "Private pilots underway. Not yet generally available.",
    accentClass: "border-[var(--color-warning)]",
    badge: "private pilot",
    badgeVariant: "warn",
    items: [
      {
        text: "Hosted SaaS data warehouse",
        note: "private pilot on Fly + Neon — reach out to join",
      },
      {
        text: "LLM 3-pass spec-gen",
        note: "rule-based is the default today; LLM pass is additive",
      },
      {
        text: "Additional interaction shapes",
        note: "hover, focus, keyboard nav, drag-to-resize",
      },
      {
        text: "Self-healing selectors",
        note: "resilient to minor DOM changes without re-recording",
      },
    ],
  },
  {
    id: "not-yet",
    label: "Not Yet",
    descriptor: "On the roadmap. We won't ship until it's production-grade.",
    accentClass: "border-[var(--color-mute-3)]",
    badge: "roadmap",
    badgeVariant: "muted",
    items: [
      {
        text: "AWS production infrastructure",
        note: "currently Fly; AWS migration is a deliberate later step",
      },
      {
        text: "General step-extractor for arbitrary interactions",
        note: "beyond the current shape set",
      },
      {
        text: "SOC 2 Type II report",
        note: "audit begins when the SaaS exits private pilot",
      },
    ],
  },
];

/* ─── Sub-components ─────────────────────────────────────────────────────── */

const BADGE_CLASSES: Record<Tier["badgeVariant"], string> = {
  pass: "text-[var(--accent-green)] bg-[var(--accent-green-bg)] border border-[color-mix(in_srgb,var(--accent-green)_25%,transparent)]",
  warn: "text-[var(--color-warning)] bg-amber-950/60 border border-amber-900/50",
  muted:
    "text-[var(--text-tertiary)] bg-[var(--bg-tertiary)] border border-[var(--border-color)]",
};

const BULLET_CLASSES: Record<Tier["badgeVariant"], string> = {
  pass: "text-[var(--accent-green)]",
  warn: "text-[var(--color-warning)]",
  muted: "text-[var(--color-mute-4)]",
};

function TierCard({ tier }: { tier: Tier }) {
  const bulletClass = BULLET_CLASSES[tier.badgeVariant];

  return (
    <article
      className={[
        "flex flex-col rounded-[var(--radius-lg)]",
        "border-t-2 border-x border-b border-[var(--border-color)]",
        tier.accentClass,
        "bg-[var(--bg-secondary)] overflow-hidden",
      ]
        .filter(Boolean)
        .join(" ")}
      aria-labelledby={`tier-label-${tier.id}`}
    >
      {/* Header */}
      <div className="px-6 pt-6 pb-5 border-b border-[var(--border-color)]">
        <div className="flex items-start justify-between gap-3 mb-2">
          <h3
            id={`tier-label-${tier.id}`}
            className="text-lg font-bold text-[var(--text-primary)] leading-snug"
          >
            {tier.label}
          </h3>
          <span
            className={[
              "shrink-0 inline-flex items-center px-2 py-0.5 rounded-[var(--radius-sm)]",
              "font-mono text-[11px] font-semibold tracking-wider uppercase",
              BADGE_CLASSES[tier.badgeVariant],
            ].join(" ")}
          >
            {tier.badge}
          </span>
        </div>
        <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
          {tier.descriptor}
        </p>
      </div>

      {/* Items */}
      <ul className="flex-1 divide-y divide-[var(--border-color)]" role="list">
        {tier.items.map((item) => (
          <li
            key={item.text}
            className="flex items-start gap-3 px-6 py-3.5 hover:bg-[var(--bg-tertiary)] transition-colors"
          >
            <span className={`${bulletClass} mt-0.5 shrink-0`} aria-hidden="true">
              ●
            </span>
            <span className="min-w-0">
              <span className="text-sm text-[var(--text-primary)] leading-snug">
                {item.text}
              </span>
              {item.note && (
                <span className="block font-mono text-[11px] text-[var(--text-tertiary)] mt-0.5 leading-tight">
                  {item.note}
                </span>
              )}
            </span>
          </li>
        ))}
      </ul>
    </article>
  );
}

/* ─── Public component ───────────────────────────────────────────────────── */

export function MaturityLadder() {
  return (
    <section
      className="py-20 md:py-28 border-t border-[var(--border-color)] relative overflow-hidden"
      aria-labelledby="maturity-heading"
      id="maturity"
    >
      {/* Subtle radial accent — green tint anchored to the left (Shipping Now) */}
      <div
        className="absolute inset-x-0 top-0 h-64 opacity-[0.07] pointer-events-none"
        aria-hidden="true"
        style={{
          background:
            "radial-gradient(ellipse 50% 100% at 20% 0%, var(--color-pass) 0%, transparent 70%)",
        }}
      />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="max-w-2xl mb-12">
          <p className="font-mono text-xs uppercase tracking-widest text-[var(--text-tertiary)] mb-4 flex items-center gap-2">
            <span
              className="inline-block w-4 h-px bg-[var(--color-accent)]"
              aria-hidden="true"
            />
            Maturity ladder — no surprises
          </p>
          <h2
            id="maturity-heading"
            className="text-3xl sm:text-4xl md:text-5xl font-bold text-[var(--text-primary)] mb-5 leading-tight"
          >
            Here&apos;s exactly what
            <br />
            runs today.
          </h2>
          <p className="text-[var(--text-secondary)] leading-relaxed">
            We&apos;d rather you trust a precise status than be surprised by
            what&apos;s not there yet. Every item in{" "}
            <span className="text-[var(--accent-green)] font-medium">
              Shipping Now
            </span>{" "}
            runs on your machine from the public repo. Items in{" "}
            <span className="text-[var(--color-warning)] font-medium">
              In Progress
            </span>{" "}
            are under active development — reach out if you want early access.
            Items in{" "}
            <span className="text-[var(--text-secondary)] font-medium">
              Not Yet
            </span>{" "}
            are on the roadmap but we&apos;re not shipping until they&apos;re
            production-grade.
          </p>
        </div>

        {/* Three-column tier grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {TIERS.map((tier) => (
            <TierCard key={tier.id} tier={tier} />
          ))}
        </div>

        {/* Footer note */}
        <p className="mt-8 text-xs text-[var(--text-tertiary)] max-w-3xl leading-relaxed">
          <strong className="text-[var(--text-secondary)]">
            Why publish this?
          </strong>{" "}
          A tool that catches UI regressions should itself be honest about what
          it catches. Overpromising is the bug we&apos;re fixing in your
          codebase — we won&apos;t ship it in ours.
        </p>
      </div>
    </section>
  );
}
