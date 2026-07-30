import { DatabaseSetupState } from "@/components/catalog/database-setup-state";
import { ProductCatalogWorkspace } from "@/components/catalog/product-catalog-workspace";
import { WorkspaceLoadError } from "@/components/app/workspace-load-error";
import {
  getCatalogPageData,
  type CatalogTab,
} from "@/lib/server/catalog-service";
import { hasDatabaseUrl } from "@/lib/server/prisma";

export const dynamic = "force-dynamic";

export default async function ProductsPage({
  searchParams,
}: {
  searchParams?: Promise<{ tab?: string | string[] }>;
}) {
  if (!hasDatabaseUrl()) {
    return <DatabaseSetupState title="Product Catalog" />;
  }

  const params = await searchParams;
  const requestedTab =
    typeof params?.tab === "string" ? params.tab : (params?.tab?.[0] ?? "");
  const tab: CatalogTab =
    requestedTab.toLowerCase() === "resellers" ? "resellers" : "vendors";

  let data: Awaited<ReturnType<typeof getCatalogPageData>>;
  try {
    data = await getCatalogPageData(tab);
  } catch {
    return <WorkspaceLoadError title="Product Catalog" />;
  }

  return <ProductCatalogWorkspace data={data} initialTab={tab} />;
}
