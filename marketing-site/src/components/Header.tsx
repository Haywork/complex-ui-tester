"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { BrandMark } from "@/components/BrandMark";

interface NavItem {
  label: string;
  href: string;
  external?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { label: "Product", href: "/#how-it-works" },
  { label: "Sign up", href: "/signup" },
  { label: "Quickstart", href: "/quickstart" },
  { label: "Example", href: "/examples/speechlab-waveform" },
  { label: "Pricing", href: "/pricing" },
  { label: "Docs", href: "/docs" },
];

interface HeaderProps {
  /** Whether dark mode is currently active */
  isDark: boolean;
  /** Toggle dark/light mode */
  onToggleTheme: () => void;
}

export function Header({ isDark, onToggleTheme }: HeaderProps) {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close menu on outside click
  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target as Node) &&
        !menuButtonRef.current?.contains(e.target as Node)
      ) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [menuOpen]);

  // Close menu on Escape
  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMenuOpen(false);
        menuButtonRef.current?.focus();
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [menuOpen]);

  return (
    <header
      className={[
        "fixed inset-x-0 top-0 z-50 transition-all duration-300",
        scrolled
          ? "bg-[var(--bg-primary)]/90 backdrop-blur-md border-b border-[var(--color-accent)]/20"
          : "bg-transparent",
      ]
        .filter(Boolean)
        .join(" ")}
      role="banner"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Wordmark */}
          <Link
            href="/"
            className="flex items-center gap-2.5 group focus-visible:outline-2 focus-visible:outline-[var(--color-accent)] focus-visible:outline-offset-2 rounded-sm"
            aria-label="CUIT — home"
          >
            <BrandMark size={22} markOnly className="shrink-0 transition-opacity group-hover:opacity-80" />
            <div className="flex flex-col leading-none">
              <span
                className="font-mono text-sm font-bold tracking-[0.08em] text-[var(--text-primary)] group-hover:text-[var(--color-accent)] transition-colors"
                style={{ letterSpacing: "0.06em" }}
              >
                CUIT
              </span>
              <span className="font-mono text-[9px] text-[var(--text-tertiary)] tracking-wider mt-px">
                complex-ui-tester
              </span>
            </div>
          </Link>

          {/* Desktop nav */}
          <nav
            className="hidden md:flex items-center gap-1"
            aria-label="Primary navigation"
          >
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="px-3 py-1.5 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] rounded-[var(--radius-md)] transition-colors focus-visible:outline-2 focus-visible:outline-[var(--color-accent)] focus-visible:outline-offset-2"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {/* Theme toggle */}
            <button
              onClick={onToggleTheme}
              className="hidden sm:flex items-center justify-center w-8 h-8 rounded-[var(--radius-md)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] transition-colors focus-visible:outline-2 focus-visible:outline-[var(--color-accent)] focus-visible:outline-offset-2"
              aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
              title={isDark ? "Light mode" : "Dark mode"}
            >
              {isDark ? (
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <path
                    d="M8 1v1M8 14v1M1 8h1M14 8h1M3.05 3.05l.7.7M12.25 12.25l.7.7M3.05 12.95l.7-.7M12.25 3.75l.7-.7M11 8A3 3 0 115 8a3 3 0 016 0z"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <path
                    d="M13.5 8.9A6 6 0 117.1 2.5a5 5 0 006.4 6.4z"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
            </button>

            {/* GitHub + alpha pill */}
            <div className="hidden sm:flex items-center gap-1.5">
              <a
                href="https://github.com/speechlabinc/complex-ui-tester"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center w-8 h-8 rounded-[var(--radius-md)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] transition-colors focus-visible:outline-2 focus-visible:outline-[var(--color-accent)] focus-visible:outline-offset-2"
                aria-label="View on GitHub (opens in new tab)"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
                </svg>
              </a>
              {/* Alpha pill */}
              <span className="font-mono text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded border border-[var(--color-accent)]/40 text-[var(--color-accent)] bg-[var(--color-accent)]/[0.08] select-none">
                alpha
              </span>
            </div>

            {/* CTA */}
            <Button
              variant="primary"
              size="sm"
              className="hidden sm:inline-flex"
              onClick={() => {
                document
                  .getElementById("demo")
                  ?.scrollIntoView({ behavior: "smooth" });
              }}
            >
              Get a demo
            </Button>

            {/* Hamburger */}
            <button
              ref={menuButtonRef}
              className="md:hidden flex items-center justify-center w-9 h-9 rounded-[var(--radius-md)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] transition-colors focus-visible:outline-2 focus-visible:outline-[var(--color-accent)] focus-visible:outline-offset-2"
              onClick={() => setMenuOpen((v) => !v)}
              aria-expanded={menuOpen}
              aria-controls="mobile-menu"
              aria-label={menuOpen ? "Close menu" : "Open menu"}
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 18 18"
                fill="none"
                aria-hidden="true"
              >
                {menuOpen ? (
                  <path
                    d="M2 2L16 16M16 2L2 16"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                  />
                ) : (
                  <path
                    d="M2 4.5h14M2 9h14M2 13.5h14"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                  />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div
          id="mobile-menu"
          ref={menuRef}
          className="md:hidden border-t border-[var(--border-color)] bg-[var(--bg-primary)]/95 backdrop-blur-md"
          role="navigation"
          aria-label="Mobile navigation"
        >
          <div className="px-4 py-3 flex flex-col gap-1">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="px-3 py-2.5 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] rounded-[var(--radius-md)] transition-colors"
                onClick={() => setMenuOpen(false)}
              >
                {item.label}
              </Link>
            ))}
            <div className="pt-2 border-t border-[var(--border-color)] mt-1 flex items-center gap-2">
              <button
                onClick={() => {
                  onToggleTheme();
                  setMenuOpen(false);
                }}
                className="flex-1 text-sm text-[var(--text-secondary)] text-center py-2 hover:bg-[var(--bg-secondary)] rounded-[var(--radius-md)] transition-colors"
              >
                {isDark ? "Light mode" : "Dark mode"}
              </button>
              <a
                href="https://github.com/speechlabinc/complex-ui-tester"
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 text-sm text-[var(--text-secondary)] text-center py-2 hover:bg-[var(--bg-secondary)] rounded-[var(--radius-md)] transition-colors"
                onClick={() => setMenuOpen(false)}
              >
                GitHub
              </a>
              <Button
                variant="primary"
                size="sm"
                className="flex-1"
                onClick={() => {
                  setMenuOpen(false);
                  document
                    .getElementById("demo")
                    ?.scrollIntoView({ behavior: "smooth" });
                }}
              >
                Get a demo
              </Button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
