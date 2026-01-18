"use client";

import { useState, useEffect, useRef } from "react";
import { AlertTriangle, TrendingDown } from "lucide-react";
import type { PortfolioItem, StockInfo, HedgeRecommendation } from "@/app/page";
import type { RiskAlert } from "@/lib/risk-factors";

interface BenchmarkComparison {
  metric: string;
  yourValue: string;
  typical: string;
  assessment: "better" | "worse" | "similar";
}

interface PortfolioStats {
  totalValue: number;
  holdingCount: number;
  sectorWeights: Record<string, number>;
  largestPosition: { ticker: string; weight: number };
}

interface WoodWideAnalysis {
  enabled: boolean;
  insights: Array<{
    type: string;
    title: string;
    description: string;
    severity: string;
    details: Record<string, unknown>;
    recommendation?: string;
  }>;
  portfolioClassification?: {
    profile: "conservative" | "moderate" | "aggressive" | "speculative";
    confidence: number;
    similarTo: string[];
    warnings: string[];
  };
  anomalies?: {
    ticker: string;
    score: number;
    isAnomaly: boolean;
    reason?: string;
  }[];
  riskScore?: number;
  error?: string;
}

interface RiskAnalysisResult {
  summary: string;
  alerts: RiskAlert[];
  portfolioStats: PortfolioStats;
  benchmarkComparison: BenchmarkComparison[];
  woodWideAnalysis?: WoodWideAnalysis;
  analysisTimestamp: string;
}

interface RiskViewProps {
  portfolio: PortfolioItem[];
  stockInfo: Record<string, StockInfo>;
  hedges?: HedgeRecommendation[];
  onGoToHedges?: () => void;
  preloadedResult?: RiskAnalysisResult | null;
}

export function RiskView({
  portfolio,
  stockInfo,
  hedges = [],
  onGoToHedges,
  preloadedResult,
}: RiskViewProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<RiskAnalysisResult | null>(
    preloadedResult || null
  );
  const hasAutoAnalyzed = useRef(false);

  const handleAnalyze = async () => {
    if (portfolio.length === 0) return;

    setIsAnalyzing(true);
    setError(null);

    try {
      const response = await fetch("/api/risk-analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ portfolio }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Risk analysis failed");
      }

      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Update result when preloaded result changes
  useEffect(() => {
    if (preloadedResult) {
      setResult(preloadedResult);
      hasAutoAnalyzed.current = true;
    }
  }, [preloadedResult]);

  // Auto-analyze when entering tab with portfolio but no results
  useEffect(() => {
    if (
      portfolio.length > 0 &&
      !result &&
      !isAnalyzing &&
      !hasAutoAnalyzed.current &&
      !preloadedResult
    ) {
      hasAutoAnalyzed.current = true;
      handleAnalyze();
    }
  }, [portfolio.length, result, isAnalyzing, preloadedResult]);

  // Reset when portfolio changes
  useEffect(() => {
    if (result && portfolio.length > 0) {
      const currentTickers = new Set(portfolio.map((p) => p.ticker));
      const analyzedCount = result.portfolioStats.holdingCount;

      if (currentTickers.size !== analyzedCount) {
        hasAutoAnalyzed.current = false;
        setResult(null);
      }
    }
  }, [portfolio, result]);

  // No portfolio state
  if (portfolio.length === 0) {
    return (
      <div className="max-w-[1400px] mx-auto px-6 py-8">
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 border border-[#2d3139] bg-[#1c2026] flex items-center justify-center mb-4">
            <AlertTriangle className="w-8 h-8 text-[#858687]" />
          </div>
          <h2 className="text-xl font-semibold mb-2">No Portfolio Yet</h2>
          <p className="text-[#858687] max-w-md mb-6">
            Add stocks to your portfolio first, then come back here for a comprehensive risk analysis.
          </p>
          <p className="text-sm text-[#858687]">
            Go to the <span className="text-[#3fb950] font-medium">Portfolio</span> tab to get started.
          </p>
        </div>
      </div>
    );
  }

  const totalValue = portfolio.reduce((sum, p) => {
    const info = stockInfo[p.ticker];
    return sum + (info?.price || 0) * p.shares;
  }, 0);

  // Count alerts by severity
  const alertCounts = result
    ? {
        critical: result.alerts.filter((a) => a.severity === "critical").length,
        high: result.alerts.filter((a) => a.severity === "high").length,
        medium: result.alerts.filter((a) => a.severity === "medium").length,
        low: result.alerts.filter((a) => a.severity === "low").length,
      }
    : { critical: 0, high: 0, medium: 0, low: 0 };

  // Get risk score color
  const getRiskScoreColor = (score: number) => {
    if (score > 70) return "text-[#f85149]";
    if (score > 50) return "text-[#fb8500]";
    if (score > 30) return "text-[#fbbf24]";
    return "text-[#3fb950]";
  };

  // Get classification color
  const getClassificationColor = (profile: string) => {
    switch (profile) {
      case "speculative":
        return { bg: "border-[#f85149]", text: "text-[#f85149]" };
      case "aggressive":
        return { bg: "border-[#fb8500]", text: "text-[#fb8500]" };
      case "moderate":
        return { bg: "border-[#fbbf24]", text: "text-[#fbbf24]" };
      default:
        return { bg: "border-[#3fb950]", text: "text-[#3fb950]" };
    }
  };

  return (
    <div className="max-w-[1400px] mx-auto px-6 py-8">
      {/* Risk Score Header */}
      {result && !isAnalyzing && (
        <div className="bg-[#1c2026] border border-[#2d3139] p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm text-[#858687] mb-2">RISK SCORE</h2>
              <div className="flex items-baseline gap-3">
                <span className={`text-5xl font-semibold mono ${getRiskScoreColor(result.woodWideAnalysis?.riskScore || 50)}`}>
                  {result.woodWideAnalysis?.riskScore || 50}
                </span>
                <span className="text-2xl text-[#858687] mono">/100</span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-[#858687] mb-2">POWERED BY</div>
              <div className="text-sm font-semibold">Wood Wide AI</div>
            </div>
          </div>
          <div className="flex gap-3">
            {alertCounts.critical > 0 && (
              <div className="px-3 py-1 text-xs border border-[#f85149] text-[#f85149]">
                CRITICAL: {alertCounts.critical}
              </div>
            )}
            {alertCounts.high > 0 && (
              <div className="px-3 py-1 text-xs border border-[#fb8500] text-[#fb8500]">
                HIGH: {alertCounts.high}
              </div>
            )}
            {alertCounts.medium > 0 && (
              <div className="px-3 py-1 text-xs border border-[#fbbf24] text-[#fbbf24]">
                MEDIUM: {alertCounts.medium}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Portfolio Classification */}
      {result?.woodWideAnalysis?.portfolioClassification && (
        <div className={`bg-[#1c2026] border border-l-[3px] ${getClassificationColor(result.woodWideAnalysis.portfolioClassification.profile).bg} p-6 mb-6`}>
          <div className="flex items-start gap-3 mb-3">
            <AlertTriangle className={`w-6 h-6 mt-1 ${getClassificationColor(result.woodWideAnalysis.portfolioClassification.profile).text}`} />
            <div className="flex-1">
              <h3 className="font-semibold text-lg mb-1">
                Portfolio Classification: {result.woodWideAnalysis.portfolioClassification.profile.toUpperCase()}
              </h3>
              <div className="text-sm text-[#858687] mono">
                {result.woodWideAnalysis.portfolioClassification.confidence}% confidence
              </div>
            </div>
          </div>
          {result.woodWideAnalysis.portfolioClassification.similarTo.length > 0 && (
            <div className="text-sm text-[#858687]">
              Similar to:{" "}
              {result.woodWideAnalysis.portfolioClassification.similarTo.map((s, i) => (
                <span key={s} className="mono">
                  {s.replace(/_/g, " ")}{i < result.woodWideAnalysis!.portfolioClassification!.similarTo.length - 1 ? ", " : ""}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-[#1c2026] border border-[#f85149] border-l-2 p-4 mb-6">
          <p className="text-sm text-[#f85149]">{error}</p>
          <button
            onClick={handleAnalyze}
            className="mt-2 text-sm text-[#858687] hover:text-white transition-colors"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Loading */}
      {isAnalyzing && (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="w-8 h-8 border-2 border-[#3fb950] border-t-transparent animate-spin mb-4" />
          <p className="text-[#858687]">Analyzing portfolio risks...</p>
          <p className="text-sm text-[#858687] mt-1">
            Running Wood Wide AI analysis on {portfolio.length} stocks
          </p>
        </div>
      )}

      {result && !isAnalyzing && (
        <>
          {/* Stats Grid */}
          <div className="grid grid-cols-4 gap-6 mb-6">
            {result.benchmarkComparison.slice(0, 4).map((comp) => (
              <div key={comp.metric} className="bg-[#1c2026] border border-[#2d3139] p-6">
                <div className="text-xs text-[#858687] mb-2">{comp.metric.toUpperCase()}</div>
                <div className="text-2xl font-semibold mono mb-1">{comp.yourValue}</div>
                <div className="text-sm text-[#858687]">Typical: {comp.typical}</div>
                <div className={`flex items-center gap-1 text-xs mt-2 ${
                  comp.assessment === "worse" ? "text-[#f85149]" : 
                  comp.assessment === "better" ? "text-[#3fb950]" : "text-[#fbbf24]"
                }`}>
                  <TrendingDown size={12} className={comp.assessment === "better" ? "rotate-180" : ""} />
                  <span>
                    {comp.assessment === "worse" ? "Below average" : 
                     comp.assessment === "better" ? "Above average" : "Average"}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Risk Alerts */}
          {result.alerts.length > 0 && (
            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-4">RISK ALERTS</h2>
              <div className="space-y-4">
                {result.alerts.map((alert, index) => {
                  const severityColor = 
                    alert.severity === "critical" ? "border-l-[#f85149]" :
                    alert.severity === "high" ? "border-l-[#fb8500]" :
                    alert.severity === "medium" ? "border-l-[#fbbf24]" : "border-l-[#3fb950]";
                  
                  const badgeColor = 
                    alert.severity === "critical" ? "bg-[#f85149]" :
                    alert.severity === "high" ? "bg-[#fb8500]" :
                    alert.severity === "medium" ? "bg-[#fbbf24] text-black" : "bg-[#3fb950]";

                  return (
                    <div
                      key={index}
                      className={`bg-[#1c2026] border border-[#2d3139] border-l-2 ${severityColor} p-6`}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-start gap-3">
                          <div className={`${badgeColor} px-2 py-1 text-xs text-white`}>
                            {alert.severity.toUpperCase()}
                          </div>
                          <h3 className="font-semibold">{alert.riskFactor.name}</h3>
                        </div>
                        <div className="text-sm mono text-[#858687]">
                          Exposure: {alert.exposurePercent.toFixed(1)}%
                        </div>
                      </div>
                      <div className="mb-3">
                        <div className="text-xs text-[#858687] mb-1">AFFECTED HOLDINGS</div>
                        <div className="flex gap-2">
                          {alert.affectedTickers.map((ticker) => (
                            <span key={ticker} className="mono text-sm bg-[#0d1117] px-2 py-1 border border-[#2d3139]">
                              {ticker}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-[#858687] mb-1">RISK DESCRIPTION</div>
                        <div className="text-sm text-[#858687]">{alert.riskFactor.description}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Risk Factors Summary */}
          <div className="bg-[#1c2026] border border-[#2d3139] p-6">
            <h3 className="font-semibold mb-4">Risk Factors by Category</h3>
            <div className="space-y-4">
              {[
                { category: "Concentration Risk", score: result.portfolioStats.largestPosition.weight, color: result.portfolioStats.largestPosition.weight > 50 ? "#f85149" : result.portfolioStats.largestPosition.weight > 30 ? "#fb8500" : "#3fb950" },
                { category: "Sector Risk", score: Math.max(...Object.values(result.portfolioStats.sectorWeights)), color: Math.max(...Object.values(result.portfolioStats.sectorWeights)) > 70 ? "#f85149" : Math.max(...Object.values(result.portfolioStats.sectorWeights)) > 50 ? "#fb8500" : "#3fb950" },
                { category: "Diversification", score: Math.min(result.portfolioStats.holdingCount * 10, 100), color: result.portfolioStats.holdingCount < 5 ? "#f85149" : result.portfolioStats.holdingCount < 10 ? "#fbbf24" : "#3fb950" },
              ].map((risk) => (
                <div key={risk.category}>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm">{risk.category}</span>
                    <span className="text-sm mono">{Math.round(risk.score)}/100</span>
                  </div>
                  <div className="h-2 bg-[#0d1117] border border-[#2d3139]">
                    <div
                      className="h-full"
                      style={{
                        width: `${Math.min(risk.score, 100)}%`,
                        backgroundColor: risk.color,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* CTA to Hedges */}
          {result.alerts.length > 0 && onGoToHedges && (
            <div className="mt-6 flex justify-center">
              <button
                onClick={onGoToHedges}
                className="bg-transparent border border-[#3fb950] text-[#3fb950] px-8 py-3 font-medium hover:bg-[#3fb950] hover:text-white transition-all"
              >
                View Hedge Recommendations →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
