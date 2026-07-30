import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { SpendByCategoryPanel } from "@/components/dashboard/dashboard-chart-panels";

describe("SpendByCategoryPanel", () => {
  it("preserves the top-category default and reveals the full server result", () => {
    const data = Array.from({ length: 7 }, (_, index) => ({
      category: `Category ${index + 1}`,
      spend: (index + 1) * 100,
      share: `${index + 1}%`,
      fill: "#22c7d9",
    }));

    render(<SpendByCategoryPanel data={data} />);

    expect(screen.queryByText("Category 7")).not.toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Spend category view"), {
      target: { value: "all" },
    });
    expect(screen.getByText("Category 7")).toBeVisible();
  });
});
