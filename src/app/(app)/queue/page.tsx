import { Plus } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { AutoRefresh } from "@/components/auto-refresh";
import { QueueList } from "@/components/itr/queue-list";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { hasPermission } from "@/lib/auth/permissions";
import { requirePermission } from "@/lib/auth/session";
import { getTodayQueue } from "@/server/encounters/queries";

export const metadata: Metadata = { title: "Queue" };

export default async function QueuePage() {
  const user = await requirePermission("patient:read");
  const queue = await getTodayQueue();
  const canCancel = hasPermission(user.role, "encounter:cancel");

  return (
    <>
      <AutoRefresh seconds={15} />
      <PageHeader
        title="Today's queue"
        description="First come, first served. The doctor calls patients in queue-number order. Updates every 15 seconds."
        actions={
          hasPermission(user.role, "encounter:create") && (
            <Button asChild>
              <Link href="/visits/new">
                <Plus /> New visit
              </Link>
            </Button>
          )
        }
      />
      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Waiting ({queue.waiting.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <QueueList items={queue.waiting} canCancel={canCancel} highlightFirst />
          </CardContent>
        </Card>
        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle>With the doctor ({queue.inProgress.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <QueueList items={queue.inProgress} emptyTitle="No consultation in progress" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Done today ({queue.done.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <QueueList items={queue.done} linkToRecord emptyTitle="No consultations completed yet" />
              {queue.cancelled.length > 0 && (
                <p className="mt-3 text-xs text-muted-foreground">
                  {queue.cancelled.length} removed from the queue today.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
