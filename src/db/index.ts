import "server-only";
import { createDb } from "./client";

// Reuse one connection pool across hot reloads in development.
const globalForDb = globalThis as unknown as { rhuDb?: ReturnType<typeof createDb> };
const instance = globalForDb.rhuDb ?? createDb();
globalForDb.rhuDb = instance;

export const db = instance.db;
export type DB = typeof db;
