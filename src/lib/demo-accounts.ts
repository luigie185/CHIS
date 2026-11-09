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
  position?: string;
  prcNumber?: string;
  specialization?: string;
}[] = [
  {
    role: "doctor",
    email: "doctor@rhu.local",
    firstName: "Andrea",
    lastName: "Villanueva",
    position: "Municipal Health Officer",
    prcNumber: "0123456",
    specialization: "Family Medicine",
  },
  {
    role: "staff",
    email: "staff@rhu.local",
    firstName: "Rowena",
    lastName: "Santos",
    position: "Nurse",
    prcNumber: "0234567",
  },
];
