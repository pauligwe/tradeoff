"use client";

import { useState, useEffect } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  ReferenceLine,
} from "recharts";
import type { HedgeRecommendation, StockInfo } from "@/app/page";

interface GreeksViewProps {
  recommendations: HedgeRecommendation[];
  stockInfo?: Record<string, StockInfo>;
  portfolioValue?: number;
}

export function GreeksView({
  recommendations,
  stockInfo = {},
  portfolioValue = 50000,
}: GreeksViewProps) {
  const [selectedIdx, setSelectedIdx] = useState(0);

  // Calculate default shares from the recommendation's suggested allocation
  const getDefaultShares = (rec: HedgeRecommendation): number => {
    const entryPrice = rec.position === "YES" ? rec.probability : 1 - rec.probability;
    if (entryPrice <= 0) return 100;
    return Math.round(rec.suggestedAllocation / entryPrice);
  };

  const [customShares, setCustomShares] = useState(() =>
    recommendations.length > 0 ? getDefaultShares(recommendations[0]) : 100
  );

  // Update shares when selected hedge changes
  useEffect(() => {
    if (recommendations.length > 0 && recommendations[selectedIdx]) {
      setCustomShares(getDefaultShares(recommendations[selectedIdx]));
    }
  }, [selectedIdx, recommendations]);

  // Calculate days to resolution from endDate
  const calculateDaysToResolution = (endDate?: string): number => {
    if (!endDate) return 30;
    try {
      const end = new Date(endDate);
      const now = new Date();
      const diffTime = end.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return Math.max(0, diffDays);
    } catch {
      return 30;
    }
  };

  // Calculate the value of affected stocks for a recommendation
  const getAffectedStocksValue = (rec: HedgeRecommendation): number => {
    return rec.affectedStocks.reduce((sum, ticker) => {
      const info = stockInfo[ticker];
      if (!info) return sum;
      const estimatedValue = portfolioValue / Object.keys(stockInfo).length || 0;
      return sum + estimatedValue;
    }, 0);
  };

  // No recommendations yet
  if (recommendations.length === 0) {
    return (
      <div className="max-w-[1400px] mx-auto px-6 py-8">
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 border border-[#2d3139] bg-[#1c2026] flex items-center justify-center mb-4">
            <span className="text-2xl">📊</span>
          </div>
          <h2 className="text-xl font-semibold mb-2">No Positions to Analyze</h2>
          <p className="text-[#858687] max-w-md">
            Go to the <span className="text-[#3fb950] font-medium">Hedges</span> tab first to find
            Polymarket bets that hedge your stock portfolio.
          </p>
        </div>
      </div>
    );
  }

  const selected = recommendations[selectedIdx];
  const entryPrice = selected.position === "YES" ? selected.probability : 1 - selected.probability;
  const shares = customShares;
  const cost = shares * entryPrice;
  const daysToResolution = calculateDaysToResolution(selected.endDate);

  // Calculate payoffs
  const maxProfit = shares * (1 - entryPrice);
  const maxLoss = cost;
  const breakeven = entryPrice * 100;
  const returnOnWin = (maxProfit / cost) * 100;

  // Calculate value of affected stocks
  const affectedStocksValue = getAffectedStocksValue(selected);
  const hedgeCostPercent = affectedStocksValue > 0 ? (cost / affectedStocksValue) * 100 : 0;
  const potentialOffset = affectedStocksValue > 0 ? (maxProfit / affectedStocksValue) * 100 : 0;
  const affectedStocksList = selected.affectedStocks.join(", ");

  // Generate P&L scenarios
  const scenarios = [
    { prob: 0.0, label: "0%" },
    { prob: 0.25, label: "25%" },
    { prob: 0.5, label: "50%" },
    { prob: 0.75, label: "75%" },
    { prob: 1.0, label: "100%" },
  ];

  const pnlScenarios = scenarios.map((s) => {
    const exitPrice = selected.position === "YES" ? s.prob : 1 - s.prob;
    const pnl = shares * (exitPrice - entryPrice);
    return { ...s, pnl };
  });

  // Calculate summary stats for all recommendations
  const totalHedgeCost = recommendations.reduce((sum, h) => sum + h.suggestedAllocation, 0);
  const totalMaxPayout = recommendations.reduce((sum, h) => {
    const ep = h.position === "YES" ? h.probability : 1 - h.probability;
    return sum + Math.round(h.suggestedAllocation / ep);
  }, 0);

  return (
    <div className="max-w-[1400px] mx-auto px-6 py-8">
      {/* Summary Metrics */}
      <div className="bg-[#1c2026] border border-[#2d3139] p-6 mb-6">
        <h2 className="text-xl font-semibold mb-6">PORTFOLIO SENSITIVITY METRICS</h2>
        <div className="grid grid-cols-4 gap-6">
          <div>
            <div className="text-xs text-[#858687] mb-2">TOTAL HEDGE COST</div>
            <div className="text-3xl font-semibold mono">${totalHedgeCost.toLocaleString()}</div>
            <div className="text-xs text-[#858687] mt-2">{((totalHedgeCost / portfolioValue) * 100).toFixed(1)}% of portfolio</div>
          </div>
          <div>
            <div className="text-xs text-[#858687] mb-2">MAX PAYOUT</div>
            <div className="text-3xl font-semibold mono text-[#3fb950]">${totalMaxPayout.toLocaleString()}</div>
            <div className="text-xs text-[#858687] mt-2">If all hedges pay out</div>
          </div>
          <div>
            <div className="text-xs text-[#858687] mb-2">COST EFFICIENCY</div>
            <div className="text-3xl font-semibold mono">{(totalMaxPayout / totalHedgeCost).toFixed(2)}x</div>
            <div className="text-xs text-[#858687] mt-2">Payout to cost ratio</div>
          </div>
          <div>
            <div className="text-xs text-[#858687] mb-2">POSITIONS</div>
            <div className="text-3xl font-semibold mono">{recommendations.length}</div>
            <div className="text-xs text-[#858687] mt-2">Diversified hedges</div>
          </div>
        </div>
      </div>

      {/* Position Selector */}
      <div className="bg-[#1c2026] border border-[#2d3139] p-6 mb-6">
        <h3 className="font-semibold mb-4">SELECT POSITION TO ANALYZE ({recommendations.length} available)</h3>
        <div className="space-y-2 max-h-[240px] overflow-y-auto pr-2">
          {recommendations.map((rec, idx) => {
            const isSelected = selectedIdx === idx;
            const isYes = rec.position === "YES";
            const selectedBg = isYes ? "border-[#3fb950] bg-[#3fb950]/10" : "border-[#f85149] bg-[#f85149]/10";

            return (
              <button
                key={idx}
                onClick={() => setSelectedIdx(idx)}
                className={`w-full px-4 py-3 text-sm text-left transition-colors border ${
                  isSelected ? selectedBg : "border-[#2d3139] hover:border-[#3d4149]"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium line-clamp-2">{rec.market}</p>
                    <p className="text-xs mt-1 text-[#858687]">
                      Hedges: {rec.affectedStocks.join(", ")}
                    </p>
                  </div>
                  <span className={`shrink-0 px-2 py-1 text-xs font-bold ${
                    isYes ? "border border-[#3fb950] text-[#3fb950]" : "border border-[#f85149] text-[#f85149]"
                  }`}>
                    {rec.position}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Position Details */}
      <div className="bg-[#1c2026] border border-[#2d3139] p-6 mb-6">
        <h3 className="font-semibold mb-4">POSITION DETAILS</h3>
        <div className="flex items-center gap-2 text-sm flex-wrap mb-4">
          <span className="text-[#858687]">Your bet:</span>
          <span className={`px-2 py-1 font-medium ${
            selected.position === "YES" ? "border border-[#3fb950] text-[#3fb950]" : "border border-[#f85149] text-[#f85149]"
          }`}>
            {selected.position} on "{selected.outcome}"
          </span>
          <span className="text-[#858687]">@ {Math.round(entryPrice * 100)}¢ per share</span>
        </div>

        <div className="grid grid-cols-3 gap-4 pt-4 border-t border-[#2d3139]">
          <div>
            <label className="text-xs text-[#858687] block mb-1">SHARES</label>
            <input
              type="number"
              value={customShares}
              onChange={(e) => setCustomShares(parseInt(e.target.value) || 0)}
              className="w-full bg-transparent border border-[#2d3139] px-3 py-2 text-sm mono focus:outline-none focus:border-[#3fb950]"
              min="1"
            />
          </div>
          <div>
            <label className="text-xs text-[#858687] block mb-1">DAYS TO RESOLUTION</label>
            <div className="w-full px-3 py-2 border border-[#2d3139] mono">
              {daysToResolution} {daysToResolution === 1 ? "day" : "days"}
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-[#858687] mb-1">TOTAL COST</p>
            <p className="text-2xl mono font-semibold">${cost.toFixed(2)}</p>
            <p className="text-xs text-[#858687]">{hedgeCostPercent.toFixed(2)}% of portfolio</p>
          </div>
        </div>
      </div>

      {/* Payoff Analysis */}
      <div className="grid grid-cols-2 gap-6 mb-6">
        <div className="bg-[#1c2026] border border-[#2d3139] border-l-2 border-l-[#3fb950] p-6">
          <h3 className="font-semibold mb-4 text-[#3fb950]">IF YOUR PREDICTION IS RIGHT</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-[#858687]">You win:</span>
              <span className="mono font-semibold text-[#3fb950]">+${maxProfit.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#858687]">Return:</span>
              <span className="mono">{returnOnWin.toFixed(0)}%</span>
            </div>
            <div className="flex justify-between items-start">
              <span className="text-[#858687]">Could offset:</span>
              <span className="mono text-right">{potentialOffset.toFixed(1)}% of {affectedStocksList}</span>
            </div>
          </div>
        </div>

        <div className="bg-[#1c2026] border border-[#2d3139] border-l-2 border-l-[#f85149] p-6">
          <h3 className="font-semibold mb-4 text-[#f85149]">IF YOUR PREDICTION IS WRONG</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-[#858687]">You lose:</span>
              <span className="mono font-semibold text-[#f85149]">-${maxLoss.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#858687]">Maximum loss:</span>
              <span className="mono">Your full position</span>
            </div>
            <div className="flex justify-between items-start">
              <span className="text-[#858687]">Of {affectedStocksList}:</span>
              <span className="mono">{hedgeCostPercent.toFixed(2)}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Payoff Curve */}
      <div className="bg-[#1c2026] border border-[#2d3139] p-6 mb-6">
        <h3 className="font-semibold mb-4">PAYOFF CURVE</h3>
        <p className="text-sm text-[#858687] mb-4">Your profit/loss as market probability changes:</p>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={pnlScenarios} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <XAxis
                dataKey="label"
                tick={{ fill: "#858687", fontSize: 12 }}
                axisLine={{ stroke: "#2d3139" }}
                tickLine={{ stroke: "#2d3139" }}
              />
              <YAxis
                tick={{ fill: "#858687", fontSize: 12 }}
                axisLine={{ stroke: "#2d3139" }}
                tickLine={{ stroke: "#2d3139" }}
                tickFormatter={(value) => `$${value}`}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-[#1c2026] border border-[#2d3139] px-3 py-2 text-sm">
                        <p className="font-medium">At {data.label} probability</p>
                        <p className={data.pnl >= 0 ? "text-[#3fb950]" : "text-[#f85149]"}>
                          P&L: {data.pnl >= 0 ? "+" : ""}${data.pnl.toFixed(2)}
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <ReferenceLine y={0} stroke="#2d3139" strokeDasharray="3 3" />
              <Line
                type="monotone"
                dataKey="pnl"
                stroke="#3fb950"
                strokeWidth={2}
                dot={{ fill: "#3fb950", strokeWidth: 0, r: 4 }}
                activeDot={{ fill: "#3fb950", strokeWidth: 0, r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="flex items-center gap-2 mt-4 text-sm">
          <div className="w-3 h-3 bg-[#3fb950]" />
          <span className="text-[#858687]">
            Current: <span className="font-medium">{Math.round(selected.probability * 100)}%</span>
          </span>
        </div>
      </div>

      {/* P&L Scenario Analysis Table */}
      <div className="bg-[#1c2026] border border-[#2d3139] p-6 mb-6">
        <h3 className="font-semibold mb-4">SCENARIO ANALYSIS</h3>
        <p className="text-sm text-[#858687] mb-4">
          P&L at different market probabilities:
        </p>
        <div className="space-y-2">
          {pnlScenarios.map((scenario) => {
            const isCurrentPrice = Math.abs(scenario.prob - selected.probability) < 0.05;
            const maxPnl = Math.max(...pnlScenarios.map((s) => Math.abs(s.pnl)));
            const barWidth = maxPnl > 0 ? (Math.abs(scenario.pnl) / maxPnl) * 100 : 0;

            return (
              <div key={scenario.label} className="flex items-center gap-3">
                <span className={`w-12 text-sm mono ${isCurrentPrice ? "text-[#3fb950] font-bold" : "text-[#858687]"}`}>
                  {scenario.label}
                </span>
                <div className="flex-1 h-7 bg-[#0d1117] border border-[#2d3139] relative overflow-hidden">
                  {scenario.pnl >= 0 ? (
                    <div
                      className="absolute left-1/2 top-0 bottom-0 bg-[rgba(63,185,80,0.3)]"
                      style={{ width: `${barWidth / 2}%` }}
                    />
                  ) : (
                    <div
                      className="absolute right-1/2 top-0 bottom-0 bg-[rgba(248,81,73,0.3)]"
                      style={{ width: `${barWidth / 2}%` }}
                    />
                  )}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className={`text-sm mono font-medium ${scenario.pnl >= 0 ? "text-[#3fb950]" : "text-[#f85149]"}`}>
                      {scenario.pnl >= 0 ? "+" : ""}${scenario.pnl.toFixed(0)}
                    </span>
                  </div>
                </div>
                {isCurrentPrice && (
                  <span className="text-xs text-[#3fb950] w-16">← current</span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Breakeven */}
      <div className="bg-[#1c2026] border border-[#2d3139] p-6">
        <h3 className="font-semibold mb-4">BREAKEVEN POINT</h3>
        <p className="text-[#858687] text-sm mb-4">
          You paid {Math.round(entryPrice * 100)}¢ per share. For you to profit if you sell before resolution,
          the market price needs to be <span className="font-medium">above {breakeven.toFixed(0)}%</span>.
        </p>
        <div className="h-4 bg-[#0d1117] border border-[#2d3139] relative overflow-hidden">
          <div
            className="absolute left-0 top-0 bottom-0 bg-gradient-to-r from-[#f85149] to-[#fb8500]"
            style={{ width: `${breakeven}%` }}
          />
          <div
            className="absolute top-0 bottom-0 bg-gradient-to-r from-[#fb8500] to-[#3fb950]"
            style={{ left: `${breakeven}%`, right: 0 }}
          />
          <div
            className="absolute top-0 bottom-0 w-1 bg-white"
            style={{ left: `${breakeven}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-[#858687] mt-2">
          <span>0% (lose all)</span>
          <span className="font-medium">{breakeven.toFixed(0)}% breakeven</span>
          <span>100% (max win)</span>
        </div>
      </div>
    </div>
  );
}
