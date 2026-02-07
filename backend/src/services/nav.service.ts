/**
 * NAV (Net Asset Value) Service
 *
 * Simulates share price growth based on pool APY for hackathon demo.
 * NAV uses 8 decimal precision: 100000000 = 1.0
 */

import { PrismaClient, PoolStatus } from "@prisma/client";

// 8 decimal precision: 100000000 = 1.0
const NAV_DECIMALS = 8;
const NAV_BASE = BigInt(10 ** NAV_DECIMALS); // 100000000

export interface NavUpdateResult {
  poolId: string;
  poolName: string;
  previousNav: bigint;
  newNav: bigint;
  growthPercent: string;
}

export class NavService {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  /**
   * Convert annual yield rate (in basis points) to a daily multiplier
   * Formula: dailyMultiplier = (1 + APY/10000) ^ (1/365)
   * We approximate with: 1 + (APY / 10000 / 365)
   *
   * @param yieldRateBps - Annual yield in basis points (e.g., 500 = 5%)
   * @returns Daily multiplier as BigInt with 8 decimals
   */
  calculateDailyYieldMultiplier(yieldRateBps: number): bigint {
    // APY as decimal with 8 decimals: 500 bps = 0.05 = 5000000 (with 8 decimals)
    const apyDecimal = BigInt(yieldRateBps) * NAV_BASE / 10000n;

    // Daily rate = APY / 365
    const dailyRate = apyDecimal / 365n;

    // Daily multiplier = 1.0 + dailyRate (in 8 decimal format)
    return NAV_BASE + dailyRate;
  }

  /**
   * Calculate hours elapsed since last NAV update
   */
  private getHoursElapsed(lastUpdate: Date): number {
    const now = new Date();
    const diffMs = now.getTime() - lastUpdate.getTime();
    return diffMs / (1000 * 60 * 60);
  }

  /**
   * Update NAV for a single pool based on elapsed time
   *
   * @param poolId - The pool ID to update
   * @returns NavUpdateResult or null if pool not found
   */
  async updatePoolNav(poolId: string): Promise<NavUpdateResult | null> {
    const pool = await this.prisma.assetPool.findUnique({
      where: { id: poolId },
      select: {
        id: true,
        name: true,
        yieldRateBps: true,
        navPerShare: true,
        lastNavUpdate: true,
        status: true,
      },
    });

    if (!pool || pool.status !== PoolStatus.ACTIVE) {
      return null;
    }

    const hoursElapsed = this.getHoursElapsed(pool.lastNavUpdate);

    // Only update if at least 1 hour has passed
    if (hoursElapsed < 1) {
      return null;
    }

    // Calculate growth for elapsed time
    // dailyGrowth = APY / 365 / 24 * hoursElapsed
    const hourlyRate = (BigInt(pool.yieldRateBps) * NAV_BASE) / 10000n / 365n / 24n;
    const totalGrowth = hourlyRate * BigInt(Math.floor(hoursElapsed));

    // New NAV = current NAV + (current NAV * growth rate / NAV_BASE)
    const previousNav = pool.navPerShare;
    const growthAmount = (previousNav * totalGrowth) / NAV_BASE;
    const newNav = previousNav + growthAmount;

    // Safety: NAV should never decrease (negative yields not supported)
    if (newNav < previousNav) {
      console.error(`[NAV Service] ERROR: NAV would decrease for pool ${pool.name} - skipping update`);
      return null;
    }

    // Update the pool
    await this.prisma.assetPool.update({
      where: { id: poolId },
      data: {
        navPerShare: newNav,
        lastNavUpdate: new Date(),
      },
    });

    const growthPercent = ((Number(newNav - previousNav) / Number(previousNav)) * 100).toFixed(4);

    return {
      poolId: pool.id,
      poolName: pool.name,
      previousNav,
      newNav,
      growthPercent,
    };
  }

  /**
   * Update NAV for all active pools
   *
   * @returns Array of NavUpdateResult for pools that were updated
   */
  async updateAllPoolNavs(): Promise<NavUpdateResult[]> {
    const activePools = await this.prisma.assetPool.findMany({
      where: { status: PoolStatus.ACTIVE },
      select: { id: true },
    });

    const results: NavUpdateResult[] = [];

    for (const pool of activePools) {
      const result = await this.updatePoolNav(pool.id);
      if (result) {
        results.push(result);
      }
    }

    return results;
  }

  /**
   * Calculate current value based on shares and NAV changes
   *
   * @param shares - Number of shares held
   * @param currentNav - Current pool NAV (with 8 decimals)
   * @param purchaseNav - NAV at purchase time (with 8 decimals), defaults to 1.0
   * @returns Object with currentValue, costBasis, and unrealizedGain
   */
  calculateCurrentValue(
    shares: bigint,
    currentNav: bigint,
    purchaseNav: bigint = NAV_BASE
  ): {
    currentValue: bigint;
    costBasis: bigint;
    unrealizedGain: bigint;
    gainPercent: string;
  } {
    // costBasis = shares * purchaseNav / NAV_BASE (since shares are 1:1 with amount at purchase)
    const costBasis = (shares * purchaseNav) / NAV_BASE;

    // currentValue = shares * currentNav / NAV_BASE
    const currentValue = (shares * currentNav) / NAV_BASE;

    // unrealizedGain = currentValue - costBasis
    const unrealizedGain = currentValue - costBasis;

    // gainPercent
    let gainPercent = "0.00";
    if (costBasis > 0n) {
      gainPercent = ((Number(unrealizedGain) / Number(costBasis)) * 100).toFixed(2);
    }

    return {
      currentValue,
      costBasis,
      unrealizedGain,
      gainPercent,
    };
  }

  /**
   * Get the weighted average purchase NAV for a user's position
   *
   * @param userId - User ID
   * @param poolId - Pool ID
   * @returns Weighted average NAV or null if no investments
   */
  async getWeightedAveragePurchaseNav(
    userId: string,
    poolId: string
  ): Promise<bigint | null> {
    const investments = await this.prisma.investment.findMany({
      where: {
        userId,
        poolId,
        type: "INVEST",
        status: "CONFIRMED",
      },
      select: {
        shares: true,
        sharePriceAtPurchase: true,
      },
    });

    if (investments.length === 0) {
      return null;
    }

    let totalShares = 0n;
    let weightedNavSum = 0n;

    for (const inv of investments) {
      const navAtPurchase = inv.sharePriceAtPurchase ?? NAV_BASE;
      totalShares += inv.shares;
      weightedNavSum += inv.shares * navAtPurchase;
    }

    if (totalShares === 0n) {
      return NAV_BASE;
    }

    return weightedNavSum / totalShares;
  }

  /**
   * Format NAV for display (convert from 8 decimals to human readable)
   *
   * @param nav - NAV with 8 decimals
   * @returns Formatted string like "1.0234"
   */
  formatNav(nav: bigint): string {
    const intPart = nav / NAV_BASE;
    const decPart = nav % NAV_BASE;
    const decStr = decPart.toString().padStart(NAV_DECIMALS, "0").slice(0, 4);
    return `${intPart}.${decStr}`;
  }
}

// Singleton instance
let navServiceInstance: NavService | null = null;

export function getNavService(prisma: PrismaClient): NavService {
  if (!navServiceInstance) {
    navServiceInstance = new NavService(prisma);
  }
  return navServiceInstance;
}

export { NAV_BASE, NAV_DECIMALS };
