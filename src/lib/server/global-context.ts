import { cache } from "react";

import {
  normalizeContextSelection,
  toServiceContextSelection,
  type GlobalContextInput,
  type GlobalContextOptions,
  type GlobalContextSelection as NormalizedGlobalContextSelection,
} from "@/lib/global-context";
import { getPrisma, hasDatabaseUrl } from "@/lib/server/prisma";

async function readGlobalContextOptions(): Promise<GlobalContextOptions> {
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
        (department) =>
          department.name.trim().toLowerCase() !== "all departments"
      ),
      fiscalYears,
      defaultFiscalYearId:
        fiscalYears.find(
          (year) => year.id === organization?.currentFiscalYearId
        )?.id ??
        fiscalYears.find((year) => year.isCurrent)?.id ??
        fiscalYears[0]?.id ??
        null,
    };
  } catch {
    return { departments: [], fiscalYears: [], defaultFiscalYearId: null };
  }
}

export const getGlobalContextOptions = cache(readGlobalContextOptions);

export type GlobalContextSelection = GlobalContextInput;

export type ResolvedGlobalContext = {
  options: GlobalContextOptions;
  selection: NormalizedGlobalContextSelection;
  serviceSelection: GlobalContextInput;
};

export async function resolveGlobalContext(
  input: GlobalContextInput
): Promise<ResolvedGlobalContext> {
  const options = await getGlobalContextOptions();
  const selection = normalizeContextSelection(options, input);

  return {
    options,
    selection,
    serviceSelection: toServiceContextSelection(selection),
  };
}
