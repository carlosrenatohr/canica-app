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

test("patients page loads", async ({ page }) => {
  await page.goto("/patients");
  await expect(page.getByText("Debes iniciar sesión")).toBeVisible();
});

test("new patient form loads", async ({ page }) => {
  await page.goto("/patients/new");
  await expect(page.getByText("Debes iniciar sesión")).toBeVisible();
});

test("patient detail page loads", async ({ page }) => {
  await page.goto("/patients/00000000-0000-0000-0000-000000000000");
  await expect(page.getByText("Debes iniciar sesión")).toBeVisible();
});

test("edit patient form loads", async ({ page }) => {
  await page.goto("/patients/00000000-0000-0000-0000-000000000000/edit");
  await expect(page.getByText("Debes iniciar sesión")).toBeVisible();
});
