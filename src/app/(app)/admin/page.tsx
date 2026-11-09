import { count, eq } from "drizzle-orm";
import { format, parseISO } from "date-fns";
import { Activity, CalendarDays, Send, UserCog } from "lucide-react";
import type { Metadata } from "next";
import { LineChart } from "@/components/charts/line-chart";
import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { db } from "@/db";
import { user as userTable } from "@/db/schema";
import { requireRole } from "@/lib/auth/session";
import { visitReport } from "@/server/encounters/queries";

export const metadata: Metadata = { title: "Admin" };

export default async function AdminPage() {
  await requireRole("admin");
  const [report, [staff], [doctors]] = await Promise.all([
    visitReport(),
    db.select({ n: count() }).from(userTable),
    db.select({ n: count() }).from(userTable).where(eq(userTable.role, "doctor")),
  ]);
  const COLORS = ["var(--series-1)", "var(--series-2)", "var(--series-3)", "var(--series-4)"];
  const weekly = (t: typeof report.diagnosisTrend) =>
    t.series.map((s, i) => ({
      name: s.name,
      values: s.values,
      color: COLORS[i],
      legendValue: String(s.total),
    }));

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
          <CardDescription>
            Last 30 days through yesterday · open days only (closed on Sundays)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <LineChart
            ariaLabel="Line chart of completed consultations per day over the last 30 days"
            unit="Consultations"
            xLabels={report.perDay.map((d) => format(parseISO(d.date), "MMM d"))}
            xFull={report.perDay.map((d) => format(parseISO(d.date), "EEE, MMM d"))}
            series={[
              { name: "Consultations", values: report.perDay.map((d) => d.count), color: "var(--primary)" },
            ]}
          />
        </CardContent>
      </Card>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Top diagnoses, weekly</CardTitle>
            <CardDescription>
              The 4 most common primary diagnoses, last 8 complete weeks · legend shows 8-week totals
            </CardDescription>
          </CardHeader>
          <CardContent>
            <LineChart
              ariaLabel="Line chart of weekly consultations for the four most common diagnoses over the last 8 weeks"
              unit="Consultations"
              xLabels={report.diagnosisTrend.weeks.map((w) => w.label.split("–")[0])}
              xFull={report.diagnosisTrend.weeks.map((w) => `Week of ${w.label}`)}
              series={weekly(report.diagnosisTrend)}
            />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Top barangays, weekly</CardTitle>
            <CardDescription>
              The 4 barangays with the most consultations over the last 8 complete weeks · legend shows 8-week
              totals
            </CardDescription>
          </CardHeader>
          <CardContent>
            <LineChart
              ariaLabel="Line chart of weekly consultations for the four barangays with the most visits over the last 8 weeks"
              unit="Consultations"
              xLabels={report.barangayTrend.weeks.map((w) => w.label.split("–")[0])}
              xFull={report.barangayTrend.weeks.map((w) => `Week of ${w.label}`)}
              series={weekly(report.barangayTrend)}
            />
          </CardContent>
        </Card>
      </div>
    </>
  );
}
