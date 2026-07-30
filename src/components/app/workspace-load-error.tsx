export function WorkspaceLoadError({ title }: { title: string }) {
  return (
    <main className="min-h-screen bg-background p-6 text-foreground">
      <h1 className="text-2xl font-semibold">{title}</h1>
      <div className="mt-4 max-w-3xl rounded-lg border border-red-400/30 bg-red-400/10 p-4">
        <p className="text-sm font-medium text-red-100">
          This workspace could not be loaded.
        </p>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Try again in a moment. If the problem continues, contact the
          application administrator.
        </p>
      </div>
    </main>
  );
}
