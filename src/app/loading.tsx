import { Skeleton } from "@/components/ui/skeleton";

export default function AppLoading() {
  return (
    <main
      aria-label="Loading workspace"
      className="min-h-screen bg-background p-4 text-foreground md:p-6"
    >
      <div className="flex min-h-[61px] items-center gap-3 border-b border-border/80">
        <Skeleton className="size-9" />
        <Skeleton className="h-4 w-36" />
        <Skeleton className="ml-auto hidden h-9 w-80 md:block" />
      </div>
      <div className="space-y-4 py-4">
        <div className="space-y-2">
          <Skeleton className="h-8 w-52" />
          <Skeleton className="h-3 w-72" />
        </div>
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-[28rem] w-full" />
      </div>
      <span className="sr-only" role="status">
        Loading workspace
      </span>
    </main>
  );
}
