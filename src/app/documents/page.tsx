import { GlobalContextProvider } from "@/components/app/global-context-provider";
import { WorkspaceLoadError } from "@/components/app/workspace-load-error";
import { DatabaseSetupState } from "@/components/catalog/database-setup-state";
import { DocumentsWorkspace } from "@/components/documents/documents-workspace";
import { toClientDto } from "@/lib/client-dto";
import { getDocumentsPageData } from "@/lib/server/documents-service";
import { resolveGlobalContext } from "@/lib/server/global-context";
import { hasDatabaseUrl } from "@/lib/server/prisma";

export const dynamic = "force-dynamic";

function first(value: string | string[] | undefined) {
  return typeof value === "string" ? value : value?.[0];
}

function positiveInteger(value: string | string[] | undefined) {
  const parsed = Number(first(value));
  return Number.isInteger(parsed) && parsed > 0 ? parsed : undefined;
}

export default async function DocumentsPage({
  searchParams,
}: {
  searchParams?: Promise<{
    department?: string | string[];
    fy?: string | string[];
    q?: string | string[];
    type?: string | string[];
    entity?: string | string[];
    sort?: string | string[];
    page?: string | string[];
    pageSize?: string | string[];
    tab?: string | string[];
    activityPage?: string | string[];
  }>;
}) {
  if (!hasDatabaseUrl())
    return <DatabaseSetupState title="Documents & Audit Trail" />;
  let data: Awaited<ReturnType<typeof getDocumentsPageData>>;
  let context: Awaited<ReturnType<typeof resolveGlobalContext>>;
  try {
    const params = await searchParams;
    context = await resolveGlobalContext({
      departmentId: first(params?.department),
      fiscalYearId: first(params?.fy),
    });
    const entity = first(params?.entity);
    const sort = first(params?.sort);
    data = await getDocumentsPageData({
      ...context.serviceSelection,
      search: first(params?.q),
      type: first(params?.type),
      entityType:
        entity === "contract" ||
        entity === "maintenanceRenewal" ||
        entity === "company" ||
        entity === "product"
          ? entity
          : "all",
      sort:
        sort === "uploadedAsc" || sort === "titleAsc" ? sort : "uploadedDesc",
      page: positiveInteger(params?.page),
      pageSize: positiveInteger(params?.pageSize),
      activeTab: first(params?.tab) === "audit" ? "audit" : "documents",
      activityPage: positiveInteger(params?.activityPage),
    });
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
