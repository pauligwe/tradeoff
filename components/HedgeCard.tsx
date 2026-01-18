"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Newspaper } from "lucide-react";
import type { HedgeRecommendation, StockInfo } from "@/app/page";

interface HedgeCardProps {
  recommendation: HedgeRecommendation;
  stockInfo?: Record<string, StockInfo>;
  onBetSelect?: (bet: HedgeRecommendation | null) => void;
}

export function HedgeCard({ recommendation, stockInfo = {}, onBetSelect }: HedgeCardProps) {
  const {
    market,
    marketUrl,
    outcome,
    probability,
    position,
    reasoning,
    suggestedAllocation,
    affectedStocks,
  } = recommendation;

  const stockCount = affectedStocks.length;
  const currentOdds = Math.round(probability * 100);

  const handleNewsClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onBetSelect) {
      onBetSelect(recommendation);
    }
  };

  // Calculate potential payoff
  const entryPrice = position === "YES" ? probability : (1 - probability);
  const maxProfit = suggestedAllocation * ((1 - entryPrice) / entryPrice);
  const maxLoss = suggestedAllocation;

  return (
    <Card className="bg-[#1c2026] border-[#2d3139] hover:border-[#3d4149] transition-colors">
      <CardContent className="p-5 space-y-4">
        {/* Market Title & Probability */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <a
              href={marketUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-white hover:text-[#3fb950] transition-colors font-medium inline-flex items-start gap-1"
            >
              <span className="line-clamp-2">{market}</span>
              <span className="text-[#858687] hover:text-[#3fb950] shrink-0 text-sm">↗</span>
            </a>
          </div>
          <div className="text-right shrink-0">
            <span className="text-2xl font-bold text-white">{currentOdds}%</span>
            <p className="text-xs text-[#858687]">chance</p>
          </div>
        </div>

        {/* Yes/No Buttons - Polymarket Style */}
        <div className="flex gap-2">
          <button
            className={`flex-1 py-2.5 rounded-lg font-semibold text-sm transition-all ${
              position === "YES"
                ? "bg-[rgba(63,185,80,0.2)] text-[#3fb950] border-2 border-[#3fb950]"
                : "bg-[rgba(63,185,80,0.1)] text-[#3fb950] border border-[rgba(63,185,80,0.3)] opacity-50"
            }`}
          >
            Yes {Math.round(probability * 100)}¢
          </button>
          <button
            className={`flex-1 py-2.5 rounded-lg font-semibold text-sm transition-all ${
              position === "NO"
                ? "bg-[rgba(248,81,73,0.2)] text-[#f85149] border-2 border-[#f85149]"
                : "bg-[rgba(248,81,73,0.1)] text-[#f85149] border border-[rgba(248,81,73,0.3)] opacity-50"
            }`}
          >
            No {Math.round((1 - probability) * 100)}¢
          </button>
        </div>

        {/* Payoff Summary */}
        <div className="grid grid-cols-3 gap-3 p-3 bg-[#12161c] rounded-lg">
          <div>
            <p className="text-xs text-[#858687]">Position</p>
            <p className="font-mono font-semibold text-white">${suggestedAllocation}</p>
          </div>
          <div>
            <p className="text-xs text-[#858687]">If Win</p>
            <p className="font-mono font-semibold text-[#3fb950]">+${maxProfit.toFixed(0)}</p>
          </div>
          <div>
            <p className="text-xs text-[#858687]">If Lose</p>
            <p className="font-mono font-semibold text-[#f85149]">-${maxLoss}</p>
          </div>
        </div>

        {/* Affected Stocks */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-[#858687]">Hedges:</span>
          {affectedStocks.map((ticker) => {
            const info = stockInfo[ticker];
            return (
              <div key={ticker} className="group relative">
                <span className="px-2 py-0.5 rounded bg-[#252932] text-[#58a6ff] font-mono text-xs border border-[#2d3139]">
                  {ticker}
                </span>
                {info && (
                  <span className="absolute hidden group-hover:block bottom-full left-0 mb-1 px-2 py-1 bg-[#1c2026] border border-[#2d3139] rounded text-xs whitespace-nowrap z-10 text-white">
                    {info.name}
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {/* Reasoning + News Link */}
        <div className="flex items-end justify-between gap-4 pt-2 border-t border-[#2d3139]">
          <p className="text-sm text-[#858687] flex-1">{reasoning}</p>
          {onBetSelect && (
            <button
              onClick={handleNewsClick}
              className="text-xs text-[#858687] hover:text-[#3fb950] transition-colors flex items-center gap-1 shrink-0"
            >
              <Newspaper className="w-3 h-3" />
              <span>News</span>
            </button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
