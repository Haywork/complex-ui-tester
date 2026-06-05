import Link from "next/link";
import { Badge } from "@/components/ui/Badge";

const FOOTER_LINKS = {
  Product: [
    { label: "Demo", href: "/#demo" },
    { label: "Proof", href: "/proof" },
    { label: "Pricing", href: "/pricing" },
    { label: "Docs", href: "/docs" },
    { label: "Security", href: "/security" },
    { label: "Roadmap", href: "https://github.com/speechlabinc/complex-ui-tester/blob/main/ARCHITECTURE.md" },
  ],
  Resources: [
    { label: "GitHub", href: "https://github.com/speechlabinc/complex-ui-tester", external: true },
    { label: "Changelog", href: "https://github.com/speechlabinc/complex-ui-tester/releases", external: true },
    { label: "Status", href: "https://status.speechlab.ai", external: true },
    { label: "Branch B PR", href: "https://github.com/speechlabinc/translate-ui-react/pull/1995", external: true },
  ],
  Company: [
    { label: "Contact", href: "mailto:ryan@speechlab.ai" },
    { label: "License", href: "https://github.com/speechlabinc/complex-ui-tester/blob/main/LICENSE", external: true },
    { label: "Code of Conduct", href: "https://github.com/speechlabinc/complex-ui-tester/blob/main/CONTRIBUTING.md", external: true },
  ],
};

export function Footer() {
  return (
    <footer
      className="border-t border-[var(--border-color)] bg-[var(--bg-secondary)] mt-24"
      role="contentinfo"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 lg:gap-12">
          {/* Brand */}
          <div className="sm:col-span-2 md:col-span-1">
            <Link
              href="/"
              className="font-mono text-sm font-medium text-[var(--text-primary)] hover:text-[var(--color-accent)] transition-colors focus-visible:outline-2 focus-visible:outline-[var(--color-accent)] focus-visible:outline-offset-2 rounded-sm"
            >
              <span className="text-[var(--text-tertiary)]">@cuit/</span>harness
            </Link>
            <p className="mt-3 text-sm text-[var(--text-secondary)] max-w-[220px] leading-relaxed">
              Turn session replays into deterministic Playwright specs. MIT-licensed harness, SaaS for the rest.
            </p>
            <div className="mt-4 flex items-center gap-2">
              <a
                href="https://github.com/speechlabinc/complex-ui-tester"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors focus-visible:outline-2 focus-visible:outline-[var(--color-accent)] focus-visible:outline-offset-2 rounded-sm"
                aria-label="GitHub repository (opens in new tab)"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
                </svg>
              </a>
            </div>
          </div>

          {/* Link columns */}
          {Object.entries(FOOTER_LINKS).map(([heading, links]) => (
            <div key={heading}>
              <h3 className="text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-widest mb-4">
                {heading}
              </h3>
              <ul className="space-y-2.5" role="list">
                {links.map((link) => (
                  <li key={link.label}>
                    {"external" in link && link.external ? (
                      <a
                        href={link.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors focus-visible:outline-2 focus-visible:outline-[var(--color-accent)] focus-visible:outline-offset-2 rounded-sm"
                      >
                        {link.label}
                        <span className="sr-only"> (opens in new tab)</span>
                      </a>
                    ) : (
                      <Link
                        href={link.href}
                        className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors focus-visible:outline-2 focus-visible:outline-[var(--color-accent)] focus-visible:outline-offset-2 rounded-sm"
                      >
                        {link.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="mt-12 pt-8 border-t border-[var(--border-color)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <p className="text-xs text-[var(--text-tertiary)]">
            &copy; 2026 SpeechLab, Inc. MIT-licensed library. All other trademarks belong to their owners.
          </p>
          <div className="flex items-center gap-2">
            <Badge variant="mono">v0.1 draft</Badge>
            <span className="text-xs text-[var(--text-tertiary)]">
              SOC 2 Type II in observation
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
