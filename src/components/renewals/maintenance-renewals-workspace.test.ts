import { describe, expect, it } from "vitest";

import {
  moveMaintenanceRenewalColumn,
  normalizeMaintenanceRenewalColumnOrder,
  type ColumnId,
} from "./maintenance-renewals-workspace";

const defaultOrder: ColumnId[] = [
  "vendor",
  "product",
  "reseller",
  "renewalDate",
  "status",
  "owner",
];

describe("maintenance renewal column ordering", () => {
  it("keeps Vendor and Product anchored while moving another column left", () => {
    let order = defaultOrder;

    order = moveMaintenanceRenewalColumn(order, "renewalDate", -1);
    order = moveMaintenanceRenewalColumn(order, "renewalDate", -1);

    expect(order.slice(0, 3)).toEqual(["vendor", "product", "renewalDate"]);
  });

  it("moves an editable column to the far right", () => {
    let order = defaultOrder;

    for (let index = 0; index < 20; index += 1) {
      order = moveMaintenanceRenewalColumn(order, "renewalDate", 1);
    }

    expect(order.at(-1)).toBe("renewalDate");
  });

  it("repairs a stored order without moving the anchored columns", () => {
    const storedOrder: ColumnId[] = [
      "renewalDate",
      "vendor",
      "status",
      "product",
    ];

    const order = normalizeMaintenanceRenewalColumnOrder(storedOrder);

    expect(order.slice(0, 2)).toEqual(["vendor", "product"]);
    expect(order).toContain("comments");
  });
});
