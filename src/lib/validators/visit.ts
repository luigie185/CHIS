import { z } from "zod";
import { optionalNumber, optionalText } from "./helpers";

/** Run the BP pair checks only when neither BP field has its own error. */
function bpParsed(payload: { issues: readonly { path?: readonly PropertyKey[] }[] }) {
  return !payload.issues.some((i) => {
    const key = i.path?.[i.path.length - 1];
    return key === "bpSystolic" || key === "bpDiastolic";
  });
}

export const vitalsSchema = z
  .object({
    bpSystolic: optionalNumber(50, 300, { int: true, unit: "mmHg" }),
    bpDiastolic: optionalNumber(20, 200, { int: true, unit: "mmHg" }),
    temperatureC: optionalNumber(30, 45, { unit: "°C" }),
    heightCm: optionalNumber(20, 250, { unit: "cm" }),
    weightKg: optionalNumber(0.5, 350, { unit: "kg" }),
    heartRate: optionalNumber(20, 250, { int: true, unit: "bpm" }),
    respiratoryRate: optionalNumber(5, 80, { int: true, unit: "/min" }),
    oxygenSaturation: optionalNumber(50, 100, { int: true, unit: "%" }),
  })
  // Checked whenever both BP fields parsed, even if another vital sign has an error.
  .refine((v) => (v.bpSystolic === null) === (v.bpDiastolic === null), {
    path: ["bpDiastolic"],
    message: "Enter both systolic and diastolic",
    when: bpParsed,
  })
  .refine((v) => v.bpSystolic === null || v.bpDiastolic === null || v.bpSystolic > v.bpDiastolic, {
    path: ["bpDiastolic"],
    message: "Diastolic must be lower than systolic",
    when: bpParsed,
  });

/** Staff intake for an ITR visit (§5.4.4): visit details, incoming referral, vitals. */
export const visitSchema = z
  .object({
    modeOfTransaction: z.enum(["walk_in", "emergency", "referral"], { error: "Select mode of transaction" }),
    natureOfVisit: z.enum(["new_consultation", "new_admission", "follow_up"], {
      error: "Select nature of visit",
    }),
    visitType: z.enum(
      [
        "general",
        "dental_care",
        "child_care",
        "injury",
        "adult_immunization",
        "tuberculosis",
        "child_immunization",
        "sick_children",
        "firecracker_injury",
        "mental_health",
      ],
      { error: "Select purpose of visit" },
    ),
    referredFrom: optionalText(200),
    referredBy: optionalText(200),
    referralReason: optionalText(1000),
    vitals: vitalsSchema,
  })
  .superRefine((v, ctx) => {
    if (v.modeOfTransaction !== "referral") return;
    if (!v.referredFrom)
      ctx.addIssue({ code: "custom", path: ["referredFrom"], message: "Enter the referring facility" });
    if (!v.referralReason)
      ctx.addIssue({ code: "custom", path: ["referralReason"], message: "Enter the reason for referral" });
  });

export type VisitInput = z.input<typeof visitSchema>;
export type VisitData = z.output<typeof visitSchema>;

/** Body mass index, rounded to one decimal. */
export function computeBmi(heightCm: number | null, weightKg: number | null): number | null {
  if (!heightCm || !weightKg) return null;
  const m = heightCm / 100;
  return Math.round((weightKg / (m * m)) * 10) / 10;
}

export function bmiCategory(bmi: number | null): string | null {
  if (bmi === null) return null;
  if (bmi < 18.5) return "Underweight";
  if (bmi < 25) return "Normal";
  if (bmi < 30) return "Overweight";
  return "Obese";
}
