import type { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Claude Code UI Testing — Closed-Loop Verification",
  description:
    "CUIT closes the UI feedback loop for Claude Code agents. Record a session, auto-generate a Playwright spec, lock it in CI. Stop fixing the same UI bug twice.",
  keywords: [
    "claude code ui testing",
    "closed loop verification for agents",
    "mcp server ui regression",
    "agentic ui test generation",
    "UI feedback loop",
    "Claude Code",
    "regression testing",
    "Playwright",
    "CUIT",
  ],
  openGraph: {
    title: "Claude Code UI Testing — Closed-Loop Verification | CUIT",
    description:
      "CUIT closes the UI feedback loop for Claude Code agents. Record a session, auto-generate a Playwright spec, lock it in CI. Stop fixing the same UI bug twice.",
  },
};
import { SiteShell } from "@/components/SiteShell";
import { Hero } from "@/components/Hero";
import { AgenticLoop } from "@/components/AgenticLoop";
import { TwoFlows } from "@/components/TwoFlows";
import { RecorderAlpha } from "@/components/RecorderAlpha";
import { Comparison } from "@/components/Comparison";
import { DataWarehouse } from "@/components/DataWarehouse";
import { ProblemSection } from "@/components/ProblemSection";
import { HowItWorks } from "@/components/HowItWorks";
import { DemoWalkthrough } from "@/components/DemoWalkthrough";
import { ForDevelopers } from "@/components/ForDevelopers";
import { EvidenceSection } from "@/components/EvidenceSection";
import { PricingTeaser } from "@/components/PricingTeaser";
import { FAQ } from "@/components/FAQ";
import { CTA } from "@/components/CTA";

const DEMO_SCENE_MIN = 1;
const DEMO_SCENE_MAX = 8;

function parseSceneParam(raw: string | string[] | undefined): number {
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (!value) return DEMO_SCENE_MIN;
  const parsed = parseInt(value, 10);
  if (Number.isNaN(parsed)) return DEMO_SCENE_MIN;
  if (parsed < DEMO_SCENE_MIN) return DEMO_SCENE_MIN;
  if (parsed > DEMO_SCENE_MAX) return DEMO_SCENE_MAX;
  return parsed;
}

function DemoFallback() {
  return (
    <section
      id="demo"
      aria-label="Demo loading"
      className="py-20 md:py-28 border-t border-[var(--border-color)]"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="h-[480px] rounded-[var(--radius-lg)] border border-[var(--border-color)] bg-[var(--bg-secondary)] animate-pulse" />
      </div>
    </section>
  );
}

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const initialScene = parseSceneParam(sp.scene);

  return (
    <SiteShell>
      <Hero />
      <AgenticLoop />
      <TwoFlows />
      <RecorderAlpha />
      <DataWarehouse />
      <Comparison />
      <ProblemSection />
      <HowItWorks />
      <Suspense fallback={<DemoFallback />}>
        <DemoWalkthrough initialScene={initialScene} />
      </Suspense>
      <ForDevelopers />
      <EvidenceSection />
      <PricingTeaser />
      <FAQ />
      <CTA />
    </SiteShell>
  );
}
