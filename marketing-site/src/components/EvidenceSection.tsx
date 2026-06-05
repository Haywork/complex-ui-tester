import Link from "next/link";
import { EVIDENCE_STATS, BRANCH_B_BUGS, PR_URL } from "@/content/evidence";

export function EvidenceSection() {
  return (
    <section
      className="py-20 md:py-28 border-t border-[var(--border-color)]"
      aria-labelledby="evidence-heading"
      id="evidence"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mb-12">
          <p className="font-mono text-xs uppercase tracking-widest text-[var(--color-mute-4)] mb-4">
            Evidence — Branch B
          </p>
          <h2
            id="evidence-heading"
            className="text-3xl sm:text-4xl font-bold text-[var(--text-primary)] mb-4"
          >
            This already works in production.
          </h2>
          <p className="text-[var(--text-secondary)] leading-relaxed">
            The 6-layer harness shipped in{" "}
            <Link
              href={PR_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono text-[var(--color-accent)] hover:underline"
            >
              PR #1995
            </Link>{" "}
            on SpeechLab&apos;s waveform editor. Every claim in this section is
            grounded in that PR — open the link to verify.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
          {EVIDENCE_STATS.map((stat) => (
            <Link
              key={stat.label}
              href={stat.citationHref}
              target="_blank"
              rel="noopener noreferrer"
              className="group block rounded-[var(--radius-lg)] border border-[var(--border-color)] bg-[var(--bg-secondary)] p-6 hover:border-[var(--color-mute-4)] hover:bg-[var(--bg-tertiary)] transition-all focus-visible:outline-2 focus-visible:outline-[var(--color-accent)] focus-visible:outline-offset-2"
            >
              <div className="font-mono text-3xl sm:text-4xl font-bold text-[var(--text-primary)] mb-3 leading-none">
                {stat.value}
              </div>
              <div className="text-sm font-semibold text-[var(--text-primary)] mb-1">
                {stat.label}
              </div>
              <div className="text-xs text-[var(--text-tertiary)] mb-3">
                {stat.sublabel}
              </div>
              <div className="font-mono text-[10px] text-[var(--color-accent)] opacity-0 group-hover:opacity-100 transition-opacity">
                PR #1995 ↗
              </div>
            </Link>
          ))}
        </div>

        <div className="rounded-[var(--radius-lg)] border border-[var(--border-color)] bg-[var(--bg-secondary)] overflow-hidden">
          <div className="px-6 py-4 border-b border-[var(--border-color)] bg-[var(--bg-tertiary)] flex items-center justify-between gap-4 flex-wrap">
            <div>
              <h3 className="text-sm font-semibold text-[var(--text-primary)]">
                The 8 bugs we locked in
              </h3>
              <p className="text-xs text-[var(--text-tertiary)] mt-0.5">
                Every spec ships on PR #1995. All RED before fix, GREEN after,
                with zero flakes since.
              </p>
            </div>
            <Link
              href={PR_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono text-xs text-[var(--color-accent)] hover:underline shrink-0"
            >
              View the PR ↗
            </Link>
          </div>
          <ul
            className="divide-y divide-[var(--border-color)]"
            aria-label="Branch B bug list"
          >
            {BRANCH_B_BUGS.map((bug) => (
              <li key={bug.issueNumber}>
                <Link
                  href={bug.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-baseline gap-4 px-6 py-3 hover:bg-[var(--bg-tertiary)] transition-colors focus-visible:outline-2 focus-visible:outline-[var(--color-accent)] focus-visible:outline-offset-2"
                >
                  <span className="font-mono text-sm text-[var(--color-accent)] shrink-0 w-16">
                    {bug.issueNumber}
                  </span>
                  <span className="text-sm text-[var(--text-secondary)] flex-1">
                    {bug.description}
                  </span>
                  <span className="font-mono text-[10px] text-green-400 shrink-0">
                    locked in
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <p className="mt-8 text-xs text-[var(--text-tertiary)] max-w-3xl">
          <strong className="text-[var(--text-secondary)]">Meta-evidence:</strong>{" "}
          the harness itself was caught by its own loop. Issue{" "}
          <Link
            href={BRANCH_B_BUGS[7].href}
            target="_blank"
            rel="noopener noreferrer"
            className="font-mono text-[var(--color-accent)] hover:underline"
          >
            #1967
          </Link>{" "}
          (<code className="font-mono">dispatchDrag</code> off-by-
          <code className="font-mono">seg.x</code> for segment 0) was discovered
          when a generated spec consistently went RED on code we believed
          was correct. If the loop catches its own bugs, it catches yours.
        </p>
      </div>
    </section>
  );
}
