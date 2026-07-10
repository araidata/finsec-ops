import { getPrisma, hasDatabaseUrl } from "@/lib/server/prisma";

export type BudgetResellerOption = {
  id: string;
  name: string;
};

export async function getBudgetResellerOptions(): Promise<
  BudgetResellerOption[]
> {
  if (!hasDatabaseUrl()) {
    return [];
  }

  try {
    const prisma = getPrisma();

    return prisma.company.findMany({
      where: {
        active: true,
        roles: { some: { role: "RESELLER" } },
      },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    });
  } catch {
    return [];
  }
}
