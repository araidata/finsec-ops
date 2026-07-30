import { GlobalContextProvider } from "@/components/app/global-context-provider";
import { WorkspaceLoadError } from "@/components/app/workspace-load-error";
import { DatabaseSetupState } from "@/components/catalog/database-setup-state";
import { ContractsManagement } from "@/components/portfolio/contracts-management";
import { toClientDto } from "@/lib/client-dto";
import { getContractPageData } from "@/lib/server/contract-service";
import { resolveGlobalContext } from "@/lib/server/global-context";
import { hasDatabaseUrl } from "@/lib/server/prisma";

export const dynamic = "force-dynamic";

export default async function ContractsPage({
  searchParams,
}: {
  searchParams?: Promise<{
    department?: string | string[];
    fy?: string | string[];
  }>;
}) {
  if (!hasDatabaseUrl()) {
    return <DatabaseSetupState title="Contracts" />;
  }

  let data: Awaited<ReturnType<typeof getContractPageData>>;
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
    data = await getContractPageData(context.serviceSelection);
  } catch {
    return <WorkspaceLoadError title="Contracts" />;
  }

  return (
    <GlobalContextProvider
      options={context.options}
      selection={context.selection}
    >
      <ContractsManagement data={toClientDto(data)} />
    </GlobalContextProvider>
  );
}
