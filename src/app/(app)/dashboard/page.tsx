import { Baby, CalendarClock, ListOrdered, Users } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireRole } from "@/lib/auth/session";
import { patientStats } from "@/server/patients/queries";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const user = await requireRole("nurse", "midwife", "encoder");
  const stats = await patientStats();

  return (
    <>
      <PageHeader title={`Welcome, ${user.name}`} description="Today at the Rural Health Unit." />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Registered patients"
          value={stats.total}
          hint={`${stats.newThisMonth} new in the last 30 days`}
          icon={Users}
        />
        <StatCard label="Children under 5" value={stats.children} icon={Baby} />
        <StatCard label="In queue today" value="—" hint="Queue arrives in F2" icon={ListOrdered} />
        <StatCard
          label="Appointments today"
          value="—"
          hint="Appointments arrive in F4"
          icon={CalendarClock}
        />
      </div>
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Quick actions</CardTitle>
          <CardDescription>Common tasks for front-desk and clinical staff.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button asChild>
            <Link href="/patients">Find a patient</Link>
          </Button>
          <Button variant="outline" disabled>
            Register patient (F2)
          </Button>
          <Button variant="outline" disabled>
            Open queue (F2)
          </Button>
        </CardContent>
      </Card>
    </>
  );
}
