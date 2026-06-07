# Assertions for cuit-instrument iteration-1

## Universal assertions (applied to every with-skill run)

| # | Assertion | What it checks |
|---|---|---|
| A1 | output file exists at `{eval_dir}/with_skill/outputs/decision.md` | The agent actually wrote a file. Pure mechanics. |
| A2 | decision file contains one of `DECISION: YES`, `DECISION: NO`, `DECISION: UNCERTAIN` | Agent gave a binary answer (not waffling prose). |
| A3 | decision file contains `CONFIDENCE:` followed by a number 1-5 | Agent gave a calibrated confidence, not just "maybe." |
| A4 | decision file under 300 words | Agent stayed inside the prompt's length cap. |

## Per-eval assertions

| Eval | Expected | Custom assertion |
|---|---|---|
| 1 next-app-fresh-signup | YES | decision file contains "YES" AND mentions `cuit__detect_app_shape` |
| 2 vite-zustand-tutorial-ask | YES | decision file contains "YES" AND references prod-bundle gate (NODE_ENV / import.meta.env) |
| 3 remix-app-no-state-lib-detected | YES | decision file contains "YES" AND mentions either Context fallback or pointer-only assertions |
| 4 with-bug-not-instrument | NO | decision file contains "NO" AND mentions `/cuit-loop` as the correct alternative |
| 5 generic-ui-testing-ask | NO | decision file contains "NO" AND no mention of `cuit__` MCP tools |
| 6 playwright-not-cuit | NO | decision file contains "NO" AND no mention of `cuit__` MCP tools |
| 7 almost-trigger-different-skill | NO | decision file contains "NO" AND mentions debugging the existing spec (not wiring) |
| 8 uninstrumented-no-mcp-ask | YES (with-prereq-check) | decision file mentions the MCP prerequisite gap explicitly (either YES with caveat or NO with clear "fix MCP first") |
| 9 ambiguous-cuit-loop-or-instrument | YES | decision file contains "YES" AND distinguishes `/cuit-instrument` from `/cuit-loop` |
| 10 chrome-extension-install-question | NO | decision file contains "NO" AND mentions the Chrome Web Store / Chrome extension install topic, not app instrumentation |

## Aggregate metric

- **Triggering accuracy**: % of with-skill runs where the YES/NO decision matches the expected. Target: 9/10 or better.
- **Skill body quality**: % of with-skill runs where the FIRST 3 STEPS reference specific skill content (MCP tool name or step number). Target: 100% on should-trigger cases.

## Grading discipline

- For eval-8, accept either YES-with-prerequisite-flag or NO-because-prerequisite as correct, since the skill itself says the prerequisite check is step 0 — answering "NO until MCP is set up" is a reasonable read of the skill's gating logic.
- Confidence values don't gate pass/fail; they're calibration signal we'll look at qualitatively.
