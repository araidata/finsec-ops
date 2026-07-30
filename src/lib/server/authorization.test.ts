import { beforeEach, describe, expect, it, vi } from "vitest";

import { auth } from "@/auth";
import {
  AuthorizationError,
  requirePermission,
} from "@/lib/server/authorization";
import { getPrisma } from "@/lib/server/prisma";

vi.mock("@/auth", () => ({
  auth: vi.fn(),
}));

vi.mock("@/lib/server/prisma", () => ({
  getPrisma: vi.fn(),
}));

vi.mock("react", async (importOriginal) => {
  const original = await importOriginal<typeof import("react")>();
  return {
    ...original,
    cache: <Arguments extends unknown[], Result>(
      callback: (...arguments_: Arguments) => Result
    ) => callback,
  };
});

const userFindUnique = vi.fn();

describe("service authorization", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (
      auth as unknown as {
        mockResolvedValue(value: unknown): void;
      }
    ).mockResolvedValue({
      expires: new Date(Date.now() + 60_000).toISOString(),
      user: {
        entraSubject: "subject-1",
        entraTenantId: "tenant-1",
      },
    });
    vi.mocked(getPrisma).mockReturnValue({
      user: { findUnique: userFindUnique },
    } as never);
  });

  it("denies a Department editor when a global write omits Department scope", async () => {
    userFindUnique.mockResolvedValue({
      id: "user-1",
      name: "Editor",
      email: "editor@example.invalid",
      role: "DEPARTMENT_EDITOR",
      active: true,
      departmentAccess: [{ departmentId: "department-1" }],
    });

    await expect(
      requirePermission({ permission: "catalog.write" })
    ).rejects.toBeInstanceOf(AuthorizationError);
  });

  it("permits a Department editor only for a concrete granted Department", async () => {
    userFindUnique.mockResolvedValue({
      id: "user-1",
      name: "Editor",
      email: "editor@example.invalid",
      role: "DEPARTMENT_EDITOR",
      active: true,
      departmentAccess: [{ departmentId: "department-1" }],
    });

    await expect(
      requirePermission({
        permission: "catalog.write",
        departmentId: "department-1",
      })
    ).resolves.toEqual({ actorId: "user-1" });
    await expect(
      requirePermission({
        permission: "catalog.write",
        departmentId: "department-2",
      })
    ).rejects.toBeInstanceOf(AuthorizationError);
  });

  it("permits cross-Department principals to perform global writes", async () => {
    userFindUnique.mockResolvedValue({
      id: "user-1",
      name: "Administrator",
      email: "admin@example.invalid",
      role: "PLATFORM_ADMIN",
      active: true,
      departmentAccess: [],
    });

    await expect(
      requirePermission({ permission: "catalog.write" })
    ).resolves.toEqual({ actorId: "user-1" });
  });
});
