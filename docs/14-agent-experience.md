# 14 — Agent Experience (AX): how the loop is designed for the model

last-reviewed 2026-06-09 · ryan@speechlab.ai

CUIT's feedback loop is consumed by models — Claude Code running
Fable, Cursor, Codex, autonomous cloud workflows — more often than by
humans. So we design the loop for the model's constraints the way DX
is designed for human ones. We call it AX, and we hold every MCP
tool, skill, and endpoint to the contract below.

Parts of this document were drafted by the model itself, against its
own constraints. Cheapest user research we'll ever do.

## 1. The model is a user with constraints

| Constraint | What it means for tool design |
|---|---|
| Context is scarce | Every token a tool response spends is a token unavailable for reasoning |
| State dies at compaction | Durable state lives server-side, re-fetchable by ID in one cheap call |
| Tool choice is made from descriptions alone | Descriptions are prompt engineering, eval-tested for trigger accuracy |
| Structured beats prose | `{outcome:"red", failed_at_primitive:{...}}` parses instantly; log dumps don't |
| The model can't manage wall-time | The platform owns latency budgets; the loop stays inside the conversation's attention span |

## 2. The AX contract

Every CUIT tool response follows the same envelope:

```jsonc
{
  "outcome": "red",
  "summary": "Spec failed at step 4 (dispatchDrag seg-0): expected segments[0].x=100, got 25.",
  "next_actions": [
    "inspect failed_at_primitive and last_snapshot below",
    "call cuit__find_similar_sessions to check if this is a known pattern",
    "propose a fix, then re-run with cuit__run_spec (retry-safe)"
  ],
  "details_ref": "run:60d8c49d",
  "data": { /* compact payload — full detail via drill-down tools */ }
}
```

Seven rules behind it:

1. **Outcome-first.** `outcome` + `summary` answer "what happened" in
   under 50 tokens. Drill-down is the model's choice, not the default.
2. **Token-budgeted.** Default payloads stay under ~2KB. Lists return
   IDs + one-liners; full objects live behind `get`-by-ID tools.
3. **Errors are instructions.** Every error carries `why`, `fix_hint`,
   and `retry_safe` — the model never guesses whether retrying is safe.
4. **Deterministic + idempotent.** Same call, same result. Destructive
   operations require a confirmation token from a separate call.
5. **Resumable by ID.** Sessions, specs, runs, instrumentations all
   re-fetchable in one call. The loop survives context compaction.
6. **One-shot composition.** Interactive agents iterate step-by-step;
   autonomous workflows call `cuit__close_loop` once and get the full
   generate → run → report cycle in a single envelope.
7. **The loop measures itself.** Every closed loop emits a trace —
   turns-to-green, tool calls, tokens spent. We publish the medians.
   If a release makes the loop fatter or slower for the model, the
   telemetry catches it before customers do.

## 3. Why this is the moat, restated

Per [docs/13](./13-claude-code-workflows.md): the feedback loop is the
model-invariant layer. AX is what makes OUR loop the one agents close
fastest. Two numbers tell the story, and we optimize them above
feature count:

- **Median turns-to-green** — how many conversation turns from
  "here's a session" to a passing regression gate.
- **Median tokens-per-closed-loop** — what the loop costs the model's
  context end-to-end.

Every competitor can copy a feature. Copying a loop that's been
telemetry-tuned for the model's constraints requires re-architecting
their response surface — and they'd be starting the telemetry corpus
from zero.

## 4. Status

The contract is binding for new surfaces now; existing tools are
being retrofitted (envelope, payload caps, drill-down tools,
`cuit__close_loop`, loop telemetry). Track progress in the repo
changelog.

## 5. Sources

[1] docs/13-claude-code-workflows.md — the agentic-native surface this contract governs
[2] Lance Martin's outcome-and-loops framing; Anthropic's Fable launch positioning
[3] Internal ADR-011 (Agent Experience), where the engineering rules are codified
