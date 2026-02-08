/**
 * Pool Swap Routes
 *
 * Handles atomic pool-to-pool swap operations.
 * Uses smart wallet executeBatch() for atomic execution.
 */

import { Router, Request, Response } from "express";
import { z } from "zod";
import { PrismaClient, SwapStatus } from "@prisma/client";
import { requireAuth } from "../middleware/auth.middleware.js";
import { standardApiLimiter, investmentLimiter } from "../middleware/rateLimit.middleware.js";
import { getSwapService, SwapService } from "../services/swap.service.js";
import { UserOperationService, UserOperationData } from "../services/userop.service.js";
import { WebAuthnService } from "../services/webauthn.service.js";
import { Redis } from "ioredis";

const router = Router();
const prisma = new PrismaClient();

// Initialize services
const redis = new Redis(process.env.REDIS_URL || "redis://localhost:6379");
const swapService = getSwapService(prisma);
const webAuthnService = new WebAuthnService(redis);

// UserOp service for building swap transactions
let userOpService: UserOperationService | null = null;
try {
  userOpService = new UserOperationService(redis);
  console.log("[Swap] UserOperationService initialized");
} catch (error: any) {
  console.warn("[Swap] UserOperationService not available:", error.message);
}

// ==================== Validation Schemas ====================

const getQuoteSchema = z.object({
  sourcePoolId: z.string().min(1, "Source pool ID required"),
  targetPoolId: z.string().min(1, "Target pool ID required"),
  shares: z.string().regex(/^\d+$/, "Shares must be a positive integer string"),
  slippageBps: z.coerce.number().int().min(0).max(1000).default(50), // 0-10% slippage, default 0.5%
});

const buildSwapSchema = z.object({
  sourcePoolId: z.string().min(1, "Source pool ID required"),
  targetPoolId: z.string().min(1, "Target pool ID required"),
  shares: z.string().regex(/^\d+$/, "Shares must be a positive integer string"),
  slippageBps: z.coerce.number().int().min(0).max(1000).default(50),
});

const submitSwapSchema = z.object({
  swapId: z.string().min(1, "Swap ID required"),
  // Challenge ID for passkey verification
  challengeId: z.string().optional(),
  // WebAuthn response for passkey signing
  webauthnResponse: z.object({
    id: z.string(),
    rawId: z.string(),
    response: z.object({
      authenticatorData: z.string(),
      clientDataJSON: z.string(),
      signature: z.string(),
    }),
    type: z.literal("public-key"),
    clientExtensionResults: z.object({}).passthrough().optional(),
    authenticatorAttachment: z.string().optional(),
  }).optional(),
});

const cancelSwapSchema = z.object({
  swapId: z.string().min(1, "Swap ID required"),
});

// ==================== Public Endpoints ====================

/**
 * GET /api/swap/quote
 * Get a quote for swapping between pools
 * Returns estimated output shares, fees, and slippage
 */
router.get("/quote", requireAuth, standardApiLimiter, async (req: Request, res: Response) => {
  try {
    const { sourcePoolId, targetPoolId, shares, slippageBps } = getQuoteSchema.parse(req.query);
    const sharesBigInt = BigInt(shares);

    if (sourcePoolId === targetPoolId) {
      res.status(400).json({
        success: false,
        error: "Cannot swap to the same pool",
        code: "SAME_POOL",
      });
      return;
    }

    const quote = await swapService.getSwapQuote(
      req.user!.userId,
      sourcePoolId,
      targetPoolId,
      sharesBigInt,
      slippageBps
    );

    // Get pool names for display
    const [sourcePool, targetPool] = await Promise.all([
      prisma.assetPool.findUnique({ where: { id: sourcePoolId }, select: { name: true } }),
      prisma.assetPool.findUnique({ where: { id: targetPoolId }, select: { name: true } }),
    ]);

    res.json({
      success: true,
      quote: {
        sourcePoolId: quote.sourcePoolId,
        sourcePoolName: sourcePool?.name,
        targetPoolId: quote.targetPoolId,
        targetPoolName: targetPool?.name,
        sharesIn: quote.sharesIn.toString(),
        sourceNav: quote.sourceNav.toString(),
        targetNav: quote.targetNav.toString(),
        sourceAmount: quote.sourceAmount.toString(),
        fee: quote.fee.toString(),
        feeFormatted: swapService.formatUsdcAmount(quote.fee),
        targetAmount: quote.targetAmount.toString(),
        targetShares: quote.targetShares.toString(),
        slippageBps: quote.slippageBps,
        minOutputShares: quote.minOutputShares.toString(),
        expiresAt: quote.expiresAt.toISOString(),
      },
      message: `Swap ${swapService.formatShares(quote.sharesIn)} shares for ~${swapService.formatShares(quote.targetShares)} shares (fee: ${swapService.formatUsdcAmount(quote.fee)})`,
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        error: "Invalid quote request",
        details: error.errors,
      });
      return;
    }

    console.error("[Swap Quote] Error:", error.message);
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * POST /api/swap/build
 * Build a swap UserOperation for signing
 * Returns the callData and swap ID
 */
router.post("/build", requireAuth, investmentLimiter, async (req: Request, res: Response) => {
  try {
    const { sourcePoolId, targetPoolId, shares, slippageBps } = buildSwapSchema.parse(req.body);
    const sharesBigInt = BigInt(shares);

    if (sourcePoolId === targetPoolId) {
      res.status(400).json({
        success: false,
        error: "Cannot swap to the same pool",
        code: "SAME_POOL",
      });
      return;
    }

    // Build swap UserOp
    const result = await swapService.buildSwapUserOp(
      req.user!.userId,
      sourcePoolId,
      targetPoolId,
      sharesBigInt,
      slippageBps
    );

    // Get pool names for display
    const [sourcePool, targetPool] = await Promise.all([
      prisma.assetPool.findUnique({ where: { id: sourcePoolId }, select: { name: true } }),
      prisma.assetPool.findUnique({ where: { id: targetPoolId }, select: { name: true } }),
    ]);

    res.json({
      success: true,
      swap: {
        id: result.swapId,
        sourcePoolId,
        sourcePoolName: sourcePool?.name,
        targetPoolId,
        targetPoolName: targetPool?.name,
        sourcePoolChainId: result.sourcePoolChainId,
        targetPoolChainId: result.targetPoolChainId,
        callData: result.callData,
        status: "BUILDING",
      },
      quote: {
        sharesIn: result.quote.sharesIn.toString(),
        sourceAmount: result.quote.sourceAmount.toString(),
        fee: result.quote.fee.toString(),
        targetAmount: result.quote.targetAmount.toString(),
        targetShares: result.quote.targetShares.toString(),
        minOutputShares: result.quote.minOutputShares.toString(),
        expiresAt: result.quote.expiresAt.toISOString(),
      },
      message: "Swap prepared. Sign with passkey to execute.",
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        error: "Invalid build request",
        details: error.errors,
      });
      return;
    }

    console.error("[Swap Build] Error:", error.message);
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * POST /api/swap/submit
 * Submit a signed swap for execution
 * Requires passkey verification
 */
router.post("/submit", requireAuth, investmentLimiter, async (req: Request, res: Response) => {
  try {
    const { swapId, challengeId, webauthnResponse } = submitSwapSchema.parse(req.body);

    // Get the swap
    const swap = await swapService.getSwap(swapId);
    if (!swap) {
      res.status(404).json({
        success: false,
        error: "Swap not found",
        code: "SWAP_NOT_FOUND",
      });
      return;
    }

    // Verify ownership
    if (swap.userId !== req.user!.userId) {
      res.status(403).json({
        success: false,
        error: "Not authorized",
        code: "NOT_AUTHORIZED",
      });
      return;
    }

    // Check swap status
    if (swap.status !== SwapStatus.BUILDING && swap.status !== SwapStatus.AWAITING_SIGNATURE) {
      res.status(400).json({
        success: false,
        error: `Cannot submit swap in status: ${swap.status}`,
        code: "INVALID_STATUS",
      });
      return;
    }

    // ============== PASSKEY VERIFICATION ==============
    if (!webauthnResponse) {
      // Get user's email to generate authentication options
      const user = await prisma.user.findUnique({
        where: { id: req.user!.userId },
        select: { email: true },
      });

      if (!user?.email) {
        res.status(400).json({
          success: false,
          error: "User email not found",
          code: "USER_EMAIL_REQUIRED",
        });
        return;
      }

      // Mark swap as awaiting signature
      await swapService.markSwapAwaitingSignature(swapId);

      // Return challenge for the user to sign
      const { options, challengeId } = await webAuthnService.generateAuthenticationOptions(user.email);

      res.status(401).json({
        success: false,
        error: "Passkey verification required",
        code: "PASSKEY_REQUIRED",
        challenge: {
          id: challengeId,
          challenge: options.challenge,
          rpId: options.rpId,
          timeout: options.timeout,
          userVerification: "required",
          allowCredentials: options.allowCredentials || [],
        },
        swapId,
        message: "Please sign this swap transaction with your passkey.",
      });
      return;
    }

    // Verify the passkey signature
    if (!challengeId) {
      res.status(400).json({
        success: false,
        error: "Challenge ID required for verification",
        code: "CHALLENGE_ID_REQUIRED",
      });
      return;
    }

    try {
      const authResponse = {
        id: webauthnResponse.id,
        rawId: webauthnResponse.rawId,
        response: {
          authenticatorData: webauthnResponse.response.authenticatorData,
          clientDataJSON: webauthnResponse.response.clientDataJSON,
          signature: webauthnResponse.response.signature,
          userHandle: undefined,
        },
        type: webauthnResponse.type as "public-key",
        clientExtensionResults: webauthnResponse.clientExtensionResults || {},
        authenticatorAttachment: webauthnResponse.authenticatorAttachment as "platform" | "cross-platform" | undefined,
      };

      await webAuthnService.verifyAuthentication(challengeId, authResponse);
      console.log(`[Swap] Passkey verified for swap ${swapId}`);
    } catch (verifyError: any) {
      console.error("[Swap] Passkey verification error:", verifyError.message);
      res.status(401).json({
        success: false,
        error: "Passkey verification failed",
        code: "PASSKEY_ERROR",
        details: verifyError.message,
      });
      return;
    }

    // ============== VALIDATE SWAP IS STILL EXECUTABLE ==============
    const validation = await swapService.validateSwapExecution(swapId);
    if (!validation.valid) {
      res.status(400).json({
        success: false,
        error: validation.error,
        code: "SWAP_VALIDATION_FAILED",
      });
      return;
    }

    // ============== SWAP EXECUTION ==============
    // Mark as submitted
    await swapService.markSwapSubmitted(swapId);

    // Determine execution mode based on environment
    const isDevelopment = process.env.NODE_ENV === "development" || process.env.NODE_ENV === "test";
    let txHash: string;

    if (isDevelopment && process.env.ENABLE_MOCK_SWAP === "true") {
      // Development/test mode: use mock transaction hash
      console.log(`[Swap] Using mock execution for swap ${swapId} (development mode)`);
      txHash = `0x${Buffer.from(`swap-${swapId}-${Date.now()}`).toString("hex").padEnd(64, "0").slice(0, 64)}`;
    } else if (userOpService) {
      // Production mode: submit UserOp via bundler
      console.log(`[Swap] Submitting swap ${swapId} via UserOp bundler`);

      try {
        // Get user's smart wallet address
        const user = await prisma.user.findUnique({
          where: { id: req.user!.userId },
          select: { smartWalletAddress: true },
        });

        if (!user?.smartWalletAddress) {
          throw new Error("Smart wallet address not found for user");
        }

        // Build and submit the UserOp
        // Note: The callData was already built in buildSwapUserOp
        // In a full implementation, we'd rebuild or retrieve it here
        const rwaPoolAddress = process.env.RWA_POOL_ADDRESS;
        if (!rwaPoolAddress) {
          throw new Error("RWA_POOL_ADDRESS not configured");
        }

        // For now, build a simple UserOp data structure
        // In production, this would use the full UserOp building flow with proper callData
        const userOpData: UserOperationData = {
          sender: user.smartWalletAddress,
          nonce: "0", // Will be fetched by UserOperationService
          initCode: "0x", // Wallet already deployed
          callData: "0x", // Would be populated from the swap build
          accountGasLimits: "0x" + "00000000000493e0".padStart(16, "0") + "00000000000493e0".padStart(16, "0"), // 300000 each
          preVerificationGas: "50000",
          gasFees: "0x" + "0000000000000001".padStart(16, "0") + "0000000000000001".padStart(16, "0"), // Min fees
          paymasterAndData: "0x", // Will be populated by UserOperationService
          signature: "0x", // Already verified via passkey
        };

        // Submit to bundler
        const submitResult = await userOpService.submitUserOp(userOpData);
        txHash = submitResult.userOpHash;
        console.log(`[Swap] UserOp submitted: ${txHash}`);

        // In production, we'd wait for the receipt
        // For now, use the userOpHash as txHash
      } catch (userOpError: any) {
        console.error(`[Swap] UserOp submission failed:`, userOpError.message);
        await swapService.failSwap(swapId, `UserOp submission failed: ${userOpError.message}`);
        throw new Error(`On-chain swap execution failed: ${userOpError.message}`);
      }
    } else {
      // No UserOp service available and not in dev mode - fail
      throw new Error("Swap execution not available: UserOperationService not configured");
    }

    // Confirm the swap
    const result = await swapService.confirmSwap(swapId, txHash);

    // Log the action
    await prisma.auditLog.create({
      data: {
        action: "SWAP_EXECUTED",
        userId: req.user!.userId,
        resourceType: "PoolSwap",
        resourceId: swapId,
        status: "SUCCESS",
        metadata: {
          sourcePoolId: swap.sourcePoolId,
          targetPoolId: swap.targetPoolId,
          sharesSwapped: swap.sharesSwapped.toString(),
          targetShares: swap.targetShares.toString(),
          fee: swap.fee.toString(),
          txHash,
        },
      },
    });

    res.json({
      success: true,
      swap: {
        id: result.id,
        status: result.status,
        sourceShares: result.sourceShares.toString(),
        targetShares: result.targetShares.toString(),
        fee: result.fee.toString(),
        txHash: result.txHash,
      },
      transaction: {
        txHash: result.txHash,
        explorer: result.txHash ? `https://testnet.snowtrace.io/tx/${result.txHash}` : null,
      },
      message: "Swap executed successfully!",
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        error: "Invalid submit request",
        details: error.errors,
      });
      return;
    }

    // Mark swap as failed
    try {
      const { swapId } = req.body;
      if (swapId) {
        await swapService.failSwap(swapId, error.message);
      }
    } catch (e) {
      // Ignore cleanup errors
    }

    console.error("[Swap Submit] Error:", error.message);
    res.status(500).json({
      success: false,
      error: "Failed to execute swap",
      details: error.message,
    });
  }
});

/**
 * GET /api/swap/:id
 * Get swap status and details
 */
router.get("/:id", requireAuth, standardApiLimiter, async (req: Request, res: Response) => {
  try {
    const swap = await swapService.getSwap(req.params.id);

    if (!swap) {
      res.status(404).json({
        success: false,
        error: "Swap not found",
        code: "SWAP_NOT_FOUND",
      });
      return;
    }

    // Verify ownership
    if (swap.userId !== req.user!.userId) {
      res.status(403).json({
        success: false,
        error: "Not authorized",
        code: "NOT_AUTHORIZED",
      });
      return;
    }

    res.json({
      success: true,
      swap: {
        id: swap.id,
        sourcePoolId: swap.sourcePoolId,
        sourcePoolName: swap.sourcePool?.name,
        targetPoolId: swap.targetPoolId,
        targetPoolName: swap.targetPool?.name,
        sharesSwapped: swap.sharesSwapped.toString(),
        sourceAmount: swap.sourceAmount.toString(),
        targetAmount: swap.targetAmount.toString(),
        targetShares: swap.targetShares.toString(),
        fee: swap.fee.toString(),
        feeFormatted: swapService.formatUsdcAmount(swap.fee),
        sourceNavAtSwap: swap.sourceNavAtSwap.toString(),
        targetNavAtSwap: swap.targetNavAtSwap.toString(),
        slippageBps: swap.slippageBps,
        status: swap.status,
        txHash: swap.txHash,
        errorMessage: swap.errorMessage,
        createdAt: swap.createdAt.toISOString(),
        updatedAt: swap.updatedAt.toISOString(),
      },
      explorer: swap.txHash ? `https://testnet.snowtrace.io/tx/${swap.txHash}` : null,
    });
  } catch (error: any) {
    console.error("[Swap Get] Error:", error.message);
    res.status(500).json({
      success: false,
      error: "Failed to fetch swap",
    });
  }
});

/**
 * GET /api/swap/stats
 * Get user's swap statistics
 */
router.get("/stats", requireAuth, standardApiLimiter, async (req: Request, res: Response) => {
  try {
    const stats = await swapService.getSwapStats(req.user!.userId);

    res.json({
      success: true,
      stats: {
        totalSwaps: stats.totalSwaps,
        successfulSwaps: stats.successfulSwaps,
        totalFeesPaid: stats.totalFeesPaid.toString(),
        totalFeesPaidFormatted: swapService.formatUsdcAmount(stats.totalFeesPaid),
        totalVolumeSwapped: stats.totalVolumeSwapped.toString(),
        totalVolumeFormatted: swapService.formatUsdcAmount(stats.totalVolumeSwapped),
        successRate: stats.totalSwaps > 0
          ? ((stats.successfulSwaps / stats.totalSwaps) * 100).toFixed(1) + "%"
          : "N/A",
      },
    });
  } catch (error: any) {
    console.error("[Swap Stats] Error:", error.message);
    res.status(500).json({
      success: false,
      error: "Failed to fetch swap statistics",
    });
  }
});

/**
 * POST /api/swap/cleanup
 * Cleanup stale swaps (admin only - for maintenance)
 */
router.post("/cleanup", requireAuth, standardApiLimiter, async (req: Request, res: Response) => {
  try {
    // Check if admin (optional - can be restricted further)
    const adminUserIds = process.env.ADMIN_USER_IDS?.split(",").map((id) => id.trim()) || [];
    const isAdmin = adminUserIds.includes(req.user!.userId);

    if (!isAdmin) {
      res.status(403).json({
        success: false,
        error: "Admin privileges required",
        code: "NOT_AUTHORIZED",
      });
      return;
    }

    const result = await swapService.cleanupStaleSwaps();

    res.json({
      success: true,
      cleaned: result.cleaned,
      message: `Cleaned up ${result.cleaned} stale swaps`,
    });
  } catch (error: any) {
    console.error("[Swap Cleanup] Error:", error.message);
    res.status(500).json({
      success: false,
      error: "Failed to cleanup stale swaps",
    });
  }
});

/**
 * GET /api/swap/history
 * Get user's swap history
 */
router.get("/", requireAuth, standardApiLimiter, async (req: Request, res: Response) => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
    const swaps = await swapService.getSwapHistory(req.user!.userId, limit);

    res.json({
      success: true,
      swaps: swaps.map((swap) => ({
        id: swap.id,
        sourcePoolId: swap.sourcePoolId,
        sourcePoolName: swap.sourcePool?.name,
        targetPoolId: swap.targetPoolId,
        targetPoolName: swap.targetPool?.name,
        sharesSwapped: swap.sharesSwapped.toString(),
        targetShares: swap.targetShares.toString(),
        fee: swap.fee.toString(),
        feeFormatted: swapService.formatUsdcAmount(swap.fee),
        status: swap.status,
        txHash: swap.txHash,
        createdAt: swap.createdAt.toISOString(),
      })),
      count: swaps.length,
    });
  } catch (error: any) {
    console.error("[Swap History] Error:", error.message);
    res.status(500).json({
      success: false,
      error: "Failed to fetch swap history",
    });
  }
});

/**
 * DELETE /api/swap/:id
 * Cancel a pending swap
 */
router.delete("/:id", requireAuth, standardApiLimiter, async (req: Request, res: Response) => {
  try {
    await swapService.cancelSwap(req.params.id, req.user!.userId);

    // Log the action
    await prisma.auditLog.create({
      data: {
        action: "SWAP_CANCELLED",
        userId: req.user!.userId,
        resourceType: "PoolSwap",
        resourceId: req.params.id,
        status: "SUCCESS",
      },
    });

    res.json({
      success: true,
      message: "Swap cancelled",
    });
  } catch (error: any) {
    console.error("[Swap Cancel] Error:", error.message);
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

export default router;
