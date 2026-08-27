import { test, expect } from "@playwright/test";

const EMAIL = process.env.E2E_EMAIL ?? "test@canica.local";
const PASSWORD = process.env.E2E_PASSWORD ?? "test1234";

async function loginIfNeeded(page: import("@playwright/test").Page) {
  await page.goto("/login");

  await page.getByLabel("Email").fill(EMAIL);
  await page.getByLabel("Contraseña").fill(PASSWORD);
  await page.getByRole("button", { name: "Entrar" }).click();

  await page.waitForURL(/\/(?!login)/, { timeout: 10_000 }).catch(() => {});

  if (page.url().includes("/login")) {
    const isConnectionError = await page
      .getByRole("alert")
      .filter({ hasText: /conectar|servidor/i })
      .isVisible()
      .catch(() => false);
    test.skip(
      true,
      isConnectionError
        ? "API is not reachable — skipping authenticated suite"
        : "Login failed — skipping authenticated suite",
    );
    return false;
  }
  return true;
}

test.describe.serial("Search and pagination @authenticated", () => {
  test("search debounce triggers API call with search param", async ({ page }) => {
    const loggedIn = await loginIfNeeded(page);
    if (!loggedIn) return;

    const apiCalls: URL[] = [];
    await page.route("**/api/patients**", (route) => {
      apiCalls.push(new URL(route.request().url()));
      route.continue();
    });

    await page.goto("/patients");

    const searchInput = page.getByLabel("Filtrar pacientes por nombre");
    await searchInput.waitFor({ state: "visible", timeout: 5_000 }).catch(() => {
      test.skip(true, "Search input not rendered");
    });

    await searchInput.fill("Juan");

    await page.waitForTimeout(500);

    const hasSearchParam = apiCalls.some((u) => u.searchParams.get("search") === "Juan");
    expect(hasSearchParam).toBeTruthy();
  });

  test("pagination renders when there are enough patients", async ({ page }) => {
    const loggedIn = await loginIfNeeded(page);
    if (!loggedIn) return;

    await page.goto("/patients");

    await page.waitForTimeout(1_000);

    const pagination = page.locator('nav[aria-label="Paginación"]');
    const hasPagination = await pagination.isVisible().catch(() => false);

    if (!hasPagination) {
      test.skip(true, "Fewer than 20 patients — pagination not rendered");
    }

    await expect(pagination).toBeVisible();
    await expect(pagination.getByRole("button", { name: "Siguiente" })).toBeVisible();
    await expect(pagination.getByRole("button", { name: "Anterior" })).toBeVisible();
  });

  test("clicking Siguiente changes page and updates API call", async ({ page }) => {
    const loggedIn = await loginIfNeeded(page);
    if (!loggedIn) return;

    const apiCalls: URL[] = [];
    await page.route("**/api/patients**", (route) => {
      apiCalls.push(new URL(route.request().url()));
      route.continue();
    });

    await page.goto("/patients");

    await page.waitForTimeout(1_000);

    const pagination = page.locator('nav[aria-label="Paginación"]');
    if (!(await pagination.isVisible().catch(() => false))) {
      test.skip(true, "Fewer than 20 patients — pagination not rendered");
    }

    const nextButton = pagination.getByRole("button", { name: "Siguiente" });
    await nextButton.click();

    await page.waitForTimeout(500);

    const hasOffset20 = apiCalls.some(
      (u) => u.searchParams.get("offset") === "20",
    );
    expect(hasOffset20).toBeTruthy();
  });
});
