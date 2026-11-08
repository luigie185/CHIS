"use client";

import { FlaskConical } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth/client";

export type DemoLogin = {
  accounts: { role: string; email: string }[];
  password: string;
  adminPassword: string;
};

export function LoginForm({ demo }: { demo?: DemoLogin }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function signIn(email: string, password: string) {
    setError(null);
    setPending(true);
    const { error } = await authClient.signIn.email({ email, password });
    setPending(false);
    if (error) {
      setError(
        error.status === 429
          ? "Too many attempts. Please wait a minute."
          : error.message || "Invalid email or password.",
      );
      return;
    }
    // The login page redirects signed-in users to their role's home.
    router.replace("/login");
    router.refresh();
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    void signIn(String(form.get("email")), String(form.get("password")));
  }

  return (
    <div className="flex flex-col gap-6">
      <form onSubmit={onSubmit}>
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="email">Email</FieldLabel>
            <Input id="email" name="email" type="email" autoComplete="username" required />
          </Field>
          <Field>
            <FieldLabel htmlFor="password">Password</FieldLabel>
            <Input id="password" name="password" type="password" autoComplete="current-password" required />
          </Field>
          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}
          <Button type="submit" disabled={pending}>
            {pending ? "Signing in…" : "Sign in"}
          </Button>
        </FieldGroup>
      </form>

      {demo && (
        <div className="rounded-lg border border-dashed border-amber-500/50 p-3">
          <p className="mb-2 flex items-center gap-1.5 text-xs font-medium text-amber-700 dark:text-amber-400">
            <FlaskConical className="size-3.5" /> Demo accounts (local development only)
          </p>
          <div className="grid grid-cols-2 gap-2">
            {demo.accounts.map((a) => (
              <Button
                key={a.email}
                type="button"
                variant="outline"
                size="sm"
                className="capitalize"
                disabled={pending}
                onClick={() => signIn(a.email, a.role === "admin" ? demo.adminPassword : demo.password)}
              >
                {a.role}
              </Button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
