import { DatabaseSetupState } from "@/components/catalog/database-setup-state";
import { MaintenanceRenewalsWorkspace } from "@/components/renewals/maintenance-renewals-workspace";
import { getMaintenanceRenewalPageData } from "@/lib/server/maintenance-renewal-service";
import { hasDatabaseUrl } from "@/lib/server/prisma";

export const dynamic = "force-dynamic";

export default async function MaintenanceRenewalsPage() {
  if (!hasDatabaseUrl()) {
    return <DatabaseSetupState title="Maintenance Renewals" />;
  }

  let data: Awaited<ReturnType<typeof getMaintenanceRenewalPageData>>;

  try {
    data = await getMaintenanceRenewalPageData();
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
