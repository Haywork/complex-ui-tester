#!/usr/bin/env node
/**
 * release-captain/run.mjs
 *
 * Implements the release-captain procedure described in
 * .claude/agents/release-captain/AGENT.md without requiring an LLM.
 *
 * Steps:
 *   1. Collect conventional commits since the last release tag.
 *   2. Determine the next semver version.
 *   3. Audit the maturity ladder.
 *   4. Write the changelog entry.
 *   5. Open a release PR via `gh pr create`.
 *
 * Required env vars (all supplied by the workflow):
 *   GITHUB_TOKEN       — for gh CLI auth
 *   PREV_RELEASE_TAG   — previous v* tag, or ""
 *   GITHUB_SHA         — current commit
 *   GITHUB_REF_NAME    — branch (expected: main)
 *   GITHUB_REPOSITORY  — owner/repo
 */

import { execSync, spawnSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import semver from "semver";

/* ─── helpers ────────────────────────────────────────────────────────────── */

const ROOT = resolve(new URL(".", import.meta.url).pathname, "../..");

function run(cmd, opts = {}) {
  return execSync(cmd, { cwd: ROOT, encoding: "utf-8", ...opts }).trim();
}

function fileExistsAndNonEmpty(rel) {
  const abs = join(ROOT, rel);
  if (!existsSync(abs)) return false;
  return readFileSync(abs, "utf-8").trim().length > 0;
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

/* ─── Step 1: collect commits ────────────────────────────────────────────── */

const PREV_TAG = process.env.PREV_RELEASE_TAG || "";
const RANGE = PREV_TAG ? `${PREV_TAG}..HEAD` : "HEAD";
const CONVENTIONAL_PREFIX = /^(feat|fix|docs|chore|refactor|test|perf|build|ci|revert)(\(.+\))?!?:/;

const rawLog = run(`git log ${RANGE} --format="%H %s" --no-merges`);
const allLines = rawLog ? rawLog.split("\n").filter(Boolean) : [];

const commits = allLines
  .map((line) => {
    const [sha, ...rest] = line.split(" ");
    const subject = rest.join(" ").trim();
    const match = subject.match(CONVENTIONAL_PREFIX);
    if (!match) return null;
    const type = match[1];
    const breaking = subject.includes("BREAKING CHANGE:") || match[0].includes("!");
    return { sha: sha.slice(0, 7), subject, type, breaking };
  })
  .filter(Boolean);

console.log(`[release-captain] Range: ${RANGE}`);
console.log(`[release-captain] Total commits in range: ${allLines.length}`);
console.log(`[release-captain] Conventional commits: ${commits.length}`);

/* ─── Step 2: determine next version ─────────────────────────────────────── */

const packageFiles = [
  "proof-of-concept/packages/harness/package.json",
  "proof-of-concept/packages/spec-gen/package.json",
  "proof-of-concept/packages/mcp-local/package.json",
  "proof-of-concept/packages/recorder/package.json",
  "proof-of-concept/packages/runner/package.json",
  "proof-of-concept/packages/types/package.json",
  "proof-of-concept/packages/adapter-jam/package.json",
  "proof-of-concept/packages/adapter-cuit/package.json",
  "proof-of-concept/packages/recorder-extension/package.json",
];

let currentVersion = "0.0.0";
for (const rel of packageFiles) {
  const abs = join(ROOT, rel);
  if (!existsSync(abs)) continue;
  const pkg = JSON.parse(readFileSync(abs, "utf-8"));
  if (pkg.version && semver.gt(pkg.version, currentVersion)) {
    currentVersion = pkg.version;
  }
}

const hasFeature = commits.some((c) => c.type === "feat");
const hasBreaking = commits.some((c) => c.breaking);
const noReleasable = commits.length === 0;

let nextVersion = currentVersion;
if (!noReleasable) {
  if (hasBreaking || hasFeature) {
    // Stay in 0.x range — bump minor.
    nextVersion = semver.inc(currentVersion, "minor");
  } else {
    nextVersion = semver.inc(currentVersion, "patch");
  }
}

console.log(`[release-captain] Current version: ${currentVersion}`);
console.log(`[release-captain] Next version: ${nextVersion}`);

/* ─── Step 3: maturity ladder audit ─────────────────────────────────────── */

const EVIDENCE_CHECKS = [
  {
    label: "Deterministic harness",
    tier: "shipping-now",
    file: "proof-of-concept/packages/harness/src/index.ts",
  },
  {
    label: "Generalized spec-gen",
    tier: "shipping-now",
    file: "proof-of-concept/packages/spec-gen/src/index.ts",
  },
  {
    label: "Real spec execution via primitive-exec",
    tier: "shipping-now",
    file: "proof-of-concept/packages/runner/src/index.ts",
  },
  {
    label: "Recorder with console + error capture",
    tier: "shipping-now",
    file: "proof-of-concept/packages/recorder/src/index.ts",
  },
  {
    label: "Local MCP shim",
    tier: "shipping-now",
    file: "proof-of-concept/packages/mcp-local/src/index.ts",
  },
  {
    label: "2 adapters: Jam + CUIT",
    tier: "shipping-now",
    // Both must exist
    files: [
      "proof-of-concept/packages/adapter-jam/src/index.ts",
      "proof-of-concept/packages/adapter-cuit/src/index.ts",
    ],
  },
  {
    label: "/cuit-loop + /cuit-instrument Claude Code skills",
    tier: "shipping-now",
    files: [
      ".claude/skills/cuit-loop/SKILL.md",
      ".claude/skills/cuit-instrument/SKILL.md",
    ],
  },
  {
    label: "AX envelopes + step-back debug primitives",
    tier: "shipping-now",
    file: "proof-of-concept/packages/runner/src/ax-debug.ts",
  },
];

const findings = [];

for (const check of EVIDENCE_CHECKS) {
  const files = check.files ?? [check.file];
  const allPresent = files.every(fileExistsAndNonEmpty);
  if (!allPresent) {
    const missing = files.filter((f) => !fileExistsAndNonEmpty(f));
    findings.push(
      `[marketing-ahead-of-code] "${check.label}" is listed under ` +
        `"${check.tier}" but evidence is missing.\n` +
        `  Missing: ${missing.join(", ")}\n` +
        `  Recommendation: move to "In Progress" or "Not Yet", ` +
        `or add the implementation.`
    );
  }
}

// Cross-check: parse MaturityLadder.tsx TIERS labels
const maturityPath = join(
  ROOT,
  "marketing-site/src/components/MaturityLadder.tsx"
);
let maturityRaw = "";
if (existsSync(maturityPath)) {
  maturityRaw = readFileSync(maturityPath, "utf-8");
}

// Sanity-check that TIERS is present in the component
if (maturityRaw && !maturityRaw.includes("const TIERS")) {
  findings.push(
    `[parse-error] Could not find "const TIERS" in MaturityLadder.tsx. ` +
      `Manual audit required.`
  );
}

const auditSummary =
  findings.length === 0
    ? "Maturity ladder audit: no discrepancies found."
    : `Maturity ladder audit: ${findings.length} finding(s).\n\n` +
      findings.map((f, i) => `Finding ${i + 1}: ${f}`).join("\n\n");

console.log(`[release-captain] ${auditSummary.split("\n")[0]}`);

/* ─── Step 4: write changelog ────────────────────────────────────────────── */

const SECTION_MAP = {
  feat: "### Features",
  fix: "### Bug Fixes",
  refactor: "### Refactors",
  docs: "### Docs",
  ci: "### Infra / CI",
  build: "### Infra / CI",
  chore: "### Infra / CI",
  test: "### Tests",
  perf: "### Performance",
  revert: "### Reverts",
};

function buildChangelogSection() {
  if (noReleasable) {
    return `_No releasable changes in this release window._`;
  }
  const sections = {};
  for (const c of commits) {
    const heading = SECTION_MAP[c.type] ?? "### Other";
    if (!sections[heading]) sections[heading] = [];
    sections[heading].push(`- ${c.subject} (sha: ${c.sha})`);
  }
  return Object.entries(sections)
    .map(([heading, lines]) => `${heading}\n${lines.join("\n")}`)
    .join("\n\n");
}

const changelogEntry =
  `## [${nextVersion}] — ${today()}\n\n` + buildChangelogSection();

const changelogPath = join(ROOT, "CHANGELOG.md");
const existingChangelog = existsSync(changelogPath)
  ? readFileSync(changelogPath, "utf-8")
  : "";

// Prepend new entry after the top-level heading (if any) or at the top.
let newChangelog;
if (existingChangelog.startsWith("# ")) {
  const firstNewline = existingChangelog.indexOf("\n");
  const header = existingChangelog.slice(0, firstNewline + 1);
  const rest = existingChangelog.slice(firstNewline + 1);
  newChangelog = `${header}\n${changelogEntry}\n\n${rest}`;
} else {
  newChangelog = `# Changelog\n\n${changelogEntry}\n\n${existingChangelog}`;
}

writeFileSync(changelogPath, newChangelog, "utf-8");
console.log(`[release-captain] Wrote CHANGELOG.md`);

/* ─── Step 5: open the release PR ───────────────────────────────────────── */

const branchName = `release/v${nextVersion}`;

// Create and push the release branch
try {
  run(`git checkout -b ${branchName}`);
} catch {
  // Branch might already exist from a previous run
  run(`git checkout ${branchName}`);
}

run(`git add CHANGELOG.md`);
run(
  `git commit -m "chore: release v${nextVersion}" --allow-empty`,
  { stdio: "inherit" }
);
run(`git push origin ${branchName} --force-with-lease`);

// Build PR body
const prBody = [
  `## Release v${nextVersion}`,
  "",
  "### Changelog",
  "```",
  changelogEntry,
  "```",
  "",
  "### Maturity Ladder Audit",
  auditSummary,
  "",
  "### Checklist for reviewer",
  "- [ ] Changelog entries are accurate and complete",
  findings.length > 0
    ? "- [ ] **Maturity-ladder discrepancies above must be resolved before merge**"
    : "- [x] Maturity ladder audit passed — no discrepancies",
  "- [ ] Version bump in `package.json` files will follow in a separate PR",
  "- [ ] If promoting an in-progress item to shipping-now, update both",
  "      `marketing-site/src/components/MaturityLadder.tsx` and `README.md`",
  "",
  "---",
  "",
  "_Generated by release-captain agent — review required before merge._",
].join("\n");

// Check if a PR already exists for this branch
const existingPr = spawnSync(
  "gh",
  ["pr", "list", "--head", branchName, "--json", "url", "--jq", ".[0].url"],
  { cwd: ROOT, encoding: "utf-8", env: { ...process.env } }
);

let prUrl = existingPr.stdout.trim();

if (!prUrl) {
  const result = spawnSync(
    "gh",
    [
      "pr",
      "create",
      "--title",
      `chore: release v${nextVersion}`,
      "--body",
      prBody,
      "--base",
      "main",
      "--head",
      branchName,
    ],
    { cwd: ROOT, encoding: "utf-8", env: { ...process.env } }
  );

  if (result.status !== 0) {
    console.error("[release-captain] gh pr create failed:");
    console.error(result.stderr);
    process.exit(1);
  }
  prUrl = result.stdout.trim();
}

/* ─── Summary ────────────────────────────────────────────────────────────── */

const featureCount = commits.filter((c) => c.type === "feat").length;
const fixCount = commits.filter((c) => c.type === "fix").length;
const otherCount = commits.length - featureCount - fixCount;

console.log(`
release-captain complete

  next version   v${nextVersion}
  commits        ${commits.length} conventional commits found
  features       ${featureCount}
  fixes          ${fixCount}
  other          ${otherCount}
  audit          ${findings.length === 0 ? "no discrepancies" : `${findings.length} finding(s) — see PR`}
  pr             ${prUrl}
`);
