import { DatabaseSetupState } from "@/components/catalog/database-setup-state";
import { DeploymentWorkspace } from "@/components/deployment/deployment-workspace";
import { getDeploymentPageData } from "@/lib/server/deployment-service";
import { hasDatabaseUrl } from "@/lib/server/prisma";

export const dynamic = "force-dynamic";

export default async function DeploymentPage() {
  if (!hasDatabaseUrl()) {
    return <DatabaseSetupState title="Deployment" />;
  }

  let data: Awaited<ReturnType<typeof getDeploymentPageData>>;

  try {
    data = await getDeploymentPageData();
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
