import { z } from "zod";
import { LAB_TEST_OPTIONS } from "@/lib/constants";
import { optionalIsoDate, optionalText, requiredText } from "./helpers";

const diagnosisSchema = z.object({
  label: requiredText("Diagnosis", 200),
  icd10Code: optionalText(10),
  isPrimary: z.boolean(),
});

const prescriptionSchema = z.object({
  medication: requiredText("Medication", 200),
  dosage: requiredText("Dosage", 100),
  frequency: requiredText("Frequency", 100),
  duration: requiredText("Duration", 100),
  quantity: optionalText(50),
  notes: optionalText(500),
});

/** Doctor's consultation (§5.4.5). `complete` adds the rules needed to close the visit. */
export const consultationSchema = z
  .object({
    chiefComplaints: requiredText("Chief complaint", 2000),
    historyOfPresentIllness: optionalText(4000),
    physicalExam: optionalText(4000),
    assessmentNotes: optionalText(4000),
    plan: optionalText(4000),
    followUpDate: optionalIsoDate,
    diagnoses: z.array(diagnosisSchema).max(10),
    labTestIds: z
      .array(
        z
          .number()
          .int()
          .refine((id) => LAB_TEST_OPTIONS.some((t) => t.id === id)),
      )
      .max(20),
    prescriptions: z.array(prescriptionSchema).max(20),
    referOut: z.boolean(),
    referredTo: optionalText(200),
    referralReason: optionalText(1000),
  })
  .superRefine((v, ctx) => {
    if (v.diagnoses.length > 0 && v.diagnoses.filter((d) => d.isPrimary).length !== 1) {
      ctx.addIssue({ code: "custom", path: ["diagnoses"], message: "Mark exactly one diagnosis as primary" });
    }
    if (v.referOut) {
      if (!v.referredTo)
        ctx.addIssue({ code: "custom", path: ["referredTo"], message: "Enter the receiving facility" });
      if (!v.referralReason)
        ctx.addIssue({ code: "custom", path: ["referralReason"], message: "Enter the reason for referral" });
    }
  });

/** Completing requires at least one diagnosis. */
export const completeConsultationSchema = consultationSchema.superRefine((v, ctx) => {
  if (v.diagnoses.length === 0)
    ctx.addIssue({ code: "custom", path: ["diagnoses"], message: "Add at least one diagnosis" });
});

export type ConsultationInput = z.input<typeof consultationSchema>;
export type ConsultationData = z.output<typeof consultationSchema>;
