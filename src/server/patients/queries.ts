import "server-only";
import { AGE_GROUP_OPTIONS, type AgeGroup } from "@/lib/constants";
import { requirePermission } from "@/lib/auth/session";
import { ageInYears } from "@/lib/format";
import type { PatientListItem, Sex } from "@/lib/types/patient";
import { mockStore } from "@/mocks/store";

export type PatientListParams = {
  q?: string;
  barangayId?: number;
  sex?: Sex;
  ageGroup?: AgeGroup;
  page?: number;
  pageSize?: number;
};

export type Paginated<T> = { rows: T[]; total: number; page: number; pageSize: number; pageCount: number };

// MOCK: replace the body with a Drizzle query in phase B1 (keep the signature).
export async function listPatients(params: PatientListParams): Promise<Paginated<PatientListItem>> {
  await requirePermission("patient:read");
  const { patients, lastVisitAt } = mockStore();
  const pageSize = params.pageSize ?? 20;

  const q = params.q?.trim().toLowerCase();
  const ageGroup = AGE_GROUP_OPTIONS.find((g) => g.value === params.ageGroup);

  const filtered = patients.filter((p) => {
    if (params.barangayId && p.barangayId !== params.barangayId) return false;
    if (params.sex && p.sex !== params.sex) return false;
    if (ageGroup) {
      const age = ageInYears(p.birthdate);
      if (age < ageGroup.min || age > ageGroup.max) return false;
    }
    if (q) {
      const haystack =
        `${p.firstName} ${p.middleName ?? ""} ${p.lastName} ${p.patientNo} ${p.contactNo ?? ""}`.toLowerCase();
      if (!q.split(/\s+/).every((term) => haystack.includes(term))) return false;
    }
    return true;
  });

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const page = Math.min(Math.max(1, params.page ?? 1), pageCount);
  const rows = filtered.slice((page - 1) * pageSize, page * pageSize).map((p) => ({
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
    lastVisitAt: lastVisitAt.get(p.id) ?? null,
  }));

  return { rows, total: filtered.length, page, pageSize, pageCount };
}

// MOCK: dashboard counts.
export async function patientStats() {
  await requirePermission("patient:read");
  const { patients } = mockStore();
  const monthAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
  return {
    total: patients.length,
    newThisMonth: patients.filter((p) => Date.parse(p.createdAt) >= monthAgo).length,
    female: patients.filter((p) => p.sex === "female").length,
    children: patients.filter((p) => ageInYears(p.birthdate) < 5).length,
  };
}
