import { CheckCircle2, ListOrdered, Plus, Stethoscope, Users } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { AutoRefresh } from "@/components/auto-refresh";
import { QueueList } from "@/components/itr/queue-list";
import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireRole } from "@/lib/auth/session";
import { getTodayQueue } from "@/server/encounters/queries";
import { patientStats } from "@/server/patients/queries";

export const metadata: Metadata = { title: "Dashboard" };

export default async function StaffDashboardPage() {
  const user = await requireRole("staff");
  const [queue, patients] = await Promise.all([getTodayQueue(), patientStats()]);

  return (
    <>
      <AutoRefresh seconds={30} />
      <PageHeader
        title={`Welcome, ${user.name}`}
        description="Register patients, take vital signs, and add them to the doctor's queue."
        actions={
          <Button asChild size="lg">
            <Link href="/visits/new">
              <Plus /> New visit
            </Link>
          </Button>
        }
      />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Waiting" value={queue.waiting.length} icon={ListOrdered} />
        <StatCard label="With the doctor" value={queue.inProgress.length} icon={Stethoscope} />
        <StatCard label="Done today" value={queue.done.length} icon={CheckCircle2} />
        <StatCard
          label="Registered patients"
          value={patients.total}
          hint={`${patients.newThisMonth} new in the last 30 days`}
          icon={Users}
        />
      </div>
      <Card className="mt-6">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Waiting for the doctor</CardTitle>
          <Button asChild variant="outline" size="sm">
            <Link href="/queue">Open queue</Link>
          </Button>
        </CardHeader>
        <CardContent>
          <QueueList items={queue.waiting} highlightFirst />
        </CardContent>
      </Card>
    </>
  );
}
