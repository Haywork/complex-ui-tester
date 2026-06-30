import type { SessionEvent } from '@haywork/cuit-types';
import { generateSpec, serializeSpec } from '@haywork/cuit-spec-gen';
import type { GeneratedSpec } from '@haywork/cuit-types';
import { ok, err, wrap, type AxEnvelope } from '../envelope.js';

export type RawJamSession = {
  sessionId: string;
  vendor: string;
  createdAt: string;
  browser?: Record<string, unknown>;
  viewport?: Record<string, unknown>;
  url: string;
  events: unknown[];
};

export type RawCuitSession = {
  sessionId: string;
  vendor: string;
  createdAt: number;
  url: string;
  events: unknown[];
};

export type CuitSession = {
  vendor: 'cuit';
  events: SessionEvent[];
  url?: string;
  sessionId?: string;
};

export type GenerateSpecInput =
  | { vendor: 'jam'; session: RawJamSession }
  | { vendor: 'cuit'; events: SessionEvent[] }
  | { session: RawJamSession | RawCuitSession | CuitSession };

export type GenerateSpecData = {
  spec: GeneratedSpec;
  serialized: string;
};

const JAM_ADAPTER = '@haywork/adapter-jam';
const CUIT_ADAPTER = '@haywork/adapter-cuit';

async function loadJamAdapter(): Promise<{
  normalizeJamSession: (raw: RawJamSession) => SessionEvent[];
}> {
  try {
    return await import(JAM_ADAPTER);
  } catch {
    throw new Error(
      `Jam sessions require optional package ${JAM_ADAPTER}. Install it or pass a CUIT recorder session instead.`,
    );
  }
}

async function loadCuitAdapter(): Promise<{
  normalizeCuitSession: (raw: RawCuitSession) => SessionEvent[];
}> {
  try {
    return await import(CUIT_ADAPTER);
  } catch {
    throw new Error(
      `Raw CUIT session files require optional package ${CUIT_ADAPTER}. Pass typed SessionEvent[] from @haywork/cuit-recorder instead.`,
    );
  }
}

function isTypedSessionEvents(events: unknown[]): events is SessionEvent[] {
  return (
    events.length > 0 &&
    typeof events[0] === 'object' &&
    events[0] !== null &&
    'type' in events[0]
  );
}

/**
 * Normalize an incoming session to SessionEvent[].
 * Vendor adapters are loaded on demand so install stays minimal for OSS recorder flows.
 */
export async function resolveSessionEvents(
  input: GenerateSpecInput | { session: RawJamSession | RawCuitSession | CuitSession },
): Promise<SessionEvent[]> {
  if ('vendor' in input && input.vendor === 'jam') {
    const { normalizeJamSession } = await loadJamAdapter();
    return normalizeJamSession(input.session);
  }

  if ('session' in input) {
    const session = input.session;
    if (session.vendor === 'jam') {
      const { normalizeJamSession } = await loadJamAdapter();
      return normalizeJamSession(session as RawJamSession);
    }
    if (session.vendor === 'cuit' && isTypedSessionEvents(session.events)) {
      return session.events;
    }
    const { normalizeCuitSession } = await loadCuitAdapter();
    return normalizeCuitSession(session as RawCuitSession);
  }

  if ('vendor' in input && input.vendor === 'cuit') {
    return input.events;
  }

  return (input as { events: SessionEvent[] }).events;
}

/**
 * Normalize an incoming session and generate a Vitest spec via @haywork/cuit-spec-gen.
 *
 * - vendor==='jam' → optional @haywork/adapter-jam
 * - vendor==='cuit' with SessionEvent[] → pass-through (OSS recorder path)
 * - raw CUIT session JSON → optional @haywork/adapter-cuit
 */
export async function generateSpecTool(
  input: GenerateSpecInput,
): Promise<AxEnvelope<GenerateSpecData>> {
  return wrap(async () => {
    const events = await resolveSessionEvents(input);

    if (events.length === 0) {
      return err(
        'Cannot generate spec from empty event list — no events were provided. Ensure the session contains at least one interaction.',
        ['Record a session with pointer events and state snapshots, then retry.'],
      );
    }

    let spec: GeneratedSpec;
    try {
      spec = generateSpec(events);
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : String(caught);
      return err(
        `spec-gen error: ${message}`,
        [
          'Ensure the session contains a pointer-down event and at least one state-snapshot. Then retry with cuit__generate_spec_from_session.',
        ],
      );
    }

    const serialized = serializeSpec(spec);

    return ok(
      `Spec generated: "${spec.testName}"`,
      { spec, serialized },
      [
        'Run cuit__run_spec with the generated spec and a snapshotProvider to validate.',
        'Or run cuit__close_loop to execute the full pipeline in one call.',
      ],
    );
  });
}
