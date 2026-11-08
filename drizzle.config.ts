import "dotenv/config";
import { defineConfig } from "drizzle-kit";
import { databaseUrl } from "./src/db/client";

export default defineConfig({
  schema: "./src/db/schema/index.ts",
  out: "./drizzle",
  dialect: "postgresql",
  // Prefer the direct (unpooled) connection for migrations when available (Neon).
  dbCredentials: { url: databaseUrl(process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL) },
  strict: true,
  verbose: true,
});
