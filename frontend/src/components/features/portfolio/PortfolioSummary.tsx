"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { portfolioApi, type PortfolioData } from "@/lib/api";
import { formatTokenAmount } from "@/lib/chain";
import { TrendingUp, Wallet, PiggyBank, ArrowUpRight, ArrowDownRight } from "lucide-react";

export function PortfolioSummary() {
  const [portfolio, setPortfolio] = useState<PortfolioData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPortfolio = async () => {
      try {
        const { portfolio } = await portfolioApi.get();
        setPortfolio(portfolio);
      } catch (err: any) {
        setError(err.message);
        // Use mock data for demo
        setPortfolio({
          user: {},
          summary: {
            totalCurrentValue: "0",
            totalCostBasis: "0",
            totalUnrealizedGain: "0",
            totalGainPercent: "0",
            holdingsCount: 0,
            credentialsCount: 0,
          },
          holdings: [],
          credentials: [],
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchPortfolio();
  }, []);

  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} style={{ background: "var(--forge-surface)", borderColor: "rgba(232,180,184,0.08)" }}>
            <CardHeader className="pb-2">
              <div className="h-4 w-24 animate-pulse rounded" style={{ background: "rgba(232,180,184,0.06)" }} />
            </CardHeader>
            <CardContent>
              <div className="h-8 w-32 animate-pulse rounded" style={{ background: "rgba(232,180,184,0.06)" }} />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const summary = portfolio?.summary;
  const gainBigInt = BigInt(summary?.totalUnrealizedGain || "0");
  const isPositive = gainBigInt >= BigInt(0);

  const stats = [
    {
      title: "Total Portfolio Value",
      value: `$${formatTokenAmount(BigInt(summary?.totalCurrentValue || "0"), 6)}`,
      icon: Wallet,
      color: "#E8B4B8",
      bgColor: "rgba(232,180,184,0.1)",
    },
    {
      title: "Total Cost Basis",
      value: `$${formatTokenAmount(BigInt(summary?.totalCostBasis || "0"), 6)}`,
      icon: TrendingUp,
      color: "#6FCF97",
      bgColor: "rgba(111,207,151,0.1)",
    },
    {
      title: "Unrealized Gains",
      value: `$${formatTokenAmount(gainBigInt, 6)}`,
      icon: isPositive ? ArrowUpRight : ArrowDownRight,
      color: isPositive ? "#6FCF97" : "#EB5757",
      bgColor: isPositive ? "rgba(111,207,151,0.1)" : "rgba(235,87,87,0.1)",
    },
    {
      title: "Active Holdings",
      value: summary?.holdingsCount?.toString() || "0",
      icon: PiggyBank,
      color: "#6FCF97",
      bgColor: "rgba(111,207,151,0.1)",
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <Card key={stat.title} style={{ background: "var(--forge-surface)", borderColor: "rgba(232,180,184,0.08)" }}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium" style={{ color: "#B8A99A" }}>
              {stat.title}
            </CardTitle>
            <div className="rounded-lg p-2" style={{ background: stat.bgColor }}>
              <stat.icon className="h-4 w-4" style={{ color: stat.color }} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" style={{ color: "#F0EBE0" }}>{stat.value}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
