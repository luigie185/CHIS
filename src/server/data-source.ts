import "server-only";

/**
 * Modules still served from the mock store (IMPLEMENTATION_PLAN.md §3.4).
 * Remove a module from this list when its queries/actions are switched to the database.
 * While the list is non-empty, the app header shows a "Demo data" badge.
 */
export const MOCK_MODULES = [
  "patients",
  "encounters",
  "consultations",
  "prenatal",
  "immunization",
  "vaccinations",
  "risk",
  "mental_health",
  "referrals",
  "analytics",
  "imports",
  "staff",
] as const;

export const usingMockData = MOCK_MODULES.length > 0;
