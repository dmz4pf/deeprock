/**
 * Settlement Background Job
 *
 * Periodically processes eligible redemption queue entries.
 * Default: runs every hour. Processes FIFO by queue position.
 */

import { PrismaClient } from "@prisma/client";
import { ethers } from "ethers";
import {
  RedemptionQueueService,
  getRedemptionQueueService,
  SettlementResult,
} from "../services/redemption-queue.service.js";
import { getSwapService } from "../services/swap.service.js";

export interface SettlementJobConfig {
  intervalMs: number;
  enabled: boolean;
  maxBatchSize: number;
}

export interface SettlementJob {
  start: () => void;
  stop: () => void;
  runNow: () => Promise<SettlementResult[]>;
  isRunning: () => boolean;
}

// Default: run hourly
const DEFAULT_INTERVAL_MS = 60 * 60 * 1000;
const DEFAULT_MAX_BATCH_SIZE = 10;

// RWAPool ABI (minimal for redeem)
const RWAPOOL_ABI = [
  "function redeem(uint256 chainPoolId, uint256 shares) external",
  "function getPositionValue(uint256 chainPoolId, address user) external view returns (uint256 shares, uint256 currentValue, uint256 depositedAmount)",
];

/**
 * Create settlement job
 */
export function createSettlementJob(
  prisma: PrismaClient,
  config?: Partial<SettlementJobConfig>
): SettlementJob {
  const defaultConfig: SettlementJobConfig = {
    intervalMs: parseInt(process.env.SETTLEMENT_INTERVAL_MS || String(DEFAULT_INTERVAL_MS), 10),
    enabled: process.env.ENABLE_SETTLEMENT_JOB !== "false",
    maxBatchSize: parseInt(process.env.SETTLEMENT_MAX_BATCH || String(DEFAULT_MAX_BATCH_SIZE), 10),
  };

  const jobConfig = { ...defaultConfig, ...config };
  const queueService = getRedemptionQueueService(prisma);
  const swapService = getSwapService(prisma);

  let intervalId: NodeJS.Timeout | null = null;
  let isActive = false;

  // Setup provider and contracts for on-chain execution
  const getExecutor = () => {
    const rpcUrl = process.env.AVALANCHE_RPC_URL;
    const relayerPrivateKey = process.env.RELAYER_PRIVATE_KEY;
    const rwaPoolAddress = process.env.RWA_POOL_ADDRESS;

    if (!rpcUrl || !relayerPrivateKey || !rwaPoolAddress) {
      console.warn("[Settlement Job] Missing config for on-chain execution");
      return null;
    }

    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const relayer = new ethers.Wallet(relayerPrivateKey, provider);
    const rwaPool = new ethers.Contract(rwaPoolAddress, RWAPOOL_ABI, relayer);

    return { provider, relayer, rwaPool };
  };

  const executeOnChain = async (
    chainPoolId: number,
    investor: string,
    shares: bigint
  ): Promise<{ txHash: string; amount: bigint }> => {
    const executor = getExecutor();
    if (!executor) {
      throw new Error("On-chain execution not configured");
    }

    const { rwaPool, relayer } = executor;

    // Get current position value for logging
    const [, currentValue] = await rwaPool.getPositionValue(chainPoolId, investor);

    console.log(`[Settlement] Executing on-chain redeem: pool=${chainPoolId}, shares=${shares}`);

    // In development/test mode, use mock execution for testing
    const isDevelopment = process.env.NODE_ENV === "development" || process.env.NODE_ENV === "test";

    if (isDevelopment && process.env.ENABLE_MOCK_SETTLEMENT === "true") {
      console.log("[Settlement] Using mock execution (development mode)");
      const mockTxHash = `0x${Buffer.from(Date.now().toString()).toString("hex").padStart(64, "0")}`;
      return {
        txHash: mockTxHash,
        amount: currentValue,
      };
    }

    // Production: Execute actual on-chain redemption
    // Note: In full production, this would build a UserOp and submit via bundler
    // For now, use direct contract call via relayer (requires trusted relayer role)
    try {
      const tx = await rwaPool.redeem(chainPoolId, shares);
      const receipt = await tx.wait();

      return {
        txHash: receipt.hash,
        amount: currentValue,
      };
    } catch (error: any) {
      console.error(`[Settlement] On-chain execution failed:`, error.message);
      throw new Error(`On-chain redemption failed: ${error.message}`);
    }
  };

  const runSettlement = async (): Promise<SettlementResult[]> => {
    if (!jobConfig.enabled) {
      return [];
    }

    console.log("[Settlement Job] Starting settlement cycle...");
    const results: SettlementResult[] = [];

    try {
      const eligible = await queueService.getEligibleRedemptions();

      if (eligible.length === 0) {
        console.log("[Settlement Job] No eligible redemptions to settle");
        return [];
      }

      console.log(`[Settlement Job] Found ${eligible.length} eligible redemptions`);

      // Process in batches
      const toProcess = eligible.slice(0, jobConfig.maxBatchSize);

      for (const entry of toProcess) {
        try {
          const result = await queueService.processSettlement(entry.id, executeOnChain);
          results.push(result);

          if (result.status === "SETTLED") {
            console.log(
              `[Settlement Job] Settled: ${entry.user.smartWalletAddress || entry.user.walletAddress} - ${entry.shares} shares from ${entry.pool.name}`
            );
          } else {
            console.error(`[Settlement Job] Failed: ${entry.id} - ${result.error}`);
          }
        } catch (error: any) {
          console.error(`[Settlement Job] Error processing ${entry.id}:`, error.message);
        }
      }

      console.log(`[Settlement Job] Processed ${results.length} redemptions`);

      // Cleanup stale swaps as part of periodic maintenance
      const cleanupResult = await swapService.cleanupStaleSwaps();
      if (cleanupResult.cleaned > 0) {
        console.log(`[Settlement Job] Cleaned up ${cleanupResult.cleaned} stale swaps`);
      }
    } catch (error: any) {
      console.error("[Settlement Job] Settlement cycle failed:", error.message);
    }

    return results;
  };

  const start = (): void => {
    if (isActive) {
      console.log("[Settlement Job] Already running");
      return;
    }

    if (!jobConfig.enabled) {
      console.log("[Settlement Job] Disabled via ENABLE_SETTLEMENT_JOB=false");
      return;
    }

    const intervalMinutes = jobConfig.intervalMs / 1000 / 60;
    console.log(`[Settlement Job] Starting with interval: ${jobConfig.intervalMs}ms (${intervalMinutes} minutes)`);

    // Run immediately on start
    runSettlement();

    // Then run on interval
    intervalId = setInterval(runSettlement, jobConfig.intervalMs);
    isActive = true;
  };

  const stop = (): void => {
    if (intervalId) {
      clearInterval(intervalId);
      intervalId = null;
    }
    isActive = false;
    console.log("[Settlement Job] Stopped");
  };

  const runNow = async (): Promise<SettlementResult[]> => {
    return await runSettlement();
  };

  const isRunning = (): boolean => isActive;

  return {
    start,
    stop,
    runNow,
    isRunning,
  };
}

// Singleton job instance
let settlementJobInstance: SettlementJob | null = null;

export function getSettlementJob(prisma: PrismaClient): SettlementJob {
  if (!settlementJobInstance) {
    settlementJobInstance = createSettlementJob(prisma);
  }
  return settlementJobInstance;
}
