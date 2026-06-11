import { Fragment, type ReactNode } from "react";

/**
 * A deliberately small Markdown renderer for blog bodies. The repo does not use
 * MDX or any markdown dependency, and we are not adding one. This supports the
 * subset our posts actually use:
 *
 *   - `## h2` / `### h3` headings
 *   - paragraphs
 *   - `-` unordered lists
 *   - `1.` ordered lists
 *   - `> ` blockquotes
 *   - fenced ``` code blocks
 *   - inline: `**bold**`, `` `code` ``, `[text](href)`
 *
 * It is not a general CommonMark implementation — it is exactly enough to render
 * the authored content faithfully.
 */

/** Parse inline markdown (bold, code, links) into React nodes. */
function renderInline(text: string, keyPrefix: string): ReactNode[] {
  // Tokenize on the inline constructs we support. Order matters: code spans
  // first so their contents are not re-parsed.
  const pattern = /(`[^`]+`|\*\*[^*]+\*\*|\[[^\]]+\]\([^)]+\))/g;
  const parts = text.split(pattern);

  return parts.map((part, i) => {
    const key = `${keyPrefix}-${i}`;

    // Inline code: `code`
    if (part.startsWith("`") && part.endsWith("`") && part.length >= 2) {
      return (
        <code
          key={key}
          className="font-mono text-[0.85em] bg-[var(--bg-tertiary)] text-[var(--text-primary)] px-1.5 py-0.5 rounded"
        >
          {part.slice(1, -1)}
        </code>
      );
    }

    // Bold: **text**
    if (part.startsWith("**") && part.endsWith("**") && part.length >= 4) {
      return (
        <strong key={key} className="font-semibold text-[var(--text-primary)]">
          {part.slice(2, -2)}
        </strong>
      );
    }

    // Link: [text](href)
    const linkMatch = /^\[([^\]]+)\]\(([^)]+)\)$/.exec(part);
    if (linkMatch) {
      const [, label, href] = linkMatch;
      const external = /^https?:\/\//.test(href);
      return (
        <a
          key={key}
          href={href}
          target={external ? "_blank" : undefined}
          rel={external ? "noopener noreferrer" : undefined}
          className="text-[var(--color-accent)] hover:underline"
        >
          {label}
        </a>
      );
    }

    return <Fragment key={key}>{part}</Fragment>;
  });
}

/** Render a markdown string to an array of block-level React elements. */
export function renderMarkdown(markdown: string): ReactNode[] {
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  const blocks: ReactNode[] = [];

  let i = 0;
  let key = 0;
  const nextKey = () => `md-${key++}`;

  while (i < lines.length) {
    const line = lines[i];

    // Blank line — skip.
    if (line.trim() === "") {
      i++;
      continue;
    }

    // Fenced code block.
    if (line.trimStart().startsWith("```")) {
      const codeLines: string[] = [];
      i++; // consume opening fence
      while (i < lines.length && !lines[i].trimStart().startsWith("```")) {
        codeLines.push(lines[i]);
        i++;
      }
      i++; // consume closing fence
      blocks.push(
        <pre
          key={nextKey()}
          className="my-4 overflow-x-auto rounded-[var(--radius-lg)] border border-[var(--border-color)] bg-[var(--bg-tertiary)] p-4"
        >
          <code className="font-mono text-sm text-[var(--text-primary)] whitespace-pre">
            {codeLines.join("\n")}
          </code>
        </pre>,
      );
      continue;
    }

    // Headings.
    const headingMatch = /^(#{2,3})\s+(.*)$/.exec(line);
    if (headingMatch) {
      const [, hashes, content] = headingMatch;
      const k = nextKey();
      if (hashes.length === 2) {
        blocks.push(
          <h2
            key={k}
            className="mt-10 mb-3 text-2xl font-bold tracking-tight text-[var(--text-primary)] leading-snug"
          >
            {renderInline(content, k)}
          </h2>,
        );
      } else {
        blocks.push(
          <h3
            key={k}
            className="mt-8 mb-2 text-lg font-semibold text-[var(--text-primary)]"
          >
            {renderInline(content, k)}
          </h3>,
        );
      }
      i++;
      continue;
    }

    // Blockquote (single or consecutive lines).
    if (line.trimStart().startsWith(">")) {
      const quoteLines: string[] = [];
      while (i < lines.length && lines[i].trimStart().startsWith(">")) {
        quoteLines.push(lines[i].replace(/^\s*>\s?/, ""));
        i++;
      }
      const k = nextKey();
      blocks.push(
        <blockquote
          key={k}
          className="my-5 border-l-2 border-[var(--color-accent)] pl-4 text-[var(--text-secondary)] italic leading-relaxed"
        >
          {renderInline(quoteLines.join(" "), k)}
        </blockquote>,
      );
      continue;
    }

    // Ordered list.
    if (/^\d+\.\s+/.test(line.trimStart())) {
      const items: string[] = [];
      while (i < lines.length && /^\d+\.\s+/.test(lines[i].trimStart())) {
        items.push(lines[i].trimStart().replace(/^\d+\.\s+/, ""));
        i++;
      }
      const k = nextKey();
      blocks.push(
        <ol
          key={k}
          className="my-4 ml-5 flex list-decimal flex-col gap-2 text-[var(--text-secondary)] leading-relaxed"
        >
          {items.map((item, idx) => (
            <li key={`${k}-${idx}`}>{renderInline(item, `${k}-${idx}`)}</li>
          ))}
        </ol>,
      );
      continue;
    }

    // Unordered list.
    if (/^[-*]\s+/.test(line.trimStart())) {
      const items: string[] = [];
      while (i < lines.length && /^[-*]\s+/.test(lines[i].trimStart())) {
        items.push(lines[i].trimStart().replace(/^[-*]\s+/, ""));
        i++;
      }
      const k = nextKey();
      blocks.push(
        <ul
          key={k}
          className="my-4 ml-5 flex list-disc flex-col gap-2 text-[var(--text-secondary)] leading-relaxed"
        >
          {items.map((item, idx) => (
            <li key={`${k}-${idx}`}>{renderInline(item, `${k}-${idx}`)}</li>
          ))}
        </ul>,
      );
      continue;
    }

    // Paragraph: gather consecutive non-blank, non-block lines.
    const paraLines: string[] = [];
    while (
      i < lines.length &&
      lines[i].trim() !== "" &&
      !lines[i].trimStart().startsWith("```") &&
      !/^(#{2,3})\s+/.test(lines[i]) &&
      !lines[i].trimStart().startsWith(">") &&
      !/^[-*]\s+/.test(lines[i].trimStart()) &&
      !/^\d+\.\s+/.test(lines[i].trimStart())
    ) {
      paraLines.push(lines[i].trim());
      i++;
    }
    const k = nextKey();
    blocks.push(
      <p
        key={k}
        className="my-4 text-base text-[var(--text-secondary)] leading-relaxed"
      >
        {renderInline(paraLines.join(" "), k)}
      </p>,
    );
  }

  return blocks;
}
