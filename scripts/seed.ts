/**
 * Seeds lookup tables and the first admin account. Safe to run more than once.
 *   pnpm db:seed   (needs a running database: `pnpm db:local` or DATABASE_URL)
 *   pnpm db:setup  (migrate + seed the local PGlite database, no server needed)
 */
import "dotenv/config";
import { hashPassword } from "better-auth/crypto";
import { pathToFileURL } from "node:url";
import { eq } from "drizzle-orm";
import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";
import { createDb } from "../src/db/client";
import * as schema from "../src/db/schema";
import type { UserRole } from "../src/db/schema/enums";
import { BARANGAYS } from "../src/lib/constants";
import { DEMO_ACCOUNTS } from "../src/lib/demo-accounts";

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

export type SeedDb = PgDatabase<PgQueryResultHKT, typeof schema>;

export async function seed(db: SeedDb) {
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
    await createStaff(db, { email, password, role: "admin", firstName: "System", lastName: "Admin" });
  }

  if (process.env.SEED_DEMO_ACCOUNTS === "true") {
    if (process.env.NODE_ENV === "production")
      throw new Error("Refusing to create demo accounts in production");
    const demoPassword = process.env.SEED_DEMO_PASSWORD || password;
    if (!demoPassword) throw new Error("Set SEED_DEMO_PASSWORD (or SEED_ADMIN_PASSWORD) for demo accounts");
    for (const a of DEMO_ACCOUNTS) await createStaff(db, { ...a, password: demoPassword });
  }
}

async function createStaff(
  db: SeedDb,
  a: {
    email: string;
    password: string;
    role: UserRole;
    firstName: string;
    lastName: string;
    prcNumber?: string;
    specialization?: string;
  },
) {
  const existing = await db.query.user.findFirst({ where: eq(schema.user.email, a.email) });
  if (existing) {
    console.log(`• ${a.role} ${a.email} already exists`);
    return;
  }
  const id = crypto.randomUUID();
  const name = `${a.firstName} ${a.lastName}`;
  await db.transaction(async (tx) => {
    await tx.insert(schema.user).values({ id, name, email: a.email, emailVerified: true, role: a.role });
    await tx.insert(schema.account).values({
      id: crypto.randomUUID(),
      accountId: id,
      providerId: "credential",
      userId: id,
      password: await hashPassword(a.password),
    });
    await tx.insert(schema.staffProfiles).values({
      userId: id,
      firstName: a.firstName,
      lastName: a.lastName,
      prcNumber: a.prcNumber ?? null,
      specialization: a.specialization ?? null,
    });
  });
  console.log(`✔ ${a.role} ${a.email} created`);
}

// Run directly: `tsx scripts/seed.ts`
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const { db, close } = createDb(process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL);
  seed(db)
    .then(close)
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
