"use client";

import { Search, X } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

export type ToolbarFilter = {
  /** URL query parameter, e.g. "barangay". */
  param: string;
  label: string;
  /** Text for the "no filter" choice. Defaults to "All <label>". */
  allLabel?: string;
  options: { value: string; label: string }[];
};

const ALL = "__all__";

/** Search box + filter selects stored in the URL (shareable, back-button safe). */
export function DataTableToolbar({
  searchPlaceholder = "Search…",
  filters = [],
  children,
}: {
  searchPlaceholder?: string;
  filters?: ToolbarFilter[];
  children?: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();
  const urlQ = searchParams.get("q") ?? "";
  const [q, setQ] = useState(urlQ);
  const [prevUrlQ, setPrevUrlQ] = useState(urlQ);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  function update(changes: Record<string, string | null>) {
    const params = new URLSearchParams(searchParams);
    for (const [key, value] of Object.entries(changes)) {
      if (value) params.set(key, value);
      else params.delete(key);
    }
    params.delete("page"); // new filters → back to page 1
    const qs = params.toString();
    startTransition(() => router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false }));
  }

  // Keep the box in sync when the URL changes elsewhere (back button, reset),
  // without overwriting what the user is still typing.
  if (urlQ !== prevUrlQ) {
    setPrevUrlQ(urlQ);
    if (urlQ !== q.trim()) setQ(urlQ);
  }

  const active = filters.some((f) => searchParams.get(f.param)) || !!searchParams.get("q");

  return (
    <div className={cn("mb-4 flex flex-col gap-2 lg:flex-row lg:items-center", pending && "opacity-80")}>
      <div className="relative w-full lg:max-w-xs">
        <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          value={q}
          placeholder={searchPlaceholder}
          aria-label="Search"
          className="pl-8"
          onChange={(e) => {
            const value = e.target.value;
            setQ(value);
            clearTimeout(timer.current);
            timer.current = setTimeout(() => update({ q: value.trim() || null }), 300);
          }}
        />
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {filters.map((f) => {
          const value = searchParams.get(f.param) ?? ALL;
          const allLabel = f.allLabel ?? `All ${f.label.toLowerCase()}`;
          const label = f.options.find((o) => o.value === value)?.label ?? allLabel;
          return (
            <Select
              key={f.param}
              value={value}
              onValueChange={(v) => update({ [f.param]: v === ALL ? null : v })}
            >
              <SelectTrigger
                className={cn("w-[calc(50%-0.25rem)] sm:w-40", value === ALL && "text-muted-foreground")}
                aria-label={f.label}
              >
                <SelectValue>{label}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>{allLabel}</SelectItem>
                {f.options.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          );
        })}
        {active && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setQ("");
              update(Object.fromEntries([["q", null], ...filters.map((f) => [f.param, null])]));
            }}
          >
            <X />
            Reset
          </Button>
        )}
      </div>
      {children && <div className="flex gap-2 lg:ml-auto">{children}</div>}
    </div>
  );
}
