import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  getCurrentPrincipal,
  requirePermission,
} from "@/lib/server/authorization";

vi.mock("react", async (importOriginal) => {
  const original = await importOriginal<typeof import("react")>();
  return {
    ...original,
    cache: <Arguments extends unknown[], Result>(
      callback: (...arguments_: Arguments) => Result
    ) => callback,
  };
});

describe("service authorization", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("uses a local administrator principal because the product has no login", async () => {
    await expect(getCurrentPrincipal()).resolves.toMatchObject({
      userId: "local-unconfigured-identity",
      role: "PLATFORM_ADMIN",
      crossDepartment: true,
    });
    await expect(
      requirePermission({ permission: "catalog.write" })
    ).resolves.toEqual({ actorId: null });
  });

  it("does not enforce Department grants while the product has no login", async () => {
    await expect(
      requirePermission({
        permission: "catalog.write",
        departmentId: "department-1",
      })
    ).resolves.toEqual({ actorId: null });
    await expect(
      requirePermission({
        permission: "catalog.write",
        departmentId: "department-2",
      })
    ).resolves.toEqual({ actorId: null });
  });
});
