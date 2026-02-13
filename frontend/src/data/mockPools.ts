import { type Pool } from "@/lib/api";

export const MOCK_POOLS: Pool[] = [
  {
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
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "2",
    name: "Prime Real Estate REIT",
    description: "Diversified commercial real estate portfolio across major US cities including office and retail.",
    assetClass: "real-estate",
    status: "active",
    totalValue: "25000000000000",
    availableCapacity: "5000000000000",
    yieldRate: 8.5,
    minInvestment: "1000000000",
    maxInvestment: "5000000000000",
    lockupPeriod: 90,
    riskRating: "medium",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "3",
    name: "Private Credit Fund I",
    description: "Senior secured loans to established mid-market companies with strong cash flows.",
    assetClass: "private-credit",
    status: "active",
    totalValue: "15000000000000",
    availableCapacity: "3000000000000",
    yieldRate: 11.0,
    minInvestment: "5000000000",
    maxInvestment: "2000000000000",
    lockupPeriod: 180,
    riskRating: "medium",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "4",
    name: "Investment Grade Bonds",
    description: "Portfolio of AAA-rated corporate bonds from Fortune 500 companies with quarterly distributions.",
    assetClass: "corporate-bonds",
    status: "active",
    totalValue: "8000000000000",
    availableCapacity: "6000000000000",
    yieldRate: 6.75,
    minInvestment: "500000000",
    maxInvestment: "500000000000",
    lockupPeriod: 30,
    riskRating: "low",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

// Helper to calculate pool stats
export function calculatePoolStats(pools: Pool[]) {
  if (pools.length === 0) {
    return { minApy: 0, maxApy: 0, totalValue: BigInt(0) };
  }

  const apys = pools.map((p) => p.yieldRate);
  const minApy = Math.min(...apys);
  const maxApy = Math.max(...apys);
  const totalValue = pools.reduce((sum, p) => sum + BigInt(p.totalValue), BigInt(0));

  return { minApy, maxApy, totalValue };
}

// Format large numbers (e.g., 58000000 -> "$58M")
export function formatLargeValue(value: bigint): string {
  const num = Number(value / BigInt(1_000_000)); // Convert from 6 decimals to whole dollars
  if (num >= 1_000_000) {
    return `$${(num / 1_000_000).toFixed(0)}T`;
  }
  if (num >= 1_000) {
    return `$${(num / 1_000).toFixed(0)}M`;
  }
  return `$${num.toFixed(0)}K`;
}
