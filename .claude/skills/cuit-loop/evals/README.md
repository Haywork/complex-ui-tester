# Evals for `/cuit-loop`

Mirrors the structure of `../cuit-instrument/evals/`.

- `evals.json` — 10 prompts (5 should-trigger covering session JSON
  in chat, attached file, explicit invocation, vendor adapter, Flow B
  baseline; 5 should-NOT-trigger including instrumentation, generic
  questions, bug reports without sessions)
- `assertions.md` — universal + per-eval assertion table
- `results/` — historical iteration snapshots

The runbook for executing these is in
`../cuit-instrument/evals/README.md` § "How to run the evals" — same
process applies.

## Not yet run at iteration-1

This eval set was authored 2026-06-07 alongside the cuit-instrument
evals but the parallel subagent run (estimated ~$10 / ~6 min) is
deferred. Queue for the next time we touch:

- `SKILL.md` description or body
- `@cuit/spec-gen` v0.2 (LLM pipeline)
- A new vendor adapter (today: `@cuit/adapter-jam`; queued:
  LogRocket, Sentry Replay, FullStory)
