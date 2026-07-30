import { GlobalContextProvider } from "@/components/app/global-context-provider";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import {
  requireDepartmentAccess,
  requirePermission,
} from "@/lib/server/authorization";
import { getDashboardPageData } from "@/lib/server/dashboard-service";
import { resolveGlobalContext } from "@/lib/server/global-context";

export const dynamic = "force-dynamic";

export default async function Home({
  searchParams,
}: {
  searchParams?: Promise<{
    department?: string | string[];
    fy?: string | string[];
  }>;
}) {
  const params = await searchParams;
  const principal = await requirePermission("dashboard.read");
  const context = await resolveGlobalContext({
    departmentId:
      typeof params?.department === "string"
        ? params.department
        : params?.department?.[0],
    fiscalYearId: typeof params?.fy === "string" ? params.fy : params?.fy?.[0],
  });
  requireDepartmentAccess(principal, context.selection.departmentId);
  const data = await getDashboardPageData(context.serviceSelection);

  return (
    <GlobalContextProvider
      options={context.options}
      selection={context.selection}
    >
      <DashboardShell data={data} />
    </GlobalContextProvider>
  );
}
