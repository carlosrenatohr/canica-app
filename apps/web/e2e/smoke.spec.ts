import { test, expect } from "@playwright/test";

test("home page loads", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Canica" })).toBeVisible();
});

test("login page is accessible", async ({ page }) => {
  await page.goto("/login");
  await expect(page.getByRole("heading", { name: "Iniciar sesión" })).toBeVisible();
});

test("signup page is accessible", async ({ page }) => {
  await page.goto("/signup");
  await expect(page.getByRole("heading", { name: "Crear cuenta" })).toBeVisible();
});
