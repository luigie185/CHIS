"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, ArrowRight, CheckCircle2, ListOrdered, Loader2, Plus } from "lucide-react";
import Link from "next/link";
import { useState, useTransition } from "react";
import { Controller, useForm, useWatch, type FieldPath } from "react-hook-form";
import { toast } from "sonner";
import { FormField, UnitInput } from "@/components/forms/form-field";
import { Steps } from "@/components/itr/steps";
import { VitalsGrid } from "@/components/itr/vitals-grid";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  MODE_OF_TRANSACTION_OPTIONS,
  NATURE_OF_VISIT_OPTIONS,
  optionLabel,
  VISIT_TYPE_OPTIONS,
} from "@/lib/constants";
import { formatAge } from "@/lib/format";
import {
  bmiCategory,
  computeBmi,
  visitSchema,
  type VisitData,
  type VisitInput,
} from "@/lib/validators/visit";
import { createVisit } from "@/server/encounters/actions";
import { PatientStep, type SelectedPatient } from "./patient-step";

const STEPS = ["Patient", "Visit details", "Vital signs", "Review"];

const STEP_FIELDS: FieldPath<VisitInput>[][] = [
  [],
  ["modeOfTransaction", "natureOfVisit", "visitType", "referredFrom", "referredBy", "referralReason"],
  [
    "vitals.bpSystolic",
    "vitals.bpDiastolic",
    "vitals.temperatureC",
    "vitals.heightCm",
    "vitals.weightKg",
    "vitals.heartRate",
    "vitals.respiratoryRate",
    "vitals.oxygenSaturation",
  ],
];

const toNum = (v: unknown) => (v === "" || v === null || v === undefined ? null : Number(v));

export function NewVisitWizard({ initialPatient }: { initialPatient: SelectedPatient | null }) {
  const [step, setStep] = useState(initialPatient ? 1 : 0);
  const [patient, setPatient] = useState<SelectedPatient | null>(initialPatient);
  const [done, setDone] = useState<{ queueNumber: number } | null>(null);
  const [pending, startTransition] = useTransition();

  const form = useForm<VisitInput, unknown, VisitData>({
    resolver: zodResolver(visitSchema),
    defaultValues: {
      modeOfTransaction: "walk_in",
      natureOfVisit: "new_consultation",
      visitType: "general",
      referredFrom: "",
      referredBy: "",
      referralReason: "",
      vitals: {
        bpSystolic: "",
        bpDiastolic: "",
        temperatureC: "",
        heightCm: "",
        weightKg: "",
        heartRate: "",
        respiratoryRate: "",
        oxygenSaturation: "",
      },
    },
  });
  const {
    register,
    control,
    formState: { errors },
  } = form;
  const values = useWatch({ control });

  async function next() {
    if (await form.trigger(STEP_FIELDS[step], { shouldFocus: true })) setStep((s) => s + 1);
  }

  function submit() {
    if (!patient) return;
    startTransition(async () => {
      const valid = await form.trigger();
      if (!valid) {
        toast.error("Please check the visit details and vital signs.");
        return;
      }
      const result = await createVisit(patient.id, form.getValues());
      if (result.ok) {
        setDone({ queueNumber: result.data.queueNumber });
      } else {
        for (const [key, messages] of Object.entries(result.fieldErrors ?? {})) {
          form.setError(key as FieldPath<VisitInput>, { message: messages[0] });
        }
        toast.error(result.error);
      }
    });
  }

  function reset() {
    form.reset();
    setPatient(null);
    setDone(null);
    setStep(0);
  }

  if (done && patient) {
    return (
      <Card className="mx-auto max-w-md text-center">
        <CardContent className="flex flex-col items-center gap-3 py-8">
          <CheckCircle2 className="size-10 text-primary" />
          <p className="text-muted-foreground">Added to today&apos;s queue</p>
          <p className="text-6xl font-semibold tabular-nums">#{done.queueNumber}</p>
          <p className="font-medium">{patient.name}</p>
          <p className="text-sm text-muted-foreground">
            Give the patient their queue number. The doctor will call them in order.
          </p>
          <div className="mt-2 flex flex-wrap justify-center gap-2">
            <Button onClick={reset}>
              <Plus /> New visit
            </Button>
            <Button asChild variant="outline">
              <Link href="/queue">
                <ListOrdered /> View queue
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const v = values.vitals ?? {};
  const bmi = computeBmi(toNum(v.heightCm), toNum(v.weightKg));

  return (
    <div className="mx-auto max-w-4xl">
      <Steps steps={STEPS} current={step} />

      {patient && step > 0 && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-lg border bg-muted/40 px-4 py-3">
          <div>
            <p className="font-medium">{patient.name}</p>
            <p className="text-xs text-muted-foreground">
              <span className="font-mono">{patient.patientNo}</span> ·{" "}
              <span className="capitalize">{patient.sex}</span> · {formatAge(patient.birthdate)} ·{" "}
              {patient.barangayName}
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setStep(0)}>
            Change patient
          </Button>
        </div>
      )}

      {step === 0 && (
        <PatientStep
          onSelect={(p) => {
            setPatient(p);
            setStep(1);
          }}
        />
      )}

      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Visit details</CardTitle>
            <CardDescription>
              How the patient came in and why. Date and time are recorded automatically.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-6">
            <FormField label="Mode of transaction" required error={errors.modeOfTransaction}>
              <Controller
                control={control}
                name="modeOfTransaction"
                render={({ field }) => (
                  <RadioGroup
                    value={field.value}
                    onValueChange={field.onChange}
                    className="grid gap-2 sm:grid-cols-3"
                  >
                    {MODE_OF_TRANSACTION_OPTIONS.map((o) => (
                      <label
                        key={o.value}
                        className="flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2.5 text-sm has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-primary/5"
                      >
                        <RadioGroupItem value={o.value} />
                        {o.label}
                      </label>
                    ))}
                  </RadioGroup>
                )}
              />
            </FormField>

            {values.modeOfTransaction === "referral" && (
              <div className="grid gap-4 rounded-lg border border-dashed p-4 sm:grid-cols-2">
                <FormField
                  label="Referred from (facility)"
                  htmlFor="referredFrom"
                  required
                  error={errors.referredFrom}
                >
                  <Input
                    id="referredFrom"
                    {...register("referredFrom")}
                    placeholder="Barangay Health Station – Poblacion"
                    aria-invalid={!!errors.referredFrom}
                  />
                </FormField>
                <FormField label="Referred by" htmlFor="referredBy" error={errors.referredBy}>
                  <Input id="referredBy" {...register("referredBy")} placeholder="Name of health worker" />
                </FormField>
                <FormField
                  label="Reason for referral"
                  htmlFor="referralReason"
                  required
                  error={errors.referralReason}
                  className="sm:col-span-2"
                >
                  <Textarea
                    id="referralReason"
                    {...register("referralReason")}
                    rows={2}
                    aria-invalid={!!errors.referralReason}
                  />
                </FormField>
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label="Nature of visit" required error={errors.natureOfVisit}>
                <Controller
                  control={control}
                  name="natureOfVisit"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className="w-full" aria-label="Nature of visit">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {NATURE_OF_VISIT_OPTIONS.map((o) => (
                          <SelectItem key={o.value} value={o.value}>
                            {o.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </FormField>
              <FormField label="Purpose of visit" required error={errors.visitType}>
                <Controller
                  control={control}
                  name="visitType"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className="w-full" aria-label="Purpose of visit">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {VISIT_TYPE_OPTIONS.map((o) => (
                          <SelectItem key={o.value} value={o.value}>
                            {o.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </FormField>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle>Vital signs</CardTitle>
            <CardDescription>
              Leave a field blank if it was not taken. BMI is computed from height and weight.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <FormField
              label="Blood pressure"
              error={errors.vitals?.bpSystolic ?? errors.vitals?.bpDiastolic}
              className="sm:col-span-2"
            >
              <div className="flex items-center gap-2">
                <Input
                  {...register("vitals.bpSystolic")}
                  inputMode="numeric"
                  placeholder="Systolic"
                  aria-label="Systolic"
                  aria-invalid={!!errors.vitals?.bpSystolic}
                />
                <span className="text-muted-foreground">/</span>
                <UnitInput unit="mmHg">
                  <Input
                    {...register("vitals.bpDiastolic")}
                    inputMode="numeric"
                    placeholder="Diastolic"
                    aria-label="Diastolic"
                    aria-invalid={!!errors.vitals?.bpDiastolic}
                    className="pr-14"
                  />
                </UnitInput>
              </div>
            </FormField>
            {(
              [
                ["temperatureC", "Temperature", "°C", "decimal", "36.5"],
                ["heartRate", "Heart rate", "bpm", "numeric", "80"],
                ["respiratoryRate", "Respiratory rate", "/min", "numeric", "18"],
                ["oxygenSaturation", "O₂ saturation", "%", "numeric", "98"],
                ["heightCm", "Height", "cm", "decimal", "160"],
                ["weightKg", "Weight", "kg", "decimal", "55"],
              ] as const
            ).map(([name, label, unit, mode, ph]) => (
              <FormField key={name} label={label} htmlFor={name} error={errors.vitals?.[name]}>
                <UnitInput unit={unit}>
                  <Input
                    id={name}
                    {...register(`vitals.${name}`)}
                    inputMode={mode}
                    placeholder={ph}
                    aria-invalid={!!errors.vitals?.[name]}
                    className="pr-12"
                  />
                </UnitInput>
              </FormField>
            ))}
            <FormField label="BMI">
              <div className="flex h-9 items-center rounded-md border bg-muted/40 px-3 text-sm">
                {bmi ? `${bmi} · ${bmiCategory(bmi)}` : <span className="text-muted-foreground">—</span>}
              </div>
            </FormField>
          </CardContent>
        </Card>
      )}

      {step === 3 && (
        <Card>
          <CardHeader>
            <CardTitle>Review</CardTitle>
            <CardDescription>Check the details, then add the patient to today&apos;s queue.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-6">
            <dl className="grid gap-3 text-sm sm:grid-cols-3">
              <div>
                <dt className="text-muted-foreground">Mode of transaction</dt>
                <dd className="font-medium">
                  {optionLabel(MODE_OF_TRANSACTION_OPTIONS, values.modeOfTransaction)}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Nature of visit</dt>
                <dd className="font-medium">{optionLabel(NATURE_OF_VISIT_OPTIONS, values.natureOfVisit)}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Purpose of visit</dt>
                <dd className="font-medium">{optionLabel(VISIT_TYPE_OPTIONS, values.visitType)}</dd>
              </div>
              {values.modeOfTransaction === "referral" && (
                <div className="sm:col-span-3">
                  <dt className="text-muted-foreground">Referral</dt>
                  <dd className="font-medium">
                    From {values.referredFrom}
                    {values.referredBy ? ` (by ${values.referredBy})` : ""} — {values.referralReason}
                  </dd>
                </div>
              )}
            </dl>
            <VitalsGrid
              vitals={{
                bpSystolic: toNum(v.bpSystolic),
                bpDiastolic: toNum(v.bpDiastolic),
                temperatureC: toNum(v.temperatureC),
                heightCm: toNum(v.heightCm),
                weightKg: toNum(v.weightKg),
                heartRate: toNum(v.heartRate),
                respiratoryRate: toNum(v.respiratoryRate),
                oxygenSaturation: toNum(v.oxygenSaturation),
              }}
            />
          </CardContent>
        </Card>
      )}

      {step > 0 && (
        <div className="mt-4 flex justify-between gap-2">
          <Button variant="outline" onClick={() => setStep((s) => s - 1)} disabled={pending}>
            <ArrowLeft /> Back
          </Button>
          {step < 3 ? (
            <Button onClick={next}>
              Next <ArrowRight />
            </Button>
          ) : (
            <Button onClick={submit} disabled={pending}>
              {pending ? <Loader2 className="animate-spin" /> : <ListOrdered />}
              Add to queue
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
