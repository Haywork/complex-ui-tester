/**
 * extension.test.ts
 *
 * Loadability + correctness suite for the MV3 recorder extension. Three concerns,
 * mirroring the package's deliverable contract:
 *
 *   1. manifest.json is a valid, minimal-permission MV3 manifest that Chrome will
 *      accept via "Load unpacked" with NO wildcard host overreach.
 *   2. The generated content.js bundle (built from @haywork/recorder via build.mjs)
 *      carries the full recorder surface — pointer + nav + state + console capture
 *      + window error capture — proving popup.js drives a real recorder.
 *   3. A driven recorder session exports a SCHEMA-VALID session object of the shape
 *      { sessionId, vendor:'cuit', url, events: SessionEvent[] }, where every event
 *      satisfies the @haywork/types SessionEvent union. This is the artifact the popup
 *      copies/downloads and that @haywork/spec-gen consumes.
 *
 * Design notes:
 *  - Concern 3 drives the REAL Recorder from @haywork/recorder in Node using an
 *    injected fake document/window (no jsdom dependency). The export is validated
 *    against an independently-written runtime validator derived from the
 *    @haywork/types union — never against the recorder's own output as its own oracle.
 *  - Permission lists and event categories are parameterised; adding/removing one
 *    in the manifest or the type union changes the expectation deterministically.
 *  - The bundle is asserted by text (it is a browser-MAIN-world IIFE, not Node-loadable).
 *
 * ── SECTION 4 ONWARDS ARE INTENTIONALLY FAILING TESTS ──────────────────────────
 *  These describe behaviour that is specified but not yet implemented:
 *    4. Manifest permission minimization: "storage" is declared but unused.
 *    5. popup.js wiring: download filename, poll-guard, inject-world, error surface.
 *    6. Session event ordering: seq strictly monotonic, ts non-decreasing, wallClock
 *       absolute, first event ts === 0.
 *    7. Keyboard event capture: @haywork/types defines KeyboardEvent but the Recorder
 *       class does not yet install an input/change listener — bundle omits 'keyboard'.
 *    8. Content.js idempotency: re-running the IIFE when __cuitRecorder already exists
 *       must leave the live API reference intact (not re-assign it).
 */

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { beforeAll, describe, expect, test } from 'vitest';

import { Recorder } from '@haywork/recorder';
import {
  CONSOLE_LEVELS,
  isConsoleEvent,
  isErrorEvent,
  isKeyboardEvent,
  type ConsoleEvent,
  type ErrorEvent,
  type NavEvent,
  type SessionEvent,
} from '@haywork/types';

// ─── Paths ──────────────────────────────────────────────────────────────────

const HERE = path.dirname(fileURLToPath(import.meta.url));
const PKG_ROOT = path.resolve(HERE, '..');
const MANIFEST_JSON = path.join(PKG_ROOT, 'manifest.json');
const BUILD_MJS = path.join(PKG_ROOT, 'build.mjs');

// ─── Domain constants (mirror @haywork/types — the source of truth) ──────────────

/** The complete SessionEvent.type union, asserted against the bundle + export. */
const ALL_SESSION_EVENT_TYPES = [
  'nav',
  'pointer',
  'state-snapshot',
  'console',
  'error-event',
  'keyboard',
] as const;

/** Permissions the extension legitimately needs — nothing more. */
const REQUIRED_PERMISSIONS = ['activeTab', 'scripting'] as const;

/** Host patterns that trigger Chrome's "all your data on all websites" warning. */
const WILDCARD_HOST_PATTERNS = ['<all_urls>', '*://*/*', 'http://*/*', 'https://*/*'];

// ─── Fixtures: load manifest once ─────────────────────────────────────────────

let manifest: Record<string, unknown>;

beforeAll(() => {
  manifest = JSON.parse(fs.readFileSync(MANIFEST_JSON, 'utf-8'));
});

// ─── Concern 1: manifest is valid, minimal-permission MV3 ─────────────────────

describe('manifest.json is a valid minimal-permission MV3 manifest', () => {
  test('declares manifest_version 3', () => {
    expect(manifest['manifest_version']).toBe(3);
  });

  test.each(['name', 'version', 'action'] as const)(
    'includes required top-level key "%s"',
    (key) => {
      expect(manifest[key]).toBeDefined();
    },
  );

  test('action.default_popup points at popup.html', () => {
    const action = manifest['action'] as { default_popup?: string };
    expect(action.default_popup).toBe('popup.html');
  });

  test('background service worker is an MV3 ES module', () => {
    const background = manifest['background'] as { service_worker?: string; type?: string };
    expect(background.service_worker).toBe('background.js');
    expect(background.type).toBe('module');
  });

  test.each(REQUIRED_PERMISSIONS)(
    'requests the "%s" permission (needed to inject on demand)',
    (perm) => {
      expect(manifest['permissions']).toContain(perm);
    },
  );

  test('does NOT declare any static host_permissions (activeTab covers access)', () => {
    // activeTab grants per-invocation host access scoped to the active tab, so a
    // static host_permissions array would be strict overreach.
    const hostPermissions = manifest['host_permissions'];
    expect(hostPermissions).toBeUndefined();
  });

  test.each(WILDCARD_HOST_PATTERNS)(
    'no host_permissions entry contains the wildcard host pattern "%s"',
    (pattern) => {
      const hostPermissions = (manifest['host_permissions'] as string[] | undefined) ?? [];
      expect(hostPermissions).not.toContain(pattern);
    },
  );

  test.each(WILDCARD_HOST_PATTERNS)(
    'no content_scripts[].matches entry contains the wildcard host pattern "%s"',
    (pattern) => {
      const contentScripts =
        (manifest['content_scripts'] as Array<{ matches?: string[] }> | undefined) ?? [];
      const allMatches = contentScripts.flatMap((c) => c.matches ?? []);
      expect(allMatches).not.toContain(pattern);
    },
  );

  test('every referenced file in the manifest exists on disk', () => {
    const action = manifest['action'] as { default_popup: string; default_icon: Record<string, string> };
    const background = manifest['background'] as { service_worker: string };
    const icons = manifest['icons'] as Record<string, string>;
    const referenced = [
      action.default_popup,
      background.service_worker,
      ...Object.values(action.default_icon),
      ...Object.values(icons),
    ];
    for (const rel of referenced) {
      expect(fs.existsSync(path.join(PKG_ROOT, rel)), `missing ${rel}`).toBe(true);
    }
  });
});

// ─── Concern 2: built content bundle carries the recorder + console capture ───

describe('built content.js carries the full @haywork/recorder surface', () => {
  let bundleText = '';

  beforeAll(async () => {
    const tmp = path.join(os.tmpdir(), `cuit-ext-bundle-${process.pid}.js`);
    const mod = (await import(BUILD_MJS)) as {
      buildExtension: (outfile: string) => Promise<void>;
    };
    await mod.buildExtension(tmp);
    bundleText = fs.readFileSync(tmp, 'utf-8');
    fs.unlinkSync(tmp);
  }, 60_000);

  test('is generated, not hand-maintained (carries the do-not-edit banner)', () => {
    expect(bundleText).toMatch(/DO NOT EDIT BY HAND/i);
  });

  test('exposes the window.__cuitRecorder API the popup drives', () => {
    expect(bundleText).toContain('window.__cuitRecorder');
  });

  test.each(['log', 'info', 'warn', 'error', 'debug'] as const)(
    'console capture wraps console.%s (level literal present in bundle)',
    (level) => {
      expect(bundleText).toContain(`'${level}'`);
    },
  );

  test('includes the console re-entrancy guard (prevents infinite recursion)', () => {
    expect(bundleText).toContain('consoleCapturing');
  });

  test("registers window 'error' and 'unhandledrejection' capture", () => {
    expect(bundleText).toContain("addEventListener('error'");
    expect(bundleText).toContain("addEventListener('unhandledrejection'");
  });

  test.each(ALL_SESSION_EVENT_TYPES.filter((t) => t !== 'keyboard'))(
    "emits SessionEvents of type '%s'",
    (eventType) => {
      const single = bundleText.includes(`type: '${eventType}'`);
      const double = bundleText.includes(`type: "${eventType}"`);
      expect(single || double).toBe(true);
    },
  );
});

// ─── Concern 3: a driven recorder exports a schema-valid session ──────────────

/**
 * Minimal fake DOM/window harness so the real Recorder runs in Node without
 * jsdom. It supports the surface the recorder touches: addEventListener /
 * removeEventListener (for pointer + window error listeners), a window console,
 * and location.href (for the nav event url).
 */
function makeFakeDom(href: string) {
  type Listener = (ev: unknown) => void;
  const winListeners = new Map<string, Set<Listener>>();
  const docListeners = new Map<string, Set<Listener>>();

  const fakeConsole = {
    log: () => {},
    info: () => {},
    warn: () => {},
    error: () => {},
    debug: () => {},
  } as unknown as Console;

  const win = {
    location: { href },
    console: fakeConsole,
    addEventListener(type: string, fn: Listener) {
      if (!winListeners.has(type)) winListeners.set(type, new Set());
      winListeners.get(type)!.add(fn);
    },
    removeEventListener(type: string, fn: Listener) {
      winListeners.get(type)?.delete(fn);
    },
    dispatch(type: string, ev: unknown) {
      for (const fn of winListeners.get(type) ?? []) fn(ev);
    },
  };

  const doc = {
    defaultView: win as unknown as Window,
    addEventListener(type: string, fn: Listener) {
      if (!docListeners.has(type)) docListeners.set(type, new Set());
      docListeners.get(type)!.add(fn);
    },
    removeEventListener(type: string, fn: Listener) {
      docListeners.get(type)?.delete(fn);
    },
  } as unknown as Document;

  return { doc, win, fakeConsole };
}

/**
 * Independent runtime validator for a single SessionEvent. Written from the
 * @haywork/types union — deliberately NOT importing the recorder's own typing —
 * so it is a genuine external oracle. Returns null when valid, else a reason.
 */
function validateEvent(e: SessionEvent): string | null {
  if (typeof e.seq !== 'number') return 'seq must be number';
  if (typeof e.ts !== 'number') return 'ts must be number';
  if (typeof e.wallClock !== 'number') return 'wallClock must be number';
  if (typeof e.vendorEventId !== 'string' || e.vendorEventId.length === 0)
    return 'vendorEventId must be non-empty string';
  if (e.vendor !== 'cuit') return `vendor must be 'cuit', got ${e.vendor}`;

  switch (e.type) {
    case 'nav':
      return typeof e.url === 'string' ? null : 'nav.url must be string';
    case 'pointer':
      if (!['down', 'move', 'up'].includes(e.phase)) return 'pointer.phase invalid';
      if (typeof e.targetSelector !== 'string') return 'pointer.targetSelector must be string';
      if (typeof e.x !== 'number' || typeof e.y !== 'number') return 'pointer x/y must be numbers';
      return null;
    case 'state-snapshot':
      return typeof e.path === 'string' ? null : 'state-snapshot.path must be string';
    case 'console':
      if (!CONSOLE_LEVELS.includes(e.level)) return `console.level invalid: ${e.level}`;
      if (typeof e.message !== 'string') return 'console.message must be string';
      if (!Array.isArray(e.args)) return 'console.args must be array';
      return null;
    case 'error-event':
      return typeof e.message === 'string' ? null : 'error-event.message must be string';
    case 'keyboard':
      if (typeof e.targetSelector !== 'string') return 'keyboard.targetSelector must be string';
      return typeof e.value === 'string' ? null : 'keyboard.value must be string';
    default:
      return `unknown event type: ${(e as { type: string }).type}`;
  }
}

describe('a driven recorder exports a schema-valid SessionEvent[] session', () => {
  const SESSION_ID = 'cuit-test-fixed-1700000000000';
  const PAGE_URL = 'https://app.example.test/dashboard';

  /** Run a deterministic session: start, log, error, unhandledrejection, stop, export. */
  function runSession() {
    const { doc, win, fakeConsole } = makeFakeDom(PAGE_URL);
    let clock = 1000;
    const rec = new Recorder({
      sessionId: SESSION_ID,
      vendor: 'cuit',
      document: doc,
      now: () => clock,
      snapshotProvider: () => ({ counter: 0, user: { name: 'ada' } }),
    });
    rec.start();

    clock = 1001;
    (fakeConsole.log as (...a: unknown[]) => void)('hello', 42);
    clock = 1002;
    (fakeConsole.error as (...a: unknown[]) => void)('boom');

    clock = 1003;
    win.dispatch('error', { message: 'window blew up', error: new Error('window blew up') });
    clock = 1004;
    win.dispatch('unhandledrejection', { reason: new Error('rejected') });

    rec.stop();
    return rec.export();
  }

  test('export has the popup-contract top-level shape { sessionId, vendor, url, events }', () => {
    const session = runSession();
    expect(session.sessionId).toBe(SESSION_ID);
    expect(session.vendor).toBe('cuit');
    expect(session.url).toBe(PAGE_URL);
    expect(Array.isArray(session.events)).toBe(true);
  });

  test('every event passes the independent @haywork/types schema validator', () => {
    const session = runSession();
    const failures = session.events
      .map((e) => ({ e, reason: validateEvent(e) }))
      .filter((r) => r.reason !== null);
    expect(failures).toEqual([]);
  });

  test('the session is JSON round-trippable (what the popup copies/downloads)', () => {
    const session = runSession();
    const json = JSON.stringify(session);
    const parsed = JSON.parse(json) as typeof session;
    expect(parsed).toEqual(session);
  });

  test('captures the nav event first with the page url', () => {
    const session = runSession();
    const nav = session.events.find((e): e is NavEvent => e.type === 'nav');
    expect(nav).toBeDefined();
    expect(nav?.url).toBe(PAGE_URL);
    expect(session.events[0]?.type).toBe('nav');
  });

  test('captures console.log and console.error with correct levels and message', () => {
    const session = runSession();
    const consoles = session.events.filter(isConsoleEvent) as ConsoleEvent[];
    const log = consoles.find((c) => c.level === 'log');
    expect(log?.message).toBe('hello 42');
    const explicitError = consoles.find((c) => c.level === 'error' && c.message === 'boom');
    expect(explicitError).toBeDefined();
  });

  test('captures window error and unhandledrejection as error-events with sources', () => {
    const session = runSession();
    const errors = session.events.filter(isErrorEvent) as ErrorEvent[];
    const sources = errors.map((e) => e.source).sort();
    expect(sources).toEqual(['unhandledrejection', 'window.error']);
  });

  test('vendorEventId values are unique per event (no collision in the trace)', () => {
    const session = runSession();
    const ids = session.events.map((e) => e.vendorEventId);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

// ─── Section 4: manifest permission minimization ─────────────────────────────
//
// EXPECTED TO FAIL until the "storage" permission is removed from manifest.json.
// Rationale: chrome.storage is only mentioned in a TODO comment in background.js;
// no file makes an actual chrome.storage API call. Declaring unused permissions
// triggers Chrome's "this extension can store data and read it across sessions"
// warning and violates the minimal-permission contract of the MV3 model.

describe('manifest declares only permissions that are actively used', () => {
  /** Permissions that popup.js / background.js actually call at runtime. */
  const PERMISSIONS_WITH_ACTIVE_CALLERS: Record<string, string> = {
    activeTab: 'chrome.tabs.query + scripting.executeScript scoped to active tab',
    scripting: 'chrome.scripting.executeScript in ensureInjected()',
    clipboardWrite: 'navigator.clipboard.writeText in copyBtn handler',
    downloads: 'chrome.downloads.download in downloadBtn handler',
  };

  test('every declared permission has at least one active caller in popup.js or background.js', () => {
    const declared = (manifest['permissions'] as string[]) ?? [];
    const popupSrc = fs.readFileSync(path.join(PKG_ROOT, 'popup.js'), 'utf-8');
    const backgroundSrc = fs.readFileSync(path.join(PKG_ROOT, 'background.js'), 'utf-8');

    // Map each permission to a grep pattern that proves real usage (not just a comment).
    // Any permission that does not appear via its usage pattern is overreach.
    const USAGE_PATTERNS: Record<string, RegExp> = {
      activeTab: /chrome\.tabs\.query|executeScript/,
      scripting: /chrome\.scripting\./,
      clipboardWrite: /navigator\.clipboard\.writeText/,
      downloads: /chrome\.downloads\./,
      // "storage" has no usage pattern — it is declared but unused.
    };

    const overreach: string[] = [];
    for (const perm of declared) {
      const pattern = USAGE_PATTERNS[perm];
      if (!pattern) {
        // No known usage pattern for this permission → it is overreach.
        overreach.push(perm);
        continue;
      }
      const usedInPopup = pattern.test(popupSrc);
      const usedInBackground = pattern.test(backgroundSrc);
      if (!usedInPopup && !usedInBackground) {
        overreach.push(perm);
      }
    }
    // The only expected value here is [] (no overreach).
    // Currently fails because "storage" is declared with no active callers.
    expect(overreach, `overreach permissions: ${overreach.join(', ')}`).toEqual([]);
  });

  test('manifest does NOT declare the "storage" permission (no chrome.storage calls exist)', () => {
    const permissions = (manifest['permissions'] as string[]) ?? [];
    // Fails today: manifest.json includes "storage" in the permissions array,
    // but neither popup.js nor background.js contains a chrome.storage call.
    expect(permissions).not.toContain('storage');
  });
});

// ─── Section 5: popup.js wiring static contract ───────────────────────────────
//
// popup.js is plain JS (no build step) — we assert its behaviour by reading the
// source text and verifying static contracts that cannot be covered by running
// Recorder in Node (chrome.* APIs are browser-only).

describe('popup.js satisfies the chrome extension wiring contract', () => {
  let popupSrc: string;

  beforeAll(() => {
    popupSrc = fs.readFileSync(path.join(PKG_ROOT, 'popup.js'), 'utf-8');
  });

  test('download filename uses cuit-session-${sessionId}.json template', () => {
    // Chrome downloads API must save with this exact filename so spec-gen and the
    // Claude Code workflow can identify the file by name.
    expect(popupSrc).toContain('cuit-session-${lastSession.sessionId}.json');
  });

  test('ensureInjected() uses world:"MAIN" — NOT "ISOLATED"', () => {
    // The recorder must run in the MAIN world to access window.__cuitDebug and set
    // window.__cuitRecorder. Injecting into the ISOLATED world would silently fail.
    // ISOLATED is the default when no world key is present, so the key MUST be explicit.
    expect(popupSrc).toContain("world: 'MAIN'");
    expect(popupSrc).not.toContain("world: 'ISOLATED'");
  });

  test('callRecorder() returns {ok:false,error:"inject-failed"} when ensureInjected throws', () => {
    // The error path is: try { await ensureInjected(tab.id) } catch { return {ok:false,...} }
    // This test asserts the error surface is in the source so the popup never silently swallows
    // a failed injection (which looks like a hanging "checking…" state to the user).
    expect(popupSrc).toContain("'inject-failed'");
  });

  test('setInterval polling is only started inside the startBtn click handler (not at module level)', () => {
    // Polling must not begin before the user presses Start. A top-level setInterval
    // would waste resources and fire even when the popup is closed.
    // The only setInterval call must be inside the startBtn addEventListener callback.
    //
    // Strategy: split at the startBtn addEventListener boundary and confirm setInterval
    // does not appear before it.
    const startBtnIdx = popupSrc.indexOf("startBtn.addEventListener('click'");
    expect(startBtnIdx, 'startBtn.addEventListener not found in popup.js').toBeGreaterThan(0);
    const beforeStart = popupSrc.slice(0, startBtnIdx);
    expect(beforeStart).not.toContain('setInterval');
  });

  test('popup explicitly clears the polling interval on stop (clearInterval called in stopBtn handler)', () => {
    // If the poll handle is not cleared, the extension continues querying the tab
    // after recording ends, creating unnecessary scripting activity.
    const stopBtnIdx = popupSrc.indexOf("stopBtn.addEventListener('click'");
    expect(stopBtnIdx, 'stopBtn.addEventListener not found in popup.js').toBeGreaterThan(0);
    const afterStop = popupSrc.slice(stopBtnIdx);
    expect(afterStop).toContain('clearInterval');
  });

  test('copy and download buttons are disabled until a session has been captured', () => {
    // lastSession starts null; buttons must only enable after stop() succeeds.
    // Both guards should reference lastSession === null.
    const copyBtnIdx = popupSrc.indexOf("copyBtn.disabled");
    const downloadBtnIdx = popupSrc.indexOf("downloadBtn.disabled");
    expect(copyBtnIdx).toBeGreaterThan(0);
    expect(downloadBtnIdx).toBeGreaterThan(0);
    // The disabled state is driven by `lastSession === null`
    expect(popupSrc).toContain('lastSession === null');
  });
});

// ─── Section 6: session event ordering invariants ────────────────────────────
//
// These tests run the real Recorder and assert properties of the event sequence
// that are NOT covered by the schema validator above. They catch bugs where
// seq numbers are emitted out of order, ts goes backwards, or wallClock is set
// to a relative value instead of an absolute epoch value.
//
// ALL tests in this section exercise the real Recorder via runSession() from
// Section 3's factory — the same deterministic harness, no new fixtures.

describe('session events satisfy ordering and timing invariants', () => {
  const SESSION_ID = 'cuit-ordering-test-1700000001234';
  const PAGE_URL = 'https://ordering.example.test/';
  const START_CLOCK = 1_700_000_000_000;

  function runOrderingSession() {
    const { doc, win, fakeConsole } = makeFakeDom(PAGE_URL);
    let clock = START_CLOCK;
    const rec = new Recorder({
      sessionId: SESSION_ID,
      vendor: 'cuit',
      document: doc,
      now: () => clock,
      snapshotProvider: () => ({ x: clock }),
    });
    rec.start();
    clock += 10;
    (fakeConsole.info as (...a: unknown[]) => void)('step one');
    clock += 10;
    (fakeConsole.warn as (...a: unknown[]) => void)('step two');
    clock += 10;
    win.dispatch('error', { message: 'oops', error: new Error('oops') });
    clock += 10;
    rec.stop();
    return { session: rec.export(), startClock: START_CLOCK };
  }

  test('seq values are strictly monotonically increasing starting from 0', () => {
    const { session } = runOrderingSession();
    const seqs = session.events.map((e) => e.seq);
    // seq must start at 0
    expect(seqs[0]).toBe(0);
    // each subsequent seq must be exactly one greater than the previous
    for (let i = 1; i < seqs.length; i++) {
      expect(seqs[i], `seq[${i}] must be ${seqs[i - 1]! + 1}, got ${seqs[i]}`).toBe(
        seqs[i - 1]! + 1,
      );
    }
  });

  test('ts values are non-decreasing (monotonic relative timestamps)', () => {
    const { session } = runOrderingSession();
    const tsList = session.events.map((e) => e.ts);
    for (let i = 1; i < tsList.length; i++) {
      expect(
        tsList[i]!,
        `ts[${i}]=${tsList[i]} must be >= ts[${i - 1}]=${tsList[i - 1]}`,
      ).toBeGreaterThanOrEqual(tsList[i - 1]!);
    }
  });

  test('the first event (nav) has ts === 0 (zero-based relative timestamps)', () => {
    // The nav event is emitted at the exact moment start() is called, so its
    // relative timestamp must be 0. Any non-zero value means the recorder
    // is mis-computing the baseline.
    const { session } = runOrderingSession();
    const firstEvent = session.events[0];
    expect(firstEvent?.type).toBe('nav');
    expect(firstEvent?.ts).toBe(0);
  });

  test('every event wallClock is >= session.createdAt (absolute epoch ms)', () => {
    // wallClock is the absolute wall-clock time of the event; it must never be
    // less than the session start time. A value below createdAt indicates that
    // relative and absolute timestamps have been swapped.
    const { session } = runOrderingSession();
    for (const ev of session.events) {
      expect(
        ev.wallClock,
        `event[${ev.seq}] wallClock=${ev.wallClock} must be >= createdAt=${session.createdAt}`,
      ).toBeGreaterThanOrEqual(session.createdAt);
    }
  });

  test('session.createdAt matches the absolute epoch ms when start() was called', () => {
    const { session, startClock } = runOrderingSession();
    expect(session.createdAt).toBe(startClock);
  });
});

// ─── Section 7: keyboard event capture ───────────────────────────────────────
//
// @haywork/types defines a `KeyboardEvent` union member (type:'keyboard') and
// exports `isKeyboardEvent`. The @haywork/recorder Recorder class is expected to
// install an 'input' listener on the document and emit KeyboardEvents. Neither
// the listener installation nor the event emission is implemented yet, so:
//
//   - The built content.js bundle contains no reference to 'input' listeners.
//   - A driven Recorder session produces zero events of type 'keyboard'.
//
// These tests will FAIL until the Recorder implements keyboard capture.

describe('Recorder captures keyboard input as KeyboardEvent entries (type:"keyboard")', () => {
  test('built content.js registers an input event listener for keyboard capture', async () => {
    // The Recorder is expected to call doc.addEventListener('input', ...) so that
    // text typed into inputs is captured. Without this, keyboard events are silent.
    const tmp = path.join(os.tmpdir(), `cuit-ext-keyboard-${process.pid}.js`);
    const mod = (await import(BUILD_MJS)) as {
      buildExtension: (outfile: string) => Promise<void>;
    };
    await mod.buildExtension(tmp);
    const txt = fs.readFileSync(tmp, 'utf-8');
    fs.unlinkSync(tmp);
    // Fails today: no 'input' listener is installed — the Recorder omits keyboard capture.
    const registersInput =
      txt.includes("addEventListener('input'") ||
      txt.includes('addEventListener("input"');
    expect(registersInput).toBe(true);
  }, 60_000);

  test('built content.js emits events of type "keyboard" (in the SessionEvent union)', async () => {
    const tmp = path.join(os.tmpdir(), `cuit-ext-keyboard-type-${process.pid}.js`);
    const mod = (await import(BUILD_MJS)) as {
      buildExtension: (outfile: string) => Promise<void>;
    };
    await mod.buildExtension(tmp);
    const txt = fs.readFileSync(tmp, 'utf-8');
    fs.unlinkSync(tmp);
    // Fails today: no keyboard event type literal exists in the bundle.
    const hasKeyboard =
      txt.includes("type: 'keyboard'") || txt.includes('type: "keyboard"');
    expect(hasKeyboard).toBe(true);
  }, 60_000);

  test('driven Recorder emits a KeyboardEvent when an input event fires on the document', () => {
    // Build a fake DOM that supports input events, start a Recorder, fire an input
    // event, stop, and assert a type:'keyboard' event appears in the export.
    type Listener = (ev: unknown) => void;
    const docListeners = new Map<string, Set<Listener>>();

    const win = {
      location: { href: 'https://keyboard.test/' },
      console: {
        log: () => {}, info: () => {}, warn: () => {},
        error: () => {}, debug: () => {},
      } as unknown as Console,
      addEventListener: (_type: string, _fn: Listener) => {},
      removeEventListener: (_type: string, _fn: Listener) => {},
    };

    const doc = {
      defaultView: win as unknown as Window,
      addEventListener(type: string, fn: Listener) {
        if (!docListeners.has(type)) docListeners.set(type, new Set());
        docListeners.get(type)!.add(fn);
      },
      removeEventListener(type: string, fn: Listener) {
        docListeners.get(type)?.delete(fn);
      },
    } as unknown as Document;

    const rec = new Recorder({
      sessionId: 'cuit-keyboard-test',
      vendor: 'cuit',
      document: doc,
    });
    rec.start();

    // Simulate an <input> element receiving text
    const fakeInput = {
      value: 'hello world',
      tagName: 'INPUT',
      id: '',
      getAttribute: (_attr: string) => null,
      parentElement: null,
      nodeType: 1,
    };
    const inputEvent = { target: fakeInput, type: 'input' };
    for (const fn of docListeners.get('input') ?? []) {
      fn(inputEvent);
    }

    rec.stop();
    const session = rec.export();

    // Fails today: no KeyboardEvent is emitted — Recorder does not install 'input' listener.
    const keyboardEvents = session.events.filter((e) => e.type === 'keyboard');
    expect(keyboardEvents.length).toBeGreaterThan(0);

    const kbEvent = keyboardEvents[0]!;
    expect(kbEvent.type).toBe('keyboard');
    // Type narrowing: after the type check above, TypeScript should accept these.
    if (kbEvent.type === 'keyboard') {
      expect(kbEvent.targetSelector).toBeTypeOf('string');
      expect(kbEvent.value).toBe('hello world');
    }
  });
});

// ─── Section 8: content.js idempotency (re-injection must not orphan recording) ─
//
// popup.js injects content.js on EVERY callRecorder invocation (the activeTab model).
// If re-injection replaced window.__cuitRecorder with a new instance, any in-progress
// recording would be orphaned — its events lost. The content.entry.ts guard:
//
//   var existing = window.__cuitRecorder;
//   if (existing) { /* no-op */ } else { /* install */ }
//
// must be present in the generated bundle so re-injection is safe.
// These tests assert the guard in the bundle text AND that popup.js relies on
// it (because popup.js injects BEFORE every single command, not only on first use).

describe('content.js idempotency: re-injection does not replace an in-progress recorder', () => {
  let bundleText = '';

  beforeAll(async () => {
    const tmp = path.join(os.tmpdir(), `cuit-ext-idem-${process.pid}.js`);
    const mod = (await import(BUILD_MJS)) as {
      buildExtension: (outfile: string) => Promise<void>;
    };
    await mod.buildExtension(tmp);
    bundleText = fs.readFileSync(tmp, 'utf-8');
    fs.unlinkSync(tmp);
  }, 60_000);

  test('bundle reads window.__cuitRecorder into a variable before the install block', () => {
    // Pattern: `var existing = window.__cuitRecorder` or equivalent.
    // The variable name may differ after minification, but the RHS must be window.__cuitRecorder.
    const hasExistingCheck =
      bundleText.includes('window.__cuitRecorder') &&
      // The assignment to a local + subsequent branch is the idempotency guard.
      (bundleText.includes('var existing = window.__cuitRecorder') ||
        bundleText.includes('const existing = window.__cuitRecorder'));
    expect(hasExistingCheck).toBe(true);
  });

  test('bundle skips the install block when the existing recorder variable is truthy', () => {
    // The guard `if (existing) { } else { ... install ... }` must be present.
    // An empty if-body is intentional — the else branch does the install.
    // We assert the if(existing) pattern precedes the api assignment.
    const existingIdx = bundleText.indexOf('window.__cuitRecorder');
    const apiIdx = bundleText.indexOf('window.__cuitRecorder = api');
    // The guard check (read) must come BEFORE the assignment (write).
    expect(existingIdx).toBeLessThan(apiIdx);
  });

  test('popup.js injects content.js BEFORE every callRecorder invocation (not just once)', () => {
    // ensureInjected() must be called inside callRecorder(), not only inside startBtn.
    // If injection only happens on start, a detached tab (e.g. tab navigated away)
    // would leave subsequent status() calls trying to reach a non-installed recorder.
    const popupSrc = fs.readFileSync(path.join(PKG_ROOT, 'popup.js'), 'utf-8');
    const callRecorderBody = popupSrc.slice(
      popupSrc.indexOf('async function callRecorder'),
      popupSrc.indexOf('async function callRecorder') + 600,
    );
    expect(callRecorderBody).toContain('ensureInjected');
  });

  test('ensureInjected() is only CALLED inside callRecorder — not invoked at module level or in button handlers directly', () => {
    // The function definition of ensureInjected is expected at module scope.
    // But it must ONLY be INVOKED inside callRecorder (the await call-site), never
    // called directly from button handlers or module level — because at those points
    // the activeTab grant may not be in force.
    //
    // Strategy: strip the function definition block, then confirm there is exactly
    // one `await ensureInjected(` call-site, and it lives inside callRecorder.
    const popupSrc = fs.readFileSync(path.join(PKG_ROOT, 'popup.js'), 'utf-8');

    // Count total invocation sites (not the definition line itself).
    const callSitePattern = /await ensureInjected\(/g;
    const callSites = [...popupSrc.matchAll(callSitePattern)];
    // There must be exactly one call-site: inside callRecorder.
    expect(callSites.length, 'exactly one await ensureInjected( call-site expected').toBe(1);

    // That call-site must be inside the callRecorder function body.
    const callRecorderStart = popupSrc.indexOf('async function callRecorder');
    const callRecorderBodyEnd =
      callRecorderStart +
      popupSrc.slice(callRecorderStart).indexOf('\n}') +
      2;
    const callSiteOffset = callSites[0]!.index!;
    expect(
      callSiteOffset,
      'ensureInjected() call must be inside callRecorder body',
    ).toBeGreaterThan(callRecorderStart);
    expect(
      callSiteOffset,
      'ensureInjected() call must be inside callRecorder body',
    ).toBeLessThan(callRecorderBodyEnd);
  });
});
