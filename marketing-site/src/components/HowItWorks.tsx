import { CodeBlock } from "@/components/ui/Code";

const STEPS = [
  {
    number: "01",
    title: "Record",
    description:
      "Your users use Jam, LogRocket, Sentry Replay, FullStory, or Datadog RUM as they do today. No SDK changes, no new instrumentation, no behavior change for your users.",
    visual: "terminal" as const,
    code: `# No code changes in your app.
# Your users file bugs the same way they always did.

user → Jam "drag didn't work" → session URL in Slack
                    ↓
    complex-ui-tester connector picks it up`,
    filename: "no-changes.sh",
    badge: "5 vendors supported",
  },
  {
    number: "02",
    title: "Generate",
    description:
      "A 3-pass LLM pipeline normalizes the session, grounds selectors against your tenant's selector dictionary and bug-class corpus, then materializes a Playwright spec that calls only validated harness primitives. AST validation enforces it — hallucinations don't compile.",
    visual: "code" as const,
    code: `// Generated: issue-2014-segment-collision.spec.ts
// Confidence: 0.91 — AST grounded ✓

import { test, expect } from '@playwright/test';
import { dispatchDrag, getStateSnapshot, setClock } from '@cuit/harness';

test('segment 0 drag — no collision regression', async ({ page }) => {
  await page.goto('/waveform');
  await setClock(page, 0);

  const before = await getStateSnapshot(page);
  expect(before.segments[0].x).toBe(0);

  await dispatchDrag(page, getSegment(page, 'seg-0'), { dx: 100, dy: 0 });

  const after = await getStateSnapshot(page);
  expect(after.segments[0].x).toBe(100);
});`,
    filename: "issue-2014-segment-collision.spec.ts",
    badge: "< $0.50 all-in",
  },
  {
    number: "03",
    title: "Lock in",
    description:
      "The GitHub App opens a PR with the generated spec. Dry-run goes RED (proving the bug is reproducible). Engineer reviews, ships the fix in the same PR, dry-run goes GREEN. From that moment, the spec is a CI gate — reintroducing the bug in any future PR fails CI before merge.",
    visual: "pr" as const,
    code: `# GitHub Actions — runs on every PR

  cuit/spec-grounded     ✅ PASS
  cuit/dry-run           ✅ GREEN (after fix)
  cuit/confidence        ✅ 0.91 / threshold 0.75

  All checks passed — ready to merge`,
    filename: "ci-output.txt",
    badge: "Gate is permanent",
  },
];

export function HowItWorks() {
  return (
    <section
      className="py-20 md:py-28 border-t border-[var(--border-color)]"
      aria-labelledby="how-it-works-heading"
      id="how-it-works"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mb-16">
          <p className="font-mono text-xs uppercase tracking-widest text-[var(--color-mute-4)] mb-4">
            How it works
          </p>
          <h2
            id="how-it-works-heading"
            className="text-3xl sm:text-4xl font-bold text-[var(--text-primary)] mb-4"
          >
            Three steps. One permanent CI gate.
          </h2>
          <p className="text-[var(--text-secondary)] leading-relaxed">
            The full loop from filed bug to merged regression spec takes under 8
            minutes on median sessions. After that, the gate is permanent — it
            costs nothing to maintain.
          </p>
        </div>

        <div className="space-y-16">
          {STEPS.map((step, index) => (
            <div
              key={step.number}
              className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center"
            >
              {/* Text — alternate sides on larger screens */}
              <div
                className={
                  index % 2 === 1 ? "lg:order-2" : "lg:order-1"
                }
              >
                <div className="flex items-start gap-4 mb-4">
                  <span
                    className="font-mono text-4xl font-bold text-[var(--color-mute-3)] leading-none"
                    aria-hidden="true"
                  >
                    {step.number}
                  </span>
                  <div>
                    <h3 className="text-xl font-bold text-[var(--text-primary)] mb-2">
                      {step.title}
                    </h3>
                    <span className="inline-block font-mono text-xs px-2 py-0.5 rounded-[var(--radius-sm)] bg-[var(--color-accent)]/10 text-[var(--color-accent)] border border-[var(--color-accent)]/20">
                      {step.badge}
                    </span>
                  </div>
                </div>
                <p className="text-[var(--text-secondary)] leading-relaxed text-sm md:text-base">
                  {step.description}
                </p>
              </div>

              {/* Visual */}
              <div className={index % 2 === 1 ? "lg:order-1" : "lg:order-2"}>
                <CodeBlock
                  code={step.code}
                  filename={step.filename}
                  language={
                    step.filename.endsWith(".ts")
                      ? "typescript"
                      : step.filename.endsWith(".sh")
                      ? "bash"
                      : "text"
                  }
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
