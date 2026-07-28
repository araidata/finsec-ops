import { DatabaseSetupState } from "@/components/catalog/database-setup-state";
import { ContractsManagement } from "@/components/portfolio/contracts-management";
import { getContractPageData } from "@/lib/server/contract-service";
import { hasDatabaseUrl } from "@/lib/server/prisma";

export const dynamic = "force-dynamic";

export default async function ContractsPage({
  searchParams,
}: {
  searchParams?: Promise<{ department?: string | string[]; fy?: string | string[] }>;
}) {
  if (!hasDatabaseUrl()) {
    return <DatabaseSetupState title="Contracts" />;
  }

  let data: Awaited<ReturnType<typeof getContractPageData>>;

  try {
    const params = await searchParams;
    const department = typeof params?.department === "string" ? params.department : params?.department?.[0];
    const fiscalYear = typeof params?.fy === "string" ? params.fy : params?.fy?.[0];
    data = await getContractPageData({
      departmentId: department && department !== "all" ? department : undefined,
      fiscalYearId: fiscalYear && fiscalYear !== "all" ? fiscalYear : undefined,
    });
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
