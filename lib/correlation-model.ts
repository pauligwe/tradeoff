/**
 * Wood Wide Correlation Model
 * 
 * Trains a prediction model on historical Polymarket resolutions
 * to boost hedge confidence with empirical backing.
 */

import resolutionData from "@/data/resolutions.json";

// Types for our resolution data
export interface ResolutionPair {
  event: {
    eventId: string;
    title: string;
    slug: string;
    description: string;
    resolutionDate: string;
    outcome: "YES" | "NO";
    finalProbability: string;
  };
  matchedStocks: {
    ticker: string;
    companyName: string;
    priceOnResolution: number | null;
    resolutionDate: string;
  }[];
  matchReason: string;
}

export interface CorrelationInsight {
  hasHistoricalData: boolean;
  matchCount: number;
  matchedEvents: {
    title: string;
    outcome: "YES" | "NO";
    ticker: string;
    priceOnResolution: number | null;
    resolutionDate: string;
  }[];
  confidenceBoost: number; // 0-30 percentage points to add to confidence
  insight: string;
  avgOutcome?: "YES" | "NO"; // What outcome was more common
  yesCount: number;
  noCount: number;
}

export interface TrainingDataRow {
  // Input features
  company: string;
  ticker: string;
  eventCategory: string; // Extracted from title/description
  // Target (for prediction model)
  outcome: number; // 1 for YES, 0 for NO
  hadPriceData: number; // 1 if we have price data, 0 if not
}

const WOOD_WIDE_BASE_URL = "https://beta.woodwide.ai";

/**
 * Extract category keywords from event title/description
 */
function extractEventCategory(title: string, description: string): string {
  const text = `${title} ${description}`.toLowerCase();
  
  // Check for common categories
  if (text.includes("emergency") || text.includes("crash") || text.includes("incident")) {
    return "safety_incident";
  }
  if (text.includes("launch") || text.includes("release") || text.includes("unveil")) {
    return "product_launch";
  }
  if (text.includes("ban") || text.includes("illegal") || text.includes("regulation")) {
    return "regulatory";
  }
  if (text.includes("tweet") || text.includes("post") || text.includes("social")) {
    return "social_media";
  }
  if (text.includes("list") || text.includes("exchange") || text.includes("trading")) {
    return "market_listing";
  }
  if (text.includes("deal") || text.includes("partnership") || text.includes("acquisition")) {
    return "business_deal";
  }
  if (text.includes("lawsuit") || text.includes("court") || text.includes("legal")) {
    return "legal";
  }
  
  return "general";
}

/**
 * Normalize company/ticker for matching
 */
function normalizeForMatching(text: string): string[] {
  const normalized = text.toLowerCase().trim();
  const words = normalized.split(/\s+/);
  
  // Return both full text and individual significant words
  return [normalized, ...words.filter(w => w.length > 2)];
}

/**
 * Find historical matches for a given bet
 * Uses ONLY direct ticker matches for accurate correlations
 * 
 * Logic: If you hold BA (Boeing), we find all past Polymarket bets
 * that involved Boeing, regardless of topic. This shows how
 * company-specific bets typically resolve, providing empirical backing.
 */
export function findHistoricalMatches(
  betTitle: string,
  betDescription: string,
  affectedTickers: string[]
): CorrelationInsight {
  const pairs = resolutionData.pairs as ResolutionPair[];
  const tickerMatches: CorrelationInsight["matchedEvents"] = [];
  
  // Create set of affected tickers (uppercase for matching)
  const tickerSet = new Set(affectedTickers.map(t => t.toUpperCase()));
  
  for (const pair of pairs) {
    // ONLY use direct ticker matches - this is the most reliable correlation
    // A ticker match means: "this past bet directly involved one of your stocks"
    const relevantStocks = pair.matchedStocks.filter(s => tickerSet.has(s.ticker));
    
    if (relevantStocks.length > 0) {
      // Direct ticker match - high relevance
      for (const stock of relevantStocks) {
        tickerMatches.push({
          title: pair.event.title,
          outcome: pair.event.outcome as "YES" | "NO",
          ticker: stock.ticker,
          priceOnResolution: stock.priceOnResolution,
          resolutionDate: stock.resolutionDate,
        });
      }
    }
    // NOTE: We removed keyword matching as it produced confusing results
    // (e.g., "Haiti intervention" matching "Intel" via "intelligence")
  }
  
  // Deduplicate by event title
  const uniqueMatches = tickerMatches.filter((match, index, self) => 
    index === self.findIndex(m => m.title === match.title)
  );
  
  // Calculate statistics
  const yesCount = uniqueMatches.filter(m => m.outcome === "YES").length;
  const noCount = uniqueMatches.filter(m => m.outcome === "NO").length;
  const matchCount = uniqueMatches.length;
  
  // Calculate confidence boost based on match count and consistency
  let confidenceBoost = 0;
  if (matchCount >= 1) confidenceBoost = 5;
  if (matchCount >= 2) confidenceBoost = 10;
  if (matchCount >= 3) confidenceBoost = 15;
  if (matchCount >= 5) confidenceBoost = 20;
  
  // Extra boost if outcomes are consistent
  const dominantOutcome = yesCount > noCount ? "YES" : "NO";
  const dominantRatio = Math.max(yesCount, noCount) / matchCount;
  if (dominantRatio > 0.7) confidenceBoost += 5;
  if (dominantRatio > 0.9) confidenceBoost += 5;
  
  // Generate insight text - be clear this is about the same stocks, not similar topics
  let insight = "";
  if (matchCount === 0) {
    insight = "No historical Polymarket bets found involving these stocks.";
  } else if (matchCount === 1) {
    const match = uniqueMatches[0];
    insight = `1 past bet involving ${match.ticker}: "${match.title}" resolved ${match.outcome}.`;
  } else {
    // Get unique tickers from matches
    const tickersInvolved = [...new Set(uniqueMatches.map(m => m.ticker))];
    const tickerStr = tickersInvolved.length <= 2 
      ? tickersInvolved.join(" & ") 
      : `${tickersInvolved.slice(0, 2).join(", ")} & more`;
    
    const withPrice = uniqueMatches.filter(m => m.priceOnResolution !== null).length;
    insight = `${matchCount} past bets involving ${tickerStr}. ${yesCount} resolved YES, ${noCount} resolved NO.`;
    if (withPrice > 0) {
      insight += ` ${withPrice} have price data.`;
    }
  }
  
  return {
    hasHistoricalData: matchCount > 0,
    matchCount,
    matchedEvents: uniqueMatches.slice(0, 5), // Limit to 5 most relevant
    confidenceBoost: Math.min(30, confidenceBoost), // Cap at 30%
    insight,
    avgOutcome: matchCount > 0 ? dominantOutcome : undefined,
    yesCount,
    noCount,
  };
}

/**
 * Get training data formatted for Wood Wide
 */
export function getTrainingData(): TrainingDataRow[] {
  const pairs = resolutionData.pairs as ResolutionPair[];
  const rows: TrainingDataRow[] = [];
  
  for (const pair of pairs) {
    for (const stock of pair.matchedStocks) {
      rows.push({
        company: stock.companyName,
        ticker: stock.ticker,
        eventCategory: extractEventCategory(pair.event.title, pair.event.description),
        outcome: pair.event.outcome === "YES" ? 1 : 0,
        hadPriceData: stock.priceOnResolution !== null ? 1 : 0,
      });
    }
  }
  
  return rows;
}

/**
 * Convert data rows to CSV for Wood Wide upload
 */
export function toCSV(data: TrainingDataRow[]): string {
  if (data.length === 0) return "";
  
  const headers = Object.keys(data[0]);
  const rows = [
    headers.join(","),
    ...data.map((row) =>
      headers
        .map((h) => {
          const val = row[h as keyof TrainingDataRow];
          if (typeof val === "string" && (val.includes(",") || val.includes('"'))) {
            return `"${val.replace(/"/g, '""')}"`;
          }
          return String(val ?? "");
        })
        .join(",")
    ),
  ];
  return rows.join("\n");
}

/**
 * Wood Wide Correlation Model Client
 */
class CorrelationModelClient {
  private apiKey: string;
  private baseUrl: string;
  private modelId: string | null = null;
  private datasetId: string | null = null;
  private initialized: boolean = false;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
    this.baseUrl = WOOD_WIDE_BASE_URL;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;

    const headers: Record<string, string> = {
      Authorization: `Bearer ${this.apiKey}`,
      ...(options.headers as Record<string, string>),
    };

    if (!(options.body instanceof FormData)) {
      headers["Content-Type"] = "application/json";
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Wood Wide API error (${response.status}): ${errorText}`);
    }

    return response.json();
  }

  /**
   * Upload training data and train prediction model
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    console.log("[Wood Wide Correlation] 📊 Initializing correlation model...");
    
    try {
      // Get training data
      const trainingData = getTrainingData();
      console.log(`[Wood Wide Correlation] 📤 Uploading ${trainingData.length} training rows...`);
      
      // Upload dataset
      const csvContent = toCSV(trainingData);
      const formData = new FormData();
      const blob = new Blob([csvContent], { type: "text/csv" });
      formData.append("file", blob, "polymarket_correlations.csv");
      formData.append("name", "polymarket_correlations");
      formData.append("overwrite", "true");

      const dataset = await this.request<{ id: string; num_rows: number }>(
        "/api/datasets",
        {
          method: "POST",
          body: formData,
        }
      );
      
      this.datasetId = dataset.id;
      console.log(`[Wood Wide Correlation] ✅ Dataset uploaded: ${dataset.id} (${dataset.num_rows} rows)`);

      // Train prediction model
      console.log("[Wood Wide Correlation] 🧠 Training prediction model...");
      
      const modelResponse = await this.request<{ id: string }>(
        "/api/models/prediction/train",
        {
          method: "POST",
          body: JSON.stringify({
            model_name: "polymarket_outcome_predictor",
            dataset_id: dataset.id,
            target_column: "outcome",
            input_columns: ["company", "ticker", "eventCategory"],
            overwrite: true,
          }),
        }
      );

      // Wait for training to complete
      const startTime = Date.now();
      const maxWaitMs = 60000;
      
      while (Date.now() - startTime < maxWaitMs) {
        const status = await this.request<{ training_status: string }>(
          `/api/models/${modelResponse.id}`
        );
        
        if (status.training_status === "COMPLETE") {
          this.modelId = modelResponse.id;
          this.initialized = true;
          console.log(`[Wood Wide Correlation] ✅ Model trained: ${modelResponse.id}`);
          return;
        }
        
        if (status.training_status === "FAILED") {
          throw new Error("Model training failed");
        }
        
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }
      
      throw new Error("Model training timed out");
    } catch (error) {
      console.error("[Wood Wide Correlation] ❌ Initialization failed:", error);
      throw error;
    }
  }

  /**
   * Get prediction for a bet's likely outcome
   */
  async predictOutcome(
    ticker: string,
    company: string,
    eventCategory: string
  ): Promise<{ prediction: number; confidence: number }> {
    if (!this.initialized || !this.modelId) {
      await this.initialize();
    }

    if (!this.modelId) {
      throw new Error("Model not initialized");
    }

    // Upload inference data
    const inferenceData = [{ company, ticker, eventCategory, outcome: 0, hadPriceData: 0 }];
    const csvContent = toCSV(inferenceData);
    
    const formData = new FormData();
    const blob = new Blob([csvContent], { type: "text/csv" });
    formData.append("file", blob, "inference_data.csv");
    formData.append("name", `inference_${Date.now()}`);
    formData.append("overwrite", "true");

    const dataset = await this.request<{ id: string }>(
      "/api/datasets",
      {
        method: "POST",
        body: formData,
      }
    );

    // Run inference
    const predictions = await this.request<Array<{ prediction: number; confidence?: number }>>(
      `/api/models/prediction/${this.modelId}/infer?dataset_id=${dataset.id}`,
      { method: "POST" }
    );

    if (predictions.length === 0) {
      return { prediction: 0.5, confidence: 0 };
    }

    return {
      prediction: predictions[0].prediction,
      confidence: predictions[0].confidence || 0.5,
    };
  }
}

// Singleton instance
let correlationClient: CorrelationModelClient | null = null;

/**
 * Get or create the correlation model client
 */
export function getCorrelationClient(): CorrelationModelClient | null {
  const apiKey = process.env.WOOD_WIDE_API_KEY;
  
  if (!apiKey) {
    console.log("[Wood Wide Correlation] ⚠️ No API key configured");
    return null;
  }
  
  if (!correlationClient) {
    correlationClient = new CorrelationModelClient(apiKey);
  }
  
  return correlationClient;
}

/**
 * Get correlation insights for a hedge recommendation
 * This is the main function to call from the API
 */
export async function getCorrelationInsights(
  betTitle: string,
  betDescription: string,
  affectedTickers: string[]
): Promise<CorrelationInsight & { woodWidePrediction?: { prediction: number; confidence: number } }> {
  // First, get static historical matches (always works, no API needed)
  const historicalInsight = findHistoricalMatches(betTitle, betDescription, affectedTickers);
  
  // Try to get Wood Wide prediction if API is available
  const client = getCorrelationClient();
  
  if (client && affectedTickers.length > 0) {
    try {
      const category = extractEventCategory(betTitle, betDescription);
      const ticker = affectedTickers[0];
      
      // For now, use ticker as company name if we don't have better data
      const prediction = await client.predictOutcome(ticker, ticker, category);
      
      return {
        ...historicalInsight,
        woodWidePrediction: prediction,
      };
    } catch (error) {
      console.error("[Wood Wide Correlation] Prediction failed:", error);
      // Fall back to just historical data
    }
  }
  
  return historicalInsight;
}

/**
 * Get summary stats about the resolution data
 */
export function getResolutionStats(): {
  totalEvents: number;
  totalMatches: number;
  dateRange: { from: string; to: string };
  topCompanies: { company: string; count: number }[];
} {
  const data = resolutionData as {
    totalEvents: number;
    totalMatches: number;
    dateRange: { from: string; to: string };
    pairs: ResolutionPair[];
  };
  
  // Count companies
  const companyCounts: Record<string, number> = {};
  for (const pair of data.pairs) {
    for (const stock of pair.matchedStocks) {
      companyCounts[stock.companyName] = (companyCounts[stock.companyName] || 0) + 1;
    }
  }
  
  const topCompanies = Object.entries(companyCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([company, count]) => ({ company, count }));
  
  return {
    totalEvents: data.totalEvents,
    totalMatches: data.totalMatches,
    dateRange: data.dateRange,
    topCompanies,
  };
}
