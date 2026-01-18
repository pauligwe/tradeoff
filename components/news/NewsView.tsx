"use client";

import { useState, useEffect, useCallback } from "react";
import { ExternalLink, Clock } from "lucide-react";
import type { PortfolioItem, StockInfo, HedgeRecommendation } from "@/app/page";
import type { NewsArticle } from "@/app/api/news/route";

interface NewsViewProps {
  portfolio: PortfolioItem[];
  stockInfo: Record<string, StockInfo>;
  selectedBet?: HedgeRecommendation | null;
  onBetSelect?: (bet: HedgeRecommendation | null) => void;
  cachedArticles?: NewsArticle[];
  onArticlesUpdate?: (articles: NewsArticle[]) => void;
  isPreloaded?: boolean;
}

export function NewsView({
  portfolio,
  stockInfo,
  selectedBet,
  onBetSelect,
  cachedArticles = [],
  onArticlesUpdate,
  isPreloaded = false,
}: NewsViewProps) {
  const [articles, setArticles] = useState<NewsArticle[]>(cachedArticles);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedStockFilter, setSelectedStockFilter] = useState<string>("all");

  const fetchNews = useCallback(async () => {
    if (portfolio.length === 0) return;

    setIsLoading(true);
    setError(null);

    try {
      const requestBody = {
        portfolio,
        betMarket: selectedBet?.market,
      };

      const response = await fetch("/api/news", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to fetch news");
      }

      const data = await response.json();
      const newArticles = data.articles || [];

      setArticles(newArticles);
      if (onArticlesUpdate && !selectedBet) {
        onArticlesUpdate(newArticles);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  }, [portfolio, selectedBet, onArticlesUpdate]);

  // Update articles when cached articles change
  useEffect(() => {
    if (cachedArticles.length > 0 && !selectedBet) {
      setArticles(cachedArticles);
    }
  }, [cachedArticles, selectedBet]);

  // Fetch news when portfolio or selectedBet changes
  useEffect(() => {
    if (portfolio.length === 0) {
      setArticles([]);
      return;
    }

    if (selectedBet) {
      fetchNews();
      return;
    }

    if (isPreloaded && cachedArticles.length > 0) {
      setArticles(cachedArticles);
      return;
    }

    if (cachedArticles.length > 0 && !selectedBet) {
      setArticles(cachedArticles);
      return;
    }

    if (!isPreloaded) {
      fetchNews();
    }
  }, [portfolio.length, selectedBet?.market, isPreloaded]);

  // Get unique stocks from articles for filtering - only show stocks that have articles
  const stocksWithArticles = new Set<string>();
  for (const article of articles) {
    for (const ticker of article.relatedStocks) {
      if (portfolio.some((p) => p.ticker === ticker)) {
        stocksWithArticles.add(ticker);
      }
    }
  }
  
  // Build filter list: "all" + only stocks that have articles
  const stockFilters = ["all", ...Array.from(stocksWithArticles).sort()];

  const filteredArticles = articles.filter((article) => {
    if (selectedStockFilter === "all") return true;
    return article.relatedStocks.includes(selectedStockFilter);
  });
  
  // Reset filter if selected stock no longer has articles
  useEffect(() => {
    if (selectedStockFilter !== "all" && !stocksWithArticles.has(selectedStockFilter)) {
      setSelectedStockFilter("all");
    }
  }, [articles, selectedStockFilter]);

  if (portfolio.length === 0) {
    return (
      <div className="max-w-[1400px] mx-auto px-6 py-8">
        <div className="bg-[#1c2026] border border-[#2d3139] p-12 text-center">
          <h2 className="font-semibold mb-2">No Portfolio Data</h2>
          <p className="text-[#858687]">
            Add stocks to your portfolio to see relevant news.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1400px] mx-auto px-6 py-8">
      {/* Filter Header */}
      <div className="bg-[#1c2026] border border-[#2d3139] p-6 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm text-[#858687] mb-2">STOCK FILTER</h2>
            <div className="flex gap-2 flex-wrap">
              {stockFilters.map((filter) => (
                <button
                  key={filter}
                  onClick={() => setSelectedStockFilter(filter)}
                  className={`px-3 py-2 text-sm font-medium border transition-all ${
                    selectedStockFilter === filter
                      ? "text-[#3fb950] border-[#3fb950] bg-transparent"
                      : "bg-transparent text-[#858687] border-[#2d3139] hover:text-white hover:border-[#3fb950]"
                  }`}
                >
                  {filter === "all" ? "All Stocks" : filter}
                </button>
              ))}
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-[#858687] mb-1">ARTICLES</div>
            <div className="text-2xl font-semibold mono">{filteredArticles.length}</div>
          </div>
        </div>
      </div>

      {/* Selected Bet Context */}
      {selectedBet && (
        <div className="bg-[#1c2026] border border-[#2d3139] border-l-2 border-l-[#3fb950] p-6 mb-6">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-xs text-[#858687] mb-1">SELECTED MARKET</div>
              <div className="text-lg font-semibold mb-2">{selectedBet.market}</div>
              <div className="text-sm text-[#858687]">{selectedBet.reasoning}</div>
            </div>
            <div className="flex gap-2">
              <a
                href={selectedBet.marketUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-transparent border border-[#3fb950] text-[#3fb950] px-4 py-2 text-sm font-medium hover:bg-[#3fb950] hover:text-white transition-all"
              >
                View Market
                <ExternalLink size={14} />
              </a>
              <button
                onClick={() => onBetSelect && onBetSelect(null)}
                className="px-4 py-2 text-sm border border-[#2d3139] text-[#858687] hover:text-white hover:border-[#3d4149] transition-colors"
              >
                Show All
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-[#1c2026] border border-[#f85149] border-l-2 p-4 mb-6">
          <p className="text-sm text-[#f85149]">{error}</p>
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="w-8 h-8 border-2 border-[#3fb950] border-t-transparent animate-spin mb-4" />
          <p className="text-[#858687]">Fetching news articles...</p>
        </div>
      )}

      {/* No Articles */}
      {!isLoading && filteredArticles.length === 0 && !error && (
        <div className="bg-[#1c2026] border border-[#2d3139] p-12 text-center">
          <div className="text-[#858687] mb-2">No articles found</div>
          <div className="text-sm text-[#858687]">Try selecting a different stock filter</div>
        </div>
      )}

      {/* Articles List */}
      {!isLoading && filteredArticles.length > 0 && (
        <div className="space-y-4">
          {filteredArticles.map((article, index) => (
            <div key={index} className="bg-[#1c2026] border border-[#2d3139] p-6">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold">{article.source}</span>
                  <span className="text-[#858687]">|</span>
                  <div className="flex items-center gap-1 text-[#858687] text-sm">
                    <Clock size={14} />
                    <span>{article.publishedAt}</span>
                  </div>
                </div>
                {article.relatedStocks.length > 0 && (
                  <div className="flex gap-2">
                    {article.relatedStocks.slice(0, 3).map((ticker) => (
                      <span key={ticker} className="bg-[#0d1117] px-2 py-1 border border-[#2d3139] text-xs mono">
                        {ticker}
                      </span>
                    ))}
                    {article.relatedStocks.length > 3 && (
                      <span className="text-xs text-[#858687]">+{article.relatedStocks.length - 3}</span>
                    )}
                  </div>
                )}
              </div>

              <h3 className="text-lg font-semibold mb-4">{article.title}</h3>

              <div className="bg-[#0d1117] border border-[#2d3139] border-l-2 border-l-[#858687] p-4 mb-4">
                <div className="text-xs text-[#858687] mb-2">RELEVANCE</div>
                <p className="text-sm text-[#858687] leading-relaxed">{article.relevance}</p>
              </div>

              {article.url && (
                <a
                  href={article.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-[#3fb950] text-sm font-medium hover:underline"
                >
                  Read Full Article
                  <ExternalLink size={14} />
                </a>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Refresh Button */}
      {!isLoading && (
        <div className="mt-6 flex justify-center">
          <button
            onClick={fetchNews}
            className="px-6 py-2 border border-[#2d3139] text-[#858687] hover:text-white hover:border-[#3fb950] transition-colors"
          >
            Refresh News
          </button>
        </div>
      )}
    </div>
  );
}
