import type { Metadata } from "next";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireUser } from "@/lib/auth/session";
import { UiKitDemo } from "./ui-kit-demo";

export const metadata: Metadata = { title: "UI kit" };

const STATUSES = [
  "in_queue",
  "in_progress",
  "completed",
  "cancelled",
  "referred_out",
  "scheduled",
  "missed",
  "active",
  "delivered",
  "low",
  "moderate",
  "high",
  "very_high",
  "member",
  "dependent",
  "none",
];

export default async function UiKitPage() {
  await requireUser();
  return (
    <>
      <PageHeader
        title="UI kit"
        description="Shared components used across every module. For review during the frontend phases."
      />
      <div className="grid gap-6 lg:grid-cols-2">
        <UiKitDemo />
        <Card>
          <CardHeader>
            <CardTitle>Status badges</CardTitle>
            <CardDescription>
              Encounter, appointment, pregnancy, risk and PhilHealth statuses.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {STATUSES.map((s) => (
              <StatusBadge key={s} status={s} />
            ))}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
