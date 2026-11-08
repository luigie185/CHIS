import { Activity } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-1 flex-col">
      <header className="border-b">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4 px-4 py-3">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Activity className="size-4" />
            </span>
            <span>RHU Health Information System</span>
          </Link>
          <Button asChild size="sm">
            <Link href="/login">Staff login</Link>
          </Button>
        </div>
      </header>
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-12">{children}</main>
      <footer className="border-t py-6 text-center text-xs text-muted-foreground">
        Rural Health Unit · Patient information is protected under the Data Privacy Act of 2012 (RA 10173).
      </footer>
    </div>
  );
}
