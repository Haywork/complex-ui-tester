import type { Metadata } from 'next';
import Link from 'next/link';
import { SiteShell } from '@/components/SiteShell';
import { ForDevelopers } from '@/components/ForDevelopers';
import { AgenticLoop } from '@/components/AgenticLoop';
import { Badge } from '@/components/ui/Badge';
import { PROOF_STATS } from '@/content/proof';

export const metadata: Metadata = {
  title: 'Proof — it actually runs',
  description:
    'The end-to-end loop running in a real repository. Generated spec, RED on bug, GREEN on fix, locked in as a CI gate. Clone and reproduce yourself.',
};

export default function ProofPage() {
  return (
    <SiteShell>
      <section className="pt-12 pb-12 md:pt-20 md:pb-16 border-b border-[var(--border-color)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="font-mono text-xs uppercase tracking-widest text-[var(--color-mute-4)] mb-4">
            Proof — not a mockup
          </p>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-[var(--text-primary)] leading-[1.05] tracking-tight mb-6 max-w-3xl">
            The loop runs.
            <br />
            On a real repo. In your terminal.
          </h1>
          <p className="text-lg text-[var(--text-secondary)] leading-relaxed max-w-2xl mb-6">
            Every snippet on this page is read directly from the working{' '}
            <Link
              href="https://github.com/speechlabinc/complex-ui-tester/tree/main/proof-of-concept"
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono text-[var(--color-accent)] hover:underline"
            >
              proof-of-concept
            </Link>{' '}
            in this repository. The same{' '}
            <code className="font-mono text-[var(--color-accent)] bg-[var(--bg-secondary)] px-1.5 py-0.5 rounded border border-[var(--border-color)]">
              pnpm proof:loop
            </code>{' '}
            command that produced this output runs on your machine in under a
            second.
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="success">61/61 tests passing</Badge>
            <Badge variant="success">RED → GREEN verified</Badge>
            <Badge variant="mono">
              {PROOF_STATS.loopDurationS}s end-to-end
            </Badge>
            <Badge variant="mono">5 packages</Badge>
            <Badge variant="mono">{PROOF_STATS.fixtureEvents}-event fixture</Badge>
          </div>
        </div>
      </section>

      <AgenticLoop />

      <ForDevelopers />

      <section className="py-16 md:py-20 border-t border-[var(--border-color)]">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl md:text-3xl font-bold text-[var(--text-primary)] mb-6">
            What this proves — and what it doesn&apos;t
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="rounded-[var(--radius-lg)] border border-green-900/40 bg-green-950/10 p-5">
              <h3 className="text-sm font-mono uppercase tracking-widest text-green-400 mb-3">
                Proves
              </h3>
              <ul className="space-y-2 text-sm text-[var(--text-secondary)] leading-relaxed">
                <li className="flex items-start gap-2">
                  <span className="text-green-400 mt-0.5">✓</span>
                  <span>
                    A recorded session can be normalized into a stable{' '}
                    <code className="font-mono">SessionEvent[]</code>.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-400 mt-0.5">✓</span>
                  <span>
                    Those events can be mapped to a Playwright/Vitest spec that
                    calls only validated harness primitives.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-400 mt-0.5">✓</span>
                  <span>
                    The spec deterministically reproduces a real bug (RED)
                    against the unfixed code.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-400 mt-0.5">✓</span>
                  <span>
                    The same spec passes (GREEN) against the fixed code with no
                    spec edits.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-400 mt-0.5">✓</span>
                  <span>
                    The architecture in <code className="font-mono">docs/02</code>,{' '}
                    <code className="font-mono">04</code>, and{' '}
                    <code className="font-mono">10</code> is implementable — not
                    just designed.
                  </span>
                </li>
              </ul>
            </div>

            <div className="rounded-[var(--radius-lg)] border border-amber-900/40 bg-amber-950/10 p-5">
              <h3 className="text-sm font-mono uppercase tracking-widest text-amber-400 mb-3">
                Does NOT prove (yet)
              </h3>
              <ul className="space-y-2 text-sm text-[var(--text-secondary)] leading-relaxed">
                <li className="flex items-start gap-2">
                  <span className="text-amber-400 mt-0.5">○</span>
                  <span>
                    LLM-driven spec generation. The PoC generator is
                    rule-based — a drop-in substitute for the 3-pass LLM
                    pipeline in{' '}
                    <code className="font-mono">docs/04</code>.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-400 mt-0.5">○</span>
                  <span>
                    Pre-built third-party connectors for Jam / LogRocket /
                    Sentry are designed but not shipped — for now we ship a{' '}
                    <strong className="text-[var(--text-secondary)]">
                      first-party Chrome recorder
                    </strong>{' '}
                    that produces the same{' '}
                    <code className="font-mono">SessionEvent[]</code> shape.
                    See <code className="font-mono">packages/recorder-extension/</code>.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-400 mt-0.5">○</span>
                  <span>
                    Multi-tenant prompt context. Single-tenant in the PoC.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-400 mt-0.5">○</span>
                  <span>
                    SOC 2. We&apos;re in observation for Type II per{' '}
                    <code className="font-mono">docs/05</code>; not yet
                    audited.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-400 mt-0.5">○</span>
                  <span>
                    Production deployment of the SaaS infra. Designed in{' '}
                    <code className="font-mono">docs/03</code>; not built.
                  </span>
                </li>
              </ul>
            </div>
          </div>

          <p className="mt-6 text-sm text-[var(--text-tertiary)] leading-relaxed">
            The PoC&apos;s job is to prove the loop architecture is real — the
            rest is engineering, not invention.
          </p>
        </div>
      </section>
    </SiteShell>
  );
}
