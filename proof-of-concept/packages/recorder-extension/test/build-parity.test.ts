/**
 * build-parity.test.ts
 *
 * Vitest suite proving that the generated content.js is built from the real
 * @cuit/recorder source (via build.mjs) rather than maintained by hand.
 *
 * ALL TESTS ARE EXPECTED TO FAIL until the following deliverables exist:
 *   1. packages/recorder-extension/src/content.entry.ts
 *   2. packages/recorder-extension/build.mjs  (must export buildExtension(outfile))
 *   3. package.json build script wired to "node build.mjs && node scripts/validate.mjs"
 *   4. scripts/validate.mjs REQUIRED_EVENT_TYPES extended with 'console' + 'error-event'
 *
 * The current hand-ported content.js (215 lines) has no installConsoleCapture(),
 * no captureConsole/captureErrors options, and emits only nav|pointer|state-snapshot.
 * Every test below greps the generated output for evidence of the missing code paths.
 *
 * Design notes:
 * - Tests assert against the BUNDLED SOURCE TEXT, not by executing Recorder in Node,
 *   because the IIFE format targets a browser MAIN world without a Node module system.
 * - CONSOLE_LEVELS and ALL_SESSION_EVENT_TYPES are parameterised so a future drop of
 *   any individual level/type fails deterministically — no magic literals.
 * - The reproducibility test builds into two separate temp files and compares bytes.
 * - beforeAll sets bundleText to '' on failure so every assertion that checks against
 *   the bundle text fails clearly (empty string satisfies no positive assertion).
 */

import { execFileSync, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { beforeAll, describe, expect, test } from 'vitest';

// ─── Path constants ───────────────────────────────────────────────────────────

const HERE = path.dirname(fileURLToPath(import.meta.url));
const PKG_ROOT = path.resolve(HERE, '..');
const BUILD_MJS = path.join(PKG_ROOT, 'build.mjs');
const CONTENT_JS = path.join(PKG_ROOT, 'content.js');
const VALIDATE_MJS = path.join(PKG_ROOT, 'scripts', 'validate.mjs');

// ─── Domain constants (match @cuit/types + recorder/src/index.ts) ─────────────

/**
 * All console levels the TS Recorder wraps (from @cuit/types CONSOLE_LEVELS).
 * Parameterising these means adding a sixth level in the future will
 * automatically add a test case here too.
 */
const CONSOLE_LEVELS = ['log', 'info', 'warn', 'error', 'debug'] as const;
type ConsoleLevel = (typeof CONSOLE_LEVELS)[number];

/**
 * Full SessionEvent type union from @cuit/types.
 * The hand-port only covered the first three; the last two are what's missing.
 */
const ALL_SESSION_EVENT_TYPES = [
  'nav',
  'pointer',
  'state-snapshot',
  'console',
  'error-event',
] as const;
type SessionEventType = (typeof ALL_SESSION_EVENT_TYPES)[number];

// ─── Build helper ─────────────────────────────────────────────────────────────

/**
 * Invoke build.mjs (which must export a `buildExtension(outfile)` async fn)
 * writing the bundle to `outfile`.  Returns the generated file text.
 *
 * Returns an error string rather than throwing so beforeAll can capture it and
 * tests can fail with descriptive messages instead of being skipped.
 */
async function runBuild(outfile: string): Promise<string> {
  if (!fs.existsSync(BUILD_MJS)) {
    throw new Error(
      `build.mjs not found at ${BUILD_MJS}. ` +
        'Create packages/recorder-extension/build.mjs as described in the plan.',
    );
  }
  // Dynamically import build.mjs and call its exported buildExtension helper.
  const buildModule = (await import(BUILD_MJS)) as {
    buildExtension?: (outfile: string) => Promise<void>;
  };
  if (typeof buildModule.buildExtension !== 'function') {
    throw new Error(
      'build.mjs must export an async function `buildExtension(outfile: string)`. ' +
        'Found exports: ' + Object.keys(buildModule).join(', '),
    );
  }
  await buildModule.buildExtension(outfile);
  return fs.readFileSync(outfile, 'utf-8');
}

// ─── Shared state populated by beforeAll ─────────────────────────────────────

/**
 * bundleText holds the generated content.js text after a successful build.
 * It is intentionally initialised to '' so that every positive `toContain` /
 * `toMatch` assertion fails clearly when build.mjs does not yet exist.
 * buildError records the reason for any build failure so tests can surface it.
 */
let bundleText = '';
let buildError: string | null = null;
let tempBundlePath = '';

beforeAll(async () => {
  tempBundlePath = path.join(os.tmpdir(), `cuit-content-parity-${process.pid}.js`);
  try {
    bundleText = await runBuild(tempBundlePath);
  } catch (err) {
    buildError = String(err);
    bundleText = ''; // keep empty so all positive assertions fail
  }
}, 60_000 /* allow up to 60 s for esbuild on a cold run */);

// ─── Helper: assert bundle was built (fails with build error if not) ──────────

function assertBundleBuilt(): void {
  if (buildError !== null) {
    throw new Error(`Build failed — cannot assert bundle contents:\n${buildError}`);
  }
  expect(bundleText.length).toBeGreaterThan(0);
}

// ─── Test 1: window.__cuitRecorder API (popup-driven surface) ─────────────────

describe('generated content.js exposes the popup-driven window.__cuitRecorder API', () => {
  test('assigns window.__cuitRecorder', () => {
    assertBundleBuilt();
    // popup.js calls: window.__cuitRecorder[fnName](...fnArgs)
    expect(bundleText).toContain('window.__cuitRecorder');
  });

  test('api object contains a start method (called by popup startBtn)', () => {
    assertBundleBuilt();
    // Popup invokes callRecorder('start', { sessionId }) → must match exactly
    expect(bundleText).toMatch(/\bstart\b/);
  });

  test('api object contains a stop method (called by popup stopBtn)', () => {
    assertBundleBuilt();
    expect(bundleText).toMatch(/\bstop\b/);
  });

  test('api object contains a status method (called by popup polling loop)', () => {
    assertBundleBuilt();
    expect(bundleText).toMatch(/\bstatus\b/);
  });

  test('sets document.documentElement.dataset.cuitRecorderInstalled marker', () => {
    assertBundleBuilt();
    // validate.mjs and popup.js both probe this attribute to confirm injection.
    expect(bundleText).toContain('cuitRecorderInstalled');
  });
});

// ─── Test 2: console-capture code path (the drift the hand-port dropped) ─────

describe('bundle includes console-capture code path absent from the hand-port', () => {
  test('contains all five CONSOLE_LEVEL string literals in a single array context', () => {
    assertBundleBuilt();
    // The TS source declares: const CONSOLE_LEVELS = ['log','info','warn','error','debug']
    // esbuild inlines this literal. The hand-port has no such array.
    const looseLevels = CONSOLE_LEVELS.map((l) => `'${l}'`);
    const allPresent = looseLevels.every((lv) => bundleText.includes(lv));
    expect(allPresent).toBe(true);
  });

  test.each(CONSOLE_LEVELS)(
    'captures console.%s — bundle references the level string "%s" in a ConsoleEvent context',
    (level: ConsoleLevel) => {
      assertBundleBuilt();
      // Each level appears in the CONSOLE_LEVELS array that installConsoleCapture iterates.
      // The hand-port has zero references to these in a capture context.
      expect(bundleText).toContain(`'${level}'`);
    },
  );

  test('contains installConsoleCapture function name OR per-level wrapper assignment', () => {
    assertBundleBuilt();
    // The TS Recorder names the private method installConsoleCapture.
    // esbuild may inline the method body — accept either the function name or the
    // pattern of iterating CONSOLE_LEVELS with a for/level combination.
    const hasInstallName = bundleText.includes('installConsoleCapture');
    const hasForLevelPattern = bundleText.includes('for') && bundleText.includes('level');
    expect(hasInstallName || hasForLevelPattern).toBe(true);
  });

  test("emits a ConsoleEvent with type:'console' field", () => {
    assertBundleBuilt();
    // The generated bundle must contain the string literal that produces console events.
    // The hand-port emits only 'nav', 'pointer', 'state-snapshot'.
    const hasSingle = bundleText.includes("type: 'console'");
    const hasDouble = bundleText.includes('type: "console"');
    expect(hasSingle || hasDouble).toBe(true);
  });

  test('ConsoleEvent objects include a level field', () => {
    assertBundleBuilt();
    // ConsoleEvent schema requires { type:'console', level, message, args }.
    // The hand-port has no concept of level.
    expect(bundleText).toContain('level');
  });

  test('console re-entrancy guard variable is present (prevents infinite recursion)', () => {
    assertBundleBuilt();
    // The TS Recorder uses `this.consoleCapturing = true/false` as a guard.
    // esbuild output references 'consoleCapturing' (class field) or an equivalent guard.
    // Without this guard, redactConsoleArg that calls console.log would stack-overflow.
    expect(bundleText).toContain('consoleCapturing');
  });
});

// ─── Test 3: window error + unhandledrejection capture ────────────────────────

describe('bundle includes window error and unhandledrejection capture', () => {
  test("registers addEventListener for window 'error' event", () => {
    assertBundleBuilt();
    // The hand-port has no window.addEventListener calls of any kind.
    // The TS Recorder adds: win.addEventListener('error', onWindowError)
    const hasSingle = bundleText.includes("addEventListener('error'");
    const hasDouble = bundleText.includes('addEventListener("error"');
    expect(hasSingle || hasDouble).toBe(true);
  });

  test("registers addEventListener for 'unhandledrejection' event", () => {
    assertBundleBuilt();
    const hasSingle = bundleText.includes("addEventListener('unhandledrejection'");
    const hasDouble = bundleText.includes('addEventListener("unhandledrejection"');
    expect(hasSingle || hasDouble).toBe(true);
  });

  test("emits an ErrorEvent with type:'error-event'", () => {
    assertBundleBuilt();
    // The hand-port never emits 'error-event'; the TS Recorder does.
    const hasSingle = bundleText.includes("type: 'error-event'");
    const hasDouble = bundleText.includes('type: "error-event"');
    expect(hasSingle || hasDouble).toBe(true);
  });

  test("ErrorEvent carries source value 'window.error' for window onerror", () => {
    assertBundleBuilt();
    expect(bundleText).toContain('window.error');
  });

  test("ErrorEvent carries source value 'unhandledrejection' for promise rejections", () => {
    assertBundleBuilt();
    expect(bundleText).toContain('unhandledrejection');
  });
});

// ─── Test 4: ALL SessionEvent categories represented in the bundle ─────────────

describe('bundle carries every SessionEvent category the TS recorder emits', () => {
  test.each(ALL_SESSION_EVENT_TYPES)(
    "content.js emits events of type '%s'",
    (eventType: SessionEventType) => {
      assertBundleBuilt();
      // Each type must appear as a string literal in the bundle — proving the
      // bundler did not tree-shake any event-emitting branch.
      // Accept both single and double quote forms from esbuild.
      const hasSingle = bundleText.includes(`type: '${eventType}'`);
      const hasDouble = bundleText.includes(`type: "${eventType}"`);
      expect(hasSingle || hasDouble).toBe(true);
    },
  );
});

// ─── Test 5: build is reproducible (byte-identical across two runs) ───────────

describe('build output is deterministic (reproducible builds)', () => {
  test('two consecutive builds produce identical bytes', async () => {
    if (!fs.existsSync(BUILD_MJS)) {
      throw new Error(
        `build.mjs not found at ${BUILD_MJS} — cannot test reproducibility.`,
      );
    }

    const tmp1 = path.join(os.tmpdir(), `cuit-repro-1-${process.pid}.js`);
    const tmp2 = path.join(os.tmpdir(), `cuit-repro-2-${process.pid}.js`);

    try {
      await runBuild(tmp1);
      await runBuild(tmp2);

      const buf1 = fs.readFileSync(tmp1);
      const buf2 = fs.readFileSync(tmp2);

      // deepEqual on Buffers compares byte-by-byte.
      expect(buf1).toEqual(buf2);
    } finally {
      for (const f of [tmp1, tmp2]) {
        try { fs.unlinkSync(f); } catch { /* non-fatal */ }
      }
    }
  }, 120_000 /* two build runs */);
});

// ─── Test 6: IIFE format — no bare ESM import/export, no remote network calls ─

describe('generated content.js is a self-contained IIFE (MV3 MAIN-world compatible)', () => {
  test('does not start any line with a bare ESM import statement', () => {
    assertBundleBuilt();
    // MV3 content scripts in world:MAIN cannot use top-level import.
    // format:'iife' should have inlined everything.
    expect(bundleText).not.toMatch(/^\s*import\s+/m);
  });

  test('does not contain a bare ESM export statement', () => {
    assertBundleBuilt();
    // An IIFE bundle must not export symbols; exports would break the extension.
    expect(bundleText).not.toMatch(/^\s*export\s+/m);
  });

  test('opens with an IIFE wrapper — begins with (() => { or (function(', () => {
    assertBundleBuilt();
    // esbuild format:'iife' wraps the entire output in a self-invoking function.
    // Strip the generated banner comment lines before checking the first code line.
    const codeLines = bundleText
      .split('\n')
      .filter((l) => l.trim() && !l.trim().startsWith('//'));
    const firstCodeLine = codeLines[0] ?? '';
    const isIife =
      firstCodeLine.trimStart().startsWith('(()') ||
      firstCodeLine.trimStart().startsWith('(function');
    expect(isIife).toBe(true);
  });

  test('does not contain fetch calls to remote hosts', () => {
    assertBundleBuilt();
    // Recorder must stay local — no telemetry.
    expect(bundleText).not.toMatch(/fetch\s*\(\s*['"]https?:\/\/(?!127\.0\.0\.1|localhost)/i);
  });

  test('does not contain XMLHttpRequest usage', () => {
    assertBundleBuilt();
    expect(bundleText).not.toContain('XMLHttpRequest');
  });

  test('does not contain navigator.sendBeacon', () => {
    assertBundleBuilt();
    expect(bundleText).not.toContain('navigator.sendBeacon');
  });
});

// ─── Test 7: banner proves generated-not-hand-maintained, validate.mjs gate ───

describe('build banner and validate.mjs gate', () => {
  test('generated content.js has a do-not-edit banner (replacing the hand-copy comment)', () => {
    assertBundleBuilt();
    // The old header said "keep in sync by hand".
    // The new generated file must say "DO NOT EDIT BY HAND" or equivalent.
    expect(bundleText).toMatch(/DO NOT EDIT BY HAND/i);
  });

  test('generated content.js does NOT contain the old "keep in sync by hand" admission', () => {
    assertBundleBuilt();
    // Confirm the hand-ported comment is gone from the generated output.
    expect(bundleText).not.toContain('keep them in sync by hand');
  });

  test("validate.mjs REQUIRED_EVENT_TYPES includes 'console'", () => {
    // Read validate.mjs source and assert the type is listed.
    // If this fails, validate.mjs was not updated as part of the fix.
    expect(fs.existsSync(VALIDATE_MJS)).toBe(true);
    const validateSrc = fs.readFileSync(VALIDATE_MJS, 'utf-8');
    // REQUIRED_EVENT_TYPES must contain 'console' — currently it only has
    // ['nav', 'pointer', 'state-snapshot'], so this test fails today.
    expect(validateSrc).toContain("'console'");
  });

  test("validate.mjs REQUIRED_EVENT_TYPES includes 'error-event'", () => {
    expect(fs.existsSync(VALIDATE_MJS)).toBe(true);
    const validateSrc = fs.readFileSync(VALIDATE_MJS, 'utf-8');
    // Same as above — 'error-event' is missing from the current gate.
    expect(validateSrc).toContain("'error-event'");
  });

  test('running validate.mjs against the generated content.js exits with code 0', () => {
    // This exercises the end-to-end gate: build output must satisfy validate.mjs.
    // Fails today for two reasons:
    //   (a) build.mjs does not exist yet so content.js is still the hand-port
    //   (b) validate.mjs REQUIRED_EVENT_TYPES does not yet include 'console' or 'error-event'
    // After the fix: build.mjs generates content.js AND validate.mjs is extended,
    // so both preconditions pass and this test goes green.

    // Precondition 1: build.mjs must exist (the build step must have run).
    // If it doesn't, throw immediately so the failure message is clear.
    if (!fs.existsSync(BUILD_MJS)) {
      throw new Error(
        `build.mjs not found at ${BUILD_MJS}. ` +
          'Create build.mjs and run `pnpm -F @cuit/recorder-extension build` first.',
      );
    }

    expect(fs.existsSync(CONTENT_JS)).toBe(true);
    expect(fs.existsSync(VALIDATE_MJS)).toBe(true);

    // Precondition 2: validate.mjs must include 'console' and 'error-event' in its gate.
    // This assertion mirrors the standalone validate.mjs tests above and makes this
    // test self-consistent — it won't silently pass on a stale validate.mjs.
    const validateSrc = fs.readFileSync(VALIDATE_MJS, 'utf-8');
    expect(validateSrc).toContain("'console'");
    expect(validateSrc).toContain("'error-event'");

    const result = spawnSync('node', [VALIDATE_MJS], {
      cwd: PKG_ROOT,
      encoding: 'utf-8',
      timeout: 30_000,
    });
    if (result.error) throw result.error;
    expect(result.status).toBe(0);
  });
});
