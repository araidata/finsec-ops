import { GlobalContextProvider } from "@/components/app/global-context-provider";
import { WorkspaceLoadError } from "@/components/app/workspace-load-error";
import { DatabaseSetupState } from "@/components/catalog/database-setup-state";
import { DeploymentWorkspace } from "@/components/deployment/deployment-workspace";
import { toClientDto } from "@/lib/client-dto";
import { getDeploymentPageData } from "@/lib/server/deployment-service";
import { resolveGlobalContext } from "@/lib/server/global-context";
import { hasDatabaseUrl } from "@/lib/server/prisma";

export const dynamic = "force-dynamic";

export default async function DeploymentPage({
  searchParams,
}: {
  searchParams?: Promise<{
    department?: string | string[];
    fy?: string | string[];
  }>;
}) {
  if (!hasDatabaseUrl()) {
    return <DatabaseSetupState title="Deployment" />;
  }

  let data: Awaited<ReturnType<typeof getDeploymentPageData>>;
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
    data = await getDeploymentPageData(context.serviceSelection);
  } catch {
    return <WorkspaceLoadError title="Deployment" />;
  }

  return (
    <GlobalContextProvider
      options={context.options}
      selection={context.selection}
    >
      <DeploymentWorkspace data={toClientDto(data)} />
    </GlobalContextProvider>
  );
}
