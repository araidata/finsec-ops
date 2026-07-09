"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  XAxis,
  YAxis,
} from "recharts";

import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { spendCategoryData, forecastTrendData } from "@/lib/dashboard-data";

const spendChartConfig = {
  spend: {
    label: "Spend",
  },
  cloud: {
    label: "Cloud",
    color: "#22c7d9",
  },
  identity: {
    label: "Identity",
    color: "#14b8a6",
  },
  endpoint: {
    label: "Endpoint",
    color: "#3b82f6",
  },
  data: {
    label: "Data",
    color: "#f59e0b",
  },
  risk: {
    label: "Risk",
    color: "#10b981",
  },
} satisfies ChartConfig;

const forecastChartConfig = {
  planned: {
    label: "Planned",
    color: "#64748b",
  },
  forecast: {
    label: "Forecast",
    color: "#22c7d9",
  },
} satisfies ChartConfig;

export function SpendByCategoryChart() {
  return (
    <ChartContainer
      config={spendChartConfig}
      className="h-[250px] w-full aspect-auto"
    >
      <BarChart accessibilityLayer data={spendCategoryData}>
        <CartesianGrid vertical={false} strokeDasharray="3 3" />
        <XAxis
          dataKey="category"
          tickLine={false}
          axisLine={false}
          tickMargin={10}
          minTickGap={12}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => `$${value}M`}
        />
        <ChartTooltip
          cursor={false}
          content={<ChartTooltipContent hideLabel />}
        />
        <Bar dataKey="spend" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ChartContainer>
  );
}

export function ForecastTrendChart() {
  return (
    <ChartContainer
      config={forecastChartConfig}
      className="h-[250px] w-full aspect-auto"
    >
      <LineChart accessibilityLayer data={forecastTrendData}>
        <CartesianGrid vertical={false} strokeDasharray="3 3" />
        <XAxis dataKey="month" tickLine={false} axisLine={false} />
        <YAxis
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => `$${value}M`}
        />
        <ChartTooltip content={<ChartTooltipContent />} />
        <ChartLegend content={<ChartLegendContent />} />
        <Line
          dataKey="planned"
          type="monotone"
          stroke="var(--color-planned)"
          strokeWidth={2}
          dot={false}
        />
        <Line
          dataKey="forecast"
          type="monotone"
          stroke="var(--color-forecast)"
          strokeWidth={3}
          dot={{ r: 3 }}
        />
      </LineChart>
    </ChartContainer>
  );
}
