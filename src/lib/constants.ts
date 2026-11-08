// Lookup values shared by the UI, mock data and seed script (IMPLEMENTATION_PLAN.md §17).

export const BARANGAYS = [
  "Apas",
  "Aluna",
  "Andales",
  "Calacapan",
  "Gimangpang",
  "Jampason",
  "Kamelon",
  "Kanitoan",
  "Oguis",
  "Pagahan",
  "Poblacion",
  "Pontacon",
  "San Pedro",
  "Sinalac",
  "Tawantawan",
  "Tubigan",
] as const;

/** Barangay ids match the seeded `barangays` table order (serial ids 1..16). */
export const BARANGAY_OPTIONS = BARANGAYS.map((name, i) => ({ id: i + 1, name }));

export function barangayName(id: number): string {
  return BARANGAYS[id - 1] ?? "Unknown";
}

export const SEX_OPTIONS = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
] as const;

export const CIVIL_STATUS_OPTIONS = [
  { value: "single", label: "Single" },
  { value: "married", label: "Married" },
  { value: "widowed", label: "Widowed" },
  { value: "separated", label: "Separated" },
  { value: "live_in", label: "Live-in" },
] as const;

export const PHILHEALTH_STATUS_OPTIONS = [
  { value: "member", label: "Member" },
  { value: "dependent", label: "Dependent" },
  { value: "none", label: "None" },
] as const;

export const AGE_GROUP_OPTIONS = [
  { value: "0-4", label: "0–4 yrs", min: 0, max: 4 },
  { value: "5-17", label: "5–17 yrs", min: 5, max: 17 },
  { value: "18-59", label: "18–59 yrs", min: 18, max: 59 },
  { value: "60+", label: "60+ yrs", min: 60, max: 200 },
] as const;

export type AgeGroup = (typeof AGE_GROUP_OPTIONS)[number]["value"];
