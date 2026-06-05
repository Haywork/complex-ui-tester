export interface DemoScene {
  id: number;
  title: string;
  narrator: string;
  visualType:
    | "waveform"
    | "jam-card"
    | "dashboard"
    | "pipeline"
    | "spec"
    | "terminal"
    | "pr-card"
    | "ci-card";
}

export const DEMO_SCENES: DemoScene[] = [
  {
    id: 1,
    title: "The bug appears.",
    narrator:
      "It's the kind of bug that takes 90 seconds to file and 5 hours to reproduce. A user dragged a waveform segment and it didn't move.",
    visualType: "waveform",
  },
  {
    id: 2,
    title: "The user files via Jam.",
    narrator:
      "30 seconds of user effort. A session URL lands in the triage channel.",
    visualType: "jam-card",
  },
  {
    id: 3,
    title: "Session arrives in the dashboard.",
    narrator:
      "Our connector pulls the session, normalizes it, and looks up the tenant's selector dictionary and bug-class corpus. The infrastructure remembers what your UI looks like — that's why the spec it generates is yours, not generic.",
    visualType: "dashboard",
  },
  {
    id: 4,
    title: "Three-pass LLM pipeline.",
    narrator:
      "Three model tiers, each doing the work it's cheapest at. Prompt caching keeps the per-spec cost under fifty cents — that's the unit economics that make this a business.",
    visualType: "pipeline",
  },
  {
    id: 5,
    title: "The generated spec.",
    narrator:
      "The model can't emit `page.mouse.click(x, y)`. It can only call into harness primitives that have been validated in production. AST validation enforces it. Hallucinations don't compile.",
    visualType: "spec",
  },
  {
    id: 6,
    title: "Dry run goes RED.",
    narrator:
      "RED means we caught the bug. Counterintuitively, this is the success state — the spec reproduces the failure deterministically, so a fix has something to fail against.",
    visualType: "terminal",
  },
  {
    id: 7,
    title: "The PR + the fix.",
    narrator:
      "Five minutes after the bug was filed, an engineer is reviewing a real spec, with a real session link, in their normal review flow. They ship the fix in the same PR.",
    visualType: "pr-card",
  },
  {
    id: 8,
    title: "Locked in forever.",
    narrator:
      "The spec is now a CI gate. If anyone reintroduces the bug six months from now, CI flags it before merge. That's how the 6-Reopened-bugs treadmill ends.",
    visualType: "ci-card",
  },
];
