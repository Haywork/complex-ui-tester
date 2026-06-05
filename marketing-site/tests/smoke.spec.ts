import { test, expect, type ConsoleMessage } from "@playwright/test";

type ConsoleEntry = { type: string; text: string };

function attachConsoleSink(): { errors: ConsoleEntry[]; listener: (m: ConsoleMessage) => void } {
  const errors: ConsoleEntry[] = [];
  const listener = (msg: ConsoleMessage) => {
    if (msg.type() === "error") {
      errors.push({ type: msg.type(), text: msg.text() });
    }
  };
  return { errors, listener };
}

const IGNORABLE_CONSOLE = [
  /Download the React DevTools/i,
  /Failed to load resource.*favicon/i,
  /Failed to load resource.*404/i,
  // Dev-server only: Next.js HMR/turbopack websocket noise.
  /_next\/webpack-hmr/i,
  /_next\/turbopack-hmr/i,
  /WebSocket connection to/i,
  /\[Fast Refresh\]/i,
];

function filterConsoleNoise(entries: ConsoleEntry[]): ConsoleEntry[] {
  return entries.filter(
    (e) => !IGNORABLE_CONSOLE.some((re) => re.test(e.text))
  );
}

test.describe("home page (/)", () => {
  test("renders hero and 8 demo scene dots", async ({ page }) => {
    const { errors, listener } = attachConsoleSink();
    page.on("console", listener);

    const resp = await page.goto("/");
    expect(resp?.status(), "/ should respond 200").toBe(200);

    const headline = page.getByRole("heading", { level: 1 });
    await expect(headline).toContainText("Your AI tool ships UI changes");
    await expect(headline).toContainText("Make the regression spec land with it");

    for (let i = 1; i <= 8; i++) {
      await expect(page.getByTestId(`scene-dot-${i}`)).toBeVisible();
    }

    await page.waitForLoadState("networkidle").catch(() => {
      /* networkidle is best-effort */
    });
    expect(filterConsoleNoise(errors)).toEqual([]);
  });

  test("demo walkthrough advances via next button and arrow keys", async ({
    page,
  }) => {
    await page.goto("/");

    const nextButton = page.getByRole("button", { name: "Next scene" });

    const firstDot = page.getByTestId("scene-dot-1");
    await expect(firstDot).toHaveAttribute("aria-selected", "true");

    await nextButton.click();
    const secondDot = page.getByTestId("scene-dot-2");
    await expect(secondDot).toHaveAttribute("aria-selected", "true");

    await nextButton.click();
    const thirdDot = page.getByTestId("scene-dot-3");
    await expect(thirdDot).toHaveAttribute("aria-selected", "true");

    await page.keyboard.press("ArrowRight");
    const fourthDot = page.getByTestId("scene-dot-4");
    await expect(fourthDot).toHaveAttribute("aria-selected", "true");

    await page.keyboard.press("ArrowLeft");
    await expect(thirdDot).toHaveAttribute("aria-selected", "true");
  });

  test("deep-link ?scene=5 loads at scene 5", async ({ page }) => {
    await page.goto("/?scene=5");
    const fifth = page.getByTestId("scene-dot-5");
    await expect(fifth).toHaveAttribute("aria-selected", "true");
  });

  test("out-of-range ?scene=99 clamps to last scene (8)", async ({ page }) => {
    await page.goto("/?scene=99");
    const last = page.getByTestId("scene-dot-8");
    await expect(last).toHaveAttribute("aria-selected", "true");
  });
});

test.describe("/pricing", () => {
  test("renders 4 tier cards", async ({ page }) => {
    const { errors, listener } = attachConsoleSink();
    page.on("console", listener);

    const resp = await page.goto("/pricing");
    expect(resp?.status()).toBe(200);

    await expect(
      page.getByRole("heading", { name: /paying for the wrong problem/i, level: 1 })
    ).toBeVisible();

    for (const name of ["OSS", "Team", "Business", "Enterprise"]) {
      await expect(
        page.getByRole("heading", { name: new RegExp(`^${name}$`), level: 2 })
      ).toBeVisible();
    }

    // The new problem-led structure must be visible per card.
    await expect(page.locator("text=/You stop having to/i").first()).toBeVisible();
    await expect(page.locator("text=/You can now/i").first()).toBeVisible();

    expect(filterConsoleNoise(errors)).toEqual([]);
  });
});

test.describe("/docs", () => {
  test("links to all 12 numbered docs", async ({ page }) => {
    const { errors, listener } = attachConsoleSink();
    page.on("console", listener);

    const resp = await page.goto("/docs");
    expect(resp?.status()).toBe(200);

    for (let n = 1; n <= 12; n++) {
      const docNumber = String(n).padStart(2, "0");
      await expect(
        page.locator("text=" + docNumber).first()
      ).toBeVisible();
    }

    expect(filterConsoleNoise(errors)).toEqual([]);
  });
});

test.describe("/proof", () => {
  test("renders dev-grounded story with real artifacts", async ({ page }) => {
    const { errors, listener } = attachConsoleSink();
    page.on("console", listener);

    const resp = await page.goto("/proof");
    expect(resp?.status()).toBe(200);

    await expect(
      page.getByRole("heading", { name: /The loop runs/i, level: 1 })
    ).toBeVisible();

    // Real artifact content must be present.
    await expect(page.locator("text=/segment-collision\\.json/").first()).toBeVisible();
    await expect(page.locator("text=/dispatchDrag/").first()).toBeVisible();
    await expect(page.locator("text=/RED to GREEN/").first()).toBeVisible();
    await expect(page.locator("text=/pnpm proof:loop/").first()).toBeVisible();

    // The agentic-loop content must be on the page too.
    await expect(
      page.getByRole("heading", { name: /agentic coding can write uis/i, level: 2 })
    ).toBeVisible();
    await expect(page.locator("text=/AGENT LOOP CLOSED/").first()).toBeVisible();

    expect(filterConsoleNoise(errors)).toEqual([]);
  });
});

test.describe("home page (/) agentic loop", () => {
  test("renders the AgenticLoop section with the closed-loop log", async ({ page }) => {
    await page.goto("/");
    await expect(
      page.getByRole("heading", { name: /agentic coding can write uis/i, level: 2 })
    ).toBeVisible();
    await expect(page.locator("text=/AGENT LOOP CLOSED/").first()).toBeVisible();
    await expect(page.locator("text=/pnpm proof:agent-loop/").first()).toBeVisible();
  });
});

test.describe("home page (/) two flows + comparison", () => {
  test("renders the TwoFlows section with both Flow A and Flow B", async ({ page }) => {
    await page.goto("/");
    await expect(
      page.getByRole("heading", { name: /lock in what works/i, level: 2 })
    ).toBeVisible();
    await expect(page.locator("text=/Flow A.*reactive/i").first()).toBeVisible();
    await expect(page.locator("text=/Flow B.*proactive/i").first()).toBeVisible();
    // The actual decision logic from the skill must be visible.
    await expect(page.locator("text=/Flow A.*bug reproduction/i").first()).toBeVisible();
    await expect(page.locator("text=/Flow B.*baseline lock-in/i").first()).toBeVisible();
  });

  test("renders the Comparison section naming the alternatives", async ({ page }) => {
    await page.goto("/");
    await expect(
      page.getByRole("heading", { name: /all of these work/i, level: 2 })
    ).toBeVisible();
    for (const alt of [
      "Playwright tests written by hand",
      "Claude Code / Codex writes the Playwright test for you",
      "Agent driving a real browser",
      "Session replay vendors",
      "Screenshot diff testing",
    ]) {
      await expect(page.locator(`text=${alt}`).first()).toBeVisible();
    }
  });
});

test.describe("home page (/) recorder alpha", () => {
  test("renders the RecorderAlpha section with download link, example capture, and agent invocation", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(
      page.getByRole("heading", { name: /Download the recorder/i, level: 2 })
    ).toBeVisible();
    // Real captured JSON content visible on the page.
    await expect(page.locator("text=/cuit-session-/i").first()).toBeVisible();
    // Claude Code / agent invocation snippet visible.
    await expect(page.locator("text=/\\/cuit-loop/i").first()).toBeVisible();
    // Download link present.
    const downloadLinks = page.locator('a[href="/downloads/cuit-recorder-alpha.zip"]');
    await expect(downloadLinks.first()).toBeVisible();
  });

  test("download link serves the zip with a binary content-type", async ({ page }) => {
    const response = await page.request.get("/downloads/cuit-recorder-alpha.zip");
    expect(response.status()).toBe(200);
    const ct = response.headers()["content-type"] ?? "";
    expect(ct).toMatch(/zip|octet-stream/i);
    // Sanity: the zip should be at least a few KB.
    const body = await response.body();
    expect(body.length).toBeGreaterThan(4000);
    // PK signature — every valid zip starts with these bytes.
    expect(body[0]).toBe(0x50);
    expect(body[1]).toBe(0x4b);
  });
});

test.describe("/security", () => {
  test("renders headline and request-packet CTA", async ({ page }) => {
    const { errors, listener } = attachConsoleSink();
    page.on("console", listener);

    const resp = await page.goto("/security");
    expect(resp?.status()).toBe(200);

    await expect(
      page.getByRole("heading", {
        name: /security posture is the product/i,
        level: 1,
      })
    ).toBeVisible();

    await expect(
      page.getByRole("button", { name: /Request the security packet/i })
    ).toBeVisible();

    expect(filterConsoleNoise(errors)).toEqual([]);
  });
});

test.describe("accessibility basics", () => {
  test("home page has skip-able landmark structure", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("header[role='banner']")).toBeVisible();
    await expect(page.locator("main#main-content")).toBeVisible();
    await expect(page.locator("footer[role='contentinfo']")).toBeVisible();
  });
});
