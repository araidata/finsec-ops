import { describe, expect, it } from "vitest";

import { buildContextualHref, getAppSearchMatches } from "@/lib/app-search";

describe("app search", () => {
  it("matches workspace aliases for the top header search", () => {
    expect(getAppSearchMatches("vendor")[0]?.label).toBe("Product Catalog");
    expect(getAppSearchMatches("contracts")[0]?.label).toBe("Contracts");
    expect(getAppSearchMatches("audit")[0]?.label).toBe("Documents");
  });

  it("preserves global context when building search result links", () => {
    expect(
      buildContextualHref(
        "/contracts",
        "?department=security&fy=fy-2026&tab=vendors"
      )
    ).toBe("/contracts?department=security&fy=fy-2026");
  });
});
