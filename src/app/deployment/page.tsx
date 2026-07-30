import { GlobalContextProvider } from "@/components/app/global-context-provider";
import { WorkspaceLoadError } from "@/components/app/workspace-load-error";
import { DatabaseSetupState } from "@/components/catalog/database-setup-state";
import { DeploymentWorkspace } from "@/components/deployment/deployment-workspace";
import {
  deploymentOptionSets,
  getDeploymentPageData,
} from "@/lib/server/deployment-service";
import { resolveGlobalContext } from "@/lib/server/global-context";
import { hasDatabaseUrl } from "@/lib/server/prisma";
import type {
  DeploymentListFilters,
  DeploymentSortKey,
} from "@/types/deployment";

export const dynamic = "force-dynamic";

export default async function DeploymentPage({
  searchParams,
}: {
  searchParams?: Promise<{
    department?: string | string[];
    fy?: string | string[];
    q?: string | string[];
    deploymentDepartment?: string | string[];
    owner?: string | string[];
    vendor?: string | string[];
    product?: string | string[];
    status?: string | string[];
    sort?: string | string[];
    direction?: string | string[];
    cursor?: string | string[];
    usageCursor?: string | string[];
    size?: string | string[];
    selected?: string | string[];
  }>;
}) {
  if (!hasDatabaseUrl()) {
    return <DatabaseSetupState title="Deployment" />;
  }

  let data: Awaited<ReturnType<typeof getDeploymentPageData>>;
  let context: Awaited<ReturnType<typeof resolveGlobalContext>>;

  try {
    const params = await searchParams;
    const value = (key: keyof NonNullable<typeof params>) => {
      const raw = params?.[key];
      return typeof raw === "string" ? raw : raw?.[0];
    };
    context = await resolveGlobalContext({
      departmentId: value("department"),
      fiscalYearId: value("fy"),
    });
    const allowedSorts: DeploymentSortKey[] = [
      "updatedAt",
      "scopeName",
      "owner",
      "status",
      "deploymentPercent",
      "utilizationPercent",
    ];
    const sort = value("sort");
    const status = value("status");
    const filters: DeploymentListFilters = {
      search: value("q"),
      departmentId: value("deploymentDepartment"),
      ownerTeamMemberId: value("owner"),
      vendorCompanyId: value("vendor"),
      productId: value("product"),
      status: deploymentOptionSets.deploymentStatuses.includes(status as never)
        ? status
        : undefined,
      sortBy: allowedSorts.includes(sort as DeploymentSortKey)
        ? (sort as DeploymentSortKey)
        : undefined,
      sortDirection: value("direction") === "asc" ? "asc" : "desc",
      cursor: value("cursor"),
      pageSize: Number(value("size")) || undefined,
    };
    data = await getDeploymentPageData(
      context.serviceSelection,
      filters,
      value("selected"),
      value("usageCursor")
    );
  } catch {
    return <WorkspaceLoadError title="Deployment" />;
  }

  return (
    <GlobalContextProvider
      options={context.options}
      selection={context.selection}
    >
      <DeploymentWorkspace key={data.filters.search ?? ""} data={data} />
    </GlobalContextProvider>
  );
}
