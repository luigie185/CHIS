/**
 * Local database helpers — embedded Postgres (PGlite) stored in ./.data/pglite. No Docker needed.
 *   tsx scripts/local-db.ts setup   → apply migrations + seed (run while the dev server is stopped)
 *   tsx scripts/local-db.ts serve   → serve it on 127.0.0.1:5433 for the app (started by `pnpm dev`)
 *   tsx scripts/local-db.ts reset   → delete the local database
 */
import "dotenv/config";
import { mkdirSync, rmSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";
import { PGLiteSocketServer } from "@electric-sql/pglite-socket";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import * as schema from "../src/db/schema";
import { seed } from "./seed";

const DATA_DIR = "./.data/pglite";
const PORT = 5433;

async function open() {
  mkdirSync("./.data", { recursive: true });
  const pg = new PGlite(DATA_DIR);
  await pg.waitReady;
  return pg;
}

async function setup() {
  if (process.env.DATABASE_URL) {
    console.error("DATABASE_URL is set — use `pnpm db:migrate && pnpm db:seed` for that database.");
    process.exit(1);
  }
  const pg = await open();
  const db = drizzle({ client: pg, schema, casing: "snake_case" });
  await migrate(db, { migrationsFolder: "./drizzle" });
  console.log("✔ migrations applied");
  await seed(db);
  await pg.close();
}

async function serve() {
  const pg = await open();
  const server = new PGLiteSocketServer({ db: pg, port: PORT, host: "127.0.0.1", maxConnections: 10 });
  await server.start();
  console.log(`✔ local database ready on postgres://127.0.0.1:${PORT}/postgres (${DATA_DIR})`);

  let stopping = false;
  const stop = async () => {
    if (stopping) return;
    stopping = true;
    await server.stop();
    await pg.close(); // flushes data to disk
    process.exit(0);
  };
  process.on("SIGINT", stop);
  process.on("SIGTERM", stop);
}

const command = process.argv[2];
const run = { setup, serve, reset: async () => rmSync("./.data", { recursive: true, force: true }) }[
  command as "setup" | "serve" | "reset"
];
if (!run) {
  console.error("Usage: tsx scripts/local-db.ts <setup|serve|reset>");
  process.exit(1);
}
run()
  .then(() => {
    if (command !== "serve") process.exit(0);
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
