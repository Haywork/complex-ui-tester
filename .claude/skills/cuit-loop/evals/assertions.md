# Assertions for `/cuit-loop` evals

## Universal assertions (every with-skill run)

| # | Assertion |
|---|---|
| A1 | output file exists at `{eval_dir}/with_skill/outputs/decision.md` |
| A2 | contains a clear `DECISION: YES | NO | UNCERTAIN` line |
| A3 | contains `CONFIDENCE: 1-5` |
| A4 | under 300 words |

## Per-eval assertions

| Eval | Expected | Custom |
|---|---|---|
| 1 pasted-session-json | YES | mentions @cuit/spec-gen OR auto-flow-detection |
| 2 attached-session-file | YES | reads the attached file before running |
| 3 explicit-cuit-loop-mention | YES | runs against the named fixture path |
| 4 vendor-adapter-session | YES | mentions Jam adapter or vendor normalization |
| 5 baseline-lock-in-flow-b | YES | mentions Flow B / baseline / lock-in language |
| 6 instrument-not-loop | NO | routes to `/cuit-instrument` explicitly |
| 7 generic-spec-question | NO | answers Playwright Q without invoking any CUIT skill |
| 8 no-session-just-bug-report | NO | asks user to record session first OR routes to /cuit-instrument |
| 9 ambiguous-spec-from-bug | NO | recognizes no session present; suggests recorder + /cuit-loop OR writes spec by hand |
| 10 session-without-loop-intent | YES | recognizes the JSON file is a session and routes to the loop |

## Target

- ≥ 9/10 with-skill correct
- ≥ +15pp vs baseline (no skill loaded)

## When to re-run

After any edit to:
- `SKILL.md` description or body
- `@cuit/spec-gen` interface
- `@cuit/runner` orchestration
- The vendor adapter list

## Status

Not yet run. The cuit-instrument iteration-1 run (2026-06-07) burned ~$10 / 6 min wall clock on 20 parallel subagents; this set is queued for next time we touch the cuit-loop SKILL.md or add a vendor adapter.
