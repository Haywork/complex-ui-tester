"use client";

import { useState } from "react";
import Link from "next/link";
import { FAQ_ITEMS } from "@/content/faq";

export function FAQ() {
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  return (
    <section
      className="py-20 md:py-28 border-t border-[var(--border-color)]"
      aria-labelledby="faq-heading"
      id="faq"
    >
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-12">
          <p className="font-mono text-xs uppercase tracking-widest text-[var(--color-mute-4)] mb-4">
            FAQ
          </p>
          <h2
            id="faq-heading"
            className="text-3xl sm:text-4xl font-bold text-[var(--text-primary)] mb-4"
          >
            Questions worth asking.
          </h2>
          <p className="text-[var(--text-secondary)] leading-relaxed">
            Every answer links to the design doc that goes deeper. If you have a
            question we should add, file a{" "}
            <Link
              href="https://github.com/speechlabinc/complex-ui-tester/issues/new"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[var(--color-accent)] hover:underline"
            >
              docs issue
            </Link>
            .
          </p>
        </div>

        <ul className="divide-y divide-[var(--border-color)] border-y border-[var(--border-color)]" role="list">
          {FAQ_ITEMS.map((item, idx) => {
            const isOpen = openIdx === idx;
            const contentId = `faq-content-${idx}`;
            const buttonId = `faq-button-${idx}`;
            return (
              <li key={item.question}>
                <h3>
                  <button
                    type="button"
                    id={buttonId}
                    aria-expanded={isOpen}
                    aria-controls={contentId}
                    onClick={() => setOpenIdx(isOpen ? null : idx)}
                    className="w-full text-left flex items-start justify-between gap-4 py-5 hover:bg-[var(--bg-secondary)]/40 px-2 -mx-2 rounded-[var(--radius-md)] transition-colors focus-visible:outline-2 focus-visible:outline-[var(--color-accent)] focus-visible:outline-offset-2"
                  >
                    <span className="text-base md:text-lg font-semibold text-[var(--text-primary)] leading-snug">
                      {item.question}
                    </span>
                    <span
                      className="font-mono text-[var(--color-accent)] text-lg leading-none shrink-0 mt-1"
                      aria-hidden="true"
                    >
                      {isOpen ? "−" : "+"}
                    </span>
                  </button>
                </h3>
                {isOpen && (
                  <div
                    id={contentId}
                    role="region"
                    aria-labelledby={buttonId}
                    className="pb-5 pr-8 text-[var(--text-secondary)] leading-relaxed text-sm md:text-base"
                  >
                    <p>{item.answer}</p>
                    {item.docRef && item.docHref && (
                      <p className="mt-3">
                        <Link
                          href={item.docHref}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs font-mono text-[var(--color-accent)] hover:underline"
                        >
                          See {item.docRef} ↗
                        </Link>
                      </p>
                    )}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
