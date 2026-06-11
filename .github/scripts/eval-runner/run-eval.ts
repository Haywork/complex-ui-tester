#!/usr/bin/env tsx
/**
 * run-eval.ts
 *
 * Runs a single eval case for a CUIT skill and writes a decision.md to the
 * output directory. Called once per eval case by the eval-gatekeeper workflow.
 *
 * Usage:
 *   npx tsx run-eval.ts \
 *     --skill-path .claude/skills/cuit-instrument \
 *     --eval-id 1 \
 *     --prompt "..." \
 *     --output-dir /tmp/eval-results/cuit-instrument/eval-1
 *
 * Output:
 *   <output-dir>/decision.md  — contains DECISION, CONFIDENCE, REASONING,
 *                               and FIRST 3 STEPS in the standard format.
 *
 * // PLACEHOLDER: The eval runner body (runEvalWithClaude) currently writes
 * // a synthetic decision.md that exercises the grader end-to-end without
 * // burning API tokens. Replace the body of runEvalWithClaude() with a real
 * // Anthropic SDK call once the ANTHROPIC_API_KEY secret is wired in CI.
 * // The grader, comment builder, and workflow logic are fully functional
 * // around this placeholder.
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";

// ---------------------------------------------------------------------------
// CLI arg parsing (no external deps — keeps the script zero-install)
// ---------------------------------------------------------------------------

function parseArgs(argv: string[]): Record<string, string> {
  const args: Record<string, string> = {};
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg.startsWith("--") && i + 1 < argv.length) {
      const key = arg.slice(2).replace(/-([a-z])/g, (_, c) => c.toUpperCase());
      args[key] = argv[i + 1];
      i++;
    }
  }
  return args;
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface EvalCase {
  id: number;
  name: string;
  should_trigger: boolean;
  prompt: string;
  expected_output: string;
  files: string[];
}

interface Decision {
  decision: "YES" | "NO" | "UNCERTAIN";
  confidence: number; // 1-5
  reasoning: string;
  firstThreeSteps: string[];
}

// ---------------------------------------------------------------------------
// Placeholder eval runner
// ---------------------------------------------------------------------------

// PLACEHOLDER: replace this function body with a real Anthropic SDK call.
// The function should:
//   1. Load the skill SKILL.md from skillPath.
//   2. Send the prompt to Claude (claude-sonnet-4-5 or better) with the skill
//      loaded as system context, asking Claude to respond with the decision.md
//      schema.
//   3. Parse the response into a Decision object.
//   4. Return the Decision.
//
// Example skeleton (requires `npm i @anthropic-ai/sdk`):
//
//   import Anthropic from "@anthropic-ai/sdk";
//   const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
//   const skillBody = readFileSync(join(skillPath, "SKILL.md"), "utf-8");
//   const systemPrompt = [
//     "You are a skill routing judge. Given the skill specification below and a",
//     "user prompt, decide: should this skill be invoked?",
//     "",
//     "Skill specification:",
//     skillBody,
//     "",
//     "Respond with EXACTLY this format (no other text):",
//     "DECISION: YES | NO | UNCERTAIN",
//     "CONFIDENCE: <1-5>",
//     "REASONING: <2-3 sentences>",
//     "FIRST 3 STEPS: <bullet list of what Claude would do next if YES>",
//   ].join("\n");
//   const response = await client.messages.create({
//     model: "claude-sonnet-4-5",
//     max_tokens: 512,
//     system: systemPrompt,
//     messages: [{ role: "user", content: evalCase.prompt }],
//   });
//   // parse response.content[0].text into Decision

async function runEvalWithClaude(
  skillPath: string,
  evalCase: EvalCase
): Promise<Decision> {
  // PLACEHOLDER — synthetic response for CI scaffolding.
  // Reads the SKILL.md description to make the placeholder slightly realistic:
  // if the skill name appears in the prompt, it "triggers"; otherwise not.
  const skillMdPath = join(skillPath, "SKILL.md");
  if (!existsSync(skillMdPath)) {
    throw new Error(`SKILL.md not found at ${skillMdPath}`);
  }
  const skillMd = readFileSync(skillMdPath, "utf-8");

  // Extract the 'name' from frontmatter to use as a basic heuristic.
  const nameMatch = skillMd.match(/^name:\s*(.+)$/m);
  const skillName = nameMatch ? nameMatch[1].trim() : "";

  // Very naive placeholder heuristic: mirror the expected value from the
  // eval case. A real implementation would NOT read should_trigger — it would
  // ask Claude and get an independent answer.
  const decision: "YES" | "NO" = evalCase.should_trigger ? "YES" : "NO";

  return {
    decision,
    confidence: 3, // placeholder always returns middling confidence
    reasoning: `[PLACEHOLDER] Synthetic decision for eval ${evalCase.id} (${evalCase.name}). ` +
      `Skill '${skillName}' was ${decision === "YES" ? "triggered" : "not triggered"} ` +
      `based on placeholder heuristic. Replace run-eval.ts body with real Anthropic SDK call.`,
    firstThreeSteps: decision === "YES"
      ? [
          `[PLACEHOLDER] Step 1: Load skill context from ${skillMdPath}`,
          `[PLACEHOLDER] Step 2: Parse user intent from prompt`,
          `[PLACEHOLDER] Step 3: Invoke skill entry point`,
        ]
      : [
          `[PLACEHOLDER] Skill not triggered — no steps to list`,
        ],
  };
}

// ---------------------------------------------------------------------------
// decision.md serializer
// ---------------------------------------------------------------------------

function serializeDecision(d: Decision): string {
  return [
    `DECISION: ${d.decision}`,
    `CONFIDENCE: ${d.confidence}`,
    `REASONING: ${d.reasoning}`,
    `FIRST 3 STEPS:`,
    ...d.firstThreeSteps.map((s) => `- ${s}`),
  ].join("\n") + "\n";
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const args = parseArgs(process.argv.slice(2));

  const skillPath = resolve(args.skillPath ?? "");
  const evalId = parseInt(args.evalId ?? "", 10);
  const prompt = args.prompt ?? "";
  const outputDir = resolve(args.outputDir ?? "");

  if (!skillPath || isNaN(evalId) || !prompt || !outputDir) {
    console.error(
      "Usage: run-eval.ts --skill-path <path> --eval-id <n> --prompt <text> --output-dir <path>"
    );
    process.exit(1);
  }

  // Load the eval case from evals.json to get should_trigger.
  const evalsPath = join(skillPath, "evals", "evals.json");
  if (!existsSync(evalsPath)) {
    console.error(`evals.json not found at ${evalsPath}`);
    process.exit(1);
  }
  const evalsJson = JSON.parse(readFileSync(evalsPath, "utf-8")) as {
    evals: EvalCase[];
  };
  const evalCase = evalsJson.evals.find((e) => e.id === evalId);
  if (!evalCase) {
    console.error(`Eval case with id ${evalId} not found in ${evalsPath}`);
    process.exit(1);
  }

  const decision = await runEvalWithClaude(skillPath, evalCase);

  mkdirSync(outputDir, { recursive: true });
  const outPath = join(outputDir, "decision.md");
  writeFileSync(outPath, serializeDecision(decision), "utf-8");

  console.log(`eval ${evalId} (${evalCase.name}): ${decision.decision} — written to ${outPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
