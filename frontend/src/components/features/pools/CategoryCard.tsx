"use client";

import Link from "next/link";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { ArrowRight } from "lucide-react";
import { type AssetClassConfig } from "@/config/pools.config";

interface CategoryCardProps {
  assetClass: AssetClassConfig;
  poolCount?: number;
}

export function CategoryCard({ assetClass, poolCount }: CategoryCardProps) {
  const Icon = assetClass.icon;
  const [hovered, setHovered] = useState(false);
  const rgb = assetClass.glowRgb || "205,127,50";

  return (
    <Link href={assetClass.href}>
      <div
        className="group relative rounded-xl h-full cursor-pointer transition-all duration-300"
        style={{
          background: "linear-gradient(135deg, rgba(17,15,12,0.75), rgba(6,5,4,0.85))",
          border: `1px solid ${hovered ? `rgba(${rgb},0.2)` : "rgba(232,180,184,0.05)"}`,
          backdropFilter: "blur(40px) saturate(1.5)",
          WebkitBackdropFilter: "blur(40px) saturate(1.5)",
          boxShadow: hovered ? `0 0 30px rgba(${rgb},0.15)` : "none",
          transform: hovered ? "translateY(-2px)" : "none",
        }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        {/* Corner glow orb */}
        <div
          className="absolute -top-10 -right-10 h-24 w-24 rounded-full"
          style={{
            background: `radial-gradient(circle, rgba(${rgb},0.3) 0%, transparent 70%)`,
            filter: "blur(20px)",
            opacity: hovered ? 0.6 : 0.3,
            transition: "opacity 0.3s",
          }}
        />

        {/* Frosted top edge */}
        <div
          className="absolute top-0 left-[8%] right-[8%] h-px pointer-events-none"
          style={{
            background: "linear-gradient(90deg, transparent, rgba(232,180,184,0.08), transparent)",
          }}
        />

        <div className="p-6 flex flex-col h-full relative">
          <div className="flex items-start justify-between mb-4">
            <div
              className={cn("rounded-xl p-3", assetClass.bgColor)}
              style={{ boxShadow: `0 0 15px rgba(${rgb},0.15)` }}
            >
              <Icon className={cn("h-6 w-6", assetClass.color)} />
            </div>
            <ArrowRight className="h-5 w-5 text-[#5A5347] group-hover:text-[#B8A99A] group-hover:translate-x-1 transition-all" />
          </div>

          <h3 className="text-lg font-semibold text-[#F0EBE0] mb-2">
            {assetClass.label}
          </h3>

          <p className="text-sm text-[#B8A99A] flex-1">
            {assetClass.description}
          </p>

          {poolCount !== undefined && (
            <div
              className="mt-4 pt-4"
              style={{ borderTop: "1px solid rgba(232,180,184,0.05)" }}
            >
              <span className="text-sm text-[#5A5347]">
                {poolCount} {poolCount === 1 ? "pool" : "pools"} available
              </span>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
