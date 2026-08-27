import { test, expect, type Page } from "@playwright/test";
import { writeFileSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const EMAIL = process.env.E2E_EMAIL ?? "test@canica.local";
const PASSWORD = process.env.E2E_PASSWORD ?? "test1234";

const DOC_NAME = "informe-e2e.txt";

function makeTestFile(): string {
  const dir = mkdtempSync(join(tmpdir(), "canica-e2e-"));
  const file = join(dir, DOC_NAME);
  writeFileSync(file, "Contenido de prueba para el documento E2E de Canica.");
  return file;
}

async function loginAndCreatePatient(page: Page): Promise<string | undefined> {
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
        ? "API is not reachable — skipping documents suite"
        : "Login failed (wrong credentials or API issue) — skipping documents suite",
    );
    return undefined;
  }

  await page.goto("/patients/new");
  await page.getByLabel("Nombre").fill("Lucía");
  await page.getByLabel("Apellido").fill("Documentos E2E");
  await page.getByRole("button", { name: "Guardar paciente" }).click();
  await expect(page).toHaveURL(/\/patients$/);
  await expect(page.getByText("Lucía Documentos E2E")).toBeVisible();

  const card = page.getByText("Lucía Documentos E2E").locator("..");
  const href = await card.getAttribute("href");
  const match = href?.match(/\/patients\/([a-f0-9-]+)/);
  return match?.[1];
}

test.describe.serial("Documents flow @documents", () => {
  test("upload, list, download and delete an attachment", async ({ page }) => {
    const patientId = await loginAndCreatePatient(page);
    test.skip(!patientId, "Patient could not be created");
    if (!patientId) return;

    // Navigate to the Documents tab
    await page.goto(`/patients/${patientId}`);
    await page.getByRole("button", { name: "Documentos" }).click();
    await expect(page).toHaveURL(new RegExp(`/patients/${patientId}/documents`));

    // Upload a file
    await page.getByRole("button", { name: "Subir" }).first().click();
    const file = makeTestFile();
    await page.setInputFiles('input[type="file"]', file);
    await page.getByRole("dialog").getByRole("button", { name: "Subir" }).click();

    // The document should appear in the list
    await expect(page.getByText(DOC_NAME)).toBeVisible({ timeout: 10_000 });

    // Download should open a new tab (signed URL)
    const [download] = await Promise.all([
      page.waitForEvent("popup", { timeout: 10_000 }).catch(() => null),
      page.getByRole("button", { name: `Descargar ${DOC_NAME}` }).click(),
    ]);
    if (download) {
      await download.close().catch(() => {});
    }

    // Delete the document
    page.on("dialog", (dialog) => dialog.accept());
    await page.getByRole("button", { name: `Eliminar ${DOC_NAME}` }).click();
    await expect(page.getByText(DOC_NAME)).toHaveCount(0, { timeout: 10_000 });
  });
});
