"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Search, ArrowLeft } from "lucide-react";
import { poolApi, type Pool } from "@/lib/api";
import { getAssetClassBySlug } from "@/config/pools.config";
import { MOCK_POOLS, formatLargeValue } from "@/data/mockPools";
import { QGBadge } from "@/components/previews/quantum-grid/primitives/QGBadge";
import { QGProgressBar } from "@/components/previews/quantum-grid/primitives/QGProgressBar";
import { QGInput } from "@/components/previews/quantum-grid/primitives/QGInput";
import { QGScrollReveal } from "@/components/previews/quantum-grid/primitives/QGScrollReveal";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";

const RISK_COLORS: Record<string, string> = {
  low: "#6FCF97",
  medium: "#F59E0B",
  high: "#EB5757",
};

function computeUtilization(pool: Pool): number {
  const total = BigInt(pool.totalValue);
  if (total === BigInt(0)) return 0;
  const available = BigInt(pool.availableCapacity);
  return Number((total - available) * BigInt(100) / total);
}

/* ── Stat Cell ──────────────────────────────────────────────────────── */

function StatCell({ label, value, valueColor }: { label: string; value: string; valueColor?: string }) {
  return (
    <div>
      <div className="text-[10px] text-[#5A5347] uppercase tracking-widest mb-1">
        {label}
      </div>
      <div
        className="text-[15px] font-semibold tabular-nums font-sans"
        style={{ color: valueColor ?? "#F0EBE0" }}
      >
        {value}
      </div>
    </div>
  );
}

/* ── Pool Card Skeleton ─────────────────────────────────────────────── */

function PoolCardSkeleton({ rgb }: { rgb: string }) {
  return (
    <div
      className="rounded-[14px] px-6 pt-6 pb-5 relative overflow-hidden"
      style={{
        background: `linear-gradient(180deg, var(--elevation-1) 0%, var(--elevation-0) 100%)`,
        border: `1px solid rgba(${rgb}, 0.08)`,
      }}
    >
      <div className="flex flex-col gap-3">
        <Skeleton height={18} width="60%" />
        <Skeleton height={14} width="40%" />
        <Skeleton height={14} width="80%" />
        <Skeleton height={6} width="100%" rounded="sm" />
      </div>
    </div>
  );
}

/* ── Pool Card — Premium ────────────────────────────────────────────── */

function PoolCard({ pool, index, categoryRgb }: { pool: Pool; index: number; categoryRgb: string }) {
  const rgb = categoryRgb;
  const riskColor = RISK_COLORS[pool.riskRating] || RISK_COLORS.low;
  const utilization = computeUtilization(pool);
  const tvl = formatLargeValue(BigInt(pool.totalValue));

  return (
    <QGScrollReveal staggerIndex={index}>
      <Link href={`/pools/${pool.id}`} className="no-underline block">
        <div
          className="card-hover cursor-pointer rounded-[14px] px-6 pt-6 pb-5 relative overflow-hidden"
          style={{
            background: `linear-gradient(180deg, var(--elevation-1) 0%, var(--elevation-0) 100%)`,
            border: `1px solid rgba(${rgb}, 0.12)`,
          }}
        >
          {/* Ambient glow */}
          <div
            className="absolute -top-[40px] -right-[40px] w-[160px] h-[160px] rounded-full pointer-events-none"
            style={{ background: `radial-gradient(circle, rgba(${rgb}, 0.08) 0%, transparent 70%)` }}
          />

          <div className="relative">
            {/* Header: Pool name + APY hero */}
            <div className="flex justify-between items-start mb-3">
              <h3 className="text-[16px] font-semibold text-[#F0EBE0] m-0 font-serif leading-snug pr-4">
                {pool.name}
              </h3>
              <div className="text-right shrink-0">
                <div className="text-2xl font-bold text-forge-teal tabular-nums font-sans leading-none">
                  {pool.yieldRate}%
                </div>
                <div className="text-[10px] text-[#5A5347] uppercase tracking-widest mt-1">APY</div>
              </div>
            </div>

            {/* Stats row: TVL | Risk | Lockup */}
            <div
              className="grid grid-cols-3 gap-4 pt-3 mb-3"
              style={{ borderTop: `1px solid rgba(${rgb}, 0.06)` }}
            >
              <div>
                <div className="text-[10px] text-[#5A5347] uppercase tracking-widest mb-1">TVL</div>
                <div className="text-[15px] font-semibold text-[#F0EBE0] tabular-nums">{tvl}</div>
              </div>
              <div>
                <div className="text-[10px] text-[#5A5347] uppercase tracking-widest mb-1">Risk</div>
                <QGBadge color={riskColor} variant="dot">{pool.riskRating}</QGBadge>
              </div>
              <div>
                <div className="text-[10px] text-[#5A5347] uppercase tracking-widest mb-1">Lock</div>
                <QGBadge
                  color={pool.lockupPeriod > 0 ? "#F59E0B" : "#6FCF97"}
                  variant="outline"
                >
                  {pool.lockupPeriod > 0 ? `${pool.lockupPeriod}d` : "Flex"}
                </QGBadge>
              </div>
            </div>

            {/* Capacity bar — category-colored */}
            <QGProgressBar label="Capacity" value={utilization} color={`rgb(${rgb})`} height={4} showValue />

            {/* View Pool CTA */}
            <div className="flex items-center gap-1.5 mt-3" style={{ color: `rgb(${rgb})` }}>
              <span className="text-[13px] font-semibold font-sans">View Pool</span>
              <span className="text-sm">→</span>
            </div>
          </div>
        </div>
      </Link>
    </QGScrollReveal>
  );
}

/* ── Category Page ──────────────────────────────────────────────────── */

export function QGCategoryPageLive({ slug }: { slug: string }) {
  const [pools, setPools] = useState<Pool[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const config = getAssetClassBySlug(slug);

  useEffect(() => {
    const fetchPools = async () => {
      try {
        const { pools: fetched } = await poolApi.list({ assetClass: slug });
        setPools(fetched);
      } catch {
        setPools(MOCK_POOLS.filter(p => p.assetClass === slug));
      } finally {
        setIsLoading(false);
      }
    };
    fetchPools();
  }, [slug]);

  const filtered = pools.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  const rgb = config?.glowRgb || "232,180,184";
  const ConfigIcon = config?.icon;

  // Category-level aggregates
  const totalTvl = formatLargeValue(
    filtered.reduce((sum, p) => sum + BigInt(p.totalValue), BigInt(0))
  );
  const avgApy = filtered.length > 0
    ? filtered.reduce((sum, p) => sum + p.yieldRate, 0) / filtered.length
    : 0;

  return (
    <div className="max-w-[var(--page-max-width)] mx-auto px-4 sm:px-6 w-full py-6 flex flex-col gap-6">
      {/* Back link */}
      <div className="page-enter-up">
        <Link
          href="/pools"
          className="inline-flex items-center gap-2 text-sm text-[#B8A99A] hover:text-[#F0EBE0] transition-colors duration-200 group no-underline w-fit"
        >
          <span className="flex items-center justify-center h-7 w-7 rounded-full bg-[rgba(232,180,184,0.06)] group-hover:bg-[rgba(232,180,184,0.12)] transition-colors duration-200">
            <ArrowLeft size={14} className="text-[#B8A99A] group-hover:text-[#E8B4B8] transition-colors" />
          </span>
          <span className="font-medium tracking-wide">Back to Pools</span>
        </Link>
      </div>

      {/* Category header — premium */}
      <QGScrollReveal>
        <div
          className="card-hover rounded-[14px] px-8 pt-7 pb-6 relative overflow-hidden"
          style={{
            background: `linear-gradient(180deg, var(--elevation-1) 0%, var(--elevation-0) 100%)`,
            border: `1px solid rgba(${rgb}, 0.12)`,
          }}
        >
          {/* Ambient glow */}
          <div
            className="absolute -top-[60px] -right-[60px] w-[200px] h-[200px] rounded-full pointer-events-none"
            style={{ background: `radial-gradient(circle, rgba(${rgb}, 0.08) 0%, transparent 70%)` }}
          />

          <div className="relative">
            {/* Icon + Title */}
            <div className="flex items-center gap-4 mb-2">
              {ConfigIcon && (
                <div
                  className="w-[48px] h-[48px] rounded-[12px] flex items-center justify-center shrink-0"
                  style={{ background: `rgba(${rgb}, 0.08)`, border: `1px solid rgba(${rgb}, 0.12)` }}
                >
                  <ConfigIcon size={24} style={{ color: `rgb(${rgb})` }} />
                </div>
              )}
              <div>
                <h1 className="text-[24px] font-semibold text-[#F0EBE0] font-serif m-0">
                  {config?.label || slug}
                </h1>
                {config?.description && (
                  <p className="text-[13px] text-[#5A5347] m-0 mt-1">{config.description}</p>
                )}
              </div>
            </div>

            {/* Summary stats */}
            {!isLoading && filtered.length > 0 && (
              <div
                className="grid grid-cols-3 gap-6 pt-4 mt-4"
                style={{ borderTop: `1px solid rgba(${rgb}, 0.06)` }}
              >
                <StatCell label="Pools" value={String(filtered.length)} />
                <StatCell label="Total TVL" value={totalTvl} />
                <StatCell label="Avg APY" value={`${avgApy.toFixed(1)}%`} valueColor="#6FCF97" />
              </div>
            )}
          </div>
        </div>
      </QGScrollReveal>

      {/* Search */}
      <QGScrollReveal staggerIndex={1}>
        <QGInput
          placeholder="Search pools..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          icon={<Search size={16} />}
        />
      </QGScrollReveal>

      {/* Pool grid */}
      {isLoading ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 24 }}>
          {[0, 1, 2].map(i => <PoolCardSkeleton key={i} rgb={rgb} />)}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon="search"
          title={search ? "No Results" : "No Pools Available"}
          description={search ? `No pools matching "${search}" in this category.` : "No pools are currently available in this category."}
        />
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 24 }}>
          {filtered.map((pool, i) => (
            <PoolCard key={pool.id} pool={pool} index={i + 2} categoryRgb={rgb} />
          ))}
        </div>
      )}
    </div>
  );
}
