import dotenv from "dotenv";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
const __dirname = fileURLToPath(new URL(".", import.meta.url));
dotenv.config({ path: resolve(__dirname, "../../../.env") });

import { Hono } from "hono";
import { createDb } from "@canica/db";
import * as patientsRepo from "@canica/db/repos/patients";
import { CreatePatientInput, UpdatePatientInput } from "@canica/validation";

const app = new Hono<{ Variables: { db: ReturnType<typeof createDb>; organizationId: string } }>();

app.use("*", async (c, next) => {
  c.set("db", createDb());
  c.set("organizationId", c.req.header("x-org-id") ?? process.env.ORG_ID ?? "00000000-0000-0000-0000-000000000000");
  await next();
});

app.get("/health", (c) => c.json({ ok: true, service: "canica-api" }));

app.get("/patients", async (c) => {
  const patients = await patientsRepo.listPatients(c.var.db, c.var.organizationId);
  return c.json({ data: patients });
});

app.get("/patients/:id", async (c) => {
  const patient = await patientsRepo.getPatient(c.var.db, c.var.organizationId, c.req.param("id"));
  if (!patient) return c.json({ error: "not_found" }, 404);
  return c.json({ data: patient });
});

app.post("/patients", async (c) => {
  const body = await c.req.json().catch(() => null);
  const parsed = CreatePatientInput.safeParse(body);
  if (!parsed.success) return c.json({ error: "validation_failed", details: parsed.error.flatten() }, 400);
  const patient = await patientsRepo.createPatient(c.var.db, c.var.organizationId, parsed.data);
  return c.json({ data: patient }, 201);
});

app.patch("/patients/:id", async (c) => {
  const body = await c.req.json().catch(() => null);
  const parsed = UpdatePatientInput.safeParse(body);
  if (!parsed.success) return c.json({ error: "validation_failed", details: parsed.error.flatten() }, 400);
  const patient = await patientsRepo.updatePatient(c.var.db, c.var.organizationId, c.req.param("id"), parsed.data);
  return c.json({ data: patient });
});

app.delete("/patients/:id", async (c) => {
  await patientsRepo.archivePatient(c.var.db, c.var.organizationId, c.req.param("id"));
  return c.body(null, 204);
});

export default app;
