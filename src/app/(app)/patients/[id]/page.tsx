import { format, parseISO } from "date-fns";
import { Plus } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PatientSummary } from "@/components/itr/patient-summary";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { optionLabel, VISIT_TYPE_OPTIONS } from "@/lib/constants";
import { hasPermission } from "@/lib/auth/permissions";
import { requirePermission } from "@/lib/auth/session";
import { formatDate, formatPatientName } from "@/lib/format";
import { getPatientEncounters } from "@/server/encounters/queries";
import { getPatient } from "@/server/patients/queries";

export const metadata: Metadata = { title: "Patient" };

export default async function PatientProfilePage({ params }: PageProps<"/patients/[id]">) {
  const user = await requirePermission("patient:read");
  const { id } = await params;
  const patient = await getPatient(id);
  if (!patient) notFound();
  const visits = await getPatientEncounters(id);

  return (
    <>
      <PageHeader
        title={formatPatientName(patient)}
        description={`Registered ${formatDate(patient.createdAt)}`}
        actions={
          hasPermission(user.role, "encounter:create") && (
            <Button asChild>
              <Link href={`/visits/new?patientId=${patient.id}`}>
                <Plus /> New visit
              </Link>
            </Button>
          )
        }
      />
      <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
        <Card className="self-start">
          <CardHeader>
            <CardTitle>Personal information</CardTitle>
          </CardHeader>
          <CardContent>
            <PatientSummary patient={patient} detailed />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Visits ({visits.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {visits.length === 0 ? (
              <p className="text-sm text-muted-foreground">No visits yet.</p>
            ) : (
              <div className="overflow-hidden rounded-lg border">
                <Table>
                  <TableHeader className="bg-muted/50">
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead className="hidden sm:table-cell">Purpose</TableHead>
                      <TableHead>Diagnosis</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {visits.map((v) => (
                      <TableRow key={v.id}>
                        <TableCell className="whitespace-nowrap">
                          <Link href={`/itr/${v.id}`} className="font-medium hover:underline">
                            {format(parseISO(v.encounterAt), "MMM d, yyyy")}
                          </Link>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                          {optionLabel(VISIT_TYPE_OPTIONS, v.visitType)}
                        </TableCell>
                        <TableCell className="max-w-48 truncate">
                          {v.diagnoses.find((d) => d.isPrimary)?.label ?? "—"}
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={v.status} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
