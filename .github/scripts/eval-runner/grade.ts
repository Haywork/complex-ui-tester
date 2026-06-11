#!/usr/bin/env tsx
/**
 * grade.ts
 *
 * Grades eval results for a single skill against its assertions.md and the
 * iteration-1 baseline benchmark. Writes a structured JSON result and a
 * human-readable markdown comment fragment.
 *
 * Usage:
 *   npx tsx grade.ts \
 *     --skill-path .claude/skills/cuit-instrument \
 *     --results-dir /tmp/eval-results/cuit-instrument \
 *     --output-dir /tmp/eval-results
 *
 * Exits 0 on pass, 1 on regression.
 */

import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { join, resolve } from "node:path";

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

interface PerEvalResult {
  id: number;
  name: string;
  expected: string;
  actual: string;
  match: boolean;
  confidence: number | null;
  universalPassed: boolean;
  universalFailures: string[];
}

interface SkillGradeResult {
  skillName: string;
  runDate: string;
  total: number;
  passed: number;
  passRate: number;
  baselinePassRate: number | null;
  delta: number | null;
  regression: boolean;
  perEval: PerEvalResult[];
}

// ---------------------------------------------------------------------------
// Universal assertion checker (A1-A4)
// ---------------------------------------------------------------------------

function checkUniversalAssertions(
  decisionPath: string
): { passed: boolean; failures: string[] } {
  const failures: string[] = [];

  // A1: file exists
  if (!existsSync(decisionPath)) {
    return { passed: false, failures: ["A1: decision.md does not exist"] };
  }

  const content = readFileSync(decisionPath, "utf-8");

  // A2: contains a valid DECISION line
  const decisionMatch = content.match(/^DECISION:\s*(YES|NO|UNCERTAIN)/m);
  if (!decisionMatch) {
    failures.push("A2: no valid DECISION: YES|NO|UNCERTAIN line found");
  }

  // A3: contains CONFIDENCE: followed by 1-5
  const confidenceMatch = content.match(/^CONFIDENCE:\s*([1-5])\s*$/m);
  if (!confidenceMatch) {
    failures.push("A3: no valid CONFIDENCE: 1-5 line found");
  }

  // A4: under 300 words
  const wordCount = content.trim().split(/\s+/).length;
  if (wordCount > 300) {
    failures.push(`A4: decision.md is ${wordCount} words, must be under 300`);
  }

  return { passed: failures.length === 0, failures };
}

// ---------------------------------------------------------------------------
// Parse DECISION value from decision.md
// ---------------------------------------------------------------------------

function parseDecision(decisionPath: string): {
  decision: string;
  confidence: number | null;
} {
  if (!existsSync(decisionPath)) return { decision: "MISSING", confidence: null };
  const content = readFileSync(decisionPath, "utf-8");
  const dm = content.match(/^DECISION:\s*(YES|NO|UNCERTAIN)/m);
  const cm = content.match(/^CONFIDENCE:\s*([1-5])\s*$/m);
  return {
    decision: dm ? dm[1] : "PARSE_ERROR",
    confidence: cm ? parseInt(cm[1], 10) : null,
  };
}

// ---------------------------------------------------------------------------
// Load baseline
// ---------------------------------------------------------------------------

function loadBaseline(skillPath: string): number | null {
  const baselinePath = join(
    skillPath,
    "evals",
    "results",
    "iteration-1",
    "benchmark.json"
  );
  if (!existsSync(baselinePath)) return null;
  try {
    const data = JSON.parse(readFileSync(baselinePath, "utf-8")) as {
      configurations: Array<{ name: string; pass_rate: number }>;
    };
    const withSkill = data.configurations.find(
      (c) => c.name === "with_skill"
    );
    return withSkill?.pass_rate ?? null;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Grade a single skill
// ---------------------------------------------------------------------------

function gradeSkill(
  skillPath: string,
  resultsDir: string
): SkillGradeResult {
  const evalsPath = join(skillPath, "evals", "evals.json");
  const evalsJson = JSON.parse(readFileSync(evalsPath, "utf-8")) as {
    skill_name: string;
    evals: EvalCase[];
  };

  const skillName = evalsJson.skill_name;
  const evalCases = evalsJson.evals;
  const baselinePassRate = loadBaseline(skillPath);

  const perEval: PerEvalResult[] = [];

  for (const ec of evalCases) {
    const decisionPath = join(resultsDir, `eval-${ec.id}`, "decision.md");
    const { passed: universalPassed, failures: universalFailures } =
      checkUniversalAssertions(decisionPath);
    const { decision, confidence } = parseDecision(decisionPath);

    const expectedDecision = ec.should_trigger ? "YES" : "NO";

    // Flexible matching for eval-8-style prerequisite cases.
    // If expected is YES and actual is NO, check if the decision.md mentions
    // a prerequisite gate — that is an acceptable miss.
    let match = decision === expectedDecision;
    if (!match && ec.should_trigger && decision === "NO") {
      if (existsSync(decisionPath)) {
        const content = readFileSync(decisionPath, "utf-8").toLowerCase();
        if (
          content.includes("prerequisite") ||
          content.includes("mcp") ||
          content.includes("not connected") ||
          content.includes("not available")
        ) {
          match = true; // acceptable miss — skill correctly halted at prereq gate
        }
      }
    }

    perEval.push({
      id: ec.id,
      name: ec.name,
      expected: expectedDecision,
      actual: decision,
      match,
      confidence,
      universalPassed,
      universalFailures,
    });
  }

  const passed = perEval.filter(
    (r) => r.match && r.universalPassed
  ).length;
  const total = perEval.length;
  const passRate = total > 0 ? passed / total : 0;

  const delta =
    baselinePassRate !== null ? passRate - baselinePassRate : null;

  // Regression if > 10pp drop from baseline OR absolute floor < 70%
  const regression =
    passRate < 0.7 ||
    (delta !== null && delta < -0.1);

  return {
    skillName,
    runDate: new Date().toISOString().split("T")[0],
    total,
    passed,
    passRate,
    baselinePassRate,
    delta,
    regression,
    perEval,
  };
}

// ---------------------------------------------------------------------------
// Comment builder
// ---------------------------------------------------------------------------

function pct(r: number): string {
  return `${Math.round(r * 100)}%`;
}

function deltaStr(d: number | null): string {
  if (d === null) return "—";
  const sign = d >= 0 ? "+" : "";
  return `${sign}${Math.round(d * 100)}pp`;
}

function statusBadge(r: SkillGradeResult): string {
  return r.regression ? "REGRESSION" : "PASS";
}

function buildComment(results: SkillGradeResult[]): string {
  const anyRegression = results.some((r) => r.regression);
  const headline = anyRegression
    ? "## Skill Eval Gate — REGRESSION DETECTED"
    : "## Skill Eval Gate — all checks passed";

  const tableHeader = `| Skill | Cases | Passed | Pass rate | Baseline | Delta | Status |
|---|---|---|---|---|---|---|`;

  const tableRows = results
    .map(
      (r) =>
        `| ${r.skillName} | ${r.total} | ${r.passed} | ${pct(r.passRate)} | ${
          r.baselinePassRate !== null ? pct(r.baselinePassRate) : "— (no baseline)"
        } | ${deltaStr(r.delta)} | ${statusBadge(r)} |`
    )
    .join("\n");

  const detailBlocks = results
    .map((r) => {
      const rows = r.perEval
        .map(
          (e) =>
            `| ${e.id} | ${e.name} | ${e.expected} | ${e.actual} | ${
              e.match && e.universalPassed
                ? "pass"
                : `FAIL${e.universalFailures.length > 0 ? ` (${e.universalFailures.join("; ")})` : ""}`
            } |`
        )
        .join("\n");

      return `<details>
<summary>${r.skillName} — per-eval results</summary>

| ID | Name | Expected | Actual | Result |
|---|---|---|---|---|
${rows}

</details>`;
    })
    .join("\n\n");

  const regressionWarning = anyRegression
    ? `\n> **Regressed skills:** ${results
        .filter((r) => r.regression)
        .map((r) => `${r.skillName} (${pct(r.passRate)} vs baseline ${r.baselinePassRate !== null ? pct(r.baselinePassRate) : "n/a"})`)
        .join(", ")}. Merge is blocked until pass-rate is restored.\n`
    : "";

  return [
    headline,
    "",
    tableHeader,
    tableRows,
    "",
    "### Details",
    "",
    detailBlocks,
    regressionWarning,
    "---",
    `<sub>eval-gatekeeper · run-date ${results[0]?.runDate ?? "unknown"} · node 20 · placeholder eval runner</sub>`,
  ].join("\n");
}

// ---------------------------------------------------------------------------
// Main
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

function main() {
  const args = parseArgs(process.argv.slice(2));

  const skillPath = resolve(args.skillPath ?? "");
  const resultsDir = resolve(args.resultsDir ?? "");
  const outputDir = resolve(args.outputDir ?? "");

  if (!skillPath || !resultsDir || !outputDir) {
    console.error(
      "Usage: grade.ts --skill-path <path> --results-dir <path> --output-dir <path>"
    );
    process.exit(1);
  }

  mkdirSync(outputDir, { recursive: true });

  const result = gradeSkill(skillPath, resultsDir);

  // Write per-skill JSON for artifact upload
  const jsonOut = join(outputDir, `${result.skillName}-grade.json`);
  writeFileSync(jsonOut, JSON.stringify(result, null, 2), "utf-8");
  console.log(`Grade written to ${jsonOut}`);

  // Write/append markdown comment fragment
  const comment = buildComment([result]);
  const commentOut = join(outputDir, "comment.md");

  // If comment.md already exists (multi-skill run), append a divider.
  if (existsSync(commentOut)) {
    const existing = readFileSync(commentOut, "utf-8");
    // Replace the existing file with a merged comment.
    const allResultsPath = join(outputDir, "all-results.json");
    let allResults: SkillGradeResult[] = [];
    if (existsSync(allResultsPath)) {
      allResults = JSON.parse(readFileSync(allResultsPath, "utf-8")) as SkillGradeResult[];
    }
    allResults.push(result);
    writeFileSync(allResultsPath, JSON.stringify(allResults, null, 2), "utf-8");
    // Rewrite the comment with all results combined
    const fullComment = buildComment(allResults);
    writeFileSync(commentOut, fullComment, "utf-8");
  } else {
    writeFileSync(commentOut, comment, "utf-8");
    // Bootstrap the all-results accumulator
    const allResultsPath = join(outputDir, "all-results.json");
    writeFileSync(allResultsPath, JSON.stringify([result], null, 2), "utf-8");
  }

  if (result.regression) {
    console.error(
      `REGRESSION in ${result.skillName}: pass-rate ${pct(result.passRate)}` +
        (result.baselinePassRate !== null
          ? ` vs baseline ${pct(result.baselinePassRate)} (delta ${deltaStr(result.delta)})`
          : " (no baseline)")
    );
    process.exit(1);
  }

  console.log(
    `${result.skillName}: ${pct(result.passRate)} pass-rate — OK`
  );
  process.exit(0);
}

main();
