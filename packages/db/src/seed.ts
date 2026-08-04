// Seed script: creates a dev organization, a doctor user, and sample patients.
// Usage: pnpm --filter @canica/db db:seed
import dotenv from "dotenv";
import postgres from "postgres";
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

async function seed() {
  const sql = postgres(dbUrl, { max: 1 });

  // Organization
  await sql`
    INSERT INTO organizations (id, name)
    VALUES (${orgId}::uuid, 'Clínica Canica Dev')
    ON CONFLICT (id) DO NOTHING
  `;

  // Doctor user
  await sql`
    INSERT INTO users (id, organization_id, email, name, role)
    VALUES (
      '11111111-1111-1111-1111-111111111111'::uuid,
      ${orgId}::uuid,
      'dr.canica@example.com',
      'Dr. Canica',
      'doctor'
    )
    ON CONFLICT (email) DO NOTHING
  `;

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

  await sql.end();
  console.log("Seed complete: 1 org, 1 user, 3 patients");
}

seed().catch((e) => {
  console.error("Seed failed:", e);
  process.exit(1);
});
