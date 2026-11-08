import Link from "next/link";
import { requireUser } from "@/lib/auth/session";
import { homeForRole } from "@/lib/auth/permissions";
import { SignOutButton } from "./sign-out-button";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();

  return (
    <div className="flex flex-1 flex-col">
      <header className="border-b border-neutral-200 dark:border-neutral-800">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-3">
          <Link href={homeForRole(user.role)} className="font-semibold">
            RHU HIS
          </Link>
          <div className="flex items-center gap-3 text-sm">
            <span className="hidden sm:inline">{user.name}</span>
            <span className="rounded bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800 capitalize dark:bg-emerald-900 dark:text-emerald-100">
              {user.role}
            </span>
            <SignOutButton />
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">{children}</main>
    </div>
  );
}
