import type { Metadata } from "next";
import Link from "next/link";
import { SiteShell } from "@/components/SiteShell";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { PRICING_TIERS, PRICING_FEATURE_MATRIX } from "@/content/pricing";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "Four tiers. OSS is MIT-licensed and free forever. Team ($499/mo), Business ($2,500/mo), Enterprise (custom from $40k/year). Pay for what you cannot or should not self-host.",
};

function FeatureCell({
  value,
}: {
  value: string | boolean;
}) {
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
  return (
    <span className="font-mono text-xs text-[var(--text-secondary)]">
      {value}
    </span>
  );
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
      {/* Header */}
      <section className="pt-12 pb-12 md:pt-20 md:pb-16 border-b border-[var(--border-color)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="font-mono text-xs uppercase tracking-widest text-[var(--color-mute-4)] mb-4">
            Pricing
          </p>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-[var(--text-primary)] leading-[1.05] tracking-tight mb-6 max-w-3xl">
            Four tiers. One clear logic.
          </h1>
          <p className="text-lg text-[var(--text-secondary)] leading-relaxed max-w-2xl">
            The harness is MIT-licensed and free forever. The SaaS is what you
            pay for — LLM inference, multi-tenant data infrastructure,
            connector credentials, audit logs, SOC 2. The library does not
            phone home; the SaaS is opt-in via a separate npm package.
          </p>
        </div>
      </section>

      {/* Tier cards */}
      <section className="py-16 md:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {PRICING_TIERS.map((tier) => (
              <div
                key={tier.id}
                className={[
                  "relative rounded-[var(--radius-lg)] border bg-[var(--bg-secondary)] p-6 flex flex-col",
                  tier.highlighted
                    ? "border-[var(--color-accent)] shadow-[0_0_0_1px_var(--color-accent)]"
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
                  <h2 className="text-sm font-mono uppercase tracking-widest text-[var(--text-tertiary)] mb-1">
                    {tier.name}
                  </h2>
                  <div className="flex items-baseline gap-2 mb-2">
                    <span className="text-3xl font-bold text-[var(--text-primary)]">
                      {tier.price}
                    </span>
                  </div>
                  <p className="text-xs text-[var(--text-tertiary)] mb-3">
                    {tier.priceNote}
                  </p>
                  <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                    {tier.description}
                  </p>
                </div>
                <ul className="space-y-2 text-sm text-[var(--text-secondary)] mb-6 flex-1">
                  {tier.features.map((feature) => (
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
            ))}
          </div>
        </div>
      </section>

      {/* Feature matrix */}
      <section className="py-16 md:py-20 border-t border-[var(--border-color)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8 max-w-2xl">
            <h2 className="text-2xl md:text-3xl font-bold text-[var(--text-primary)] mb-3">
              Full feature comparison
            </h2>
            <p className="text-[var(--text-secondary)]">
              Everything in every tier, side by side.
            </p>
          </div>
          <div className="overflow-x-auto rounded-[var(--radius-lg)] border border-[var(--border-color)]">
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
                  const rows = PRICING_FEATURE_MATRIX.filter(
                    (r) => r.category === category
                  );
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
        </div>
      </section>

      {/* FAQ-lite for pricing */}
      <section className="py-16 md:py-20 border-t border-[var(--border-color)]">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl md:text-3xl font-bold text-[var(--text-primary)] mb-8">
            Pricing FAQ
          </h2>
          <dl className="space-y-6">
            {[
              {
                q: "What counts as a spec?",
                a: "One generated `.spec.ts` file from one session. Re-runs of an existing spec are unmetered. Failed generations (confidence below threshold, or AST validation rejected) do not count.",
              },
              {
                q: "What's the overage rate if I exceed the monthly allotment?",
                a: "$5 / spec on Team, $4 on Business, $3.50 on Enterprise (volume-negotiated). You can set hard caps in the dashboard to disable overage. Notifications fire at 50%, 75%, 90%, 100% of allotment.",
              },
              {
                q: "Can I move between tiers?",
                a: "Yes — at any time, prorated to the day. Downgrades take effect at the end of the current billing cycle. Your selector dictionary and bug-class corpus persist across tier changes.",
              },
              {
                q: "Do you offer non-profit / academic pricing?",
                a: "Yes, 50% off Team and Business for accredited education institutions and 501(c)(3) non-profits. Email ryan@speechlab.ai with your domain.",
              },
              {
                q: "What does Enterprise actually include?",
                a: "Self-hosted runner (Docker, runs in your VPC, uses your own Anthropic or Bedrock keys), SAML SSO, SCIM, custom retention policy, custom MSA + DPA, dedicated Slack channel, named CSM, 99.9% SLA with credits.",
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
    </SiteShell>
  );
}
