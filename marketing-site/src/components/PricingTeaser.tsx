import Link from "next/link";
import { PRICING_TIERS } from "@/content/pricing";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";

export function PricingTeaser() {
  const teaserTiers = PRICING_TIERS.filter((t) => t.id !== "enterprise");

  return (
    <section
      className="py-20 md:py-28 border-t border-[var(--border-color)]"
      aria-labelledby="pricing-heading"
      id="pricing"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mb-12">
          <p className="font-mono text-xs uppercase tracking-widest text-[var(--text-tertiary)] mb-4">
            Pricing
          </p>
          <h2
            id="pricing-heading"
            className="text-3xl sm:text-4xl font-bold text-[var(--text-primary)] mb-4"
          >
            You pay for the corpus that compounds, not for specs.
          </h2>
          <p className="text-[var(--text-secondary)] leading-relaxed mb-3">
            The feedback loop is the durable asset — model-invariant, version-invariant,
            and owned by your team. Free spec generation and unlimited CI runs, always.
            The paid tiers cover the warehouse, the similarity search, and the agent&apos;s
            institutional memory that makes every future spec smarter than the last.
          </p>
          <p className="text-[var(--text-secondary)] leading-relaxed">
            Start in Claude Code: connect the MCP server, run the /cuit-loop skill, and
            capture your first session in minutes — no curl, no dashboard, no sprint-planning required.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {teaserTiers.map((tier) => (
            <div
              key={tier.id}
              className={[
                "relative rounded-[var(--radius-lg)] border bg-[var(--bg-secondary)] p-6 flex flex-col",
                tier.highlighted
                  ? "border-[var(--color-accent)] shadow-[0_0_0_1px_var(--color-accent)] md:scale-[1.02]"
                  : "border-[var(--border-color)]",
              ]
                .filter(Boolean)
                .join(" ")}
            >
              {tier.highlighted && (
                <div className="absolute -top-3 left-6">
                  <Badge variant="accent">Most popular</Badge>
                </div>
              )}
              <div className="mb-5">
                <h3 className="text-sm font-mono uppercase tracking-widest text-[var(--text-tertiary)] mb-1">
                  {tier.name}
                </h3>
                <div className="flex items-baseline gap-2 mb-2">
                  <span className="text-3xl md:text-4xl font-bold text-[var(--text-primary)]">
                    {tier.price}
                  </span>
                  <span className="text-xs text-[var(--text-tertiary)]">
                    {tier.priceNote}
                  </span>
                </div>
                <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                  {tier.description}
                </p>
                {tier.id === "oss" && (
                  <p className="mt-2 text-xs font-mono text-[var(--color-accent)] leading-relaxed">
                    Unlimited spec generation. Unlimited runs. Always.
                  </p>
                )}
                {tier.id === "team" && (
                  <p className="mt-2 text-xs font-mono text-[var(--text-tertiary)] leading-relaxed">
                    You&apos;re paying for the warehouse + similarity search + the
                    agent&apos;s institutional memory — not for tests.
                  </p>
                )}
              </div>

              <ul className="space-y-2 text-sm text-[var(--text-secondary)] mb-6 flex-1">
                {tier.features.slice(0, 6).map((feature) => (
                  <li key={feature} className="flex items-start gap-2">
                    <span
                      className="text-[var(--color-accent)] mt-0.5 shrink-0"
                      aria-hidden="true"
                    >
                      ✓
                    </span>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              {tier.ctaHref.startsWith("http") || tier.ctaHref.startsWith("mailto:") ? (
                <a
                  href={tier.ctaHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block"
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
                <Link href={tier.ctaHref} className="block">
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
          ))}
        </div>

        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link href="/signup">
            <Button variant="primary" size="md">
              Get your free token — close your first loop in Claude Code today
            </Button>
          </Link>
          <Link
            href="/pricing"
            className="inline-flex items-center gap-1.5 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors focus-visible:outline-2 focus-visible:outline-[var(--color-accent)] focus-visible:outline-offset-2 rounded-sm"
          >
            See full pricing — including Enterprise
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
      </div>
    </section>
  );
}
