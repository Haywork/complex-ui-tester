import type { Metadata } from "next";
import Link from "next/link";
import { SiteShell } from "@/components/SiteShell";
import { BLOG_POSTS_BY_DATE, formatBlogDate } from "@/content/blog-posts";

export const metadata: Metadata = {
  title: "Blog — Closing the UI Verification Gap for AI Coding Agents",
  description:
    "Field notes on Claude Code UI testing, flaky Playwright AI tests, and closed-loop UI verification — how to make agentic frontend changes provable, not assumed.",
  keywords: [
    "claude code ui testing",
    "flaky playwright ai tests",
    "closed-loop ui verification",
    "UI feedback loop",
    "agentic ui test generation",
    "mcp server ui regression",
    "CUIT blog",
  ],
  alternates: {
    canonical: "/blog",
  },
  openGraph: {
    title: "Blog — Closing the UI Verification Gap | CUIT",
    description:
      "Field notes on Claude Code UI testing, flaky Playwright AI tests, and closed-loop UI verification for AI coding agents.",
    url: "/blog",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Blog — Closing the UI Verification Gap | CUIT",
    description:
      "Field notes on Claude Code UI testing, flaky Playwright AI tests, and closed-loop UI verification for AI coding agents.",
  },
};

export default function BlogIndexPage() {
  return (
    <SiteShell>
      {/* HERO */}
      <section className="pt-12 pb-10 md:pt-20 md:pb-14 border-b border-[var(--border-color)]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="font-mono text-xs uppercase tracking-widest text-[var(--text-tertiary)] mb-4">
            Blog
          </p>
          <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-[var(--text-primary)] mb-6 leading-tight">
            Closing the UI verification gap.
          </h1>
          <p className="text-lg text-[var(--text-secondary)] max-w-3xl leading-relaxed">
            Field notes on agentic UI testing — why AI coding agents regress the
            frontend, why self-healing tests lie, and how a deterministic
            closed loop makes UI changes provable instead of assumed.
          </p>
        </div>
      </section>

      {/* POST LIST */}
      <section className="py-12 md:py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <ul className="flex flex-col gap-4" role="list">
            {BLOG_POSTS_BY_DATE.map((post) => (
              <li key={post.slug}>
                <Link
                  href={`/blog/${post.slug}`}
                  className="group block rounded-[var(--radius-lg)] border border-[var(--border-color)] bg-[var(--bg-secondary)] p-6 hover:border-[var(--color-accent)]/40 hover:bg-[var(--bg-tertiary)] transition-all focus-visible:outline-2 focus-visible:outline-[var(--color-accent)] focus-visible:outline-offset-2"
                >
                  <time
                    dateTime={post.date}
                    className="font-mono text-[11px] uppercase tracking-wider text-[var(--text-tertiary)]"
                  >
                    {formatBlogDate(post.date)}
                  </time>
                  <h2 className="mt-2 text-xl md:text-2xl font-semibold text-[var(--text-primary)] group-hover:text-[var(--color-accent)] transition-colors leading-snug">
                    {post.title}
                  </h2>
                  <p className="mt-2 text-sm md:text-base text-[var(--text-secondary)] leading-relaxed">
                    {post.metaDescription}
                  </p>
                  <span className="mt-4 inline-flex items-center gap-1.5 font-mono text-xs text-[var(--color-accent)]">
                    Read post
                    <span
                      className="transition-transform group-hover:translate-x-0.5"
                      aria-hidden="true"
                    >
                      →
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </SiteShell>
  );
}
