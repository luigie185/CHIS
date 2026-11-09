import "server-only";
import { AGE_GROUP_OPTIONS, type AgeGroup } from "@/lib/constants";
import { requirePermission } from "@/lib/auth/session";
import { ageInYears, formatPatientName } from "@/lib/format";
import type { Patient, PatientListItem, Sex } from "@/lib/types/patient";
import { mockDelay, mockStore } from "@/mocks/store";

export type PatientListParams = {
  q?: string;
  barangayId?: number;
  sex?: Sex;
  ageGroup?: AgeGroup;
  page?: number;
  pageSize?: number;
};

export type Paginated<T> = { rows: T[]; total: number; page: number; pageSize: number; pageCount: number };

export function paginate<T>(items: T[], page = 1, pageSize = 20): Paginated<T> {
  const pageCount = Math.max(1, Math.ceil(items.length / pageSize));
  const current = Math.min(Math.max(1, page), pageCount);
  return {
    rows: items.slice((current - 1) * pageSize, current * pageSize),
    total: items.length,
    page: current,
    pageSize,
    pageCount,
  };
}

function matchesQuery(p: Patient, q: string) {
  const haystack =
    `${p.firstName} ${p.middleName ?? ""} ${p.lastName} ${p.patientNo} ${p.contactNo ?? ""}`.toLowerCase();
  return q
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .every((term) => haystack.includes(term));
}

function lastVisitMap() {
  const map = new Map<string, string>();
  for (const e of mockStore().encounters) {
    if (e.status === "cancelled") continue;
    const prev = map.get(e.patientId);
    if (!prev || e.encounterAt > prev) map.set(e.patientId, e.encounterAt);
  }
  return map;
}

// MOCK: replace the bodies below with Drizzle queries in phase B1 (keep the signatures).

export async function listPatients(params: PatientListParams): Promise<Paginated<PatientListItem>> {
  await requirePermission("patient:read");
  await mockDelay();
  const { patients } = mockStore();
  const lastVisit = lastVisitMap();
  const q = params.q?.trim();
  const ageGroup = AGE_GROUP_OPTIONS.find((g) => g.value === params.ageGroup);

  const filtered = patients.filter((p) => {
    if (params.barangayId && p.barangayId !== params.barangayId) return false;
    if (params.sex && p.sex !== params.sex) return false;
    if (ageGroup) {
      const age = ageInYears(p.birthdate);
      if (age < ageGroup.min || age > ageGroup.max) return false;
    }
    return !q || matchesQuery(p, q);
  });

  const page = paginate(filtered, params.page, params.pageSize ?? 20);
  return {
    ...page,
    rows: page.rows.map((p) => ({
      id: p.id,
      patientNo: p.patientNo,
      firstName: p.firstName,
      middleName: p.middleName,
      lastName: p.lastName,
      suffix: p.suffix,
      sex: p.sex,
      birthdate: p.birthdate,
      barangayName: p.barangayName,
      contactNo: p.contactNo,
      philhealthStatus: p.philhealthStatus,
      lastVisitAt: lastVisit.get(p.id) ?? null,
    })),
  };
}

export async function getPatient(id: string): Promise<Patient | null> {
  await requirePermission("patient:read");
  await mockDelay();
  return mockStore().patients.find((p) => p.id === id) ?? null;
}

export type PatientSearchResult = Pick<
  Patient,
  "id" | "patientNo" | "sex" | "birthdate" | "barangayName" | "contactNo"
> & {
  name: string;
};

function toSearchResult(p: Patient): PatientSearchResult {
  return {
    id: p.id,
    name: formatPatientName(p),
    patientNo: p.patientNo,
    sex: p.sex,
    birthdate: p.birthdate,
    barangayName: p.barangayName,
    contactNo: p.contactNo,
  };
}

/** Quick search for the New visit wizard. */
export async function searchPatients(q: string, limit = 8): Promise<PatientSearchResult[]> {
  await requirePermission("patient:read");
  const query = q.trim();
  if (query.length < 2) return [];
  return mockStore()
    .patients.filter((p) => matchesQuery(p, query))
    .slice(0, limit)
    .map(toSearchResult);
}

/** Same last name + first name + birthdate (plan §6.3 duplicate detection). */
export async function findDuplicatePatients(input: {
  firstName: string;
  lastName: string;
  birthdate: string;
}): Promise<PatientSearchResult[]> {
  await requirePermission("patient:read");
  const norm = (s: string) => s.trim().toLowerCase().replace(/\s+/g, " ");
  return mockStore()
    .patients.filter(
      (p) =>
        norm(p.lastName) === norm(input.lastName) &&
        norm(p.firstName) === norm(input.firstName) &&
        p.birthdate === input.birthdate,
    )
    .map(toSearchResult);
}

export async function patientStats() {
  await requirePermission("patient:read");
  const { patients } = mockStore();
  const monthAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
  return {
    total: patients.length,
    newThisMonth: patients.filter((p) => Date.parse(p.createdAt) >= monthAgo).length,
  };
}
