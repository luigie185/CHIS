import "server-only";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { admin } from "better-auth/plugins";
import { db } from "@/db";
import * as schema from "@/db/schema";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user: schema.user,
      session: schema.session,
      account: schema.account,
      verification: schema.verification,
    },
  }),
  emailAndPassword: {
    enabled: true,
    // Staff accounts are created by admins (and the seed script), not by public sign-up.
    disableSignUp: true,
    minPasswordLength: 8,
  },
  session: {
    expiresIn: 60 * 60 * 12, // 12 h absolute lifetime (shared workstations)
    updateAge: 60 * 30,
  },
  rateLimit: {
    enabled: true,
    window: 60,
    max: 100,
    customRules: { "/sign-in/email": { window: 60, max: 5 } },
  },
  plugins: [
    admin({
      defaultRole: "encoder",
      adminRoles: ["admin"],
      bannedUserMessage: "Your account has been deactivated. Please contact the RHU administrator.",
    }),
    nextCookies(), // must be last
  ],
});

export type Session = typeof auth.$Infer.Session;
