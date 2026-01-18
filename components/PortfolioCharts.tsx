"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis } from "recharts";
import type { PortfolioItem, StockInfo } from "@/app/page";

interface PortfolioChartsProps {
  portfolio: PortfolioItem[];
  stockInfo: Record<string, StockInfo>;
}

// Polymarket-inspired color palette
const COLORS = [
  "#3fb950", // Polymarket green
  "#58a6ff", // Polymarket blue
  "#a371f7", // purple
  "#f0883e", // orange
  "#f778ba", // pink
  "#3fb950", // green
  "#58a6ff", // blue
  "#f85149", // Polymarket red
  "#56d4dd", // cyan
  "#7ee787", // light green
];

export function PortfolioCharts({ portfolio, stockInfo }: PortfolioChartsProps) {
  // Calculate sector breakdown by value
  const sectorData = new Map<string, number>();
  let totalValue = 0;

  for (const item of portfolio) {
    const info = stockInfo[item.ticker];
    const price = info?.price || 0;
    const value = price * item.shares;
    const sector = info?.sector || "Unknown";
    
    totalValue += value;
    sectorData.set(sector, (sectorData.get(sector) || 0) + value);
  }

  const sectorChartData = Array.from(sectorData.entries())
    .map(([name, value]) => ({
      name: name.length > 15 ? name.slice(0, 12) + "..." : name,
      fullName: name,
      value,
      percentage: totalValue > 0 ? (value / totalValue) * 100 : 0,
    }))
    .sort((a, b) => b.value - a.value);

  // Calculate holdings by value (top 8)
  const holdingsData = portfolio
    .map((item) => {
      const info = stockInfo[item.ticker];
      const price = info?.price || 0;
      const value = price * item.shares;
      return {
        ticker: item.ticker,
        value,
        percentage: totalValue > 0 ? (value / totalValue) * 100 : 0,
      };
    })
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);

  if (totalValue === 0) {
    return null;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Sector Breakdown */}
      <div className="bg-[#1c2026] border border-[#2d3139] rounded-xl p-4">
        <h3 className="text-sm font-medium mb-4 text-white">Sector Exposure</h3>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={sectorChartData}
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={70}
                paddingAngle={2}
                dataKey="value"
              >
                {sectorChartData.map((_, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                    stroke="transparent"
                  />
                ))}
              </Pie>
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-[#1c2026] border border-[#2d3139] rounded-lg px-3 py-2 text-sm shadow-lg">
                        <p className="font-medium text-white">{data.fullName}</p>
                        <p className="text-[#858687]">
                          ${data.value.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                          {" "}({data.percentage.toFixed(1)}%)
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        {/* Legend */}
        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
          {sectorChartData.slice(0, 5).map((sector, index) => (
            <div key={sector.name} className="flex items-center gap-1.5 text-xs">
              <div
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: COLORS[index % COLORS.length] }}
              />
              <span className="text-muted-foreground">
                {sector.name} ({sector.percentage.toFixed(0)}%)
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Top Holdings */}
      <div className="bg-[#1c2026] border border-[#2d3139] rounded-xl p-4">
        <h3 className="text-sm font-medium mb-4 text-white">Top Holdings</h3>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={holdingsData}
              layout="vertical"
              margin={{ top: 0, right: 0, bottom: 0, left: 0 }}
            >
              <XAxis type="number" hide />
              <YAxis
                type="category"
                dataKey="ticker"
                width={50}
                tick={{ fill: "#a1a1a1", fontSize: 12, fontFamily: "monospace" }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-[#1c2026] border border-[#2d3139] rounded-lg px-3 py-2 text-sm shadow-lg">
                        <p className="font-mono font-medium text-white">{data.ticker}</p>
                        <p className="text-[#858687]">
                          ${data.value.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                          {" "}({data.percentage.toFixed(1)}%)
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar
                dataKey="percentage"
                fill="#3fb950"
                radius={[0, 4, 4, 0]}
                barSize={16}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
