"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Search, UserPlus, X } from "lucide-react";
import { useRef, useState, useTransition } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { DatePicker } from "@/components/forms/date-picker";
import { FormField } from "@/components/forms/form-field";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  BARANGAY_OPTIONS,
  CIVIL_STATUS_OPTIONS,
  PHILHEALTH_STATUS_OPTIONS,
  SEX_OPTIONS,
} from "@/lib/constants";
import { formatAge } from "@/lib/format";
import { patientSchema, type PatientData, type PatientInput } from "@/lib/validators/patient";
import { registerPatient, searchPatientsAction } from "@/server/patients/actions";
import type { PatientSearchResult } from "@/server/patients/queries";

export type SelectedPatient = PatientSearchResult;

const BLOOD_TYPES = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

export function PatientStep({ onSelect }: { onSelect: (p: SelectedPatient) => void }) {
  const [mode, setMode] = useState<"search" | "register">("search");
  return mode === "search" ? (
    <PatientSearch onSelect={onSelect} onRegister={() => setMode("register")} />
  ) : (
    <RegisterPatientForm onRegistered={onSelect} onCancel={() => setMode("search")} />
  );
}

function PatientRow({
  p,
  onSelect,
  action = "Select",
}: {
  p: PatientSearchResult;
  onSelect: () => void;
  action?: string;
}) {
  return (
    <li className="flex items-center justify-between gap-3 px-3 py-2.5">
      <div className="min-w-0">
        <p className="truncate font-medium">{p.name}</p>
        <p className="truncate text-xs text-muted-foreground">
          <span className="font-mono">{p.patientNo}</span> · <span className="capitalize">{p.sex}</span> ·{" "}
          {formatAge(p.birthdate)} · {p.barangayName}
        </p>
      </div>
      <Button size="sm" variant="outline" onClick={onSelect}>
        {action}
      </Button>
    </li>
  );
}

function PatientSearch({
  onSelect,
  onRegister,
}: {
  onSelect: (p: SelectedPatient) => void;
  onRegister: () => void;
}) {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<PatientSearchResult[] | null>(null);
  const [pending, startTransition] = useTransition();
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  function search(value: string) {
    setQ(value);
    clearTimeout(timer.current);
    if (value.trim().length < 2) {
      setResults(null);
      return;
    }
    timer.current = setTimeout(
      () => startTransition(async () => setResults(await searchPatientsAction(value))),
      250,
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Find the patient</CardTitle>
        <CardDescription>
          Search first to avoid duplicate records. Register only if the patient is new.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            autoFocus
            value={q}
            onChange={(e) => search(e.target.value)}
            placeholder="Last name, first name, patient no., or contact"
            aria-label="Search patients"
            className="pl-8"
          />
          {pending && (
            <Loader2 className="absolute top-1/2 right-2.5 size-4 -translate-y-1/2 animate-spin text-muted-foreground" />
          )}
        </div>

        {results && (
          <div className="rounded-lg border">
            {results.length === 0 ? (
              <p className="px-3 py-6 text-center text-sm text-muted-foreground">
                No patient found for “{q}”.
              </p>
            ) : (
              <ul className="divide-y">
                {results.map((p) => (
                  <PatientRow key={p.id} p={p} onSelect={() => onSelect(p)} />
                ))}
              </ul>
            )}
          </div>
        )}

        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <span className="h-px flex-1 bg-border" />
          or
          <span className="h-px flex-1 bg-border" />
        </div>
        <Button variant="secondary" onClick={onRegister} className="self-start">
          <UserPlus />
          Register a new patient
        </Button>
      </CardContent>
    </Card>
  );
}

function RegisterPatientForm({
  onRegistered,
  onCancel,
}: {
  onRegistered: (p: SelectedPatient) => void;
  onCancel: () => void;
}) {
  const [duplicates, setDuplicates] = useState<PatientSearchResult[] | null>(null);
  const [pending, startTransition] = useTransition();
  const form = useForm<PatientInput, unknown, PatientData>({
    resolver: zodResolver(patientSchema),
    defaultValues: {
      firstName: "",
      middleName: "",
      lastName: "",
      suffix: "",
      contactNo: "",
      purok: "",
      philhealthNo: "",
      bloodType: "",
      is4psMember: false,
      privacyConsent: false as unknown as true,
    },
  });
  const {
    register,
    control,
    formState: { errors },
  } = form;

  function submit(allowDuplicate: boolean) {
    startTransition(async () => {
      const values = form.getValues();
      const result = await registerPatient(values, { allowDuplicate });
      if (result.ok) {
        toast.success("Patient registered", { description: result.data.patientNo });
        onRegistered({
          id: result.data.id,
          name: result.data.name,
          patientNo: result.data.patientNo,
          sex: values.sex,
          birthdate: values.birthdate,
          barangayName: BARANGAY_OPTIONS.find((b) => String(b.id) === String(values.barangayId))?.name ?? "",
          contactNo: values.contactNo || null,
        });
      } else if ("duplicates" in result) {
        setDuplicates(result.duplicates);
      } else {
        for (const [key, messages] of Object.entries(result.fieldErrors ?? {})) {
          form.setError(key as keyof PatientInput, { message: messages[0] });
        }
        toast.error(result.error);
      }
    });
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-2">
        <div>
          <CardTitle>Register new patient</CardTitle>
          <CardDescription>Personal information. Fields marked * are required.</CardDescription>
        </div>
        <Button variant="ghost" size="sm" onClick={onCancel}>
          <X /> Back to search
        </Button>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(() => submit(false))} className="flex flex-col gap-6" noValidate>
          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <FormField label="Last name" htmlFor="lastName" required error={errors.lastName}>
              <Input
                id="lastName"
                {...register("lastName")}
                aria-invalid={!!errors.lastName}
                autoComplete="off"
              />
            </FormField>
            <FormField label="First name" htmlFor="firstName" required error={errors.firstName}>
              <Input
                id="firstName"
                {...register("firstName")}
                aria-invalid={!!errors.firstName}
                autoComplete="off"
              />
            </FormField>
            <FormField label="Middle name" htmlFor="middleName" error={errors.middleName}>
              <Input id="middleName" {...register("middleName")} autoComplete="off" />
            </FormField>
            <FormField label="Suffix" htmlFor="suffix" error={errors.suffix}>
              <Input id="suffix" {...register("suffix")} placeholder="Jr., Sr., III" autoComplete="off" />
            </FormField>
          </section>

          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <FormField label="Sex" required error={errors.sex}>
              <Controller
                control={control}
                name="sex"
                render={({ field }) => (
                  <Select value={field.value ?? ""} onValueChange={field.onChange}>
                    <SelectTrigger className="w-full" aria-invalid={!!errors.sex} aria-label="Sex">
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      {SEX_OPTIONS.map((o) => (
                        <SelectItem key={o.value} value={o.value}>
                          {o.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </FormField>
            <FormField
              label="Birthdate"
              required
              error={errors.birthdate}
              description="Age is computed automatically."
            >
              <Controller
                control={control}
                name="birthdate"
                render={({ field }) => (
                  <DatePicker
                    value={field.value}
                    onChange={(v) => field.onChange(v ?? "")}
                    invalid={!!errors.birthdate}
                    toYear={new Date().getFullYear()}
                  />
                )}
              />
            </FormField>
            <FormField label="Civil status" error={errors.civilStatus}>
              <Controller
                control={control}
                name="civilStatus"
                render={({ field }) => (
                  <Select value={field.value ?? ""} onValueChange={field.onChange}>
                    <SelectTrigger className="w-full" aria-label="Civil status">
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      {CIVIL_STATUS_OPTIONS.map((o) => (
                        <SelectItem key={o.value} value={o.value}>
                          {o.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </FormField>
            <FormField label="Blood type" error={errors.bloodType}>
              <Controller
                control={control}
                name="bloodType"
                render={({ field }) => (
                  <Select value={field.value ?? ""} onValueChange={field.onChange}>
                    <SelectTrigger className="w-full" aria-label="Blood type">
                      <SelectValue placeholder="Unknown" />
                    </SelectTrigger>
                    <SelectContent>
                      {BLOOD_TYPES.map((b) => (
                        <SelectItem key={b} value={b}>
                          {b}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </FormField>
          </section>

          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <FormField label="Barangay" required error={errors.barangayId}>
              <Controller
                control={control}
                name="barangayId"
                render={({ field }) => (
                  <Select value={field.value ? String(field.value) : ""} onValueChange={field.onChange}>
                    <SelectTrigger
                      className="w-full"
                      aria-invalid={!!errors.barangayId}
                      aria-label="Barangay"
                    >
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
                )}
              />
            </FormField>
            <FormField label="Purok / street" htmlFor="purok" error={errors.purok}>
              <Input id="purok" {...register("purok")} placeholder="Purok 3" />
            </FormField>
            <FormField label="Contact number" htmlFor="contactNo" error={errors.contactNo}>
              <Input
                id="contactNo"
                {...register("contactNo")}
                inputMode="tel"
                placeholder="09171234567"
                aria-invalid={!!errors.contactNo}
              />
            </FormField>
            <div className="flex items-end pb-2">
              <Controller
                control={control}
                name="is4psMember"
                render={({ field }) => (
                  <label className="flex items-center gap-2 text-sm font-medium">
                    <Checkbox checked={!!field.value} onCheckedChange={(v) => field.onChange(v === true)} />
                    4Ps member
                  </label>
                )}
              />
            </div>
          </section>

          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <FormField label="PhilHealth number" htmlFor="philhealthNo" error={errors.philhealthNo}>
              <Input
                id="philhealthNo"
                {...register("philhealthNo")}
                placeholder="00-000000000-0"
                aria-invalid={!!errors.philhealthNo}
              />
            </FormField>
            <FormField label="PhilHealth status" error={errors.philhealthStatus}>
              <Controller
                control={control}
                name="philhealthStatus"
                render={({ field }) => (
                  <Select value={field.value ?? ""} onValueChange={field.onChange}>
                    <SelectTrigger className="w-full" aria-label="PhilHealth status">
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      {PHILHEALTH_STATUS_OPTIONS.map((o) => (
                        <SelectItem key={o.value} value={o.value}>
                          {o.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </FormField>
          </section>

          <Controller
            control={control}
            name="privacyConsent"
            render={({ field }) => (
              <div
                className="rounded-lg border bg-muted/40 p-3 text-sm"
                data-invalid={!!errors.privacyConsent || undefined}
              >
                <label className="flex items-start gap-2">
                  <Checkbox
                    className="mt-0.5"
                    checked={!!field.value}
                    onCheckedChange={(v) => field.onChange(v === true)}
                    aria-invalid={!!errors.privacyConsent}
                  />
                  <span>
                    The patient was informed of the RHU privacy notice and consents to the collection and use
                    of their personal and health information for their care, under the Data Privacy Act of
                    2012 (RA 10173).
                  </span>
                </label>
                {errors.privacyConsent && (
                  <p className="mt-1 pl-6 text-destructive">{errors.privacyConsent.message}</p>
                )}
              </div>
            )}
          />

          {duplicates && (
            <div role="alert" className="rounded-lg border border-amber-500/50 bg-amber-500/5 p-3">
              <p className="font-medium text-amber-800 dark:text-amber-300">Possible duplicate record</p>
              <p className="mb-2 text-sm text-muted-foreground">
                A patient with the same name and birthdate already exists. Use the existing record if it is
                the same person.
              </p>
              <ul className="divide-y rounded-md border bg-background">
                {duplicates.map((d) => (
                  <PatientRow key={d.id} p={d} action="Use this patient" onSelect={() => onRegistered(d)} />
                ))}
              </ul>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="mt-2"
                disabled={pending}
                onClick={() => submit(true)}
              >
                It is a different person — register anyway
              </Button>
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit" disabled={pending}>
              {pending && <Loader2 className="animate-spin" />}
              Register and continue
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
