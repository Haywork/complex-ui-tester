# Evals for `/cuit-instrument`

The eval set that proves this skill triggers correctly. Lives with the
skill so any change to the skill body or description can be verified
against a known baseline.

## What's in here

- **`evals.json`** — 10 realistic test prompts (5 should-trigger,
  5 should-NOT-trigger). Includes near-miss prompts where another
  skill (`/cuit-loop`) is the correct route. **Edit this file** to
  add new test cases as customer conversations surface them.
- **`assertions.md`** — universal + per-eval assertions used for
  grading. Updated when we learn what "good" looks like.
- **`results/iteration-N/`** — historical benchmark snapshots
  (`benchmark.md` human-readable + `benchmark.json` machine-readable).
  Compare a new iteration's results against the last to detect
  regression.

## How to run the evals

The proper tooling lives in the `skill-creator` skill. If you have
the full install at `~/.claude/skills/skill-creator/scripts/`, the
canonical command is:

```bash
# Quick triggering test only (3 runs per prompt, 60/40 train/test):
python -m scripts.run_eval \
  --eval-set .claude/skills/cuit-instrument/evals/evals.json \
  --skill-path .claude/skills/cuit-instrument \
  --model claude-opus-4-7 \
  --verbose

# Full description-optimization loop (proposes alternative descriptions):
python -m scripts.run_loop \
  --eval-set .claude/skills/cuit-instrument/evals/evals.json \
  --skill-path .claude/skills/cuit-instrument \
  --model claude-opus-4-7 \
  --max-iterations 5 \
  --verbose
```

If you don't have those scripts (skill-creator on some machines is
SKILL.md-only), the manual flow is:

1. For each eval, spawn TWO Claude sessions:
   - one with the skill path passed in (`with_skill`)
   - one without it (`baseline`)
2. Have each session output `decision.md` with this shape:
   ```
   - DECISION: YES | NO | UNCERTAIN
   - CONFIDENCE: 1-5
   - REASONING: 2-3 sentences
   - FIRST 3 STEPS: bulleted
   ```
3. Save to `evals/results/iteration-N/eval-<id>-<name>/{with_skill,without_skill}/outputs/decision.md`.
4. Aggregate against `assertions.md`. Goal: ≥ 9/10 binary matches on
   `with_skill`.

Iteration-1 (2026-06-07) used 20 parallel subagents and produced
the baseline benchmark in `results/iteration-1/`. Use it as the
reference any future iteration measures against.

## When to re-run the evals

- **Always**: after any edit to `SKILL.md` description or body.
- **Always**: after adding a new MCP tool the skill references.
- **Often**: when you add a near-miss case from a real customer
  conversation (add the case to `evals.json`, then re-run).

## What "passing" means

- All 10 with-skill prompts should produce a clear YES or NO
  decision (no waffling).
- 9/10 should match the `expected` field. The 1 acceptable miss is
  any case where the skill correctly halts at a prerequisite gate
  (e.g., MCP not connected).
- with-skill should outperform baseline (no skill loaded) by
  ≥ 15 percentage points on triggering accuracy.

## Adding a new test case

1. Pick the next ID. Add to `evals.json` with these fields:
   - `id` (next number)
   - `name` (kebab-case description, e.g. `nextjs-with-rsc-only`)
   - `should_trigger` (true/false)
   - `prompt` (the exact thing a customer would say — typos and
     casual language welcome)
   - `expected_output` (what good behavior looks like)
   - `files` (optional; attached file paths)
2. Add a matching row to `assertions.md` under "Per-eval assertions".
3. Re-run the evals.
4. Commit the new test case + updated benchmark.

## See also

- `../SKILL.md` — the skill itself
- `../../cuit-loop/evals/` — the parallel set for `/cuit-loop`
- `~/.claude/skills/skill-creator/SKILL.md` — the eval framework
  this follows
