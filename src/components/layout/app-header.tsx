"use client";

import { FlaskConical } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Fragment } from "react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { NavGroup } from "@/lib/nav";
import { ThemeToggle } from "./theme-toggle";
import { UserMenu, type UserMenuUser } from "./user-menu";

/** Path prefixes that are not pages of their own; they are left out of the breadcrumb. */
const NOT_PAGES = new Set(["/doctor/consult", "/visits"]);

function humanize(segment: string) {
  if (/^[0-9a-f-]{20,}$/i.test(segment)) return "Details";
  return segment.replace(/-/g, " ").replace(/^\w/, (c) => c.toUpperCase());
}

export function AppHeader({
  nav,
  user,
  demoData,
}: {
  nav: NavGroup[];
  user: UserMenuUser;
  demoData: boolean;
}) {
  const pathname = usePathname();
  const titles = new Map(nav.flatMap((g) => g.items.map((i) => [i.href, i.title] as const)));

  const segments = pathname.split("/").filter(Boolean);
  const crumbs = segments
    .map((seg, i) => {
      const href = `/${segments.slice(0, i + 1).join("/")}`;
      const parent = `/${segments.slice(0, i).join("/")}`;
      // A record under /doctor/consult is the consultation itself.
      const label = titles.get(href) ?? (parent === "/doctor/consult" ? "Consultation" : humanize(seg));
      return { href, label };
    })
    .filter((c) => !NOT_PAGES.has(c.href));

  return (
    <header
      data-print="hide"
      className="sticky top-0 z-10 flex h-14 shrink-0 items-center gap-2 border-b bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/80"
    >
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="mr-2 data-[orientation=vertical]:h-4" />
      <Breadcrumb className="min-w-0">
        <BreadcrumbList>
          {crumbs.map((c, i) => (
            <Fragment key={c.href}>
              {i > 0 && <BreadcrumbSeparator className="hidden sm:block" />}
              <BreadcrumbItem className={i < crumbs.length - 1 ? "hidden sm:inline-flex" : "truncate"}>
                {i < crumbs.length - 1 ? (
                  <BreadcrumbLink asChild>
                    <Link href={c.href}>{c.label}</Link>
                  </BreadcrumbLink>
                ) : (
                  <BreadcrumbPage className="truncate">{c.label}</BreadcrumbPage>
                )}
              </BreadcrumbItem>
            </Fragment>
          ))}
        </BreadcrumbList>
      </Breadcrumb>

      <div className="ml-auto flex items-center gap-2">
        {demoData && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge
                variant="outline"
                className="gap-1 border-amber-500/50 text-amber-700 dark:text-amber-400"
              >
                <FlaskConical className="size-3" />
                <span className="hidden sm:inline">Demo data</span>
              </Badge>
            </TooltipTrigger>
            <TooltipContent className="max-w-64">
              Patient and clinical data on these screens is generated sample data. Changes reset when the
              server restarts.
            </TooltipContent>
          </Tooltip>
        )}
        <ThemeToggle />
        <UserMenu user={user} />
      </div>
    </header>
  );
}
