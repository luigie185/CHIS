// Public descriptions of RHU services (plan §6.19). No patient data.
export type Service = {
  slug: string;
  title: string;
  summary: string;
  details: string[];
  whoFor: string;
  bring: string[];
};

export const SERVICES: Service[] = [
  {
    slug: "general-consultation",
    title: "General Consultation",
    summary:
      "Check-ups, diagnosis and treatment for common illnesses, with referral to hospitals when needed.",
    details: [
      "Vital signs and physical examination",
      "Diagnosis and prescriptions from the RHU physician",
      "Laboratory requests (CBC, urinalysis, blood sugar and more)",
      "Referral slips to partner hospitals",
    ],
    whoFor: "All residents, walk-in or referred.",
    bring: ["Any valid ID", "PhilHealth ID or number, if a member", "Previous prescriptions or lab results"],
  },
  {
    slug: "prenatal-care",
    title: "Prenatal & Postpartum Care",
    summary:
      "Regular check-ups for pregnant mothers, birth planning, and care for mother and baby after delivery.",
    details: [
      "At least four prenatal visits across all trimesters",
      "Blood pressure, weight and fetal heartbeat monitoring",
      "Iron and folic acid supplementation, Td vaccination",
      "Postpartum visits within 24 hours and 1 week after delivery",
    ],
    whoFor: "Pregnant women and new mothers.",
    bring: ["Mother and baby book, if any", "PhilHealth ID or number", "Previous ultrasound or lab results"],
  },
  {
    slug: "immunization",
    title: "Expanded Program on Immunization",
    summary: "Free routine vaccines for infants and children following the national immunization schedule.",
    details: [
      "BCG and Hepatitis B at birth",
      "Pentavalent, OPV, IPV and PCV from 6 weeks",
      "Measles, Mumps and Rubella (MMR) from 9 months",
      "Tracking toward Fully Immunized Child status",
    ],
    whoFor: "Infants and children 0–5 years old.",
    bring: ["Child's immunization card", "Birth certificate, for first visit"],
  },
  {
    slug: "vaccination",
    title: "Adult Vaccination",
    summary: "Influenza, pneumococcal and tetanus-diphtheria vaccines with appointment reminders.",
    details: [
      "Flu and pneumococcal vaccines for seniors",
      "Td vaccination for pregnant women",
      "Scheduled follow-up doses",
    ],
    whoFor: "Adults, seniors, and pregnant women.",
    bring: ["Any valid ID", "Senior citizen ID, if applicable"],
  },
  {
    slug: "risk-assessment",
    title: "NCD Risk Assessment",
    summary: "Screening for hypertension, diabetes and other non-communicable disease risks (PhilPEN).",
    details: [
      "Lifestyle screening: smoking, alcohol, diet, physical activity",
      "Blood pressure, waist circumference, blood sugar and cholesterol",
      "Risk level classification and follow-up for high-risk patients",
    ],
    whoFor: "Adults 20 years and older.",
    bring: ["Any valid ID", "Maintenance medicines, if any"],
  },
  {
    slug: "mental-health",
    title: "Mental Health",
    summary: "Individual and group sessions with trained staff, in a private and respectful setting.",
    details: [
      "Individual counselling sessions",
      "Group support sessions",
      "Referral to specialists when needed",
    ],
    whoFor: "Anyone who needs support. Sessions are confidential.",
    bring: ["Nothing required"],
  },
];

export function getService(slug: string) {
  return SERVICES.find((s) => s.slug === slug);
}
