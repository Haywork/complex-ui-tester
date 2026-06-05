export function SceneTerminal() {
  return (
    <div className="rounded-[var(--radius-lg)] border-2 border-red-900/50 bg-black/70 overflow-hidden">
      <div className="px-4 py-2 border-b border-red-900/40 bg-red-950/30 flex items-center gap-2">
        <div className="flex gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500/70" />
          <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/70" />
          <span className="w-2.5 h-2.5 rounded-full bg-green-500/70" />
        </div>
        <span className="font-mono text-[10px] text-red-400 ml-1">
          $ pnpm cuit run issue-2014-segment-collision.spec.ts
        </span>
      </div>
      <pre className="overflow-x-auto p-4 text-[12px] font-mono leading-relaxed text-zinc-300">
        <code>
          <div>
            <span className="text-zinc-500">[18:42:01]</span>{" "}
            <span className="text-zinc-400">running</span>{" "}
            <span className="text-cyan-400">1 spec</span> with{" "}
            <span className="text-cyan-400">@cuit/harness@0.1.0</span>
          </div>
          <div>
            <span className="text-zinc-500">[18:42:02]</span>{" "}
            <span className="text-zinc-400">browser:</span>{" "}
            <span className="text-cyan-400">chromium 128</span>
          </div>
          <div>&nbsp;</div>
          <div className="text-zinc-300">
            ✓ harness initialized · setClock(0) · 3 segments
          </div>
          <div className="text-zinc-300">
            ✓ snapshot before: <span className="text-cyan-400">segments[0].x = 0</span>
          </div>
          <div className="text-zinc-300">
            ✓ dispatched drag: <span className="text-cyan-400">seg-0 +100px</span>
          </div>
          <div className="text-zinc-300">
            ✓ snapshot after: <span className="text-cyan-400">segments[0].x = 0</span>
            <span className="text-yellow-400"> ← bug reproduced</span>
          </div>
          <div>&nbsp;</div>
          <div className="text-red-400">
            ✗ FAIL — segment 0 right edge collision regression (issue #2014)
          </div>
          <div className="text-zinc-400 pl-4">
            <div>
              Expected: <span className="text-green-400">segments[0].x === 100</span>
            </div>
            <div>
              Actual:&nbsp;&nbsp; <span className="text-red-400">segments[0].x === 0</span>
            </div>
          </div>
          <div>&nbsp;</div>
          <div className="text-zinc-500">
            ──────────────────────────────────────────
          </div>
          <div>
            <span className="text-red-400">1 failed</span>{" "}
            <span className="text-zinc-500">·</span>{" "}
            <span className="text-zinc-400">0 passed</span>{" "}
            <span className="text-zinc-500">·</span>{" "}
            <span className="text-zinc-400">1.8s</span>
          </div>
        </code>
      </pre>
      <div className="px-4 py-2 border-t border-red-900/40 bg-red-950/30 text-[10px] font-mono text-red-300">
        RED is the success state — the spec deterministically reproduces the bug
      </div>
    </div>
  );
}
