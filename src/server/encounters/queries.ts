import "server-only";
import { format, subDays } from "date-fns";
import { requirePermission } from "@/lib/auth/session";
import { formatPatientName } from "@/lib/format";
import type { Encounter, EncounterListItem, EncounterStatus, VisitType } from "@/lib/types/encounter";
import type { Patient } from "@/lib/types/patient";
import { mockDelay, mockStore } from "@/mocks/store";
import { paginate, type Paginated } from "../patients/queries";

export const todayKey = () => format(new Date(), "yyyy-MM-dd");

function toListItem(e: Encounter, patients: Map<string, Patient>): EncounterListItem {
  const p = patients.get(e.patientId)!;
  return {
    id: e.id,
    status: e.status,
    modeOfTransaction: e.modeOfTransaction,
    natureOfVisit: e.natureOfVisit,
    visitType: e.visitType,
    encounterAt: e.encounterAt,
    queueDate: e.queueDate,
    queueNumber: e.queueNumber,
    assignedDoctorId: e.assignedDoctorId,
    assignedDoctorName: e.assignedDoctorName,
    startedAt: e.startedAt,
    completedAt: e.completedAt,
    patient: {
      id: p.id,
      name: formatPatientName(p),
      patientNo: p.patientNo,
      sex: p.sex,
      birthdate: p.birthdate,
      barangayName: p.barangayName,
    },
    primaryDiagnosis: e.diagnoses.find((d) => d.isPrimary)?.label ?? null,
  };
}

const patientMap = () => new Map(mockStore().patients.map((p) => [p.id, p]));

// MOCK: replace the bodies below with Drizzle queries in phase B2 (keep the signatures).

/** Today's queue in first-come-first-served order (queue number). */
export async function getTodayQueue(): Promise<{
  waiting: EncounterListItem[];
  inProgress: EncounterListItem[];
  done: EncounterListItem[];
  cancelled: EncounterListItem[];
}> {
  await requirePermission("patient:read");
  await mockDelay();
  const today = todayKey();
  const patients = patientMap();
  const items = mockStore()
    .encounters.filter((e) => e.queueDate === today)
    .sort((a, b) => a.queueNumber - b.queueNumber)
    .map((e) => toListItem(e, patients));
  return {
    waiting: items.filter((e) => e.status === "in_queue"),
    inProgress: items.filter((e) => e.status === "in_progress"),
    done: items.filter((e) => e.status === "completed" || e.status === "referred_out").reverse(),
    cancelled: items.filter((e) => e.status === "cancelled"),
  };
}

export type EncounterDetail = Encounter & { patient: Patient };

export async function getEncounter(id: string): Promise<EncounterDetail | null> {
  await requirePermission("patient:read");
  await mockDelay();
  const e = mockStore().encounters.find((x) => x.id === id);
  if (!e) return null;
  const patient = mockStore().patients.find((p) => p.id === e.patientId)!;
  return { ...e, patient };
}

/** Earlier visits of a patient, newest first (for the profile and the doctor's history panel). */
export async function getPatientEncounters(
  patientId: string,
  options: { excludeId?: string; limit?: number } = {},
) {
  await requirePermission("patient:read");
  return mockStore()
    .encounters.filter((e) => e.patientId === patientId && e.id !== options.excludeId)
    .sort((a, b) => b.encounterAt.localeCompare(a.encounterAt))
    .slice(0, options.limit ?? 50);
}

export const PERIOD_OPTIONS = [
  { value: "today", label: "Today", days: 0 },
  { value: "7d", label: "Last 7 days", days: 6 },
  { value: "30d", label: "Last 30 days", days: 29 },
  { value: "90d", label: "Last 90 days", days: 89 },
  { value: "all", label: "All time", days: null },
] as const;
export type Period = (typeof PERIOD_OPTIONS)[number]["value"];

export type EncounterListParams = {
  q?: string;
  period?: Period;
  status?: EncounterStatus;
  visitType?: VisitType;
  barangayId?: number;
  page?: number;
};

/** ITR table: general consultations, newest first. */
export async function listEncounters(params: EncounterListParams): Promise<Paginated<EncounterListItem>> {
  await requirePermission("patient:read");
  await mockDelay();
  const patients = patientMap();
  const period = PERIOD_OPTIONS.find((p) => p.value === (params.period ?? "30d"))!;
  const from = period.days === null ? null : format(subDays(new Date(), period.days), "yyyy-MM-dd");
  const q = params.q?.trim().toLowerCase();

  const filtered = mockStore()
    .encounters.filter((e) => {
      if (from && e.queueDate < from) return false;
      if (params.status && e.status !== params.status) return false;
      if (params.visitType && e.visitType !== params.visitType) return false;
      const p = patients.get(e.patientId)!;
      if (params.barangayId && p.barangayId !== params.barangayId) return false;
      if (q) {
        const hay =
          `${p.firstName} ${p.lastName} ${p.patientNo} ${e.diagnoses.map((d) => d.label).join(" ")}`.toLowerCase();
        if (!q.split(/\s+/).every((t) => hay.includes(t))) return false;
      }
      return true;
    })
    .sort((a, b) => b.encounterAt.localeCompare(a.encounterAt));

  const page = paginate(filtered, params.page, 20);
  return { ...page, rows: page.rows.map((e) => toListItem(e, patients)) };
}

/** Counts for the staff and doctor dashboards. */
export async function todayCounts() {
  await requirePermission("patient:read");
  const today = todayKey();
  const list = mockStore().encounters.filter((e) => e.queueDate === today);
  return {
    total: list.length,
    waiting: list.filter((e) => e.status === "in_queue").length,
    inProgress: list.filter((e) => e.status === "in_progress").length,
    done: list.filter((e) => e.status === "completed" || e.status === "referred_out").length,
    cancelled: list.filter((e) => e.status === "cancelled").length,
  };
}

/** Aggregated numbers only — no names (admin reports, plan §4.1). */
export async function visitReport() {
  await requirePermission("reports:read");
  await mockDelay();
  const { encounters, patients } = mockStore();
  const today = new Date();
  const days = Array.from({ length: 14 }, (_, i) => format(subDays(today, 13 - i), "yyyy-MM-dd"));
  const monthFrom = format(subDays(today, 29), "yyyy-MM-dd");
  const closed = encounters.filter((e) => e.status === "completed" || e.status === "referred_out");
  const month = closed.filter((e) => e.queueDate >= monthFrom);

  const diagnosisCounts = new Map<string, number>();
  for (const e of month) {
    for (const d of e.diagnoses) diagnosisCounts.set(d.label, (diagnosisCounts.get(d.label) ?? 0) + 1);
  }
  const barangayCounts = new Map<string, number>();
  const byId = new Map(patients.map((p) => [p.id, p]));
  for (const e of month) {
    const b = byId.get(e.patientId)!.barangayName;
    barangayCounts.set(b, (barangayCounts.get(b) ?? 0) + 1);
  }

  return {
    today: encounters.filter((e) => e.queueDate === format(today, "yyyy-MM-dd")).length,
    last30Days: month.length,
    referredOut30Days: month.filter((e) => e.status === "referred_out").length,
    patients: patients.length,
    perDay: days.map((d) => ({ date: d, count: closed.filter((e) => e.queueDate === d).length })),
    topDiagnoses: [...diagnosisCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([label, count]) => ({ label, count })),
    byBarangay: [...barangayCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([name, count]) => ({ name, count })),
  };
}
