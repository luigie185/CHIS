// Shared by the app and scripts. Always speaks the Postgres protocol:
//   local dev  → PGlite server started by `pnpm dev` (embedded Postgres in ./.data/pglite, no Docker)
//   production → Neon (pooled URL)
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

export const LOCAL_DATABASE_URL = "postgres://postgres:postgres@127.0.0.1:5433/postgres";

export function databaseUrl(url = process.env.DATABASE_URL) {
  return url || LOCAL_DATABASE_URL;
}

export function createDb(url?: string) {
  const connectionString = databaseUrl(url);
  // The local PGlite server runs a single Postgres session, so use one connection per process there.
  const pool = new Pool({ connectionString, max: connectionString === LOCAL_DATABASE_URL ? 1 : 10 });
  return { db: drizzle({ client: pool, schema, casing: "snake_case" }), close: () => pool.end() };
}
