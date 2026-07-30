import { describe, expect, it } from "vitest";

import { validateRuntimeEnvironment } from "@/lib/server/environment";

describe("runtime environment validation", () => {
  it("requires isolated production configuration without exposing values", () => {
    const result = validateRuntimeEnvironment({
      APP_ENV: "production",
      DATABASE_URL: "postgresql://private-host/finance",
    });

    expect(result.valid).toBe(false);
    expect(result.issues).toEqual([
      "DATABASE_ENVIRONMENT must be set to production for this deployment tier.",
      "READINESS_TOKEN is required in production.",
    ]);
    expect(JSON.stringify(result)).not.toContain("private-host");
  });

  it("rejects production database reuse by preview", () => {
    const url = "postgresql://private-host/finance";
    const result = validateRuntimeEnvironment({
      APP_ENV: "preview",
      DATABASE_ENVIRONMENT: "preview",
      DATABASE_URL: url,
      PRODUCTION_DATABASE_URL: url,
    });

    expect(result.valid).toBe(false);
    expect(result.issues).toContain(
      "A non-production tier cannot use the production database."
    );
  });

  it("treats an undeclared production Node runtime as production", () => {
    const result = validateRuntimeEnvironment({ NODE_ENV: "production" });

    expect(result.environment).toBe("production");
    expect(result.valid).toBe(false);
    expect(result.issues).toContain("A runtime database URL is required.");
  });
});
