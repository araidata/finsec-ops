export function DatabaseSetupState({
  title,
  detail,
}: {
  title: string;
  detail?: string;
}) {
  return (
    <main className="min-h-screen bg-background p-6 text-foreground">
      <h1 className="text-2xl font-semibold">{title}</h1>
      <div className="mt-4 max-w-3xl rounded-lg border border-amber-400/30 bg-amber-400/10 p-4">
        <p className="text-sm font-medium text-amber-100">
          Database setup is required before this workspace can load.
        </p>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Confirm `DATABASE_URL` or `POSTGRES_PRISMA_URL` is configured in
          Vercel, then apply the reviewed Prisma migrations to the connected
          development database.
        </p>
        {detail ? (
          <p className="mt-3 break-words font-mono text-xs text-amber-100/80">
            {detail}
          </p>
        ) : null}
      </div>
    </main>
  );
}
