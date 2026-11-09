import { count, eq } from "drizzle-orm";
import { format, parseISO } from "date-fns";
import { Activity, CalendarDays, Send, UserCog } from "lucide-react";
import type { Metadata } from "next";
import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { db } from "@/db";
import { user as userTable } from "@/db/schema";
import { requireRole } from "@/lib/auth/session";
import { visitReport } from "@/server/encounters/queries";

export const metadata: Metadata = { title: "Admin" };

/** Simple horizontal bars; full charts arrive with the analytics page (F5). */
function Bars({ rows }: { rows: { label: string; count: number }[] }) {
  const max = Math.max(1, ...rows.map((r) => r.count));
  return (
    <ul className="flex flex-col gap-2">
      {rows.map((r) => (
        <li key={r.label} className="grid grid-cols-[minmax(0,10rem)_1fr_2.5rem] items-center gap-2 text-sm">
          <span className="truncate" title={r.label}>
            {r.label}
          </span>
          <span className="h-2.5 rounded-full bg-muted">
            <span
              className="block h-full rounded-full bg-primary"
              style={{ width: `${(r.count / max) * 100}%` }}
            />
          </span>
          <span className="text-right tabular-nums">{r.count}</span>
        </li>
      ))}
    </ul>
  );
}

export default async function AdminPage() {
  await requireRole("admin");
  const [report, [staff], [doctors]] = await Promise.all([
    visitReport(),
    db.select({ n: count() }).from(userTable),
    db.select({ n: count() }).from(userTable).where(eq(userTable.role, "doctor")),
  ]);
  const maxDay = Math.max(1, ...report.perDay.map((d) => d.count));

  return (
    <>
      <PageHeader
        title="Admin dashboard"
        description="Totals only — individual patient records are not shown to admin accounts."
      />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Visits today" value={report.today} icon={Activity} />
        <StatCard label="Consultations, last 30 days" value={report.last30Days} icon={CalendarDays} />
        <StatCard label="Referred out, last 30 days" value={report.referredOut30Days} icon={Send} />
        <StatCard label="Staff accounts" value={staff.n} hint={`${doctors.n} doctor(s)`} icon={UserCog} />
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Consultations per day</CardTitle>
          <CardDescription>Last 14 days</CardDescription>
        </CardHeader>
        <CardContent>
          <div
            className="flex h-40 items-end gap-1.5"
            role="img"
            aria-label="Consultations per day, last 14 days"
          >
            {report.perDay.map((d) => (
              <div key={d.date} className="flex flex-1 flex-col items-center gap-1">
                <span className="text-xs tabular-nums text-muted-foreground">{d.count || ""}</span>
                <div
                  className="w-full rounded-t bg-primary/80"
                  style={{ height: `${(d.count / maxDay) * 120}px` }}
                />
                <span className="text-[10px] text-muted-foreground">{format(parseISO(d.date), "d")}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Top diagnoses</CardTitle>
            <CardDescription>Last 30 days</CardDescription>
          </CardHeader>
          <CardContent>
            <Bars rows={report.topDiagnoses} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Consultations by barangay</CardTitle>
            <CardDescription>Last 30 days</CardDescription>
          </CardHeader>
          <CardContent>
            <Bars rows={report.byBarangay.map((b) => ({ label: b.name, count: b.count }))} />
          </CardContent>
        </Card>
      </div>
    </>
  );
}
