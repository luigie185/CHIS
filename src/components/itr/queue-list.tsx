import { differenceInMinutes, format, parseISO } from "date-fns";
import Link from "next/link";
import { EmptyState } from "@/components/empty-state";
import { StatusBadge } from "@/components/status-badge";
import { Badge } from "@/components/ui/badge";
import { MODE_OF_TRANSACTION_OPTIONS, optionLabel, VISIT_TYPE_OPTIONS } from "@/lib/constants";
import { formatAge } from "@/lib/format";
import type { EncounterListItem } from "@/lib/types/encounter";
import { cn } from "@/lib/utils";
import { CancelVisitButton } from "./cancel-visit-button";

function waited(at: string) {
  const mins = differenceInMinutes(new Date(), parseISO(at));
  return mins < 60 ? `${mins} min` : `${Math.floor(mins / 60)} h ${mins % 60} min`;
}

/** Today's queue rows, first come first served. */
export function QueueList({
  items,
  canCancel = false,
  highlightFirst = false,
  linkToRecord = false,
  emptyTitle = "No patients waiting",
}: {
  items: EncounterListItem[];
  canCancel?: boolean;
  highlightFirst?: boolean;
  linkToRecord?: boolean;
  emptyTitle?: string;
}) {
  if (items.length === 0) return <EmptyState title={emptyTitle} className="py-8" />;
  return (
    <ol className="divide-y rounded-lg border">
      {items.map((e, i) => (
        <li
          key={e.id}
          className={cn("flex items-center gap-3 px-3 py-3", highlightFirst && i === 0 && "bg-primary/5")}
        >
          <span
            className={cn(
              "flex size-10 shrink-0 items-center justify-center rounded-lg border text-lg font-semibold tabular-nums",
              highlightFirst && i === 0 && "border-primary text-primary",
            )}
          >
            {e.queueNumber}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate font-medium">
              {linkToRecord ? (
                <Link href={`/itr/${e.id}`} className="hover:underline">
                  {e.patient.name}
                </Link>
              ) : (
                e.patient.name
              )}
            </p>
            <p className="truncate text-xs text-muted-foreground">
              <span className="capitalize">{e.patient.sex}</span> · {formatAge(e.patient.birthdate)} ·{" "}
              {e.patient.barangayName} · {optionLabel(VISIT_TYPE_OPTIONS, e.visitType)}
            </p>
          </div>
          <div className="hidden flex-col items-end gap-1 text-xs text-muted-foreground sm:flex">
            <span>Arrived {format(parseISO(e.encounterAt), "h:mm a")}</span>
            {e.status === "in_queue" && <span>Waiting {waited(e.encounterAt)}</span>}
            {e.status !== "in_queue" && e.assignedDoctorName && <span>Dr. {e.assignedDoctorName}</span>}
          </div>
          {e.modeOfTransaction !== "walk_in" && (
            <Badge
              variant="outline"
              className={cn(
                e.modeOfTransaction === "emergency" && "border-red-500/40 text-red-700 dark:text-red-400",
              )}
            >
              {optionLabel(MODE_OF_TRANSACTION_OPTIONS, e.modeOfTransaction)}
            </Badge>
          )}
          {e.status !== "in_queue" ? (
            <StatusBadge status={e.status} />
          ) : (
            canCancel && (
              <CancelVisitButton
                encounterId={e.id}
                patientName={e.patient.name}
                queueNumber={e.queueNumber}
              />
            )
          )}
        </li>
      ))}
    </ol>
  );
}
