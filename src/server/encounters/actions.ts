"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { LAB_TEST_OPTIONS } from "@/lib/constants";
import { requirePermission } from "@/lib/auth/session";
import type { Encounter } from "@/lib/types/encounter";
import { cancelEncounterSchema } from "@/lib/validators/cancel";
import {
  completeConsultationSchema,
  consultationSchema,
  type ConsultationInput,
} from "@/lib/validators/consultation";
import { visitSchema, type VisitInput } from "@/lib/validators/visit";
import { mockDelay, mockStore } from "@/mocks/store";
import { type ActionResult, validationFailed } from "../action-result";
import { logAudit } from "../audit";
import { todayKey } from "./queries";

function revalidateQueue() {
  for (const path of ["/queue", "/doctor", "/dashboard", "/itr", "/patients"]) revalidatePath(path);
}

// MOCK: these mutate the in-memory store; in phase B2 they become Drizzle transactions.

/** Staff: save visit details + vitals and put the patient in today's queue. */
export async function createVisit(
  patientId: string,
  input: VisitInput,
): Promise<ActionResult<{ id: string; queueNumber: number }>> {
  const user = await requirePermission("encounter:create");
  const parsed = visitSchema.safeParse(input);
  if (!parsed.success) return validationFailed(parsed.error);
  const v = parsed.data;

  const store = mockStore();
  if (!store.patients.some((p) => p.id === patientId)) return { ok: false, error: "Patient not found." };
  const today = todayKey();
  if (
    store.encounters.some(
      (e) =>
        e.patientId === patientId &&
        e.queueDate === today &&
        (e.status === "in_queue" || e.status === "in_progress"),
    )
  ) {
    return { ok: false, error: "This patient is already in today's queue." };
  }

  await mockDelay(300);
  const queueNumber =
    Math.max(0, ...store.encounters.filter((e) => e.queueDate === today).map((e) => e.queueNumber)) + 1;
  const encounter: Encounter = {
    id: crypto.randomUUID(),
    patientId,
    program: "general",
    status: "in_queue",
    modeOfTransaction: v.modeOfTransaction,
    natureOfVisit: v.natureOfVisit,
    visitType: v.visitType,
    encounterAt: new Date().toISOString(),
    queueDate: today,
    queueNumber,
    createdById: user.id,
    createdByName: user.name,
    assignedDoctorId: null,
    assignedDoctorName: null,
    startedAt: null,
    completedAt: null,
    cancelledReason: null,
    vitals: v.vitals,
    incomingReferral:
      v.modeOfTransaction === "referral"
        ? {
            direction: "incoming",
            referredFrom: v.referredFrom,
            referredTo: "Rural Health Unit",
            reason: v.referralReason ?? "",
            referredBy: v.referredBy,
          }
        : null,
    outgoingReferral: null,
    consultation: null,
    diagnoses: [],
    labRequests: [],
    prescriptions: [],
  };
  store.encounters.push(encounter);
  await logAudit({
    actorId: user.id,
    action: "encounter.create",
    entityType: "encounter",
    entityId: encounter.id,
    patientId,
  });
  revalidateQueue();
  return { ok: true, data: { id: encounter.id, queueNumber } };
}

/** Staff or doctor: take a waiting patient out of the queue, with a reason. */
export async function cancelEncounter(id: string, reason: string): Promise<ActionResult> {
  const user = await requirePermission("encounter:cancel");
  const parsed = cancelEncounterSchema.safeParse({ reason });
  if (!parsed.success) return validationFailed(parsed.error);
  const e = mockStore().encounters.find((x) => x.id === id);
  if (!e) return { ok: false, error: "Visit not found." };
  if (e.status !== "in_queue")
    return { ok: false, error: "Only waiting patients can be removed from the queue." };
  e.status = "cancelled";
  e.cancelledReason = parsed.data.reason;
  await logAudit({
    actorId: user.id,
    action: "encounter.cancel",
    entityType: "encounter",
    entityId: id,
    patientId: e.patientId,
  });
  revalidateQueue();
  return { ok: true };
}

/**
 * Doctor: first come, first served. Resumes the doctor's open consultation if there is one,
 * otherwise takes the waiting patient with the lowest queue number.
 */
export async function callNextPatient(): Promise<void> {
  const user = await requirePermission("queue:consult");
  const store = mockStore();
  const today = todayKey();
  const mine = store.encounters.find((e) => e.status === "in_progress" && e.assignedDoctorId === user.id);
  if (mine) redirect(`/doctor/consult/${mine.id}`);

  const next = store.encounters
    .filter((e) => e.queueDate === today && e.status === "in_queue")
    .sort((a, b) => a.queueNumber - b.queueNumber)[0];
  if (!next) redirect("/doctor?empty=1");

  next.status = "in_progress";
  next.assignedDoctorId = user.id;
  next.assignedDoctorName = user.name;
  next.startedAt = new Date().toISOString();
  await logAudit({
    actorId: user.id,
    action: "encounter.start",
    entityType: "encounter",
    entityId: next.id,
    patientId: next.patientId,
  });
  revalidateQueue();
  redirect(`/doctor/consult/${next.id}`);
}

/** Doctor: save the consultation; `complete` closes the visit (completed, or referred out). */
export async function saveConsultation(
  id: string,
  input: ConsultationInput,
  complete: boolean,
): Promise<ActionResult<{ status: Encounter["status"] }>> {
  const user = await requirePermission(complete ? "encounter:complete" : "consultation:write");
  const parsed = (complete ? completeConsultationSchema : consultationSchema).safeParse(input);
  if (!parsed.success) return validationFailed(parsed.error);
  const c = parsed.data;

  const e = mockStore().encounters.find((x) => x.id === id);
  if (!e) return { ok: false, error: "Visit not found." };
  if (e.status !== "in_progress") return { ok: false, error: "This consultation is already closed." };
  if (e.assignedDoctorId !== user.id)
    return { ok: false, error: "This patient is being seen by another doctor." };

  await mockDelay(300);
  e.consultation = {
    chiefComplaints: c.chiefComplaints,
    historyOfPresentIllness: c.historyOfPresentIllness,
    physicalExam: c.physicalExam,
    assessmentNotes: c.assessmentNotes,
    plan: c.plan,
    followUpDate: c.followUpDate,
  };
  e.diagnoses = c.diagnoses;
  e.labRequests = c.labTestIds.map((labTestId) => ({
    labTestId,
    labTestName: LAB_TEST_OPTIONS.find((t) => t.id === labTestId)!.name,
    status: "requested" as const,
  }));
  e.prescriptions = c.prescriptions;
  e.outgoingReferral = c.referOut
    ? {
        direction: "outgoing",
        referredFrom: "Rural Health Unit",
        referredTo: c.referredTo,
        reason: c.referralReason ?? "",
        referredBy: user.name,
      }
    : null;

  if (complete) {
    e.status = c.referOut ? "referred_out" : "completed";
    e.completedAt = new Date().toISOString();
  }
  await logAudit({
    actorId: user.id,
    action: complete ? "encounter.complete" : "consultation.update",
    entityType: "encounter",
    entityId: id,
    patientId: e.patientId,
    changedFields: [
      "consultation",
      "diagnoses",
      "lab_requests",
      "prescriptions",
      ...(c.referOut ? ["referrals"] : []),
    ],
  });
  revalidateQueue();
  revalidatePath(`/itr/${id}`);
  return { ok: true, data: { status: e.status } };
}
