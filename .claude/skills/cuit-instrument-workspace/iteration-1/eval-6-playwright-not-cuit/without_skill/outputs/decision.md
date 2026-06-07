# Decision

- **INVOKE SKILL:** NO

- **REASONING:** The user explicitly asked for Playwright setup in a Next.js app — this is a standard Playwright scaffolding task, not a CUIT (Complex UI Tester) instrumentation task. The `cuit-instrument` skill is for wiring CUIT recorder/debug bridges into a customer app, and `cuit-loop` is for converting recorded CUIT session JSON into specs. Neither applies here: there is no CUIT session, no recorder extension involvement, and no agentic feedback loop being closed. Invoking a CUIT skill would add irrelevant scaffolding (window.__cuitDebug, GitHub Action, recorder bridge) the user did not request.

- **WHAT YOU'D DO NEXT:**
  1. Verify the target directory `/Users/dev/my-app` exists and inspect its `package.json` to confirm Next.js version and package manager (npm/pnpm/yarn).
  2. Install Playwright (`npm init playwright@latest` or equivalent) and generate a minimal `playwright.config.ts` configured with `baseURL: http://localhost:3000` and a `webServer` block that runs `next dev` (or `next start` against a prebuilt app) so tests boot the Next.js server automatically.
  3. Write `tests/smoke.spec.ts` that navigates to `/`, asserts the page loads, and clicks the login button via an accessible selector (`getByRole('link'|'button', { name: /log ?in/i })`); add an `npm test:e2e` script and run it once to confirm green.
