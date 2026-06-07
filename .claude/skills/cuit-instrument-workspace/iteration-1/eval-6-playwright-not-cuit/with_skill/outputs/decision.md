# Decision

- **DECISION:** NO
- **CONFIDENCE:** 5
- **REASONING:** The user is asking to set up Playwright with a basic config and a smoke test in a Next.js app. The `cuit-instrument` skill is specifically for wiring CUIT (Complex UI Tester) into a customer app: mounting `window.__cuitDebug`, installing the recorder bridge, setting up the CUIT GitHub Action, and verifying round-trip sessions via the CUIT MCP server. It is not a general Playwright setup tool, does not author Playwright config/specs, and requires the CUIT MCP server plus a tenant token — none of which the user mentioned. Invoking it would not satisfy the request.
- **FIRST 3 STEPS:**
  1. Confirm working directory `/Users/dev/my-app` exists, read its `package.json` to detect package manager (npm/pnpm/yarn) and Next.js version/router (app vs pages).
  2. Install Playwright as a dev dependency and run `npx playwright install` to fetch browsers; create `playwright.config.ts` at the project root with `baseURL: http://localhost:3000`, a `webServer` block running `next dev`, and a single `chromium` project.
  3. Create `tests/e2e/smoke.spec.ts` with a test that visits `/`, locates the login button via an accessible role (`getByRole('button', { name: /log in/i })` or a `data-testid`), clicks it, and asserts a navigation/URL or visible post-click state; add an `e2e` script to `package.json` and run it once to confirm green.
