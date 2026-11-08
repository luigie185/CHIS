import type { Metadata } from "next";
import { requireRole } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const user = await requireRole("nurse", "midwife", "encoder");
  return (
    <div>
      <h1 className="text-2xl font-semibold">Welcome, {user.name}</h1>
      <p className="mt-2 text-neutral-500">
        Staff dashboard — today&apos;s queue and appointments will appear here.
      </p>
    </div>
  );
}
