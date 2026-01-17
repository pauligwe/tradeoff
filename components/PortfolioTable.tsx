"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { PortfolioItem, StockInfo } from "@/app/page";

interface PortfolioTableProps {
  portfolio: PortfolioItem[];
  stockInfo: Record<string, StockInfo>;
  onRemove: (ticker: string) => void;
  isLoading?: boolean;
}

export function PortfolioTable({
  portfolio,
  stockInfo,
  onRemove,
  isLoading,
}: PortfolioTableProps) {
  // Calculate total portfolio value
  const totalValue = portfolio.reduce((sum, item) => {
    const info = stockInfo[item.ticker];
    const price = info?.price || 0;
    return sum + price * item.shares;
  }, 0);

  return (
    <div className="rounded-lg border border-border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-secondary/50 hover:bg-secondary/50">
            <TableHead className="font-medium">Symbol</TableHead>
            <TableHead className="font-medium">Shares</TableHead>
            <TableHead className="font-medium">Sector</TableHead>
            <TableHead className="font-medium text-right">Price</TableHead>
            <TableHead className="font-medium text-right">Value</TableHead>
            <TableHead className="font-medium text-right">Weight</TableHead>
            <TableHead className="w-10"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {portfolio.map((item) => {
            const info = stockInfo[item.ticker];
            const price = info?.price || 0;
            const value = price * item.shares;
            const weight = totalValue > 0 ? (value / totalValue) * 100 : 0;

            return (
              <TableRow key={item.ticker} className="group">
                <TableCell className="font-mono font-medium">
                  {item.ticker}
                  {info?.name && (
                    <span className="block text-xs text-muted-foreground font-normal truncate max-w-[150px]">
                      {info.name}
                    </span>
                  )}
                </TableCell>
                <TableCell className="font-mono">
                  {item.shares.toLocaleString()}
                </TableCell>
                <TableCell>
                  {isLoading ? (
                    <span className="text-muted-foreground">...</span>
                  ) : (
                    <span className="text-sm">
                      {info?.sector || "—"}
                    </span>
                  )}
                </TableCell>
                <TableCell className="text-right font-mono">
                  {isLoading ? (
                    <span className="text-muted-foreground">...</span>
                  ) : price > 0 ? (
                    `$${price.toFixed(2)}`
                  ) : (
                    "—"
                  )}
                </TableCell>
                <TableCell className="text-right font-mono">
                  {isLoading ? (
                    <span className="text-muted-foreground">...</span>
                  ) : value > 0 ? (
                    `$${value.toLocaleString(undefined, { maximumFractionDigits: 0 })}`
                  ) : (
                    "—"
                  )}
                </TableCell>
                <TableCell className="text-right font-mono">
                  {isLoading ? (
                    <span className="text-muted-foreground">...</span>
                  ) : weight > 0 ? (
                    <span className={weight > 20 ? "text-accent" : ""}>
                      {weight.toFixed(1)}%
                    </span>
                  ) : (
                    "—"
                  )}
                </TableCell>
                <TableCell>
                  <button
                    onClick={() => onRemove(item.ticker)}
                    className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all"
                    aria-label={`Remove ${item.ticker}`}
                  >
                    ×
                  </button>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
      
      {/* Total Row */}
      {totalValue > 0 && !isLoading && (
        <div className="px-4 py-3 bg-secondary/30 border-t border-border flex justify-between items-center">
          <span className="text-sm text-muted-foreground">
            {portfolio.length} holding{portfolio.length !== 1 ? "s" : ""}
          </span>
          <span className="font-mono font-medium">
            Total: ${totalValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </span>
        </div>
      )}
    </div>
  );
}
