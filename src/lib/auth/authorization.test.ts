import { describe, expect, it } from "vitest";

import {
  applicationRole,
  roleHasCrossDepartmentAccess,
  roleHasPermission,
} from "@/lib/auth/authorization";
import {
  isEntraAuthConfigured,
  isNonProductionAuthBypassEnabled,
  safeCallbackPath,
} from "@/lib/auth/config";
import { entraIdentityFromProfile } from "@/lib/auth/entra-profile";

describe("identity configuration", () => {
  it("requires the complete Entra and Auth.js configuration", () => {
    expect(isEntraAuthConfigured({ AUTH_SECRET: "secret" })).toBe(false);
    expect(
      isEntraAuthConfigured({
        AUTH_SECRET: "secret",
        AUTH_MICROSOFT_ENTRA_ID_ID: "client",
        AUTH_MICROSOFT_ENTRA_ID_SECRET: "client-secret",
        AUTH_MICROSOFT_ENTRA_ID_ISSUER:
          "https://login.microsoftonline.com/tenant/v2.0",
        AUTH_MICROSOFT_ENTRA_ID_TENANT_ID: "tenant",
      })
    ).toBe(true);
  });

  it("never enables the local bypass in production", () => {
    expect(
      isNonProductionAuthBypassEnabled({
        FINSEC_AUTH_BYPASS: "true",
        NODE_ENV: "development",
      })
    ).toBe(true);
    expect(
      isNonProductionAuthBypassEnabled({
        FINSEC_AUTH_BYPASS: "true",
        NODE_ENV: "production",
      })
    ).toBe(false);
    expect(
      isNonProductionAuthBypassEnabled({
        APP_ENV: "preview",
        FINSEC_AUTH_BYPASS: "true",
        NODE_ENV: "development",
      })
    ).toBe(false);
  });

  it("accepts only local callback paths", () => {
    expect(safeCallbackPath("/renewals?fy=current")).toBe(
      "/renewals?fy=current"
    );
    expect(safeCallbackPath("https://example.com")).toBe("/");
    expect(safeCallbackPath("//example.com")).toBe("/");
  });
});

describe("Entra identity and application roles", () => {
  it("requires immutable subject and tenant claims", () => {
    expect(entraIdentityFromProfile({ sub: "subject", tid: "tenant" })).toEqual(
      { subject: "subject", tenantId: "tenant" }
    );
    expect(entraIdentityFromProfile({ sub: "subject" })).toBeNull();
    expect(entraIdentityFromProfile({ tid: "tenant" })).toBeNull();
  });

  it("denies unknown roles and preserves scoped role permissions", () => {
    expect(applicationRole("department_viewer")).toBe("DEPARTMENT_VIEWER");
    expect(applicationRole("owner")).toBeNull();
    expect(roleHasPermission("DEPARTMENT_VIEWER", "renewal.read")).toBe(true);
    expect(roleHasPermission("DEPARTMENT_VIEWER", "renewal.edit")).toBe(false);
    expect(roleHasPermission("FINANCE_ADMIN", "budget.approve")).toBe(true);
    expect(roleHasPermission("FINANCE_ADMIN", "settings.edit")).toBe(false);
    expect(roleHasCrossDepartmentAccess("AUDITOR")).toBe(true);
    expect(roleHasCrossDepartmentAccess("DEPARTMENT_EDITOR")).toBe(false);
  });
});
