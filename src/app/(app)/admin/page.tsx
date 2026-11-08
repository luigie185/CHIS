import { count } from "drizzle-orm";
import { MapPin, Syringe, UserCog, Users } from "lucide-react";
import type { Metadata } from "next";
import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { db } from "@/db";
import { barangays, user as userTable, vaccines } from "@/db/schema";
import { requireRole } from "@/lib/auth/session";
import { patientStats } from "@/server/patients/queries";

export const metadata: Metadata = { title: "Admin" };

export default async function AdminPage() {
  await requireRole("admin");
  const [[staff], [brgy], [vax], patients] = await Promise.all([
    db.select({ n: count() }).from(userTable),
    db.select({ n: count() }).from(barangays),
    db.select({ n: count() }).from(vaccines),
    patientStats(),
  ]);

  return (
    <>
      <PageHeader title="Admin dashboard" description="Facility overview, staff and settings." />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Staff accounts" value={staff.n} hint="From the database" icon={UserCog} />
        <StatCard label="Registered patients" value={patients.total} hint="Demo data" icon={Users} />
        <StatCard label="Barangays" value={brgy.n} icon={MapPin} />
        <StatCard label="Vaccines" value={vax.n} icon={Syringe} />
      </div>
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Coming in F5</CardTitle>
          <CardDescription>Staff management, facility settings, audit log, and analytics.</CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Use the demo accounts on the login page to see what each role can access.
        </CardContent>
      </Card>
    </>
  );
}
