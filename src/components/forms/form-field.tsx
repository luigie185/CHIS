"use client";

import type { FieldError as RhfFieldError } from "react-hook-form";
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field";
import { cn } from "@/lib/utils";

/** Label + control + help text + error message, wired for react-hook-form. */
export function FormField({
  label,
  htmlFor,
  error,
  description,
  required,
  className,
  children,
}: {
  label: string;
  htmlFor?: string;
  error?: RhfFieldError | { message?: string };
  description?: React.ReactNode;
  required?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <Field data-invalid={!!error || undefined} className={cn("gap-1.5", className)}>
      <FieldLabel htmlFor={htmlFor}>
        {label}
        {required && <span className="text-destructive">*</span>}
      </FieldLabel>
      {children}
      {description && !error && <FieldDescription>{description}</FieldDescription>}
      {error?.message && <FieldError>{error.message}</FieldError>}
    </Field>
  );
}

/** Input with a unit suffix (mmHg, °C, kg…). */
export function UnitInput({ unit, children }: { unit: string; children: React.ReactNode }) {
  return (
    <div className="relative">
      {children}
      <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-xs text-muted-foreground">
        {unit}
      </span>
    </div>
  );
}
