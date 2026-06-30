import { readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { ok, err, wrap, type AxEnvelope } from '../envelope.js';

export type DetectAppShapeData = {
  framework: 'next' | 'react' | 'vue' | 'svelte' | 'vanilla';
  stateLib: 'redux' | 'zustand' | 'jotai' | 'valtio' | 'unknown';
  cuitDebugWired: boolean;
  packageName: string | null;
};

export type DetectAppShapeInput = {
  dir: string;
};

type PackageJson = {
  name?: string;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
};

/**
 * Infer the frontend framework from the combined dep list.
 * Priority: next > react > vue > svelte > vanilla.
 */
function inferFramework(
  allDeps: Record<string, string>,
): DetectAppShapeData['framework'] {
  if ('next' in allDeps) return 'next';
  if ('react' in allDeps) return 'react';
  if ('vue' in allDeps) return 'vue';
  if ('svelte' in allDeps) return 'svelte';
  return 'vanilla';
}

/**
 * Infer the state management library from the combined dep list.
 */
function inferStateLib(
  allDeps: Record<string, string>,
): DetectAppShapeData['stateLib'] {
  if ('redux' in allDeps || '@reduxjs/toolkit' in allDeps) return 'redux';
  if ('zustand' in allDeps) return 'zustand';
  if ('jotai' in allDeps) return 'jotai';
  if ('valtio' in allDeps) return 'valtio';
  return 'unknown';
}

/**
 * Recursively search a directory tree for files containing `window.__cuitDebug`.
 * Returns true as soon as any match is found, false otherwise.
 * Silently skips unreadable files/directories.
 */
async function searchDirForCuitDebug(dir: string): Promise<boolean> {
  let entries: string[];
  try {
    entries = await readdir(dir);
  } catch {
    return false;
  }

  for (const name of entries) {
    const fullPath = join(dir, name);
    // Try file first; if it's a directory, recurse
    let content: string;
    try {
      content = await readFile(fullPath, 'utf-8');
      if (content.includes('window.__cuitDebug')) return true;
    } catch {
      // Likely a directory or unreadable file — try recursing
      if (await searchDirForCuitDebug(fullPath)) return true;
    }
  }
  return false;
}

/**
 * Scan a project directory, parse package.json, and infer framework /
 * state-lib / cuitDebug wiring into an AX envelope.
 *
 * - Missing package.json → safe fallback (vanilla, unknown, false).
 * - Never throws — all errors are returned as envelopes.
 */
export async function detectAppShapeTool(
  input: DetectAppShapeInput,
): Promise<AxEnvelope<DetectAppShapeData>> {
  return wrap(async () => {
    const { dir } = input;
    const pkgPath = join(dir, 'package.json');

    let pkgJson: PackageJson | null = null;
    try {
      const raw = await readFile(pkgPath, 'utf-8');
      pkgJson = JSON.parse(raw) as PackageJson;
    } catch {
      // ENOENT or JSON parse error — fall through to vanilla defaults.
    }

    if (pkgJson === null) {
      const data: DetectAppShapeData = {
        framework: 'vanilla',
        stateLib: 'unknown',
        cuitDebugWired: false,
        packageName: null,
      };
      return ok(
        'No package.json found — defaulting to vanilla/unknown. Wire window.__cuitDebug to enable CUIT.',
        data,
        [
          'Add a package.json with your framework dependency.',
          'Wire window.__cuitDebug = { getState: () => yourStore.getState() } in your app entry point.',
          'Then re-run cuit__detect_app_shape.',
        ],
      );
    }

    const allDeps: Record<string, string> = {
      ...(pkgJson.dependencies ?? {}),
      ...(pkgJson.devDependencies ?? {}),
    };

    const framework = inferFramework(allDeps);
    const stateLib = inferStateLib(allDeps);

    // Search src/ subdirectory first, then root files for __cuitDebug
    const srcDir = join(dir, 'src');
    const cuitDebugWired =
      (await searchDirForCuitDebug(srcDir)) ||
      (await searchDirForCuitDebug(dir));
    const packageName = pkgJson.name ?? null;

    const data: DetectAppShapeData = {
      framework,
      stateLib,
      cuitDebugWired,
      packageName,
    };

    const next_actions: string[] = cuitDebugWired
      ? [
          `App shape detected: ${framework} + ${stateLib}. window.__cuitDebug is wired.`,
          'Record a session with the @haywork/recorder-extension or @haywork/cuit-recorder npm module.',
          'Then run cuit__generate_spec_from_session with the recorded session.',
        ]
      : [
          `App shape detected: ${framework} + ${stateLib}. window.__cuitDebug is NOT wired.`,
          `Wire window.__cuitDebug = { getState: () => <yourStore>.getState() } in your app entry point.`,
          'Re-run cuit__detect_app_shape to verify, then record a session.',
        ];

    return ok(
      `Detected: framework=${framework}, stateLib=${stateLib}, cuitDebugWired=${String(cuitDebugWired)}`,
      data,
      next_actions,
    );
  });
}
