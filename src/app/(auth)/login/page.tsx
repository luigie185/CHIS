import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { homeForRole } from "@/lib/auth/permissions";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Login" };

export default async function LoginPage() {
  const user = await getCurrentUser();
  if (user) redirect(homeForRole(user.role));

  return (
    <main className="flex flex-1 items-center justify-center px-4 py-16">
      <div className="w-full max-w-sm rounded-xl border border-neutral-200 p-6 shadow-sm dark:border-neutral-800">
        <h1 className="text-xl font-semibold">Staff login</h1>
        <p className="mt-1 mb-6 text-sm text-neutral-500">RHU Health Information System</p>
        <LoginForm />
      </div>
    </main>
  );
}
