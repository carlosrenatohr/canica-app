import { expect, test } from "@playwright/test";

test("browser tooling can render a page", async ({ page }) => {
  await page.setContent("<main><h1>canica</h1></main>");

  await expect(page.getByRole("heading", { name: "canica" })).toBeVisible();
});
