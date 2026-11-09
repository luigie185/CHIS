import { format, parseISO } from "date-fns";
import { ArrowLeft, Stethoscope } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { VitalsGrid } from "@/components/itr/vitals-grid";
import { PrintButton } from "@/components/print-button";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import {
  CIVIL_STATUS_OPTIONS,
  MODE_OF_TRANSACTION_OPTIONS,
  NATURE_OF_VISIT_OPTIONS,
  optionLabel,
  VISIT_TYPE_OPTIONS,
} from "@/lib/constants";
import { requirePermission } from "@/lib/auth/session";
import { formatAge, formatDate, formatPatientName, sexLabel } from "@/lib/format";
import { getEncounter } from "@/server/encounters/queries";

export const metadata: Metadata = { title: "Visit record" };

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="break-inside-avoid">
      <h2 className="mb-2 border-b pb-1 text-sm font-semibold tracking-wide text-primary uppercase print:text-black">
        {title}
      </h2>
      {children}
    </section>
  );
}

function Item({ label, value, className }: { label: string; value: React.ReactNode; className?: string }) {
  return (
    <div className={className}>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="text-sm">{value || "—"}</dd>
    </div>
  );
}

export default async function VisitRecordPage({ params, searchParams }: PageProps<"/itr/[id]">) {
  const user = await requirePermission("patient:read");
  const [{ id }, sp] = await Promise.all([params, searchParams]);
  const e = await getEncounter(id);
  if (!e) notFound();
  const p = e.patient;
  const c = e.consultation;
  const canContinue = user.role === "doctor" && e.status === "in_progress" && e.assignedDoctorId === user.id;

  return (
    <div className="mx-auto max-w-4xl">
      <div data-print="hide" className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <Button asChild variant="ghost" size="sm">
          <Link href={user.role === "doctor" && sp.done ? "/doctor" : "/itr"}>
            <ArrowLeft /> {user.role === "doctor" && sp.done ? "Back to queue" : "All consultations"}
          </Link>
        </Button>
        <div className="flex gap-2">
          {canContinue && (
            <Button asChild>
              <Link href={`/doctor/consult/${e.id}`}>
                <Stethoscope /> Continue consultation
              </Link>
            </Button>
          )}
          <PrintButton label="Print ITR" />
        </div>
      </div>

      <article className="flex flex-col gap-6 rounded-xl border bg-card p-6 print:border-0 print:p-0">
        <header className="flex flex-wrap items-start justify-between gap-4 border-b pb-4">
          <div>
            <p className="text-xs tracking-wide text-muted-foreground uppercase">Rural Health Unit</p>
            <h1 className="text-xl font-semibold">Individual Treatment Record</h1>
          </div>
          <div className="text-right text-sm">
            <p className="font-medium">{format(parseISO(e.encounterAt), "MMMM d, yyyy · h:mm a")}</p>
            <p className="text-muted-foreground">Queue #{e.queueNumber}</p>
            <div className="mt-1">
              <StatusBadge status={e.status} />
            </div>
          </div>
        </header>

        <Section title="Patient information">
          <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Item
              label="Name"
              value={<span className="font-medium">{formatPatientName(p)}</span>}
              className="col-span-2"
            />
            <Item label="Patient no." value={<span className="font-mono">{p.patientNo}</span>} />
            <Item
              label="Sex / Age"
              value={
                <span>
                  {sexLabel(p.sex)} · {formatAge(p.birthdate, parseISO(e.encounterAt))}
                </span>
              }
            />
            <Item label="Birthdate" value={formatDate(p.birthdate)} />
            <Item label="Civil status" value={optionLabel(CIVIL_STATUS_OPTIONS, p.civilStatus)} />
            <Item
              label="Address"
              value={[p.purok, p.barangayName].filter(Boolean).join(", ")}
              className="col-span-2"
            />
            <Item label="Contact" value={p.contactNo} />
            <Item
              label="PhilHealth"
              value={p.philhealthNo ? `${p.philhealthNo} (${p.philhealthStatus})` : p.philhealthStatus}
            />
            <Item label="4Ps member" value={p.is4psMember ? "Yes" : "No"} />
            <Item label="Blood type" value={p.bloodType} />
          </dl>
        </Section>

        <Section title="Consultation details">
          <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Item
              label="Mode of transaction"
              value={optionLabel(MODE_OF_TRANSACTION_OPTIONS, e.modeOfTransaction)}
            />
            <Item label="Nature of visit" value={optionLabel(NATURE_OF_VISIT_OPTIONS, e.natureOfVisit)} />
            <Item label="Purpose of visit" value={optionLabel(VISIT_TYPE_OPTIONS, e.visitType)} />
            <Item label="Intake by" value={e.createdByName} />
            {e.incomingReferral && (
              <>
                <Item label="Referred from" value={e.incomingReferral.referredFrom} />
                <Item label="Referred by" value={e.incomingReferral.referredBy} />
                <Item label="Reason for referral" value={e.incomingReferral.reason} className="col-span-2" />
              </>
            )}
          </dl>
        </Section>

        <Section title="Vital signs">
          <VitalsGrid vitals={e.vitals} />
        </Section>

        {e.status === "cancelled" ? (
          <Section title="Cancelled">
            <p className="text-sm">{e.cancelledReason}</p>
          </Section>
        ) : !c ? (
          <Section title="Consultation">
            <p className="text-sm text-muted-foreground">
              {e.status === "in_queue" ? "Waiting for the doctor." : "Consultation in progress."}
            </p>
          </Section>
        ) : (
          <>
            <Section title="History and examination">
              <dl className="grid gap-3">
                <Item label="Chief complaint" value={c.chiefComplaints} />
                <Item label="History of present illness" value={c.historyOfPresentIllness} />
                <Item label="Physical examination" value={c.physicalExam} />
              </dl>
            </Section>
            <Section title="Diagnosis">
              {e.diagnoses.length === 0 ? (
                <p className="text-sm text-muted-foreground">—</p>
              ) : (
                <ul className="flex flex-col gap-1 text-sm">
                  {e.diagnoses.map((d) => (
                    <li key={d.label}>
                      <span className={d.isPrimary ? "font-medium" : ""}>{d.label}</span>
                      {d.icd10Code && <span className="text-muted-foreground"> ({d.icd10Code})</span>}
                      {d.isPrimary && <span className="ml-2 text-xs text-primary">Primary</span>}
                    </li>
                  ))}
                </ul>
              )}
              {c.assessmentNotes && <p className="mt-2 text-sm">{c.assessmentNotes}</p>}
            </Section>
            <div className="grid gap-6 sm:grid-cols-2">
              <Section title="Laboratory requests">
                {e.labRequests.length === 0 ? (
                  <p className="text-sm text-muted-foreground">None</p>
                ) : (
                  <ul className="list-disc pl-5 text-sm">
                    {e.labRequests.map((l) => (
                      <li key={l.labTestId}>{l.labTestName}</li>
                    ))}
                  </ul>
                )}
              </Section>
              <Section title="Plan">
                <dl className="grid gap-3">
                  <Item label="Advice" value={c.plan} />
                  <Item label="Follow-up" value={c.followUpDate ? formatDate(c.followUpDate) : null} />
                </dl>
              </Section>
            </div>
            <Section title="Prescriptions (Rx)">
              {e.prescriptions.length === 0 ? (
                <p className="text-sm text-muted-foreground">None</p>
              ) : (
                <ol className="flex list-decimal flex-col gap-2 pl-5 text-sm">
                  {e.prescriptions.map((rx, i) => (
                    <li key={i}>
                      <span className="font-medium">{rx.medication}</span>
                      {rx.quantity && <span className="text-muted-foreground"> #{rx.quantity}</span>}
                      <br />
                      <span className="text-muted-foreground">
                        Sig: {rx.dosage}, {rx.frequency.toLowerCase()}, for {rx.duration}
                      </span>
                    </li>
                  ))}
                </ol>
              )}
            </Section>
            {e.outgoingReferral && (
              <Section title="Referral">
                <dl className="grid grid-cols-2 gap-3">
                  <Item label="Referred to" value={e.outgoingReferral.referredTo} />
                  <Item label="Reason" value={e.outgoingReferral.reason} />
                </dl>
              </Section>
            )}
          </>
        )}

        <footer className="mt-4 grid grid-cols-2 gap-8 pt-6 text-sm">
          <div>
            <div className="h-8" />
            <p className="border-t pt-1 font-medium">
              {e.assignedDoctorName ? `Dr. ${e.assignedDoctorName}` : "—"}
            </p>
            <p className="text-xs text-muted-foreground">Attending physician</p>
          </div>
          <div className="text-right text-xs text-muted-foreground">
            {e.completedAt && <p>Completed {format(parseISO(e.completedAt), "MMM d, yyyy h:mm a")}</p>}
            <p>Confidential — RA 10173</p>
          </div>
        </footer>
      </article>
    </div>
  );
}
