"use client";

import { Button } from "@/components/ui/button";

export default function ApplicationError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="grid min-h-screen place-items-center bg-background p-6">
      <section className="max-w-lg rounded-xl border bg-card p-8 text-center">
        <h1 className="text-xl font-semibold">This workspace could not load</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Retry the request. If the problem continues, provide the support ID to
          the operations owner.
        </p>
        {error.digest ? (
          <p className="mt-3 font-mono text-xs text-muted-foreground">
            Support ID: {error.digest}
          </p>
        ) : null}
        <Button type="button" className="mt-5" onClick={reset}>
          Try again
        </Button>
      </section>
    </main>
  );
}
