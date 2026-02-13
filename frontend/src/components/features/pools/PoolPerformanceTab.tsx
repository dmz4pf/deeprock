"use client";

import { useMemo } from "react";
import { TrendingUp, Calendar } from "lucide-react";

interface PoolPerformanceTabProps {
  yieldRate: number;
  poolId: string;
}

function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

export function PoolPerformanceTab({ yieldRate, poolId }: PoolPerformanceTabProps) {
  const chartData = useMemo(() => {
    const seed = poolId.split("").reduce((a, c) => a + c.charCodeAt(0), 0) || 42;
    const rand = seededRandom(seed);
    const days = 90;
    const points: { day: number; nav: number }[] = [];
    let nav = 100;
    const dailyReturn = yieldRate / 365 / 100;

    for (let i = 0; i <= days; i++) {
      nav *= 1 + dailyReturn + (rand() - 0.48) * 0.003;
      points.push({ day: i, nav: Math.round(nav * 100) / 100 });
    }
    return points;
  }, [yieldRate, poolId]);

  const minNav = Math.min(...chartData.map((d) => d.nav));
  const maxNav = Math.max(...chartData.map((d) => d.nav));
  const navRange = maxNav - minNav || 1;
  const totalReturn = ((chartData[chartData.length - 1].nav - 100) / 100) * 100;

  const width = 600;
  const height = 200;
  const padding = { top: 10, right: 10, bottom: 10, left: 10 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  const pathD = chartData
    .map((d, i) => {
      const x = padding.left + (i / (chartData.length - 1)) * chartW;
      const y = padding.top + chartH - ((d.nav - minNav) / navRange) * chartH;
      return `${i === 0 ? "M" : "L"} ${x} ${y}`;
    })
    .join(" ");

  const areaD = `${pathD} L ${padding.left + chartW} ${padding.top + chartH} L ${padding.left} ${padding.top + chartH} Z`;

  return (
    <div className="space-y-6">
      {/* Chart */}
      <div
        className="rounded-xl p-6"
        style={{
          background: "linear-gradient(135deg, rgba(17,15,12,0.75), rgba(6,5,4,0.85))",
          border: "1px solid rgba(232,180,184,0.05)",
        }}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-forge-copper" />
            <h3 className="text-lg font-semibold text-[#F0EBE0]">90-Day NAV Performance</h3>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="h-4 w-4 text-[#5A5347]" />
            <span className="text-[#B8A99A]">Last 90 days</span>
          </div>
        </div>

        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto" preserveAspectRatio="none">
          <defs>
            <linearGradient id="navGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgba(232,180,184,0.3)" />
              <stop offset="100%" stopColor="rgba(232,180,184,0)" />
            </linearGradient>
          </defs>
          <path d={areaD} fill="url(#navGradient)" />
          <path
            d={pathD}
            fill="none"
            stroke="#E8B4B8"
            strokeWidth="2"
            style={{ filter: "drop-shadow(0 0 6px rgba(232,180,184,0.5))" }}
          />
        </svg>

        <div className="flex items-center justify-between mt-4 text-sm">
          <span className="text-[#5A5347]">Starting NAV: $100.00</span>
          <span className="text-[#5A5347]">
            Current NAV: <span className="text-forge-teal font-medium">${chartData[chartData.length - 1].nav.toFixed(2)}</span>
          </span>
        </div>
      </div>

      {/* Performance Stats */}
      <div className="grid sm:grid-cols-3 gap-4">
        {[
          { label: "Annual Yield (APY)", value: `${yieldRate}%`, color: "111,207,151" },
          { label: "90-Day Return", value: `+${totalReturn.toFixed(2)}%`, color: "205,127,50" },
          { label: "Historical Avg", value: `${(yieldRate * 0.95).toFixed(1)}%`, color: "111,207,151" },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl p-5 text-center"
            style={{
              background: "linear-gradient(135deg, rgba(17,15,12,0.75), rgba(6,5,4,0.85))",
              border: "1px solid rgba(232,180,184,0.05)",
            }}
          >
            <p className="text-xs text-[#5A5347] mb-2">{stat.label}</p>
            <p
              className="text-2xl font-bold"
              style={{
                color: `rgb(${stat.color})`,
                textShadow: `0 0 20px rgba(${stat.color},0.4)`,
              }}
            >
              {stat.value}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
