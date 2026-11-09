import { format, parseISO } from "date-fns";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { PatientSummary } from "@/components/itr/patient-summary";
import { VitalsGrid } from "@/components/itr/vitals-grid";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  MODE_OF_TRANSACTION_OPTIONS,
  NATURE_OF_VISIT_OPTIONS,
  optionLabel,
  VISIT_TYPE_OPTIONS,
} from "@/lib/constants";
import { requirePermission } from "@/lib/auth/session";
import { formatDate } from "@/lib/format";
import { getEncounter, getPatientEncounters } from "@/server/encounters/queries";
import { ConsultationForm } from "./consultation-form";

export const metadata: Metadata = { title: "Consultation" };

export default async function ConsultPage({ params }: PageProps<"/doctor/consult/[id]">) {
  const user = await requirePermission("queue:consult");
  const { id } = await params;
  const e = await getEncounter(id);
  if (!e) notFound();
  // Closed visits, or a patient another doctor is seeing, open read-only.
  if (e.status !== "in_progress" || e.assignedDoctorId !== user.id) redirect(`/itr/${e.id}`);

  const history = await getPatientEncounters(e.patientId, { excludeId: e.id, limit: 6 });

  return (
    <>
      <PageHeader
        title={`Consultation · #${e.queueNumber}`}
        description={`Started ${e.startedAt ? format(parseISO(e.startedAt), "h:mm a") : ""} · intake by ${e.createdByName}`}
      />
      <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
        <div className="order-2 xl:order-1">
          <ConsultationForm
            encounterId={e.id}
            initial={{
              consultation: e.consultation,
              diagnoses: e.diagnoses,
              labTestIds: e.labRequests.map((l) => l.labTestId),
              prescriptions: e.prescriptions,
              outgoingReferral: e.outgoingReferral,
            }}
          />
        </div>
        <aside className="order-1 flex flex-col gap-4 xl:order-2">
          <Card>
            <CardHeader>
              <CardTitle>Patient</CardTitle>
            </CardHeader>
            <CardContent>
              <PatientSummary patient={e.patient} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Intake</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <dl className="grid grid-cols-2 gap-2 text-sm">
                <dt className="text-muted-foreground">Mode</dt>
                <dd>{optionLabel(MODE_OF_TRANSACTION_OPTIONS, e.modeOfTransaction)}</dd>
                <dt className="text-muted-foreground">Nature</dt>
                <dd>{optionLabel(NATURE_OF_VISIT_OPTIONS, e.natureOfVisit)}</dd>
                <dt className="text-muted-foreground">Purpose</dt>
                <dd>{optionLabel(VISIT_TYPE_OPTIONS, e.visitType)}</dd>
              </dl>
              {e.incomingReferral && (
                <p className="rounded-md border border-dashed p-2 text-sm">
                  <span className="font-medium">Referred from {e.incomingReferral.referredFrom}</span>
                  <br />
                  {e.incomingReferral.reason}
                </p>
              )}
              <VitalsGrid vitals={e.vitals} className="sm:grid-cols-2" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Previous visits</CardTitle>
            </CardHeader>
            <CardContent>
              {history.length === 0 ? (
                <p className="text-sm text-muted-foreground">First visit.</p>
              ) : (
                <ul className="flex flex-col gap-2 text-sm">
                  {history.map((h) => (
                    <li key={h.id} className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <Link href={`/itr/${h.id}`} className="font-medium hover:underline" target="_blank">
                          {formatDate(h.encounterAt)}
                        </Link>
                        <p className="truncate text-muted-foreground">
                          {h.diagnoses.map((d) => d.label).join(", ") ||
                            h.consultation?.chiefComplaints ||
                            "—"}
                        </p>
                      </div>
                      <StatusBadge status={h.status} />
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </aside>
      </div>
    </>
  );
}
