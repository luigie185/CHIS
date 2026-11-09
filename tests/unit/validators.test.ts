import { describe, expect, it } from "vitest";
import { completeConsultationSchema, consultationSchema } from "@/lib/validators/consultation";
import { patientSchema } from "@/lib/validators/patient";
import { bmiCategory, computeBmi, vitalsSchema, visitSchema } from "@/lib/validators/visit";

const emptyVitals = {
  bpSystolic: "",
  bpDiastolic: "",
  temperatureC: "",
  heightCm: "",
  weightKg: "",
  heartRate: "",
  respiratoryRate: "",
  oxygenSaturation: "",
};
const messages = (r: { success: boolean; error?: { issues: { path: PropertyKey[]; message: string }[] } }) =>
  r.success ? [] : r.error!.issues.map((i) => `${i.path.join(".")}: ${i.message}`);

describe("vital signs", () => {
  it("accepts all-blank vitals and converts numbers", () => {
    expect(vitalsSchema.parse(emptyVitals).temperatureC).toBeNull();
    expect(vitalsSchema.parse({ ...emptyVitals, temperatureC: "37.2" }).temperatureC).toBe(37.2);
  });

  it("flags diastolic ≥ systolic even when another field is also wrong", () => {
    const r = vitalsSchema.safeParse({
      ...emptyVitals,
      bpSystolic: "80",
      bpDiastolic: "120",
      oxygenSaturation: "150",
    });
    expect(messages(r)).toEqual(
      expect.arrayContaining([
        "oxygenSaturation: Must be between 50 and 100 %",
        "bpDiastolic: Diastolic must be lower than systolic",
      ]),
    );
  });

  it("requires both BP numbers", () => {
    expect(messages(vitalsSchema.safeParse({ ...emptyVitals, bpSystolic: "120" }))).toContain(
      "bpDiastolic: Enter both systolic and diastolic",
    );
  });

  it("computes BMI", () => {
    expect(computeBmi(158, 62)).toBe(24.8);
    expect(bmiCategory(24.8)).toBe("Normal");
    expect(computeBmi(null, 62)).toBeNull();
  });
});

describe("visit details", () => {
  const visit = {
    modeOfTransaction: "walk_in",
    natureOfVisit: "new_consultation",
    visitType: "general",
    vitals: emptyVitals,
  };
  it("requires referral details only for referrals", () => {
    expect(visitSchema.safeParse(visit).success).toBe(true);
    const r = visitSchema.safeParse({ ...visit, modeOfTransaction: "referral" });
    expect(messages(r)).toEqual([
      "referredFrom: Enter the referring facility",
      "referralReason: Enter the reason for referral",
    ]);
  });
});

describe("patient", () => {
  const patient = {
    firstName: "Juana",
    lastName: "Dela Cruz",
    sex: "female",
    birthdate: "1990-05-12",
    barangayId: "11",
    contactNo: "0917 123 4567",
    privacyConsent: true,
  };
  it("accepts a valid patient and normalizes the contact number", () => {
    const r = patientSchema.parse(patient);
    expect(r.contactNo).toBe("09171234567");
    expect(r.barangayId).toBe(11);
    expect(r.middleName).toBeNull();
  });
  it("rejects bad contact numbers, future birthdates and missing consent", () => {
    expect(patientSchema.safeParse({ ...patient, contactNo: "0917123" }).success).toBe(false);
    expect(patientSchema.safeParse({ ...patient, birthdate: "2999-01-01" }).success).toBe(false);
    expect(patientSchema.safeParse({ ...patient, privacyConsent: false }).success).toBe(false);
  });
});

describe("consultation", () => {
  const base = {
    chiefComplaints: "Cough",
    diagnoses: [],
    labTestIds: [],
    prescriptions: [],
    referOut: false,
  };
  it("allows a draft without diagnosis but not completing without one", () => {
    expect(consultationSchema.safeParse(base).success).toBe(true);
    expect(messages(completeConsultationSchema.safeParse(base))).toContain(
      "diagnoses: Add at least one diagnosis",
    );
  });
  it("needs exactly one primary diagnosis", () => {
    const two = {
      ...base,
      diagnoses: [
        { label: "A", isPrimary: true },
        { label: "B", isPrimary: true },
      ],
    };
    expect(messages(consultationSchema.safeParse(two))).toContain(
      "diagnoses: Mark exactly one diagnosis as primary",
    );
  });
  it("requires facility and reason when referring out", () => {
    const r = consultationSchema.safeParse({ ...base, referOut: true });
    expect(messages(r)).toEqual([
      "referredTo: Enter the receiving facility",
      "referralReason: Enter the reason for referral",
    ]);
  });
  it("rejects unknown lab tests", () => {
    expect(consultationSchema.safeParse({ ...base, labTestIds: [99] }).success).toBe(false);
  });
});
