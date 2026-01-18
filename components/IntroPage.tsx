"use client";

interface IntroPageProps {
  onGetStarted: () => void;
}

export function IntroPage({ onGetStarted }: IntroPageProps) {
  return (
    <div className="max-w-[1000px] mx-auto px-6 py-16">
      {/* Hero Card */}
      <div className="border border-[#2d3139] bg-[#1c2026] mb-8">
        <div className="border-b border-[#2d3139] p-6">
          <h1 className="text-3xl font-semibold mb-2">
            Hedge stock portfolios using prediction markets
          </h1>
          <p className="text-[#858687] text-sm">
            Traditional hedging (options, shorts) is complex and expensive. TradeOff uses AI to match your portfolio risks with prediction market bets that pay out when real-world events hurt your holdings.
          </p>
        </div>

        <div className="grid grid-cols-2">
          <div className="border-r border-[#2d3139] p-6">
            <div className="text-xs text-[#858687] mb-3">THE PROBLEM</div>
            <ul className="space-y-2 text-sm text-[#858687]">
              <li className="flex gap-2">
                <span className="text-[#f85149]">—</span>
                <span>Options require specialized knowledge</span>
              </li>
              <li className="flex gap-2">
                <span className="text-[#f85149]">—</span>
                <span>Shorting has unlimited downside risk</span>
              </li>
              <li className="flex gap-2">
                <span className="text-[#f85149]">—</span>
                <span>Traditional hedges are expensive and illiquid</span>
              </li>
              <li className="flex gap-2">
                <span className="text-[#f85149]">—</span>
                <span>Most investors leave portfolios unprotected</span>
              </li>
            </ul>
          </div>

          <div className="p-6">
            <div className="text-xs text-[#858687] mb-3">THE SOLUTION</div>
            <ul className="space-y-2 text-sm text-[#858687]">
              <li className="flex gap-2">
                <span className="text-[#3fb950]">—</span>
                <span>Bet directly on events affecting your holdings</span>
              </li>
              <li className="flex gap-2">
                <span className="text-[#3fb950]">—</span>
                <span>Capped downside (know exactly what you risk)</span>
              </li>
              <li className="flex gap-2">
                <span className="text-[#3fb950]">—</span>
                <span>24/7 liquidity on Polymarket</span>
              </li>
              <li className="flex gap-2">
                <span className="text-[#3fb950]">—</span>
                <span>AI-powered risk analysis and recommendations</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* How It Works */}
      <div className="border border-[#2d3139] bg-[#1c2026] mb-8">
        <div className="border-b border-[#2d3139] px-6 py-4">
          <div className="text-xs text-[#858687]">HOW IT WORKS</div>
        </div>
        <div className="p-6">
          <div className="space-y-6">
            <div className="flex gap-4">
              <div className="w-[40px] h-[40px] border border-[#2d3139] bg-[#0d1117] flex items-center justify-center font-semibold mono shrink-0">
                01
              </div>
              <div className="flex-1">
                <div className="font-semibold mb-1">Upload Portfolio</div>
                <div className="text-sm text-[#858687]">
                  Add your stock holdings (ticker, shares, price). System calculates total value and sector exposure.
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="w-[40px] h-[40px] border border-[#2d3139] bg-[#0d1117] flex items-center justify-center font-semibold mono shrink-0">
                02
              </div>
              <div className="flex-1">
                <div className="font-semibold mb-1">AI Risk Analysis</div>
                <div className="text-sm text-[#858687]">
                  Wood Wide AI analyzes concentration risk, sector exposure, regulatory threats, and event-specific vulnerabilities.
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="w-[40px] h-[40px] border border-[#2d3139] bg-[#0d1117] flex items-center justify-center font-semibold mono shrink-0">
                03
              </div>
              <div className="flex-1">
                <div className="font-semibold mb-1">Get Hedge Recommendations</div>
                <div className="text-sm text-[#858687]">
                  Receive specific prediction market bets that hedge your risks. Each recommendation shows allocation size, confidence level, and reasoning.
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="w-[40px] h-[40px] border border-[#2d3139] bg-[#0d1117] flex items-center justify-center font-semibold mono shrink-0">
                04
              </div>
              <div className="flex-1">
                <div className="font-semibold mb-1">Execute on Polymarket</div>
                <div className="text-sm text-[#858687]">
                  Place bets on Polymarket. If adverse events occur, your prediction market positions pay out, offsetting stock losses.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Why Prediction Markets */}
      <div className="border border-[#2d3139] bg-[#1c2026] mb-8">
        <div className="border-b border-[#2d3139] px-6 py-4">
          <div className="text-xs text-[#858687]">WHY PREDICTION MARKETS</div>
        </div>
        <div className="divide-y divide-[#2d3139]">
          <div className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <div className="font-semibold mb-1">Capped Downside</div>
                <div className="text-sm text-[#858687]">
                  Maximum loss is your bet amount. No infinite losses like traditional shorts.
                </div>
              </div>
              <div className="text-[#3fb950] mono text-sm">CRITICAL</div>
            </div>
          </div>

          <div className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <div className="font-semibold mb-1">Binary Outcomes</div>
                <div className="text-sm text-[#858687]">
                  Clear yes/no events. Either it happens or it doesn&apos;t. Simple to understand and price.
                </div>
              </div>
              <div className="text-[#3fb950] mono text-sm">CRITICAL</div>
            </div>
          </div>

          <div className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <div className="font-semibold mb-1">Event-Specific Hedging</div>
                <div className="text-sm text-[#858687]">
                  Hedge against actual events you&apos;re worried about (regulation, bans, lawsuits) not just price movements.
                </div>
              </div>
              <div className="text-[#3fb950] mono text-sm">CRITICAL</div>
            </div>
          </div>

          <div className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <div className="font-semibold mb-1">24/7 Liquidity</div>
                <div className="text-sm text-[#858687]">
                  Trade anytime. Exit positions when you want. No waiting for market hours or option expiry.
                </div>
              </div>
              <div className="text-[#858687] mono text-sm">HIGH</div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Button */}
      <div className="flex justify-center">
        <button
          onClick={onGetStarted}
          className="bg-[#3fb950] text-white px-12 py-4 font-semibold hover:brightness-110 transition-all border border-[#3fb950]"
        >
          GET STARTED →
        </button>
      </div>

      {/* Disclaimer */}
      <div className="mt-8 text-center text-xs text-[#858687] border border-[#2d3139] p-4 bg-[#0d1117]">
        TradeOff is an educational tool. Not financial advice. Prediction market betting involves risk. Only bet what you can afford to lose.
      </div>
    </div>
  );
}
