import type { Metadata } from "next";
import { count } from "drizzle-orm";
import { db } from "@/db";
import { barangays, user as userTable, vaccines } from "@/db/schema";
import { requireRole } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Admin" };

export default async function AdminPage() {
  await requireRole("admin");
  const [[staff], [brgy], [vax]] = await Promise.all([
    db.select({ n: count() }).from(userTable),
    db.select({ n: count() }).from(barangays),
    db.select({ n: count() }).from(vaccines),
  ]);

  const stats = [
    { label: "Staff accounts", value: staff.n },
    { label: "Barangays", value: brgy.n },
    { label: "Vaccines", value: vax.n },
  ];

  return (
    <div>
      <h1 className="text-2xl font-semibold">Admin dashboard</h1>
      <dl className="mt-6 grid gap-4 sm:grid-cols-3">
        {stats.map((s) => (
          <div key={s.label} className="rounded-lg border border-neutral-200 p-4 dark:border-neutral-800">
            <dt className="text-sm text-neutral-500">{s.label}</dt>
            <dd className="mt-1 text-3xl font-semibold tabular-nums">{s.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
