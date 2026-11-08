import { ShieldX } from "lucide-react";
import Link from "next/link";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";

export default function Forbidden() {
  return (
    <main className="flex flex-1 items-center justify-center">
      <EmptyState
        icon={ShieldX}
        title="403 — Not allowed"
        description="Your role does not have access to this page."
        action={
          <Button asChild variant="outline">
            <Link href="/login">Go to my home page</Link>
          </Button>
        }
      />
    </main>
  );
}
