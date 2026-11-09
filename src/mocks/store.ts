import "server-only";
import type { Encounter } from "@/lib/types/encounter";
import type { Patient } from "@/lib/types/patient";
import { generateEncounters } from "./fixtures/encounters";
import { generatePatients } from "./fixtures/patients";
import { createRandom } from "./random";

/**
 * In-memory demo data for the frontend phases (IMPLEMENTATION_PLAN.md §3.4).
 * Generated from a fixed seed; changes last until the dev server restarts.
 * Only src/server/** may import this file.
 */
export type MockStore = {
  version: number;
  patients: Patient[];
  encounters: Encounter[];
};

const SEED = 20261108;
/**
 * Bump when the shape of the demo data changes. The dev server keeps the store across
 * hot reloads (e.g. after `git pull` while `pnpm dev` runs); a version mismatch rebuilds it.
 */
const STORE_VERSION = 2;

function createStore(): MockStore {
  const r = createRandom(SEED);
  const now = new Date();
  const patients = generatePatients(r, 220, now);
  const encounters = generateEncounters(r, patients, now);
  return { version: STORE_VERSION, patients, encounters };
}

const globalForMock = globalThis as unknown as { rhuMockStore?: MockStore };

export function mockStore(): MockStore {
  if (globalForMock.rhuMockStore?.version !== STORE_VERSION) globalForMock.rhuMockStore = createStore();
  return globalForMock.rhuMockStore;
}

/** Simulated latency so loading states are visible in development. */
export function mockDelay(ms = 150) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
