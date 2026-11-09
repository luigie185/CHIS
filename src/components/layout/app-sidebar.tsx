"use client";

import {
  Activity,
  BarChart3,
  Baby,
  Brain,
  ClipboardList,
  ClipboardPlus,
  FileUp,
  HeartPulse,
  Home,
  ListOrdered,
  ScrollText,
  Settings,
  ShieldAlert,
  Stethoscope,
  Syringe,
  Send,
  UserCog,
  Users,
  Virus,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar";
import type { NavGroup, NavIcon } from "@/lib/nav";

const ICONS: Record<NavIcon, LucideIcon> = {
  home: Home,
  "new-visit": ClipboardPlus,
  patients: Users,
  queue: ListOrdered,
  consultations: Stethoscope,
  referrals: Send,
  prenatal: Baby,
  immunization: ClipboardList,
  vaccinations: Syringe,
  risk: HeartPulse,
  "mental-health": Brain,
  disease: Virus,
  critical: ShieldAlert,
  analytics: BarChart3,
  imports: FileUp,
  staff: UserCog,
  settings: Settings,
  audit: ScrollText,
};

export function AppSidebar({ nav, homeHref }: { nav: NavGroup[]; homeHref: string }) {
  const pathname = usePathname();
  const { setOpenMobile } = useSidebar();

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href={homeHref} onClick={() => setOpenMobile(false)}>
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                  <Activity className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">RHU HIS</span>
                  <span className="truncate text-xs text-muted-foreground">Health Information System</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        {nav.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
            <SidebarMenu>
              {group.items.map((item) => {
                const Icon = ICONS[item.icon];
                const active =
                  item.href === homeHref
                    ? pathname === item.href
                    : pathname === item.href || pathname.startsWith(`${item.href}/`);
                if (!item.ready) {
                  return (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton
                        disabled
                        aria-disabled
                        tooltip={`${item.title} — coming in ${item.phase}`}
                        className="opacity-60"
                      >
                        <Icon />
                        <span>{item.title}</span>
                      </SidebarMenuButton>
                      <SidebarMenuBadge className="text-[10px] text-muted-foreground">Soon</SidebarMenuBadge>
                    </SidebarMenuItem>
                  );
                }
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton asChild isActive={active} tooltip={item.title}>
                      <Link href={item.href} onClick={() => setOpenMobile(false)}>
                        <Icon />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarFooter className="px-4 pb-3 text-xs text-muted-foreground group-data-[collapsible=icon]:hidden">
        Rural Health Unit
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
