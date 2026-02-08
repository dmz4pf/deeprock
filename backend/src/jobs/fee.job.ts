/**
 * Fee Accrual Background Job
 *
 * Periodically accrues management fees for all active pools.
 * Default: runs once per day at midnight.
 * For demo: set FEE_ACCRUAL_INTERVAL_MS to run more frequently.
 */

import { PrismaClient } from "@prisma/client";
import { FeeService, getFeeService } from "../services/fee.service.js";

export interface FeeJobConfig {
  intervalMs: number;
  enabled: boolean;
}

export interface FeeJob {
  start: () => void;
  stop: () => void;
  runNow: () => Promise<void>;
  isRunning: () => boolean;
}

// Default: run daily (24 hours)
const DEFAULT_INTERVAL_MS = 24 * 60 * 60 * 1000;

/**
 * Create fee accrual job
 */
export function createFeeJob(
  prisma: PrismaClient,
  config?: Partial<FeeJobConfig>
): FeeJob {
  const defaultConfig: FeeJobConfig = {
    intervalMs: parseInt(process.env.FEE_ACCRUAL_INTERVAL_MS || String(DEFAULT_INTERVAL_MS), 10),
    enabled: process.env.ENABLE_FEE_ACCRUAL !== "false",
  };

  const jobConfig = { ...defaultConfig, ...config };
  const feeService = getFeeService(prisma);

  let intervalId: NodeJS.Timeout | null = null;
  let isActive = false;

  const runAccrual = async (): Promise<void> => {
    if (!jobConfig.enabled) {
      return;
    }

    console.log("[Fee Job] Starting fee accrual cycle...");

    try {
      const results = await feeService.accrueManagementFees();

      if (results.length > 0) {
        console.log(`[Fee Job] Accrued fees for ${results.length} pool(s):`);
        for (const result of results) {
          console.log(
            `  - ${result.poolName}: ${result.feeType} fee = ${feeService.formatFeeAmount(result.amount)} (${result.period})`
          );
        }
      } else {
        console.log("[Fee Job] No fees to accrue (already processed today or no deposits)");
      }
    } catch (error: any) {
      console.error("[Fee Job] Accrual failed:", error.message);
    }
  };

  const start = (): void => {
    if (isActive) {
      console.log("[Fee Job] Already running");
      return;
    }

    if (!jobConfig.enabled) {
      console.log("[Fee Job] Disabled via ENABLE_FEE_ACCRUAL=false");
      return;
    }

    const intervalHours = jobConfig.intervalMs / 1000 / 60 / 60;
    console.log(`[Fee Job] Starting with interval: ${jobConfig.intervalMs}ms (${intervalHours.toFixed(1)} hours)`);

    // Run immediately on start
    runAccrual();

    // Then run on interval
    intervalId = setInterval(runAccrual, jobConfig.intervalMs);
    isActive = true;
  };

  const stop = (): void => {
    if (intervalId) {
      clearInterval(intervalId);
      intervalId = null;
    }
    isActive = false;
    console.log("[Fee Job] Stopped");
  };

  const runNow = async (): Promise<void> => {
    await runAccrual();
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
let feeJobInstance: FeeJob | null = null;

export function getFeeJob(prisma: PrismaClient): FeeJob {
  if (!feeJobInstance) {
    feeJobInstance = createFeeJob(prisma);
  }
  return feeJobInstance;
}
