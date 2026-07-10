import { PurchasesWorkspace } from "@/components/catalog/purchases-workspace";
import { getPurchasePageData } from "@/lib/server/catalog-service";
import { hasDatabaseUrl } from "@/lib/server/prisma";

export const dynamic = "force-dynamic";

export default async function PurchasesPage() {
  if (!hasDatabaseUrl()) {
    return (
      <main className="min-h-screen bg-background p-6 text-foreground">
        <h1 className="text-2xl font-semibold">Purchases</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Database persistence is required. Set DATABASE_URL or
          POSTGRES_PRISMA_URL, apply the reviewed Prisma migrations, and reload
          this page.
        </p>
      </main>
    );
  }

  const data = await getPurchasePageData();

  return <PurchasesWorkspace data={JSON.parse(JSON.stringify(data))} />;
}
