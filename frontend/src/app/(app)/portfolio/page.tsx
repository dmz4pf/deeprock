"use client";

import React, { useEffect, useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { portfolioApi, type PortfolioData, type PortfolioHolding } from "@/lib/api";
import { ASSET_CLASSES } from "@/config/pools.config";
import { QGPanel } from "@/components/previews/quantum-grid/primitives/QGPanel";
import { QGDonutRing } from "@/components/previews/quantum-grid/primitives/QGDonutRing";
import { QGSparkline } from "@/components/previews/quantum-grid/primitives/QGSparkline";
import { QGGauge } from "@/components/previews/quantum-grid/primitives/QGGauge";
import { QGFeed } from "@/components/previews/quantum-grid/primitives/QGFeed";
import { QGProgressBar } from "@/components/previews/quantum-grid/primitives/QGProgressBar";
import { QGBadge } from "@/components/previews/quantum-grid/primitives/QGBadge";
import { QGScrollReveal } from "@/components/previews/quantum-grid/primitives/QGScrollReveal";
import { QGButton } from "@/components/previews/quantum-grid/primitives/QGButton";
import { useAnimatedValue } from "@/components/previews/quantum-grid/hooks/useAnimatedValue";
import { useWalletBalance } from "@/hooks/useWalletBalance";
import { Droplets, Loader2 } from "lucide-react";
import Link from "next/link";
import { PageLayout } from "@/components/layout/PageLayout";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";

/* ── Constants ─────────────────────────────────────────────────────────── */

const ASSET_CLASS_COLORS: Record<string, string> = {
  treasury: "#E8B4B8",
  "real-estate": "#C4A265",
  "private-credit": "#F5E6D3",
  "corporate-bonds": "#B8A99A",
  commodities: "#6FCF97",
};

const FEED_EVENTS = [
  { id: 1, time: "14:32:08", type: "YIELD", message: "Treasuries yield distributed", amount: "+$1,247" },
  { id: 2, time: "14:31:55", type: "TX", message: "Credit pool rebalance executed", amount: "$45,000" },
  { id: 3, time: "14:31:42", type: "SYNC", message: "NAV oracle price update", amount: "$2.50M" },
  { id: 4, time: "14:31:30", type: "ALERT", message: "Volatility threshold normal", amount: "0.8%" },
  { id: 5, time: "14:31:18", type: "YIELD", message: "Real Estate rent accrual", amount: "+$892" },
  { id: 6, time: "14:31:05", type: "TX", message: "New deposit processed", amount: "$25,000" },
  { id: 7, time: "14:30:52", type: "SYNC", message: "Blockchain state synchronized", amount: "Block #4,291" },
  { id: 8, time: "14:30:40", type: "YIELD", message: "Commodities futures settled", amount: "+$340" },
];

const SERIF_FONT = "var(--font-serif), 'Playfair Display', serif";
const SANS_FONT = "var(--font-sans), 'Outfit', sans-serif";

/* ── Helpers ───────────────────────────────────────────────────────────── */

function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function getAssetClassLabel(slug: string): string {
  return ASSET_CLASSES.find((ac) => ac.slug === slug)?.label ?? slug;
}

function holdingValue(h: PortfolioHolding): number {
  return Number(BigInt(h.currentValue)) / 1e6;
}

function computeAllocationSegments(holdings: PortfolioHolding[]) {
  const map = new Map<string, number>();
  for (const h of holdings) {
    map.set(h.assetClass, (map.get(h.assetClass) ?? 0) + holdingValue(h));
  }
  return Array.from(map.entries()).map(([slug, value]) => ({
    label: getAssetClassLabel(slug),
    value,
    color: ASSET_CLASS_COLORS[slug] ?? "#6B7280",
  }));
}

function generateSparkline(seed: number): number[] {
  const rng = seededRandom(seed * 100 + 7);
  const data: number[] = [];
  let v = 50 + seed * 10;
  for (let i = 0; i < 14; i++) {
    v += (rng() - 0.4) * 8;
    v = Math.max(20, Math.min(90, v));
    data.push(v);
  }
  return data;
}

function generateHeatmap(holdings: PortfolioHolding[]): number[][] {
  const rng = seededRandom(999);
  return holdings.map((_, ai) =>
    Array.from({ length: 7 }, () =>
      Math.round((0.3 + rng() * 0.7 + ai * 0.05) * 100) / 100
    )
  );
}

function computeHealthScore(holdings: PortfolioHolding[]): number {
  if (holdings.length === 0) return 0;
  const uniqueClasses = new Set(holdings.map((h) => h.assetClass)).size;
  const diversificationScore = Math.min(uniqueClasses / 5, 1) * 40;
  const holdingCountScore = Math.min(holdings.length / 6, 1) * 30;
  const avgGain = holdings.reduce((s, h) => s + parseFloat(h.gainPercent), 0) / holdings.length;
  const performanceScore = Math.min(Math.max(avgGain + 10, 0) / 20, 1) * 30;
  return Math.round(diversificationScore + holdingCountScore + performanceScore);
}

function formatValue(val: number): string {
  if (val >= 1_000_000) return `$${(val / 1_000_000).toFixed(2)}M`;
  if (val >= 1_000) return `$${(val / 1_000).toFixed(0)}K`;
  return `$${val.toFixed(2)}`;
}

function formatHeroValue(val: number): { main: string; cents: string; shortLabel: string } {
  if (val >= 1_000_000) {
    const millions = val / 1_000_000;
    const parts = millions.toFixed(2).split(".");
    return { main: `$${parts[0]}`, cents: `.${parts[1]}M`, shortLabel: `${millions.toFixed(1)}M` };
  }
  if (val >= 1_000) {
    const thousands = val / 1_000;
    const parts = thousands.toFixed(2).split(".");
    return { main: `$${parts[0]}`, cents: `.${parts[1]}K`, shortLabel: `${thousands.toFixed(0)}K` };
  }
  const parts = val.toFixed(2).split(".");
  return { main: `$${parts[0]}`, cents: `.${parts[1]}`, shortLabel: `$${Math.round(val)}` };
}

/* ── Page Shell ────────────────────────────────────────────────────────── */

export default function PortfolioPage() {
  const [portfolio, setPortfolio] = useState<PortfolioData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    const fetchPortfolio = async () => {
      try {
        const { portfolio } = await portfolioApi.get();
        setPortfolio(portfolio);
      } catch {
        setHasError(true);
      } finally {
        setIsLoading(false);
      }
    };
    fetchPortfolio();
  }, []);

  if (isLoading) return <PortfolioSkeleton />;
  if (hasError || !portfolio) return <EmptyPortfolio />;

  return <PortfolioContent portfolio={portfolio} />;
}

/* ── Skeleton ──────────────────────────────────────────────────────────── */

function PortfolioSkeleton() {
  return (
    <div className="forge-fade-in flex flex-col gap-5">
      <QGPanel variant="hero" accent>
        <div className="flex flex-col gap-3 py-3">
          <Skeleton height={14} width="30%" />
          <Skeleton height={36} width="50%" />
          <Skeleton height={14} width="40%" />
        </div>
      </QGPanel>
      <div className="grid-sidebar">
        <QGPanel>
          <div className="flex flex-col items-center gap-4 py-6">
            <Skeleton width={160} height={160} rounded="full" />
            <Skeleton height={14} width="60%" />
          </div>
        </QGPanel>
        <QGPanel>
          <div className="flex flex-col gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton width={40} height={40} rounded="lg" />
                <div className="flex-1 flex flex-col gap-2">
                  <Skeleton height={14} width="60%" />
                  <Skeleton height={10} width="40%" />
                </div>
                <Skeleton height={14} width={60} />
              </div>
            ))}
          </div>
        </QGPanel>
      </div>
    </div>
  );
}

/* ── Empty State ───────────────────────────────────────────────────────── */

function EmptyPortfolio() {
  return (
    <div className="forge-fade-in flex flex-col gap-5">
      <QGScrollReveal>
        <EmptyState
          icon="vault"
          title="No Investments Yet"
          description="Start building your portfolio by investing in tokenized real-world assets."
          action={{ label: "Explore Pools", href: "/pools" }}
        />
      </QGScrollReveal>
    </div>
  );
}

/* ── Yield Matrix ─────────────────────────────────────────────────────── */

function YieldMatrix({ holdings, data }: { holdings: PortfolioHolding[]; data: number[][] }) {
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  const uniqueAssets = useMemo(() => {
    const seen = new Set<string>();
    return holdings.filter((h) => {
      if (seen.has(h.assetClass)) return false;
      seen.add(h.assetClass);
      return true;
    });
  }, [holdings]);

  return (
    <QGPanel label="Yield Matrix (7-Day)" hover>
      <div className="grid gap-[3px]" style={{ gridTemplateColumns: "72px repeat(7, 1fr)" }}>
        <div />
        {days.map((d) => (
          <div
            key={d}
            className="text-[10px] text-[#5A5347] text-center pb-1.5 font-medium tracking-widest font-sans"
          >
            {d}
          </div>
        ))}
        {uniqueAssets.map((asset, ai) => {
          const color = ASSET_CLASS_COLORS[asset.assetClass] ?? "#6B7280";
          const ticker = asset.poolName.split(" ")[0]?.slice(0, 4).toUpperCase() ?? asset.assetClass.slice(0, 4).toUpperCase();
          return (
            <React.Fragment key={ai}>
              <div
                className="text-[11px] flex items-center opacity-80 font-semibold font-sans tracking-wide"
                style={{ color }}
              >
                {ticker}
              </div>
              {(data[ai] ?? []).map((val, di) => {
                const h = val > 0.7 ? 30 : val > 0.4 ? 28 : 25;
                const l = 10 + val * 40;
                const s = 50 + val * 30;
                return (
                  <div
                    key={`${ai}-${di}`}
                    className="rounded h-[30px] cursor-pointer flex items-center justify-center text-[10px] font-medium tabular-nums"
                    style={{
                      background: `hsl(${h}, ${s}%, ${l}%)`,
                      color: val > 0.6 ? "rgba(240,235,224,0.75)" : "rgba(240,235,224,0.3)",
                    }}
                  >
                    {(val * 10).toFixed(1)}%
                  </div>
                );
              })}
            </React.Fragment>
          );
        })}
      </div>
    </QGPanel>
  );
}

/* ── Expandable Holdings Table ─────────────────────────────────────────── */

function ExpandableHoldingsTable({ holdings }: { holdings: PortfolioHolding[] }) {
  const router = useRouter();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const sparklines = useMemo(() => {
    const map = new Map<string, number[]>();
    holdings.forEach((h, i) => map.set(h.poolId, generateSparkline(i + 50)));
    return map;
  }, [holdings]);

  const toggleExpand = useCallback((poolId: string) => {
    setExpandedId((prev) => (prev === poolId ? null : poolId));
  }, []);

  const reversedHoldings = useMemo(() => [...holdings].reverse(), [holdings]);

  return (
    <QGPanel label="Active Investments">
      <div className="flex flex-col">
        {/* Desktop: Table grid (lg+) */}
        <div className="hidden lg:block">
          {/* Header */}
          <div
            className="grid gap-2 px-2 pb-2.5 border-b border-[var(--border-subtle)]"
            style={{ gridTemplateColumns: "2.5fr 1fr 1fr 1fr 1fr 40px" }}
          >
            {["Pool", "Value", "APY", "Lock", "Status", ""].map((h) => (
              <div
                key={h}
                className="text-[10px] font-semibold text-[#5A5347] tracking-[0.12em] uppercase font-sans"
              >
                {h}
              </div>
            ))}
          </div>

          {/* Scrollable rows — newest first */}
          <div className="overflow-y-auto" style={{ maxHeight: 420 }}>
          {reversedHoldings.map((h) => {
            const val = holdingValue(h);
            const apy = parseFloat(h.yieldRatePercent || "0");
            const gain = parseFloat(h.gainPercent);
            const color = ASSET_CLASS_COLORS[h.assetClass] ?? "#6B7280";
            const isExpanded = expandedId === h.poolId;
            const sparkData = sparklines.get(h.poolId) ?? [];

            return (
              <div key={h.poolId}>
                {/* Main row */}
                <div
                  onClick={() => toggleExpand(h.poolId)}
                  className="row-hover grid gap-2 py-3 px-2 items-center rounded-md cursor-pointer"
                  style={{
                    gridTemplateColumns: "2.5fr 1fr 1fr 1fr 1fr 40px",
                    borderBottom: isExpanded ? "none" : "1px solid rgba(232,180,184,0.04)",
                  }}
                >
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ background: color, boxShadow: `0 0 6px ${color}44` }}
                    />
                    <div>
                      <div className="text-[13px] font-semibold text-[#F0EBE0]">{h.poolName}</div>
                      <div className="text-[11px] text-[#5A5347] mt-px">{getAssetClassLabel(h.assetClass)}</div>
                    </div>
                  </div>
                  <div className="text-[13px] font-semibold text-[#F0EBE0] tabular-nums">
                    {formatValue(val)}
                  </div>
                  <div className="text-[13px] text-[#6FCF97] tabular-nums font-medium">
                    {apy > 0 ? `${apy.toFixed(1)}%` : "-"}
                  </div>
                  <div>
                    {h.lockupPeriod > 0 ? (
                      <div className="text-xs text-[#F0EBE0] tabular-nums">{h.lockupPeriod}d</div>
                    ) : (
                      <div className="text-xs text-[#5A5347]">Flex</div>
                    )}
                  </div>
                  <div>
                    {h.isLocked ? (
                      <QGBadge color="#F59E0B">{h.daysRemaining}d left</QGBadge>
                    ) : (
                      <QGBadge color="#6FCF97">Unlocked</QGBadge>
                    )}
                  </div>
                  <div
                    className="flex items-center justify-center text-sm text-[#5A5347] transition-transform duration-300"
                    style={{ transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)" }}
                  >
                    {"\u25BE"}
                  </div>
                </div>

                {/* Expanded detail drawer */}
                <div
                  className="overflow-hidden transition-all duration-300"
                  style={{
                    maxHeight: isExpanded ? 160 : 0,
                    opacity: isExpanded ? 1 : 0,
                  }}
                >
                  <div
                    className="grid gap-5 py-3.5 px-4 mx-1 mb-2 rounded-[10px] items-center"
                    style={{
                      gridTemplateColumns: "1fr 1fr 1fr auto",
                      background: `linear-gradient(135deg, ${color}06, transparent)`,
                      border: `1px solid ${color}10`,
                    }}
                  >
                    <div>
                      <div className="text-[10px] text-[#5A5347] uppercase tracking-[0.1em] mb-1.5">14-Day Trend</div>
                      <QGSparkline data={sparkData} color={color} width={120} height={36} />
                    </div>
                    <div>
                      <div className="text-[10px] text-[#5A5347] uppercase tracking-[0.1em] mb-1.5">Unrealized P&L</div>
                      <div className="text-base font-bold tabular-nums" style={{ color: gain >= 0 ? "#6FCF97" : "#EB5757" }}>
                        {gain >= 0 ? "+" : ""}{gain.toFixed(2)}%
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] text-[#5A5347] uppercase tracking-[0.1em] mb-1.5">
                        {h.isLocked ? "Unlock In" : "Lock Status"}
                      </div>
                      <div className="text-base font-semibold font-sans" style={{ color: h.isLocked ? "#F59E0B" : "#6FCF97" }}>
                        {h.isLocked ? `${h.daysRemaining} days` : "Available"}
                      </div>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); router.push(`/pools/${h.poolId}?action=redeem`); }}
                      disabled={h.isLocked}
                      className={`rounded-lg py-2 px-5 text-xs font-semibold font-sans tracking-wide whitespace-nowrap transition-all duration-200 ${
                        h.isLocked
                          ? "bg-[rgba(232,180,184,0.03)] border border-[rgba(232,180,184,0.06)] text-[#5A5347] cursor-not-allowed"
                          : "bg-[rgba(232,180,184,0.12)] border border-[rgba(232,180,184,0.25)] text-[#E8B4B8] cursor-pointer"
                      }`}
                    >
                      {h.isLocked ? "Locked" : "Redeem"}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
          </div>
        </div>

        {/* Mobile: Card layout (< lg) */}
        <div className="lg:hidden flex flex-col gap-3">
          {reversedHoldings.map((h) => {
            const val = holdingValue(h);
            const apy = parseFloat(h.yieldRatePercent || "0");
            const gain = parseFloat(h.gainPercent);
            const color = ASSET_CLASS_COLORS[h.assetClass] ?? "#6B7280";

            return (
              <div
                key={h.poolId}
                onClick={() => router.push(`/pools/${h.poolId}`)}
                className="rounded-xl px-4 py-4 cursor-pointer"
                style={{
                  background: `linear-gradient(135deg, ${color}08, transparent)`,
                  border: `1px solid ${color}15`,
                }}
              >
                {/* Top: Name + Value */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-2.5 h-2.5 rounded-full shrink-0 mt-1"
                      style={{ background: color, boxShadow: `0 0 8px ${color}44` }}
                    />
                    <div>
                      <div className="text-[14px] font-semibold text-[#F0EBE0]">{h.poolName}</div>
                      <div className="text-[12px] text-[#5A5347] mt-0.5">{getAssetClassLabel(h.assetClass)}</div>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-[16px] font-bold text-[#F0EBE0] tabular-nums">{formatValue(val)}</div>
                    <div
                      className="text-[12px] font-semibold tabular-nums mt-0.5"
                      style={{ color: gain >= 0 ? "#6FCF97" : "#EB5757" }}
                    >
                      {gain >= 0 ? "+" : ""}{gain.toFixed(2)}%
                    </div>
                  </div>
                </div>

                {/* Bottom: APY | Lock | Status */}
                <div className="flex items-center gap-3 pt-2.5" style={{ borderTop: `1px solid ${color}10` }}>
                  <div className="flex-1">
                    <div className="text-[9px] text-[#5A5347] uppercase tracking-widest">APY</div>
                    <div className="text-[13px] text-[#6FCF97] font-semibold tabular-nums">
                      {apy > 0 ? `${apy.toFixed(1)}%` : "-"}
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="text-[9px] text-[#5A5347] uppercase tracking-widest">Lock</div>
                    <div className="text-[13px] text-[#F0EBE0] tabular-nums">
                      {h.lockupPeriod > 0 ? `${h.lockupPeriod}d` : "Flex"}
                    </div>
                  </div>
                  <div>
                    {h.isLocked ? (
                      <QGBadge color="#F59E0B">{h.daysRemaining}d left</QGBadge>
                    ) : (
                      <QGBadge color="#6FCF97">Unlocked</QGBadge>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </QGPanel>
  );
}

/* ── Risk Radar ───────────────────────────────────────────────────────── */

function RiskRadar({ healthScore }: { healthScore: number }) {
  const volatility = healthScore > 80 ? "Low" : healthScore > 50 ? "Medium" : "High";
  const liquidity = healthScore > 60 ? "High" : "Medium";
  const exposure = healthScore > 70 ? "Balanced" : "Concentrated";

  const indicators = [
    { label: "Volatility", value: volatility, color: volatility === "Low" ? "#6FCF97" : volatility === "Medium" ? "#F59E0B" : "#EB5757" },
    { label: "Liquidity", value: liquidity, color: liquidity === "High" ? "#E8B4B8" : "#F59E0B" },
    { label: "Exposure", value: exposure, color: exposure === "Balanced" ? "#E8B4B8" : "#F59E0B" },
  ];

  return (
    <QGPanel label="Risk Radar" hover>
      <div className="flex flex-col items-center gap-5 pt-1">
        <QGGauge value={healthScore} label="HEALTH" />
        <div className="flex gap-6 w-full justify-center pt-1 border-t border-[var(--border-subtle)]">
          {indicators.map((ind) => (
            <div key={ind.label} className="text-center pt-3">
              <div className="text-sm font-bold font-sans" style={{ color: ind.color }}>
                {ind.value}
              </div>
              <div className="text-[10px] text-[#5A5347] mt-1 uppercase tracking-[0.1em] font-medium">
                {ind.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </QGPanel>
  );
}

/* ── Return Bars ──────────────────────────────────────────────────────── */

function ReturnBars({ holdings }: { holdings: PortfolioHolding[] }) {
  const returnsByClass = useMemo(() => {
    const map = new Map<string, { gains: number[]; color: string }>();
    for (const h of holdings) {
      const entry = map.get(h.assetClass) ?? { gains: [], color: ASSET_CLASS_COLORS[h.assetClass] ?? "#6B7280" };
      entry.gains.push(parseFloat(h.gainPercent));
      map.set(h.assetClass, entry);
    }
    return Array.from(map.entries()).map(([slug, { gains, color }]) => ({
      name: getAssetClassLabel(slug),
      ret: gains.reduce((s, v) => s + v, 0) / gains.length,
      color,
    }));
  }, [holdings]);

  const maxRet = Math.max(...returnsByClass.map((r) => Math.abs(r.ret)), 1);

  return (
    <QGPanel label="30-Day Return" hover>
      <div className="flex flex-col gap-3.5 mt-1">
        {returnsByClass.map((r, i) => (
          <QGProgressBar
            key={r.name}
            label={r.name}
            value={Math.abs(r.ret)}
            max={maxRet}
            color={r.color}
            height={10}
            delay={0.3 + i * 0.15}
          />
        ))}
      </div>
    </QGPanel>
  );
}

/* ── Rich Portfolio Content: "The Vault" ──────────────────────────────── */

function PortfolioContent({ portfolio }: { portfolio: PortfolioData }) {
  const { summary, holdings } = portfolio;

  const {
    balanceNum: walletBalance,
    isLoading: isBalanceLoading,
    requestFaucet,
    isFaucetLoading,
    cooldownRemaining,
    isOnCooldown,
  } = useWalletBalance();

  const investedValueNum = Number(BigInt(summary.totalCurrentValue)) / 1e6;
  const totalValueNum = investedValueNum + walletBalance;
  const animatedTotal = useAnimatedValue(totalValueNum, 2500);
  const gainPercent = parseFloat(summary.totalGainPercent);
  const isPositive = gainPercent >= 0;

  const heroDisplay = formatHeroValue(animatedTotal);
  const allocationSegments = computeAllocationSegments(holdings);

  const donutSegments = useMemo(() => {
    const segments = [...allocationSegments];
    if (walletBalance > 0 || segments.length === 0) {
      segments.push({ label: "Available", value: Math.max(walletBalance, 0.01), color: "#3A3530" });
    }
    return segments;
  }, [allocationSegments, walletBalance]);
  const heatmapData = useMemo(() => generateHeatmap(holdings), [holdings]);
  const healthScore = useMemo(() => computeHealthScore(holdings), [holdings]);

  return (
    <PageLayout
      title="Portfolio"
      subtitle="Overview of your investments"
      actions={
        <Link href="/pools" className="no-underline">
          <QGButton>Invest More</QGButton>
        </Link>
      }
    >
      {/* ── Row 1: Hero with embedded Health Ring ── */}
      <QGScrollReveal>
        <div className="fb-luxe-card fb-shine fb-iri noise-overlay hero-inner-glow relative overflow-hidden rounded-2xl px-8 py-10">
          {/* Watermark ghost */}
          <div
            className="absolute inset-0 flex items-center justify-center pointer-events-none select-none"
            aria-hidden="true"
          >
            <span
              className="text-[200px] font-serif font-bold"
              style={{ color: "rgba(240,235,224,0.03)" }}
            >
              {heroDisplay.shortLabel}
            </span>
          </div>

          <div className="relative flex items-center justify-between gap-8">
            {/* Left: Value + Gain */}
            <div className="flex-1 text-center lg:text-left">
              <div className="text-[10px] tracking-[0.18em] uppercase text-[#B8A99A] font-semibold font-sans mb-3">
                Total Balance
              </div>
              <div
                className="font-serif font-bold text-[#F0EBE0] tabular-nums leading-none"
                style={{ fontSize: "clamp(48px, 8vw, 76px)" }}
              >
                {heroDisplay.main}
                <span style={{ opacity: 0.3, fontSize: "0.5em" }}>{heroDisplay.cents}</span>
              </div>
              <div
                className="mt-4 inline-flex items-center gap-2 text-lg font-semibold tabular-nums"
                style={{ color: isPositive ? "#6FCF97" : "#EB5757" }}
              >
                <span
                  className="inline-flex items-center justify-center w-[26px] h-[26px] rounded-full text-sm"
                  style={{ background: isPositive ? "rgba(111,207,151,0.12)" : "rgba(235,87,87,0.12)" }}
                >
                  {isPositive ? "\u2191" : "\u2193"}
                </span>
                {isPositive ? "+" : ""}{gainPercent.toFixed(2)}%
                <span className="text-sm text-[#B8A99A] font-normal ml-1">30d</span>
              </div>

              {/* Sub-values: Invested | Available */}
              <div className="mt-5 flex items-center gap-4 flex-wrap justify-center lg:justify-start">
                <div className="text-sm">
                  <span className="text-[#B8A99A]">Invested: </span>
                  <span className="font-semibold text-[#F0EBE0] tabular-nums">
                    {formatValue(investedValueNum)}
                  </span>
                </div>
                <div className="w-px h-4 bg-[rgba(232,180,184,0.1)]" />
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-[#B8A99A]">Available: </span>
                  <span className="font-semibold text-forge-teal tabular-nums">
                    {isBalanceLoading ? "..." : formatValue(walletBalance)} USDC
                  </span>
                  <button
                    onClick={requestFaucet}
                    disabled={isFaucetLoading || isOnCooldown}
                    className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium border transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed bg-forge-teal/5 border-forge-teal/20 text-forge-teal hover:bg-forge-teal/10"
                  >
                    {isFaucetLoading ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <Droplets className="h-3 w-3" />
                    )}
                    {isFaucetLoading
                      ? "Minting..."
                      : isOnCooldown
                      ? `Wait ${cooldownRemaining}s`
                      : "Get Test USDC"}
                  </button>
                </div>
              </div>
            </div>

            {/* Right: Health Ring + Indicators */}
            <div className="hidden lg:flex flex-col items-center gap-3 shrink-0">
              <QGGauge value={healthScore} label="HEALTH" size={100} />
              <div className="flex gap-4">
                {[
                  { label: "Vol", value: healthScore > 80 ? "Low" : healthScore > 50 ? "Med" : "High", color: healthScore > 80 ? "#6FCF97" : healthScore > 50 ? "#F59E0B" : "#EB5757" },
                  { label: "Liq", value: healthScore > 60 ? "High" : "Med", color: healthScore > 60 ? "#E8B4B8" : "#F59E0B" },
                  { label: "Exp", value: healthScore > 70 ? "Bal" : "Conc", color: healthScore > 70 ? "#E8B4B8" : "#F59E0B" },
                ].map((ind) => (
                  <div key={ind.label} className="text-center">
                    <div className="text-xs font-bold font-sans" style={{ color: ind.color }}>
                      {ind.value}
                    </div>
                    <div className="text-[9px] text-[#5A5347] mt-0.5 uppercase tracking-[0.08em]">
                      {ind.label}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </QGScrollReveal>

      {/* ── Row 2: Allocation (1/3) | Active Investments (2/3) ── */}
      <QGScrollReveal staggerIndex={2} direction="left">
        <div className="grid-sidebar">
          <QGPanel label="Allocation" hover>
            <QGDonutRing
              segments={donutSegments}
              centerValue={formatValue(totalValueNum)}
              centerLabel="TOTAL"
            />
          </QGPanel>
          {holdings.length > 0 ? (
            <ExpandableHoldingsTable holdings={holdings} />
          ) : (
            <QGPanel accent className="text-center px-6 py-10">
              <p className="text-lg font-serif text-[#F0EBE0] mb-2">Start Investing</p>
              <p className="text-sm text-[#B8A99A] mb-5">Explore tokenized real-world assets and build your portfolio.</p>
              <Link href="/pools" className="no-underline">
                <QGButton>Explore Pools</QGButton>
              </Link>
            </QGPanel>
          )}
        </div>
      </QGScrollReveal>

      {/* ── Row 3: Return Bars (1/3) | Yield Matrix (2/3) ── */}
      {holdings.length > 0 && (
        <QGScrollReveal staggerIndex={3} direction="right">
          <div className="grid-sidebar">
            <ReturnBars holdings={holdings} />
            <YieldMatrix holdings={holdings} data={heatmapData} />
          </div>
        </QGScrollReveal>
      )}

      {/* ── Row 5: Live Feed (full-width) ── */}
      <QGScrollReveal staggerIndex={4}>
        <QGPanel label="Live Feed" hover>
          <QGFeed items={FEED_EVENTS} />
        </QGPanel>
      </QGScrollReveal>
    </PageLayout>
  );
}
