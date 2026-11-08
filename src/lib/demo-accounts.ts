import type { UserRole } from "@/db/schema/enums";

/**
 * One account per role for testing the frontend phases. Created by `pnpm db:setup`
 * when SEED_DEMO_ACCOUNTS=true and listed on the login page in development only.
 * Never enable on production.
 */
export const DEMO_ACCOUNTS: {
  role: Exclude<UserRole, "admin">;
  email: string;
  firstName: string;
  lastName: string;
  prcNumber?: string;
  specialization?: string;
}[] = [
  {
    role: "doctor",
    email: "doctor@rhu.local",
    firstName: "Andrea",
    lastName: "Villanueva",
    prcNumber: "0123456",
    specialization: "Family Medicine",
  },
  { role: "nurse", email: "nurse@rhu.local", firstName: "Mark", lastName: "Bautista", prcNumber: "0234567" },
  {
    role: "midwife",
    email: "midwife@rhu.local",
    firstName: "Rowena",
    lastName: "Santos",
    prcNumber: "0345678",
  },
  { role: "encoder", email: "encoder@rhu.local", firstName: "Jomar", lastName: "Reyes" },
];
