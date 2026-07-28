import { getPrisma, hasDatabaseUrl } from "@/lib/server/prisma";

export const ALL_DEPARTMENTS = "all";
export const ALL_FISCAL_YEARS = "all";

export type GlobalContextOptions = {
  departments: Array<{ id: string; name: string }>;
  fiscalYears: Array<{ id: string; label: string; isCurrent: boolean }>;
  defaultFiscalYearId: string | null;
};

export type GlobalContextSelection = {
  departmentId?: string;
  fiscalYearId?: string;
};

export async function getGlobalContextOptions(): Promise<GlobalContextOptions> {
  if (!hasDatabaseUrl()) {
    return {
      departments: [],
      fiscalYears: [],
      defaultFiscalYearId: null,
    };
  }

  const prisma = getPrisma();
  try {
    const [departments, fiscalYears, organization] = await Promise.all([
      prisma.department.findMany({
      where: { active: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
      prisma.fiscalYear.findMany({
      where: { active: true },
      orderBy: { startsOn: "desc" },
      select: { id: true, label: true, isCurrent: true },
    }),
      prisma.organizationSettings.findFirst({
      orderBy: { createdAt: "asc" },
      select: { currentFiscalYearId: true },
    }),
    ]);

    return {
      departments: departments.filter(
        (department) => department.name.trim().toLowerCase() !== "all departments"
      ),
      fiscalYears,
      defaultFiscalYearId:
        organization?.currentFiscalYearId ??
        fiscalYears.find((year) => year.isCurrent)?.id ??
        fiscalYears[0]?.id ??
        null,
    };
  } catch {
    return { departments: [], fiscalYears: [], defaultFiscalYearId: null };
  }
}

export function normalizeContextSelection(
  options: GlobalContextOptions,
  selection: GlobalContextSelection
) {
  const departmentId =
    selection.departmentId &&
    selection.departmentId !== ALL_DEPARTMENTS &&
    options.departments.some((department) => department.id === selection.departmentId)
      ? selection.departmentId
      : undefined;
  const fiscalYearId =
    selection.fiscalYearId &&
    selection.fiscalYearId !== ALL_FISCAL_YEARS &&
    options.fiscalYears.some((year) => year.id === selection.fiscalYearId)
      ? selection.fiscalYearId
      : undefined;

  return { departmentId, fiscalYearId };
}
