const CODE_LINES: Array<{ text: string; tone?: "primitive" | "comment" | "string" | "keyword" }> = [
  { text: "import { test, expect } from '@playwright/test';", tone: "keyword" },
  { text: "import {", tone: "keyword" },
  { text: "  dispatchDrag,", tone: "primitive" },
  { text: "  getStateSnapshot,", tone: "primitive" },
  { text: "  setClock,", tone: "primitive" },
  { text: "  getSegment,", tone: "primitive" },
  { text: "} from '@cuit/harness';" },
  { text: "" },
  { text: "// Issue #2014 — segment 0 drag must move past collision", tone: "comment" },
  { text: "test('segment 0 drag — no collision regression', async ({ page }) => {" },
  { text: "  await page.goto('/waveform');" },
  { text: "  await setClock(page, 0);", tone: "primitive" },
  { text: "" },
  { text: "  const before = await getStateSnapshot(page);", tone: "primitive" },
  { text: "  expect(before.segments[0].x).toBe(0);" },
  { text: "" },
  { text: "  await dispatchDrag(page, getSegment(page, 'seg-0'), {", tone: "primitive" },
  { text: "    dx: 100, dy: 0," },
  { text: "  });" },
  { text: "" },
  { text: "  const after = await getStateSnapshot(page);", tone: "primitive" },
  { text: "  expect(after.segments[0].x).toBe(100);" },
  { text: "});" },
];

const TONE_CLASS: Record<NonNullable<(typeof CODE_LINES)[number]["tone"]>, string> = {
  primitive: "text-[var(--color-accent)]",
  comment: "text-[var(--text-tertiary)] italic",
  string: "text-green-400",
  keyword: "text-purple-400",
};

export function SceneSpec() {
  return (
    <div className="rounded-[var(--radius-lg)] border border-[var(--border-color)] bg-[var(--bg-secondary)] overflow-hidden">
      <div className="px-4 py-2 border-b border-[var(--border-color)] bg-[var(--bg-tertiary)] flex items-center gap-2">
        <div className="flex gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500/70" />
          <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/70" />
          <span className="w-2.5 h-2.5 rounded-full bg-green-500/70" />
        </div>
        <span className="font-mono text-[10px] text-[var(--text-secondary)] ml-1">
          issue-2014-segment-collision.spec.ts
        </span>
        <div className="ml-auto flex items-center gap-2">
          <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-green-950/60 border border-green-900/50 text-green-400">
            confidence 0.91
          </span>
          <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-[var(--bg-secondary)] border border-[var(--border-color)] text-[var(--text-tertiary)]">
            threshold 0.75
          </span>
        </div>
      </div>
      <pre className="overflow-x-auto p-4 text-[12px] font-mono leading-relaxed text-[var(--text-primary)]">
        <code>
          {CODE_LINES.map((line, i) => (
            <div
              key={i}
              className={
                line.tone
                  ? TONE_CLASS[line.tone]
                  : "text-[var(--text-primary)]"
              }
            >
              {line.text || " "}
            </div>
          ))}
        </code>
      </pre>
      <div className="px-4 py-2 border-t border-[var(--border-color)] bg-[var(--bg-tertiary)] flex items-center gap-3 text-[10px] font-mono">
        <span className="text-green-400 flex items-center gap-1">
          <span>✓</span> AST grounded
        </span>
        <span className="text-green-400 flex items-center gap-1">
          <span>✓</span> 4 primitives used
        </span>
        <span className="text-green-400 flex items-center gap-1">
          <span>✓</span> no raw coords
        </span>
      </div>
    </div>
  );
}
