/**
 * Seeds lookup tables and the first admin account. Safe to run more than once.
 *   pnpm db:seed
 */
import "dotenv/config";
import { hashPassword } from "better-auth/crypto";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "../src/db/schema";

const BARANGAYS = [
  "Apas",
  "Aluna",
  "Andales",
  "Calacapan",
  "Gimangpang",
  "Jampason",
  "Kamelon",
  "Kanitoan",
  "Oguis",
  "Pagahan",
  "Poblacion",
  "Pontacon",
  "San Pedro",
  "Sinalac",
  "Tawantawan",
  "Tubigan",
];

const LAB_TESTS = [
  "Complete Blood Count (CBC)",
  "Urinalysis",
  "Stool Examination",
  "Blood Sugar Test",
  "Electrolyte Panel",
  "X-ray",
];

// Philippine EPI schedule (approximate; admins can adjust in Settings later).
const VACCINES: (typeof schema.vaccines.$inferInsert)[] = [
  {
    code: "BCG",
    name: "Bacillus Calmette-Guérin",
    category: "child_epi",
    totalDoses: 1,
    schedule: [{ dose: 1, ageWeeks: 0 }],
  },
  {
    code: "HEPB",
    name: "Hepatitis B (birth dose)",
    category: "child_epi",
    totalDoses: 1,
    schedule: [{ dose: 1, ageWeeks: 0 }],
  },
  {
    code: "PENTA",
    name: "Pentavalent (DPT-HepB-Hib)",
    category: "child_epi",
    totalDoses: 3,
    schedule: [
      { dose: 1, ageWeeks: 6 },
      { dose: 2, ageWeeks: 10 },
      { dose: 3, ageWeeks: 14 },
    ],
  },
  {
    code: "OPV",
    name: "Oral Polio Vaccine",
    category: "child_epi",
    totalDoses: 3,
    schedule: [
      { dose: 1, ageWeeks: 6 },
      { dose: 2, ageWeeks: 10 },
      { dose: 3, ageWeeks: 14 },
    ],
  },
  {
    code: "IPV",
    name: "Inactivated Polio Vaccine",
    category: "child_epi",
    totalDoses: 2,
    schedule: [
      { dose: 1, ageWeeks: 14 },
      { dose: 2, ageWeeks: 39 },
    ],
  },
  {
    code: "PCV",
    name: "Pneumococcal Conjugate Vaccine",
    category: "child_epi",
    totalDoses: 3,
    schedule: [
      { dose: 1, ageWeeks: 6 },
      { dose: 2, ageWeeks: 10 },
      { dose: 3, ageWeeks: 14 },
    ],
  },
  {
    code: "MMR",
    name: "Measles, Mumps, Rubella",
    category: "child_epi",
    totalDoses: 2,
    schedule: [
      { dose: 1, ageWeeks: 39 },
      { dose: 2, ageWeeks: 52 },
    ],
  },
  { code: "TD", name: "Tetanus-Diphtheria", category: "maternal", totalDoses: 5, schedule: [] },
  { code: "FLU", name: "Influenza", category: "adult", totalDoses: 1, schedule: [] },
  {
    code: "PNEUMO",
    name: "Pneumococcal Polysaccharide (PPV23)",
    category: "adult",
    totalDoses: 1,
    schedule: [],
  },
];

async function main() {
  const url = process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");
  const client = postgres(url, { max: 1 });
  const db = drizzle(client, { schema, casing: "snake_case" });

  await db
    .insert(schema.barangays)
    .values(BARANGAYS.map((name) => ({ name })))
    .onConflictDoNothing();
  await db
    .insert(schema.labTests)
    .values(LAB_TESTS.map((name) => ({ name })))
    .onConflictDoNothing();
  await db.insert(schema.vaccines).values(VACCINES).onConflictDoNothing();
  await db
    .insert(schema.facilitySettings)
    .values({ id: 1, facilityName: "Rural Health Unit" })
    .onConflictDoNothing();
  console.log("✔ lookups seeded");

  const email = process.env.SEED_ADMIN_EMAIL?.toLowerCase();
  const password = process.env.SEED_ADMIN_PASSWORD;
  if (!email || !password) {
    console.log("• SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD not set — skipping admin");
  } else {
    const existing = await db.query.user.findFirst({ where: eq(schema.user.email, email) });
    if (existing) {
      console.log(`• admin ${email} already exists`);
    } else {
      const id = crypto.randomUUID();
      await db.transaction(async (tx) => {
        await tx
          .insert(schema.user)
          .values({ id, name: "System Admin", email, emailVerified: true, role: "admin" });
        await tx.insert(schema.account).values({
          id: crypto.randomUUID(),
          accountId: id,
          providerId: "credential",
          userId: id,
          password: await hashPassword(password),
        });
        await tx.insert(schema.staffProfiles).values({ userId: id, firstName: "System", lastName: "Admin" });
      });
      console.log(`✔ admin ${email} created`);
    }
  }

  await client.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
