import { DatabaseSetupState } from "@/components/catalog/database-setup-state";
import { SettingsWorkspace } from "@/components/settings/settings-workspace";
import { WorkspaceLoadError } from "@/components/app/workspace-load-error";
import { toClientDto } from "@/lib/client-dto";
import { getSettingsPageData } from "@/lib/server/settings-service";
import { hasDatabaseUrl } from "@/lib/server/prisma";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  if (!hasDatabaseUrl()) {
    return <DatabaseSetupState title="Settings" />;
  }

  let data: Awaited<ReturnType<typeof getSettingsPageData>>;

  try {
    data = await getSettingsPageData();
  } catch {
    return <WorkspaceLoadError title="Settings" />;
  }

  return <SettingsWorkspace data={toClientDto(data)} />;
}
