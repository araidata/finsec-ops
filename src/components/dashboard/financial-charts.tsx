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
import type { DashboardForecastPoint, DashboardSpendCategory } from "@/lib/server/dashboard-service";

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
  committed: {
    label: "Committed",
    color: "#10b981",
  },
} satisfies ChartConfig;

export function SpendByCategoryChart({ data }: { data: DashboardSpendCategory[] }) {
  return (
    <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
      <div className="flex items-center justify-center">
        <div className="relative flex size-52 items-center justify-center rounded-full bg-[conic-gradient(#22c7d9_0_34%,#3b82f6_34%_57%,#f59e0b_57%_75%,#10b981_75%_89%,#8b5cf6_89%_96%,#64748b_96%_100%)] shadow-[0_0_40px_rgba(34,199,217,0.08)]">
          <div className="absolute inset-8 rounded-full bg-card" />
          <div className="relative text-center">
            <p className="font-mono text-2xl font-semibold text-slate-50">
              {data.reduce((sum, item) => sum + item.spend, 0).toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 })}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">Total Spend</p>
          </div>
        </div>
      </div>
      <div className="flex flex-col justify-center gap-3">
        {data.length ? data.map((item) => (
          <div
            key={item.category}
            className="grid grid-cols-[auto_1fr_auto_auto] items-center gap-3 text-sm"
          >
            <span
              className="size-2.5 rounded-full"
              style={{ backgroundColor: item.fill }}
            />
            <span className="text-muted-foreground">{item.category}</span>
            <span className="font-mono text-slate-200">{item.spend.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 })}</span>
            <span className="w-10 text-right font-mono text-muted-foreground">
              {item.share}
            </span>
          </div>
        )) : <p className="text-sm text-muted-foreground">No financial category data is available for this context.</p>}
      </div>
    </div>
  );
}

export function ForecastTrendChart({ data }: { data: DashboardForecastPoint[] }) {
  return (
    <ChartContainer
      config={forecastChartConfig}
      className="h-[250px] w-full aspect-auto"
    >
      <LineChart accessibilityLayer data={data}>
        <CartesianGrid vertical={false} strokeDasharray="3 3" />
        <XAxis dataKey="fiscalYear" tickLine={false} axisLine={false} />
        <YAxis
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => `$${Number(value).toLocaleString("en-US", { maximumFractionDigits: 0 })}`}
        />
        <ChartTooltip content={<ChartTooltipContent />} />
        <ChartLegend content={<ChartLegendContent />} />
        <Line
          dataKey="committed"
          type="monotone"
          stroke="#10b981"
          strokeWidth={2}
          strokeDasharray="3 3"
          dot={false}
        />
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
