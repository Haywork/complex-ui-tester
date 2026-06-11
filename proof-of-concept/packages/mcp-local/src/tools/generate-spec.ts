import type { SessionEvent } from '@cuit/types';
import { normalizeJamSession, type RawJamSession } from '@cuit/adapter-jam';
import { generateSpec, serializeSpec } from '@cuit/spec-gen';
import type { GeneratedSpec } from '@cuit/types';
import { ok, err, wrap, type AxEnvelope } from '../envelope.js';

export type GenerateSpecInput =
  | { vendor: 'jam'; session: RawJamSession }
  | { vendor: 'cuit'; events: SessionEvent[] }
  | { session: RawJamSession | { vendor: string; events: SessionEvent[]; url?: string } };

export type GenerateSpecData = {
  spec: GeneratedSpec;
  serialized: string;
};

/**
 * Normalize an incoming session and generate a Vitest spec via @cuit/spec-gen.
 *
 * - vendor==='jam' raw sessions are normalized via @cuit/adapter-jam.
 * - All other vendor values are assumed to already carry typed SessionEvent[].
 * - An empty events array returns outcome:'error' instead of throwing.
 */
export async function generateSpecTool(
  input: GenerateSpecInput,
): Promise<AxEnvelope<GenerateSpecData>> {
  return wrap(() => {
    let events: SessionEvent[];

    // Determine the session object and whether normalization is needed.
    if ('vendor' in input && input.vendor === 'jam') {
      // Explicit jam branch
      events = normalizeJamSession(input.session);
    } else if ('session' in input) {
      const session = input.session as RawJamSession | { vendor: string; events: unknown[]; url?: string };
      if (session.vendor === 'jam') {
        events = normalizeJamSession(session as RawJamSession);
      } else {
        // Pre-typed cuit (or other) session — treat events as already SessionEvent[]
        events = (session.events as SessionEvent[]);
      }
    } else if ('vendor' in input && input.vendor === 'cuit') {
      events = input.events;
    } else {
      // Fallback: treat as pre-typed
      events = (input as unknown as { events: SessionEvent[] }).events;
    }

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
