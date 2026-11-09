"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2, Loader2, Plus, Save, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Controller, useFieldArray, useForm, useWatch, type FieldPath } from "react-hook-form";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { DatePicker } from "@/components/forms/date-picker";
import { FormField } from "@/components/forms/form-field";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { COMMON_DIAGNOSES, COMMON_MEDICATIONS, LAB_TEST_OPTIONS } from "@/lib/constants";
import type { Consultation, Diagnosis, Prescription, Referral } from "@/lib/types/encounter";
import { cn } from "@/lib/utils";
import {
  completeConsultationSchema,
  consultationSchema,
  type ConsultationData,
  type ConsultationInput,
} from "@/lib/validators/consultation";
import { saveConsultation } from "@/server/encounters/actions";

type Initial = {
  consultation: Consultation | null;
  diagnoses: Diagnosis[];
  labTestIds: number[];
  prescriptions: Prescription[];
  outgoingReferral: Referral | null;
};

const EMPTY_RX = { medication: "", dosage: "", frequency: "", duration: "", quantity: "", notes: "" };

export function ConsultationForm({ encounterId, initial }: { encounterId: string; initial: Initial }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [completing, setCompleting] = useState(false);
  const c = initial.consultation;

  const form = useForm<ConsultationInput, unknown, ConsultationData>({
    resolver: zodResolver(consultationSchema),
    defaultValues: {
      chiefComplaints: c?.chiefComplaints ?? "",
      historyOfPresentIllness: c?.historyOfPresentIllness ?? "",
      physicalExam: c?.physicalExam ?? "",
      assessmentNotes: c?.assessmentNotes ?? "",
      plan: c?.plan ?? "",
      followUpDate: c?.followUpDate ?? "",
      diagnoses: initial.diagnoses.length
        ? initial.diagnoses.map((d) => ({ ...d, icd10Code: d.icd10Code ?? "" }))
        : [{ label: "", icd10Code: "", isPrimary: true }],
      labTestIds: initial.labTestIds,
      prescriptions: initial.prescriptions.map((p) => ({
        ...p,
        quantity: p.quantity ?? "",
        notes: p.notes ?? "",
      })),
      referOut: !!initial.outgoingReferral,
      referredTo: initial.outgoingReferral?.referredTo ?? "",
      referralReason: initial.outgoingReferral?.reason ?? "",
    },
  });
  const {
    register,
    control,
    setValue,
    getValues,
    formState: { errors },
  } = form;
  const diagnoses = useFieldArray({ control, name: "diagnoses" });
  const prescriptions = useFieldArray({ control, name: "prescriptions" });
  const referOut = useWatch({ control, name: "referOut" });
  const dxValues = useWatch({ control, name: "diagnoses" });

  /** Drop the empty diagnosis row the form starts with, so a draft can be saved without one. */
  function cleaned(): ConsultationInput {
    const v = getValues();
    const dx = (v.diagnoses ?? []).filter((d) => d.label.trim() !== "");
    if (dx.length > 0 && !dx.some((d) => d.isPrimary)) dx[0] = { ...dx[0], isPrimary: true };
    return { ...v, diagnoses: dx };
  }

  function run(complete: boolean) {
    startTransition(async () => {
      const values = cleaned();
      const check = (complete ? completeConsultationSchema : consultationSchema).safeParse(values);
      if (!check.success) {
        // Show the same errors the server would return.
        form.clearErrors();
        for (const issue of check.error.issues) {
          form.setError(issue.path.join(".") as FieldPath<ConsultationInput>, { message: issue.message });
        }
        toast.error(
          complete
            ? "Complete the required fields before finishing."
            : "Please check the highlighted fields.",
        );
        return;
      }
      const result = await saveConsultation(encounterId, values, complete);
      if (!result.ok) {
        for (const [key, messages] of Object.entries(result.fieldErrors ?? {})) {
          form.setError(key as FieldPath<ConsultationInput>, { message: messages[0] });
        }
        toast.error(result.error);
        return;
      }
      if (complete) {
        toast.success(
          result.data.status === "referred_out"
            ? "Consultation completed — patient referred out"
            : "Consultation completed",
        );
        router.push(`/itr/${encounterId}?done=1`);
      } else {
        toast.success("Draft saved");
      }
    });
  }

  function setPrimary(index: number) {
    getValues("diagnoses")?.forEach((_, i) =>
      setValue(`diagnoses.${i}.isPrimary`, i === index, { shouldDirty: true }),
    );
  }

  return (
    <form onSubmit={(e) => e.preventDefault()} className="flex flex-col gap-6" noValidate>
      <Card>
        <CardHeader>
          <CardTitle>History and examination</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <FormField
            label="Chief complaint"
            htmlFor="chiefComplaints"
            required
            error={errors.chiefComplaints}
          >
            <Textarea
              id="chiefComplaints"
              {...register("chiefComplaints")}
              rows={2}
              autoFocus
              aria-invalid={!!errors.chiefComplaints}
            />
          </FormField>
          <FormField label="History of present illness" htmlFor="hpi" error={errors.historyOfPresentIllness}>
            <Textarea id="hpi" {...register("historyOfPresentIllness")} rows={3} />
          </FormField>
          <FormField label="Physical examination findings" htmlFor="pe" error={errors.physicalExam}>
            <Textarea id="pe" {...register("physicalExam")} rows={3} />
          </FormField>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Diagnosis</CardTitle>
          <CardDescription>Type or pick a diagnosis. Mark the main one as primary.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <datalist id="dx-options">
            {COMMON_DIAGNOSES.map((d) => (
              <option key={d.label} value={d.label} />
            ))}
          </datalist>
          {diagnoses.fields.map((f, i) => (
            <div key={f.id} className="grid grid-cols-[1fr_7rem_auto_auto] items-start gap-2">
              <div>
                <Input
                  list="dx-options"
                  placeholder="e.g. Acute upper respiratory infection"
                  aria-label={`Diagnosis ${i + 1}`}
                  aria-invalid={!!errors.diagnoses?.[i]?.label}
                  {...register(`diagnoses.${i}.label`, {
                    onChange: (e) => {
                      const match = COMMON_DIAGNOSES.find((d) => d.label === e.target.value);
                      if (match) setValue(`diagnoses.${i}.icd10Code`, match.icd10);
                    },
                  })}
                />
                {errors.diagnoses?.[i]?.label && (
                  <p className="mt-1 text-sm text-destructive">{errors.diagnoses[i]!.label!.message}</p>
                )}
              </div>
              <Input
                placeholder="ICD-10"
                aria-label={`ICD-10 code ${i + 1}`}
                {...register(`diagnoses.${i}.icd10Code`)}
              />
              <Button
                type="button"
                variant={dxValues?.[i]?.isPrimary ? "default" : "outline"}
                size="sm"
                className="h-9"
                onClick={() => setPrimary(i)}
                aria-pressed={!!dxValues?.[i]?.isPrimary}
              >
                Primary
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label={`Remove diagnosis ${i + 1}`}
                onClick={() => diagnoses.remove(i)}
              >
                <Trash2 />
              </Button>
            </div>
          ))}
          {errors.diagnoses?.message && (
            <p className="text-sm text-destructive">{errors.diagnoses.message}</p>
          )}
          {errors.diagnoses?.root?.message && (
            <p className="text-sm text-destructive">{errors.diagnoses.root.message}</p>
          )}
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="self-start"
            onClick={() =>
              diagnoses.append({ label: "", icd10Code: "", isPrimary: diagnoses.fields.length === 0 })
            }
          >
            <Plus /> Add diagnosis
          </Button>
          <FormField label="Assessment notes" htmlFor="assessment" error={errors.assessmentNotes}>
            <Textarea id="assessment" {...register("assessmentNotes")} rows={2} />
          </FormField>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Laboratory requests</CardTitle>
          <CardDescription>Tests the patient needs. They print on the visit record.</CardDescription>
        </CardHeader>
        <CardContent>
          <Controller
            control={control}
            name="labTestIds"
            render={({ field }) => (
              <div className="grid gap-2 sm:grid-cols-2">
                {LAB_TEST_OPTIONS.map((t) => {
                  const checked = field.value?.includes(t.id) ?? false;
                  return (
                    <label
                      key={t.id}
                      className={cn(
                        "flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm",
                        checked && "border-primary bg-primary/5",
                      )}
                    >
                      <Checkbox
                        checked={checked}
                        onCheckedChange={(v) =>
                          field.onChange(
                            v
                              ? [...(field.value ?? []), t.id]
                              : (field.value ?? []).filter((id) => id !== t.id),
                          )
                        }
                      />
                      {t.name}
                    </label>
                  );
                })}
              </div>
            )}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Prescriptions</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <datalist id="rx-options">
            {COMMON_MEDICATIONS.map((m) => (
              <option key={m} value={m} />
            ))}
          </datalist>
          {prescriptions.fields.length === 0 && (
            <p className="text-sm text-muted-foreground">No medicines prescribed.</p>
          )}
          {prescriptions.fields.map((f, i) => {
            const err = errors.prescriptions?.[i];
            return (
              <div
                key={f.id}
                className="grid gap-2 rounded-md border p-3 sm:grid-cols-[2fr_1fr_1.5fr_1fr_0.7fr_auto]"
              >
                {(
                  [
                    ["medication", "Medicine", "Paracetamol 500 mg tablet"],
                    ["dosage", "Dosage", "1 tablet"],
                    ["frequency", "Frequency", "Every 4 hours"],
                    ["duration", "Duration", "3 days"],
                    ["quantity", "Qty", "10"],
                  ] as const
                ).map(([name, label, ph]) => (
                  <div key={name}>
                    <label className="mb-1 block text-xs text-muted-foreground sm:hidden">{label}</label>
                    <Input
                      list={name === "medication" ? "rx-options" : undefined}
                      placeholder={ph}
                      aria-label={`${label} ${i + 1}`}
                      aria-invalid={!!err?.[name]}
                      {...register(`prescriptions.${i}.${name}`)}
                    />
                    {err?.[name] && <p className="mt-1 text-xs text-destructive">{err[name]!.message}</p>}
                  </div>
                ))}
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label={`Remove medicine ${i + 1}`}
                  onClick={() => prescriptions.remove(i)}
                >
                  <Trash2 />
                </Button>
              </div>
            );
          })}
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="self-start"
            onClick={() => prescriptions.append(EMPTY_RX)}
          >
            <Plus /> Add medicine
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Plan and follow-up</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <FormField label="Plan / advice" htmlFor="plan" error={errors.plan}>
            <Textarea id="plan" {...register("plan")} rows={2} placeholder="Advice given to the patient" />
          </FormField>
          <FormField label="Follow-up date" error={errors.followUpDate} className="sm:max-w-xs">
            <Controller
              control={control}
              name="followUpDate"
              render={({ field }) => (
                <DatePicker
                  value={field.value || null}
                  onChange={(v) => field.onChange(v ?? "")}
                  placeholder="No follow-up"
                  fromYear={new Date().getFullYear()}
                  toYear={new Date().getFullYear() + 1}
                />
              )}
            />
          </FormField>
          <Controller
            control={control}
            name="referOut"
            render={({ field }) => (
              <label className="flex items-center gap-2 text-sm font-medium">
                <Checkbox checked={!!field.value} onCheckedChange={(v) => field.onChange(v === true)} />
                Refer the patient to another facility
              </label>
            )}
          />
          {referOut && (
            <div className="grid gap-4 rounded-lg border border-dashed p-4 sm:grid-cols-2">
              <FormField label="Refer to (facility)" htmlFor="referredTo" required error={errors.referredTo}>
                <Input
                  id="referredTo"
                  {...register("referredTo")}
                  placeholder="Provincial Hospital"
                  aria-invalid={!!errors.referredTo}
                />
              </FormField>
              <FormField
                label="Reason for referral"
                htmlFor="refReason"
                required
                error={errors.referralReason}
              >
                <Input
                  id="refReason"
                  {...register("referralReason")}
                  aria-invalid={!!errors.referralReason}
                />
              </FormField>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="sticky bottom-0 -mx-4 flex flex-wrap justify-end gap-2 border-t bg-background/95 px-4 py-3 backdrop-blur md:-mx-6 md:px-6">
        <Button type="button" variant="outline" onClick={() => run(false)} disabled={pending}>
          {pending && !completing ? <Loader2 className="animate-spin" /> : <Save />}
          Save draft
        </Button>
        <ConfirmDialog
          trigger={
            <Button type="button" disabled={pending}>
              {pending && completing ? <Loader2 className="animate-spin" /> : <CheckCircle2 />}
              Complete consultation
            </Button>
          }
          title="Complete this consultation?"
          description={
            referOut
              ? "The visit will be closed and marked as referred out. You can still view and print it afterwards."
              : "The visit will be closed. You can still view and print it afterwards."
          }
          confirmLabel="Complete"
          onConfirm={() => {
            setCompleting(true);
            run(true);
          }}
        />
      </div>
    </form>
  );
}
