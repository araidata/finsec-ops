import { DatabaseSetupState } from "@/components/catalog/database-setup-state";
import { DeploymentWorkspace } from "@/components/deployment/deployment-workspace";
import { getDeploymentPageData } from "@/lib/server/deployment-service";
import { hasDatabaseUrl } from "@/lib/server/prisma";

export const dynamic = "force-dynamic";

export default async function DeploymentPage({
  searchParams,
}: {
  searchParams?: Promise<{ department?: string | string[]; fy?: string | string[] }>;
}) {
  if (!hasDatabaseUrl()) {
    return <DatabaseSetupState title="Deployment" />;
  }

  let data: Awaited<ReturnType<typeof getDeploymentPageData>>;

  try {
    const params = await searchParams;
    const department = typeof params?.department === "string" ? params.department : params?.department?.[0];
    const fiscalYear = typeof params?.fy === "string" ? params.fy : params?.fy?.[0];
    data = await getDeploymentPageData({
      departmentId: department && department !== "all" ? department : undefined,
      fiscalYearId: fiscalYear && fiscalYear !== "all" ? fiscalYear : undefined,
    });
  } catch (error) {
    return (
      <DatabaseSetupState
        title="Deployment"
        detail={error instanceof Error ? error.message : undefined}
      />
    );
  }

  return <DeploymentWorkspace data={JSON.parse(JSON.stringify(data))} />;
}
