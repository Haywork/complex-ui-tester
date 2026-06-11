export type AxOutcome = 'ok' | 'error';

export type AxEnvelope<T> = {
  outcome: AxOutcome;
  summary: string;
  data: T | null;
  next_actions: string[];
};

export function ok<T>(summary: string, data: T, next_actions: string[]): AxEnvelope<T> {
  return { outcome: 'ok', summary, data, next_actions };
}

export function err<T = null>(summary: string, next_actions: string[]): AxEnvelope<T> {
  return { outcome: 'error', summary, data: null as unknown as T, next_actions };
}

/**
 * Wrap a synchronous or async function so that any thrown error is caught and
 * converted into an outcome:'error' AX envelope. Handlers never throw out of
 * the tool boundary.
 *
 * The return type is `AxEnvelope<T>`. On the error path `data` is `null`, which
 * satisfies `T | null` — callers should check `outcome === 'ok'` before reading
 * `data`. The cast on the error branch is intentional: the `err()` helper always
 * returns `data: null`, which is `null extends T ? T : never` — safe for all T
 * used here (the callers' T are always reference types, never `null` itself).
 */
export async function wrap<T>(
  fn: () => AxEnvelope<T> | Promise<AxEnvelope<T>>,
): Promise<AxEnvelope<T>> {
  try {
    return await fn();
  } catch (caught) {
    const message =
      caught instanceof Error ? caught.message : String(caught);
    return {
      outcome: 'error',
      summary: `Tool error: ${message}`,
      data: null as unknown as T,
      next_actions: ['Review the error summary and retry with a corrected input.'],
    };
  }
}
