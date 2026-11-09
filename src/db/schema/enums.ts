import { pgEnum } from "drizzle-orm/pg-core";

export const userRole = pgEnum("user_role", ["admin", "doctor", "staff"]);
export const userStatus = pgEnum("user_status", ["active", "inactive"]);
export const vaccineCategory = pgEnum("vaccine_category", ["child_epi", "adult", "maternal", "other"]);

export type UserRole = (typeof userRole.enumValues)[number];
