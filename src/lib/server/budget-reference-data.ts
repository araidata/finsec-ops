import { unstable_cache } from "next/cache";

import { getPrisma, hasDatabaseUrl } from "@/lib/server/prisma";

export type BudgetResellerOption = {
  id: string;
  name: string;
};

const readBudgetResellerOptions = unstable_cache(
  async (): Promise<BudgetResellerOption[]> => {
    const prisma = getPrisma();
    return prisma.company.findMany({
      where: {
        active: true,
        roles: { some: { role: "RESELLER" } },
      },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    });
  },
  ["budget-reseller-options"],
  { revalidate: 300, tags: ["reference:companies"] }
);

export async function getBudgetResellerOptions(): Promise<
  BudgetResellerOption[]
> {
  if (!hasDatabaseUrl()) {
    return [];
  }

  try {
    return await readBudgetResellerOptions();
  } catch {
    return [];
  }
}
