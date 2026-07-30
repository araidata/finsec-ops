import { DatabaseSetupState } from "@/components/catalog/database-setup-state";
import { SettingsWorkspace } from "@/components/settings/settings-workspace";
import { WorkspaceLoadError } from "@/components/app/workspace-load-error";
import { toClientDto } from "@/lib/client-dto";
import {
  getSettingsPageData,
  type SettingsSection,
} from "@/lib/server/settings-service";
import { requirePermission } from "@/lib/server/authorization";
import { hasDatabaseUrl } from "@/lib/server/prisma";

export const dynamic = "force-dynamic";

const sections = new Set<SettingsSection>([
  "organization",
  "fiscal-years",
  "departments",
  "team-members",
  "finance",
  "contract-options",
  "deployment-options",
  "renewal-options",
]);

function first(value: string | string[] | undefined) {
  return typeof value === "string" ? value : value?.[0];
}

function positiveInteger(value: string | string[] | undefined) {
  const parsed = Number(first(value));
  return Number.isInteger(parsed) && parsed > 0 ? parsed : undefined;
}

export default async function SettingsPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requirePermission("settings.read");
  if (!hasDatabaseUrl()) {
    return <DatabaseSetupState title="Settings" />;
  }

  let data: Awaited<ReturnType<typeof getSettingsPageData>>;

  try {
    const params = await searchParams;
    const requestedSection = first(params?.section) as SettingsSection;
    data = await getSettingsPageData({
      section: sections.has(requestedSection)
        ? requestedSection
        : "organization",
      page: positiveInteger(params?.page),
      pageSize: positiveInteger(params?.pageSize),
      accountPage: positiveInteger(params?.accountPage),
      categoryPage: positiveInteger(params?.categoryPage),
    });
  } catch {
    return <WorkspaceLoadError title="Settings" />;
  }

  return <SettingsWorkspace data={toClientDto(data)} />;
}
