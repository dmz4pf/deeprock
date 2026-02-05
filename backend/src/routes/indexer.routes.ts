import { Router, Request, Response } from "express";
import { z } from "zod";
import { getIndexer, startIndexer, stopIndexer } from "../jobs/indexer.job.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import { standardApiLimiter, strictLimiter } from "../middleware/rateLimit.middleware.js";

const router = Router();

// Validation schemas
const resetSchema = z.object({
  blockNumber: z.coerce.number().int().positive(),
});

// ==================== Public Endpoints ====================

/**
 * GET /api/indexer/status
 * Get indexer status
 */
router.get("/status", standardApiLimiter, async (req: Request, res: Response) => {
  try {
    const indexer = getIndexer();

    if (!indexer) {
      res.json({
        success: true,
        status: {
          running: false,
          message: "Indexer not initialized",
        },
      });
      return;
    }

    const status = await indexer.getStatus();

    res.json({
      success: true,
      status: {
        running: status.isRunning,
        lastIndexedBlock: status.lastIndexedBlock,
        currentBlock: status.currentBlock,
        blocksRemaining: status.blocksRemaining,
        eventsIndexed: status.eventsIndexed,
        syncProgress: status.currentBlock > 0
          ? ((status.lastIndexedBlock / status.currentBlock) * 100).toFixed(2) + "%"
          : "0%",
        isSynced: status.blocksRemaining <= 2,
      },
    });
  } catch (error: any) {
    console.error("Indexer status error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to get indexer status",
    });
  }
});

/**
 * GET /api/indexer/health
 * Quick health check for monitoring
 */
router.get("/health", async (req: Request, res: Response) => {
  try {
    const indexer = getIndexer();

    if (!indexer) {
      res.status(503).json({
        healthy: false,
        reason: "Indexer not running",
      });
      return;
    }

    const status = await indexer.getStatus();

    // Consider unhealthy if more than 100 blocks behind
    const healthy = status.blocksRemaining < 100;

    res.status(healthy ? 200 : 503).json({
      healthy,
      blocksRemaining: status.blocksRemaining,
      lastIndexedBlock: status.lastIndexedBlock,
    });
  } catch (error) {
    res.status(503).json({
      healthy: false,
      reason: "Error checking status",
    });
  }
});

// ==================== Protected Admin Endpoints ====================

/**
 * POST /api/indexer/start
 * Start the indexer (admin only)
 */
router.post("/start", requireAuth, strictLimiter, async (req: Request, res: Response) => {
  try {
    // TODO: Add admin role check
    // if (!req.user?.isAdmin) {
    //   return res.status(403).json({ success: false, error: "Admin access required" });
    // }

    const indexer = await startIndexer();

    if (!indexer) {
      res.status(500).json({
        success: false,
        error: "Failed to start indexer - check configuration",
      });
      return;
    }

    res.json({
      success: true,
      message: "Indexer started",
    });
  } catch (error: any) {
    console.error("Start indexer error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to start indexer",
    });
  }
});

/**
 * POST /api/indexer/stop
 * Stop the indexer (admin only)
 */
router.post("/stop", requireAuth, strictLimiter, async (req: Request, res: Response) => {
  try {
    // TODO: Add admin role check

    await stopIndexer();

    res.json({
      success: true,
      message: "Indexer stopped",
    });
  } catch (error: any) {
    console.error("Stop indexer error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to stop indexer",
    });
  }
});

/**
 * POST /api/indexer/index-batch
 * Manually trigger a single batch index (admin only)
 */
router.post("/index-batch", requireAuth, strictLimiter, async (req: Request, res: Response) => {
  try {
    // TODO: Add admin role check

    const indexer = getIndexer();

    if (!indexer) {
      res.status(400).json({
        success: false,
        error: "Indexer not initialized",
      });
      return;
    }

    const result = await indexer.indexBatch();

    res.json({
      success: true,
      result: {
        fromBlock: result.fromBlock,
        toBlock: result.toBlock,
        eventsProcessed: result.eventsProcessed,
      },
    });
  } catch (error: any) {
    console.error("Manual index error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to index batch",
    });
  }
});

/**
 * POST /api/indexer/reset
 * Reset indexer to a specific block (admin only)
 */
router.post("/reset", requireAuth, strictLimiter, async (req: Request, res: Response) => {
  try {
    // TODO: Add admin role check

    const { blockNumber } = resetSchema.parse(req.body);
    const indexer = getIndexer();

    if (!indexer) {
      res.status(400).json({
        success: false,
        error: "Indexer not initialized",
      });
      return;
    }

    await indexer.resetToBlock(blockNumber);

    res.json({
      success: true,
      message: `Indexer reset to block ${blockNumber}`,
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        error: "Invalid block number",
        details: error.errors,
      });
      return;
    }

    console.error("Reset indexer error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to reset indexer",
    });
  }
});

export default router;
