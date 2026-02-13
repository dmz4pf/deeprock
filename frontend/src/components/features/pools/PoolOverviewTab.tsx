"use client";

import { type Pool } from "@/lib/api";
import { formatTokenAmount } from "@/lib/chain";
import { CheckCircle, Lock, Shield, Calendar, TrendingUp, BarChart3 } from "lucide-react";

interface PoolOverviewTabProps {
  pool: Pool;
  assetConfig: { label: string; color: string; bgColor: string; rgb: string };
  utilizationPercent: number;
}

const keyFeatures = [
  "Institutional-grade asset selection",
  "On-chain NAV tracking",
  "Automated yield distribution",
  "Regulatory compliance verified",
  "Third-party audited",
];

export function PoolOverviewTab({ pool, assetConfig, utilizationPercent }: PoolOverviewTabProps) {
  const totalValueNum = BigInt(pool.totalValue);
  const availableNum = BigInt(pool.availableCapacity);

  return (
    <div className="space-y-6">
      {/* Description */}
      <div
        className="rounded-xl p-6"
        style={{
          background: "linear-gradient(135deg, rgba(17,15,12,0.75), rgba(6,5,4,0.85))",
          border: "1px solid rgba(232,180,184,0.05)",
        }}
      >
        <h3 className="text-lg font-semibold text-[#F0EBE0] mb-3">About This Pool</h3>
        <p className="text-[#B8A99A] leading-relaxed">{pool.description}</p>
      </div>

      {/* Key Features */}
      <div
        className="rounded-xl p-6"
        style={{
          background: "linear-gradient(135deg, rgba(17,15,12,0.75), rgba(6,5,4,0.85))",
          border: "1px solid rgba(232,180,184,0.05)",
        }}
      >
        <h3 className="text-lg font-semibold text-[#F0EBE0] mb-4">Key Features</h3>
        <div className="space-y-3">
          {keyFeatures.map((feature) => (
            <div key={feature} className="flex items-center gap-3">
              <CheckCircle className="h-4 w-4 text-forge-teal shrink-0" />
              <span className="text-sm text-[#B8A99A]">{feature}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid sm:grid-cols-2 gap-4">
        {[
          { icon: Lock, label: "Lockup Period", value: pool.lockupPeriod > 0 ? `${pool.lockupPeriod} days` : "No lockup" },
          { icon: Shield, label: "Asset Class", value: assetConfig.label },
          { icon: TrendingUp, label: "Status", value: pool.status, capitalize: true },
          { icon: Calendar, label: "Created", value: new Date(pool.createdAt).toLocaleDateString() },
        ].map((stat) => (
          <div
            key={stat.label}
            className="flex items-center gap-3 rounded-lg p-4"
            style={{
              background: "rgba(232,180,184,0.03)",
              border: "1px solid rgba(232,180,184,0.05)",
            }}
          >
            <stat.icon className="h-5 w-5 text-[#5A5347]" />
            <div>
              <p className="text-xs text-[#5A5347]">{stat.label}</p>
              <p className={`text-sm font-medium text-[#F0EBE0] ${stat.capitalize ? "capitalize" : ""}`}>
                {stat.value}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Capacity Bar */}
      <div
        className="rounded-xl p-6"
        style={{
          background: "linear-gradient(135deg, rgba(17,15,12,0.75), rgba(6,5,4,0.85))",
          border: "1px solid rgba(232,180,184,0.05)",
        }}
      >
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className="h-5 w-5 text-[#B8A99A]" />
          <h3 className="text-lg font-semibold text-[#F0EBE0]">Pool Utilization</h3>
        </div>
        <div className="flex justify-between text-sm mb-2">
          <span className="text-[#B8A99A]">Capacity</span>
          <span className="text-[#F0EBE0] font-medium">{utilizationPercent}%</span>
        </div>
        <div
          className="h-3 rounded-full overflow-hidden"
          style={{ background: "rgba(232,180,184,0.05)", border: "1px solid rgba(232,180,184,0.1)" }}
        >
          <div
            className="h-full bg-gradient-to-r from-forge-copper to-forge-violet transition-all"
            style={{
              width: `${utilizationPercent}%`,
              boxShadow: "0 0 15px rgba(111,207,151,0.4)",
            }}
          />
        </div>
        <div className="flex justify-between text-xs text-[#5A5347] mt-2">
          <span>${formatTokenAmount(totalValueNum - availableNum, 6)} invested</span>
          <span>${formatTokenAmount(availableNum, 6)} available</span>
        </div>
      </div>
    </div>
  );
}
