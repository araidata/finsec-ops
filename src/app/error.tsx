"use client";

import { Button } from "@/components/ui/button";

export default function AppError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="min-h-screen bg-background p-6 text-foreground">
      <h1 className="text-2xl font-semibold">Workspace unavailable</h1>
      <div className="mt-4 max-w-3xl rounded-lg border border-red-400/30 bg-red-400/10 p-4">
        <p className="text-sm font-medium text-red-100">
          The workspace encountered an unexpected error.
        </p>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          No changes were made by this page load. Try the request again.
        </p>
        <Button className="mt-4" variant="outline" onClick={reset}>
          Try again
        </Button>
      </div>
    </main>
  );
}
