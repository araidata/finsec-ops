import { describe, expect, it } from "vitest";

import { requireDisposableTestDatabase } from "@/test/disposable-database";

describe("disposable database guard", () => {
  it("rejects an ordinary database URL without an explicit disposable marker", () => {
    expect(() =>
      requireDisposableTestDatabase({
        DATABASE_URL: "postgresql://example/test",
      })
    ).toThrow(/Refusing database tests/);
  });

  it("accepts TEST_DATABASE_URL and rejects production equality", () => {
    expect(
      requireDisposableTestDatabase({
        TEST_DATABASE_URL: "postgresql://example/disposable",
      })
    ).toBe("postgresql://example/disposable");
    expect(() =>
      requireDisposableTestDatabase({
        TEST_DATABASE_URL: "postgresql://example/prod",
        PRODUCTION_DATABASE_URL: "postgresql://example/prod",
      })
    ).toThrow(/production database/);
  });
});
