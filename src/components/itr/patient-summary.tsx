import { Badge } from "@/components/ui/badge";
import { formatAge, formatDate, formatPatientName, sexLabel } from "@/lib/format";
import { optionLabel, CIVIL_STATUS_OPTIONS } from "@/lib/constants";
import type { Patient } from "@/lib/types/patient";
import { cn } from "@/lib/utils";

/** Compact patient identity block used on the wizard, consultation and visit record. */
export function PatientSummary({
  patient,
  className,
  detailed = false,
}: {
  patient: Patient;
  className?: string;
  detailed?: boolean;
}) {
  const rows: [string, React.ReactNode][] = [
    [
      "Patient no.",
      <span key="no" className="font-mono">
        {patient.patientNo}
      </span>,
    ],
    [
      "Sex / Age",
      <span key="sa">
        {sexLabel(patient.sex)} · {formatAge(patient.birthdate)}
      </span>,
    ],
    ["Birthdate", formatDate(patient.birthdate)],
    ["Address", [patient.purok, patient.barangayName].filter(Boolean).join(", ")],
    ["Contact", patient.contactNo ?? "—"],
  ];
  if (detailed) {
    rows.push(
      ["Civil status", optionLabel(CIVIL_STATUS_OPTIONS, patient.civilStatus)],
      [
        "PhilHealth",
        patient.philhealthNo
          ? `${patient.philhealthNo} (${patient.philhealthStatus})`
          : (patient.philhealthStatus ?? "—"),
      ],
      ["Blood type", patient.bloodType ?? "—"],
    );
  }
  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <div className="flex flex-wrap items-center gap-2">
        <p className="text-lg font-semibold">{formatPatientName(patient)}</p>
        {patient.is4psMember && <Badge variant="secondary">4Ps</Badge>}
      </div>
      <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
        {rows.map(([k, v]) => (
          <div key={k} className="contents">
            <dt className="text-muted-foreground">{k}</dt>
            <dd className="min-w-0 truncate">{v}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
