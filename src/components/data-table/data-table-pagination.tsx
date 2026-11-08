"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";

export function DataTablePagination({
  page,
  pageCount,
  total,
  pageSize,
}: {
  page: number;
  pageCount: number;
  total: number;
  pageSize: number;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const hrefFor = (p: number) => {
    const params = new URLSearchParams(searchParams);
    if (p <= 1) params.delete("page");
    else params.set("page", String(p));
    const qs = params.toString();
    return qs ? `${pathname}?${qs}` : pathname;
  };

  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  return (
    <div className="flex items-center justify-between gap-2 text-sm text-muted-foreground">
      <p>{total === 0 ? "No results" : `Showing ${from}–${to} of ${total.toLocaleString()}`}</p>
      <div className="flex items-center gap-2">
        <span className="hidden sm:inline">
          Page {page} of {pageCount}
        </span>
        <Button variant="outline" size="icon" className="size-8" asChild={page > 1} disabled={page <= 1}>
          {page > 1 ? (
            <Link href={hrefFor(page - 1)} aria-label="Previous page" scroll={false}>
              <ChevronLeft />
            </Link>
          ) : (
            <span aria-label="Previous page">
              <ChevronLeft />
            </span>
          )}
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="size-8"
          asChild={page < pageCount}
          disabled={page >= pageCount}
        >
          {page < pageCount ? (
            <Link href={hrefFor(page + 1)} aria-label="Next page" scroll={false}>
              <ChevronRight />
            </Link>
          ) : (
            <span aria-label="Next page">
              <ChevronRight />
            </span>
          )}
        </Button>
      </div>
    </div>
  );
}
