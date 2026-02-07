/**
 * NAV Update Background Job
 *
 * Periodically updates pool NAV based on APY for simulated growth.
 * Default: runs every hour. For demo: set NAV_UPDATE_INTERVAL_MS=60000 (1 minute)
 */

import { PrismaClient } from "@prisma/client";
import { NavService, getNavService } from "../services/nav.service.js";

export interface NavJobConfig {
  intervalMs: number;
  enabled: boolean;
}

export interface NavJob {
  start: () => void;
  stop: () => void;
  runNow: () => Promise<void>;
  isRunning: () => boolean;
}

/**
 * Create NAV update job
 *
 * @param prisma - Prisma client instance
 * @param config - Optional config override
 */
export function createNavJob(
  prisma: PrismaClient,
  config?: Partial<NavJobConfig>
): NavJob {
  const defaultConfig: NavJobConfig = {
    intervalMs: parseInt(process.env.NAV_UPDATE_INTERVAL_MS || "3600000", 10), // 1 hour default
    enabled: process.env.ENABLE_NAV_SIMULATION !== "false",
  };

  const jobConfig = { ...defaultConfig, ...config };
  const navService = getNavService(prisma);

  let intervalId: NodeJS.Timeout | null = null;
  let isActive = false;

  const runUpdate = async (): Promise<void> => {
    if (!jobConfig.enabled) {
      return;
    }

    console.log("[NAV Job] Starting NAV update cycle...");

    try {
      const results = await navService.updateAllPoolNavs();

      if (results.length > 0) {
        console.log(`[NAV Job] Updated ${results.length} pool(s):`);
        for (const result of results) {
          console.log(
            `  - ${result.poolName}: ${navService.formatNav(result.previousNav)} → ${navService.formatNav(result.newNav)} (+${result.growthPercent}%)`
          );
        }
      } else {
        console.log("[NAV Job] No pools needed update (less than 1 hour since last update)");
      }
    } catch (error: any) {
      console.error("[NAV Job] Update failed:", error.message);
    }
  };

  const start = (): void => {
    if (isActive) {
      console.log("[NAV Job] Already running");
      return;
    }

    if (!jobConfig.enabled) {
      console.log("[NAV Job] Disabled via ENABLE_NAV_SIMULATION=false");
      return;
    }

    console.log(`[NAV Job] Starting with interval: ${jobConfig.intervalMs}ms (${jobConfig.intervalMs / 1000 / 60} minutes)`);

    // Run immediately on start
    runUpdate();

    // Then run on interval
    intervalId = setInterval(runUpdate, jobConfig.intervalMs);
    isActive = true;
  };

  const stop = (): void => {
    if (intervalId) {
      clearInterval(intervalId);
      intervalId = null;
    }
    isActive = false;
    console.log("[NAV Job] Stopped");
  };

  const runNow = async (): Promise<void> => {
    await runUpdate();
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
let navJobInstance: NavJob | null = null;

export function getNavJob(prisma: PrismaClient): NavJob {
  if (!navJobInstance) {
    navJobInstance = createNavJob(prisma);
  }
  return navJobInstance;
}
