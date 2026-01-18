/**
 * Backfill Script: Fetch resolved Polymarket events and match with stock prices
 * 
 * This script:
 * 1. Fetches resolved Polymarket events from the last 6 months
 * 2. Matches events to stocks by exact company name
 * 3. Fetches closing price on resolution date from Yahoo Finance
 * 4. Saves to data/resolutions.json
 * 
 * Run with: npx ts-node scripts/backfill-resolutions.ts
 */

import * as fs from 'fs';
import * as path from 'path';

// ============ Types ============

interface ResolvedEvent {
  eventId: string;
  title: string;
  slug: string;
  description: string;
  resolutionDate: string;
  outcome: 'YES' | 'NO' | 'UNKNOWN';
  finalProbability: number | null;
}

interface StockPrice {
  ticker: string;
  companyName: string;
  priceOnResolution: number | null;
  resolutionDate: string;
}

interface EventStockPair {
  event: ResolvedEvent;
  matchedStocks: StockPrice[];
  matchReason: string;
}

interface BackfillData {
  generatedAt: string;
  totalEvents: number;
  totalMatches: number;
  dateRange: {
    from: string;
    to: string;
  };
  pairs: EventStockPair[];
}

// ============ Company Name Mappings ============

// Exact company names to match in event titles
const COMPANY_MAPPINGS: Record<string, { ticker: string; names: string[] }> = {
  AAPL: { ticker: 'AAPL', names: ['Apple', 'iPhone', 'iPad', 'MacBook', 'Tim Cook'] },
  MSFT: { ticker: 'MSFT', names: ['Microsoft', 'Azure', 'Windows', 'Satya Nadella'] },
  GOOGL: { ticker: 'GOOGL', names: ['Google', 'Alphabet', 'YouTube', 'Sundar Pichai'] },
  META: { ticker: 'META', names: ['Meta', 'Facebook', 'Instagram', 'WhatsApp', 'Mark Zuckerberg', 'Zuckerberg'] },
  AMZN: { ticker: 'AMZN', names: ['Amazon', 'AWS', 'Jeff Bezos', 'Andy Jassy'] },
  TSLA: { ticker: 'TSLA', names: ['Tesla', 'Elon Musk', 'Cybertruck', 'SpaceX'] },
  NVDA: { ticker: 'NVDA', names: ['Nvidia', 'NVIDIA', 'Jensen Huang'] },
  AMD: { ticker: 'AMD', names: ['AMD', 'Lisa Su'] },
  INTC: { ticker: 'INTC', names: ['Intel', 'Pat Gelsinger'] },
  NFLX: { ticker: 'NFLX', names: ['Netflix'] },
  DIS: { ticker: 'DIS', names: ['Disney', 'Bob Iger'] },
  COIN: { ticker: 'COIN', names: ['Coinbase'] },
  JPM: { ticker: 'JPM', names: ['JPMorgan', 'Jamie Dimon'] },
  GS: { ticker: 'GS', names: ['Goldman Sachs'] },
  BA: { ticker: 'BA', names: ['Boeing'] },
  XOM: { ticker: 'XOM', names: ['Exxon', 'ExxonMobil'] },
  CVX: { ticker: 'CVX', names: ['Chevron'] },
  PFE: { ticker: 'PFE', names: ['Pfizer'] },
  JNJ: { ticker: 'JNJ', names: ['Johnson & Johnson', 'Johnson and Johnson'] },
  WMT: { ticker: 'WMT', names: ['Walmart'] },
  TGT: { ticker: 'TGT', names: ['Target'] },
  COST: { ticker: 'COST', names: ['Costco'] },
  NKE: { ticker: 'NKE', names: ['Nike'] },
  SBUX: { ticker: 'SBUX', names: ['Starbucks'] },
  MCD: { ticker: 'MCD', names: ['McDonald\'s', 'McDonalds'] },
  CRM: { ticker: 'CRM', names: ['Salesforce', 'Marc Benioff'] },
  ORCL: { ticker: 'ORCL', names: ['Oracle', 'Larry Ellison'] },
  IBM: { ticker: 'IBM', names: ['IBM'] },
  UBER: { ticker: 'UBER', names: ['Uber'] },
  LYFT: { ticker: 'LYFT', names: ['Lyft'] },
  ABNB: { ticker: 'ABNB', names: ['Airbnb'] },
  SNAP: { ticker: 'SNAP', names: ['Snapchat', 'Snap'] },
  TWTR: { ticker: 'TWTR', names: ['Twitter'] },
  X: { ticker: 'X', names: ['Twitter', 'X Corp'] },
  SPOT: { ticker: 'SPOT', names: ['Spotify'] },
  PYPL: { ticker: 'PYPL', names: ['PayPal'] },
  SQ: { ticker: 'SQ', names: ['Square', 'Block'] },
  SHOP: { ticker: 'SHOP', names: ['Shopify'] },
  ZM: { ticker: 'ZM', names: ['Zoom'] },
  ROKU: { ticker: 'ROKU', names: ['Roku'] },
  LMT: { ticker: 'LMT', names: ['Lockheed Martin', 'Lockheed'] },
  RTX: { ticker: 'RTX', names: ['Raytheon'] },
  NOC: { ticker: 'NOC', names: ['Northrop Grumman'] },
  F: { ticker: 'F', names: ['Ford'] },
  GM: { ticker: 'GM', names: ['General Motors', 'GM'] },
  RIVN: { ticker: 'RIVN', names: ['Rivian'] },
  LCID: { ticker: 'LCID', names: ['Lucid'] },
};

// ============ Polymarket API ============

const GAMMA_API_BASE = 'https://gamma-api.polymarket.com';

async function fetchResolvedEvents(yearsBack: number = 3): Promise<ResolvedEvent[]> {
  const today = new Date();
  const cutoffDate = new Date();
  cutoffDate.setFullYear(cutoffDate.getFullYear() - yearsBack);
  
  console.log(`Fetching events that resolved between ${cutoffDate.toISOString().split('T')[0]} and ${today.toISOString().split('T')[0]}...`);
  console.log(`(Including all past events up to ${yearsBack} years back)`);
  
  const allEvents: ResolvedEvent[] = [];
  let offset = 0;
  const limit = 100;
  let hasMore = true;
  let debugCount = 0;
  let skippedFuture = 0;
  let skippedTooOld = 0;
  
  while (hasMore) {
    try {
      // Fetch closed events
      const url = `${GAMMA_API_BASE}/events?closed=true&limit=${limit}&offset=${offset}`;
      
      if (offset % 500 === 0) {
        console.log(`  Fetching batch at offset ${offset}...`);
      }
      
      const response = await fetch(url, {
        headers: { 'Accept': 'application/json' },
      });
      
      if (!response.ok) {
        console.error(`API error: ${response.status}`);
        break;
      }
      
      const data = await response.json();
      
      if (!Array.isArray(data) || data.length === 0) {
        hasMore = false;
        break;
      }
      
      for (const event of data) {
        const dateStr = event.endDate || event.resolutionDate || '';
        const eventDate = dateStr ? new Date(dateStr) : null;
        
        // Skip events with no date
        if (!eventDate || isNaN(eventDate.getTime())) {
          continue;
        }
        
        // Skip future events (not yet resolved)
        if (eventDate > today) {
          skippedFuture++;
          continue;
        }
        
        // Skip if older than our cutoff
        if (eventDate < cutoffDate) {
          skippedTooOld++;
          continue;
        }
        
        // Debug: show first few valid events
        if (debugCount < 10) {
          console.log(`    ✓ Found: "${event.title?.slice(0, 50)}..." resolved=${eventDate.toISOString().split('T')[0]}`);
          debugCount++;
        }
        
        // Determine outcome from markets
        let outcome: 'YES' | 'NO' | 'UNKNOWN' = 'UNKNOWN';
        let finalProbability: number | null = null;
        
        if (event.markets && Array.isArray(event.markets) && event.markets.length > 0) {
          const market = event.markets[0];
          const prices = market.outcomePrices;
          
          if (prices) {
            let parsedPrices: number[];
            if (typeof prices === 'string') {
              try {
                parsedPrices = JSON.parse(prices);
              } catch {
                parsedPrices = [];
              }
            } else if (Array.isArray(prices)) {
              parsedPrices = prices.map(Number);
            } else {
              parsedPrices = [];
            }
            
            if (parsedPrices.length >= 1) {
              finalProbability = parsedPrices[0];
              if (finalProbability > 0.95) outcome = 'YES';
              else if (finalProbability < 0.05) outcome = 'NO';
            }
          }
        }
        
        allEvents.push({
          eventId: event.id || '',
          title: event.title || '',
          slug: event.slug || '',
          description: event.description || '',
          resolutionDate: dateStr,
          outcome,
          finalProbability,
        });
      }
      
      offset += limit;
      await sleep(150);
      
      // Progress update
      if (offset % 1000 === 0) {
        console.log(`    Progress: scanned ${offset} events, found ${allEvents.length} valid, skipped ${skippedFuture} future, ${skippedTooOld} too old`);
      }
      
      // Stop after finding enough or scanning enough
      if (offset > 10000 || allEvents.length > 500 || data.length < limit) {
        hasMore = false;
      }
      
    } catch (error) {
      console.error('Error fetching events:', error);
      hasMore = false;
    }
  }
  
  console.log(`  Found ${allEvents.length} events that resolved in the last ${yearsBack} years`);
  console.log(`  (Skipped ${skippedFuture} future, ${skippedTooOld} too old)`);
  return allEvents;
}


// ============ Stock Matching ============

function matchEventToStocks(event: ResolvedEvent): { ticker: string; companyName: string; matchReason: string }[] {
  const matches: { ticker: string; companyName: string; matchReason: string }[] = [];
  const titleLower = event.title.toLowerCase();
  const descLower = (event.description || '').toLowerCase();
  
  for (const [ticker, { names }] of Object.entries(COMPANY_MAPPINGS)) {
    for (const name of names) {
      const nameLower = name.toLowerCase();
      
      // Check title first (stronger match)
      if (titleLower.includes(nameLower)) {
        matches.push({
          ticker,
          companyName: name,
          matchReason: `Title contains "${name}"`,
        });
        break; // One match per company is enough
      }
      
      // Check description
      if (descLower.includes(nameLower)) {
        matches.push({
          ticker,
          companyName: name,
          matchReason: `Description contains "${name}"`,
        });
        break;
      }
    }
  }
  
  return matches;
}

// ============ Yahoo Finance ============

async function fetchStockPrice(ticker: string, date: string): Promise<number | null> {
  try {
    const targetDate = new Date(date);
    // Get a range around the target date (in case of weekends/holidays)
    const startDate = new Date(targetDate);
    startDate.setDate(startDate.getDate() - 5);
    const endDate = new Date(targetDate);
    endDate.setDate(endDate.getDate() + 1);
    
    const period1 = Math.floor(startDate.getTime() / 1000);
    const period2 = Math.floor(endDate.getTime() / 1000);
    
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?period1=${period1}&period2=${period2}&interval=1d`;
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0',
      },
    });
    
    if (!response.ok) {
      console.error(`  Yahoo Finance error for ${ticker}: ${response.status}`);
      return null;
    }
    
    const data = await response.json();
    
    const result = data.chart?.result?.[0];
    if (!result) {
      return null;
    }
    
    const timestamps = result.timestamp || [];
    const closes = result.indicators?.quote?.[0]?.close || [];
    
    // Find the closest date to our target
    const targetTimestamp = Math.floor(targetDate.getTime() / 1000);
    let closestIdx = 0;
    let closestDiff = Infinity;
    
    for (let i = 0; i < timestamps.length; i++) {
      const diff = Math.abs(timestamps[i] - targetTimestamp);
      if (diff < closestDiff) {
        closestDiff = diff;
        closestIdx = i;
      }
    }
    
    const price = closes[closestIdx];
    return typeof price === 'number' ? Math.round(price * 100) / 100 : null;
    
  } catch (error) {
    console.error(`  Error fetching price for ${ticker}:`, error);
    return null;
  }
}

// ============ Utilities ============

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ============ Main Script ============

async function main() {
  console.log('='.repeat(60));
  console.log('Polymarket Resolution Backfill Script');
  console.log('='.repeat(60));
  console.log('');
  
  // Create data directory if it doesn't exist
  const dataDir = path.join(process.cwd(), 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
    console.log('Created data/ directory');
  }
  
  // Step 1: Fetch resolved events (3 years back)
  console.log('\n[Step 1/4] Fetching resolved Polymarket events...');
  const events = await fetchResolvedEvents(3);
  
  if (events.length === 0) {
    console.log('No events found. Exiting.');
    return;
  }
  
  // Step 2: Match events to stocks
  console.log('\n[Step 2/4] Matching events to stocks...');
  const matchedPairs: EventStockPair[] = [];
  let matchCount = 0;
  
  for (const event of events) {
    const stockMatches = matchEventToStocks(event);
    
    if (stockMatches.length > 0) {
      matchCount++;
      matchedPairs.push({
        event,
        matchedStocks: stockMatches.map(m => ({
          ticker: m.ticker,
          companyName: m.companyName,
          priceOnResolution: null, // Will be filled in next step
          resolutionDate: event.resolutionDate,
        })),
        matchReason: stockMatches.map(m => m.matchReason).join('; '),
      });
    }
  }
  
  console.log(`  Matched ${matchCount} events to stocks out of ${events.length} total`);
  
  // Step 3: Fetch stock prices
  console.log('\n[Step 3/4] Fetching stock prices on resolution dates...');
  let pricesFetched = 0;
  
  for (const pair of matchedPairs) {
    for (const stock of pair.matchedStocks) {
      console.log(`  Fetching ${stock.ticker} price for ${stock.resolutionDate.split('T')[0]}...`);
      
      const price = await fetchStockPrice(stock.ticker, stock.resolutionDate);
      stock.priceOnResolution = price;
      
      if (price !== null) {
        pricesFetched++;
        console.log(`    → $${price}`);
      } else {
        console.log(`    → Price not found`);
      }
      
      // Rate limiting
      await sleep(300);
    }
  }
  
  console.log(`  Fetched ${pricesFetched} stock prices`);
  
  // Step 4: Save to JSON
  console.log('\n[Step 4/4] Saving to data/resolutions.json...');
  
  const threeYearsAgo = new Date();
  threeYearsAgo.setFullYear(threeYearsAgo.getFullYear() - 3);
  
  const backfillData: BackfillData = {
    generatedAt: new Date().toISOString(),
    totalEvents: events.length,
    totalMatches: matchedPairs.length,
    dateRange: {
      from: threeYearsAgo.toISOString().split('T')[0],
      to: new Date().toISOString().split('T')[0],
    },
    pairs: matchedPairs,
  };
  
  const outputPath = path.join(dataDir, 'resolutions.json');
  fs.writeFileSync(outputPath, JSON.stringify(backfillData, null, 2));
  
  console.log(`  Saved to ${outputPath}`);
  
  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('SUMMARY');
  console.log('='.repeat(60));
  console.log(`Total resolved events fetched: ${events.length}`);
  console.log(`Events matched to stocks: ${matchedPairs.length}`);
  console.log(`Stock prices fetched: ${pricesFetched}`);
  console.log(`Output file: ${outputPath}`);
  console.log('='.repeat(60));
}

// Run the script
main().catch(console.error);
