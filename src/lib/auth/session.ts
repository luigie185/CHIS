import "server-only";
import { headers } from "next/headers";
import { forbidden, redirect } from "next/navigation";
import { cache } from "react";
import type { UserRole } from "@/db/schema/enums";
import { auth } from "./index";
import { hasPermission, isRole, type Permission } from "./permissions";

export type CurrentUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
};

/** Reads the session once per request. Returns null for guests. */
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return null;
  const { id, name, email, role } = session.user;
  if (!isRole(role)) return null;
  return { id, name, email, role };
});

/** Redirects guests to /login. */
export async function requireUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

/** Redirects guests to /login and returns 403 for roles without the permission. */
export async function requirePermission(permission: Permission): Promise<CurrentUser> {
  const user = await requireUser();
  if (!hasPermission(user.role, permission)) forbidden();
  return user;
}

/** Redirects guests to /login and returns 403 for roles not in the list. */
export async function requireRole(...roles: UserRole[]): Promise<CurrentUser> {
  const user = await requireUser();
  if (!roles.includes(user.role)) forbidden();
  return user;
}
