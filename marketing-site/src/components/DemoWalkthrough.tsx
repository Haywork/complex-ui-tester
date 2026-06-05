"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { DEMO_SCENES } from "@/content/demo-scenes";
import { Button } from "@/components/ui/Button";
import { Kbd } from "@/components/ui/Kbd";
import { SceneWaveform } from "./demo/SceneWaveform";
import { SceneJamCard } from "./demo/SceneJamCard";
import { SceneDashboard } from "./demo/SceneDashboard";
import { ScenePipeline } from "./demo/ScenePipeline";
import { SceneSpec } from "./demo/SceneSpec";
import { SceneTerminal } from "./demo/SceneTerminal";
import { ScenePrCard } from "./demo/ScenePrCard";
import { SceneCiCard } from "./demo/SceneCiCard";

const TOTAL = DEMO_SCENES.length;
const SCENE_MIN = 1;
const SCENE_MAX = TOTAL;
const AUTO_ADVANCE_MS = 6000;
const SWIPE_THRESHOLD = 50;

function clamp(n: number) {
  if (Number.isNaN(n)) return SCENE_MIN;
  if (n < SCENE_MIN) return SCENE_MIN;
  if (n > SCENE_MAX) return SCENE_MAX;
  return n;
}

function renderVisual(visualType: (typeof DEMO_SCENES)[number]["visualType"]) {
  switch (visualType) {
    case "waveform":
      return <SceneWaveform />;
    case "jam-card":
      return <SceneJamCard />;
    case "dashboard":
      return <SceneDashboard />;
    case "pipeline":
      return <ScenePipeline />;
    case "spec":
      return <SceneSpec />;
    case "terminal":
      return <SceneTerminal />;
    case "pr-card":
      return <ScenePrCard />;
    case "ci-card":
      return <SceneCiCard />;
    default:
      return null;
  }
}

interface DemoWalkthroughProps {
  initialScene?: number;
}

export function DemoWalkthrough({
  initialScene = SCENE_MIN,
}: DemoWalkthroughProps) {
  const [scene, setScene] = useState<number>(clamp(initialScene));
  const [auto, setAuto] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const liveRegionRef = useRef<HTMLDivElement>(null);
  const hasMountedRef = useRef(false);

  const navigate = useCallback((target: number) => {
    setScene(clamp(target));
  }, []);

  useEffect(() => {
    // Skip the first effect run so we don't write to history on hydration —
    // only on actual scene changes from user interaction.
    if (!hasMountedRef.current) {
      hasMountedRef.current = true;
      if (liveRegionRef.current) {
        liveRegionRef.current.textContent = `Scene ${scene} of ${TOTAL}: ${DEMO_SCENES[scene - 1].title}`;
      }
      return;
    }
    const url = new URL(window.location.href);
    if (scene === SCENE_MIN) {
      url.searchParams.delete("scene");
    } else {
      url.searchParams.set("scene", String(scene));
    }
    window.history.replaceState({}, "", url.toString());

    if (liveRegionRef.current) {
      const current = DEMO_SCENES[scene - 1];
      liveRegionRef.current.textContent = `Scene ${scene} of ${TOTAL}: ${current.title}`;
    }
  }, [scene]);

  useEffect(() => {
    if (!auto) return;
    const id = window.setInterval(() => {
      setScene((s) => (s >= SCENE_MAX ? SCENE_MIN : s + 1));
    }, AUTO_ADVANCE_MS);
    return () => window.clearInterval(id);
  }, [auto]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      if (e.key === "ArrowRight") {
        e.preventDefault();
        setScene((s) => clamp(s + 1));
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        setScene((s) => clamp(s - 1));
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0]?.clientX ?? null;
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current == null) return;
    const endX = e.changedTouches[0]?.clientX ?? touchStartX.current;
    const delta = endX - touchStartX.current;
    if (Math.abs(delta) > SWIPE_THRESHOLD) {
      setScene((s) => clamp(s + (delta < 0 ? 1 : -1)));
    }
    touchStartX.current = null;
  };

  const current = DEMO_SCENES[scene - 1];
  const progressPct = (scene / TOTAL) * 100;

  return (
    <section
      className="py-20 md:py-28 border-t border-[var(--border-color)]"
      aria-labelledby="demo-heading"
      id="demo"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mb-10">
          <p className="font-mono text-xs uppercase tracking-widest text-[var(--color-mute-4)] mb-4">
            90-second walkthrough
          </p>
          <h2
            id="demo-heading"
            className="text-3xl sm:text-4xl font-bold text-[var(--text-primary)] mb-4"
          >
            From bug-filed to CI-locked, scene by scene.
          </h2>
          <p className="text-[var(--text-secondary)] leading-relaxed">
            Click through the 8 scenes — or use{" "}
            <Kbd>←</Kbd> <Kbd>→</Kbd>. Each step shows a real artifact of
            the loop, no marketing illustrations.
          </p>
        </div>

        <div className="rounded-[var(--radius-lg)] border border-[var(--border-color)] bg-[var(--bg-primary)]">
          {/* Progress bar */}
          <div className="h-1 bg-[var(--bg-tertiary)] overflow-hidden rounded-t-[var(--radius-lg)]">
            <div
              className="h-full bg-[var(--color-accent)] transition-all duration-300 ease-out"
              style={{ width: `${progressPct}%` }}
              role="progressbar"
              aria-valuenow={scene}
              aria-valuemin={SCENE_MIN}
              aria-valuemax={SCENE_MAX}
              aria-label={`Scene ${scene} of ${TOTAL}`}
            />
          </div>

          <div
            className="grid grid-cols-1 lg:grid-cols-[1fr,1.2fr] gap-8 p-6 md:p-10 min-h-[420px]"
            onTouchStart={onTouchStart}
            onTouchEnd={onTouchEnd}
          >
            {/* Narrator */}
            <div className="flex flex-col">
              <div className="flex items-center gap-2 mb-4">
                <span className="font-mono text-xs text-[var(--text-tertiary)]">
                  Scene
                </span>
                <span className="font-mono text-2xl font-bold text-[var(--color-accent)]">
                  {String(scene).padStart(2, "0")}
                </span>
                <span className="font-mono text-xs text-[var(--text-tertiary)]">
                  / {TOTAL}
                </span>
              </div>
              <h3 className="text-2xl md:text-3xl font-bold text-[var(--text-primary)] leading-tight mb-4">
                {current.title}
              </h3>
              <p className="text-[var(--text-secondary)] leading-relaxed">
                {current.narrator}
              </p>

              {/* Controls — bottom of narrator on desktop */}
              <div className="mt-auto pt-6 flex flex-wrap items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate(scene - 1)}
                  disabled={scene <= SCENE_MIN}
                  aria-label="Previous scene"
                >
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                    <path d="M10 4L6 8l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  Prev
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => navigate(scene + 1)}
                  disabled={scene >= SCENE_MAX}
                  aria-label="Next scene"
                >
                  Next
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                    <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </Button>
                <button
                  type="button"
                  onClick={() => setAuto((v) => !v)}
                  aria-pressed={auto}
                  className="ml-2 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] rounded-[var(--radius-md)] border border-[var(--border-color)] hover:border-[var(--color-mute-4)] transition-colors focus-visible:outline-2 focus-visible:outline-[var(--color-accent)] focus-visible:outline-offset-2"
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      auto ? "bg-[var(--color-accent)] animate-pulse" : "bg-[var(--color-mute-4)]"
                    }`}
                  />
                  {auto ? "Auto-advancing" : "Auto-advance off"}
                </button>
              </div>
            </div>

            {/* Visual */}
            <div
              key={scene}
              className="min-w-0 demo-fade-in"
              aria-live="polite"
            >
              {renderVisual(current.visualType)}
            </div>
          </div>

          {/* Scene dots */}
          <div className="px-6 md:px-10 py-5 border-t border-[var(--border-color)] flex items-center justify-between gap-4 flex-wrap">
            <div
              className="flex items-center gap-2 flex-wrap"
              role="tablist"
              aria-label="Demo scene navigation"
            >
              {DEMO_SCENES.map((s) => (
                <button
                  type="button"
                  key={s.id}
                  role="tab"
                  aria-selected={s.id === scene}
                  aria-label={`Scene ${s.id}: ${s.title}`}
                  onClick={() => navigate(s.id)}
                  className={[
                    "h-2 rounded-full transition-all duration-200 focus-visible:outline-2 focus-visible:outline-[var(--color-accent)] focus-visible:outline-offset-2",
                    s.id === scene
                      ? "bg-[var(--color-accent)] w-8"
                      : "bg-[var(--color-mute-3)] w-2 hover:bg-[var(--color-mute-4)]",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  data-testid={`scene-dot-${s.id}`}
                />
              ))}
            </div>
            <div className="hidden md:flex items-center gap-2 text-[10px] font-mono text-[var(--text-tertiary)]">
              <Kbd>←</Kbd>
              <Kbd>→</Kbd>
              <span>to navigate</span>
            </div>
          </div>
        </div>

        {/* Post-demo CTA */}
        {scene === SCENE_MAX && (
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="mailto:ryan@speechlab.ai?subject=complex-ui-tester%20demo"
              className="inline-flex items-center"
            >
              <Button variant="primary" size="lg">
                See it on your own bugs — get a demo
              </Button>
            </Link>
            <Link
              href="https://github.com/speechlabinc/complex-ui-tester/blob/main/ARCHITECTURE.md"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center px-6 py-3 text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors rounded-[var(--radius-md)] border border-[var(--border-color)] hover:border-[var(--color-mute-4)] focus-visible:outline-2 focus-visible:outline-[var(--color-accent)] focus-visible:outline-offset-2"
            >
              Read the full architecture →
            </Link>
          </div>
        )}

        {/* SR live region */}
        <div
          ref={liveRegionRef}
          aria-live="polite"
          aria-atomic="true"
          className="sr-only"
        />
      </div>

      <style>{`
        @keyframes demo-fade-in-kf {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .demo-fade-in { animation: demo-fade-in-kf 0.3s ease-out; }
        @media (prefers-reduced-motion: reduce) {
          .demo-fade-in { animation: none; }
        }
      `}</style>
    </section>
  );
}
