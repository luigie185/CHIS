import { z } from "zod";
import { BARANGAYS } from "@/lib/constants";
import { isoDate, optionalText, requiredText } from "./helpers";

const today = () => new Date().toISOString().slice(0, 10);

/** Patient personal information (§5.4.3). Used by the intake form and the server action. */
export const patientSchema = z.object({
  firstName: requiredText("First name", 100),
  middleName: optionalText(100),
  lastName: requiredText("Last name", 100),
  suffix: optionalText(10),
  sex: z.enum(["male", "female"], { error: "Select sex" }),
  birthdate: isoDate.refine((d) => d <= today(), "Birthdate cannot be in the future"),
  civilStatus: z
    .enum(["single", "married", "widowed", "separated", "live_in"])
    .nullable()
    .optional()
    .transform((v) => v ?? null),
  contactNo: z
    .string()
    .trim()
    .optional()
    .transform((v) => (v ? v.replace(/[\s-]/g, "") : null))
    .refine((v) => v === null || /^09\d{9}$/.test(v), "Enter an 11-digit mobile number starting with 09"),
  purok: optionalText(100),
  barangayId: z.coerce
    .number({ error: "Select barangay" })
    .int()
    .min(1, "Select barangay")
    .max(BARANGAYS.length, "Select barangay"),
  philhealthNo: z
    .string()
    .trim()
    .optional()
    .transform((v) => (v ? v : null))
    .refine(
      (v) => v === null || /^\d{2}-?\d{9}-?\d$/.test(v),
      "PhilHealth number has 12 digits (00-000000000-0)",
    ),
  philhealthStatus: z
    .enum(["member", "dependent", "none"])
    .nullable()
    .optional()
    .transform((v) => v ?? null),
  is4psMember: z.boolean().default(false),
  bloodType: optionalText(5),
  privacyConsent: z.literal(true, { error: "The patient must consent to the privacy notice" }),
});

export type PatientInput = z.input<typeof patientSchema>;
export type PatientData = z.output<typeof patientSchema>;
