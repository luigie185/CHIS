import { differenceInMonths, differenceInYears, format, parseISO } from "date-fns";

/** "Dela Cruz, Juan P. Jr." */
export function formatPatientName(p: {
  firstName: string;
  middleName?: string | null;
  lastName: string;
  suffix?: string | null;
}): string {
  const mi = p.middleName ? ` ${p.middleName[0]}.` : "";
  const suffix = p.suffix ? ` ${p.suffix}` : "";
  return `${p.lastName}, ${p.firstName}${mi}${suffix}`;
}

/** Age is always computed from the birthdate (plan §5.1). Under 2 years shows months. */
export function formatAge(birthdate: string, on: Date = new Date()): string {
  const d = parseISO(birthdate);
  const years = differenceInYears(on, d);
  if (years >= 2) return `${years} yrs`;
  const months = differenceInMonths(on, d);
  return `${months} mo`;
}

export function ageInYears(birthdate: string, on: Date = new Date()): number {
  return differenceInYears(on, parseISO(birthdate));
}

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  return format(parseISO(iso), "MMM d, yyyy");
}

export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  return format(parseISO(iso), "MMM d, yyyy h:mm a");
}

export function sexLabel(sex: "male" | "female"): string {
  return sex === "male" ? "Male" : "Female";
}
