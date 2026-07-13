import { DatabaseSetupState } from "@/components/catalog/database-setup-state";
import { ContractsManagement } from "@/components/portfolio/contracts-management";
import { getContractPageData } from "@/lib/server/contract-service";
import { hasDatabaseUrl } from "@/lib/server/prisma";

export const dynamic = "force-dynamic";

export default async function ContractsPage() {
  if (!hasDatabaseUrl()) {
    return <DatabaseSetupState title="Contracts" />;
  }

  let data: Awaited<ReturnType<typeof getContractPageData>>;

  try {
    data = await getContractPageData();
  } catch (error) {
    return (
      <DatabaseSetupState
        title="Contracts"
        detail={error instanceof Error ? error.message : undefined}
      />
    );
  }

  return <ContractsManagement data={JSON.parse(JSON.stringify(data))} />;
}
