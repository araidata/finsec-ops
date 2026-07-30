ALTER TABLE "User"
ADD COLUMN "entraSubject" TEXT,
ADD COLUMN "entraTenantId" TEXT,
ADD COLUMN "active" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "User"
ADD CONSTRAINT "User_entra_identity_pair_check"
CHECK (
  ("entraSubject" IS NULL AND "entraTenantId" IS NULL)
  OR
  ("entraSubject" IS NOT NULL AND "entraTenantId" IS NOT NULL)
) NOT VALID;

ALTER TABLE "User"
VALIDATE CONSTRAINT "User_entra_identity_pair_check";

CREATE UNIQUE INDEX "User_entraTenantId_entraSubject_key"
ON "User"("entraTenantId", "entraSubject");

CREATE INDEX "User_active_role_idx"
ON "User"("active", "role");

CREATE TABLE "UserDepartmentAccess" (
  "userId" TEXT NOT NULL,
  "departmentId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "UserDepartmentAccess_pkey"
  PRIMARY KEY ("userId", "departmentId")
);

CREATE INDEX "UserDepartmentAccess_departmentId_idx"
ON "UserDepartmentAccess"("departmentId");

ALTER TABLE "UserDepartmentAccess"
ADD CONSTRAINT "UserDepartmentAccess_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "UserDepartmentAccess"
ADD CONSTRAINT "UserDepartmentAccess_departmentId_fkey"
FOREIGN KEY ("departmentId") REFERENCES "Department"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

CREATE FUNCTION "prevent_user_entra_identity_change"()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF OLD."entraSubject" IS NOT NULL
     AND (
       NEW."entraSubject" IS DISTINCT FROM OLD."entraSubject"
       OR NEW."entraTenantId" IS DISTINCT FROM OLD."entraTenantId"
     )
  THEN
    RAISE EXCEPTION 'An established Entra identity mapping is immutable';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER "User_entra_identity_immutable"
BEFORE UPDATE OF "entraSubject", "entraTenantId" ON "User"
FOR EACH ROW
EXECUTE FUNCTION "prevent_user_entra_identity_change"();
