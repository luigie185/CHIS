"use server";

import { revalidatePath } from "next/cache";
import { barangayName } from "@/lib/constants";
import { requirePermission } from "@/lib/auth/session";
import type { Patient } from "@/lib/types/patient";
import { patientSchema, type PatientInput } from "@/lib/validators/patient";
import { mockDelay, mockStore } from "@/mocks/store";
import { type ActionResult, validationFailed } from "../action-result";
import { logAudit } from "../audit";
import { findDuplicatePatients, type PatientSearchResult } from "./queries";

export type RegisterPatientResult =
  | ActionResult<{ id: string; patientNo: string; name: string }>
  | { ok: false; error: "duplicate"; duplicates: PatientSearchResult[] };

function nextPatientNo(): string {
  const year = new Date().getFullYear();
  const max = mockStore().patients.reduce((m, p) => Math.max(m, Number(p.patientNo.slice(-6)) || 0), 0);
  return `RHU-${year}-${String(max + 1).padStart(6, "0")}`;
}

// MOCK: insert into `patients` inside a transaction in phase B1.
export async function registerPatient(
  input: PatientInput,
  options: { allowDuplicate?: boolean } = {},
): Promise<RegisterPatientResult> {
  const user = await requirePermission("patient:write");
  const parsed = patientSchema.safeParse(input);
  if (!parsed.success) return validationFailed(parsed.error);
  const data = parsed.data;

  if (!options.allowDuplicate) {
    const duplicates = await findDuplicatePatients(data);
    if (duplicates.length > 0) return { ok: false, error: "duplicate", duplicates };
  }

  await mockDelay(300);
  const now = new Date().toISOString();
  const patient: Patient = {
    id: crypto.randomUUID(),
    patientNo: nextPatientNo(),
    firstName: data.firstName,
    middleName: data.middleName,
    lastName: data.lastName,
    suffix: data.suffix,
    sex: data.sex,
    birthdate: data.birthdate,
    civilStatus: data.civilStatus,
    contactNo: data.contactNo,
    purok: data.purok,
    barangayId: data.barangayId,
    barangayName: barangayName(data.barangayId),
    philhealthNo: data.philhealthNo,
    philhealthStatus: data.philhealthStatus,
    is4psMember: data.is4psMember,
    bloodType: data.bloodType,
    privacyConsentAt: now,
    createdAt: now,
  };
  mockStore().patients.push(patient);
  await logAudit({
    actorId: user.id,
    action: "patient.create",
    entityType: "patient",
    entityId: patient.id,
    patientId: patient.id,
  });
  revalidatePath("/patients");

  return {
    ok: true,
    data: { id: patient.id, patientNo: patient.patientNo, name: `${patient.lastName}, ${patient.firstName}` },
  };
}

/** Used by the New visit wizard's patient search box. */
export async function searchPatientsAction(q: string) {
  const { searchPatients } = await import("./queries");
  return searchPatients(q);
}
