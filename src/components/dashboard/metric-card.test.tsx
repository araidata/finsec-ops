import { render, screen } from "@testing-library/react";
import { Landmark } from "lucide-react";
import { describe, expect, it } from "vitest";

import { MetricCard } from "@/components/dashboard/metric-card";

describe("MetricCard", () => {
  it("renders the metric label, value, and supporting context", () => {
    render(
      <MetricCard
        label="Budget Utilization"
        value="$8.4M"
        detail="68% of approved FY plan"
        trend="+4.2% vs last quarter"
        accent="teal"
        icon={Landmark}
      />
    );

    expect(screen.getByText("Budget Utilization")).toBeInTheDocument();
    expect(screen.getByText("$8.4M")).toBeInTheDocument();
    expect(screen.getByText("68% of approved FY plan")).toBeInTheDocument();
  });
});
