import type { UserRole } from "@/db/schema/enums";

export const ROLES = ["admin", "doctor", "staff"] as const satisfies readonly UserRole[];

// Permission matrix — IMPLEMENTATION_PLAN.md §4.2. The server enforces these; the UI only hides buttons.
// Admin manages accounts and sees aggregated reports only; it never opens patient records.
const MATRIX = {
  "patient:read": ["doctor", "staff"],
  "patient:write": ["staff"],
  "encounter:create": ["staff"],
  "vitals:write": ["staff"],
  "encounter:cancel": ["doctor", "staff"],
  "queue:consult": ["doctor"],
  "consultation:write": ["doctor"],
  "encounter:complete": ["doctor"],
  "referral:write": ["doctor", "staff"],
  "prenatal:write": ["doctor", "staff"],
  "immunization:write": ["doctor", "staff"],
  "risk:write": ["doctor", "staff"],
  "mental_health:write": ["doctor", "staff"],
  "import:run": ["admin", "staff"],
  "reports:read": ["admin", "doctor"],
  "staff:manage": ["admin"],
  "settings:manage": ["admin"],
  "audit:read": ["admin"],
} as const satisfies Record<string, readonly UserRole[]>;

export type Permission = keyof typeof MATRIX;
export const PERMISSIONS = Object.keys(MATRIX) as Permission[];

export function hasPermission(role: UserRole | null | undefined, permission: Permission): boolean {
  if (!role) return false;
  return (MATRIX[permission] as readonly UserRole[]).includes(role);
}

export function isRole(value: unknown): value is UserRole {
  return typeof value === "string" && (ROLES as readonly string[]).includes(value);
}

/** Where each role lands after login. */
export function homeForRole(role: UserRole): string {
  switch (role) {
    case "admin":
      return "/admin";
    case "doctor":
      return "/doctor";
    default:
      return "/dashboard";
  }
}
