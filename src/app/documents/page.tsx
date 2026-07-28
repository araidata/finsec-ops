import { DatabaseSetupState } from "@/components/catalog/database-setup-state";
import { DocumentsWorkspace } from "@/components/documents/documents-workspace";
import { getDocumentsPageData } from "@/lib/server/documents-service";
import { hasDatabaseUrl } from "@/lib/server/prisma";

export const dynamic = "force-dynamic";

export default async function DocumentsPage({
  searchParams,
}: {
  searchParams?: Promise<{ department?: string | string[]; fy?: string | string[] }>;
}) {
  if (!hasDatabaseUrl())
    return <DatabaseSetupState title="Documents & Audit Trail" />;
  let data: Awaited<ReturnType<typeof getDocumentsPageData>>;
  try {
    const params = await searchParams;
    const department = typeof params?.department === "string" ? params.department : params?.department?.[0];
    const fiscalYear = typeof params?.fy === "string" ? params.fy : params?.fy?.[0];
    data = await getDocumentsPageData({
      departmentId: department && department !== "all" ? department : undefined,
      fiscalYearId: fiscalYear && fiscalYear !== "all" ? fiscalYear : undefined,
    });
  } catch (error) {
    return (
      <DatabaseSetupState
        title="Documents & Audit Trail"
        detail={error instanceof Error ? error.message : undefined}
      />
    );
  }
  return <DocumentsWorkspace data={JSON.parse(JSON.stringify(data))} />;
}
