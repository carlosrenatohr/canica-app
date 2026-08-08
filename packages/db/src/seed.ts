// Seed script: creates a dev organization, test users, and sample patients.
// Usage: pnpm --filter @canica/db db:seed
import dotenv from "dotenv";
import postgres from "postgres";
import { randomBytes, scrypt } from "node:crypto";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
dotenv.config({ path: resolve(__dirname, "../../../.env") });

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL is not set. See .env.example");
  process.exit(1);
}
const dbUrl: string = url;

const orgId = process.env.ORG_ID ?? "00000000-0000-0000-0000-000000000000";

// Better Auth password hashing (scrypt, matches @better-auth/utils/password)
const SCRYPT_CONFIG = { N: 16384, r: 16, p: 1, dkLen: 64 };

async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const key = await new Promise<Buffer>((resolve, reject) => {
    scrypt(
      password.normalize("NFKC"),
      salt,
      SCRYPT_CONFIG.dkLen,
      { N: SCRYPT_CONFIG.N, r: SCRYPT_CONFIG.r, p: SCRYPT_CONFIG.p, maxmem: 128 * SCRYPT_CONFIG.N * SCRYPT_CONFIG.r * 2 },
      (err, key) => (err ? reject(err) : resolve(key)),
    );
  });
  return `${salt}:${key.toString("hex")}`;
}

interface TestUser {
  id: string;
  email: string;
  name: string;
  role: string;
  password: string;
}

const TEST_USERS: TestUser[] = [
  { id: "11111111-1111-1111-1111-111111111111", email: "dr.canica@example.com", name: "Dr. Canica", role: "doctor", password: "Doctor123!" },
  { id: "22222222-2222-2222-2222-222222222222", email: "admin.canica@example.com", name: "Admin Canica", role: "administrator", password: "Admin123!" },
];

async function seed() {
  const sql = postgres(dbUrl, { max: 1 });

  // Organization
  await sql`
    INSERT INTO organizations (id, name)
    VALUES (${orgId}::uuid, 'Clínica Canica Dev')
    ON CONFLICT (id) DO NOTHING
  `;

  // Test users (doctor + administrator)
  for (const user of TEST_USERS) {
    await sql`
      INSERT INTO users (id, organization_id, email, name, role)
      VALUES (${user.id}::uuid, ${orgId}::uuid, ${user.email}, ${user.name}, ${user.role}::organization_role)
      ON CONFLICT (email) DO NOTHING
    `;
  }

  // Better Auth accounts (email/password credentials)
  // Delete existing accounts for test users first (no unique constraint on provider_id+account_id)
  for (const user of TEST_USERS) {
    await sql`DELETE FROM accounts WHERE user_id = ${user.id}::uuid`;
    const passwordHash = await hashPassword(user.password);
    await sql`
      INSERT INTO accounts (provider_id, account_id, user_id, password)
      VALUES ('credential', ${user.email}, ${user.id}::uuid, ${passwordHash})
    `;
  }

  // Sample patients
  const patients = [
    { first: "María", last: "García López", sex: "female", birth: "1985-03-15", phone: "+52-55-1234-5678" },
    { first: "Carlos", last: "Hernández Ruiz", sex: "male", birth: "1972-11-22", phone: "+52-55-8765-4321" },
    { first: "Ana", last: "Martínez Sosa", sex: "female", birth: "1990-07-08", phone: "+52-55-5555-0000" },
  ];

  for (const p of patients) {
    await sql`
      INSERT INTO patients (organization_id, first_name, last_name, sex, birth_date, phone, archived)
      VALUES (
        ${orgId}::uuid,
        ${p.first},
        ${p.last},
        ${p.sex},
        ${p.birth}::timestamptz,
        ${p.phone},
        false
      )
    `;
  }

  // Role → permission matrix (permission-based RBAC)
  const matrix: Record<string, string[]> = {
    doctor: [
      "patient:read", "patient:write", "patient:archive",
      "consultation:read", "consultation:write", "consultation:finalize",
      "diagnosis:read", "diagnosis:write",
      "prescription:read", "prescription:write",
      "appointment:read", "appointment:write",
      "attachment:read", "attachment:write",
      "audit:read",
    ],
    receptionist: ["patient:read", "appointment:read", "appointment:write"],
    administrator: [
      "user:manage", "audit:read", "org:manage",
      "patient:read", "patient:write", "patient:archive",
      "consultation:read", "consultation:write", "consultation:finalize",
      "diagnosis:read", "diagnosis:write",
      "prescription:read", "prescription:write",
      "appointment:read", "appointment:write",
      "attachment:read", "attachment:write",
    ],
  };

  for (const [role, permissions] of Object.entries(matrix)) {
    for (const permission of permissions) {
      await sql`
        INSERT INTO role_permissions (role, permission)
        VALUES (${role}::organization_role, ${permission}::permission_key)
        ON CONFLICT (role, permission) DO NOTHING
      `;
    }
  }

  const totalPerms = Object.values(matrix).reduce((a, p) => a + p.length, 0);
  console.log(`Seed complete: 1 org, ${TEST_USERS.length} users, ${patients.length} patients, ${totalPerms} role_permissions`);
  console.log(`Test users:`);
  for (const u of TEST_USERS) {
    console.log(`  ${u.email} / ${u.password} (${u.role})`);
  }
}

seed().catch((e) => {
  console.error("Seed failed:", e);
  process.exit(1);
});
