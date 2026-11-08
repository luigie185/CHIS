"use client";

import { useState } from "react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { DatePicker } from "@/components/forms/date-picker";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { BARANGAY_OPTIONS } from "@/lib/constants";
import { formatDate } from "@/lib/format";

export function UiKitDemo() {
  const [date, setDate] = useState<string | null>(null);

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Form fields</CardTitle>
          <CardDescription>Labels, help text, validation errors, date picker and select.</CardDescription>
        </CardHeader>
        <CardContent>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="demo-name">Last name</FieldLabel>
              <Input id="demo-name" placeholder="Dela Cruz" />
            </Field>
            <Field data-invalid>
              <FieldLabel htmlFor="demo-contact">Contact number</FieldLabel>
              <Input id="demo-contact" defaultValue="0917" aria-invalid />
              <FieldError>Enter an 11-digit mobile number starting with 09.</FieldError>
            </Field>
            <Field>
              <FieldLabel htmlFor="demo-birthdate">Birthdate</FieldLabel>
              <DatePicker id="demo-birthdate" value={date} onChange={setDate} />
              <FieldDescription>Selected: {formatDate(date)}</FieldDescription>
            </Field>
            <Field>
              <FieldLabel>Barangay</FieldLabel>
              <Select>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select barangay" />
                </SelectTrigger>
                <SelectContent>
                  {BARANGAY_OPTIONS.map((b) => (
                    <SelectItem key={b.id} value={String(b.id)}>
                      {b.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field>
              <FieldLabel htmlFor="demo-notes">Notes</FieldLabel>
              <Textarea id="demo-notes" placeholder="Optional" />
            </Field>
          </FieldGroup>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Feedback</CardTitle>
          <CardDescription>Toasts and confirmation dialogs.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button onClick={() => toast.success("Patient registered", { description: "RHU-2026-000221" })}>
            Success toast
          </Button>
          <Button
            variant="outline"
            onClick={() =>
              toast.error("Could not save", { description: "Please check the highlighted fields." })
            }
          >
            Error toast
          </Button>
          <ConfirmDialog
            trigger={<Button variant="destructive">Cancel encounter</Button>}
            title="Cancel this encounter?"
            description="The patient will be removed from today's queue. This is recorded in the audit log."
            confirmLabel="Cancel encounter"
            destructive
            onConfirm={async () => {
              await new Promise((r) => setTimeout(r, 600));
              toast("Encounter cancelled");
            }}
          />
        </CardContent>
      </Card>
    </>
  );
}
