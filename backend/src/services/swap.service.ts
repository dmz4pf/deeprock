/**
 * Pool Swap Service
 *
 * Handles atomic pool-to-pool swaps using smart wallet executeBatch().
 * Flow: redeem from source pool → approve USDC → invest in target pool
 * All three calls execute atomically in a single transaction.
 */

import { PrismaClient, SwapStatus } from "@prisma/client";
import { ethers } from "ethers";

// NAV precision (8 decimals) - matches contracts and other services
const NAV_BASE = BigInt(100_000_000);
const BPS_DENOMINATOR = 10000;

// Default swap fee: 0.25% (25 bps)
const DEFAULT_SWAP_FEE_BPS = 25;

// Quote expiry time (5 minutes)
const QUOTE_EXPIRY_MS = 5 * 60 * 1000;

// Slippage bounds (in basis points)
const MIN_SLIPPAGE_BPS = 0;
const MAX_SLIPPAGE_BPS = 1000; // 10% max slippage

// NAV sanity bounds (0.01 to 1000.00 in 8 decimal precision)
const MIN_VALID_NAV = BigInt(1_000_000); // 0.01
const MAX_VALID_NAV = BigInt(100_000_000_000); // 1000.00

export interface SwapQuote {
  sourcePoolId: string;
  targetPoolId: string;
  sharesIn: bigint;
  sourceNav: bigint;
  targetNav: bigint;
  sourceAmount: bigint; // USDC value of shares
  fee: bigint; // Swap fee in USDC
  targetAmount: bigint; // USDC after fee
  targetShares: bigint; // Shares received in target pool
  slippageBps: number;
  minOutputShares: bigint; // Minimum output with slippage
  expiresAt: Date;
}

export interface BuildSwapResult {
  swapId: string;
  callData: string; // executeBatch callData
  sourcePoolChainId: number;
  targetPoolChainId: number;
  quote: SwapQuote;
  userOpHash?: string; // Hash for UserOp tracking
}

export interface SwapResult {
  id: string;
  status: SwapStatus;
  txHash?: string;
  sourceShares: bigint;
  targetShares: bigint;
  fee: bigint;
}

export class SwapService {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  /**
   * Get a swap quote with NAV, fees, and slippage calculation
   */
  async getSwapQuote(
    userId: string,
    sourcePoolId: string,
    targetPoolId: string,
    shares: bigint,
    slippageBps: number = 50 // Default 0.5% slippage
  ): Promise<SwapQuote> {
    // Input validation
    if (shares <= 0n) {
      throw new Error("Shares must be positive");
    }

    if (slippageBps < MIN_SLIPPAGE_BPS || slippageBps > MAX_SLIPPAGE_BPS) {
      throw new Error(`Slippage must be between ${MIN_SLIPPAGE_BPS} and ${MAX_SLIPPAGE_BPS} bps`);
    }

    if (sourcePoolId === targetPoolId) {
      throw new Error("Source and target pools must be different");
    }

    // Get source and target pools
    const [sourcePool, targetPool] = await Promise.all([
      this.prisma.assetPool.findUnique({ where: { id: sourcePoolId } }),
      this.prisma.assetPool.findUnique({ where: { id: targetPoolId } }),
    ]);

    if (!sourcePool) {
      throw new Error("Source pool not found");
    }
    if (!targetPool) {
      throw new Error("Target pool not found");
    }

    if (sourcePool.status !== "ACTIVE") {
      throw new Error("Source pool is not active");
    }
    if (targetPool.status !== "ACTIVE") {
      throw new Error("Target pool is not active");
    }

    // Get user's position in source pool
    const userPosition = await this.getUserShares(userId, sourcePoolId);
    if (userPosition < shares) {
      throw new Error(`Insufficient shares. Have ${userPosition}, want to swap ${shares}`);
    }

    // Calculate USDC value from source pool
    const sourceNav = sourcePool.navPerShare;
    const targetNav = targetPool.navPerShare;

    // Validate NAV values are within reasonable bounds
    if (sourceNav < MIN_VALID_NAV || sourceNav > MAX_VALID_NAV) {
      throw new Error(`Source pool NAV ${sourceNav} is outside valid range`);
    }
    if (targetNav < MIN_VALID_NAV || targetNav > MAX_VALID_NAV) {
      throw new Error(`Target pool NAV ${targetNav} is outside valid range`);
    }

    const sourceAmount = (shares * sourceNav) / NAV_BASE;

    // Calculate swap fee
    const fee = (sourceAmount * BigInt(DEFAULT_SWAP_FEE_BPS)) / BigInt(BPS_DENOMINATOR);
    const targetAmount = sourceAmount - fee;

    // Calculate shares in target pool
    const targetShares = (targetAmount * NAV_BASE) / targetNav;

    // Apply slippage to get minimum output
    const slippageMultiplier = BigInt(BPS_DENOMINATOR - slippageBps);
    const minOutputShares = (targetShares * slippageMultiplier) / BigInt(BPS_DENOMINATOR);

    // Quote expires in 5 minutes
    const expiresAt = new Date(Date.now() + QUOTE_EXPIRY_MS);

    return {
      sourcePoolId,
      targetPoolId,
      sharesIn: shares,
      sourceNav,
      targetNav,
      sourceAmount,
      fee,
      targetAmount,
      targetShares,
      slippageBps,
      minOutputShares,
      expiresAt,
    };
  }

  /**
   * Build swap callData for executeBatch
   * Returns callData that smart wallet will execute atomically
   */
  async buildSwapUserOp(
    userId: string,
    sourcePoolId: string,
    targetPoolId: string,
    shares: bigint,
    slippageBps: number = 50
  ): Promise<BuildSwapResult> {
    // Get fresh quote
    const quote = await this.getSwapQuote(userId, sourcePoolId, targetPoolId, shares, slippageBps);

    // Get pool chain IDs and addresses
    const [sourcePool, targetPool] = await Promise.all([
      this.prisma.assetPool.findUnique({ where: { id: sourcePoolId } }),
      this.prisma.assetPool.findUnique({ where: { id: targetPoolId } }),
    ]);

    if (!sourcePool || !targetPool) {
      throw new Error("Pool not found");
    }

    // Get contract addresses from environment
    const rwaPoolAddress = process.env.RWA_POOL_ADDRESS;
    const usdcAddress = process.env.USDC_ADDRESS;

    if (!rwaPoolAddress) {
      throw new Error("RWA_POOL_ADDRESS not configured");
    }
    if (!usdcAddress) {
      throw new Error("USDC_ADDRESS not configured");
    }

    // Build batch callData
    const callData = this.buildSwapCallData(
      rwaPoolAddress,
      usdcAddress,
      sourcePool.chainPoolId,
      targetPool.chainPoolId,
      shares,
      quote.targetAmount
    );

    // Create pending swap record
    const swap = await this.prisma.poolSwap.create({
      data: {
        userId,
        sourcePoolId,
        targetPoolId,
        sharesSwapped: shares,
        sourceAmount: quote.sourceAmount,
        targetAmount: quote.targetAmount,
        targetShares: quote.targetShares,
        fee: quote.fee,
        sourceNavAtSwap: quote.sourceNav,
        targetNavAtSwap: quote.targetNav,
        slippageBps,
        minOutputAmount: quote.minOutputShares,
        status: SwapStatus.BUILDING,
      },
    });

    return {
      swapId: swap.id,
      callData,
      sourcePoolChainId: sourcePool.chainPoolId,
      targetPoolChainId: targetPool.chainPoolId,
      quote,
    };
  }

  /**
   * Build the executeBatch callData for atomic swap
   * Calls: redeem → approve → invest
   */
  private buildSwapCallData(
    poolAddress: string,
    usdcAddress: string,
    sourceChainPoolId: number,
    targetChainPoolId: number,
    shares: bigint,
    investAmount: bigint
  ): string {
    // Interfaces for encoding
    const poolInterface = new ethers.Interface([
      "function redeem(uint256 chainPoolId, uint256 shares) external",
      "function invest(uint256 chainPoolId, uint256 amount) external",
    ]);

    const erc20Interface = new ethers.Interface([
      "function approve(address spender, uint256 amount) external returns (bool)",
    ]);

    const walletInterface = new ethers.Interface([
      "function executeBatch(address[] calldata targets, uint256[] calldata values, bytes[] calldata datas) external",
    ]);

    // Encode individual calls
    const redeemData = poolInterface.encodeFunctionData("redeem", [
      sourceChainPoolId,
      shares,
    ]);

    const approveData = erc20Interface.encodeFunctionData("approve", [
      poolAddress,
      investAmount,
    ]);

    const investData = poolInterface.encodeFunctionData("invest", [
      targetChainPoolId,
      investAmount,
    ]);

    // Pack into executeBatch
    return walletInterface.encodeFunctionData("executeBatch", [
      [poolAddress, usdcAddress, poolAddress], // targets
      [0, 0, 0], // values (no ETH)
      [redeemData, approveData, investData], // calldata
    ]);
  }

  /**
   * Update swap status after signature
   */
  async markSwapAwaitingSignature(swapId: string): Promise<void> {
    await this.prisma.poolSwap.update({
      where: { id: swapId },
      data: { status: SwapStatus.AWAITING_SIGNATURE },
    });
  }

  /**
   * Update swap status after submission
   */
  async markSwapSubmitted(swapId: string, txHash?: string): Promise<void> {
    await this.prisma.poolSwap.update({
      where: { id: swapId },
      data: {
        status: SwapStatus.SUBMITTED,
        txHash,
      },
    });
  }

  /**
   * Mark swap as confirmed
   */
  async confirmSwap(swapId: string, txHash: string): Promise<SwapResult> {
    const swap = await this.prisma.poolSwap.update({
      where: { id: swapId },
      data: {
        status: SwapStatus.CONFIRMED,
        txHash,
      },
    });

    // Create investment records for audit trail
    await this.createSwapInvestments(swap);

    return {
      id: swap.id,
      status: swap.status,
      txHash: swap.txHash || undefined,
      sourceShares: swap.sharesSwapped,
      targetShares: swap.targetShares,
      fee: swap.fee,
    };
  }

  /**
   * Mark swap as failed
   */
  async failSwap(swapId: string, error: string): Promise<void> {
    await this.prisma.poolSwap.update({
      where: { id: swapId },
      data: {
        status: SwapStatus.FAILED,
        errorMessage: error,
      },
    });
  }

  /**
   * Cancel a pending swap
   */
  async cancelSwap(swapId: string, userId: string): Promise<void> {
    const swap = await this.prisma.poolSwap.findUnique({
      where: { id: swapId },
    });

    if (!swap) {
      throw new Error("Swap not found");
    }

    if (swap.userId !== userId) {
      throw new Error("Not authorized");
    }

    if (swap.status !== SwapStatus.PENDING &&
        swap.status !== SwapStatus.BUILDING &&
        swap.status !== SwapStatus.AWAITING_SIGNATURE) {
      throw new Error("Cannot cancel swap in current status");
    }

    await this.prisma.poolSwap.update({
      where: { id: swapId },
      data: { status: SwapStatus.CANCELLED },
    });
  }

  /**
   * Get swap by ID
   */
  async getSwap(swapId: string): Promise<any> {
    return await this.prisma.poolSwap.findUnique({
      where: { id: swapId },
      include: {
        sourcePool: { select: { name: true, navPerShare: true } },
        targetPool: { select: { name: true, navPerShare: true } },
      },
    });
  }

  /**
   * Get user's swap history
   */
  async getSwapHistory(userId: string, limit: number = 20): Promise<any[]> {
    return await this.prisma.poolSwap.findMany({
      where: { userId },
      include: {
        sourcePool: { select: { name: true } },
        targetPool: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    });
  }

  /**
   * Get user's total shares in a pool
   */
  private async getUserShares(userId: string, poolId: string): Promise<bigint> {
    // Sum of confirmed INVEST - confirmed REDEEM
    const [investments, redemptions] = await Promise.all([
      this.prisma.investment.aggregate({
        where: {
          userId,
          poolId,
          type: "INVEST",
          status: "CONFIRMED",
        },
        _sum: { shares: true },
      }),
      this.prisma.investment.aggregate({
        where: {
          userId,
          poolId,
          type: "REDEEM",
          status: "CONFIRMED",
        },
        _sum: { shares: true },
      }),
    ]);

    const invested = investments._sum.shares ?? 0n;
    const redeemed = redemptions._sum.shares ?? 0n;

    return invested - redeemed;
  }

  /**
   * Create investment records for completed swap
   */
  private async createSwapInvestments(swap: any): Promise<void> {
    await this.prisma.$transaction([
      // Record redemption from source pool
      this.prisma.investment.create({
        data: {
          userId: swap.userId,
          poolId: swap.sourcePoolId,
          type: "REDEEM",
          amount: swap.sourceAmount,
          shares: swap.sharesSwapped,
          status: "CONFIRMED",
          txHash: swap.txHash,
          sharePriceAtPurchase: swap.sourceNavAtSwap,
        },
      }),
      // Record investment in target pool
      this.prisma.investment.create({
        data: {
          userId: swap.userId,
          poolId: swap.targetPoolId,
          type: "INVEST",
          amount: swap.targetAmount,
          shares: swap.targetShares,
          status: "CONFIRMED",
          txHash: swap.txHash,
          sharePriceAtPurchase: swap.targetNavAtSwap,
        },
      }),
    ]);
  }

  /**
   * Validate swap is still executable (quote not expired, NAV within slippage)
   * Called before submission to ensure swap is still safe
   */
  async validateSwapExecution(swapId: string): Promise<{ valid: boolean; error?: string }> {
    const swap = await this.prisma.poolSwap.findUnique({
      where: { id: swapId },
      include: {
        sourcePool: { select: { navPerShare: true, status: true } },
        targetPool: { select: { navPerShare: true, status: true } },
      },
    });

    if (!swap) {
      return { valid: false, error: "Swap not found" };
    }

    // Check swap status
    if (swap.status !== SwapStatus.BUILDING && swap.status !== SwapStatus.AWAITING_SIGNATURE) {
      return { valid: false, error: `Invalid swap status: ${swap.status}` };
    }

    // Check pool status
    if (swap.sourcePool.status !== "ACTIVE") {
      return { valid: false, error: "Source pool is no longer active" };
    }
    if (swap.targetPool.status !== "ACTIVE") {
      return { valid: false, error: "Target pool is no longer active" };
    }

    // Check if quote expired (created more than 5 minutes ago)
    const ageMs = Date.now() - swap.createdAt.getTime();
    if (ageMs > QUOTE_EXPIRY_MS) {
      return { valid: false, error: "Swap quote has expired. Please get a new quote." };
    }

    // Check if NAV changed beyond slippage tolerance
    const currentSourceNav = swap.sourcePool.navPerShare;
    const currentTargetNav = swap.targetPool.navPerShare;

    // Calculate expected output with current NAV
    const currentSourceAmount = (swap.sharesSwapped * currentSourceNav) / NAV_BASE;
    const currentFee = (currentSourceAmount * BigInt(DEFAULT_SWAP_FEE_BPS)) / BigInt(BPS_DENOMINATOR);
    const currentTargetAmount = currentSourceAmount - currentFee;
    const currentTargetShares = (currentTargetAmount * NAV_BASE) / currentTargetNav;

    // Check against minOutputAmount (slippage-protected minimum)
    const minOutput = swap.minOutputAmount ?? 0n;
    if (minOutput > 0n && currentTargetShares < minOutput) {
      const slippagePercent = Number(swap.slippageBps) / 100;
      return {
        valid: false,
        error: `Price moved beyond ${slippagePercent}% slippage tolerance. Expected at least ${minOutput} shares, would receive ${currentTargetShares}. Please get a new quote.`,
      };
    }

    return { valid: true };
  }

  /**
   * Clean up expired/stale pending swaps
   * Called periodically to prevent database bloat
   */
  async cleanupStaleSwaps(): Promise<{ cleaned: number }> {
    const staleThreshold = new Date(Date.now() - QUOTE_EXPIRY_MS * 2); // 10 minutes

    const result = await this.prisma.poolSwap.updateMany({
      where: {
        status: {
          in: [SwapStatus.PENDING, SwapStatus.BUILDING, SwapStatus.AWAITING_SIGNATURE],
        },
        createdAt: { lt: staleThreshold },
      },
      data: {
        status: SwapStatus.CANCELLED,
        errorMessage: "Quote expired - swap cancelled automatically",
      },
    });

    if (result.count > 0) {
      console.log(`[Swap] Cleaned up ${result.count} stale swaps`);
    }

    return { cleaned: result.count };
  }

  /**
   * Get swap statistics for a user
   */
  async getSwapStats(userId: string): Promise<{
    totalSwaps: number;
    successfulSwaps: number;
    totalFeesPaid: bigint;
    totalVolumeSwapped: bigint;
  }> {
    const [totalCount, completed, fees, volume] = await Promise.all([
      this.prisma.poolSwap.count({
        where: { userId },
      }),
      this.prisma.poolSwap.count({
        where: { userId, status: SwapStatus.CONFIRMED },
      }),
      this.prisma.poolSwap.aggregate({
        where: { userId, status: SwapStatus.CONFIRMED },
        _sum: { fee: true },
      }),
      this.prisma.poolSwap.aggregate({
        where: { userId, status: SwapStatus.CONFIRMED },
        _sum: { sourceAmount: true },
      }),
    ]);

    return {
      totalSwaps: totalCount,
      successfulSwaps: completed,
      totalFeesPaid: fees._sum.fee ?? 0n,
      totalVolumeSwapped: volume._sum.sourceAmount ?? 0n,
    };
  }

  /**
   * Format amounts for display
   */
  formatUsdcAmount(amount: bigint): string {
    const usdcDecimals = 6;
    const intPart = amount / BigInt(10 ** usdcDecimals);
    const decPart = amount % BigInt(10 ** usdcDecimals);
    const decStr = decPart.toString().padStart(usdcDecimals, "0").slice(0, 2);
    return `$${intPart}.${decStr}`;
  }

  /**
   * Format shares for display
   */
  formatShares(shares: bigint): string {
    // Shares use 18 decimals
    const decimals = 18;
    const intPart = shares / BigInt(10 ** decimals);
    const decPart = shares % BigInt(10 ** decimals);
    const decStr = decPart.toString().padStart(decimals, "0").slice(0, 4);
    return `${intPart}.${decStr}`;
  }
}

// Singleton instance
let swapServiceInstance: SwapService | null = null;

export function getSwapService(prisma: PrismaClient): SwapService {
  if (!swapServiceInstance) {
    swapServiceInstance = new SwapService(prisma);
  }
  return swapServiceInstance;
}
