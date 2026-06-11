/**
 * WiresEverything — the core thesis: a unified data representation IS the product.
 *
 * Founder framing: don't sell "we support Jam." Sell the protocol. Any feedback
 * source you already have normalizes into ONE canonical data representation
 * (`SessionEvent[]`), and the loop closes on the representation — never on the
 * vendor. The representation is posted as a spec (docs/10-adapter-spec).
 */

const SOURCES = [
  "Your recorder",
  "Jam",
  "LogRocket",
  "Sentry Replay",
  "FullStory",
  "Datadog RUM",
  "Console + errors",
  "Custom adapter",
];

const SPEC_URL =
  "https://github.com/speechlabinc/complex-ui-tester/blob/main/docs/10-adapter-spec.md";

export function WiresEverything() {
  return (
    <section
      className="py-20 md:py-28 border-t border-[var(--border-color)]"
      aria-labelledby="wires-heading"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl">
          <p className="font-mono text-xs uppercase tracking-widest text-[var(--color-accent)] mb-4">
            One representation · every source · one loop
          </p>
          <h2
            id="wires-heading"
            className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-[var(--text-primary)] mb-5 leading-tight"
          >
            The data representation
            <br className="hidden sm:block" /> is the protocol.
          </h2>
          <p className="text-lg text-[var(--text-secondary)] leading-relaxed mb-4">
            Whatever feedback you already capture — a recorder, a bug-report
            tool, session replay, RUM, raw console logs — normalizes into one
            canonical representation:{" "}
            <code className="font-mono text-base px-1.5 py-0.5 rounded bg-[var(--bg-tertiary)] text-[var(--color-accent)]">
              SessionEvent[]
            </code>
            . The loop closes on the representation, never on the vendor.
          </p>
          <p className="text-base text-[var(--text-tertiary)] leading-relaxed mb-6">
            That&apos;s the moat: a posted, versioned contract — pointer, state,
            nav, console, error, keyboard — that any source maps into through
            the same{" "}
            <code className="font-mono text-sm text-[var(--text-secondary)]">
              SessionAdapter
            </code>{" "}
            interface. Swap the source, swap the model — the representation, the
            spec, and the CI gate are unchanged.
          </p>
          <a
            href={SPEC_URL}
            className="inline-flex items-center gap-2 font-mono text-sm text-[var(--color-accent)] hover:underline"
          >
            Read the posted spec — docs/10 adapter contract
            <span aria-hidden="true">→</span>
          </a>
        </div>

        {/* The protocol pipe: many sources → one representation → one loop */}
        <div className="mt-14 rounded-lg border border-[var(--border-color)] bg-[var(--bg-secondary)] p-6 md:p-8">
          <div className="grid md:grid-cols-[1fr_auto_auto_auto] gap-6 md:gap-4 items-center">
            {/* Sources */}
            <div>
              <p className="font-mono text-xs uppercase tracking-widest text-[var(--text-tertiary)] mb-3">
                Any feedback source
              </p>
              <div className="flex flex-wrap gap-2">
                {SOURCES.map((name) => (
                  <span
                    key={name}
                    className="font-mono text-xs px-2.5 py-1 rounded border border-[var(--border-color)] text-[var(--text-secondary)]"
                  >
                    {name}
                  </span>
                ))}
              </div>
            </div>

            <span className="hidden md:block text-[var(--text-tertiary)] text-2xl" aria-hidden="true">
              →
            </span>

            {/* The representation */}
            <div className="rounded-md border border-[var(--color-accent)]/40 bg-[var(--accent-green-bg)] px-4 py-3 text-center">
              <p className="font-mono text-sm font-semibold text-[var(--color-accent)]">
                SessionEvent[]
              </p>
              <p className="font-mono text-[10px] uppercase tracking-widest text-[var(--text-tertiary)] mt-1">
                canonical representation
              </p>
            </div>

            <span className="hidden md:block text-[var(--text-tertiary)] text-2xl" aria-hidden="true">
              →
            </span>

            {/* The loop output */}
            <div className="md:text-right">
              <p className="font-mono text-xs uppercase tracking-widest text-[var(--text-tertiary)] mb-3">
                One loop, in /cuit-loop
              </p>
              <p className="font-mono text-sm text-[var(--text-secondary)] leading-relaxed">
                observe <span className="text-[var(--text-tertiary)]">→</span>{" "}
                propose <span className="text-[var(--text-tertiary)]">→</span>{" "}
                verify{" "}
                <span style={{ color: "var(--color-accent)" }}>→ gate</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
