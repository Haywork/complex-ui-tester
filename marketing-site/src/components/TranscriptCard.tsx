import type { Transcript, TranscriptTurn } from "@/content/claude-code-transcripts";
import { Badge } from "@/components/ui/Badge";

function TurnBubble({ turn }: { turn: TranscriptTurn }) {
  if (turn.speaker === "user") {
    return (
      <div className="flex justify-end mb-3">
        <div className="max-w-[80%] bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-lg px-4 py-2 text-sm text-[var(--text-primary)]">
          <div className="font-mono text-[10px] uppercase tracking-wider text-[var(--text-tertiary)] mb-1">
            you
          </div>
          <div className="whitespace-pre-wrap leading-relaxed">{turn.content}</div>
        </div>
      </div>
    );
  }

  if (turn.speaker === "claude") {
    return (
      <div className="flex justify-start mb-3">
        <div className="max-w-[85%] bg-[color-mix(in_oklch,var(--accent-primary)_8%,transparent)] border border-[color-mix(in_oklch,var(--accent-primary)_30%,transparent)] rounded-lg px-4 py-2 text-sm text-[var(--text-primary)]">
          <div className="font-mono text-[10px] uppercase tracking-wider mb-1" style={{ color: "var(--accent-primary)" }}>
            Claude
          </div>
          <div className="whitespace-pre-wrap leading-relaxed">{turn.content}</div>
        </div>
      </div>
    );
  }

  // tool turn — monospace JSON block
  return (
    <div className="flex justify-start mb-3">
      <div className="w-full max-w-[95%] bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg overflow-hidden">
        <div className="px-4 py-1.5 border-b border-[var(--border-color)] bg-[var(--bg-tertiary)] flex items-center gap-2">
          <span className="font-mono text-[10px] uppercase tracking-wider text-[var(--text-tertiary)]">
            mcp tool
          </span>
          {turn.tool_name && (
            <code className="font-mono text-xs text-[var(--accent-primary)]">
              {turn.tool_name}
            </code>
          )}
        </div>
        <pre className="px-4 py-3 text-xs font-mono text-[var(--text-secondary)] overflow-x-auto leading-relaxed whitespace-pre-wrap">
          {turn.content}
        </pre>
      </div>
    </div>
  );
}

export function TranscriptCard({ transcript: t }: { transcript: Transcript }) {
  return (
    <article
      id={t.slug}
      className="border border-[var(--border-color)] rounded-lg overflow-hidden bg-[var(--bg-primary)] mb-12 scroll-mt-24"
    >
      <header className="px-6 py-5 border-b border-[var(--border-color)] bg-[var(--bg-secondary)]">
        <div className="flex items-baseline gap-3 flex-wrap mb-3">
          <h3 className="text-lg font-semibold text-[var(--text-primary)]">{t.title}</h3>
          <Badge>conversation</Badge>
        </div>
        <p className="text-sm text-[var(--text-secondary)] leading-relaxed mb-2">{t.scenario}</p>
        <p className="text-xs text-[var(--text-tertiary)] leading-relaxed">
          <strong className="text-[var(--text-secondary)]">Persona:</strong> {t.persona}
        </p>
      </header>
      <div className="px-6 py-6 bg-[var(--bg-primary)]">
        {t.turns.map((turn, i) => (
          <TurnBubble key={i} turn={turn} />
        ))}
      </div>
    </article>
  );
}
