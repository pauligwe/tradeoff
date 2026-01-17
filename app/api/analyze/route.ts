import { NextRequest, NextResponse } from "next/server";
import { getStockData } from "@/lib/stocks";
import { fetchRelevantEvents, formatEventsForContext, findEventByKeywords, getEventUrl, getCompanyKeywords } from "@/lib/polymarket";
import { compressWithBear1, estimateTokens } from "@/lib/compression";
import { analyzeWithGrok } from "@/lib/grok";

interface PortfolioItem {
  ticker: string;
  shares: number;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const portfolio: PortfolioItem[] = body.portfolio;

    if (!portfolio || !Array.isArray(portfolio) || portfolio.length === 0) {
      return NextResponse.json(
        { error: "Portfolio is required" },
        { status: 400 }
      );
    }

    const tokenCompanyKey = process.env.TOKEN_COMPANY_API_KEY || "";
    const groqApiKey = process.env.GROQ_API_KEY || process.env.GROK_API_KEY || "";

    if (!groqApiKey) {
      return NextResponse.json(
        { error: "Groq API key not configured. Add GROQ_API_KEY to .env.local" },
        { status: 500 }
      );
    }

    // Fetch stock data
    const tickers = portfolio.map((p) => p.ticker);
    const stockData = await getStockData(tickers);

    // Build portfolio with data
    const portfolioWithData = portfolio.map((p) => {
      const stock = stockData.find((s) => s.ticker === p.ticker.toUpperCase());
      return {
        ticker: p.ticker.toUpperCase(),
        shares: p.shares,
        name: stock?.name || p.ticker,
        sector: stock?.sector || "Unknown",
        industry: stock?.industry || "Unknown",
        price: stock?.price || 0,
        value: (stock?.price || 0) * p.shares,
      };
    });

    const totalValue = portfolioWithData.reduce((sum, p) => sum + p.value, 0);

    // Fetch events relevant to the specific stocks
    const stocksForSearch = portfolioWithData.map(p => ({
      ticker: p.ticker,
      name: p.name,
      sector: p.sector,
      industry: p.industry,
    }));
    
    const events = await fetchRelevantEvents(stocksForSearch);

    // Build per-stock context
    const stockContexts = portfolioWithData.map((p) => {
      const weight = totalValue > 0 ? ((p.value / totalValue) * 100).toFixed(1) : "0";
      const keywords = getCompanyKeywords(p.ticker, p.name, p.sector, p.industry);
      
      return `### ${p.ticker} - ${p.name}
Position: ${p.shares} shares @ $${p.price.toFixed(2)} = $${p.value.toLocaleString()} (${weight}% of portfolio)
Sector: ${p.sector} | Industry: ${p.industry}
Look for markets mentioning: ${keywords.slice(0, 8).join(", ")}`;
    }).join("\n\n");

    // Format events grouped by relevance to each stock
    const eventsContext = formatEventsForContext(events, stocksForSearch);

    // Build context that emphasizes per-stock analysis
    const fullContext = `# PORTFOLIO TO HEDGE (Total: $${totalValue.toLocaleString()})

${stockContexts}

# AVAILABLE POLYMARKET EVENTS
Find markets that DIRECTLY mention each company, CEO, or core product.
Skip stocks if no direct hedge exists - quality over quantity.

${eventsContext}

TASK: For each stock above, find ONE direct hedge if a good one exists. Skip stocks without good matches.`;

    const originalTokens = estimateTokens(fullContext);

    // Compress if available
    let compressedContext = fullContext;
    let compressedTokens = originalTokens;
    let savings = 0;

    if (tokenCompanyKey) {
      const compressionResult = await compressWithBear1(fullContext, tokenCompanyKey);
      compressedContext = compressionResult.compressed;
      compressedTokens = compressionResult.compressedTokens;
      savings = compressionResult.savings;
    }

    // Analyze
    const analysis = await analyzeWithGrok(compressedContext, groqApiKey);

    // Add market URLs
    const recommendationsWithUrls = analysis.recommendations.map((rec) => {
      const matchedEvent = findEventByKeywords(events, rec.market);
      
      return {
        ...rec,
        marketUrl: matchedEvent 
          ? getEventUrl(matchedEvent.slug)
          : `https://polymarket.com/markets?_q=${encodeURIComponent(rec.market.slice(0, 30))}`,
      };
    });

    return NextResponse.json({
      summary: analysis.summary,
      recommendations: recommendationsWithUrls,
      stocksWithoutHedges: analysis.stocksWithoutHedges || [],
      compression: {
        originalTokens,
        compressedTokens,
        savings,
      },
    });
  } catch (error) {
    console.error("Analysis error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Analysis failed" },
      { status: 500 }
    );
  }
}
