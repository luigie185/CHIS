import type { ReactNode } from "react";
import { EmptyState } from "@/components/empty-state";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { DataTablePagination } from "./data-table-pagination";

export type Column<T> = {
  header: string;
  cell: (row: T) => ReactNode;
  className?: string;
  /** Hide on small screens. */
  hideOnMobile?: boolean;
};

/**
 * Server-rendered table for server-side pagination (plan §3.3).
 * Search and filters live in <DataTableToolbar> and are stored in the URL.
 */
export function DataTable<T>({
  columns,
  rows,
  rowKey,
  page,
  pageCount,
  total,
  pageSize,
  emptyTitle = "No records found",
  emptyDescription = "Try a different search or clear the filters.",
}: {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  page: number;
  pageCount: number;
  total: number;
  pageSize: number;
  emptyTitle?: string;
  emptyDescription?: string;
}) {
  return (
    <div className="flex flex-col gap-3">
      <div className="overflow-hidden rounded-lg border">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              {columns.map((c) => (
                <TableHead
                  key={c.header}
                  className={cn(c.hideOnMobile && "hidden md:table-cell", c.className)}
                >
                  {c.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={columns.length}>
                  <EmptyState title={emptyTitle} description={emptyDescription} />
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row) => (
                <TableRow key={rowKey(row)}>
                  {columns.map((c) => (
                    <TableCell
                      key={c.header}
                      className={cn(c.hideOnMobile && "hidden md:table-cell", c.className)}
                    >
                      {c.cell(row)}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      <DataTablePagination page={page} pageCount={pageCount} total={total} pageSize={pageSize} />
    </div>
  );
}
