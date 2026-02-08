/**
 * Redemption Queue Service
 *
 * Manages off-chain redemption queue with T+N settlement delays.
 * - Users queue redemptions (NAV locked at request time)
 * - Admin can approve/reject large redemptions
 * - Settlement job processes eligible redemptions
 */

import { PrismaClient, RedemptionStatus, PoolStatus } from "@prisma/client";
import { ethers } from "ethers";

// NAV precision (8 decimals)
const NAV_BASE = BigInt(100_000_000);

export interface QueueRedemptionParams {
  userId: string;
  poolId: string;
  shares: bigint;
}

export interface QueueRedemptionResult {
  id: string;
  queuePosition: number;
  estimatedAmount: bigint;
  settlementDate: Date;
  requiresApproval: boolean;
}

export interface SettlementResult {
  id: string;
  userId: string;
  poolId: string;
  shares: bigint;
  amount: bigint;
  status: RedemptionStatus;
  txHash?: string;
  error?: string;
}

export class RedemptionQueueService {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  /**
   * Queue a redemption request
   * Locks NAV at time of request
   * Uses transaction to prevent race conditions on queue position
   */
  async queueRedemption(params: QueueRedemptionParams): Promise<QueueRedemptionResult> {
    const { userId, poolId, shares } = params;

    // Input validation
    if (shares <= 0n) {
      throw new Error("Shares must be positive");
    }

    // Get pool info
    const pool = await this.prisma.assetPool.findUnique({
      where: { id: poolId },
    });

    if (!pool) {
      throw new Error("Pool not found");
    }

    if (pool.status !== PoolStatus.ACTIVE) {
      throw new Error("Pool is not active");
    }

    // Get user position (via investments summary)
    const userPosition = await this.getUserPosition(userId, poolId);
    if (userPosition.availableShares < shares) {
      throw new Error("Insufficient shares");
    }

    // Check queue limit per user (prevent spam)
    const MAX_PENDING_REDEMPTIONS = 10;
    const pendingCount = await this.prisma.redemptionQueue.count({
      where: {
        userId,
        status: { in: [RedemptionStatus.QUEUED, RedemptionStatus.PENDING_APPROVAL, RedemptionStatus.APPROVED] },
      },
    });
    if (pendingCount >= MAX_PENDING_REDEMPTIONS) {
      throw new Error("Maximum pending redemptions reached. Wait for existing ones to settle.");
    }

    // Calculate estimated amount at current NAV
    const currentNav = pool.navPerShare;
    if (currentNav <= 0n) {
      throw new Error("Invalid pool NAV");
    }
    const estimatedAmount = (shares * currentNav) / NAV_BASE;

    // Calculate settlement date (T+N days)
    const settlementDate = new Date();
    settlementDate.setDate(settlementDate.getDate() + pool.settlementDays);

    // Check if requires approval (large redemption)
    const requiresApproval = pool.largeRedemptionThreshold
      ? estimatedAmount >= pool.largeRedemptionThreshold
      : false;

    // Use transaction to atomically get and increment queue position
    const entry = await this.prisma.$transaction(async (tx) => {
      // Get next queue position within transaction
      const lastInQueue = await tx.redemptionQueue.findFirst({
        where: { poolId },
        orderBy: { queuePosition: "desc" },
      });
      const queuePosition = (lastInQueue?.queuePosition ?? 0) + 1;

      // Create queue entry
      return await tx.redemptionQueue.create({
        data: {
          userId,
          poolId,
          shares,
          queuePosition,
          navAtRequest: currentNav,
          estimatedAmount,
          settlementDate,
          status: requiresApproval ? RedemptionStatus.PENDING_APPROVAL : RedemptionStatus.QUEUED,
          requiresApproval,
        },
      });
    });

    return {
      id: entry.id,
      queuePosition: entry.queuePosition,
      estimatedAmount,
      settlementDate,
      requiresApproval,
    };
  }

  /**
   * Get user's current share position
   */
  async getUserPosition(userId: string, poolId: string): Promise<{ totalShares: bigint; availableShares: bigint }> {
    // Sum of confirmed INVEST - confirmed REDEEM
    const investments = await this.prisma.investment.aggregate({
      where: {
        userId,
        poolId,
        type: "INVEST",
        status: "CONFIRMED",
      },
      _sum: { shares: true },
    });

    const redemptions = await this.prisma.investment.aggregate({
      where: {
        userId,
        poolId,
        type: "REDEEM",
        status: "CONFIRMED",
      },
      _sum: { shares: true },
    });

    // Shares currently in redemption queue (not settled/cancelled)
    const pendingRedemptions = await this.prisma.redemptionQueue.aggregate({
      where: {
        userId,
        poolId,
        status: {
          in: [
            RedemptionStatus.QUEUED,
            RedemptionStatus.PENDING_APPROVAL,
            RedemptionStatus.APPROVED,
            RedemptionStatus.PROCESSING,
            RedemptionStatus.PARTIALLY_FILLED,
          ],
        },
      },
      _sum: { shares: true },
    });

    const investedShares = investments._sum.shares ?? 0n;
    const redeemedShares = redemptions._sum.shares ?? 0n;
    const queuedShares = pendingRedemptions._sum.shares ?? 0n;

    const totalShares = investedShares - redeemedShares;
    const availableShares = totalShares - queuedShares;

    return { totalShares, availableShares };
  }

  /**
   * Cancel a queued redemption (user action)
   * Can only cancel if still QUEUED
   */
  async cancelRedemption(redemptionId: string, userId: string): Promise<void> {
    const entry = await this.prisma.redemptionQueue.findUnique({
      where: { id: redemptionId },
    });

    if (!entry) {
      throw new Error("Redemption not found");
    }

    if (entry.userId !== userId) {
      throw new Error("Not authorized");
    }

    if (entry.status !== RedemptionStatus.QUEUED && entry.status !== RedemptionStatus.PENDING_APPROVAL) {
      throw new Error("Cannot cancel redemption in current status");
    }

    await this.prisma.redemptionQueue.update({
      where: { id: redemptionId },
      data: {
        status: RedemptionStatus.CANCELLED,
        reason: "Cancelled by user",
      },
    });
  }

  /**
   * Approve a large redemption (admin action)
   */
  async approveRedemption(redemptionId: string, adminId: string): Promise<void> {
    const entry = await this.prisma.redemptionQueue.findUnique({
      where: { id: redemptionId },
    });

    if (!entry) {
      throw new Error("Redemption not found");
    }

    if (entry.status !== RedemptionStatus.PENDING_APPROVAL) {
      throw new Error("Redemption is not pending approval");
    }

    await this.prisma.redemptionQueue.update({
      where: { id: redemptionId },
      data: {
        status: RedemptionStatus.APPROVED,
        approvedBy: adminId,
      },
    });
  }

  /**
   * Reject a large redemption (admin action)
   */
  async rejectRedemption(redemptionId: string, adminId: string, reason: string): Promise<void> {
    const entry = await this.prisma.redemptionQueue.findUnique({
      where: { id: redemptionId },
    });

    if (!entry) {
      throw new Error("Redemption not found");
    }

    if (entry.status !== RedemptionStatus.PENDING_APPROVAL) {
      throw new Error("Redemption is not pending approval");
    }

    await this.prisma.redemptionQueue.update({
      where: { id: redemptionId },
      data: {
        status: RedemptionStatus.REJECTED,
        approvedBy: adminId,
        reason,
      },
    });
  }

  /**
   * Get eligible redemptions for settlement
   * Returns QUEUED/APPROVED entries past settlement date
   */
  async getEligibleRedemptions(poolId?: string): Promise<any[]> {
    const now = new Date();

    return await this.prisma.redemptionQueue.findMany({
      where: {
        poolId: poolId || undefined,
        status: {
          in: [RedemptionStatus.QUEUED, RedemptionStatus.APPROVED],
        },
        settlementDate: { lte: now },
      },
      include: {
        user: { select: { id: true, smartWalletAddress: true, walletAddress: true } },
        pool: { select: { id: true, chainPoolId: true, name: true, navPerShare: true } },
      },
      orderBy: [{ poolId: "asc" }, { queuePosition: "asc" }],
    });
  }

  /**
   * Process a single redemption settlement
   * Called by settlement job or admin emergency settle
   */
  async processSettlement(
    redemptionId: string,
    executeOnChain: (poolId: number, investor: string, shares: bigint) => Promise<{ txHash: string; amount: bigint }>
  ): Promise<SettlementResult> {
    const entry = await this.prisma.redemptionQueue.findUnique({
      where: { id: redemptionId },
      include: {
        user: { select: { smartWalletAddress: true, walletAddress: true } },
        pool: { select: { chainPoolId: true } },
      },
    });

    if (!entry) {
      throw new Error("Redemption not found");
    }

    if (entry.status !== RedemptionStatus.QUEUED && entry.status !== RedemptionStatus.APPROVED) {
      throw new Error("Redemption not eligible for settlement");
    }

    // Mark as processing
    await this.prisma.redemptionQueue.update({
      where: { id: redemptionId },
      data: { status: RedemptionStatus.PROCESSING },
    });

    try {
      const investorAddress = entry.user.smartWalletAddress || entry.user.walletAddress;
      if (!investorAddress) {
        throw new Error("User has no wallet address");
      }

      // Execute on-chain redemption
      const { txHash, amount } = await executeOnChain(
        entry.pool.chainPoolId,
        investorAddress,
        entry.shares
      );

      // Mark as settled
      await this.prisma.redemptionQueue.update({
        where: { id: redemptionId },
        data: {
          status: RedemptionStatus.SETTLED,
          filledShares: entry.shares,
          txHash,
        },
      });

      // Record in investments table
      await this.prisma.investment.create({
        data: {
          userId: entry.userId,
          poolId: entry.poolId,
          type: "REDEEM",
          amount,
          shares: entry.shares,
          status: "CONFIRMED",
          txHash,
        },
      });

      return {
        id: redemptionId,
        userId: entry.userId,
        poolId: entry.poolId,
        shares: entry.shares,
        amount,
        status: RedemptionStatus.SETTLED,
        txHash,
      };
    } catch (error: any) {
      // Mark as failed
      await this.prisma.redemptionQueue.update({
        where: { id: redemptionId },
        data: {
          status: RedemptionStatus.FAILED,
          reason: error.message,
        },
      });

      return {
        id: redemptionId,
        userId: entry.userId,
        poolId: entry.poolId,
        shares: entry.shares,
        amount: 0n,
        status: RedemptionStatus.FAILED,
        error: error.message,
      };
    }
  }

  /**
   * Get user's redemption queue entries
   */
  async getUserRedemptions(userId: string, status?: RedemptionStatus[]) {
    return await this.prisma.redemptionQueue.findMany({
      where: {
        userId,
        status: status ? { in: status } : undefined,
      },
      include: {
        pool: { select: { name: true, navPerShare: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  /**
   * Get pool redemption queue stats
   */
  async getPoolQueueStats(poolId: string) {
    const [queued, pendingApproval, processing] = await Promise.all([
      this.prisma.redemptionQueue.aggregate({
        where: { poolId, status: RedemptionStatus.QUEUED },
        _sum: { shares: true, estimatedAmount: true },
        _count: true,
      }),
      this.prisma.redemptionQueue.aggregate({
        where: { poolId, status: RedemptionStatus.PENDING_APPROVAL },
        _sum: { shares: true, estimatedAmount: true },
        _count: true,
      }),
      this.prisma.redemptionQueue.aggregate({
        where: { poolId, status: RedemptionStatus.PROCESSING },
        _sum: { shares: true, estimatedAmount: true },
        _count: true,
      }),
    ]);

    return {
      poolId,
      queued: {
        count: queued._count,
        totalShares: queued._sum.shares ?? 0n,
        totalAmount: queued._sum.estimatedAmount ?? 0n,
      },
      pendingApproval: {
        count: pendingApproval._count,
        totalShares: pendingApproval._sum.shares ?? 0n,
        totalAmount: pendingApproval._sum.estimatedAmount ?? 0n,
      },
      processing: {
        count: processing._count,
        totalShares: processing._sum.shares ?? 0n,
        totalAmount: processing._sum.estimatedAmount ?? 0n,
      },
    };
  }
}

// Singleton instance
let redemptionQueueServiceInstance: RedemptionQueueService | null = null;

export function getRedemptionQueueService(prisma: PrismaClient): RedemptionQueueService {
  if (!redemptionQueueServiceInstance) {
    redemptionQueueServiceInstance = new RedemptionQueueService(prisma);
  }
  return redemptionQueueServiceInstance;
}
