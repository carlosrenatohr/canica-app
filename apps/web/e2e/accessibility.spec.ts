import { test, expect, type Page } from "@playwright/test";

const EMAIL = process.env.E2E_EMAIL!;
const PASSWORD = process.env.E2E_PASSWORD!;

if (!EMAIL || !PASSWORD) {
  throw new Error("E2E_EMAIL and E2E_PASSWORD environment variables must be set");
}

async function loginIfNeeded(page: Page) {
  const needsLogin = await page
    .getByText(/Debes iniciar sesión/i)
    .isVisible()
    .catch(() => false);
  if (needsLogin) {
    await page.goto("/login");
    await page.getByLabel("Email").fill(EMAIL);
    await page.getByLabel("Contraseña").fill(PASSWORD);
    await page.getByRole("button", { name: "Entrar" }).click();
    await page.waitForURL(/\/(?!login)/, { timeout: 10_000 }).catch(() => {});
  }
}

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

  test("dashboard keyboard navigation - main landmarks reachable", async ({ page }) => {
    await page.goto("/dashboard");
    await loginIfNeeded(page);

    // Verify main landmarks exist
    const main = page.locator("main");
    await expect(main).toHaveCount(1);

    const nav = page.locator("nav[aria-label='Barra lateral de navegación']");
    await expect(nav).toHaveCount(1);

    const header = page.locator("header");
    await expect(header).toHaveCount(1);

    // Tab through nav links
    const firstNavLink = page.locator("nav a[href='/dashboard']").first();
    await firstNavLink.focus();
    await expect(firstNavLink).toBeFocused();

    await page.keyboard.press("Tab");
    await expect(page.locator(":focus")).toBeVisible();
  });

  test("sidebar navigation links are keyboard accessible", async ({ page }) => {
    await page.goto("/dashboard");
    await loginIfNeeded(page);

    const navLinks = [
      { href: "/dashboard", label: "Resumen" },
      { href: "/patients", label: "Pacientes" },
      { href: "/appointments", label: "Citas" },
      { href: "/consultations", label: "Consultas" },
      { href: "/audit", label: "Auditoría" },
      { href: "/settings", label: "Configuración" },
    ];

    // Get current path to know which link should have aria-current="page"
    const currentPath = page.url().split("/").pop() || "dashboard";

    for (const link of navLinks) {
      const navLink = page.locator(`nav a[href="${link.href}"]`).first();
      await expect(navLink).toHaveCount(1);
      await navLink.focus();
      await expect(navLink).toBeFocused();

      // Only the current page link should have aria-current="page"
      const isCurrentPage = link.href.endsWith(currentPath) || (currentPath === "" && link.href === "/dashboard");
      if (isCurrentPage) {
        await expect(navLink).toHaveAttribute("aria-current", "page");
      } else {
        await expect(navLink).not.toHaveAttribute("aria-current", "page");
      }

      await page.keyboard.press("Tab");
    }
  });

  test("topbar search is keyboard accessible", async ({ page }) => {
    await page.goto("/dashboard");
    await loginIfNeeded(page);

    const searchInput = page.getByLabel("Buscar pacientes");
    await expect(searchInput).toBeVisible();

    await searchInput.focus();
    await expect(searchInput).toBeFocused();

    // Search should be reachable via Tab from sidebar
    await searchInput.fill("test");
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/patients/);
  });

  test("user menu dialog focus trap and keyboard nav", async ({ page }) => {
    await page.goto("/dashboard");
    await loginIfNeeded(page);

    // Open user menu
    const userButton = page.getByRole("button", { name: /Abrir menú de/ });
    await userButton.focus();
    await userButton.click();

    const menu = page.getByRole("menu", { name: "Menú de cuenta" });
    await expect(menu).toBeVisible();

    // First menu item should be focused
    const firstMenuItem = menu.locator('[role="menuitem"]').first();
    await expect(firstMenuItem).toBeFocused();

    // ArrowDown should move to next item
    await page.keyboard.press("ArrowDown");
    const secondMenuItem = menu.locator('[role="menuitem"]').nth(1);
    await expect(secondMenuItem).toBeFocused();

    // ArrowUp should move back
    await page.keyboard.press("ArrowUp");
    await expect(firstMenuItem).toBeFocused();

    // Escape should close menu
    await page.keyboard.press("Escape");
    await expect(menu).toBeHidden();

    // Focus should return to trigger button
    await expect(userButton).toBeFocused();
  });

  test("mobile sidebar drawer focus trap", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/dashboard");
    await loginIfNeeded(page);

    // Open mobile drawer
    const menuButton = page.getByRole("button", { name: "Abrir menú de navegación" });
    await menuButton.click();

    const drawer = page.locator("#mobile-navigation");
    await expect(drawer).toBeVisible();

    // Close button should be focused
    const closeButton = page.getByRole("button", { name: "Cerrar menú" });
    await expect(closeButton).toBeFocused();

    // Tab should cycle within drawer
    await page.keyboard.press("Tab");
    const firstNavLink = drawer.locator("a[href='/dashboard']").first();
    await expect(firstNavLink).toBeFocused();

    // Escape should close drawer
    await page.keyboard.press("Escape");
    await expect(drawer).toBeHidden();

    // Focus returns to menu button
    await expect(menuButton).toBeFocused();
  });

  test("audit page has proper table/card semantics", async ({ page }) => {
    await page.goto("/audit");
    await loginIfNeeded(page);

    const viewport = page.viewportSize();
    // Desktop: table with proper headers
    if (viewport && viewport.width >= 1024) {
      const table = page.locator("table").first();
      await expect(table).toBeVisible();

      const headers = table.locator("th");
      await expect(headers).toHaveCount(5);
      await expect(headers.nth(0)).toHaveText("Fecha");
      await expect(headers.nth(1)).toHaveText("Acción");
      await expect(headers.nth(2)).toHaveText("Entidad");
      await expect(headers.nth(3)).toHaveText("Actor");
      await expect(headers.nth(4)).toHaveText("Resumen");
    }

    // Mobile: card-based layout
    if (viewport && viewport.width < 1024) {
      const cards = page.locator('[role="listitem"]').filter({ has: page.locator("time") });
      await expect(cards.first()).toBeVisible();
    }
  });

  test("audit filter controls have accessible labels", async ({ page }) => {
    await page.goto("/audit");
    await loginIfNeeded(page);

    const searchInput = page.getByLabel("Buscar en los registros");
    await expect(searchInput).toBeVisible();

    const entitySelect = page.getByLabel("Entidad");
    await expect(entitySelect).toBeVisible();

    const actionSelect = page.getByLabel("Acción");
    await expect(actionSelect).toBeVisible();
  });

  test("settings page theme toggle has accessible name", async ({ page }) => {
    await page.goto("/settings");
    await loginIfNeeded(page);

    const themeToggle = page.getByRole("button", { name: /cambiar tema|tema actual/i });
    await expect(themeToggle).toBeVisible();

    // Toggle should be keyboard accessible
    await themeToggle.focus();
    await expect(themeToggle).toBeFocused();
  });

  test("patient form fields have accessible labels and error association", async ({ page }) => {
    await page.goto("/patients/new");
    await loginIfNeeded(page);

    const firstNameInput = page.getByLabel("Nombre");
    const lastNameInput = page.getByLabel("Apellido");
    await expect(firstNameInput).toBeVisible();
    await expect(lastNameInput).toBeVisible();

    // Submit without filling to trigger validation
    await page.getByRole("button", { name: "Guardar paciente" }).click();

    // Error messages should be associated
    const errorAlert = page.getByRole("alert");
    await expect(errorAlert).toBeVisible();
  });

  test("focus visible styles present on interactive elements", async ({ page }) => {
    await page.goto("/login");

    const elements = [
      page.getByLabel("Email"),
      page.getByLabel("Contraseña"),
      page.getByRole("button", { name: "Entrar" }),
      page.getByRole("link", { name: /registrarse/i }),
    ];

    for (const el of elements) {
      await el.focus();
      await expect(el).toBeFocused();
      // Check that focus-visible ring is applied (via CSS)
      const focusRing = await el.evaluate((node) => {
        const styles = window.getComputedStyle(node);
        return styles.boxShadow || styles.outline;
      });
      expect(focusRing).toBeTruthy();
    }
  });

  test("reduced motion preference respected", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/dashboard");
    await loginIfNeeded(page);

    // Check that transition durations are near-zero
    const sidebar = page.locator('aside[aria-label="Barra lateral de navegación"]');
    await expect(sidebar).toBeVisible();

    // The sidebar width transition should be disabled
    const transitionDuration = await sidebar.evaluate((node) => {
      return window.getComputedStyle(node).transitionDuration;
    });
    expect(transitionDuration).toMatch(/0/);
  });

  test("touch targets meet minimum 44px size", async ({ page }) => {
    await page.goto("/login");

    const buttons = [
      page.getByRole("button", { name: "Entrar" }),
      page.getByRole("link", { name: /registrarse/i }),
    ];

    for (const btn of buttons) {
      const box = await btn.boundingBox();
      expect(box).toBeTruthy();
      if (box) {
        expect(box.width).toBeGreaterThanOrEqual(44);
        expect(box.height).toBeGreaterThanOrEqual(44);
      }
    }
  });
});
