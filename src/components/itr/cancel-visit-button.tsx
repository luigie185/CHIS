"use client";

import { Loader2, X } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cancelEncounter } from "@/server/encounters/actions";

export function CancelVisitButton({
  encounterId,
  patientName,
  queueNumber,
}: {
  encounterId: string;
  patientName: string;
  queueNumber: number;
}) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function confirm() {
    startTransition(async () => {
      const result = await cancelEncounter(encounterId, reason);
      if (result.ok) {
        toast(`#${queueNumber} ${patientName} removed from the queue`);
        setOpen(false);
        setReason("");
      } else {
        setError(result.fieldErrors?.reason?.[0] ?? result.error);
      }
    });
  }

  return (
    <AlertDialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        setError(null);
      }}
    >
      <AlertDialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="text-muted-foreground hover:text-destructive"
          aria-label={`Remove ${patientName} from queue`}
        >
          <X /> <span className="hidden sm:inline">Remove</span>
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Remove #{queueNumber} from the queue?</AlertDialogTitle>
          <AlertDialogDescription>
            {patientName} will be marked as cancelled for today. This is recorded in the audit log.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="cancel-reason" className="text-sm font-medium">
            Reason
          </label>
          <Textarea
            id="cancel-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Patient left before consultation"
            aria-invalid={!!error}
          />
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>Keep in queue</AlertDialogCancel>
          <Button variant="destructive" onClick={confirm} disabled={pending}>
            {pending && <Loader2 className="animate-spin" />}
            Remove from queue
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
