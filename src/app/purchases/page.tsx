import { DatabaseSetupState } from "@/components/catalog/database-setup-state";
import { PurchasesWorkspace } from "@/components/catalog/purchases-workspace";
import { getPurchasePageData } from "@/lib/server/catalog-service";
import { hasDatabaseUrl } from "@/lib/server/prisma";

export const dynamic = "force-dynamic";

export default async function PurchasesPage() {
  if (!hasDatabaseUrl()) {
    return <DatabaseSetupState title="Purchases" />;
  }

  let data: Awaited<ReturnType<typeof getPurchasePageData>>;

  try {
    data = await getPurchasePageData();
  } catch (error) {
    return (
      <DatabaseSetupState
        title="Purchases"
        detail={error instanceof Error ? error.message : undefined}
      />
    );
  }

  return <PurchasesWorkspace data={JSON.parse(JSON.stringify(data))} />;
}
