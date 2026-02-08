/**
 * Fee Service
 *
 * Handles fee calculations and accrual for RWA Gateway pools.
 * - Entry/Exit fees are collected on-chain (handled by RWAPool.sol)
 * - Management fees: 0.5% annually, accrued daily
 * - Performance fees: 10% of yield above high watermark
 */

import { PrismaClient, FeeType, FeeStatus, PoolStatus } from "@prisma/client";

// Constants matching contract (8 decimals)
const NAV_BASE = BigInt(100_000_000); // 1.00000000
const BPS_DENOMINATOR = 10000;
const PRECISION_MULTIPLIER = 1_000_000n; // For precision in division

// Default fee rates (in basis points)
const DEFAULT_MANAGEMENT_FEE_BPS = 50; // 0.5% annually
const DEFAULT_PERFORMANCE_FEE_BPS = 1000; // 10% of yield
const DEFAULT_ENTRY_FEE_BPS = 0;
const DEFAULT_EXIT_FEE_BPS = 10; // 0.1%

// Maximum allowed fee rates (safety bounds)
const MAX_MANAGEMENT_FEE_BPS = 500; // 5% max
const MAX_PERFORMANCE_FEE_BPS = 2000; // 20% max
const MAX_ENTRY_FEE_BPS = 200; // 2% max
const MAX_EXIT_FEE_BPS = 500; // 5% max

export interface FeeCalculation {
  poolId: string;
  poolName: string;
  feeType: FeeType;
  amount: bigint;
  period: string;
}

export interface PerformanceFeeResult {
  userId: string;
  poolId: string;
  feeAmount: bigint;
  newHighWatermark: bigint;
}

export class FeeService {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  /**
   * Get or create fee config for a pool
   */
  async getFeeConfig(poolId: string) {
    let config = await this.prisma.feeConfig.findUnique({
      where: { poolId },
    });

    if (!config) {
      const pool = await this.prisma.assetPool.findUnique({
        where: { id: poolId },
      });

      if (!pool) {
        throw new Error(`Pool not found: ${poolId}`);
      }

      // Create default fee config
      const feeRecipient = process.env.FEE_TREASURY_ADDRESS;
      if (!feeRecipient || feeRecipient === "0x0000000000000000000000000000000000000000") {
        throw new Error("FEE_TREASURY_ADDRESS must be configured with a valid non-zero address");
      }

      config = await this.prisma.feeConfig.create({
        data: {
          poolId,
          managementFeeBps: DEFAULT_MANAGEMENT_FEE_BPS,
          performanceFeeBps: DEFAULT_PERFORMANCE_FEE_BPS,
          entryFeeBps: DEFAULT_ENTRY_FEE_BPS,
          exitFeeBps: DEFAULT_EXIT_FEE_BPS,
          feeRecipient,
        },
      });
    }

    return config;
  }

  /**
   * Update fee config for a pool (admin only)
   * @param poolId - Pool to update
   * @param adminId - Admin user ID (must be in ADMIN_USER_IDS env var)
   * @param updates - Fee configuration updates
   */
  async updateFeeConfig(
    poolId: string,
    adminId: string,
    updates: {
      managementFeeBps?: number;
      performanceFeeBps?: number;
      entryFeeBps?: number;
      exitFeeBps?: number;
      feeRecipient?: string;
    }
  ) {
    // Verify admin authorization via environment variable
    const adminUserIds = process.env.ADMIN_USER_IDS?.split(",").map((id) => id.trim()) || [];
    if (!adminUserIds.includes(adminId)) {
      throw new Error("Unauthorized: admin privileges required to update fee config");
    }

    // Verify user exists
    const admin = await this.prisma.user.findUnique({
      where: { id: adminId },
      select: { id: true },
    });

    if (!admin) {
      throw new Error("User not found");
    }

    // Validate fee bounds
    if (updates.managementFeeBps !== undefined) {
      if (updates.managementFeeBps < 0 || updates.managementFeeBps > MAX_MANAGEMENT_FEE_BPS) {
        throw new Error(`Management fee must be between 0 and ${MAX_MANAGEMENT_FEE_BPS} bps`);
      }
    }
    if (updates.performanceFeeBps !== undefined) {
      if (updates.performanceFeeBps < 0 || updates.performanceFeeBps > MAX_PERFORMANCE_FEE_BPS) {
        throw new Error(`Performance fee must be between 0 and ${MAX_PERFORMANCE_FEE_BPS} bps`);
      }
    }
    if (updates.entryFeeBps !== undefined) {
      if (updates.entryFeeBps < 0 || updates.entryFeeBps > MAX_ENTRY_FEE_BPS) {
        throw new Error(`Entry fee must be between 0 and ${MAX_ENTRY_FEE_BPS} bps`);
      }
    }
    if (updates.exitFeeBps !== undefined) {
      if (updates.exitFeeBps < 0 || updates.exitFeeBps > MAX_EXIT_FEE_BPS) {
        throw new Error(`Exit fee must be between 0 and ${MAX_EXIT_FEE_BPS} bps`);
      }
    }

    // Validate fee recipient if provided
    if (updates.feeRecipient) {
      if (updates.feeRecipient === "0x0000000000000000000000000000000000000000") {
        throw new Error("Fee recipient cannot be zero address");
      }
    }

    const defaultRecipient = process.env.FEE_TREASURY_ADDRESS;
    if (!defaultRecipient || defaultRecipient === "0x0000000000000000000000000000000000000000") {
      throw new Error("FEE_TREASURY_ADDRESS must be configured");
    }

    return await this.prisma.feeConfig.upsert({
      where: { poolId },
      update: updates,
      create: {
        poolId,
        managementFeeBps: updates.managementFeeBps ?? DEFAULT_MANAGEMENT_FEE_BPS,
        performanceFeeBps: updates.performanceFeeBps ?? DEFAULT_PERFORMANCE_FEE_BPS,
        entryFeeBps: updates.entryFeeBps ?? DEFAULT_ENTRY_FEE_BPS,
        exitFeeBps: updates.exitFeeBps ?? DEFAULT_EXIT_FEE_BPS,
        feeRecipient: updates.feeRecipient || defaultRecipient,
      },
    });
  }

  /**
   * Calculate daily management fee for a pool
   * Management fee = AUM * (managementFeeBps / 10000) / 365
   * Uses scaled arithmetic to prevent precision loss
   */
  calculateDailyManagementFee(totalDeposited: bigint, managementFeeBps: number): bigint {
    if (totalDeposited <= 0n || managementFeeBps <= 0) {
      return 0n;
    }

    // Scale up before division to preserve precision
    // dailyFee = (AUM * bps * PRECISION) / (BPS_DENOM * 365) / PRECISION
    const scaled = totalDeposited * BigInt(managementFeeBps) * PRECISION_MULTIPLIER;
    const dailyFeeScaled = scaled / (BigInt(BPS_DENOMINATOR) * 365n);
    return dailyFeeScaled / PRECISION_MULTIPLIER;
  }

  /**
   * Accrue management fees for all active pools
   * Called daily by the fee job
   */
  async accrueManagementFees(): Promise<FeeCalculation[]> {
    const today = new Date().toISOString().split("T")[0];
    const results: FeeCalculation[] = [];

    const activePools = await this.prisma.assetPool.findMany({
      where: { status: PoolStatus.ACTIVE },
      include: { feeConfig: true },
    });

    for (const pool of activePools) {
      // Skip if no deposits
      if (pool.totalDeposited <= 0n) continue;

      // Check if already accrued for today
      const existingFee = await this.prisma.accruedFee.findFirst({
        where: {
          poolId: pool.id,
          feeType: FeeType.MANAGEMENT,
          period: today,
        },
      });

      if (existingFee) continue;

      const feeConfig = pool.feeConfig;
      const managementFeeBps = feeConfig?.managementFeeBps ?? DEFAULT_MANAGEMENT_FEE_BPS;

      const dailyFee = this.calculateDailyManagementFee(pool.totalDeposited, managementFeeBps);

      if (dailyFee > 0n) {
        await this.prisma.accruedFee.create({
          data: {
            poolId: pool.id,
            feeType: FeeType.MANAGEMENT,
            amount: dailyFee,
            period: today,
            status: FeeStatus.PENDING,
          },
        });

        results.push({
          poolId: pool.id,
          poolName: pool.name,
          feeType: FeeType.MANAGEMENT,
          amount: dailyFee,
          period: today,
        });
      }
    }

    return results;
  }

  /**
   * Calculate and apply performance fee for a user's redemption
   * Only charges on gains above high watermark
   * Uses transaction to prevent race conditions
   */
  async calculatePerformanceFee(
    userId: string,
    poolId: string,
    shares: bigint,
    currentNav: bigint
  ): Promise<PerformanceFeeResult | null> {
    // Input validation
    if (shares <= 0n) {
      throw new Error("Shares must be positive");
    }
    if (currentNav <= 0n) {
      throw new Error("NAV must be positive");
    }

    const feeConfig = await this.getFeeConfig(poolId);

    // Use transaction to prevent race conditions on high watermark
    return await this.prisma.$transaction(async (tx) => {
      // Get or create high watermark (locked within transaction)
      let hwm = await tx.positionHighWatermark.findUnique({
        where: {
          userId_poolId: { userId, poolId },
        },
      });

      // Default high watermark is NAV_BASE (1.0)
      const highWatermarkNav = hwm?.highWatermarkNav ?? NAV_BASE;

      // No performance fee if current NAV is at or below high watermark
      if (currentNav <= highWatermarkNav) {
        return null;
      }

      // Calculate gain above high watermark
      const gainPerShare = currentNav - highWatermarkNav;
      const totalGain = (shares * gainPerShare) / NAV_BASE;

      // Performance fee = totalGain * performanceFeeBps / 10000
      const feeAmount = (totalGain * BigInt(feeConfig.performanceFeeBps)) / BigInt(BPS_DENOMINATOR);

      // Atomically update high watermark within same transaction
      await tx.positionHighWatermark.upsert({
        where: {
          userId_poolId: { userId, poolId },
        },
        update: {
          highWatermarkNav: currentNav,
        },
        create: {
          userId,
          poolId,
          highWatermarkNav: currentNav,
        },
      });

      return {
        userId,
        poolId,
        feeAmount,
        newHighWatermark: currentNav,
      };
    });
  }

  /**
   * Update high watermark after redemption (deprecated - use calculatePerformanceFee which is atomic)
   * @deprecated Use calculatePerformanceFee which atomically updates the high watermark
   */
  async updateHighWatermark(userId: string, poolId: string, newNav: bigint): Promise<void> {
    if (newNav <= 0n) {
      throw new Error("NAV must be positive");
    }

    await this.prisma.positionHighWatermark.upsert({
      where: {
        userId_poolId: { userId, poolId },
      },
      update: {
        highWatermarkNav: newNav,
      },
      create: {
        userId,
        poolId,
        highWatermarkNav: newNav,
      },
    });
  }

  /**
   * Initialize high watermark when user first invests
   */
  async initializeHighWatermark(userId: string, poolId: string, nav: bigint): Promise<void> {
    await this.prisma.positionHighWatermark.upsert({
      where: {
        userId_poolId: { userId, poolId },
      },
      update: {}, // Don't update if exists
      create: {
        userId,
        poolId,
        highWatermarkNav: nav,
      },
    });
  }

  /**
   * Get pending fees for collection
   */
  async getPendingFees(poolId?: string) {
    return await this.prisma.accruedFee.findMany({
      where: {
        poolId: poolId || undefined,
        status: FeeStatus.PENDING,
      },
      include: { pool: true },
      orderBy: { createdAt: "asc" },
    });
  }

  /**
   * Mark fees as collected
   */
  async markFeesCollected(feeIds: string[], txHash: string): Promise<void> {
    await this.prisma.accruedFee.updateMany({
      where: {
        id: { in: feeIds },
      },
      data: {
        status: FeeStatus.COLLECTED,
        txHash,
      },
    });
  }

  /**
   * Get fee summary for a pool
   */
  async getPoolFeeSummary(poolId: string) {
    const [pendingFees, collectedFees] = await Promise.all([
      this.prisma.accruedFee.aggregate({
        where: { poolId, status: FeeStatus.PENDING },
        _sum: { amount: true },
        _count: true,
      }),
      this.prisma.accruedFee.aggregate({
        where: { poolId, status: FeeStatus.COLLECTED },
        _sum: { amount: true },
        _count: true,
      }),
    ]);

    const feeConfig = await this.getFeeConfig(poolId);

    return {
      poolId,
      feeConfig: {
        managementFeeBps: feeConfig.managementFeeBps,
        performanceFeeBps: feeConfig.performanceFeeBps,
        entryFeeBps: feeConfig.entryFeeBps,
        exitFeeBps: feeConfig.exitFeeBps,
        feeRecipient: feeConfig.feeRecipient,
      },
      pendingFees: {
        total: pendingFees._sum.amount ?? 0n,
        count: pendingFees._count,
      },
      collectedFees: {
        total: collectedFees._sum.amount ?? 0n,
        count: collectedFees._count,
      },
    };
  }

  /**
   * Format fee amount for display (6 decimals USDC)
   */
  formatFeeAmount(amount: bigint): string {
    const usdcDecimals = 6;
    const intPart = amount / BigInt(10 ** usdcDecimals);
    const decPart = amount % BigInt(10 ** usdcDecimals);
    const decStr = decPart.toString().padStart(usdcDecimals, "0").slice(0, 2);
    return `$${intPart}.${decStr}`;
  }
}

// Singleton instance
let feeServiceInstance: FeeService | null = null;

export function getFeeService(prisma: PrismaClient): FeeService {
  if (!feeServiceInstance) {
    feeServiceInstance = new FeeService(prisma);
  }
  return feeServiceInstance;
}

export { NAV_BASE, BPS_DENOMINATOR };
