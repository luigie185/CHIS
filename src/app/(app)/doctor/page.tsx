import { CheckCircle2, ListOrdered, PhoneCall, Stethoscope } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { AutoRefresh } from "@/components/auto-refresh";
import { QueueList } from "@/components/itr/queue-list";
import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireRole } from "@/lib/auth/session";
import { formatAge, sexLabel } from "@/lib/format";
import { callNextPatient } from "@/server/encounters/actions";
import { getTodayQueue } from "@/server/encounters/queries";

export const metadata: Metadata = { title: "Doctor" };

export default async function DoctorPage({ searchParams }: PageProps<"/doctor">) {
  const user = await requireRole("doctor");
  const [queue, sp] = await Promise.all([getTodayQueue(), searchParams]);
  const mine = queue.inProgress.find((e) => e.assignedDoctorId === user.id);
  const next = queue.waiting[0];

  return (
    <>
      <AutoRefresh seconds={15} />
      <PageHeader
        title={`Good day, Dr. ${user.name}`}
        description="Patients are seen first come, first served."
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Waiting" value={queue.waiting.length} icon={ListOrdered} />
        <StatCard label="In consultation" value={queue.inProgress.length} icon={Stethoscope} />
        <StatCard label="Done today" value={queue.done.length} icon={CheckCircle2} />
      </div>

      <Card className="mt-6 border-primary/40">
        <CardHeader>
          <CardTitle>{mine ? "Consultation in progress" : "Next patient"}</CardTitle>
          <CardDescription>
            {mine
              ? "Finish this consultation before calling the next patient."
              : next
                ? `Queue #${next.queueNumber} has waited the longest.`
                : sp.empty
                  ? "The queue is empty."
                  : "No one is waiting right now."}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center justify-between gap-4">
          {(mine ?? next) && (
            <div className="flex items-center gap-3">
              <span className="flex size-12 items-center justify-center rounded-lg border border-primary text-xl font-semibold text-primary tabular-nums">
                {(mine ?? next)!.queueNumber}
              </span>
              <div>
                <p className="font-medium">{(mine ?? next)!.patient.name}</p>
                <p className="text-sm text-muted-foreground">
                  {sexLabel((mine ?? next)!.patient.sex)} · {formatAge((mine ?? next)!.patient.birthdate)} ·{" "}
                  {(mine ?? next)!.patient.barangayName}
                </p>
              </div>
            </div>
          )}
          {mine ? (
            <Button asChild size="lg">
              <Link href={`/doctor/consult/${mine.id}`}>
                <Stethoscope /> Continue consultation
              </Link>
            </Button>
          ) : (
            <form action={callNextPatient}>
              <Button size="lg" disabled={!next}>
                <PhoneCall /> Call next patient
              </Button>
            </form>
          )}
        </CardContent>
      </Card>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Waiting ({queue.waiting.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <QueueList items={queue.waiting} highlightFirst={!mine} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Done today ({queue.done.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <QueueList items={queue.done} linkToRecord emptyTitle="No consultations completed yet" />
          </CardContent>
        </Card>
      </div>
    </>
  );
}
