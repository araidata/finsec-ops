import { describe, expect, it } from "vitest";

import { GET } from "@/app/api/health/route";

describe("health route", () => {
  it("returns dependency-free liveness with a correlation header", async () => {
    const response = GET(
      new Request("http://localhost/api/health", {
        headers: { "x-request-id": "request-12345678" },
      })
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("x-request-id")).toBe("request-12345678");
    expect(response.headers.get("cache-control")).toBe("no-store");
    await expect(response.json()).resolves.toEqual(
      expect.objectContaining({ status: "ok" })
    );
  });
});
