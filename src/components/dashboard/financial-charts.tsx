"use client";

import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";

import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { spendCategoryData, forecastTrendData } from "@/lib/dashboard-data";

const forecastChartConfig = {
  actual: {
    label: "Actual",
    color: "#22c7d9",
  },
  forecast: {
    label: "Forecast",
    color: "#3b82f6",
  },
  budget: {
    label: "Budget",
    color: "#94a3b8",
  },
} satisfies ChartConfig;

export function SpendByCategoryChart() {
  return (
    <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
      <div className="flex items-center justify-center">
        <div className="relative flex size-52 items-center justify-center rounded-full bg-[conic-gradient(#22c7d9_0_34%,#3b82f6_34%_57%,#f59e0b_57%_75%,#10b981_75%_89%,#8b5cf6_89%_96%,#64748b_96%_100%)] shadow-[0_0_40px_rgba(34,199,217,0.08)]">
          <div className="absolute inset-8 rounded-full bg-card" />
          <div className="relative text-center">
            <p className="font-mono text-2xl font-semibold text-slate-50">
              $18.2M
            </p>
            <p className="mt-1 text-xs text-muted-foreground">Total Spend</p>
          </div>
        </div>
      </div>
      <div className="flex flex-col justify-center gap-3">
        {spendCategoryData.map((item) => (
          <div
            key={item.category}
            className="grid grid-cols-[auto_1fr_auto_auto] items-center gap-3 text-sm"
          >
            <span
              className="size-2.5 rounded-full"
              style={{ backgroundColor: item.fill }}
            />
            <span className="text-muted-foreground">{item.category}</span>
            <span className="font-mono text-slate-200">${item.spend}M</span>
            <span className="w-10 text-right font-mono text-muted-foreground">
              {item.share}
            </span>
          </div>
        ))}
      </div>
    </div>
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
          dataKey="actual"
          type="monotone"
          stroke="var(--color-actual)"
          strokeWidth={3}
          connectNulls={false}
          dot={{ r: 3 }}
        />
        <Line
          dataKey="forecast"
          type="monotone"
          stroke="var(--color-forecast)"
          strokeWidth={2}
          strokeDasharray="5 5"
          dot={false}
        />
        <Line
          dataKey="budget"
          type="monotone"
          stroke="var(--color-budget)"
          strokeWidth={2}
          strokeDasharray="6 6"
          dot={false}
        />
      </LineChart>
    </ChartContainer>
  );
}
