import dotenv from "dotenv";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
const __dirname = fileURLToPath(new URL(".", import.meta.url));
dotenv.config({ path: resolve(__dirname, "../../../.env") });

import { Hono } from "hono";
import { createDb } from "@canica/db";
import { createAuth, Permission } from "@canica/auth";
import * as patientsRepo from "@canica/db/repos/patients";
import { writeAudit } from "@canica/db/repos/audit";
import { CreatePatientInput, UpdatePatientInput } from "@canica/validation";
import { ApiEnv, requirePermission, sessionMiddleware } from "./auth.middleware";

const baseURL = process.env.API_BASE_URL ?? "http://localhost:3000";
const db = createDb();
const auth = createAuth({
  db,
  baseURL,
  trustedOrigins: [baseURL, "http://localhost:3001"],
});

const app = new Hono<ApiEnv>();

app.use("*", (c, next) => {
  c.set("db", db);
  c.set("auth", auth);
  c.set("permissions", undefined);
  return next();
});

app.all("/api/auth/*", (c) => c.var.auth.handler(c.req.raw));

app.get("/health", (c) => c.json({ ok: true, service: "canica-api" }));

app.get("/me", sessionMiddleware(), (c) => {
  const actor = c.get("actor");
  return c.json({ data: actor });
});

app.use("/patients/*", sessionMiddleware());

app.get("/patients", requirePermission(Permission.PATIENT_READ), async (c) => {
  const patients = await patientsRepo.listPatients(c.var.db, c.var.actor.organizationId);
  return c.json({ data: patients });
});

app.get("/patients/:id", requirePermission(Permission.PATIENT_READ), async (c) => {
  const patient = await patientsRepo.getPatient(c.var.db, c.var.actor.organizationId, c.req.param("id"));
  if (!patient) return c.json({ error: "not_found" }, 404);
  return c.json({ data: patient });
});

app.post("/patients", requirePermission(Permission.PATIENT_WRITE), async (c) => {
  const body = await c.req.json().catch(() => null);
  const parsed = CreatePatientInput.safeParse(body);
  if (!parsed.success) return c.json({ error: "validation_failed", details: parsed.error.flatten() }, 400);
  const patient = await patientsRepo.createPatient(c.var.db, c.var.actor.organizationId, parsed.data);
  await writeAudit(c.var.db, {
    organizationId: c.var.actor.organizationId,
    actorId: c.var.actor.userId,
    action: "patient.create",
    targetEntity: "patient",
    targetId: patient.id,
    ip: c.req.header("x-forwarded-for") ?? c.req.header("x-real-ip"),
    userAgent: c.req.header("user-agent"),
  });
  return c.json({ data: patient }, 201);
});

app.patch("/patients/:id", requirePermission(Permission.PATIENT_WRITE), async (c) => {
  const body = await c.req.json().catch(() => null);
  const parsed = UpdatePatientInput.safeParse(body);
  if (!parsed.success) return c.json({ error: "validation_failed", details: parsed.error.flatten() }, 400);
  const patient = await patientsRepo.updatePatient(c.var.db, c.var.actor.organizationId, c.req.param("id"), parsed.data);
  if (!patient) return c.json({ error: "not_found" }, 404);
  await writeAudit(c.var.db, {
    organizationId: c.var.actor.organizationId,
    actorId: c.var.actor.userId,
    action: "patient.update",
    targetEntity: "patient",
    targetId: patient.id,
    ip: c.req.header("x-forwarded-for") ?? c.req.header("x-real-ip"),
    userAgent: c.req.header("user-agent"),
  });
  return c.json({ data: patient });
});

app.delete("/patients/:id", requirePermission(Permission.PATIENT_ARCHIVE), async (c) => {
  await patientsRepo.archivePatient(c.var.db, c.var.actor.organizationId, c.req.param("id"));
  await writeAudit(c.var.db, {
    organizationId: c.var.actor.organizationId,
    actorId: c.var.actor.userId,
    action: "patient.archive",
    targetEntity: "patient",
    targetId: c.req.param("id"),
    ip: c.req.header("x-forwarded-for") ?? c.req.header("x-real-ip"),
    userAgent: c.req.header("user-agent"),
  });
  return c.body(null, 204);
});

export default app;
