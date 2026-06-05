import type { Metadata } from "next";
import Link from "next/link";
import { SiteShell } from "@/components/SiteShell";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { PRICING_TIERS, PRICING_FEATURE_MATRIX } from "@/content/pricing";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "What you actually want to stop doing. What becomes possible. Four tiers, problem-led — OSS, Team ($499/mo), Business ($2,500/mo), Enterprise from $40k/year.",
};

function FeatureCell({ value }: { value: string | boolean }) {
  if (value === true) {
    return (
      <span className="text-[var(--color-accent)] font-mono" aria-label="Included">
        ✓
      </span>
    );
  }
  if (value === false) {
    return (
      <span className="text-[var(--text-tertiary)] font-mono" aria-label="Not included">
        —
      </span>
    );
  }
  return <span className="font-mono text-xs text-[var(--text-secondary)]">{value}</span>;
}

const CATEGORIES = [
  "Harness",
  "Spec Generation",
  "Connectors",
  "Infrastructure",
  "Compliance",
  "Support",
] as const;

export default function PricingPage() {
  return (
    <SiteShell>
      {/* Header — problem-led */}
      <section className="pt-12 pb-12 md:pt-20 md:pb-16 border-b border-[var(--border-color)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="font-mono text-xs uppercase tracking-widest text-[var(--color-mute-4)] mb-4 flex items-center gap-2">
            <span className="inline-block w-4 h-px bg-[var(--color-accent)]" aria-hidden="true" />
            Pricing
          </p>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-[var(--text-primary)] leading-[1.05] tracking-tight mb-6 max-w-3xl">
            Stop paying for the wrong problem.
          </h1>
          <p className="text-lg text-[var(--text-secondary)] leading-relaxed max-w-2xl">
            Most testing tools price on seats, sessions, or test runs. None of
            those are what hurts. What hurts is the same UI bug reopening every
            quarter, the AI coding tool that writes code but can&apos;t verify
            it, and the procurement reviewer asking for a SOC 2 report you
            don&apos;t have. We price on outcomes — pick the tier that removes
            <em> your </em> pain.
          </p>
        </div>
      </section>

      {/* The four tier cards — problem-led */}
      <section className="py-16 md:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          {PRICING_TIERS.map((tier) => (
            <article
              key={tier.id}
              className={[
                "rounded-[var(--radius-lg)] border bg-[var(--bg-secondary)] overflow-hidden",
                tier.highlighted
                  ? "border-[var(--color-accent)] shadow-[0_0_0_1px_var(--color-accent)]"
                  : "border-[var(--border-color)]",
              ]
                .filter(Boolean)
                .join(" ")}
            >
              <div className="p-6 md:p-8 grid grid-cols-1 lg:grid-cols-[1fr_2fr] gap-8 lg:gap-12">
                {/* Tier identity + price */}
                <div className="lg:border-r lg:border-[var(--border-color)] lg:pr-12 flex flex-col">
                  <div className="flex items-center gap-2 mb-2">
                    <h2 className="text-sm font-mono uppercase tracking-widest text-[var(--text-tertiary)]">
                      {tier.name}
                    </h2>
                    {tier.highlighted && <Badge variant="accent">design partners</Badge>}
                  </div>
                  <div className="flex items-baseline gap-2 mb-2">
                    <span className="text-4xl md:text-5xl font-bold text-[var(--text-primary)]">
                      {tier.price}
                    </span>
                  </div>
                  <p className="text-xs text-[var(--text-tertiary)] mb-5">
                    {tier.priceNote}
                  </p>
                  <p className="text-sm text-[var(--text-secondary)] leading-relaxed mb-6 font-medium">
                    {tier.description}
                  </p>

                  <div className="mb-6">
                    <h3 className="text-[10px] font-mono uppercase tracking-widest text-[var(--text-tertiary)] mb-2">
                      Who this is for
                    </h3>
                    <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                      {tier.whoFor}
                    </p>
                  </div>

                  <div className="mt-auto">
                    {tier.ctaHref.startsWith("http") || tier.ctaHref.startsWith("mailto") ? (
                      <a
                        href={tier.ctaHref}
                        target={tier.ctaHref.startsWith("http") ? "_blank" : undefined}
                        rel={tier.ctaHref.startsWith("http") ? "noopener noreferrer" : undefined}
                      >
                        <Button
                          variant={tier.highlighted ? "primary" : "outline"}
                          size="md"
                          className="w-full"
                        >
                          {tier.cta}
                        </Button>
                      </a>
                    ) : (
                      <Link href={tier.ctaHref}>
                        <Button
                          variant={tier.highlighted ? "primary" : "outline"}
                          size="md"
                          className="w-full"
                        >
                          {tier.cta}
                        </Button>
                      </Link>
                    )}
                  </div>
                </div>

                {/* Problem -> Stop / Start -> Outcomes */}
                <div className="space-y-6">
                  <div>
                    <h3 className="text-[10px] font-mono uppercase tracking-widest text-[var(--text-tertiary)] mb-2">
                      The pain
                    </h3>
                    <p className="text-base text-[var(--text-primary)] leading-relaxed">
                      {tier.problem}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="rounded-[var(--radius-md)] border border-red-900/40 bg-red-950/10 p-4">
                      <h4 className="text-[10px] font-mono uppercase tracking-widest text-red-400 mb-2">
                        You stop having to
                      </h4>
                      <ul className="space-y-1.5 text-sm text-[var(--text-secondary)] leading-snug">
                        {tier.stopDoing.map((item) => (
                          <li key={item} className="flex items-start gap-2">
                            <span className="text-red-400 mt-0.5" aria-hidden="true">
                              ✗
                            </span>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="rounded-[var(--radius-md)] border border-green-900/40 bg-green-950/10 p-4">
                      <h4 className="text-[10px] font-mono uppercase tracking-widest text-green-400 mb-2">
                        You can now
                      </h4>
                      <ul className="space-y-1.5 text-sm text-[var(--text-secondary)] leading-snug">
                        {tier.startDoing.map((item) => (
                          <li key={item} className="flex items-start gap-2">
                            <span className="text-green-400 mt-0.5" aria-hidden="true">
                              ✓
                            </span>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-[10px] font-mono uppercase tracking-widest text-[var(--text-tertiary)] mb-2">
                      What you get
                    </h3>
                    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 text-sm text-[var(--text-secondary)]">
                      {tier.outcomes.map((outcome) => (
                        <li key={outcome} className="flex items-start gap-2 leading-snug">
                          <span className="text-[var(--color-accent)] mt-0.5 shrink-0" aria-hidden="true">
                            →
                          </span>
                          <span>{outcome}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* FAQ-lite for pricing — kept, but moved earlier than the feature matrix */}
      <section className="py-16 md:py-20 border-t border-[var(--border-color)]">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl md:text-3xl font-bold text-[var(--text-primary)] mb-8">
            Practical answers
          </h2>
          <dl className="space-y-6">
            {[
              {
                q: "Will my AI coding tool actually use this?",
                a: "That's the whole point of the Team tier. The recorder produces JSON in the exact shape @cuit/spec-gen consumes — you drop the JSON into Claude Code, Codex, or Cursor along with a one-line prompt and the agent has a deterministic feedback loop. See the AGENT LOOP CLOSED output on /proof for the verbatim 0.18s pipeline.",
              },
              {
                q: "What counts as a spec for billing?",
                a: "One generated .spec.ts file from one captured session, accepted at confidence ≥ 0.75 or manually approved. Re-runs of an existing spec are unmetered. Failed generations (low confidence, AST validation rejected) do not count.",
              },
              {
                q: "I just want the harness for my own tests — do I need to pay?",
                a: "No. The OSS library is MIT-licensed and complete. dispatchDrag, setClock, getStateSnapshot, the mutation observer — all yours. You only pay when you want the SaaS to generate specs for you from recorded sessions.",
              },
              {
                q: "What if I exceed my monthly spec allotment?",
                a: "Overage rates are listed per tier ($5 / $4 / $3.50 per extra spec). You can set hard caps in the dashboard to disable overage entirely. Notifications fire at 50%, 75%, 90%, 100% of allotment.",
              },
              {
                q: "We don't trust our session data in someone else's cloud — can we still use this?",
                a: "Yes. Enterprise tier ships a self-hosted runner as a Docker container. It runs LLM inference inside your VPC using your own Anthropic or Bedrock API keys. Session data never leaves your network. The SaaS control plane handles metering and billing only.",
              },
              {
                q: "Can I move between tiers?",
                a: "Yes — at any time, prorated to the day. Downgrades take effect at the end of the current billing cycle. Your selector dictionary and bug-class corpus persist across tier changes.",
              },
              {
                q: "Do you offer non-profit / academic pricing?",
                a: "Yes, 50% off Team and Business for accredited education institutions and 501(c)(3) non-profits. Email ryan@speechlab.ai with your domain.",
              },
            ].map((item) => (
              <div key={item.q}>
                <dt className="text-base font-semibold text-[var(--text-primary)] mb-2">
                  {item.q}
                </dt>
                <dd className="text-sm text-[var(--text-secondary)] leading-relaxed">
                  {item.a}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* Detailed feature matrix — collapsed below the fold for the technical buyer */}
      <section className="py-16 md:py-20 border-t border-[var(--border-color)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <details className="group">
            <summary className="cursor-pointer text-left list-none flex items-baseline justify-between gap-4 mb-3">
              <div>
                <h2 className="text-xl md:text-2xl font-bold text-[var(--text-primary)] mb-1">
                  Feature-by-feature breakdown
                </h2>
                <p className="text-sm text-[var(--text-tertiary)]">
                  For the technical buyer who wants every checkbox. Click to expand.
                </p>
              </div>
              <span
                className="font-mono text-[var(--color-accent)] text-2xl leading-none transition-transform group-open:rotate-45"
                aria-hidden="true"
              >
                +
              </span>
            </summary>

            <div className="mt-8 overflow-x-auto rounded-[var(--radius-lg)] border border-[var(--border-color)]">
              <table className="w-full text-sm">
                <thead className="bg-[var(--bg-secondary)] border-b border-[var(--border-color)]">
                  <tr>
                    <th
                      scope="col"
                      className="text-left py-3 px-4 text-xs font-mono uppercase tracking-wider text-[var(--text-tertiary)]"
                    >
                      Feature
                    </th>
                    {PRICING_TIERS.map((t) => (
                      <th
                        key={t.id}
                        scope="col"
                        className="text-center py-3 px-4 text-xs font-mono uppercase tracking-wider text-[var(--text-tertiary)]"
                      >
                        {t.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-color)]">
                  {CATEGORIES.map((category) => {
                    const rows = PRICING_FEATURE_MATRIX.filter((r) => r.category === category);
                    return (
                      <>
                        <tr key={`cat-${category}`} className="bg-[var(--bg-tertiary)]">
                          <td
                            colSpan={5}
                            className="py-2 px-4 text-xs font-mono uppercase tracking-wider text-[var(--text-tertiary)]"
                          >
                            {category}
                          </td>
                        </tr>
                        {rows.map((row) => (
                          <tr
                            key={row.feature}
                            className="hover:bg-[var(--bg-secondary)]/50 transition-colors"
                          >
                            <td className="py-3 px-4 text-[var(--text-secondary)]">
                              {row.feature}
                            </td>
                            <td className="py-3 px-4 text-center">
                              <FeatureCell value={row.oss} />
                            </td>
                            <td className="py-3 px-4 text-center">
                              <FeatureCell value={row.team} />
                            </td>
                            <td className="py-3 px-4 text-center">
                              <FeatureCell value={row.business} />
                            </td>
                            <td className="py-3 px-4 text-center">
                              <FeatureCell value={row.enterprise} />
                            </td>
                          </tr>
                        ))}
                      </>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </details>
        </div>
      </section>
    </SiteShell>
  );
}
