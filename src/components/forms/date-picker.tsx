"use client";

import { format, parseISO } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

/** Date field that reads/writes ISO dates (yyyy-mm-dd), matching `date` columns and Zod schemas. */
export function DatePicker({
  value,
  onChange,
  placeholder = "Pick a date",
  fromYear = 1920,
  toYear = new Date().getFullYear() + 1,
  disabled,
  id,
  invalid,
}: {
  value: string | null | undefined;
  onChange: (value: string | null) => void;
  placeholder?: string;
  fromYear?: number;
  toYear?: number;
  disabled?: boolean;
  id?: string;
  invalid?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const date = value ? parseISO(value) : undefined;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          disabled={disabled}
          aria-invalid={invalid}
          className={cn("w-full justify-start font-normal", !date && "text-muted-foreground")}
        >
          <CalendarIcon />
          {date ? format(date, "MMM d, yyyy") : placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={date}
          defaultMonth={date}
          captionLayout="dropdown"
          startMonth={new Date(fromYear, 0)}
          endMonth={new Date(toYear, 11)}
          onSelect={(d) => {
            onChange(d ? format(d, "yyyy-MM-dd") : null);
            setOpen(false);
          }}
        />
      </PopoverContent>
    </Popover>
  );
}
