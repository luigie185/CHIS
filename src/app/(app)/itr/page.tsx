import { format, parseISO } from "date-fns";
import type { Metadata } from "next";
import Link from "next/link";
import { DataTable, type Column } from "@/components/data-table/data-table";
import { DataTableToolbar } from "@/components/data-table/data-table-toolbar";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { BARANGAY_OPTIONS, optionLabel, VISIT_TYPE_OPTIONS } from "@/lib/constants";
import { requirePermission } from "@/lib/auth/session";
import { formatAge, sexLabel } from "@/lib/format";
import { getEnum, getInt, getString } from "@/lib/search-params";
import type { EncounterListItem, EncounterStatus, VisitType } from "@/lib/types/encounter";
import { listEncounters, PERIOD_OPTIONS, type Period } from "@/server/encounters/queries";

export const metadata: Metadata = { title: "Consultations (ITR)" };

const STATUS_OPTIONS: { value: EncounterStatus; label: string }[] = [
  { value: "in_queue", label: "Waiting" },
  { value: "in_progress", label: "In progress" },
  { value: "completed", label: "Completed" },
  { value: "referred_out", label: "Referred out" },
  { value: "cancelled", label: "Cancelled" },
];

const columns: Column<EncounterListItem>[] = [
  {
    header: "Date",
    className: "whitespace-nowrap",
    cell: (e) => (
      <Link href={`/itr/${e.id}`} className="block hover:underline">
        <span className="font-medium">{format(parseISO(e.encounterAt), "MMM d, yyyy")}</span>
        <span className="block text-xs text-muted-foreground">
          {format(parseISO(e.encounterAt), "h:mm a")} · #{e.queueNumber}
        </span>
      </Link>
    ),
  },
  {
    header: "Patient",
    cell: (e) => (
      <Link href={`/itr/${e.id}`} className="block min-w-0 hover:underline">
        <span className="block truncate font-medium">{e.patient.name}</span>
        <span className="block text-xs text-muted-foreground">
          {sexLabel(e.patient.sex)} · {formatAge(e.patient.birthdate)}
        </span>
      </Link>
    ),
  },
  { header: "Barangay", cell: (e) => e.patient.barangayName, hideOnMobile: true },
  { header: "Purpose", cell: (e) => optionLabel(VISIT_TYPE_OPTIONS, e.visitType), hideOnMobile: true },
  {
    header: "Diagnosis",
    cell: (e) => e.primaryDiagnosis ?? <span className="text-muted-foreground">—</span>,
    hideOnMobile: true,
  },
  {
    header: "Doctor",
    cell: (e) => (e.assignedDoctorName ? `Dr. ${e.assignedDoctorName}` : "—"),
    hideOnMobile: true,
  },
  { header: "Status", cell: (e) => <StatusBadge status={e.status} /> },
];

export default async function ItrPage({ searchParams }: PageProps<"/itr">) {
  await requirePermission("patient:read");
  const sp = await searchParams;
  const period =
    getEnum(
      sp,
      "period",
      PERIOD_OPTIONS.map((p) => p.value),
    ) ?? "30d";
  const result = await listEncounters({
    q: getString(sp, "q"),
    period: period as Period,
    status: getEnum(
      sp,
      "status",
      STATUS_OPTIONS.map((s) => s.value),
    ),
    visitType: getEnum(
      sp,
      "type",
      VISIT_TYPE_OPTIONS.map((v) => v.value),
    ) as VisitType | undefined,
    barangayId: getInt(sp, "barangay"),
    page: getInt(sp, "page"),
  });

  return (
    <>
      <PageHeader
        title="Consultations (ITR)"
        description="Individual Treatment Records — every general consultation visit."
      />
      <DataTableToolbar
        searchPlaceholder="Patient name, patient no., or diagnosis"
        filters={[
          {
            param: "period",
            label: "Periods",
            allLabel: "Last 30 days",
            options: PERIOD_OPTIONS.filter((p) => p.value !== "30d").map((p) => ({
              value: p.value,
              label: p.label,
            })),
          },
          { param: "status", label: "Statuses", options: STATUS_OPTIONS },
          {
            param: "type",
            label: "Purposes",
            options: VISIT_TYPE_OPTIONS.map((v) => ({ value: v.value, label: v.label })),
          },
          {
            param: "barangay",
            label: "Barangays",
            options: BARANGAY_OPTIONS.map((b) => ({ value: String(b.id), label: b.name })),
          },
        ]}
      />
      <DataTable
        columns={columns}
        rows={result.rows}
        rowKey={(e) => e.id}
        page={result.page}
        pageCount={result.pageCount}
        total={result.total}
        pageSize={result.pageSize}
        emptyTitle="No consultations found"
      />
    </>
  );
}
