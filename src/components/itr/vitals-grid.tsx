import { bmiCategory, computeBmi } from "@/lib/validators/visit";
import type { VitalSigns } from "@/lib/types/encounter";
import { cn } from "@/lib/utils";

function flag(kind: "bp" | "temp" | "o2", v: VitalSigns): boolean {
  if (kind === "bp") return (v.bpSystolic ?? 0) >= 140 || (v.bpDiastolic ?? 0) >= 90;
  if (kind === "temp") return (v.temperatureC ?? 0) >= 37.8;
  return v.oxygenSaturation !== null && v.oxygenSaturation < 95;
}

/** Read-only vital signs, with abnormal values highlighted for the doctor. */
export function VitalsGrid({ vitals, className }: { vitals: VitalSigns | null; className?: string }) {
  if (!vitals) return <p className="text-sm text-muted-foreground">No vital signs recorded.</p>;
  const bmi = computeBmi(vitals.heightCm, vitals.weightKg);
  const items: { label: string; value: string; alert?: boolean }[] = [
    {
      label: "Blood pressure",
      value: vitals.bpSystolic ? `${vitals.bpSystolic}/${vitals.bpDiastolic} mmHg` : "—",
      alert: flag("bp", vitals),
    },
    {
      label: "Temperature",
      value: vitals.temperatureC ? `${vitals.temperatureC} °C` : "—",
      alert: flag("temp", vitals),
    },
    { label: "Heart rate", value: vitals.heartRate ? `${vitals.heartRate} bpm` : "—" },
    { label: "Respiratory rate", value: vitals.respiratoryRate ? `${vitals.respiratoryRate} /min` : "—" },
    {
      label: "O₂ saturation",
      value: vitals.oxygenSaturation ? `${vitals.oxygenSaturation}%` : "—",
      alert: flag("o2", vitals),
    },
    { label: "Height", value: vitals.heightCm ? `${vitals.heightCm} cm` : "—" },
    { label: "Weight", value: vitals.weightKg ? `${vitals.weightKg} kg` : "—" },
    { label: "BMI", value: bmi ? `${bmi} (${bmiCategory(bmi)})` : "—" },
  ];
  return (
    <dl className={cn("grid grid-cols-2 gap-3 sm:grid-cols-4", className)}>
      {items.map((i) => (
        <div
          key={i.label}
          className={cn("rounded-md border px-3 py-2", i.alert && "border-red-500/40 bg-red-500/5")}
        >
          <dt className="text-xs text-muted-foreground">{i.label}</dt>
          <dd className={cn("text-sm font-medium tabular-nums", i.alert && "text-red-700 dark:text-red-400")}>
            {i.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}
