import { DatabaseSetupState } from "@/components/catalog/database-setup-state";
import { SettingsWorkspace } from "@/components/settings/settings-workspace";
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
  } catch (error) {
    return (
      <DatabaseSetupState
        title="Settings"
        detail={error instanceof Error ? error.message : undefined}
      />
    );
  }

  return <SettingsWorkspace data={JSON.parse(JSON.stringify(data))} />;
}
