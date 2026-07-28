ALTER TABLE "BudgetAccount" ADD COLUMN "departmentId" TEXT;

DROP INDEX "BudgetAccount_code_key";

CREATE UNIQUE INDEX "BudgetAccount_departmentId_code_key"
ON "BudgetAccount"("departmentId", "code");

CREATE UNIQUE INDEX "BudgetAccount_global_code_key"
ON "BudgetAccount"("code") WHERE "departmentId" IS NULL;

CREATE INDEX "BudgetAccount_departmentId_idx"
ON "BudgetAccount"("departmentId");

ALTER TABLE "BudgetAccount"
ADD CONSTRAINT "BudgetAccount_departmentId_fkey"
FOREIGN KEY ("departmentId") REFERENCES "Department"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
