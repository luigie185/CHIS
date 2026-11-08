import type { UserRole } from "@/db/schema/enums";

export const ROLES = [
  "admin",
  "doctor",
  "nurse",
  "midwife",
  "encoder",
] as const satisfies readonly UserRole[];

// Permission matrix — IMPLEMENTATION_PLAN.md §4.2. The server enforces these; the UI only hides buttons.
const MATRIX = {
  "patient:read": ["admin", "doctor", "nurse", "midwife", "encoder"],
  "patient:write": ["admin", "doctor", "nurse", "midwife", "encoder"],
  "patient:delete": ["admin"],
  "encounter:create": ["doctor", "nurse", "midwife", "encoder"],
  "vitals:write": ["doctor", "nurse", "midwife", "encoder"],
  "consultation:write": ["doctor"],
  "encounter:complete": ["doctor"],
  "encounter:cancel": ["doctor", "nurse", "midwife"],
  "referral:write": ["doctor", "nurse", "midwife"],
  "prenatal:write": ["doctor", "midwife"],
  "immunization:write": ["doctor", "nurse", "midwife"],
  "risk:write": ["doctor", "nurse", "midwife"],
  "mental_health:write": ["doctor", "nurse"],
  "import:run": ["admin", "encoder"],
  "reports:read": ["admin", "doctor", "nurse", "midwife"],
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
