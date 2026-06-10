import Link from "next/link";
import { Button } from "@/components/ui/Button";

export function CTA() {
  return (
    <section
      className="py-20 md:py-28 border-t border-[var(--border-color)] relative overflow-hidden"
      aria-labelledby="cta-heading"
    >
      <div
        className="absolute inset-0 opacity-[0.05]"
        aria-hidden="true"
        style={{
          backgroundImage:
            "linear-gradient(var(--color-mute-5) 1px, transparent 1px), linear-gradient(90deg, var(--color-mute-5) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />
      <div
        className="absolute inset-x-0 bottom-0 h-64 opacity-15"
        aria-hidden="true"
        style={{
          background:
            "radial-gradient(ellipse 60% 100% at 50% 100%, var(--color-accent) 0%, transparent 70%)",
        }}
      />

      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <p className="font-mono text-xs uppercase tracking-widest text-[var(--text-tertiary)] mb-6">
          The loop is the product
        </p>
        <h2
          id="cta-heading"
          className="text-4xl sm:text-5xl md:text-6xl font-bold text-[var(--text-primary)] leading-[1.05] tracking-tight mb-6"
        >
          Close the loop Claude Code can&apos;t close alone.
        </h2>
        <p className="text-lg text-[var(--text-secondary)] leading-relaxed max-w-2xl mx-auto mb-10">
          Get a free token, drop the MCP skill into your Claude Code workspace,
          capture a session, and run{" "}
          <span className="font-mono text-[var(--text-primary)]">
            /cuit-loop
          </span>
          . Ten seconds. No human in the loop. Your first verified regression
          gate lands as a PR.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link href="/signup" className="inline-flex items-center">
            <Button variant="primary" size="lg">
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="M8 1v14M1 8h14"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
              Get your free token
            </Button>
          </Link>
          <Link
            href="https://github.com/speechlabinc/complex-ui-tester"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 text-base font-medium text-[var(--text-primary)] rounded-[var(--radius-md)] border border-[var(--border-color)] hover:border-[var(--color-mute-4)] hover:bg-[var(--bg-secondary)] transition-all focus-visible:outline-2 focus-visible:outline-[var(--color-accent)] focus-visible:outline-offset-2"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="currentColor"
              aria-hidden="true"
            >
              <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
            </svg>
            Browse the OSS harness
          </Link>
        </div>
        <p className="mt-8 font-mono text-xs text-[var(--text-tertiary)]">
          Free token. No credit card. MIT-licensed harness. Yours to fork.
        </p>
      </div>
    </section>
  );
}
