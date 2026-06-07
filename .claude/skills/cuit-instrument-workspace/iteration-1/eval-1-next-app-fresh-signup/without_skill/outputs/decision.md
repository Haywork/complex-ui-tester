# Decision

- **INVOKE SKILL**: NO — no CUIT-specific skill is loaded in this session. The closest available skills (`cuit-loop`, `cuit-instrument`) are not present in my current skill list, so I would proceed manually using the CUIT MCP server and documentation lookups.

- **REASONING**: The user is doing a fresh tenant onboarding for `cuit-saas`, which is a wiring/instrumentation task (SDK install, bearer-token config, recorder bridge, session shipping to warehouse) rather than a session-replay loop. Since the CUIT MCP server is already connected, I'd lean on it for tenant-specific config (ingest endpoint, project ID, schema expectations) rather than guessing, and use context7 for Next 16 / React 19 / Zustand integration specifics since those are recent versions where my training may be stale.

- **WHAT YOU'D DO NEXT**:
  1. Query the connected CUIT MCP server for the SpeechLab tenant's ingest endpoint, project ID, and the recommended SDK package + version for a Next 16 / React 19 app — and confirm the exact env var names the SDK expects for the bearer token (so the 1Password `cuit-pilot-token` secret lands in the right place, ideally server-side only, not `NEXT_PUBLIC_*`).
  2. Inspect `/Users/ryanmedlin/speechlab/translate-ui-react` (package.json, `app/` layout, Zustand store locations, existing instrumentation/middleware) to pick the correct mount point — likely a client component in the root `app/layout.tsx` plus a Zustand middleware wrapper so store mutations are captured in session events.
  3. Install the CUIT SDK + recorder, wire `window.__cuitDebug` and the Zustand bridge, add the token to `.env.local` (gitignored) with a server-side proxy route if the SDK needs to ship from the browser, then trigger a smoke session and verify it lands in the warehouse via an MCP query.
