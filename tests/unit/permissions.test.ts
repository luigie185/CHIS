import { describe, expect, it } from "vitest";
import { hasPermission, homeForRole, isRole, PERMISSIONS, ROLES } from "@/lib/auth/permissions";

describe("permission matrix", () => {
  it("lets only doctors write consultations and complete encounters", () => {
    for (const role of ROLES) {
      expect(hasPermission(role, "consultation:write")).toBe(role === "doctor");
      expect(hasPermission(role, "encounter:complete")).toBe(role === "doctor");
    }
  });

  it("keeps admins out of clinical writes", () => {
    for (const p of ["encounter:create", "vitals:write", "consultation:write", "prenatal:write"] as const) {
      expect(hasPermission("admin", p)).toBe(false);
    }
  });

  it("reserves staff, settings and audit management for admins", () => {
    for (const p of ["staff:manage", "settings:manage", "audit:read", "patient:delete"] as const) {
      for (const role of ROLES) expect(hasPermission(role, p)).toBe(role === "admin");
    }
  });

  it("does not let encoders diagnose or prescribe", () => {
    expect(hasPermission("encoder", "consultation:write")).toBe(false);
    expect(hasPermission("encoder", "import:run")).toBe(true);
  });

  it("gives every role patient read access and denies guests everything", () => {
    for (const role of ROLES) expect(hasPermission(role, "patient:read")).toBe(true);
    for (const p of PERMISSIONS) expect(hasPermission(null, p)).toBe(false);
  });

  it("routes roles to their home page", () => {
    expect(homeForRole("admin")).toBe("/admin");
    expect(homeForRole("doctor")).toBe("/doctor");
    expect(homeForRole("nurse")).toBe("/dashboard");
    expect(isRole("superuser")).toBe(false);
  });
});
