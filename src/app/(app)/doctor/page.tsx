import type { Metadata } from "next";
import { requireRole } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Doctor" };

export default async function DoctorPage() {
  const user = await requireRole("doctor");
  return (
    <div>
      <h1 className="text-2xl font-semibold">Good day, Dr. {user.name}</h1>
      <p className="mt-2 text-neutral-500">Your consultation queue will appear here.</p>
    </div>
  );
}
