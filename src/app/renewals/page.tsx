import { DatabaseSetupState } from "@/components/catalog/database-setup-state";
import { MaintenanceRenewalsWorkspace } from "@/components/renewals/maintenance-renewals-workspace";
import { getMaintenanceRenewalPageData } from "@/lib/server/maintenance-renewal-service";
import { hasDatabaseUrl } from "@/lib/server/prisma";

export const dynamic = "force-dynamic";

export default async function MaintenanceRenewalsPage({
  searchParams,
}: {
  searchParams?: Promise<{ department?: string | string[]; fy?: string | string[] }>;
}) {
  if (!hasDatabaseUrl()) {
    return <DatabaseSetupState title="Maintenance Renewals" />;
  }

  let data: Awaited<ReturnType<typeof getMaintenanceRenewalPageData>>;

  try {
    const params = await searchParams;
    const department = typeof params?.department === "string" ? params.department : params?.department?.[0];
    const fiscalYear = typeof params?.fy === "string" ? params.fy : params?.fy?.[0];
    data = await getMaintenanceRenewalPageData({
      departmentId: department && department !== "all" ? department : undefined,
      fiscalYearId: fiscalYear && fiscalYear !== "all" ? fiscalYear : undefined,
    });
  } catch (error) {
    return (
      <DatabaseSetupState
        title="Maintenance Renewals"
        detail={error instanceof Error ? error.message : undefined}
      />
    );
  }

  return (
    <MaintenanceRenewalsWorkspace data={JSON.parse(JSON.stringify(data))} />
  );
}
