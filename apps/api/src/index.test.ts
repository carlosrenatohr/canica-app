import { expect, test } from "vitest";
import app from "../src/index.js";

test("GET /health returns ok", async () => {
  const res = await app.request("/health");
  expect(res.status).toBe(200);
  const json = (await res.json()) as { ok?: boolean; service?: string };
  expect(json.ok).toBe(true);
  expect(json.service).toBe("canica-api");
});
