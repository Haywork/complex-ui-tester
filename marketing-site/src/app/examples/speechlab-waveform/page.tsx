import type { Metadata } from "next";
import Link from "next/link";
import { SiteShell } from "@/components/SiteShell";
import { Badge } from "@/components/ui/Badge";

export const metadata: Metadata = {
  title: "Example — SpeechLab Waveform Editor CUIT Instrumentation",
  description:
    "Reference CUIT instrumentation on SpeechLab's waveform editor: recorder bridge, state snapshots, agentic UI test generation. The 80-line implementation to fork.",
  keywords: [
    "agentic ui test generation",
    "claude code ui testing",
    "mcp server ui regression",
    "closed loop verification for agents",
    "UI feedback loop",
    "CUIT instrumentation",
    "SpeechLab",
    "waveform editor testing",
  ],
  openGraph: {
    title: "Example — SpeechLab Waveform Editor CUIT Instrumentation | CUIT",
    description:
      "Reference CUIT instrumentation on SpeechLab's waveform editor: recorder bridge, state snapshots, agentic UI test generation. The 80-line implementation to fork.",
  },
};

const REPO = "https://github.com/speechlabinc/complex-ui-tester";
const BRIDGE_SRC = `${REPO}/blob/main/proof-of-concept/packages/recorder/src/translate-ui-react-bridge.ts`;

function Code({
  children,
  lang = "tsx",
}: {
  children: React.ReactNode;
  lang?: string;
}) {
  return (
    <pre className="text-xs sm:text-sm font-mono bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-md p-4 overflow-x-auto leading-relaxed text-[var(--text-primary)] whitespace-pre">
      <span className="text-[var(--text-tertiary)] text-[10px] uppercase tracking-widest">{lang}</span>
      {"\n"}
      {children}
    </pre>
  );
}

export default function SpeechLabExamplePage() {
  return (
    <SiteShell>
      {/* HERO */}
      <section className="pt-12 pb-10 md:pt-20 md:pb-14 border-b border-[var(--border-color)]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="font-mono text-xs uppercase tracking-widest text-[var(--text-tertiary)] mb-4">
            Example · reference instrumentation
          </p>
          <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-[var(--text-primary)] mb-6 leading-tight">
            How SpeechLab instrumented<br />
            <span className="text-[var(--text-secondary)]">translate-ui-react in 80 lines.</span>
          </h1>
          <p className="text-lg text-[var(--text-secondary)] max-w-3xl leading-relaxed mb-6">
            The waveform editor you see when you translate audio at speechlab.ai
            is a Next.js + Zustand app with react-rnd drag handles, segment
            collision detection, and a frozen-clock playhead. Branch B (PR
            #1995 in the public repo) shipped a 6-layer test harness against
            8 historical reopen-treadmill bugs.
          </p>
          <p className="text-lg text-[var(--text-secondary)] max-w-3xl leading-relaxed mb-6">
            CUIT instrumentation added one <code className="font-mono text-sm text-[var(--text-primary)] bg-[var(--bg-tertiary)] px-1.5 py-0.5 rounded">useEffect</code>{" "}
            and one bridge file. Everything you see below is open source — fork
            it.
          </p>
          <div className="flex flex-wrap gap-3">
            <Badge>Next.js 16</Badge>
            <Badge>React 19</Badge>
            <Badge>Zustand</Badge>
            <Badge>react-rnd</Badge>
            <Badge>NODE_ENV-gated</Badge>
            <Badge>?cuitRecorder=1</Badge>
          </div>
        </div>
      </section>

      {/* WHAT GETS CAPTURED */}
      <section className="py-12 border-b border-[var(--border-color)]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-semibold text-[var(--text-primary)] mb-4">
            What we capture — and what we don&apos;t
          </h2>
          <p className="text-sm text-[var(--text-secondary)] leading-relaxed mb-6 max-w-3xl">
            The recorder bridge taps into translate-ui-react&apos;s existing{" "}
            <code className="font-mono text-xs">window.__waveformDebug</code>{" "}
            API — a debug surface Branch B shipped for the Playwright suite. It
            captures only what spec-gen consumes; no DOM mutation logs, no
            screenshots, no network traffic.
          </p>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="border border-emerald-500/30 bg-emerald-500/5 rounded-lg p-4">
              <h3 className="font-mono text-xs uppercase tracking-widest text-emerald-300 mb-3">Captured</h3>
              <ul className="text-sm text-[var(--text-secondary)] space-y-1.5">
                <li>Pointer events (down / move / up)</li>
                <li>Semantic selectors (<code className="font-mono text-xs">data-segment-id</code>, <code className="font-mono text-xs">data-testid</code>)</li>
                <li>State snapshots from <code className="font-mono text-xs">__waveformDebug.getState()</code></li>
                <li>Drag/resize calls via <code className="font-mono text-xs">dispatchDrag</code>/<code className="font-mono text-xs">dispatchResize</code></li>
                <li>Nav events (URL changes with the gate)</li>
                <li>Git SHA + branch (for replay-against-history)</li>
              </ul>
            </div>
            <div className="border border-rose-500/30 bg-rose-500/5 rounded-lg p-4">
              <h3 className="font-mono text-xs uppercase tracking-widest text-rose-300 mb-3">Not captured</h3>
              <ul className="text-sm text-[var(--text-secondary)] space-y-1.5">
                <li>Video frames or screenshots</li>
                <li>Console output</li>
                <li>Network traffic / API responses</li>
                <li>Full DOM mutation logs</li>
                <li>Keyboard or wheel events (v0.1)</li>
                <li>Production traffic — gated by <code className="font-mono text-xs">?cuitRecorder=1</code></li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* THE INTEGRATION */}
      <section className="py-12 border-b border-[var(--border-color)]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-semibold text-[var(--text-primary)] mb-2">
            The integration — every line, in order
          </h2>
          <p className="text-sm text-[var(--text-secondary)] mb-8 max-w-3xl leading-relaxed">
            This is the diff that lights up CUIT in translate-ui-react. Two
            files, ~80 lines total. Adapt to your framework by swapping the
            debug-API import.
          </p>

          {/* Step 1 — Bridge file */}
          <div className="mb-10">
            <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">
              Step 1 — drop in the bridge file
            </h3>
            <p className="text-sm text-[var(--text-secondary)] mb-3 leading-relaxed">
              Available at{" "}
              <Link href={BRIDGE_SRC} className="underline text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
                @cuit/recorder/translate-ui-react-bridge
              </Link>
              . Re-declares the <code className="font-mono text-xs">__waveformDebug</code>{" "}
              shape locally so it has no compile-time dependency on translate-ui-react
              source.
            </p>
            <Code>{`// proof-of-concept/packages/recorder/src/translate-ui-react-bridge.ts (excerpt)
export function mountTranslateUiReactBridge(opts: {
  apiUrl: string;          // https://cuit-saas-pilot.fly.dev
  tenantToken: string;     // cuit_tk_...
  sessionId: string;       // \`tur-\${Date.now()}\`
  gitSha?: string;
  gitBranch?: string;
  onUpload?: (info: { events: number; serverId: string }) => void;
  onError?: (err: Error) => void;
}): BridgeHandle {
  // Poll for __waveformDebug to mount; once present, wrap its dispatch
  // methods so existing Branch B Playwright runs ALSO feed the recorder.
  const recorder = new Recorder({
    sessionId: opts.sessionId,
    vendor: 'cuit',
    snapshotProvider: () => window.__waveformDebug?.getState() ?? null,
    semanticSelectors: ['data-segment-id', 'data-testid', 'data-cuit-id', 'data-cy'],
  });
  recorder.start();
  // ... wrap dispatchDrag / dispatchResize, capture snapshots, POST on stop ...
  return { stop, size, peek };
}`}</Code>
          </div>

          {/* Step 2 — Mount it */}
          <div className="mb-10">
            <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">
              Step 2 — mount it from your root component
            </h3>
            <p className="text-sm text-[var(--text-secondary)] mb-3 leading-relaxed">
              In our case, alongside the existing <code className="font-mono text-xs">mountDebugAPI</code> useEffect in{" "}
              <code className="font-mono text-xs">WaveFormDub.tsx</code>. Two gates: <code className="font-mono text-xs">NODE_ENV !== &apos;production&apos;</code> AND <code className="font-mono text-xs">?cuitRecorder=1</code> in the URL.
              The dynamic import keeps the production bundle untouched — tree-shaken to zero.
            </p>
            <Code>{`// src/components/domain/WaveFormSegment/WaveFormDub.tsx
useEffect(() => {
  if (process.env.NODE_ENV === 'production') return;
  if (typeof window === 'undefined') return;
  const url = new URL(window.location.href);
  if (!url.searchParams.has('cuitRecorder')) return;

  let cancelled = false;
  let handle: { stop: () => Promise<string | null> } | null = null;
  (async () => {
    const mod = await import('@cuit/recorder/translate-ui-react-bridge');
    if (cancelled) return;
    handle = mod.mountTranslateUiReactBridge({
      apiUrl: process.env.NEXT_PUBLIC_CUIT_API_URL ?? 'https://cuit-saas-pilot.fly.dev',
      tenantToken: process.env.NEXT_PUBLIC_CUIT_TOKEN!,
      sessionId: \`tur-\${Date.now()}\`,
      gitSha: process.env.NEXT_PUBLIC_GIT_SHA,
      gitBranch: process.env.NEXT_PUBLIC_GIT_BRANCH,
      onUpload: (info) => console.log('[cuit] uploaded', info),
      onError: (err) => console.error('[cuit] error', err),
    });
  })();
  return () => { cancelled = true; handle?.stop?.(); };
}, []);`}</Code>
          </div>

          {/* Step 3 — env */}
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">
              Step 3 — env vars + dev workflow
            </h3>
            <p className="text-sm text-[var(--text-secondary)] mb-3 leading-relaxed">
              No bundler config to change. Just env vars for token + git context.
            </p>
            <Code lang="bash">{`# .env.local (gitignored)
NEXT_PUBLIC_CUIT_API_URL=https://cuit-saas-pilot.fly.dev
NEXT_PUBLIC_CUIT_TOKEN=cuit_tk_...
NEXT_PUBLIC_GIT_SHA=$(git rev-parse --short HEAD)
NEXT_PUBLIC_GIT_BRANCH=$(git branch --show-current)

# Then
pnpm dev
open "http://localhost:3000/projects/abc-123?cuitRecorder=1"
# Use the app normally. Sessions stream to the warehouse on close.`}</Code>
          </div>
        </div>
      </section>

      {/* THE BRANCH B CONTEXT */}
      <section className="py-12 border-b border-[var(--border-color)]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-semibold text-[var(--text-primary)] mb-4">
            Why <code className="font-mono">__waveformDebug</code> existed before CUIT did
          </h2>
          <p className="text-sm text-[var(--text-secondary)] leading-relaxed mb-4 max-w-3xl">
            Branch B (the 6-layer harness that became CUIT&apos;s core) shipped
            a debug surface for translate-ui-react&apos;s Playwright tests in
            May 2026. The CUIT recorder taps that same surface — meaning the
            integration is just the bridge file, not a refactor.
          </p>
          <table className="w-full text-sm font-mono">
            <thead>
              <tr className="text-[var(--text-tertiary)] uppercase tracking-wider text-xs">
                <th className="text-left py-2 pr-4 font-normal">Bug</th>
                <th className="text-left py-2 pr-4 font-normal">Reopen count before</th>
                <th className="text-left py-2 font-normal">After CUIT spec lock-in</th>
              </tr>
            </thead>
            <tbody className="text-xs">
              <tr className="border-t border-[var(--border-color)]"><td className="py-2 pr-4">#1931 playhead defaults to first segment</td><td className="py-2 pr-4 text-rose-300">3 reopens</td><td className="py-2 text-emerald-300">locked</td></tr>
              <tr className="border-t border-[var(--border-color)]"><td className="py-2 pr-4">#1921 resize handle flicker</td><td className="py-2 pr-4 text-rose-300">2 reopens</td><td className="py-2 text-emerald-300">locked</td></tr>
              <tr className="border-t border-[var(--border-color)]"><td className="py-2 pr-4">#1927 seekTo frame offset</td><td className="py-2 pr-4 text-rose-300">2 reopens</td><td className="py-2 text-emerald-300">locked</td></tr>
              <tr className="border-t border-[var(--border-color)]"><td className="py-2 pr-4">#1956 WaveSurfer instance leak</td><td className="py-2 pr-4 text-rose-300">1 reopen</td><td className="py-2 text-emerald-300">locked</td></tr>
              <tr className="border-t border-[var(--border-color)]"><td className="py-2 pr-4">#1933 playhead clock drift under setClock</td><td className="py-2 pr-4 text-rose-300">2 reopens</td><td className="py-2 text-emerald-300">locked</td></tr>
              <tr className="border-t border-[var(--border-color)]"><td className="py-2 pr-4">#1960 CSS z-index regression</td><td className="py-2 pr-4 text-rose-300">1 reopen</td><td className="py-2 text-emerald-300">locked</td></tr>
              <tr className="border-t border-[var(--border-color)]"><td className="py-2 pr-4">#1964 touch dispatch on scroll-locked</td><td className="py-2 pr-4 text-rose-300">2 reopens</td><td className="py-2 text-emerald-300">locked</td></tr>
              <tr className="border-t border-[var(--border-color)]"><td className="py-2 pr-4">#1833/#1952 drag-after-resize playhead</td><td className="py-2 pr-4 text-rose-300">4 reopens</td><td className="py-2 text-emerald-300">locked</td></tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* ADAPT TO YOUR FRAMEWORK */}
      <section className="py-12 border-b border-[var(--border-color)]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-semibold text-[var(--text-primary)] mb-4">
            Adapt to your framework
          </h2>
          <p className="text-sm text-[var(--text-secondary)] mb-6 max-w-3xl leading-relaxed">
            The bridge has three swappable pieces. Map them onto whatever you
            have:
          </p>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="border border-[var(--border-color)] rounded-lg p-5">
              <h4 className="font-mono text-xs uppercase tracking-widest text-[var(--text-tertiary)] mb-2">Snapshot provider</h4>
              <p className="text-sm text-[var(--text-secondary)] leading-relaxed mb-2">SpeechLab: <code className="font-mono text-xs">window.__waveformDebug.getState()</code></p>
              <p className="text-sm text-[var(--text-secondary)] leading-relaxed">You: expose <code className="font-mono text-xs">window.__cuitDebug.getState</code> returning a flat record of your interesting state.</p>
            </div>
            <div className="border border-[var(--border-color)] rounded-lg p-5">
              <h4 className="font-mono text-xs uppercase tracking-widest text-[var(--text-tertiary)] mb-2">Dispatch wrappers</h4>
              <p className="text-sm text-[var(--text-secondary)] leading-relaxed mb-2">SpeechLab: <code className="font-mono text-xs">dispatchDrag/Resize</code> on react-rnd</p>
              <p className="text-sm text-[var(--text-secondary)] leading-relaxed">You: not required — recorder captures pointer events directly. Wrappers help when your tests fire synthetic events.</p>
            </div>
            <div className="border border-[var(--border-color)] rounded-lg p-5">
              <h4 className="font-mono text-xs uppercase tracking-widest text-[var(--text-tertiary)] mb-2">Semantic selectors</h4>
              <p className="text-sm text-[var(--text-secondary)] leading-relaxed mb-2">SpeechLab: <code className="font-mono text-xs">data-segment-id</code> on each segment</p>
              <p className="text-sm text-[var(--text-secondary)] leading-relaxed">You: any stable identifier you already have. <code className="font-mono text-xs">data-testid</code>, <code className="font-mono text-xs">data-cy</code>, <code className="font-mono text-xs">aria-label</code> all work. Recorder tries them in priority order.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-12 bg-[var(--bg-secondary)]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl font-semibold text-[var(--text-primary)] mb-4">
            Fork the SpeechLab pattern
          </h2>
          <p className="text-base text-[var(--text-secondary)] mb-8 max-w-2xl mx-auto leading-relaxed">
            The bridge file is 264 lines of TypeScript. The mount is 22 lines
            in <code className="font-mono text-sm">WaveFormDub.tsx</code>. Take
            them as your reference; we&apos;ll have a per-framework templated
            CLI shortly.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Link
              href="/signup"
              className="px-5 py-3 bg-[var(--accent-primary)] text-[var(--bg-primary)] rounded-md font-semibold hover:opacity-90 transition"
            >
              Sign up → get a tenant token
            </Link>
            <Link
              href={BRIDGE_SRC}
              className="px-5 py-3 border border-[var(--border-color)] rounded-md font-mono text-sm text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] transition"
            >
              Read the bridge source on GitHub
            </Link>
            <Link
              href="/quickstart"
              className="px-5 py-3 border border-[var(--border-color)] rounded-md font-mono text-sm text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] transition"
            >
              5-minute API walkthrough
            </Link>
          </div>
        </div>
      </section>
    </SiteShell>
  );
}
