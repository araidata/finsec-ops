import { afterEach, describe, expect, it, vi } from "vitest";

import { logger } from "@/lib/server/logger";

describe("structured logger", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("writes JSON and redacts sensitive keys and connection strings", () => {
    const info = vi.spyOn(console, "info").mockImplementation(() => undefined);

    logger.info("test.event", {
      requestId: "request-12345678",
      databaseUrl: "postgresql://user:secret@private-host/db",
      nested: { authorization: "Bearer private-token" },
    });

    const entry = JSON.parse(String(info.mock.calls[0]?.[0])) as Record<
      string,
      unknown
    >;
    expect(entry.event).toBe("test.event");
    expect(entry.requestId).toBe("request-12345678");
    expect(entry.databaseUrl).toBe("[REDACTED]");
    expect(entry.nested).toEqual({ authorization: "[REDACTED]" });
    expect(JSON.stringify(entry)).not.toContain("private-host");
  });
});
