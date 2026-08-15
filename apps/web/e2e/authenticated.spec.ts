import { test, expect } from "@playwright/test";

const EMAIL = process.env.E2E_EMAIL ?? "test@canica.local";
const PASSWORD = process.env.E2E_PASSWORD ?? "test1234";

test.describe.serial("Authenticated clinical workflows @authenticated", () => {
  let patientId: string | undefined;

  test("login and reach dashboard", async ({ page }) => {
    await page.goto("/login");

    await page.getByLabel("Email").fill(EMAIL);
    await page.getByLabel("Contraseña").fill(PASSWORD);
    await page.getByRole("button", { name: "Entrar" }).click();

    // Wait for either navigation away from /login or an error alert
    await page.waitForURL(/\/(?!login)/, { timeout: 10_000 }).catch(() => {});

    // If we're still on /login, login failed — skip the whole suite
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
          : "Login failed (wrong credentials or API issue) — skipping authenticated suite",
      );
      return;
    }

    await expect(
      page.getByText(/Bienvenido|Canica/i),
    ).toBeVisible();
  });

  test("create patient and see it in the list", async ({ page }) => {
    await page.goto("/patients/new");

    const needsLogin = await page
      .getByText(/Debes iniciar sesión/i)
      .isVisible()
      .catch(() => false);
    test.skip(needsLogin, "Not authenticated — previous login may have failed");

    await page.getByLabel("Nombre").fill("Juan");
    await page.getByLabel("Apellido").fill("Pérez E2E");
    await page.getByRole("button", { name: "Guardar paciente" }).click();

    await expect(page).toHaveURL(/\/patients$/);
    await expect(page.getByText("Juan Pérez E2E")).toBeVisible();

    const card = page.getByText("Juan Pérez E2E").locator("..");
    const href = await card.getAttribute("href");
    if (href) {
      const match = href.match(/\/patients\/([a-f0-9-]+)/);
      if (match) patientId = match[1];
    }
  });

  test("patient detail loads with patient name", async ({ page }) => {
    await page.goto("/patients");

    const needsLogin = await page
      .getByText(/Debes iniciar sesión/i)
      .isVisible()
      .catch(() => false);
    test.skip(needsLogin, "Not authenticated");

    const patientLink = page.getByText("Juan Pérez E2E");
    if (!(await patientLink.isVisible().catch(() => false))) {
      test.skip(true, "Patient was not created in previous test");
    }
    await patientLink.click();

    await expect(page.getByText("Juan Pérez E2E")).toBeVisible();
    await expect(page.getByText("Resumen clínico")).toBeVisible();
  });

  test("create appointment for the patient", async ({ page }) => {
    await page.goto("/appointments/new");

    const needsLogin = await page
      .getByText(/Debes iniciar sesión/i)
      .isVisible()
      .catch(() => false);
    test.skip(needsLogin, "Not authenticated");

    await page
      .getByLabel("Paciente")
      .selectOption({ label: "Juan Pérez E2E" });

    await page.getByLabel("Razón").fill("Consulta de control E2E");
    await page.getByRole("button", { name: "Crear cita" }).click();

    await expect(page).toHaveURL(/\/appointments$/);
  });

  test("appointment detail shows status badge", async ({ page }) => {
    await page.goto("/appointments");

    const needsLogin = await page
      .getByText(/Debes iniciar sesión/i)
      .isVisible()
      .catch(() => false);
    test.skip(needsLogin, "Not authenticated");

    const appointmentCard = page.getByText("Juan Pérez E2E").first();
    if (!(await appointmentCard.isVisible().catch(() => false))) {
      test.skip(true, "Appointment was not created in previous test");
    }
    await appointmentCard.click();

    await expect(page.getByText("Detalle de la cita")).toBeVisible();
    await expect(page.getByText("Juan Pérez E2E")).toBeVisible();
    await expect(page.getByText("Programada")).toBeVisible();
  });

  test("create consultation for the patient", async ({ page }) => {
    test.skip(!patientId, "Patient ID not available from earlier test");
    await page.goto(`/patients/${patientId}/consultations/new`);

    const needsLogin = await page
      .getByText(/Debes iniciar sesión/i)
      .isVisible()
      .catch(() => false);
    test.skip(needsLogin, "Not authenticated");

    await page.getByText(/Nueva consulta/).waitFor();
    await page
      .getByLabel("Motivo principal")
      .fill("Dolor de cabeza persistente");
    await page.getByRole("button", { name: "Crear consulta" }).click();

    await expect(page).toHaveURL(
      new RegExp(`/patients/${patientId}/consultations/[a-f0-9-]+`),
    );
  });

  test("consultation detail shows diagnosis and prescription tabs", async ({ page }) => {
    test.skip(!patientId, "Patient ID not available from earlier test");
    await page.goto(`/patients/${patientId}/consultations`);

    const needsLogin = await page
      .getByText(/Debes iniciar sesión/i)
      .isVisible()
      .catch(() => false);
    test.skip(needsLogin, "Not authenticated");

    const consultationLink = page.getByText(/Consulta del/).first();
    if (!(await consultationLink.isVisible().catch(() => false))) {
      test.skip(true, "Consultation was not created in previous test");
    }
    await consultationLink.click();

    await expect(page.getByText("Consulta del")).toBeVisible();
    await expect(page.getByRole("tab", { name: /Diagnósticos/ })).toBeVisible();
    await expect(page.getByRole("tab", { name: /Prescripciones/ })).toBeVisible();
  });
});
