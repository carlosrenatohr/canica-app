import { describe, expect, it } from "vitest";
import { safeMetadata } from "./usePageTitle";

describe("safeMetadata", () => {
  it("preserves accented Spanish characters", () => {
    expect(safeMetadata("Registro de auditoría").title).toBe(
      "Registro de auditoría — Canica",
    );
  });

  it("removes unsafe characters and truncates the label", () => {
    const title = safeMetadata(
      "Paciente <script>alert(1)</script> con un nombre demasiado largo",
    ).title;

    expect(title).not.toContain("<");
    expect(title).not.toContain(">");
    expect(title).toBe("Paciente scriptalert1script con un n… — Canica");
  });
});
