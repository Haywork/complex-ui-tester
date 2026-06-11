import { test, expect } from "@playwright/test";

/**
 * Visual-regression smoke — the UI feedback loop for our OWN site.
 *
 * Catches the class of breakage that shipped before: washed-out/wrong theme,
 * a broken or doubled logo, an overflowing/clipping hero, palette drift. Each
 * key route's above-the-fold viewport is screenshotted and diffed against a
 * committed baseline. A diff fails CI before a broken render reaches anyone.
 *
 * Above-the-fold (viewport, not fullPage) is deliberate: it's the highest-signal,
 * lowest-flake region — it's where theme + hero + nav + logo all live, and it
 * doesn't drift every time body copy below the fold is edited.
 *
 * Regenerate baselines intentionally after a design change:
 *   pnpm exec playwright test visual.spec.ts --update-snapshots
 */

const ROUTES = [
  { path: "/", name: "home" },
  { path: "/signup", name: "signup" },
  { path: "/quickstart", name: "quickstart" },
  { path: "/pricing", name: "pricing" },
  { path: "/examples/claude-code-workflows", name: "examples" },
];

test.describe("visual regression — above the fold", () => {
  for (const route of ROUTES) {
    test(`${route.name} (${route.path}) matches baseline`, async ({ page }) => {
      const resp = await page.goto(route.path);
      expect(resp?.status(), `${route.path} should respond 200`).toBe(200);

      // Settle fonts + initial paint so the diff is deterministic.
      await page.waitForLoadState("networkidle").catch(() => {});
      await page.evaluate(() => document.fonts?.ready);

      await expect(page).toHaveScreenshot(`${route.name}-abovefold.png`, {
        animations: "disabled", // freeze CSS animations/transitions
        // Tolerate sub-pixel AA noise; fail on real layout/theme changes.
        maxDiffPixelRatio: 0.01,
      });
    });
  }
});

test.describe("theme guard — dark is the canonical default", () => {
  test("home renders on the dark canvas, not the washed-out light theme", async ({
    page,
  }) => {
    await page.goto("/");
    // The bug that shipped: theme defaulted to light on system preference.
    // The <html> must NOT carry the .light class by default.
    const hasLight = await page.evaluate(() =>
      document.documentElement.classList.contains("light")
    );
    expect(hasLight, "html.light must not be set by default").toBe(false);

    // And the body background must be a dark near-black, not near-white.
    const bg = await page.evaluate(() => {
      const c = getComputedStyle(document.body).backgroundColor;
      const m = c.match(/\d+/g)?.map(Number) ?? [255, 255, 255];
      return m[0] + m[1] + m[2]; // sum of RGB; dark ≪ light
    });
    expect(bg, "body background should be dark (low RGB sum)").toBeLessThan(150);
  });
});
