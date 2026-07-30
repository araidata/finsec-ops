import { GlobalContextProvider } from "@/components/app/global-context-provider";
import { WorkspaceLoadError } from "@/components/app/workspace-load-error";
import { DatabaseSetupState } from "@/components/catalog/database-setup-state";
import { MaintenanceRenewalsWorkspace } from "@/components/renewals/maintenance-renewals-workspace";
import { toClientDto } from "@/lib/client-dto";
import { getMaintenanceRenewalPageData } from "@/lib/server/maintenance-renewal-service";
import { resolveGlobalContext } from "@/lib/server/global-context";
import { hasDatabaseUrl } from "@/lib/server/prisma";

export const dynamic = "force-dynamic";

export default async function MaintenanceRenewalsPage({
  searchParams,
}: {
  searchParams?: Promise<{
    department?: string | string[];
    fy?: string | string[];
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
      departmentId:
        typeof params?.department === "string"
          ? params.department
          : params?.department?.[0],
      fiscalYearId:
        typeof params?.fy === "string" ? params.fy : params?.fy?.[0],
    });
    data = await getMaintenanceRenewalPageData(context.serviceSelection);
  } catch {
    return <WorkspaceLoadError title="Maintenance Renewals" />;
  }

  return (
    <GlobalContextProvider
      options={context.options}
      selection={context.selection}
    >
      <MaintenanceRenewalsWorkspace data={toClientDto(data)} />
    </GlobalContextProvider>
  );
}
