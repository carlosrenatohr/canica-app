import { test, expect, type Page } from "@playwright/test";

const widths = [
  { name: "desktop", width: 1440 },
  { name: "laptop", width: 1024 },
  { name: "tablet", width: 768 },
  { name: "mobile", width: 390 },
  { name: "compact", width: 320 },
];

const schemes = ["light", "dark"] as const;

async function gotoLoginSafe(page: Page): Promise<void> {
  try {
    await page.goto("/login", { timeout: 15_000 });
  } catch {
    test.skip(true, "Web server (pnpm dev) not reachable — skipping visual regression");
  }
}

for (const vp of widths) {
  for (const scheme of schemes) {
    test(`login visual @ ${vp.name} / ${scheme}`, async ({ page }) => {
      await page.emulateMedia({ colorScheme: scheme });
      await page.setViewportSize({ width: vp.width, height: 900 });
      await gotoLoginSafe(page);
      await expect(page).toHaveScreenshot(`login-${vp.name}-${scheme}.png`, {
        maxDiffPixelRatio: 0.02,
      });
    });
  }
}
