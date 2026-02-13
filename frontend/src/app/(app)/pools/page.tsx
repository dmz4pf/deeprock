"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { poolApi, type Pool } from "@/lib/api";
import { ASSET_CLASSES, type AssetClassConfig } from "@/config/pools.config";
import { MOCK_POOLS, formatLargeValue } from "@/data/mockPools";
import { QGPanel } from "@/components/previews/quantum-grid/primitives/QGPanel";
import { QGScrollReveal } from "@/components/previews/quantum-grid/primitives/QGScrollReveal";
import { useAnimatedValue } from "@/components/previews/quantum-grid/hooks/useAnimatedValue";
import { PageLayout } from "@/components/layout/PageLayout";

/* ── Stats helpers ─────────────────────────────────────────────────────── */

interface CategoryStats {
  poolCount: number;
  totalTvl: bigint;
  averageApy: number;
}

function computeCategoryStats(pools: Pool[]): Map<string, CategoryStats> {
  const map = new Map<string, CategoryStats>();
  for (const pool of pools) {
    const existing = map.get(pool.assetClass);
    const tvl = BigInt(pool.totalValue);
    if (existing) {
      existing.poolCount++;
      existing.totalTvl += tvl;
      existing.averageApy += pool.yieldRate;
    } else {
      map.set(pool.assetClass, { poolCount: 1, totalTvl: tvl, averageApy: pool.yieldRate });
    }
  }
  for (const [, stats] of map) {
    if (stats.poolCount > 0) stats.averageApy /= stats.poolCount;
  }
  return map;
}

function computeGlobalStats(categoryMap: Map<string, CategoryStats>) {
  let totalTvl = BigInt(0);
  let totalPools = 0;
  let apySum = 0;
  let apyCount = 0;
  for (const [, stats] of categoryMap) {
    totalTvl += stats.totalTvl;
    totalPools += stats.poolCount;
    apySum += stats.averageApy * stats.poolCount;
    apyCount += stats.poolCount;
  }
  return { totalTvl, totalPools, averageApy: apyCount > 0 ? apySum / apyCount : 0 };
}

/* ── Page Shell ────────────────────────────────────────────────────────── */

export default function PoolsPage() {
  const [pools, setPools] = useState<Pool[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchPools = async () => {
      try {
        const { pools } = await poolApi.list();
        setPools(pools);
      } catch {
        setPools(MOCK_POOLS);
      } finally {
        setIsLoading(false);
      }
    };
    fetchPools();
  }, []);

  if (isLoading) return <PoolsLoadingSkeleton />;
  return <PoolsContent pools={pools} />;
}

function PoolsLoadingSkeleton() {
  return (
    <div className="flex flex-col gap-[var(--page-gap)]">
      <QGPanel variant="hero" accent>
        <div className="h-[72px] rounded-lg bg-[rgba(232,180,184,0.02)]" />
      </QGPanel>
      <div className="grid-2col">
        {Array.from({ length: 4 }).map((_, i) => (
          <QGPanel key={i}>
            <div className="h-[180px] rounded-lg bg-[rgba(232,180,184,0.02)]" />
          </QGPanel>
        ))}
      </div>
    </div>
  );
}

function StatCell({ label, value, valueColor }: { label: string; value: string; valueColor?: string }) {
  return (
    <div>
      <div className="text-[10px] text-[#5A5347] uppercase tracking-widest mb-1">
        {label}
      </div>
      <div
        className={`text-[15px] font-semibold tabular-nums font-sans ${label === "Risk" ? "capitalize" : ""}`}
        style={{ color: valueColor ?? "#F0EBE0" }}
      >
        {value}
      </div>
    </div>
  );
}

/* ── Category Overview Card (shown when "All" is selected) ────────────── */

function CategoryOverviewCard({ config, stats }: { config: AssetClassConfig; stats?: CategoryStats }) {
  const Icon = config.icon;
  const rgb = config.glowRgb;

  return (
    <Link href={config.href} className="no-underline block">
      <div
        className="card-hover cursor-pointer rounded-[14px] px-8 pt-8 pb-7 relative overflow-hidden"
        style={{
          background: `linear-gradient(180deg, var(--elevation-1) 0%, var(--elevation-0) 100%)`,
          border: `1px solid rgba(${rgb}, 0.12)`,
        }}
      >
        {/* Ambient corner glow */}
        <div
          className="absolute -top-[60px] -right-[60px] w-[200px] h-[200px] rounded-full pointer-events-none"
          style={{ background: `radial-gradient(circle, rgba(${rgb}, 0.08) 0%, transparent 70%)` }}
        />

        <div className="relative">
          {/* Icon + Title + Tagline */}
          <div className="flex items-center gap-4 mb-4">
            <div
              className="w-[52px] h-[52px] rounded-[12px] flex items-center justify-center shrink-0"
              style={{ background: `rgba(${rgb}, 0.08)`, border: `1px solid rgba(${rgb}, 0.12)` }}
            >
              <Icon size={26} style={{ color: `rgb(${rgb})` }} />
            </div>
            <div>
              <div className="text-[22px] font-semibold text-[#F0EBE0] font-serif">{config.label}</div>
              <div className="text-[14px] text-[#B8A99A]">{config.description}</div>
            </div>
          </div>

          {/* Details paragraph */}
          <p className="text-[13px] text-[#706860] leading-relaxed m-0 mb-5">
            {config.details}
          </p>

          {/* 4-column stats row */}
          {stats && (
            <div
              className="grid grid-cols-4 gap-x-6 pt-4 mb-4"
              style={{ borderTop: `1px solid rgba(${rgb}, 0.06)` }}
            >
              <StatCell label="Pools" value={String(stats.poolCount)} />
              <StatCell label="Avg APY" value={`${stats.averageApy.toFixed(1)}%`} valueColor="#6FCF97" />
              <StatCell label="TVL" value={formatLargeValue(stats.totalTvl)} />
              <StatCell label="Risk" value={config.riskLevel} valueColor={config.riskColor} />
            </div>
          )}

          {/* Explore link */}
          <div className="flex items-center gap-1.5" style={{ color: `rgb(${rgb})` }}>
            <span className="text-[13px] font-semibold font-sans">
              Explore {config.label}
            </span>
            <span className="text-sm">→</span>
          </div>
        </div>
      </div>
    </Link>
  );
}

/* ── Main Content: "The Gallery" ──────────────────────────────────────── */

function PoolsContent({ pools }: { pools: Pool[] }) {
  const categoryMap = computeCategoryStats(pools);
  const { totalTvl, totalPools, averageApy } = computeGlobalStats(categoryMap);

  const tvlNumber = Number(totalTvl) / 1e6;
  const animatedTvl = useAnimatedValue(tvlNumber, 2000);

  return (
    <PageLayout
      title="Investment Pools"
      subtitle="Tokenized assets on Avalanche"
      actions={
        <>
          <InlinePill label="TVL" value={`$${(animatedTvl / 1_000_000).toFixed(1)}M`} />
          <InlinePill label="Pools" value={String(totalPools)} />
          <InlinePill label="Avg APY" value={`${averageApy.toFixed(1)}%`} valueColor="#6FCF97" />
        </>
      }
    >
      <QGScrollReveal staggerIndex={1}>
        <div className="flex flex-col gap-5">
          {ASSET_CLASSES.map((ac) => (
            <CategoryOverviewCard key={ac.slug} config={ac} stats={categoryMap.get(ac.slug)} />
          ))}
        </div>
      </QGScrollReveal>
    </PageLayout>
  );
}

/* ── Inline Pill ──────────────────────────────────────────────────────── */

function InlinePill({ label, value, valueColor }: { label: string; value: string; valueColor?: string }) {
  return (
    <div className="flex items-center gap-2 px-3.5 py-2 rounded-[10px] bg-[rgba(232,180,184,0.04)] border border-[rgba(232,180,184,0.08)]">
      <span className="text-[10px] text-[#5A5347] uppercase tracking-widest font-medium">
        {label}
      </span>
      <span
        className="text-[15px] font-bold tabular-nums font-sans"
        style={{ color: valueColor ?? "#F0EBE0" }}
      >
        {value}
      </span>
    </div>
  );
}
