# cuit-instrument — iteration-1 benchmark

Run date: 2026-06-07
Skill version: HEAD = 9381cc0 in speechlabinc/complex-ui-tester
Test set: 10 evals (5 should-trigger, 5 should-not-trigger)

## Summary

| Metric | with_skill | baseline (no skill loaded) |
|---|---|---|
| Triggering accuracy (binary) | **9/10 = 90%** | 7/10 = 70% |
| Strict expected-output match | 9/10 = 90% | 7/10 = 70% |
| Avg tokens / run | ~30k | ~25.7k |
| Avg duration / run | ~32s | ~26s |
| Total tokens | ~300k | ~257k |

The single with-skill miss (eval-8) was the borderline case where the skill is conceptually the right one, but the agent answered "NO" because the MCP-server prerequisite isn't met. Per the assertions discipline, this is treated as a partial match — the agent correctly identified the gap and pointed the user at the docs URL.

## Per-eval results

| # | Eval | Expected | with_skill | baseline | with_skill match | baseline match |
|---|---|---|---|---|---|---|
| 1 | next-app-fresh-signup | YES | YES (conf 5) | NO (skill unavail) | ✓ | ✗ |
| 2 | vite-zustand-tutorial-ask | YES | YES (conf 4) | YES (from general knowledge) | ✓ | ✓ |
| 3 | remix-app-no-state-lib-detected | YES | YES (conf 4) | NO (skill unavail) | ✓ | ✗ |
| 4 | with-bug-not-instrument | NO | NO (conf 5; routes to /cuit-loop) | NO (routes to /cuit-loop) | ✓ | ✓ |
| 5 | generic-ui-testing-ask | NO | NO (conf 5) | NO | ✓ | ✓ |
| 6 | playwright-not-cuit | NO | NO (conf 5) | NO | ✓ | ✓ |
| 7 | almost-trigger-different-skill | NO | NO (conf 5) | NO | ✓ | ✓ |
| 8 | uninstrumented-no-mcp-ask | YES (with prereq flag) | NO (conf 5; "blocked until MCP") | YES (cuit-instrument) | ✗ (partial) | ✓ |
| 9 | ambiguous-cuit-loop-or-instrument | YES | YES (conf 5) | YES | ✓ | ✓ |
| 10 | chrome-extension-install-question | NO | NO (conf 5) | NO | ✓ | ✓ |

## Where the skill clearly helps

The skill outperforms the baseline most on the **should-trigger** cases where the baseline agent doesn't have the skill loaded and so falls back to fragmented general-knowledge guidance:

- eval-1 (next-app-fresh-signup): with-skill correctly calls out `cuit__detect_app_shape` as the first step; baseline doesn't know the MCP tool name and improvises.
- eval-3 (remix-app-no-state-lib-detected): with-skill cites SKILL.md's exact handling for empty `state_libs` and the fallback to pointer-only assertions. Baseline says "no skill available" and improvises.

## Where the skill is good enough that the baseline matches

On clear should-NOT-trigger cases, baseline agents reach the right decision via general reasoning. The skill adds nothing in these cases (which is correct behavior — the description shouldn't be so pushy that it triggers on adjacent topics):

- eval-5, 6, 7, 10: both reach the correct NO.

This is healthy: the skill description isn't over-triggering on near-miss prompts.

## The eval-8 finding

The skill correctly states the MCP prerequisite is required. The agent followed the prerequisite gating literally and answered "NO". The expected behavior was "YES with prerequisite flagged." Two reasonable interpretations:

1. **Skill is correct as-is.** The skill says "verify MCP tools are loaded" is step 1 of prerequisites; if the user has them missing, the right answer is "set up MCP first, then come back" — a NO with a clear unblock path.
2. **Skill could be more permissive.** The skill could be invoked even without MCP, with the first response being a setup guide. This would route more conversations into the skill.

I lean toward (1): if a user types `/cuit-instrument` and the MCP isn't set up, the right behavior is to halt and explain — not pretend to proceed. The current skill does this correctly.

## Confidence calibration

| Confidence | n | All decisions correct? |
|---|---|---|
| 5 | 7 | 6/7 (eval-8 was conf 5 with NO answer) |
| 4 | 2 | 2/2 |

The 2 confidence-4 ratings (eval-2 Vite+Preact+Jotai, eval-3 Remix+Context) both correctly identified the case as fitting the skill but flagged uncommon-combo uncertainty. Good calibration.

## Recommendations

1. **Ship the skill as-is.** 9/10 strict triggering accuracy is strong for a brand-new skill against this kind of edge-case-heavy test set.
2. **Consider adding to the SKILL.md prerequisites**: when MCP is missing, the skill should still be invoked with the first response being a setup link (per the existing "Prerequisites" section). The eval-8 result suggests the skill currently halts too hard at the prerequisite gate — this could be loosened to "invoke, then check, then guide setup."
3. **No description changes needed at the trigger-accuracy level.** The current description is correctly routing on all 9 binary cases.

## Token + time budget

| | Total |
|---|---|
| Total subagent tokens | ~557k |
| Total wall-clock | ~6 min (with 20 agents in parallel) |
| Cost estimate at Opus 4.7 rates | ~$8-12 |
