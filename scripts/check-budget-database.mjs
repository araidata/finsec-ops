import { config } from "dotenv";
import { BudgetWorksheetType, PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { neonConfig } from "@neondatabase/serverless";
import ws from "ws";

config({ path: ".env.local", quiet: true });
config({ path: ".env", quiet: true });
neonConfig.webSocketConstructor = ws;

const url = process.env.DATABASE_URL || process.env.POSTGRES_PRISMA_URL;
if (!url) {
  console.error("Configure a runtime database URL before checking Budget.");
  process.exit(1);
}
const prisma = new PrismaClient({
  adapter: new PrismaNeon({ connectionString: url }),
});
class BudgetCheckError extends Error {}

try {
  const labels = await prisma.$queryRaw`
    SELECT e.enumlabel::text AS label
    FROM pg_catalog.pg_enum e
    JOIN pg_catalog.pg_type t ON t.oid = e.enumtypid
    JOIN pg_catalog.pg_namespace n ON n.oid = t.typnamespace
    WHERE t.typname = 'BudgetWorksheetType' AND n.nspname = 'public'
  `;
  const missing = Object.values(BudgetWorksheetType).filter(
    (value) => !labels.some(({ label }) => label === value)
  );
  if (missing.length) {
    throw new BudgetCheckError(
      `Budget worksheet enum is missing: ${missing.join(", ")}.`
    );
  }
  // Bounded reads verify mapped columns and relationships, including empty worksheets.
  for (const worksheet of Object.values(BudgetWorksheetType)) {
    await prisma.budgetAnnualFinancial.findMany({
      where: { worksheet },
      take: 1,
      include: {
        account: true,
        budgetItem: true,
        budgetPlan: true,
        scenario: true,
        fiscalYear: true,
      },
    });
  }
  const migrations = await prisma.$queryRaw`
    SELECT migration_name FROM public."_prisma_migrations"
    WHERE migration_name IN (
      '20261015190000_split_travel_conferences_enum',
      '20261015190100_split_travel_conferences_records'
    ) AND finished_at IS NOT NULL AND rolled_back_at IS NULL
  `;
  if (migrations.length !== 2) {
    throw new BudgetCheckError(
      "Budget worksheet split migrations are not both recorded as applied."
    );
  }
  const legacyAccounts = await prisma.budgetAccount.count({
    where: { defaultWorksheet: "TRAVEL_CONFERENCES" },
  });
  const legacyRows = await prisma.budgetAnnualFinancial.count({
    where: { worksheet: "TRAVEL_CONFERENCES" },
  });
  if (legacyAccounts || legacyRows) {
    throw new BudgetCheckError(
      "Legacy combined worksheet records remain; review the Budget backfill."
    );
  }
  console.log(
    "Budget database checks passed: worksheet enums, bounded reads, relations, and split migrations."
  );
} catch (error) {
  // Never print Prisma diagnostics: they can contain connection or financial data.
  console.error(
    error instanceof BudgetCheckError
      ? error.message
      : "Budget database check failed. Review schema compatibility and database connectivity."
  );
  process.exitCode = 1;
} finally {
  await prisma.$disconnect().catch(() => {
    console.error("Budget database connection could not close cleanly.");
    process.exitCode = 1;
  });
}
