import { Activity } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { homeForRole } from "@/lib/auth/permissions";
import { getCurrentUser } from "@/lib/auth/session";
import { DEMO_ACCOUNTS } from "@/lib/demo-accounts";
import { LoginForm, type DemoLogin } from "./login-form";

export const metadata: Metadata = { title: "Login" };

/** Demo logins are offered only in local development with demo accounts enabled. */
function demoLogin(): DemoLogin | undefined {
  if (process.env.NODE_ENV !== "development" || process.env.SEED_DEMO_ACCOUNTS !== "true") return undefined;
  const password = process.env.SEED_DEMO_PASSWORD || process.env.SEED_ADMIN_PASSWORD;
  if (!password) return undefined;
  const accounts = [
    ...(process.env.SEED_ADMIN_EMAIL ? [{ role: "admin", email: process.env.SEED_ADMIN_EMAIL }] : []),
    ...DEMO_ACCOUNTS.map((a) => ({ role: a.role, email: a.email })),
  ];
  return { accounts, adminPassword: process.env.SEED_ADMIN_PASSWORD ?? password, password };
}

export default async function LoginPage() {
  const user = await getCurrentUser();
  if (user) redirect(homeForRole(user.role));

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 bg-muted/40 px-4 py-12">
      <Link href="/" className="flex items-center gap-2 font-semibold">
        <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <Activity className="size-4" />
        </span>
        RHU Health Information System
      </Link>
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-xl">Staff login</CardTitle>
          <CardDescription>Sign in with your RHU staff account.</CardDescription>
        </CardHeader>
        <CardContent>
          <LoginForm demo={demoLogin()} />
        </CardContent>
      </Card>
    </main>
  );
}
