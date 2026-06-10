# @cuit/recorder

Runtime recorder for CUIT session capture. Intercepts pointer events, state snapshots, navigation, and — optionally — console output and uncaught errors, then serialises them into a `RecordedSession` that spec-gen can replay.

## Installation

```bash
pnpm add @cuit/recorder
```

## Basic usage

```ts
import { Recorder } from '@cuit/recorder';

const rec = new Recorder({ sessionId: 'my-session' });
rec.start();
// … user interactions happen …
rec.stop();
const session = rec.export();
```

## Console + error capture

### Options

| Option | Type | Default | Description |
|---|---|---|---|
| `captureConsole` | `boolean` | `true` | Monkey-patches `console.log/info/warn/error/debug` during the session. Each call is forwarded to the original method (output is never suppressed) and also pushed as a `ConsoleEvent` (`type: 'console'`). |
| `captureErrors` | `boolean` | `true` | Installs `window` listeners for `'error'` (uncaught exceptions) and `'unhandledrejection'`. Each fires an `ErrorEvent` (`type: 'error-event'`) **and** a companion `ConsoleEvent` at level `'error'` so downstream consumers that filter by `type: 'console'` see window errors too. |
| `redactConsoleArg` | `(arg: unknown) => unknown` | `undefined` | Optional hook applied to every console argument **before** serialisation. Use it to strip secrets (see PII guidance below). |

### How `captureConsole` works

When `captureConsole: true` (the default), `start()` replaces each console method with a thin wrapper that:

1. Calls through to the **original** method immediately so output reaches the DevTools console unchanged.
2. Serialises the arguments (capped at 10 per call; individual strings truncated at 2 000 characters with a `…` suffix; overflow annotated with `+N more`).
3. Applies `redactConsoleArg` if provided.
4. Pushes a `ConsoleEvent` onto the event list with fields `level`, `message` (space-joined args), and `args` (serialised string array).

A re-entrancy guard prevents infinite recursion: if `redactConsoleArg` or `safeStringifyArg` itself triggers a console call, the nested call is forwarded to the original but not recorded a second time.

`stop()` restores every console method to the **exact original function reference** it held before `start()` was called — the reference is saved as an unbound value so identity checks (`console.log === savedRef`) pass after teardown.

### How `captureErrors` works

When `captureErrors: true` (the default) and a `document` with a live `defaultView` window is available:

- `window 'error'` — produces an `ErrorEvent` (`source: 'window.error'`) plus a companion `ConsoleEvent` at `level: 'error'`. The `stack` field is populated when the native `Error` object is present on the event.
- `window 'unhandledrejection'` — produces an `ErrorEvent` (`source: 'unhandledrejection'`) plus a companion `ConsoleEvent`. `message` is the rejection reason's `.message` when the reason is an `Error`, otherwise `String(reason)`.

Both listeners are registered in the internal teardown list so `stop()` removes them along with pointer listeners.

### The redaction hook

`redactConsoleArg` is called once per argument per console call, **before** the value is serialised to a string. It receives the raw argument and must return the sanitised replacement. The replacement is then serialised using the same length-capped logic as non-redacted args.

```ts
const rec = new Recorder({
  sessionId: 'my-session',
  redactConsoleArg: (arg) => {
    if (typeof arg !== 'string') return arg;
    // Strip API keys of the form sk-<alphanumeric>
    return arg.replace(/sk-[a-z0-9]+/gi, '[REDACTED]');
  },
});
```

The hook runs synchronously inside the console wrapper, so keep it fast. Throwing inside the hook is safe — the recorder wraps the entire capture path in a try/finally to prevent any error from suppressing the original console output.

### The `assertNoConsoleErrors` assertion (harness)

`@cuit/harness` exports `captureConsoleErrors`, `assertNoConsoleErrors`, and `restoreConsoleErrors`. These are separate from the recorder and used inside generated Playwright/Vitest specs:

```ts
import {
  captureConsoleErrors,
  assertNoConsoleErrors,
  restoreConsoleErrors,
} from '@cuit/harness';

test('drag must not log errors', () => {
  captureConsoleErrors(); // intercepts console.error for this test

  dispatchDrag('seg-0', 100, 0);

  assertNoConsoleErrors(); // throws if any console.error was captured
  restoreConsoleErrors();  // always restore — cleanup must follow assert
});
```

`spec-gen` emits this triplet automatically when the recorded session contains a `console.error` or `error-event` that straddles the interaction window (ts between pointer-down and pointer-up, inclusive). `restoreConsoleErrors()` is always placed **after** `assertNoConsoleErrors()` so a real failure is never silenced.

### PII and secrets guidance

Console arguments are serialised verbatim unless `redactConsoleArg` strips them first. Before enabling `captureConsole` in production or in sessions that will be stored server-side, review what your application logs:

- **API keys / bearer tokens** — strip with a regex before they reach `args` (see example above).
- **User emails and names** — mask or hash if the session will be shared across tenant boundaries.
- **Passwords / auth tokens** — never logged intentionally, but guard against accidental `console.log(authState)` dumps by checking for common field names: `token`, `password`, `secret`, `authorization`.
- **Credit card / PAN data** — replace with a fixed placeholder; do not truncate (partial PANs can still be sensitive).

The `redactConsoleArg` hook is the only interception point. There is no post-hoc scrubbing once an event is pushed — redaction must happen before serialisation.

For sessions stored in the CUIT SaaS warehouse, configure `redactConsoleArg` at the bridge level:

```ts
mountTranslateUiReactBridge({
  apiUrl: process.env.NEXT_PUBLIC_CUIT_API_URL,
  tenantToken: process.env.NEXT_PUBLIC_CUIT_TOKEN,
  sessionId: `tur-${Date.now()}`,
  redactConsoleArg: myOrgRedactor,  // applied by the underlying Recorder
});
```

`TranslateUiReactBridgeOptions` does not yet expose `redactConsoleArg` directly — pass it via a custom `Recorder` instance and the bridge's `captureConsole`/`captureErrors` toggles if you need both bridge convenience and redaction today.
