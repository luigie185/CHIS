import { describe, expect, it } from "vitest";
import { hasPermission, homeForRole, isRole, PERMISSIONS, ROLES } from "@/lib/auth/permissions";

describe("permission matrix (admin, doctor, staff)", () => {
  it("has exactly three roles", () => {
    expect(ROLES).toEqual(["admin", "doctor", "staff"]);
    expect(isRole("nurse")).toBe(false);
  });

  it("lets only staff do ITR intake (patient info, visit, vitals, queue)", () => {
    for (const p of ["patient:write", "encounter:create", "vitals:write"] as const) {
      for (const role of ROLES) expect(hasPermission(role, p)).toBe(role === "staff");
    }
  });

  it("lets only doctors consult, diagnose and complete", () => {
    for (const p of ["queue:consult", "consultation:write", "encounter:complete"] as const) {
      for (const role of ROLES) expect(hasPermission(role, p)).toBe(role === "doctor");
    }
  });

  it("keeps admin away from patient records and clinical data", () => {
    for (const p of PERMISSIONS.filter((p) =>
      /^(patient|encounter|vitals|queue|consultation|referral|prenatal|immunization|risk|mental_health):/.test(
        p,
      ),
    )) {
      expect(hasPermission("admin", p)).toBe(false);
    }
  });

  it("gives admin accounts, settings, audit and reports", () => {
    for (const p of ["staff:manage", "settings:manage", "audit:read"] as const) {
      for (const role of ROLES) expect(hasPermission(role, p)).toBe(role === "admin");
    }
    expect(hasPermission("admin", "reports:read")).toBe(true);
  });

  it("denies guests everything", () => {
    for (const p of PERMISSIONS) expect(hasPermission(null, p)).toBe(false);
  });

  it("routes roles to their home page", () => {
    expect(homeForRole("admin")).toBe("/admin");
    expect(homeForRole("doctor")).toBe("/doctor");
    expect(homeForRole("staff")).toBe("/dashboard");
  });
});
