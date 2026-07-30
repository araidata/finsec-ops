import { HydrationBoundary } from "@tanstack/react-query";

import { GlobalContextProvider } from "@/components/app/global-context-provider";
import { QueryProvider } from "@/components/query/query-provider";
import { WorkspaceLoadError } from "@/components/app/workspace-load-error";
import { DatabaseSetupState } from "@/components/catalog/database-setup-state";
import { MaintenanceRenewalsWorkspace } from "@/components/renewals/maintenance-renewals-workspace";
import { toClientDto } from "@/lib/client-dto";
import { createMaintenanceRenewalHydrationState } from "@/lib/renewals/maintenance-renewal-query-cache";
import { getMaintenanceRenewalPageData } from "@/lib/server/maintenance-renewal-service";
import { resolveGlobalContext } from "@/lib/server/global-context";
import { hasDatabaseUrl } from "@/lib/server/prisma";

export const dynamic = "force-dynamic";

function firstSearchParam(value: string | string[] | undefined) {
  return typeof value === "string" ? value : value?.[0];
}

function positiveInteger(value: string | string[] | undefined) {
  const parsed = Number(firstSearchParam(value));
  return Number.isInteger(parsed) && parsed > 0 ? parsed : undefined;
}

export default async function MaintenanceRenewalsPage({
  searchParams,
}: {
  searchParams?: Promise<{
    department?: string | string[];
    fy?: string | string[];
    renewal?: string | string[];
    q?: string | string[];
    status?: string | string[];
    owner?: string | string[];
    vendor?: string | string[];
    reseller?: string | string[];
    coop?: string | string[];
    window?: string | string[];
    sort?: string | string[];
    page?: string | string[];
    pageSize?: string | string[];
  }>;
}) {
  if (!hasDatabaseUrl()) {
    return <DatabaseSetupState title="Maintenance Renewals" />;
  }

  let data: Awaited<ReturnType<typeof getMaintenanceRenewalPageData>>;
  let context: Awaited<ReturnType<typeof resolveGlobalContext>>;

  try {
    const params = await searchParams;
    context = await resolveGlobalContext({
      departmentId: firstSearchParam(params?.department),
      fiscalYearId: firstSearchParam(params?.fy),
    });
    const requestedSort = firstSearchParam(params?.sort);
    data = await getMaintenanceRenewalPageData({
      ...context.serviceSelection,
      selectedId: firstSearchParam(params?.renewal),
      search: firstSearchParam(params?.q),
      status: firstSearchParam(params?.status),
      ownerId: firstSearchParam(params?.owner),
      vendorId: firstSearchParam(params?.vendor),
      resellerId: firstSearchParam(params?.reseller),
      coOpAgreement: firstSearchParam(params?.coop),
      windowDays: positiveInteger(params?.window),
      sort:
        requestedSort === "renewalDateDesc" || requestedSort === "updatedAtDesc"
          ? requestedSort
          : "renewalDateAsc",
      page: positiveInteger(params?.page),
      pageSize: positiveInteger(params?.pageSize),
    });
  } catch {
    return <WorkspaceLoadError title="Maintenance Renewals" />;
  }

  const clientData = toClientDto(data);
  const registerQuery = {
    departmentId: data.selection.departmentId ?? undefined,
    fiscalYearId: data.selection.fiscalYearId ?? undefined,
    search: data.query.search,
    status: data.query.status,
    ownerId: data.query.ownerId,
    vendorId: data.query.vendorId,
    resellerId: data.query.resellerId,
    coOpAgreement: data.query.coOpAgreement,
    windowDays: data.query.windowDays,
    sort: data.query.sort,
    page: data.pagination.page,
    pageSize: data.pagination.pageSize,
  };
  const dehydratedState = createMaintenanceRenewalHydrationState(
    registerQuery,
    {
      renewals: clientData.renewals,
      pagination: clientData.pagination,
      query: clientData.query,
    }
  );

  return (
    <GlobalContextProvider
      options={context.options}
      selection={context.selection}
    >
      <QueryProvider>
        <HydrationBoundary state={dehydratedState}>
          <MaintenanceRenewalsWorkspace
            key={[
              data.selectedRenewal?.id ?? "none",
              data.pagination.page,
              data.pagination.pageSize,
              data.query.search,
              data.query.status,
              data.query.ownerId,
              data.query.vendorId,
              data.query.resellerId,
              data.query.coOpAgreement,
              data.query.windowDays ?? "",
              data.query.sort,
            ].join(":")}
            data={clientData}
          />
        </HydrationBoundary>
      </QueryProvider>
    </GlobalContextProvider>
  );
}
