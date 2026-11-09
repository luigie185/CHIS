export type EncounterStatus = "in_queue" | "in_progress" | "completed" | "cancelled" | "referred_out";
export type ModeOfTransaction = "walk_in" | "emergency" | "referral";
export type NatureOfVisit = "new_consultation" | "new_admission" | "follow_up";
export type VisitType =
  | "general"
  | "dental_care"
  | "child_care"
  | "injury"
  | "adult_immunization"
  | "tuberculosis"
  | "child_immunization"
  | "sick_children"
  | "firecracker_injury"
  | "mental_health";

/** §5.4.4 vital_signs. BMI is computed. */
export type VitalSigns = {
  bpSystolic: number | null;
  bpDiastolic: number | null;
  temperatureC: number | null;
  heightCm: number | null;
  weightKg: number | null;
  heartRate: number | null;
  respiratoryRate: number | null;
  oxygenSaturation: number | null;
};

export type Referral = {
  direction: "incoming" | "outgoing";
  referredFrom: string | null;
  referredTo: string | null;
  reason: string;
  referredBy: string | null;
};

export type Diagnosis = { label: string; icd10Code: string | null; isPrimary: boolean };
export type LabRequest = { labTestId: number; labTestName: string; status: "requested" };
export type Prescription = {
  medication: string;
  dosage: string;
  frequency: string;
  duration: string;
  quantity: string | null;
  notes: string | null;
};

/** §5.4.5 consultations — written by the doctor. */
export type Consultation = {
  chiefComplaints: string;
  historyOfPresentIllness: string | null;
  physicalExam: string | null;
  assessmentNotes: string | null;
  plan: string | null;
  followUpDate: string | null;
};

/** A general (ITR) encounter with everything recorded on it. */
export type Encounter = {
  id: string;
  patientId: string;
  program: "general";
  status: EncounterStatus;
  modeOfTransaction: ModeOfTransaction;
  natureOfVisit: NatureOfVisit;
  visitType: VisitType;
  encounterAt: string; // ISO timestamp
  queueDate: string; // yyyy-mm-dd, queue numbers reset daily
  queueNumber: number;
  createdById: string;
  createdByName: string;
  assignedDoctorId: string | null;
  assignedDoctorName: string | null;
  startedAt: string | null;
  completedAt: string | null;
  cancelledReason: string | null;
  vitals: VitalSigns | null;
  incomingReferral: Referral | null;
  outgoingReferral: Referral | null;
  consultation: Consultation | null;
  diagnoses: Diagnosis[];
  labRequests: LabRequest[];
  prescriptions: Prescription[];
};

/** Row in the queue / ITR tables. */
export type EncounterListItem = Pick<
  Encounter,
  | "id"
  | "status"
  | "modeOfTransaction"
  | "natureOfVisit"
  | "visitType"
  | "encounterAt"
  | "queueDate"
  | "queueNumber"
  | "assignedDoctorId"
  | "assignedDoctorName"
  | "startedAt"
  | "completedAt"
> & {
  patient: {
    id: string;
    name: string;
    patientNo: string;
    sex: "male" | "female";
    birthdate: string;
    barangayName: string;
  };
  primaryDiagnosis: string | null;
};
