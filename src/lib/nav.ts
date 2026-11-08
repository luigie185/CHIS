import type { UserRole } from "@/db/schema/enums";
import { hasPermission, homeForRole, type Permission } from "@/lib/auth/permissions";

export type NavIcon =
  | "home"
  | "patients"
  | "queue"
  | "consultations"
  | "referrals"
  | "prenatal"
  | "immunization"
  | "vaccinations"
  | "risk"
  | "mental-health"
  | "disease"
  | "critical"
  | "analytics"
  | "imports"
  | "staff"
  | "settings"
  | "audit";

export type NavItem = {
  title: string;
  href: string;
  icon: NavIcon;
  /** false = shown as "Soon" until its frontend phase is built. */
  ready: boolean;
  phase?: string;
};

export type NavGroup = { label: string; items: NavItem[] };

type NavItemDef = Omit<NavItem, "href"> & {
  href: string | ((role: UserRole) => string);
  permission?: Permission;
  roles?: UserRole[];
};

const CLINICAL: UserRole[] = ["doctor", "nurse", "midwife"];

// Routes and roles follow IMPLEMENTATION_PLAN.md §8.
const NAV: { label: string; items: NavItemDef[] }[] = [
  {
    label: "Overview",
    items: [{ title: "Home", href: homeForRole, icon: "home", ready: true }],
  },
  {
    label: "Patients",
    items: [
      { title: "Patients", href: "/patients", icon: "patients", permission: "patient:read", ready: true },
      {
        title: "Queue",
        href: "/queue",
        icon: "queue",
        permission: "encounter:create",
        ready: false,
        phase: "F2",
      },
    ],
  },
  {
    label: "Clinical",
    items: [
      {
        title: "Consultations (ITR)",
        href: "/itr",
        icon: "consultations",
        roles: CLINICAL,
        ready: false,
        phase: "F3",
      },
      {
        title: "Referrals",
        href: "/referrals",
        icon: "referrals",
        roles: CLINICAL,
        ready: false,
        phase: "F3",
      },
      {
        title: "Prenatal",
        href: "/prenatal",
        icon: "prenatal",
        roles: ["doctor", "midwife"],
        ready: false,
        phase: "F4",
      },
      {
        title: "Immunization (EPI)",
        href: "/immunization",
        icon: "immunization",
        roles: CLINICAL,
        ready: false,
        phase: "F4",
      },
      {
        title: "Vaccinations",
        href: "/vaccinations",
        icon: "vaccinations",
        roles: CLINICAL,
        ready: false,
        phase: "F4",
      },
      { title: "Risk assessment", href: "/risk", icon: "risk", roles: CLINICAL, ready: false, phase: "F4" },
      {
        title: "Mental health",
        href: "/mental-health",
        icon: "mental-health",
        roles: ["doctor", "nurse"],
        ready: false,
        phase: "F4",
      },
    ],
  },
  {
    label: "Reports",
    items: [
      {
        title: "Disease cases",
        href: "/cases/disease",
        icon: "disease",
        roles: [...CLINICAL, "admin"],
        ready: false,
        phase: "F5",
      },
      {
        title: "Critical cases",
        href: "/cases/critical",
        icon: "critical",
        roles: [...CLINICAL, "admin"],
        ready: false,
        phase: "F5",
      },
      {
        title: "Analytics",
        href: "/analytics",
        icon: "analytics",
        permission: "reports:read",
        ready: false,
        phase: "F5",
      },
      {
        title: "CSV import",
        href: "/imports",
        icon: "imports",
        permission: "import:run",
        ready: false,
        phase: "F5",
      },
    ],
  },
  {
    label: "Administration",
    items: [
      {
        title: "Staff",
        href: "/admin/staff",
        icon: "staff",
        permission: "staff:manage",
        ready: false,
        phase: "F5",
      },
      {
        title: "Settings",
        href: "/admin/settings",
        icon: "settings",
        permission: "settings:manage",
        ready: false,
        phase: "F5",
      },
      {
        title: "Audit log",
        href: "/admin/audit",
        icon: "audit",
        permission: "audit:read",
        ready: false,
        phase: "F5",
      },
    ],
  },
];

/** Sidebar items the role may see. Computed on the server; the result is plain data. */
export function navForRole(role: UserRole): NavGroup[] {
  return NAV.map((group) => ({
    label: group.label,
    items: group.items
      .filter(
        (item) =>
          (!item.permission || hasPermission(role, item.permission)) &&
          (!item.roles || item.roles.includes(role)),
      )
      .map((item): NavItem => ({
        title: item.title,
        icon: item.icon,
        ready: item.ready,
        phase: item.phase,
        href: typeof item.href === "function" ? item.href(role) : item.href,
      })),
  })).filter((group) => group.items.length > 0);
}
