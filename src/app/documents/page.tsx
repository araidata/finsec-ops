import { GlobalContextProvider } from "@/components/app/global-context-provider";
import { WorkspaceLoadError } from "@/components/app/workspace-load-error";
import { DatabaseSetupState } from "@/components/catalog/database-setup-state";
import { DocumentsWorkspace } from "@/components/documents/documents-workspace";
import { toClientDto } from "@/lib/client-dto";
import { getDocumentsPageData } from "@/lib/server/documents-service";
import { resolveGlobalContext } from "@/lib/server/global-context";
import { hasDatabaseUrl } from "@/lib/server/prisma";

export const dynamic = "force-dynamic";

export default async function DocumentsPage({
  searchParams,
}: {
  searchParams?: Promise<{
    department?: string | string[];
    fy?: string | string[];
  }>;
}) {
  if (!hasDatabaseUrl())
    return <DatabaseSetupState title="Documents & Audit Trail" />;
  let data: Awaited<ReturnType<typeof getDocumentsPageData>>;
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
    data = await getDocumentsPageData(context.serviceSelection);
  } catch {
    return <WorkspaceLoadError title="Documents & Audit Trail" />;
  }

  return (
    <GlobalContextProvider
      options={context.options}
      selection={context.selection}
    >
      <DocumentsWorkspace data={toClientDto(data)} />
    </GlobalContextProvider>
  );
}
