"use client";

import type { PortfolioItem, StockInfo } from "@/app/page";

interface AnalyticsViewProps {
  portfolio: PortfolioItem[];
  stockInfo: Record<string, StockInfo>;
}

export function AnalyticsView({ portfolio, stockInfo }: AnalyticsViewProps) {
  if (portfolio.length === 0) {
    return (
      <div className="bg-card border border-border rounded-lg p-8 text-center">
        <h2 className="text-lg font-medium mb-2">No Portfolio Data</h2>
        <p className="text-muted-foreground">
          Add stocks to your portfolio in the Hedge Advisor tab to see analytics and news.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* News Section - To be implemented */}
      <section>
        <h2 className="text-lg font-medium mb-4">Latest News</h2>
        <div className="bg-card border border-border rounded-lg p-6">
          <p className="text-muted-foreground text-center py-8">
            News feed coming soon...
          </p>
          
          {/* Placeholder for news cards */}
          <div className="space-y-4 mt-4">
            {portfolio.slice(0, 3).map((item) => {
              const info = stockInfo[item.ticker];
              return (
                <div 
                  key={item.ticker}
                  className="p-4 bg-secondary/30 rounded-lg border border-border"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <span className="px-2 py-1 bg-accent/15 text-accent rounded font-mono text-sm font-medium">
                      {item.ticker}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {info?.name || item.ticker}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    News articles for {item.ticker} will appear here...
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Market Sentiment - To be implemented */}
      <section>
        <h2 className="text-lg font-medium mb-4">Market Sentiment</h2>
        <div className="bg-card border border-border rounded-lg p-6">
          <p className="text-muted-foreground text-center py-8">
            Sentiment analysis coming soon...
          </p>
        </div>
      </section>

      {/* Price Alerts - To be implemented */}
      <section>
        <h2 className="text-lg font-medium mb-4">Price Movements</h2>
        <div className="bg-card border border-border rounded-lg p-6">
          <p className="text-muted-foreground text-center py-8">
            Price tracking coming soon...
          </p>
        </div>
      </section>
    </div>
  );
}
