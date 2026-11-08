import "server-only";
import { subDays } from "date-fns";
import type { Patient } from "@/lib/types/patient";
import { generatePatients } from "./fixtures/patients";
import { createRandom } from "./random";

/**
 * In-memory demo data for the frontend phases (IMPLEMENTATION_PLAN.md §3.4).
 * Generated from a fixed seed; changes last until the dev server restarts.
 * Only src/server/** may import this file.
 */
export type MockStore = {
  patients: Patient[];
  /** Last visit per patient id (until encounters are mocked in F2). */
  lastVisitAt: Map<string, string>;
};

const SEED = 20261108;

function createStore(): MockStore {
  const r = createRandom(SEED);
  const today = new Date();
  const patients = generatePatients(r, 220, today);
  const lastVisitAt = new Map<string, string>();
  for (const p of patients) {
    if (r.chance(0.75)) lastVisitAt.set(p.id, subDays(today, r.int(0, 120)).toISOString());
  }
  return { patients, lastVisitAt };
}

const globalForMock = globalThis as unknown as { rhuMockStore?: MockStore };

export function mockStore(): MockStore {
  globalForMock.rhuMockStore ??= createStore();
  return globalForMock.rhuMockStore;
}
