import { beforeEach, describe, expect, it, vi } from "vitest";

import { GET } from "@/app/api/ready/route";

const queryRaw = vi.hoisted(() => vi.fn());

vi.mock("@/lib/server/prisma", () => ({
  getPrisma: () => ({ $queryRaw: queryRaw }),
}));

vi.mock("@/lib/server/environment", () => ({
  validateRuntimeEnvironment: () => ({
    environment: "test",
    databaseConfigured: true,
    revision: "test-revision",
    valid: true,
    issues: [],
  }),
}));

describe("readiness route", () => {
  beforeEach(() => {
    queryRaw.mockReset();
  });

  it("returns ready after a bounded database probe", async () => {
    queryRaw.mockResolvedValue([{ "?column?": 1 }]);

    const response = await GET(
      new Request("http://localhost/api/ready", {
        headers: { "x-request-id": "request-12345678" },
      })
    );

    expect(queryRaw).toHaveBeenCalledOnce();
    expect(response.status).toBe(200);
    expect(response.headers.get("x-request-id")).toBe("request-12345678");
    await expect(response.json()).resolves.toEqual({
      status: "ready",
      environment: "test",
      revision: "test-revision",
    });
  });
});
