"use client";

import { Card, CardContent } from "@/components/ui/card";
import type { HedgeRecommendation, StockInfo } from "@/app/page";

interface HedgeCardProps {
  recommendation: HedgeRecommendation;
  stockInfo?: Record<string, StockInfo>;
}

export function HedgeCard({ recommendation, stockInfo = {} }: HedgeCardProps) {
  const {
    market,
    marketUrl,
    probability,
    position,
    reasoning,
    hedgesAgainst,
    suggestedAllocation,
    affectedStocks,
    confidence,
  } = recommendation;

  const stockCount = affectedStocks.length;

  return (
    <Card className="bg-card border-border hover:border-accent/50 transition-colors">
      <CardContent className="p-5 space-y-4">
        {/* Affected Stocks - Prominent at top */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-muted-foreground mr-1">
            Hedges {stockCount} stock{stockCount !== 1 ? "s" : ""}:
          </span>
          {affectedStocks.map((ticker) => {
            const info = stockInfo[ticker];
            return (
              <div key={ticker} className="group relative">
                <span className="px-2 py-1 rounded bg-accent/15 text-accent font-mono font-medium text-sm border border-accent/20">
                  {ticker}
                </span>
                {info && (
                  <span className="absolute hidden group-hover:block bottom-full left-0 mb-1 px-2 py-1 bg-popover border border-border rounded text-xs whitespace-nowrap z-10">
                    {info.name}
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {/* Market Title & Position */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <a
              href={marketUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-foreground hover:text-accent transition-colors font-medium group inline-flex items-start gap-1"
            >
              <span>&ldquo;{market}&rdquo;</span>
              <span className="text-muted-foreground group-hover:text-accent transition-colors shrink-0">
                ↗
              </span>
            </a>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-2xl font-semibold font-mono">
              {Math.round(probability * 100)}%
            </span>
            <span
              className={`px-2 py-1 rounded text-xs font-medium ${
                position === "YES"
                  ? "bg-accent/20 text-accent"
                  : "bg-destructive/20 text-destructive"
              }`}
            >
              Bet {position}
            </span>
          </div>
        </div>

        {/* Confidence Badge */}
        <div className="flex items-center gap-2">
          <span
            className={`text-xs px-2 py-0.5 rounded ${
              confidence === "high"
                ? "bg-green-500/10 text-green-400 border border-green-500/20"
                : "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20"
            }`}
          >
            {confidence === "high" ? "Direct" : "Indirect"} connection
          </span>
          {stockCount >= 3 && (
            <span className="text-xs px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
              Multi-stock hedge
            </span>
          )}
        </div>

        {/* Reasoning */}
        <p className="text-muted-foreground text-sm leading-relaxed">
          {reasoning}
        </p>

        {/* Meta Info */}
        <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm pt-1">
          <div>
            <span className="text-muted-foreground">Risk hedged: </span>
            <span className="text-foreground">{hedgesAgainst}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Suggested bet: </span>
            <span className="text-foreground font-mono">
              ${suggestedAllocation.toLocaleString()}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
