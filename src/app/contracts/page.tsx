import { GlobalContextProvider } from "@/components/app/global-context-provider";
import { unstable_rethrow } from "next/navigation";
import { WorkspaceLoadError } from "@/components/app/workspace-load-error";
import { DatabaseSetupState } from "@/components/catalog/database-setup-state";
import { ContractsManagement } from "@/components/portfolio/contracts-management";
import {
  contractOptionSets,
  getContractPageData,
} from "@/lib/server/contract-service";
import {
  requireDepartmentAccess,
  requirePermission,
} from "@/lib/server/authorization";
import { resolveGlobalContext } from "@/lib/server/global-context";
import { hasDatabaseUrl } from "@/lib/server/prisma";
import type { ContractListFilters, ContractSortKey } from "@/types/contracts";

export const dynamic = "force-dynamic";

export default async function ContractsPage({
  searchParams,
}: {
  searchParams?: Promise<{
    department?: string | string[];
    fy?: string | string[];
    q?: string | string[];
    vendor?: string | string[];
    seller?: string | string[];
    status?: string | string[];
    window?: string | string[];
    sort?: string | string[];
    direction?: string | string[];
    cursor?: string | string[];
    size?: string | string[];
    selected?: string | string[];
  }>;
}) {
  const principal = await requirePermission("contract.read");
  if (!hasDatabaseUrl()) {
    return <DatabaseSetupState title="Contracts" />;
  }

  let data: Awaited<ReturnType<typeof getContractPageData>>;
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
    requireDepartmentAccess(principal, context.selection.departmentId);
    const allowedSorts: ContractSortKey[] = [
      "title",
      "department",
      "vendor",
      "seller",
      "term",
      "annualValue",
      "totalValue",
      "notice",
      "status",
      "owner",
    ];
    const allowedWindows: NonNullable<ContractListFilters["renewalWindow"]>[] =
      ["Past due", "30 days", "60 days", "90 days", "Later"];
    const sort = value("sort");
    const window = value("window");
    const status = value("status");
    const filters: ContractListFilters = {
      search: value("q"),
      vendorCompanyId: value("vendor"),
      sellerCompanyId: value("seller"),
      status: contractOptionSets.contractStatuses.includes(status as never)
        ? status
        : undefined,
      renewalWindow: allowedWindows.includes(window as never)
        ? (window as NonNullable<ContractListFilters["renewalWindow"]>)
        : undefined,
      sortBy: allowedSorts.includes(sort as ContractSortKey)
        ? (sort as ContractSortKey)
        : undefined,
      sortDirection: value("direction") === "desc" ? "desc" : "asc",
      cursor: value("cursor"),
      pageSize: Number(value("size")) || undefined,
    };
    data = await getContractPageData(
      context.serviceSelection,
      filters,
      value("selected")
    );
  } catch (error) {
    unstable_rethrow(error);
    return <WorkspaceLoadError title="Contracts" />;
  }

  return (
    <GlobalContextProvider
      options={context.options}
      selection={context.selection}
    >
      <ContractsManagement data={data} selection={context.serviceSelection} />
    </GlobalContextProvider>
  );
}
