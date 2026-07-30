import { describe, expect, it } from "vitest";

import {
  documentSortFromState,
  documentSortingState,
  resolveTableUpdater,
} from "@/lib/client/manual-table-state";

describe("manual table state", () => {
  it("maps the supported document URL sorts to controlled table state", () => {
    expect(documentSortingState("uploadedDesc")).toEqual([
      { id: "uploadedAt", desc: true },
    ]);
    expect(documentSortingState("uploadedAsc")).toEqual([
      { id: "uploadedAt", desc: false },
    ]);
    expect(documentSortingState("titleAsc")).toEqual([
      { id: "title", desc: false },
    ]);
  });

  it("maps controlled table state back to supported document URL sorts", () => {
    expect(documentSortFromState([{ id: "title", desc: true }])).toBe(
      "titleAsc"
    );
    expect(documentSortFromState([{ id: "uploadedAt", desc: false }])).toBe(
      "uploadedAsc"
    );
    expect(documentSortFromState([])).toBe("uploadedDesc");
  });

  it("resolves value and functional table updaters", () => {
    expect(resolveTableUpdater(3, 1)).toBe(3);
    expect(resolveTableUpdater((value: number) => value + 1, 1)).toBe(2);
  });
});
