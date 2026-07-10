import { DatabaseSetupState } from "@/components/catalog/database-setup-state";
import { ProductCatalogWorkspace } from "@/components/catalog/product-catalog-workspace";
import { getCatalogPageData } from "@/lib/server/catalog-service";
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

  let data: Awaited<ReturnType<typeof getCatalogPageData>>;

  try {
    data = await getCatalogPageData();
  } catch (error) {
    return (
      <DatabaseSetupState
        title="Product Catalog"
        detail={error instanceof Error ? error.message : undefined}
      />
    );
  }

  const params = await searchParams;
  const tab =
    typeof params?.tab === "string" ? params.tab : (params?.tab?.[0] ?? "");

  return (
    <ProductCatalogWorkspace
      data={JSON.parse(JSON.stringify(data))}
      initialTab={tab}
    />
  );
}
