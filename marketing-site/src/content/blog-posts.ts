/**
 * Blog post content for the CUIT marketing site.
 *
 * Posts are authored as plain Markdown strings in `bodyMarkdown` and rendered
 * by a lightweight in-repo renderer (see `app/blog/[slug]/page.tsx`). We do NOT
 * use MDX tooling — the repo intentionally keeps content as typed objects in
 * `src/content/*`, matching the docs/examples pattern.
 */

export interface BlogSource {
  /** Human-readable label for the citation. */
  label: string;
  /** Absolute URL. */
  href: string;
}

export interface BlogPost {
  /** URL segment — `/blog/<slug>`. */
  slug: string;
  /** Post title (also used as the JSON-LD headline). */
  title: string;
  /** ISO date (YYYY-MM-DD) the post was published. */
  date: string;
  /** <=160-char meta description for SEO + OpenGraph. */
  metaDescription: string;
  /** The single keyword phrase this post targets. */
  primaryKeyword: string;
  /** Post body as Markdown (headings, paragraphs, lists, code, links). */
  bodyMarkdown: string;
  /** External references cited in the post. */
  sources: BlogSource[];
}

export const BLOG_POSTS: BlogPost[] = [
  {
    slug: "claude-code-ui-testing-verification-gap",
    title: "Claude Code UI Testing: Closing the Verification Gap",
    date: "2026-05-06",
    metaDescription:
      "Claude Code can write the UI, but it cannot see whether the UI works. The verification gap is why agentic frontend changes regress — and how CUIT closes the loop.",
    primaryKeyword: "claude code ui testing",
    bodyMarkdown: `When you ask Claude Code to change a button, a form, or a drag-and-drop interaction, it does something remarkable: it edits the right files, wires the handlers, and updates the types. Then it tells you it is done. And it has no idea whether the thing it built actually works.

This is the **verification gap**, and it is the single biggest reason agentic frontend changes feel unreliable. The model is excellent at *producing* a diff and nearly blind to the *effect* of that diff in a running browser.

## Why Claude Code UI testing is harder than backend testing

For backend code, the loop is already closed. The agent writes a function, runs the unit test, reads the failure, and iterates. The feedback is text, the runner is deterministic, and the result lands back in the context window in seconds.

UI is different in three ways:

- **The output is visual and stateful.** "The modal opens, the focus traps, the overlay dims" is not something a type checker or a Jest assertion captures.
- **The failure modes are interaction-shaped.** A drag that snaps to the wrong segment, a debounce that fires twice, a hydration mismatch that only appears after the second click — none of these show up in the source.
- **There is no native runner in the loop.** Claude Code has no eyes on the DOM unless you give it some.

So the agent falls back on the only signal it has: the diff looks plausible, therefore the task is complete. That is reasoning by inspection, not by verification.

## What "closing the loop" actually means

A closed loop has four phases, and the agent must traverse all four without a human in the middle:

1. **Act** — make the change.
2. **Observe** — run the UI and capture what happened (DOM state, console errors, network, the actual interaction trace).
3. **Judge** — compare observed behavior against the intended outcome.
4. **Iterate** — if the judgment is "not yet," go back to step one with the new evidence in context.

Most "AI testing" tooling stops at step one and hand-waves step two. The agent generates a Playwright spec, the spec is never run inside the same conversation, and the green checkmark you imagine never actually executes. The loop stays open.

## How CUIT closes it

CUIT (complex-ui-tester) gives Claude Code the missing **observe** and **judge** phases as native MCP tools:

\`\`\`bash
# Inside a Claude Code conversation, after a UI change:
/cuit-loop session.json
\`\`\`

The recorder captures a real interaction session — clicks, drags, form input, plus console logs and network requests. \`@cuit/spec-gen\` turns that session into a Playwright spec grounded in the recorded events. CUIT then *runs* the spec against your app and feeds the result — pass, fail, the failing assertion, the console error — back into the conversation.

Now the agent has evidence. If the drag snapped to the wrong segment, the agent sees the assertion failure and the DOM state, not a vibe. It iterates against reality.

> The loop is the product. Models will churn; the durable layer is the feedback mechanism that lets any model see whether its UI change worked.

## The pragmatic takeaway

You do not need Claude Code to be clairvoyant. You need to stop asking it to verify UI by reading source. Give it a runner, give it the recorded session, and let it judge against the executed result. That is the difference between "the diff looks right" and "the regression gate is green."

If your agent is shipping frontend changes today with no executed UI check in the loop, the verification gap is already costing you regressions — you just are not seeing them until a user does.`,
    sources: [
      {
        label: "Anthropic — Claude Code overview",
        href: "https://docs.anthropic.com/en/docs/claude-code/overview",
      },
      {
        label: "Model Context Protocol — specification",
        href: "https://modelcontextprotocol.io/",
      },
      {
        label: "Playwright — test runner documentation",
        href: "https://playwright.dev/docs/intro",
      },
    ],
  },
  {
    slug: "flaky-playwright-ai-tests-self-healing-false-green",
    title: "Flaky Playwright AI Tests: When Self-Healing Lies",
    date: "2026-05-13",
    metaDescription:
      "Self-healing AI selectors hide flaky Playwright tests behind false-green runs. Here is why auto-repair erodes trust and how to keep your UI gate honest.",
    primaryKeyword: "flaky playwright ai tests",
    bodyMarkdown: `Self-healing is the most seductive feature in AI-assisted UI testing. A selector breaks, the tool quietly finds a "similar" element, the test goes green, and nobody gets paged. It feels like magic. It is often a lie.

## The appeal — and the trap

The pitch is reasonable: UIs change, brittle selectors break, and re-authoring specs is tedious. So when \`#submit-btn\` disappears, an AI layer locates a button that looks like the old one and retargets the assertion. The run stays green.

The trap is that **a green test is supposed to be a claim about behavior**, and self-healing turns it into a claim about resemblance. Those are not the same thing. The moment your gate passes by finding *a* button instead of *the* button, it has stopped protecting you.

## Three ways self-healing produces a false green

- **It heals over a real regression.** The "Save" button was removed in a refactor. Self-healing latches onto the "Cancel" button because it is visually adjacent and labeled similarly. The test passes. The save flow is broken in production.
- **It masks a flaky test instead of fixing it.** A race condition makes an element appear 1 in 5 runs. Self-healing retries against a fallback selector and reports success, so the underlying timing bug is never surfaced or fixed.
- **It launders non-determinism.** Each "heal" is a silent decision the agent made on your behalf. Over a few weeks, the spec no longer asserts what you think it asserts, and no diff ever recorded the drift.

## Flaky is not the same as broken — and self-healing conflates them

A flaky Playwright test fails intermittently for reasons unrelated to a real defect: an unawaited animation, a network stub that resolves out of order, a hydration boundary. The correct response is to *diagnose and stabilize* — add the right wait, fix the race, pin the clock.

Self-healing does the opposite. It treats every failure, flaky or genuine, as a selector problem to route around. That is how a flaky test and a broken feature end up indistinguishable in your CI history: both show green.

> A test that cannot fail for a real defect is not a test. It is a decoration.

## Keep the gate honest: observe, do not paper over

The fix is not to ban automation — it is to make the runner's evidence visible and to let a defect actually fail.

1. **Ground specs in recorded reality.** Generate the spec from an actual session (the events that really happened) rather than from a guess about the DOM. The assertion targets what the user did, not what an element resembles.
2. **Surface every repair as a reviewable change.** If a selector must change, it should show up as a diff a human (or the coding agent) approves — never as a silent runtime substitution.
3. **Let red mean red.** When the behavior genuinely changed, the test should fail loudly, carrying the failing assertion and the console output back into the loop so the agent can decide whether it is a regression or an intended change.

This is the line CUIT draws. \`@cuit/spec-gen\` builds the spec from the recorded session, CUIT runs it for real, and a failure is reported as a failure — with the evidence attached — not quietly healed into a green you cannot trust.

## The bottom line

If your flaky Playwright AI tests are passing because something healed them, you have traded a loud, fixable problem for a silent, expensive one. The whole value of a UI gate is that it tells the truth when behavior breaks. Self-healing that hides the break is worse than no test at all, because it costs you the one thing a test exists to provide: trust.`,
    sources: [
      {
        label: "Playwright — auto-waiting and locators",
        href: "https://playwright.dev/docs/actionability",
      },
      {
        label: "Martin Fowler — Eradicating Non-Determinism in Tests",
        href: "https://martinfowler.com/articles/nonDeterminism.html",
      },
      {
        label: "Google Testing Blog — Flaky Tests at Google",
        href: "https://testing.googleblog.com/2016/05/flaky-tests-at-google-and-how-we.html",
      },
    ],
  },
  {
    slug: "closed-loop-ui-verification-agents-deterministic",
    title: "Closed-Loop UI Verification for AI Coding Agents",
    date: "2026-05-20",
    metaDescription:
      "Closed-loop UI verification gives AI coding agents a deterministic act-observe-judge-iterate cycle so frontend changes are proven, not assumed, before merge.",
    primaryKeyword: "closed-loop ui verification",
    bodyMarkdown: `An AI coding agent that cannot observe the effect of its own change is running open-loop: it acts and hopes. Closed-loop UI verification replaces hope with evidence by giving the agent a deterministic cycle — **act, observe, judge, iterate** — that runs entirely inside the coding conversation.

## Open-loop vs. closed-loop, concretely

In an open-loop workflow, the agent edits a component, declares success, and moves on. The only verification is the agent re-reading its own diff. Any regression is discovered later — by a teammate, by CI that was never wired for UI, or by a user.

In a closed loop, every UI change is followed by an *executed* check whose result re-enters the agent's context:

1. **Act** — the agent makes the change.
2. **Observe** — a runner drives the real UI and records DOM state, console errors, network activity, and the interaction trace.
3. **Judge** — the observed behavior is compared against the intended outcome, deterministically.
4. **Iterate** — a failing judgment carries the failing assertion back into context; the agent fixes and re-runs.

The defining property is that **the loop closes without a human in the middle**. The agent does not ask you "does this look right?" — it runs the check and reads the answer.

## Why determinism is the whole game

Agents are probabilistic; verification must not be. If the same change can yield green on one run and red on the next for no real reason, the agent learns nothing — it cannot tell its own bug from the harness's noise.

Determinism comes from three disciplines:

- **Specs grounded in recorded sessions.** The spec asserts the interaction that actually happened, not a model's freehand guess at selectors. Same input, same assertions, every run.
- **No silent self-healing.** A real behavior change must fail. (See our companion post on how auto-repair manufactures false greens.)
- **Captured side-channels in the verdict.** A console error or an unhandled rejection is part of the judgment, not a thing the agent has to remember to check separately.

When the runner is deterministic, a red result is *information the agent can act on*, and a green result is a *claim you can trust at merge*.

## What this looks like with CUIT

CUIT implements the observe-and-judge phases as MCP tools so any agent — Claude Code, Codex — can close the loop in-conversation:

\`\`\`bash
# Record a real session, then:
/cuit-loop session.json
\`\`\`

The recorder captures the session. \`@cuit/spec-gen\` compiles it into a Playwright spec grounded in those events. CUIT runs the spec, auto-detects whether you are locking in a baseline or reproducing a bug, and commits a **green regression gate** — or reports the failure with the assertion and console output attached.

> The durable layer in agentic coding is not the model; it is the feedback loop. Close the UI loop and the agent's frontend changes become provable instead of plausible.

## Adopting it without a rewrite

You do not need to re-platform to go closed-loop. The on-ramp is incremental:

- Instrument the app once (\`/cuit-instrument\`) so sessions can be recorded.
- For each meaningful UI change, record the interaction and run \`/cuit-loop\` in the same conversation.
- Wire the resulting spec into your existing CI as a PR gate, so the deterministic check guards the merge.

The result: an AI coding agent that proves its UI changes work before it claims they do. That is the difference between shipping on faith and shipping on evidence.`,
    sources: [
      {
        label: "Model Context Protocol — specification",
        href: "https://modelcontextprotocol.io/",
      },
      {
        label: "Anthropic — Building agents with Claude",
        href: "https://docs.anthropic.com/en/docs/build-with-claude/agents",
      },
      {
        label: "Playwright — Continuous Integration",
        href: "https://playwright.dev/docs/ci",
      },
    ],
  },
];

/** Posts sorted newest-first by publish date. */
export const BLOG_POSTS_BY_DATE: readonly BlogPost[] = [...BLOG_POSTS].sort(
  (a, b) => b.date.localeCompare(a.date),
);

/** Look up a single post by slug. Returns `undefined` if not found. */
export function getBlogPost(slug: string): BlogPost | undefined {
  return BLOG_POSTS.find((post) => post.slug === slug);
}

/** Format an ISO date string as a human-readable date (e.g. "May 6, 2026"). */
export function formatBlogDate(isoDate: string): string {
  // Parse as UTC to avoid off-by-one from local timezone.
  const [year, month, day] = isoDate.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day)).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
}
