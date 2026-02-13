"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PoolCard } from "@/components/features/pools";
import { type AssetClassConfig } from "@/config/pools.config";
import { poolApi, type Pool } from "@/lib/api";
import { MOCK_POOLS } from "@/data/mockPools";
import { Search, ArrowLeft } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface CategoryPageContentProps {
  assetClass: AssetClassConfig;
}

export function CategoryPageContent({ assetClass }: CategoryPageContentProps) {
  const [pools, setPools] = useState<Pool[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const Icon = assetClass.icon;
  const rgb = assetClass.glowRgb || "205,127,50";

  useEffect(() => {
    const fetchPools = async () => {
      try {
        const result = await poolApi.list({ assetClass: assetClass.slug });
        setPools(result.pools || []);
      } catch {
        // Use mock data filtered by asset class
        setPools(MOCK_POOLS.filter((p) => p.assetClass === assetClass.slug));
      } finally {
        setIsLoading(false);
      }
    };

    fetchPools();
  }, [assetClass.slug]);

  // Filter pools by search query
  const filteredPools = pools.filter((pool) => {
    if (!searchQuery) return true;
    return (
      pool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pool.description.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  return (
    <>
      <div className="container py-6 space-y-6">
        {/* Back button and header */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <Link href="/pools">
            <Button variant="ghost" size="sm" className="text-[#B8A99A] hover:text-[#F0EBE0]">
              <ArrowLeft className="h-4 w-4 mr-2" />
              All Pools
            </Button>
          </Link>
        </div>

        {/* Category header */}
        <div className="flex items-start gap-4">
          <div
            className={cn("rounded-xl p-3", assetClass.bgColor)}
            style={{ boxShadow: `0 0 20px rgba(${rgb},0.2)` }}
          >
            <Icon className={cn("h-8 w-8", assetClass.color)} />
          </div>
          <div>
            <h1
              className="text-2xl font-bold text-[#F0EBE0]"
              style={{ textShadow: `0 0 30px rgba(${rgb},0.25)` }}
            >
              {assetClass.label}
            </h1>
            <p className="text-[#B8A99A] mt-1">{assetClass.description}</p>
          </div>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#5A5347]" />
          <Input
            placeholder={`Search ${assetClass.label.toLowerCase()} pools...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Pool grid */}
        {isLoading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-80 animate-pulse rounded-xl"
                style={{
                  background: "linear-gradient(135deg, rgba(17,15,12,0.75), rgba(6,5,4,0.85))",
                  border: `1px solid rgba(${rgb},0.1)`,
                }}
              />
            ))}
          </div>
        ) : filteredPools.length > 0 ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPools.map((pool) => (
              <PoolCard key={pool.id} pool={pool} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div
              className={cn("inline-flex items-center justify-center w-16 h-16 rounded-xl mb-4", assetClass.bgColor)}
              style={{ boxShadow: `0 0 20px rgba(${rgb},0.2)` }}
            >
              <Icon className={cn("h-8 w-8", assetClass.color)} />
            </div>
            <p className="text-lg text-[#B8A99A]">No {assetClass.label.toLowerCase()} pools found</p>
            <p className="text-sm text-[#5A5347] mt-1">
              {searchQuery ? "Try adjusting your search query" : "Check back soon for new pools"}
            </p>
          </div>
        )}
      </div>
    </>
  );
}
