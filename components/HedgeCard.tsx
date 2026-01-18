"use client";

import { ExternalLink } from "lucide-react";
import type { HedgeRecommendation, StockInfo } from "@/app/page";

interface HedgeCardProps {
  recommendation: HedgeRecommendation;
  stockInfo?: Record<string, StockInfo>;
  onBetSelect?: (bet: HedgeRecommendation | null) => void;
  portfolioValue?: number;
}

export function HedgeCard({ recommendation, stockInfo = {}, portfolioValue = 50000 }: HedgeCardProps) {
  const {
    market,
    marketUrl,
    probability,
    position,
    reasoning,
    suggestedAllocation,
    affectedStocks,
    hedgesAgainst,
    confidence,
  } = recommendation;

  const currentOdds = Math.round(probability * 100);

  // Calculate potential payoff
  const entryPrice = position === "YES" ? probability : (1 - probability);
  const potentialPayout = suggestedAllocation * (1 / entryPrice);
  const potentialReturn = ((potentialPayout / suggestedAllocation - 1) * 100).toFixed(0);
  const portfolioPercentage = ((suggestedAllocation / portfolioValue) * 100).toFixed(1);

  return (
    <div className="bg-[#1c2026] border border-[#2d3139] p-6">
      {/* Header */}
      <div className="mb-4">
        <div className="flex items-start justify-between mb-3">
          <h3 className="font-semibold text-lg flex-1">{market}</h3>
          <div className={`px-3 py-1 text-xs ml-4 border font-medium ${
            confidence === "high" 
              ? "border-[#3fb950] text-[#3fb950]" 
              : "border-[#fbbf24] text-[#fbbf24]"
          }`}>
            {confidence.toUpperCase()}
          </div>
        </div>
        
        {/* Stats Row */}
        <div className="flex items-center gap-6">
          <div>
            <div className="text-xs text-[#858687] mb-1">CURRENT PROBABILITY</div>
            <div className="text-2xl font-semibold mono">
              {currentOdds}% {position}
            </div>
          </div>
          <div className="h-8 w-[1px] bg-[#2d3139]" />
          <div>
            <div className="text-xs text-[#858687] mb-1">RECOMMENDED POSITION</div>
            <div className={`text-lg font-semibold mono ${position === "YES" ? "text-[#3fb950]" : "text-[#f85149]"}`}>
              BET {position}
            </div>
          </div>
          <div className="h-8 w-[1px] bg-[#2d3139]" />
          <div>
            <div className="text-xs text-[#858687] mb-1">ALLOCATION</div>
            <div className="text-lg font-semibold mono">${suggestedAllocation.toLocaleString()}</div>
            <div className="text-xs text-[#858687] mono">
              {portfolioPercentage}% of portfolio
            </div>
          </div>
          <div className="h-8 w-[1px] bg-[#2d3139]" />
          <div>
            <div className="text-xs text-[#858687] mb-1">POTENTIAL PAYOUT</div>
            <div className="text-lg font-semibold mono text-[#3fb950]">
              ${Math.round(potentialPayout).toLocaleString()}
            </div>
            <div className="text-xs text-[#858687] mono">
              {potentialReturn}% return
            </div>
          </div>
        </div>
      </div>

      {/* Details Box */}
      <div className="bg-[#0d1117] border border-[#2d3139] border-l-2 border-l-[#3fb950] p-4 mb-4">
        <div className="mb-3">
          <div className="text-xs text-[#858687] mb-1">HEDGES AGAINST</div>
          <div className="text-sm font-semibold">{hedgesAgainst}</div>
        </div>
        <div className="mb-3">
          <div className="text-xs text-[#858687] mb-1">AFFECTED STOCKS</div>
          <div className="flex gap-2">
            {affectedStocks.map((ticker) => (
              <span key={ticker} className="mono text-sm bg-[#1c2026] px-2 py-1 border border-[#2d3139]">
                {ticker}
              </span>
            ))}
          </div>
        </div>
        <div>
          <div className="text-xs text-[#858687] mb-1">REASONING</div>
          <div className="text-sm text-[#858687]">{reasoning}</div>
        </div>
      </div>

      {/* Action Button */}
      <a
        href={marketUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 bg-transparent border border-[#3fb950] text-[#3fb950] px-4 py-2 text-sm font-medium hover:bg-[#3fb950] hover:text-white transition-all"
      >
        View on Polymarket
        <ExternalLink size={14} />
      </a>
    </div>
  );
}
