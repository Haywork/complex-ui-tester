export type { AxEnvelope, AxOutcome } from './envelope.js';
export { ok, err, wrap } from './envelope.js';

export { generateSpecTool } from './tools/generate-spec.js';
export type { GenerateSpecInput, GenerateSpecData } from './tools/generate-spec.js';

export { runSpecTool } from './tools/run-spec.js';
export type { RunSpecInput, RunSpecData, StateMismatch, SnapshotProvider } from './tools/run-spec.js';

export { detectAppShapeTool } from './tools/detect-app-shape.js';
export type { DetectAppShapeInput, DetectAppShapeData } from './tools/detect-app-shape.js';

export { closeLoopTool } from './tools/close-loop.js';
export type { CloseLoopInput, CloseLoopData, CloseLoopStep } from './tools/close-loop.js';

/** MCP tool descriptor table — data only, no SDK import required. */
export const TOOL_DESCRIPTORS = [
  {
    name: 'cuit__detect_app_shape',
    title: 'Detect app shape',
    description:
      'Scan a project directory, parse package.json, and infer framework/state-lib/cuitDebug wiring.',
    inputSchema: {
      type: 'object',
      properties: {
        dir: { type: 'string', description: 'Absolute path to the project root.' },
      },
      required: ['dir'],
    },
  },
  {
    name: 'cuit__generate_spec_from_session',
    title: 'Generate spec from session',
    description:
      'Normalize a Jam or CUIT session and generate a Vitest spec via @haywork/cuit-spec-gen.',
    inputSchema: {
      type: 'object',
      properties: {
        session: { type: 'object', description: 'Raw session object.' },
      },
      required: ['session'],
    },
  },
  {
    name: 'cuit__run_spec',
    title: 'Run spec',
    description:
      'Execute a generated spec against the replay-oracle snapshot provider. Returns pass/fail + mismatch detail.',
    inputSchema: {
      type: 'object',
      properties: {
        spec: { type: 'object', description: 'GeneratedSpec object.' },
      },
      required: ['spec'],
    },
  },
  {
    name: 'cuit__close_loop',
    title: 'Close loop',
    description:
      'Run the full normalize → generate → run → report pipeline locally. Zero network.',
    inputSchema: {
      type: 'object',
      properties: {
        session: { type: 'object', description: 'Raw session object.' },
      },
      required: ['session'],
    },
  },
] as const;
