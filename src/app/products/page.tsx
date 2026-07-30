import { DatabaseSetupState } from "@/components/catalog/database-setup-state";
import { ProductCatalogWorkspace } from "@/components/catalog/product-catalog-workspace";
import { WorkspaceLoadError } from "@/components/app/workspace-load-error";
import {
  getCatalogPageData,
  type CatalogPageQuery,
  type CatalogTab,
} from "@/lib/server/catalog-service";
import { requirePermission } from "@/lib/server/authorization";
import { hasDatabaseUrl } from "@/lib/server/prisma";

export const dynamic = "force-dynamic";

export default async function ProductsPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requirePermission("catalog.read");
  if (!hasDatabaseUrl()) {
    return <DatabaseSetupState title="Product Catalog" />;
  }

  const params = await searchParams;
  const requestedTab =
    typeof params?.tab === "string" ? params.tab : (params?.tab?.[0] ?? "");
  const tab: CatalogTab =
    requestedTab.toLowerCase() === "resellers" ? "resellers" : "vendors";
  const first = (value: string | string[] | undefined) =>
    typeof value === "string" ? value : value?.[0];
  const query: CatalogPageQuery = {
    search: first(params?.search),
    status: first(params?.status),
    sort: first(params?.sort),
    page: first(params?.page),
    pageSize: first(params?.pageSize),
    companyId: first(params?.company),
    productId: first(params?.product),
    productPage: first(params?.productPage),
  };

  let data: Awaited<ReturnType<typeof getCatalogPageData>>;
  try {
    data = await getCatalogPageData(tab, query);
  } catch {
    return <WorkspaceLoadError title="Product Catalog" />;
  }

  const workspaceKey = [
    tab,
    data.query.search,
    data.query.status,
    data.query.sort,
    data.query.page,
    data.selectedCompanyId,
    data.query.productPage,
    data.selectedProductId,
  ].join(":");

  return (
    <ProductCatalogWorkspace key={workspaceKey} data={data} initialTab={tab} />
  );
}
