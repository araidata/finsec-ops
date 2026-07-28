import { DatabaseSetupState } from "@/components/catalog/database-setup-state";
import { DocumentsWorkspace } from "@/components/documents/documents-workspace";
import { getDocumentsPageData } from "@/lib/server/documents-service";
import { hasDatabaseUrl } from "@/lib/server/prisma";

export const dynamic = "force-dynamic";

export default async function DocumentsPage() {
  if (!hasDatabaseUrl())
    return <DatabaseSetupState title="Documents & Audit Trail" />;
  let data: Awaited<ReturnType<typeof getDocumentsPageData>>;
  try {
    data = await getDocumentsPageData();
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
