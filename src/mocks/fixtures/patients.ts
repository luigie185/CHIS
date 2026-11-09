import { addDays, formatISO, subDays, subYears } from "date-fns";
import { BARANGAY_OPTIONS } from "@/lib/constants";
import type { CivilStatus, Patient, PhilhealthStatus, Sex } from "@/lib/types/patient";
import { BLOOD_TYPES, FEMALE_FIRST_NAMES, LAST_NAMES, MALE_FIRST_NAMES, PUROKS } from "../names";
import type { Random } from "../random";

/** Ages skewed like an RHU catchment: many children and women of reproductive age. */
function randomAge(r: Random): number {
  const bucket = r.next();
  if (bucket < 0.22) return r.int(0, 4);
  if (bucket < 0.4) return r.int(5, 17);
  if (bucket < 0.85) return r.int(18, 59);
  return r.int(60, 88);
}

export function generatePatients(r: Random, count: number, today: Date): Patient[] {
  const patients: Patient[] = [];
  for (let i = 0; i < count; i++) {
    const sex: Sex = r.chance(0.56) ? "female" : "male";
    const age = randomAge(r);
    const birthdate = addDays(subYears(today, age + 1), r.int(1, 364));
    const registered = subDays(today, r.int(0, 3 * 365));
    const adult = age >= 18;
    const civilStatus: CivilStatus | null = adult
      ? r.pick<CivilStatus>(["single", "married", "married", "married", "widowed", "live_in", "separated"])
      : "single";
    const philhealthStatus: PhilhealthStatus = r.pick(["member", "member", "dependent", "dependent", "none"]);
    const barangay = r.pick(BARANGAY_OPTIONS);
    const year = registered.getFullYear();

    patients.push({
      id: r.uuid(),
      patientNo: `RHU-${year}-${String(i + 1).padStart(6, "0")}`,
      firstName: r.pick(sex === "female" ? FEMALE_FIRST_NAMES : MALE_FIRST_NAMES),
      middleName: r.chance(0.85) ? r.pick(LAST_NAMES) : null,
      lastName: r.pick(LAST_NAMES),
      suffix: sex === "male" && r.chance(0.05) ? r.pick(["Jr.", "Sr.", "III"]) : null,
      sex,
      birthdate: formatISO(birthdate, { representation: "date" }),
      civilStatus,
      contactNo:
        adult && r.chance(0.8) ? `09${r.int(10, 99)}${String(r.int(0, 9999999)).padStart(7, "0")}` : null,
      purok: r.pick(PUROKS),
      barangayId: barangay.id,
      barangayName: barangay.name,
      philhealthNo:
        philhealthStatus === "none"
          ? null
          : `${r.int(10, 19)}-${String(r.int(0, 999999999)).padStart(9, "0")}-${r.int(0, 9)}`,
      philhealthStatus,
      is4psMember: r.chance(0.18),
      bloodType: r.chance(0.4) ? r.pick(BLOOD_TYPES) : null,
      privacyConsentAt: registered.toISOString(),
      createdAt: registered.toISOString(),
    });
  }
  return patients.sort(
    (a, b) => a.lastName.localeCompare(b.lastName) || a.firstName.localeCompare(b.firstName),
  );
}
