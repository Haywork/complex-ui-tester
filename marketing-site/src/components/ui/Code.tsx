import React from "react";

interface CodeBlockProps {
  code: string;
  language?: string;
  filename?: string;
  highlightLines?: number[];
  className?: string;
}

export function CodeBlock({
  code,
  language = "typescript",
  filename,
  className = "",
}: CodeBlockProps) {
  return (
    <div
      className={[
        "rounded-[var(--radius-md)] border border-[var(--border-color)] overflow-hidden",
        "bg-[var(--bg-secondary)]",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {filename && (
        <div className="flex items-center gap-2 px-4 py-2.5 border-b border-[var(--border-color)] bg-[var(--bg-tertiary)]">
          <div className="flex gap-1.5" aria-hidden="true">
            <span className="w-3 h-3 rounded-full bg-red-500/70" />
            <span className="w-3 h-3 rounded-full bg-yellow-500/70" />
            <span className="w-3 h-3 rounded-full bg-green-500/70" />
          </div>
          <span className="text-xs font-mono text-[var(--text-secondary)] ml-1">
            {filename}
          </span>
          <span className="ml-auto text-xs text-[var(--text-tertiary)] uppercase tracking-wider">
            {language}
          </span>
        </div>
      )}
      <pre
        className="overflow-x-auto p-4 text-sm font-mono leading-relaxed text-[var(--text-primary)]"
        tabIndex={0}
        aria-label={filename ? `Code: ${filename}` : `Code block`}
      >
        <code>{code}</code>
      </pre>
    </div>
  );
}

interface InlineCodeProps {
  children: React.ReactNode;
  className?: string;
}

export function InlineCode({ children, className = "" }: InlineCodeProps) {
  return (
    <code
      className={[
        "font-mono text-[0.875em] px-1.5 py-0.5 rounded-[var(--radius-sm)]",
        "bg-[var(--bg-secondary)] text-[var(--color-accent)] border border-[var(--border-color)]",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
    </code>
  );
}
