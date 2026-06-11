import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteShell } from "@/components/SiteShell";
import {
  BLOG_POSTS,
  formatBlogDate,
  getBlogPost,
  type BlogPost,
} from "@/content/blog-posts";
import { renderMarkdown } from "./markdown";

const SITE_URL = "https://complex-ui-tester.vercel.app";

/** Pre-render every known post at build time. */
export function generateStaticParams(): Array<{ slug: string }> {
  return BLOG_POSTS.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata(
  props: PageProps<"/blog/[slug]">,
): Promise<Metadata> {
  const { slug } = await props.params;
  const post = getBlogPost(slug);
  if (!post) {
    return { title: "Post not found" };
  }

  const url = `/blog/${post.slug}`;
  return {
    title: post.title,
    description: post.metaDescription,
    keywords: [post.primaryKeyword],
    alternates: {
      canonical: url,
    },
    openGraph: {
      title: `${post.title} | CUIT`,
      description: post.metaDescription,
      url,
      type: "article",
      publishedTime: post.date,
      authors: ["SpeechLab, Inc."],
    },
    twitter: {
      card: "summary_large_image",
      title: `${post.title} | CUIT`,
      description: post.metaDescription,
    },
  };
}

/** Article JSON-LD for rich-result eligibility. */
function articleJsonLd(post: BlogPost) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.metaDescription,
    datePublished: post.date,
    dateModified: post.date,
    author: {
      "@type": "Organization",
      name: "SpeechLab, Inc.",
      url: "https://speechlab.ai",
    },
    publisher: {
      "@type": "Organization",
      name: "SpeechLab, Inc.",
      url: "https://speechlab.ai",
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `${SITE_URL}/blog/${post.slug}`,
    },
  };
}

export default async function BlogPostPage(props: PageProps<"/blog/[slug]">) {
  const { slug } = await props.params;
  const post = getBlogPost(slug);
  if (!post) {
    notFound();
  }

  return (
    <SiteShell>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(articleJsonLd(post)),
        }}
      />

      <article className="py-12 md:py-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Breadcrumb */}
          <Link
            href="/blog"
            className="font-mono text-xs text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors"
          >
            ← All posts
          </Link>

          {/* Header */}
          <header className="mt-6 mb-10 pb-8 border-b border-[var(--border-color)]">
            <time
              dateTime={post.date}
              className="font-mono text-[11px] uppercase tracking-wider text-[var(--text-tertiary)]"
            >
              {formatBlogDate(post.date)}
            </time>
            <h1 className="mt-3 text-3xl md:text-4xl font-bold tracking-tight text-[var(--text-primary)] leading-tight">
              {post.title}
            </h1>
            <p className="mt-4 text-lg text-[var(--text-secondary)] leading-relaxed">
              {post.metaDescription}
            </p>
          </header>

          {/* Body */}
          <div className="flex flex-col gap-1">{renderMarkdown(post.bodyMarkdown)}</div>

          {/* Sources */}
          {post.sources.length > 0 && (
            <footer className="mt-12 pt-8 border-t border-[var(--border-color)]">
              <h2 className="font-mono text-xs uppercase tracking-widest text-[var(--text-tertiary)] mb-4">
                Sources
              </h2>
              <ul className="flex flex-col gap-2" role="list">
                {post.sources.map((source) => (
                  <li key={source.href}>
                    <a
                      href={source.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-[var(--color-accent)] hover:underline break-words"
                    >
                      {source.label}
                      <span aria-hidden="true"> ↗</span>
                    </a>
                  </li>
                ))}
              </ul>
            </footer>
          )}
        </div>
      </article>
    </SiteShell>
  );
}
