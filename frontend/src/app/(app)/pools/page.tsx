"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { poolApi, type Pool } from "@/lib/api";
import { ASSET_CLASSES, type AssetClassConfig } from "@/config/pools.config";
import { MOCK_POOLS, formatLargeValue } from "@/data/mockPools";
import { QGPanel } from "@/components/previews/quantum-grid/primitives/QGPanel";
import { QGScrollReveal } from "@/components/previews/quantum-grid/primitives/QGScrollReveal";
import { PageLayout } from "@/components/layout/PageLayout";
import { Skeleton } from "@/components/ui/Skeleton";
import { AnimatedNumber } from "@/components/ui/AnimatedNumber";

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
        <div className="flex flex-col gap-3">
          <Skeleton height={24} width="40%" />
          <Skeleton height={14} width="60%" />
        </div>
      </QGPanel>
      <div className="grid-2col">
        {Array.from({ length: 4 }).map((_, i) => (
          <QGPanel key={i}>
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-4">
                <Skeleton width={52} height={52} rounded="lg" />
                <div className="flex-1 flex flex-col gap-2">
                  <Skeleton height={18} width="70%" />
                  <Skeleton height={14} width="50%" />
                </div>
              </div>
              <Skeleton height={12} width="90%" />
              <Skeleton height={12} width="60%" />
              <div className="grid grid-cols-4 gap-3 pt-2">
                {Array.from({ length: 4 }).map((_, j) => (
                  <Skeleton key={j} height={32} />
                ))}
              </div>
            </div>
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

/* ── Category Overview Card ────────────────────────────────────────────── */

function CategoryOverviewCard({
  config,
  stats,
  topPools,
  featured = false,
}: {
  config: AssetClassConfig;
  stats?: CategoryStats;
  topPools?: Pool[];
  featured?: boolean;
}) {
  const Icon = config.icon;
  const rgb = config.glowRgb;

  return (
    <Link href={config.href} className="no-underline block">
      <div
        className={`card-hover cursor-pointer rounded-[14px] relative overflow-hidden ${
          featured ? "px-7 pt-7 pb-6" : "px-6 pt-6 pb-5"
        }`}
        style={{
          background: featured
            ? `linear-gradient(135deg, rgba(${rgb}, 0.08) 0%, rgba(201,160,220,0.04) 40%, rgba(124,58,237,0.06) 100%)`
            : `linear-gradient(135deg, rgba(201,160,220,0.06) 0%, rgba(232,180,184,0.04) 40%, rgba(124,58,237,0.05) 100%)`,
          border: `1px solid rgba(${rgb}, ${featured ? "0.18" : "0.12"})`,
        }}
      >
        {/* Ambient corner glow */}
        <div
          className={`absolute -top-[60px] -right-[60px] rounded-full pointer-events-none ${
            featured ? "w-[280px] h-[280px]" : "w-[200px] h-[200px]"
          }`}
          style={{ background: `radial-gradient(circle, rgba(${rgb}, ${featured ? "0.12" : "0.08"}) 0%, transparent 70%)` }}
        />

        {/* Featured badge */}
        {featured && (
          <div
            className="absolute top-4 right-5 text-[9px] font-bold uppercase tracking-[0.15em] px-2.5 py-1 rounded-full"
            style={{
              background: `rgba(${rgb}, 0.10)`,
              border: `1px solid rgba(${rgb}, 0.15)`,
              color: `rgb(${rgb})`,
            }}
          >
            Highest TVL
          </div>
        )}

        <div className="relative">
          {/* Icon + Title + Tagline */}
          <div className="flex items-center gap-4 mb-4">
            <div
              className={`rounded-[12px] flex items-center justify-center shrink-0 ${
                featured ? "w-[60px] h-[60px]" : "w-[52px] h-[52px]"
              }`}
              style={{ background: `rgba(${rgb}, 0.08)`, border: `1px solid rgba(${rgb}, 0.12)` }}
            >
              <Icon size={featured ? 30 : 26} style={{ color: `rgb(${rgb})` }} />
            </div>
            <div>
              <div className={`font-semibold text-[#F0EBE0] font-serif ${featured ? "text-[26px]" : "text-[22px]"}`}>
                {config.label}
              </div>
              <div className="text-[14px] text-[#B8A99A]">{config.description}</div>
            </div>
          </div>

          {/* Details paragraph */}
          <p className="text-[13px] text-[#706860] leading-relaxed m-0 mb-5">
            {config.details}
          </p>

          {/* 2x2 stats grid */}
          {stats && (
            <div
              className="grid grid-cols-2 gap-x-6 gap-y-3 pt-4 mb-4"
              style={{ borderTop: `1px solid rgba(${rgb}, 0.06)` }}
            >
              <div>
                <div className="text-[10px] text-[#5A5347] uppercase tracking-widest mb-1">Avg APY</div>
                <div className={`font-bold tabular-nums font-sans text-[#6FCF97] ${featured ? "text-[22px]" : "text-[18px]"}`}>
                  {stats.averageApy.toFixed(1)}%
                </div>
              </div>
              <div>
                <div className="text-[10px] text-[#5A5347] uppercase tracking-widest mb-1">TVL</div>
                <div className={`font-semibold tabular-nums font-sans text-[#F0EBE0] ${featured ? "text-[22px]" : "text-[18px]"}`}>
                  {formatLargeValue(stats.totalTvl)}
                </div>
              </div>
              <StatCell label="Pools" value={String(stats.poolCount)} />
              <StatCell label="Risk" value={config.riskLevel} valueColor={config.riskColor} />
            </div>
          )}

          {/* Mini pool previews */}
          {topPools && topPools.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-4">
              {topPools.slice(0, 3).map((pool) => (
                <span
                  key={pool.id}
                  className="text-[11px] px-2.5 py-1 rounded-full font-medium"
                  style={{
                    background: `rgba(${rgb}, 0.06)`,
                    border: `1px solid rgba(${rgb}, 0.10)`,
                    color: `rgb(${rgb})`,
                  }}
                >
                  {pool.name}
                </span>
              ))}
              {topPools.length > 3 && (
                <span className="text-[11px] px-2.5 py-1 rounded-full text-[#5A5347]">
                  +{topPools.length - 3} more
                </span>
              )}
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

  /* Build pools-by-category lookup */
  const poolsByCategory = new Map<string, Pool[]>();
  for (const pool of pools) {
    const list = poolsByCategory.get(pool.assetClass) || [];
    list.push(pool);
    poolsByCategory.set(pool.assetClass, list);
  }

  /* Sort categories by TVL (highest first) */
  const sortedCategories = [...ASSET_CLASSES].sort((a, b) => {
    const tvlA = categoryMap.get(a.slug)?.totalTvl ?? BigInt(0);
    const tvlB = categoryMap.get(b.slug)?.totalTvl ?? BigInt(0);
    if (tvlB > tvlA) return 1;
    if (tvlB < tvlA) return -1;
    return 0;
  });

  return (
    <PageLayout
      title="Investment Pools"
      subtitle="Tokenized assets on Avalanche"
      actions={
        <>
          <InlinePill label="TVL">
            <AnimatedNumber
              value={tvlNumber}
              format={(v) => `$${(v / 1_000_000).toFixed(1)}M`}
              className="text-[15px] font-bold font-sans text-[#F0EBE0]"
            />
          </InlinePill>
          <InlinePill label="Pools" value={String(totalPools)} />
          <InlinePill label="Avg APY">
            <AnimatedNumber
              value={averageApy}
              format={(v) => `${v.toFixed(1)}%`}
              className="text-[15px] font-bold font-sans text-[#6FCF97]"
              delay={200}
            />
          </InlinePill>
        </>
      }
    >
      <div className="flex flex-col gap-5">
        {sortedCategories.map((ac, i) => (
          <QGScrollReveal key={ac.slug} staggerIndex={i + 1} direction={i % 2 === 0 ? "left" : "right"}>
            <CategoryOverviewCard
              config={ac}
              stats={categoryMap.get(ac.slug)}
              topPools={poolsByCategory.get(ac.slug)}
              featured={i === 0}
            />
          </QGScrollReveal>
        ))}
      </div>
    </PageLayout>
  );
}

/* ── Inline Pill ──────────────────────────────────────────────────────── */

function InlinePill({ label, value, valueColor, children }: { label: string; value?: string; valueColor?: string; children?: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 px-3.5 py-2 rounded-[10px] bg-[rgba(232,180,184,0.04)] border border-[rgba(232,180,184,0.08)]">
      <span className="text-[10px] text-[#5A5347] uppercase tracking-widest font-medium">
        {label}
      </span>
      {children ?? (
        <span
          className="text-[15px] font-bold tabular-nums font-sans"
          style={{ color: valueColor ?? "#F0EBE0" }}
        >
          {value}
        </span>
      )}
    </div>
  );
}
