import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { getDashboardPageData } from "@/lib/server/dashboard-service";

export const dynamic = "force-dynamic";

export default async function Home({
  searchParams,
}: {
  searchParams?: Promise<{ department?: string | string[]; fy?: string | string[] }>;
}) {
  const params = await searchParams;
  const department = typeof params?.department === "string" ? params.department : params?.department?.[0];
  const fiscalYear = typeof params?.fy === "string" ? params.fy : params?.fy?.[0];
  const data = await getDashboardPageData({
    departmentId: department && department !== "all" ? department : undefined,
    fiscalYearId: fiscalYear && fiscalYear !== "all" ? fiscalYear : undefined,
  });
  return <DashboardShell data={data} />;
}
