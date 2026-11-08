export type Sex = "male" | "female";
export type CivilStatus = "single" | "married" | "widowed" | "separated" | "live_in";
export type PhilhealthStatus = "member" | "dependent" | "none";

/** Patient as the UI sees it (matches the `patients` table in §5.4.3, plus the barangay name). */
export type Patient = {
  id: string;
  patientNo: string;
  firstName: string;
  middleName: string | null;
  lastName: string;
  suffix: string | null;
  sex: Sex;
  birthdate: string; // ISO date, yyyy-mm-dd
  civilStatus: CivilStatus | null;
  contactNo: string | null;
  purok: string | null;
  barangayId: number;
  barangayName: string;
  philhealthNo: string | null;
  philhealthStatus: PhilhealthStatus | null;
  is4psMember: boolean;
  bloodType: string | null;
  createdAt: string; // ISO timestamp
};

export type PatientListItem = Pick<
  Patient,
  | "id"
  | "patientNo"
  | "firstName"
  | "middleName"
  | "lastName"
  | "suffix"
  | "sex"
  | "birthdate"
  | "barangayName"
  | "contactNo"
  | "philhealthStatus"
> & { lastVisitAt: string | null };
