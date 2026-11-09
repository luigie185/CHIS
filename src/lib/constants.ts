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

// ---- ITR / encounters (plan §5.3, §17.2–17.5) ----

export const MODE_OF_TRANSACTION_OPTIONS = [
  { value: "walk_in", label: "Walk-in" },
  { value: "emergency", label: "Emergency" },
  { value: "referral", label: "Referral" },
] as const;

export const NATURE_OF_VISIT_OPTIONS = [
  { value: "new_consultation", label: "New consultation / case" },
  { value: "new_admission", label: "New admission" },
  { value: "follow_up", label: "Follow-up visit" },
] as const;

export const VISIT_TYPE_OPTIONS = [
  { value: "general", label: "General" },
  { value: "dental_care", label: "Dental care" },
  { value: "child_care", label: "Child care" },
  { value: "injury", label: "Injury" },
  { value: "adult_immunization", label: "Adult immunization" },
  { value: "tuberculosis", label: "Tuberculosis" },
  { value: "child_immunization", label: "Child immunization" },
  { value: "sick_children", label: "Sick children" },
  { value: "firecracker_injury", label: "Firecracker injury" },
  { value: "mental_health", label: "Mental health" },
] as const;

/** Lab test ids match the seeded `lab_tests` table order. */
export const LAB_TEST_OPTIONS = [
  { id: 1, name: "Complete Blood Count (CBC)" },
  { id: 2, name: "Urinalysis" },
  { id: 3, name: "Stool Examination" },
  { id: 4, name: "Blood Sugar Test" },
  { id: 5, name: "Electrolyte Panel" },
  { id: 6, name: "X-ray" },
] as const;

/** Suggestions for the diagnosis field (free text is allowed). */
export const COMMON_DIAGNOSES = [
  { label: "Essential hypertension", icd10: "I10" },
  { label: "Acute upper respiratory infection", icd10: "J06.9" },
  { label: "Acute gastroenteritis", icd10: "A09" },
  { label: "Urinary tract infection", icd10: "N39.0" },
  { label: "Type 2 diabetes mellitus", icd10: "E11.9" },
  { label: "Community-acquired pneumonia", icd10: "J18.9" },
  { label: "Bronchial asthma", icd10: "J45.9" },
  { label: "Contact dermatitis", icd10: "L25.9" },
  { label: "Myalgia", icd10: "M79.1" },
  { label: "Dengue fever", icd10: "A90" },
  { label: "Fever, unspecified", icd10: "R50.9" },
  { label: "Pulmonary tuberculosis", icd10: "A15.0" },
  { label: "Influenza-like illness", icd10: "J11.1" },
  { label: "Open wound", icd10: "T14.1" },
  { label: "Dental caries", icd10: "K02.9" },
  { label: "Anemia", icd10: "D64.9" },
] as const;

export const COMMON_MEDICATIONS = [
  "Paracetamol 500 mg tablet",
  "Amoxicillin 500 mg capsule",
  "Losartan 50 mg tablet",
  "Amlodipine 5 mg tablet",
  "Metformin 500 mg tablet",
  "Cetirizine 10 mg tablet",
  "Oral rehydration salts",
  "Salbutamol 2 mg tablet",
  "Mefenamic acid 500 mg capsule",
  "Cotrimoxazole 800/160 mg tablet",
  "Ascorbic acid 500 mg tablet",
  "Ferrous sulfate 325 mg tablet",
  "Zinc sulfate 20 mg syrup",
] as const;

export function optionLabel(
  options: readonly { value: string; label: string }[],
  value: string | null | undefined,
) {
  return options.find((o) => o.value === value)?.label ?? "—";
}
