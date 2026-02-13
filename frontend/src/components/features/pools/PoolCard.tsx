"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { GlowBadge } from "@/components/ui/glow-badge";
import { type Pool } from "@/lib/api";
import { formatTokenAmount } from "@/lib/chain";
import { cn } from "@/lib/utils";
import { Building2, Landmark, Briefcase, TrendingUp, ArrowRight, Lock } from "lucide-react";

const assetClassConfig = {
  treasury: {
    icon: Landmark,
    label: "Treasury",
    color: "text-forge-copper",
    bgColor: "bg-forge-copper/10",
    glowColor: "rgba(232,180,184,0.3)",
  },
  "real-estate": {
    icon: Building2,
    label: "Real Estate",
    color: "text-forge-teal",
    bgColor: "bg-forge-teal/10",
    glowColor: "rgba(111,207,151,0.3)",
  },
  "private-credit": {
    icon: Briefcase,
    label: "Private Credit",
    color: "text-forge-violet",
    bgColor: "bg-forge-violet/10",
    glowColor: "rgba(111,207,151,0.3)",
  },
  "corporate-bonds": {
    icon: TrendingUp,
    label: "Corporate Bonds",
    color: "text-forge-warning",
    bgColor: "bg-forge-warning/10",
    glowColor: "rgba(245,158,11,0.3)",
  },
  commodities: {
    icon: TrendingUp,
    label: "Commodities",
    color: "text-forge-copper-bright",
    bgColor: "bg-forge-copper-bright/10",
    glowColor: "rgba(232,160,101,0.3)",
  },
};

const riskConfig = {
  low: { label: "Low Risk", variant: "success" as const },
  medium: { label: "Medium Risk", variant: "warning" as const },
  high: { label: "High Risk", variant: "danger" as const },
};

interface PoolCardProps {
  pool: Pool;
}

export function PoolCard({ pool }: PoolCardProps) {
  const assetConfig = assetClassConfig[pool.assetClass as keyof typeof assetClassConfig] || assetClassConfig.treasury;
  const risk = riskConfig[pool.riskRating];
  const AssetIcon = assetConfig.icon;

  const totalValueNum = BigInt(pool.totalValue);
  const availableNum = BigInt(pool.availableCapacity);
  const utilizationPercent = totalValueNum > BigInt(0)
    ? Number((totalValueNum - availableNum) * BigInt(100) / totalValueNum)
    : 0;

  return (
    <Card className="relative overflow-hidden group">
      {/* Corner glow orb */}
      <div
        className="absolute -top-20 -right-20 h-40 w-40 rounded-full blur-3xl opacity-30 group-hover:opacity-50 transition-opacity duration-500"
        style={{ background: assetConfig.glowColor }}
      />

      <CardHeader className="pb-3 relative">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3">
            <div className={cn(
              "rounded-lg p-2.5 border border-forge-copper/10",
              assetConfig.bgColor,
              "shadow-[0_0_15px_rgba(232,180,184,0.1)]"
            )}>
              <AssetIcon className={cn("h-5 w-5", assetConfig.color)} />
            </div>
            <div>
              <CardTitle className="text-lg">{pool.name}</CardTitle>
              <p className="text-xs text-[#5A5347]">{assetConfig.label}</p>
            </div>
          </div>
          <GlowBadge variant={risk.variant} withDot>
            {risk.label}
          </GlowBadge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 relative">
        <p className="text-sm text-[#B8A99A] line-clamp-2">{pool.description}</p>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-[#5A5347] mb-1">APY</p>
            <p
              className="text-xl font-bold text-forge-teal"
              style={{ textShadow: "0 0 20px rgba(111,207,151,0.4)" }}
            >
              {pool.yieldRate}%
            </p>
          </div>
          <div>
            <p className="text-xs text-[#5A5347] mb-1">Total Value</p>
            <p
              className="text-lg font-semibold text-forge-copper"
              style={{ textShadow: "0 0 15px rgba(232,180,184,0.3)" }}
            >
              ${formatTokenAmount(totalValueNum, 6)}
            </p>
          </div>
        </div>

        {/* Capacity bar with glow */}
        <div>
          <div className="flex justify-between text-xs text-[#5A5347] mb-2">
            <span>Utilization</span>
            <span className="text-[#B8A99A]">{utilizationPercent}%</span>
          </div>
          <div className="h-2 rounded-full bg-deep-bg/50 overflow-hidden border border-forge-copper/10">
            <div
              className="h-full bg-gradient-to-r from-forge-copper to-forge-violet transition-all duration-500"
              style={{
                width: `${utilizationPercent}%`,
                boxShadow: "0 0 15px rgba(111,207,151,0.4)",
              }}
            />
          </div>
        </div>

        {/* Additional info */}
        <div className="flex items-center justify-between text-xs text-[#5A5347]">
          <div className="flex items-center gap-1.5">
            <Lock className="h-3.5 w-3.5" />
            <span>{pool.lockupPeriod} days lockup</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-[#B8A99A]">Min:</span>
            <span className="text-[#B8A99A]">${formatTokenAmount(BigInt(pool.minInvestment), 6)}</span>
          </div>
        </div>

        {/* CTA */}
        <Link href={`/pools/${pool.id}`}>
          <Button
            variant="glow"
            className="w-full"
            disabled={pool.status !== "active"}
          >
            {pool.status === "active" ? (
              <>
                View Pool
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            ) : (
              `Pool ${pool.status}`
            )}
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}
