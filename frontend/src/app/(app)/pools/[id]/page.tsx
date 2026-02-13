"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { InvestmentForm } from "@/components/features/pools/InvestmentForm";
import { RedemptionForm } from "@/components/features/pools/RedemptionForm";
import { SlideDrawer } from "@/components/layout";
import { QGPanel } from "@/components/previews/quantum-grid/primitives/QGPanel";
import { QGChart } from "@/components/previews/quantum-grid/primitives/QGChart";
import { QGBadge } from "@/components/previews/quantum-grid/primitives/QGBadge";
import { QGProgressBar } from "@/components/previews/quantum-grid/primitives/QGProgressBar";

import { QGScrollReveal } from "@/components/previews/quantum-grid/primitives/QGScrollReveal";
import { useAnimatedValue } from "@/components/previews/quantum-grid/hooks/useAnimatedValue";
import { poolApi, portfolioApi, type Pool, type PortfolioHolding } from "@/lib/api";
import { formatTokenAmount } from "@/lib/chain";
import { getAssetClassBySlug } from "@/config/pools.config";

const ASSET_CLASS_CONFIG: Record<string, { label: string; color: string }> = {
  treasury: { label: "Treasuries", color: "#E8B4B8" },
  "real-estate": { label: "Real Estate", color: "#6FCF97" },
  "private-credit": { label: "Private Credit", color: "#6FCF97" },
  "corporate-bonds": { label: "Corporate Bonds", color: "#F59E0B" },
  commodities: { label: "Commodities", color: "#F0C8CC" },
};

const RISK_CONFIG: Record<string, { label: string; color: string }> = {
  low: { label: "Low Risk", color: "#6FCF97" },
  medium: { label: "Medium Risk", color: "#F59E0B" },
  high: { label: "High Risk", color: "#EB5757" },
};

const MOCK_POOL: Pool = {
  id: "1",
  name: "US Treasury Fund",
  description: "Short-term US Treasury bills providing stable, risk-free returns backed by the US government.",
  assetClass: "treasury",
  status: "active",
  totalValue: "10000000000000",
  availableCapacity: "7500000000000",
  yieldRate: 5.25,
  minInvestment: "100000000",
  maxInvestment: "1000000000000",
  lockupPeriod: 0,
  riskRating: "low",
  documents: [],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function generateYieldHistory(yieldRate: number) {
  const rng = seededRandom(77);
  const points: { label: number; value: number }[] = [];
  let v = yieldRate - 0.4;
  for (let i = 0; i < 30; i++) {
    v += (rng() - 0.45) * 0.3;
    v = Math.max(yieldRate - 1, Math.min(yieldRate + 0.6, v));
    points.push({ label: i + 1, value: parseFloat(v.toFixed(2)) });
  }
  return points;
}

export default function PoolDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [pool, setPool] = useState<Pool | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchPool = async () => {
      try {
        const { pool } = await poolApi.get(params.id as string);
        setPool(pool);
      } catch {
        setPool({ ...MOCK_POOL, id: params.id as string });
      } finally {
        setIsLoading(false);
      }
    };

    if (params.id) {
      fetchPool();
    }
  }, [params.id]);

  if (isLoading) {
    return (
      <div className="max-w-[var(--page-max-width)] mx-auto px-4 sm:px-6 w-full py-6" style={{ display: "flex", flexDirection: "column", gap: "var(--qg-gap)" }}>
        <QGPanel>
          <div style={{ height: 80, borderRadius: 8, background: "rgba(232,180,184,0.03)" }} />
        </QGPanel>
        <QGPanel>
          <div style={{ height: 200, borderRadius: 8, background: "rgba(232,180,184,0.03)" }} />
        </QGPanel>
      </div>
    );
  }

  if (!pool) {
    return (
      <div className="max-w-[var(--page-max-width)] mx-auto px-4 sm:px-6 w-full py-6" style={{ textAlign: "center" }}>
        <QGPanel>
          <p style={{ color: "#5A5347", margin: "40px 0" }}>Pool not found.</p>
          <button
            onClick={() => router.push("/pools")}
            style={{
              padding: "8px 20px", borderRadius: 8, cursor: "pointer",
              background: "#E8B4B8", color: "#F0EBE0", border: "none",
              fontWeight: 600, fontSize: 13,
            }}
          >
            Back to Pools
          </button>
        </QGPanel>
      </div>
    );
  }

  return <PoolDetailContent pool={pool} />;
}

type PoolDetailTab = "overview" | "documents" | "fees" | "activity";

function PoolDetailTabs({ activeTab, onTabChange }: {
  activeTab: PoolDetailTab;
  onTabChange: (tab: PoolDetailTab) => void;
}) {
  const tabs: { id: PoolDetailTab; label: string }[] = [
    { id: "overview", label: "Overview" },
    { id: "documents", label: "Documents" },
    { id: "fees", label: "Fees" },
    { id: "activity", label: "Activity" },
  ];

  return (
    <div style={{
      display: "flex",
      gap: 2,
      background: "rgba(232,180,184,0.02)",
      borderRadius: 10,
      padding: 3,
      border: "1px solid rgba(232,180,184,0.06)",
    }}>
      {tabs.map(tab => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          style={{
            flex: 1,
            padding: "8px 16px",
            borderRadius: 8,
            border: "none",
            background: activeTab === tab.id
              ? "rgba(232,180,184,0.12)"
              : "transparent",
            color: activeTab === tab.id
              ? "#E8B4B8"
              : "#5A5347",
            fontSize: 13,
            fontWeight: activeTab === tab.id ? 600 : 400,
            cursor: "pointer",
            transition: "all 0.2s ease",
            letterSpacing: "0.02em",
          }}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

function DocumentsTabContent() {
  const docs = [
    { name: "Fund Prospectus", type: "PDF", date: "Jan 2026", size: "2.4 MB" },
    { name: "Audit Report - Deloitte", type: "PDF", date: "Dec 2025", size: "1.8 MB" },
    { name: "Legal Structure", type: "PDF", date: "Nov 2025", size: "890 KB" },
    { name: "NAV Methodology", type: "PDF", date: "Jan 2026", size: "520 KB" },
    { name: "Risk Assessment", type: "PDF", date: "Feb 2026", size: "1.2 MB" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--qg-gap)" }}>
      <QGScrollReveal>
        <QGPanel label="Pool Documents">
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {docs.map((doc, i) => (
              <div key={i} style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "12px 0",
                borderBottom: i < docs.length - 1 ? "1px solid rgba(232,180,184,0.04)" : "none",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 8,
                    background: "rgba(232,180,184,0.08)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 11, fontWeight: 600, color: "#E8B4B8",
                  }}>
                    {doc.type}
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 500, color: "#F0EBE0" }}>{doc.name}</div>
                    <div style={{ fontSize: 11, color: "#5A5347" }}>{doc.date} · {doc.size}</div>
                  </div>
                </div>
                <button style={{
                  padding: "6px 14px", borderRadius: 6,
                  background: "rgba(232,180,184,0.04)",
                  border: "1px solid rgba(232,180,184,0.08)",
                  color: "#B8A99A", fontSize: 11, fontWeight: 500,
                  cursor: "pointer",
                }}>
                  Download
                </button>
              </div>
            ))}
          </div>
        </QGPanel>
      </QGScrollReveal>
    </div>
  );
}

function FeesTabContent() {
  const fees = [
    { label: "Management Fee", value: "0.50%", description: "Annual fee on assets under management" },
    { label: "Performance Fee", value: "10.00%", description: "Fee on profits above the hurdle rate" },
    { label: "Entry Fee", value: "0.00%", description: "No fee charged on deposits" },
    { label: "Exit Fee", value: "0.10%", description: "Small fee on early withdrawals within lockup" },
    { label: "Gas Fees", value: "Sponsored", description: "Transaction fees are covered by the protocol" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--qg-gap)" }}>
      <QGScrollReveal>
        <QGPanel label="Fee Structure">
          <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
            {fees.map((fee, i) => (
              <div key={i} style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                padding: "14px 0",
                borderBottom: i < fees.length - 1 ? "1px solid rgba(232,180,184,0.04)" : "none",
              }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 500, color: "#F0EBE0" }}>{fee.label}</div>
                  <div style={{ fontSize: 11, color: "#5A5347", marginTop: 2 }}>{fee.description}</div>
                </div>
                <div style={{
                  fontSize: 15, fontWeight: 600,
                  color: fee.value === "0.00%" || fee.value === "Sponsored" ? "#6FCF97" : "#F0EBE0",
                  fontVariantNumeric: "tabular-nums",
                }}>
                  {fee.value}
                </div>
              </div>
            ))}
          </div>
        </QGPanel>
      </QGScrollReveal>

      <QGScrollReveal staggerIndex={1}>
        <QGPanel label="Fee Comparison">
          <div style={{ padding: "8px 0" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
              <span style={{ fontSize: 12, color: "#B8A99A" }}>Total Annual Cost</span>
              <span style={{ fontSize: 14, fontWeight: 600, color: "#F0EBE0" }}>0.50%</span>
            </div>
            <div style={{ height: 8, background: "rgba(232,180,184,0.04)", borderRadius: 4, overflow: "hidden" }}>
              <div style={{
                height: "100%", width: "5%", borderRadius: 4,
                background: "linear-gradient(90deg, #E8B4B8, #6FCF97)",
              }} />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
              <span style={{ fontSize: 11, color: "#5A5347" }}>Deeprock: 0.50%</span>
              <span style={{ fontSize: 11, color: "#5A5347" }}>Industry Avg: 1.50%</span>
            </div>
          </div>
        </QGPanel>
      </QGScrollReveal>
    </div>
  );
}

function ActivityTabContent() {
  const activities = [
    { date: "Feb 9, 2026", type: "Yield", description: "Weekly yield distribution", amount: "+$1,247.50", status: "Confirmed" },
    { date: "Feb 7, 2026", type: "Deposit", description: "New investment", amount: "$25,000.00", status: "Confirmed" },
    { date: "Feb 5, 2026", type: "Yield", description: "Weekly yield distribution", amount: "+$1,180.25", status: "Confirmed" },
    { date: "Feb 3, 2026", type: "NAV Update", description: "Oracle price update", amount: "$1.0024", status: "Confirmed" },
    { date: "Feb 1, 2026", type: "Withdrawal", description: "Partial redemption", amount: "-$10,000.00", status: "Confirmed" },
    { date: "Jan 30, 2026", type: "Yield", description: "Weekly yield distribution", amount: "+$1,156.00", status: "Confirmed" },
    { date: "Jan 28, 2026", type: "Rebalance", description: "Pool rebalance executed", amount: "$45,000.00", status: "Confirmed" },
    { date: "Jan 26, 2026", type: "Yield", description: "Weekly yield distribution", amount: "+$1,120.75", status: "Confirmed" },
  ];

  const typeColors: Record<string, string> = {
    Yield: "#6FCF97",
    Deposit: "#E8B4B8",
    Withdrawal: "#F59E0B",
    "NAV Update": "#6FCF97",
    Rebalance: "#E8B4B8",
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--qg-gap)" }}>
      <QGScrollReveal>
        <QGPanel label="Transaction History">
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {activities.map((activity, i) => {
              const color = typeColors[activity.type] || "#5A5347";
              return (
                <div key={i} style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "10px 0",
                  borderBottom: i < activities.length - 1 ? "1px solid rgba(232,180,184,0.04)" : "none",
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{
                      width: 8, height: 8, borderRadius: "50%",
                      background: color, boxShadow: `0 0 8px ${color}40`,
                    }} />
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontSize: 13, fontWeight: 500, color: "#F0EBE0" }}>{activity.description}</span>
                        <span style={{
                          fontSize: 11, fontWeight: 600, color,
                          background: `${color}15`, padding: "2px 8px", borderRadius: 4,
                        }}>{activity.type}</span>
                      </div>
                      <div style={{ fontSize: 11, color: "#5A5347", marginTop: 2 }}>{activity.date}</div>
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{
                      fontSize: 13, fontWeight: 600, fontVariantNumeric: "tabular-nums",
                      color: activity.amount.startsWith("+") ? "#6FCF97" : activity.amount.startsWith("-") ? "#EB5757" : "#F0EBE0",
                    }}>{activity.amount}</div>
                    <div style={{ fontSize: 11, color: "#6FCF97" }}>{activity.status}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </QGPanel>
      </QGScrollReveal>
    </div>
  );
}

function PoolDetailContent({ pool }: { pool: Pool }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<PoolDetailTab>("overview");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [redeemDrawerOpen, setRedeemDrawerOpen] = useState(false);
  const [holding, setHolding] = useState<PortfolioHolding | null>(null);
  const yieldHistory = useMemo(() => generateYieldHistory(pool.yieldRate), [pool.yieldRate]);

  // Handle ?action=redeem query param
  useEffect(() => {
    if (searchParams.get("action") === "redeem") {
      // Fetch the user's holding for this pool
      portfolioApi.get().then(({ portfolio }) => {
        const match = portfolio.holdings.find((h) => h.poolId === pool.id);
        if (match) {
          setHolding(match);
          setRedeemDrawerOpen(true);
        }
      }).catch(() => {
        // If portfolio fetch fails, just stay on the pool page
      });
    }
  }, [searchParams, pool.id]);

  const totalValueNum = BigInt(pool.totalValue);
  const availableNum = BigInt(pool.availableCapacity);
  const tvlNumber = Number(totalValueNum) / 1e6;
  const animatedTvl = useAnimatedValue(tvlNumber, 2000);
  const capacityPct = totalValueNum > BigInt(0)
    ? Number((totalValueNum - availableNum) * BigInt(100) / totalValueNum)
    : 0;

  const assetConfig = ASSET_CLASS_CONFIG[pool.assetClass] || ASSET_CLASS_CONFIG.treasury;
  const riskConfig = RISK_CONFIG[pool.riskRating] || RISK_CONFIG.low;
  const categoryColorConfig = getAssetClassBySlug(pool.assetClass);
  const categoryColor = categoryColorConfig?.glowRgb ?? "232,180,184";

  const anyDrawerOpen = drawerOpen || redeemDrawerOpen;

  return (
    <div className="flex h-full">
      <div className="flex-1 min-w-0 max-w-[var(--page-max-width)] mx-auto px-4 sm:px-6 w-full py-6" style={{ display: "flex", flexDirection: "column", gap: "var(--qg-gap)" }}>
        {/* Pool Header */}
        <QGScrollReveal>
          <QGPanel className="">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                  <h2 style={{ fontSize: 24, fontWeight: 600, color: "#F0EBE0", margin: 0 }}>{pool.name}</h2>
                  <QGBadge color={riskConfig.color} variant="dot" pulse>{riskConfig.label}</QGBadge>
                </div>
                <div style={{ fontSize: 13, color: "#B8A99A" }}>
                  {assetConfig.label} · {pool.lockupPeriod > 0 ? `${pool.lockupPeriod}d lockup` : "No lockup"}
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div
                  className="glow-text-blue"
                  style={{ fontSize: 36, fontWeight: 700, color: "#F0EBE0", fontVariantNumeric: "tabular-nums" }}
                >
                  {pool.yieldRate}%
                </div>
                <div style={{ fontSize: 12, color: "#5A5347", letterSpacing: "0.1em" }}>CURRENT APY</div>
              </div>
            </div>
            {/* Invest CTA */}
            <div style={{ marginTop: 16 }}>
              <button
                onClick={() => setDrawerOpen(true)}
                style={{
                  padding: "10px 28px",
                  borderRadius: 10,
                  border: "none",
                  background: "linear-gradient(135deg, #C4956A, #E8B4B8, #C9A0DC)",
                  color: "#FFF",
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  boxShadow: "0 0 24px rgba(201,160,220,0.3)",
                }}
              >
                Invest Now
              </button>
            </div>
          </QGPanel>
        </QGScrollReveal>

        {/* Tab Bar */}
        <PoolDetailTabs activeTab={activeTab} onTabChange={setActiveTab} />

        {/* Tab Content */}
        {activeTab === "overview" && (
          <>
            {/* Stats Grid */}
            <QGScrollReveal staggerIndex={1}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "var(--qg-gap)" }}>
                {[
                  { label: "TVL", value: `$${animatedTvl.toFixed(2)}M`, color: "#F0EBE0" },
                  { label: "AVAILABLE", value: `$${formatTokenAmount(availableNum, 6)}`, color: "#E8B4B8" },
                  { label: "MIN INVEST", value: `$${formatTokenAmount(BigInt(pool.minInvestment), 6)}`, color: "#6FCF97" },
                  { label: "LOCKUP", value: pool.lockupPeriod > 0 ? `${pool.lockupPeriod} days` : "None", color: "#F59E0B" },
                ].map(s => (
                  <QGPanel key={s.label}>
                    <div style={{ fontSize: 12, color: "#5A5347", letterSpacing: "0.1em", marginBottom: 4 }}>{s.label}</div>
                    <div style={{ fontSize: 24, fontWeight: 600, color: s.color, fontVariantNumeric: "tabular-nums" }}>{s.value}</div>
                  </QGPanel>
                ))}
              </div>
            </QGScrollReveal>

            {/* Yield Chart */}
            <QGScrollReveal staggerIndex={2} direction="left">
              <QGPanel label="Yield History (30D)">
                <QGChart data={yieldHistory} height={200} gradientId={`yield-${pool.id}`} />
              </QGPanel>
            </QGScrollReveal>

            {/* Pool Info */}
            <QGScrollReveal staggerIndex={3} direction="right">
              <QGPanel label="Pool Information">
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px 24px" }}>
                  {[
                    { label: "Asset Class", value: assetConfig.label },
                    { label: "Risk Rating", value: riskConfig.label },
                    { label: "Min Investment", value: `$${formatTokenAmount(BigInt(pool.minInvestment), 6)}` },
                    { label: "Max Investment", value: `$${formatTokenAmount(BigInt(pool.maxInvestment), 6)}` },
                    { label: "Lockup Period", value: pool.lockupPeriod > 0 ? `${pool.lockupPeriod} days` : "None" },
                    { label: "Status", value: pool.status.charAt(0).toUpperCase() + pool.status.slice(1) },
                  ].map(item => (
                    <div key={item.label} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid rgba(232,180,184,0.04)" }}>
                      <span style={{ fontSize: 13, color: "#B8A99A" }}>{item.label}</span>
                      <span style={{ fontSize: 13, color: "#F0EBE0", fontWeight: 500 }}>{item.value}</span>
                    </div>
                  ))}
                </div>
              </QGPanel>
            </QGScrollReveal>

            {/* Capacity */}
            <QGScrollReveal staggerIndex={4} direction="left">
              <QGPanel label="Pool Capacity">
                <QGProgressBar label="Utilization" value={capacityPct} color="#E8B4B8" height={6} />
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
                  <span style={{ fontSize: 11, color: "#5A5347" }}>${formatTokenAmount(totalValueNum - availableNum, 6)} filled</span>
                  <span style={{ fontSize: 11, color: "#5A5347" }}>${formatTokenAmount(totalValueNum, 6)} total</span>
                </div>
              </QGPanel>
            </QGScrollReveal>

            {/* Description */}
            {pool.description && (
              <QGScrollReveal staggerIndex={5}>
                <QGPanel label="Description">
                  <p style={{ fontSize: 14, color: "#B8A99A", lineHeight: 1.7, margin: 0 }}>
                    {pool.description}
                  </p>
                </QGPanel>
              </QGScrollReveal>
            )}
          </>
        )}

        {activeTab === "documents" && <DocumentsTabContent />}
        {activeTab === "fees" && <FeesTabContent />}
        {activeTab === "activity" && <ActivityTabContent />}
      </div>

      {/* SlideDrawer for Investment */}
      <SlideDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} title="Invest" categoryColor={categoryColor}>
        <InvestmentForm
          pool={{
            id: pool.id,
            name: pool.name,
            minInvestment: pool.minInvestment,
            maxInvestment: pool.maxInvestment,
            yieldRate: pool.yieldRate,
            navPerShare: pool.navPerShare,
          }}
          onComplete={() => {
            setDrawerOpen(false);
            router.push("/portfolio");
          }}
          categoryColor={categoryColor}
        />
      </SlideDrawer>

      {/* SlideDrawer for Redemption */}
      {holding && (
        <SlideDrawer open={redeemDrawerOpen} onClose={() => setRedeemDrawerOpen(false)} title="Redeem" categoryColor={categoryColor}>
          <RedemptionForm
            holding={holding}
            onComplete={() => {
              setRedeemDrawerOpen(false);
              router.push("/portfolio");
            }}
            onCancel={() => setRedeemDrawerOpen(false)}
          />
        </SlideDrawer>
      )}
    </div>
  );
}
