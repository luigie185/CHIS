import { addMinutes, format, isSunday, setHours, setMinutes, subDays } from "date-fns";
import { COMMON_DIAGNOSES, LAB_TEST_OPTIONS } from "@/lib/constants";
import { ageInYears } from "@/lib/format";
import type { Diagnosis, Encounter, Prescription, VisitType, VitalSigns } from "@/lib/types/encounter";
import type { Patient } from "@/lib/types/patient";
import type { Random } from "../random";

export const MOCK_DOCTOR = { id: "mock-doctor", name: "Andrea Villanueva" };
export const MOCK_STAFF = [
  { id: "mock-staff-1", name: "Rowena Santos" },
  { id: "mock-staff-2", name: "Mark Bautista" },
];

type Clinical = {
  diagnosis: (typeof COMMON_DIAGNOSES)[number]["label"];
  complaints: string[];
  rx: Omit<Prescription, "notes">[];
  labs?: number[];
  visitType?: VisitType;
  adultOnly?: boolean;
};

const CLINICAL: Clinical[] = [
  {
    diagnosis: "Essential hypertension",
    complaints: [
      "Headache and nape pain for 3 days",
      "Dizziness since this morning",
      "For BP monitoring and maintenance refill",
    ],
    rx: [
      {
        medication: "Losartan 50 mg tablet",
        dosage: "1 tablet",
        frequency: "Once a day",
        duration: "30 days",
        quantity: "30",
      },
    ],
    labs: [4, 5],
    adultOnly: true,
  },
  {
    diagnosis: "Acute upper respiratory infection",
    complaints: ["Cough and colds for 4 days", "Sore throat and runny nose", "Fever and cough for 2 days"],
    rx: [
      {
        medication: "Paracetamol 500 mg tablet",
        dosage: "1 tablet",
        frequency: "Every 4 hours as needed for fever",
        duration: "3 days",
        quantity: "10",
      },
      {
        medication: "Cetirizine 10 mg tablet",
        dosage: "1 tablet",
        frequency: "Once a day at bedtime",
        duration: "5 days",
        quantity: "5",
      },
    ],
  },
  {
    diagnosis: "Acute gastroenteritis",
    complaints: ["Loose bowel movement 5 times since yesterday", "Vomiting and abdominal pain"],
    rx: [
      {
        medication: "Oral rehydration salts",
        dosage: "1 sachet in 1 L water",
        frequency: "After each loose stool",
        duration: "3 days",
        quantity: "6 sachets",
      },
      {
        medication: "Zinc sulfate 20 mg syrup",
        dosage: "5 mL",
        frequency: "Once a day",
        duration: "10 days",
        quantity: "1 bottle",
      },
    ],
    labs: [3],
  },
  {
    diagnosis: "Urinary tract infection",
    complaints: ["Painful urination for 2 days", "Frequent urination with lower abdominal pain"],
    rx: [
      {
        medication: "Cotrimoxazole 800/160 mg tablet",
        dosage: "1 tablet",
        frequency: "Twice a day",
        duration: "7 days",
        quantity: "14",
      },
    ],
    labs: [2],
    adultOnly: true,
  },
  {
    diagnosis: "Type 2 diabetes mellitus",
    complaints: ["For blood sugar monitoring", "Frequent urination and thirst"],
    rx: [
      {
        medication: "Metformin 500 mg tablet",
        dosage: "1 tablet",
        frequency: "Twice a day after meals",
        duration: "30 days",
        quantity: "60",
      },
    ],
    labs: [4],
    adultOnly: true,
  },
  {
    diagnosis: "Community-acquired pneumonia",
    complaints: ["Productive cough and difficulty breathing for 5 days", "High fever with chest pain"],
    rx: [
      {
        medication: "Amoxicillin 500 mg capsule",
        dosage: "1 capsule",
        frequency: "Every 8 hours",
        duration: "7 days",
        quantity: "21",
      },
    ],
    labs: [1, 6],
  },
  {
    diagnosis: "Bronchial asthma",
    complaints: ["Wheezing and shortness of breath since last night"],
    rx: [
      {
        medication: "Salbutamol 2 mg tablet",
        dosage: "1 tablet",
        frequency: "Three times a day",
        duration: "5 days",
        quantity: "15",
      },
    ],
  },
  {
    diagnosis: "Contact dermatitis",
    complaints: ["Itchy rashes on both arms for 1 week"],
    rx: [
      {
        medication: "Cetirizine 10 mg tablet",
        dosage: "1 tablet",
        frequency: "Once a day",
        duration: "7 days",
        quantity: "7",
      },
    ],
  },
  {
    diagnosis: "Myalgia",
    complaints: ["Body pain after farm work", "Lower back pain for 3 days"],
    rx: [
      {
        medication: "Mefenamic acid 500 mg capsule",
        dosage: "1 capsule",
        frequency: "Three times a day after meals",
        duration: "3 days",
        quantity: "9",
      },
    ],
    adultOnly: true,
  },
  {
    diagnosis: "Open wound",
    complaints: ["Laceration on left foot from bolo", "Wound on right hand after fall"],
    rx: [
      {
        medication: "Amoxicillin 500 mg capsule",
        dosage: "1 capsule",
        frequency: "Every 8 hours",
        duration: "7 days",
        quantity: "21",
      },
    ],
    visitType: "injury",
  },
  {
    diagnosis: "Dental caries",
    complaints: ["Toothache on lower left molar"],
    rx: [
      {
        medication: "Mefenamic acid 500 mg capsule",
        dosage: "1 capsule",
        frequency: "Every 8 hours as needed for pain",
        duration: "3 days",
        quantity: "6",
      },
    ],
    visitType: "dental_care",
  },
  {
    diagnosis: "Anemia",
    complaints: ["Easy fatigability and pallor"],
    rx: [
      {
        medication: "Ferrous sulfate 325 mg tablet",
        dosage: "1 tablet",
        frequency: "Once a day",
        duration: "30 days",
        quantity: "30",
      },
    ],
    labs: [1],
  },
  {
    diagnosis: "Dengue fever",
    complaints: ["High grade fever for 3 days with body malaise"],
    rx: [
      {
        medication: "Paracetamol 500 mg tablet",
        dosage: "1 tablet",
        frequency: "Every 4 hours as needed for fever",
        duration: "3 days",
        quantity: "12",
      },
    ],
    labs: [1],
  },
  {
    diagnosis: "Pulmonary tuberculosis",
    complaints: ["Cough for more than 2 weeks with weight loss"],
    rx: [],
    labs: [6],
    visitType: "tuberculosis",
    adultOnly: true,
  },
];

const HOSPITALS = ["Provincial Hospital", "District Hospital", "Regional Medical Center"];
const REFERRING = [
  "Barangay Health Station – Poblacion",
  "Barangay Health Station – Kanitoan",
  "Private clinic",
];

function vitalsFor(r: Random, age: number): VitalSigns {
  const child = age < 12;
  const height = child ? r.int(55, 150) : r.int(145, 178);
  const weight = child ? Math.round(height * 0.18 * 10) / 10 + r.int(0, 8) : r.int(42, 88);
  return {
    bpSystolic: child ? null : r.int(100, 165),
    bpDiastolic: child ? null : r.int(60, 100),
    temperatureC: Math.round((36.2 + r.next() * 2.4) * 10) / 10,
    heightCm: height,
    weightKg: weight,
    heartRate: child ? r.int(80, 130) : r.int(60, 105),
    respiratoryRate: child ? r.int(20, 32) : r.int(14, 22),
    oxygenSaturation: r.int(94, 100),
  };
}

function fixBp(v: VitalSigns): VitalSigns {
  if (v.bpSystolic !== null && v.bpDiastolic !== null && v.bpDiastolic >= v.bpSystolic) {
    return { ...v, bpDiastolic: v.bpSystolic - 30 };
  }
  return v;
}

function buildEncounter(
  r: Random,
  patient: Patient,
  at: Date,
  queueNumber: number,
  status: Encounter["status"],
): Encounter {
  const age = ageInYears(patient.birthdate, at);
  const choices = CLINICAL.filter((c) => !c.adultOnly || age >= 15);
  const c = r.pick(choices);
  const mode = r.chance(0.85) ? "walk_in" : r.chance(0.5) ? "emergency" : "referral";
  const staff = r.pick(MOCK_STAFF);
  const done = status === "completed" || status === "referred_out";
  const startedAt = done ? addMinutes(at, r.int(10, 60)) : null;
  const completedAt = startedAt ? addMinutes(startedAt, r.int(8, 25)) : null;
  const icd = COMMON_DIAGNOSES.find((d) => d.label === c.diagnosis)?.icd10 ?? null;
  const diagnoses: Diagnosis[] = done ? [{ label: c.diagnosis, icd10Code: icd, isPrimary: true }] : [];
  const labIds = done && c.labs && r.chance(0.6) ? c.labs : [];

  return {
    id: r.uuid(),
    patientId: patient.id,
    program: "general",
    status,
    modeOfTransaction: mode,
    natureOfVisit: r.chance(0.7) ? "new_consultation" : "follow_up",
    visitType: c.visitType ?? (age < 5 ? "child_care" : "general"),
    encounterAt: at.toISOString(),
    queueDate: format(at, "yyyy-MM-dd"),
    queueNumber,
    createdById: staff.id,
    createdByName: staff.name,
    assignedDoctorId: done ? MOCK_DOCTOR.id : null,
    assignedDoctorName: done ? MOCK_DOCTOR.name : null,
    startedAt: startedAt?.toISOString() ?? null,
    completedAt: completedAt?.toISOString() ?? null,
    cancelledReason:
      status === "cancelled" ? r.pick(["Patient left before consultation", "Duplicate entry"]) : null,
    vitals: fixBp(vitalsFor(r, age)),
    incomingReferral:
      mode === "referral"
        ? {
            direction: "incoming",
            referredFrom: r.pick(REFERRING),
            referredTo: "Rural Health Unit",
            reason: "For further evaluation",
            referredBy: "BHW on duty",
          }
        : null,
    outgoingReferral:
      status === "referred_out"
        ? {
            direction: "outgoing",
            referredFrom: "Rural Health Unit",
            referredTo: r.pick(HOSPITALS),
            reason: "For further management and diagnostics",
            referredBy: MOCK_DOCTOR.name,
          }
        : null,
    consultation: done
      ? {
          chiefComplaints: r.pick(c.complaints),
          historyOfPresentIllness: null,
          physicalExam: r.chance(0.5) ? "Conscious, coherent, not in distress." : null,
          assessmentNotes: null,
          plan: r.chance(0.5) ? "Advised increased oral fluids and rest. Return if symptoms persist." : null,
          followUpDate: null,
        }
      : null,
    diagnoses,
    labRequests: labIds.map((id) => ({
      labTestId: id,
      labTestName: LAB_TEST_OPTIONS.find((t) => t.id === id)?.name ?? "",
      status: "requested" as const,
    })),
    prescriptions: done ? c.rx.map((p) => ({ ...p, notes: null })) : [],
  };
}

/** A patient who was already registered at that time. */
function pickRegistered(r: Random, patients: Patient[], at: Date): Patient {
  const iso = at.toISOString();
  return r.pick(patients.filter((p) => p.createdAt <= iso));
}

/**
 * ITR visits for the last 90 days (closed) plus today's queue:
 * the first few of today are completed, the rest are waiting (first come, first served).
 */
export function generateEncounters(r: Random, patients: Patient[], now: Date): Encounter[] {
  const encounters: Encounter[] = [];

  for (let daysAgo = 90; daysAgo >= 1; daysAgo--) {
    const day = subDays(now, daysAgo);
    if (isSunday(day)) continue;
    const count = r.int(5, 14);
    let t = setMinutes(setHours(day, 7), 45);
    for (let q = 1; q <= count; q++) {
      t = addMinutes(t, r.int(8, 30));
      const roll = r.next();
      const status = roll < 0.9 ? "completed" : roll < 0.95 ? "referred_out" : "cancelled";
      encounters.push(buildEncounter(r, pickRegistered(r, patients, t), t, q, status));
    }
  }

  // Today: 9 patients arrived over the last ~100 minutes; first 4 done, 5 waiting.
  const todayCount = 9;
  for (let q = 1; q <= todayCount; q++) {
    const at = addMinutes(now, -(todayCount - q + 1) * 11);
    encounters.push(
      buildEncounter(r, pickRegistered(r, patients, at), at, q, q <= 4 ? "completed" : "in_queue"),
    );
  }
  return encounters;
}
