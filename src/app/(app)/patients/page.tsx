import type { Metadata } from "next";
import Link from "next/link";
import { UserPlus } from "lucide-react";
import { DataTable, type Column } from "@/components/data-table/data-table";
import { DataTableToolbar } from "@/components/data-table/data-table-toolbar";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { AGE_GROUP_OPTIONS, BARANGAY_OPTIONS, SEX_OPTIONS } from "@/lib/constants";
import { formatAge, formatDate, formatPatientName } from "@/lib/format";
import { getEnum, getInt, getString } from "@/lib/search-params";
import type { PatientListItem } from "@/lib/types/patient";
import { listPatients } from "@/server/patients/queries";

export const metadata: Metadata = { title: "Patients" };

const columns: Column<PatientListItem>[] = [
  {
    header: "Patient",
    cell: (p) => (
      <div className="min-w-0">
        <p className="truncate font-medium">{formatPatientName(p)}</p>
        <p className="font-mono text-xs text-muted-foreground">{p.patientNo}</p>
      </div>
    ),
  },
  { header: "Sex", cell: (p) => <span className="capitalize">{p.sex}</span>, hideOnMobile: true },
  { header: "Age", cell: (p) => formatAge(p.birthdate), className: "whitespace-nowrap" },
  { header: "Barangay", cell: (p) => p.barangayName, hideOnMobile: true },
  { header: "Contact", cell: (p) => p.contactNo ?? "—", hideOnMobile: true },
  { header: "PhilHealth", cell: (p) => <StatusBadge status={p.philhealthStatus} />, hideOnMobile: true },
  {
    header: "Last visit",
    cell: (p) => formatDate(p.lastVisitAt),
    hideOnMobile: true,
    className: "whitespace-nowrap",
  },
];

export default async function PatientsPage({ searchParams }: PageProps<"/patients">) {
  const sp = await searchParams;
  const result = await listPatients({
    q: getString(sp, "q"),
    barangayId: getInt(sp, "barangay"),
    sex: getEnum(sp, "sex", ["male", "female"] as const),
    ageGroup: getEnum(
      sp,
      "age",
      AGE_GROUP_OPTIONS.map((g) => g.value),
    ),
    page: getInt(sp, "page"),
  });

  return (
    <>
      <PageHeader
        title="Patients"
        description="Search the patient registry by name, patient number, or contact number."
        actions={
          <Tooltip>
            <TooltipTrigger asChild>
              <span tabIndex={0}>
                <Button disabled>
                  <UserPlus />
                  Register patient
                </Button>
              </span>
            </TooltipTrigger>
            <TooltipContent>Coming in F2</TooltipContent>
          </Tooltip>
        }
      />
      <DataTableToolbar
        searchPlaceholder="Name, patient no., or contact"
        filters={[
          {
            param: "barangay",
            label: "Barangays",
            options: BARANGAY_OPTIONS.map((b) => ({ value: String(b.id), label: b.name })),
          },
          {
            param: "sex",
            label: "Sexes",
            options: SEX_OPTIONS.map((s) => ({ value: s.value, label: s.label })),
          },
          {
            param: "age",
            label: "Ages",
            options: AGE_GROUP_OPTIONS.map((g) => ({ value: g.value, label: g.label })),
          },
        ]}
      />
      <DataTable
        columns={columns}
        rows={result.rows}
        rowKey={(p) => p.id}
        page={result.page}
        pageCount={result.pageCount}
        total={result.total}
        pageSize={result.pageSize}
        emptyTitle="No patients match"
      />
      <p className="mt-6 text-xs text-muted-foreground">
        Patient profiles open from this list in F2.{" "}
        <Link href="/ui-kit" className="underline">
          View UI components
        </Link>
      </p>
    </>
  );
}
