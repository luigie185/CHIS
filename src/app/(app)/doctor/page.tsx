import { CheckCircle2, Clock, ListOrdered, Users } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireRole } from "@/lib/auth/session";
import { patientStats } from "@/server/patients/queries";

export const metadata: Metadata = { title: "Doctor" };

export default async function DoctorPage() {
  const user = await requireRole("doctor");
  const stats = await patientStats();

  return (
    <>
      <PageHeader title={`Good day, Dr. ${user.name}`} description="Your consultation queue for today." />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Waiting" value="—" hint="Queue arrives in F3" icon={ListOrdered} />
        <StatCard label="In progress" value="—" icon={Clock} />
        <StatCard label="Completed today" value="—" icon={CheckCircle2} />
        <StatCard label="Registered patients" value={stats.total} icon={Users} />
      </div>
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Consultation queue</CardTitle>
        </CardHeader>
        <CardContent>
          <EmptyState
            title="The queue arrives in F3"
            description="Patients added to the queue by staff will appear here for consultation."
            action={
              <Button asChild variant="outline">
                <Link href="/patients">Browse patients</Link>
              </Button>
            }
          />
        </CardContent>
      </Card>
    </>
  );
}
