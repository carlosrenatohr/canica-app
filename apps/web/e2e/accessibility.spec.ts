import { test, expect } from "@playwright/test";

test.describe("Accessibility @accessibility", () => {
  test("keyboard navigation moves focus through login form", async ({ page }) => {
    await page.goto("/login");

    const emailInput = page.getByLabel("Email");
    const passwordInput = page.getByLabel("Contraseña");
    const submitButton = page.getByRole("button", { name: "Entrar" });

    await emailInput.focus();
    await expect(emailInput).toBeFocused();

    await page.keyboard.press("Tab");
    await expect(passwordInput).toBeFocused();

    await page.keyboard.press("Tab");
    await expect(submitButton).toBeFocused();
  });

  test("skip navigation link exists in the DOM", async ({ page }) => {
    await page.goto("/patients");

    const skipLink = page.locator('a[href="#main-content"]').first();
    await expect(skipLink).toHaveCount(1);

    const text = await skipLink.textContent();
    expect(text).toContain("Saltar al contenido principal");
  });

  test("login form inputs have accessible labels", async ({ page }) => {
    await page.goto("/login");

    const heading = page.getByRole("heading", { name: "Iniciar sesión" });
    await expect(heading).toBeVisible();

    const emailInput = page.getByLabel("Email");
    await expect(emailInput).toBeVisible();

    const passwordInput = page.getByLabel("Contraseña");
    await expect(passwordInput).toBeVisible();
  });

  test("session timeout dialog has proper ARIA attributes", async ({ page }) => {
    await page.goto("/patients");

    const needsLogin = await page
      .getByText(/Debes iniciar sesión/i)
      .isVisible()
      .catch(() => false);
    test.skip(needsLogin, "Not authenticated — session timeout not present");

    const dialog = page.locator('[role="alertdialog"]');
    if (!(await dialog.isVisible().catch(() => false))) {
      test.skip(true, "Session timeout dialog is not currently visible");
    }

    await expect(dialog).toHaveAttribute("aria-modal", "true");
    await expect(dialog).toHaveAttribute("aria-labelledby", "session-timeout-title");
    await expect(dialog).toHaveAttribute("aria-describedby", "session-timeout-description");

    await expect(page.locator("#session-timeout-title")).toBeVisible();
    await expect(page.locator("#session-timeout-description")).toBeVisible();
  });

  test("patients page loads without JS errors", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (err) => errors.push(err.message));

    await page.goto("/patients");

    await expect(
      page.getByText("Debes iniciar sesión para ver pacientes."),
    ).toBeVisible();

    expect(errors).toEqual([]);
  });

  test("patients search input has aria-label", async ({ page }) => {
    await page.goto("/patients");

    const needsLogin = await page
      .getByText(/Debes iniciar sesión/i)
      .isVisible()
      .catch(() => false);
    test.skip(needsLogin, "Not authenticated — search input not rendered");

    const searchInput = page.getByLabel("Filtrar pacientes por nombre");
    await expect(searchInput).toBeVisible();
  });
});
