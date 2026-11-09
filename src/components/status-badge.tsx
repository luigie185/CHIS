import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type Tone = "neutral" | "info" | "success" | "warning" | "danger";

const TONES: Record<Tone, string> = {
  neutral: "border-border bg-muted text-muted-foreground",
  info: "border-sky-500/30 bg-sky-500/10 text-sky-700 dark:text-sky-300",
  success: "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  warning: "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300",
  danger: "border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-300",
};

/** Status values from the schema enums (§5.3) and how they look. */
const STATUS: Record<string, { label: string; tone: Tone }> = {
  // encounter_status
  in_queue: { label: "Waiting", tone: "info" },
  in_progress: { label: "In progress", tone: "warning" },
  completed: { label: "Completed", tone: "success" },
  cancelled: { label: "Cancelled", tone: "neutral" },
  referred_out: { label: "Referred out", tone: "info" },
  // appointment_status
  scheduled: { label: "Scheduled", tone: "info" },
  missed: { label: "Missed", tone: "danger" },
  // pregnancy_status
  active: { label: "Active", tone: "success" },
  delivered: { label: "Delivered", tone: "info" },
  closed: { label: "Closed", tone: "neutral" },
  // risk_level
  low: { label: "Low", tone: "success" },
  moderate: { label: "Moderate", tone: "warning" },
  high: { label: "High", tone: "danger" },
  very_high: { label: "Very high", tone: "danger" },
  // philhealth_status
  member: { label: "Member", tone: "success" },
  dependent: { label: "Dependent", tone: "info" },
  none: { label: "None", tone: "neutral" },
  // user_status
  inactive: { label: "Inactive", tone: "neutral" },
};

export function StatusBadge({
  status,
  className,
}: {
  status: string | null | undefined;
  className?: string;
}) {
  if (!status) return <span className="text-muted-foreground">—</span>;
  const s = STATUS[status] ?? { label: status, tone: "neutral" as const };
  return (
    <Badge variant="outline" className={cn("font-medium", TONES[s.tone], className)}>
      {s.label}
    </Badge>
  );
}
