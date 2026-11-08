"use client";

import { TriangleAlert } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <EmptyState
      icon={TriangleAlert}
      title="Something went wrong"
      description={
        error.digest
          ? `The page could not be loaded. Reference: ${error.digest}`
          : "The page could not be loaded. Please try again."
      }
      action={<Button onClick={reset}>Try again</Button>}
    />
  );
}
