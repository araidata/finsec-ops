export default function ApplicationLoading() {
  return (
    <main
      aria-label="Loading workspace"
      className="grid min-h-[50vh] place-items-center p-6"
    >
      <div className="w-full max-w-3xl animate-pulse space-y-4">
        <div className="h-8 w-64 rounded bg-secondary" />
        <div className="h-4 w-96 max-w-full rounded bg-secondary/70" />
        <div className="h-64 rounded-xl border bg-card" />
      </div>
    </main>
  );
}
