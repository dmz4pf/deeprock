import { Router, Request, Response } from "express";
import { z } from "zod";
import { PrismaClient, AssetClass, PoolStatus } from "@prisma/client";
import { requireAuth, optionalAuth } from "../middleware/auth.middleware.js";
import { standardApiLimiter, investmentLimiter } from "../middleware/rateLimit.middleware.js";
import { WebAuthnService } from "../services/webauthn.service.js";
import { RelayerService } from "../services/relayer.service.js";
import { PermitService, getPermitService } from "../services/permit.service.js";
import { Redis } from "ioredis";

const router = Router();
const prisma = new PrismaClient();

// Initialize WebAuthn service for investment signing
const redis = new Redis(process.env.REDIS_URL || "redis://localhost:6379");
const webAuthnService = new WebAuthnService(redis);

// Initialize RelayerService for on-chain transactions (optional - graceful degradation)
let relayerService: RelayerService | null = null;
try {
  if (process.env.RELAYER_PRIVATE_KEY && process.env.RWA_POOL_ADDRESS) {
    relayerService = new RelayerService(redis);
    console.log("[Pools] RelayerService initialized for on-chain transactions");
  } else {
    console.log("[Pools] RelayerService not configured - investments will be off-chain only");
  }
} catch (error: any) {
  console.error("[Pools] RelayerService init failed:", error.message);
}

// Asset class mapping: Backend enum → Frontend format
const assetClassToFrontend: Record<AssetClass, string> = {
  TREASURY: "treasury",
  REAL_ESTATE: "real-estate",
  PRIVATE_CREDIT: "private-credit",
  COMMODITIES: "commodities",
  CORPORATE_BONDS: "corporate-bonds",
};

// Frontend format → Backend enum
const frontendToAssetClass: Record<string, AssetClass> = {
  "treasury": AssetClass.TREASURY,
  "real-estate": AssetClass.REAL_ESTATE,
  "private-credit": AssetClass.PRIVATE_CREDIT,
  "commodities": AssetClass.COMMODITIES,
  "corporate-bonds": AssetClass.CORPORATE_BONDS,
};

// Status mapping
const statusToFrontend: Record<PoolStatus, string> = {
  ACTIVE: "active",
  PAUSED: "paused",
  CLOSED: "closed",
};

// ==================== Validation Schemas ====================

const listPoolsQuerySchema = z.object({
  // Accept frontend format (lowercase kebab-case) and convert
  assetClass: z.string().optional(),
  status: z.string().optional(),
  minYield: z.coerce.number().min(0).max(10000).optional(),
  maxYield: z.coerce.number().min(0).max(10000).optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z.enum(["yieldRateBps", "totalDeposited", "createdAt"]).default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

const investSchema = z.object({
  amount: z.string().regex(/^\d+$/, "Amount must be a positive integer string"),
  // Challenge ID returned from initial request (required when webauthnResponse is provided)
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
  }).optional(), // Optional for initial request (to get challenge), required for verification
});

const redeemSchema = z.object({
  shares: z.string().regex(/^\d+$/, "Shares must be a positive integer string"),
});

// Schema for permit-based investment (EIP-2612 gasless approval)
const permitInvestSchema = z.object({
  amount: z.string().regex(/^\d+$/, "Amount must be a positive integer string"),
  deadline: z.number().int().positive("Deadline must be a positive timestamp"),
  signature: z.string().regex(/^0x[a-fA-F0-9]+$/, "Invalid signature format"),
});

// Schema for getting permit data (what user needs to sign)
const permitDataSchema = z.object({
  amount: z.string().regex(/^\d+$/, "Amount must be a positive integer string"),
  deadline: z.number().int().positive().optional(),
});

// ==================== Public Endpoints ====================

/**
 * GET /api/pools
 * List all active pools with filtering and pagination
 */
router.get("/", standardApiLimiter, optionalAuth, async (req: Request, res: Response) => {
  try {
    const query = listPoolsQuerySchema.parse(req.query);
    const { page, limit, sortBy, sortOrder, assetClass, status, minYield, maxYield } = query;

    // Build where clause
    const where: any = {};

    // Convert frontend asset class format to backend enum
    if (assetClass && frontendToAssetClass[assetClass]) {
      where.assetClass = frontendToAssetClass[assetClass];
    }

    if (status) {
      // Convert status if needed
      const statusMap: Record<string, PoolStatus> = {
        active: PoolStatus.ACTIVE,
        paused: PoolStatus.PAUSED,
        closed: PoolStatus.CLOSED,
      };
      where.status = statusMap[status] || PoolStatus.ACTIVE;
    } else {
      // Default to active pools only
      where.status = PoolStatus.ACTIVE;
    }

    if (minYield !== undefined || maxYield !== undefined) {
      where.yieldRateBps = {};
      if (minYield !== undefined) where.yieldRateBps.gte = minYield;
      if (maxYield !== undefined) where.yieldRateBps.lte = maxYield;
    }

    // Get total count
    const total = await prisma.assetPool.count({ where });

    // Get pools with pagination
    const pools = await prisma.assetPool.findMany({
      where,
      orderBy: { [sortBy]: sortOrder },
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true,
        chainPoolId: true,
        name: true,
        assetClass: true,
        rwaTokenAddress: true,
        yieldRateBps: true,
        totalDeposited: true,
        investorCount: true,
        minInvestment: true,
        maxInvestment: true,
        status: true,
        metadata: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Format response to match frontend Pool interface
    const formattedPools = pools.map((pool) => {
      const metadata = pool.metadata as any || {};
      const totalCapacity = BigInt(metadata.totalCapacity || pool.totalDeposited.toString());
      const deposited = pool.totalDeposited;
      const availableCapacity = totalCapacity > deposited ? totalCapacity - deposited : BigInt(0);

      return {
        id: pool.id,
        name: pool.name,
        description: metadata.description || "",
        assetClass: assetClassToFrontend[pool.assetClass],
        status: statusToFrontend[pool.status],
        totalValue: totalCapacity.toString(),
        availableCapacity: availableCapacity.toString(),
        yieldRate: pool.yieldRateBps / 100, // Convert basis points to percentage
        minInvestment: pool.minInvestment.toString(),
        maxInvestment: pool.maxInvestment.toString(),
        lockupPeriod: metadata.lockupPeriod || 0,
        riskRating: metadata.riskRating || "medium",
        documents: metadata.documents,
        createdAt: pool.createdAt.toISOString(),
        updatedAt: pool.updatedAt?.toISOString() || pool.createdAt.toISOString(),
        // Additional backend data
        chainPoolId: pool.chainPoolId,
        investorCount: pool.investorCount,
        rwaTokenAddress: pool.rwaTokenAddress,
      };
    });

    res.json({
      success: true,
      pools: formattedPools, // Changed from 'data' to 'pools' to match frontend expectation
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasMore: page * limit < total,
      },
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        error: "Invalid query parameters",
        details: error.errors,
      });
      return;
    }

    console.error("List pools error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch pools",
    });
  }
});

/**
 * GET /api/pools/summary
 * Get summary statistics for all pools
 */
router.get("/summary", standardApiLimiter, async (req: Request, res: Response) => {
  try {
    // Get aggregate stats
    const stats = await prisma.assetPool.aggregate({
      where: { status: PoolStatus.ACTIVE },
      _sum: {
        totalDeposited: true,
        investorCount: true,
      },
      _avg: {
        yieldRateBps: true,
      },
      _count: true,
    });

    // Get breakdown by asset class
    const byAssetClass = await prisma.assetPool.groupBy({
      by: ["assetClass"],
      where: { status: PoolStatus.ACTIVE },
      _sum: {
        totalDeposited: true,
      },
      _count: true,
    });

    res.json({
      success: true,
      summary: {
        totalPools: stats._count,
        totalValueLocked: stats._sum.totalDeposited?.toString() || "0",
        totalInvestors: stats._sum.investorCount || 0,
        averageYieldBps: Math.round(stats._avg.yieldRateBps || 0),
        averageYieldPercent: ((stats._avg.yieldRateBps || 0) / 100).toFixed(2),
      },
      byAssetClass: byAssetClass.map((item) => ({
        assetClass: item.assetClass,
        poolCount: item._count,
        totalDeposited: item._sum.totalDeposited?.toString() || "0",
      })),
    });
  } catch (error: any) {
    console.error("Pool summary error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch pool summary",
    });
  }
});

/**
 * GET /api/pools/:id
 * Get detailed pool information
 */
router.get("/:id", standardApiLimiter, optionalAuth, async (req: Request, res: Response) => {
  try {
    const pool = await prisma.assetPool.findUnique({
      where: { id: req.params.id },
      include: {
        yieldHistory: {
          orderBy: { recordedAt: "desc" },
          take: 30, // Last 30 yield records
        },
        _count: {
          select: { investments: true },
        },
      },
    });

    if (!pool) {
      res.status(404).json({
        success: false,
        error: "Pool not found",
        code: "POOL_NOT_FOUND",
      });
      return;
    }

    // Check if user has investment in this pool
    let userInvestment = null;
    if (req.user) {
      const investments = await prisma.investment.aggregate({
        where: {
          poolId: pool.id,
          userId: req.user.userId,
          status: "CONFIRMED",
        },
        _sum: {
          amount: true,
          shares: true,
        },
      });

      if (investments._sum.amount) {
        userInvestment = {
          totalInvested: investments._sum.amount.toString(),
          totalShares: investments._sum.shares?.toString() || "0",
        };
      }
    }

    // Format to match frontend Pool interface
    const metadata = pool.metadata as any || {};
    const totalCapacity = BigInt(metadata.totalCapacity || pool.totalDeposited.toString());
    const deposited = pool.totalDeposited;
    const availableCapacity = totalCapacity > deposited ? totalCapacity - deposited : BigInt(0);

    res.json({
      success: true,
      pool: {
        id: pool.id,
        chainPoolId: pool.chainPoolId,
        name: pool.name,
        description: metadata.description || "",
        assetClass: assetClassToFrontend[pool.assetClass], // Frontend format
        status: statusToFrontend[pool.status], // Frontend format
        rwaTokenAddress: pool.rwaTokenAddress,
        yieldRate: pool.yieldRateBps / 100, // Convert to percentage
        totalValue: totalCapacity.toString(),
        availableCapacity: availableCapacity.toString(),
        investorCount: pool.investorCount,
        minInvestment: pool.minInvestment.toString(),
        maxInvestment: pool.maxInvestment.toString(),
        lockupPeriod: metadata.lockupPeriod || 0,
        riskRating: metadata.riskRating || "medium",
        documents: metadata.documents || [],
        createdAt: pool.createdAt.toISOString(),
        updatedAt: pool.updatedAt.toISOString(),
        transactionCount: pool._count.investments,
      },
      yieldHistory: pool.yieldHistory.map((y) => ({
        yieldAmount: y.yieldAmount.toString(),
        cumulativeYield: y.cumulativeYield.toString(),
        recordedAt: y.recordedAt,
      })),
      userInvestment,
    });
  } catch (error: any) {
    console.error("Get pool error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch pool details",
    });
  }
});

// ==================== Protected Endpoints ====================

/**
 * POST /api/pools/:id/invest
 * Initiate an investment in a pool
 * REQUIRES: Passkey signature to authorize the transaction
 */
router.post(
  "/:id/invest",
  requireAuth,
  investmentLimiter,
  async (req: Request, res: Response) => {
    try {
      const { amount, webauthnResponse, challengeId } = investSchema.parse(req.body);
      const amountBigInt = BigInt(amount);

      // Get pool
      const pool = await prisma.assetPool.findUnique({
        where: { id: req.params.id },
      });

      if (!pool) {
        res.status(404).json({
          success: false,
          error: "Pool not found",
          code: "POOL_NOT_FOUND",
        });
        return;
      }

      if (pool.status !== PoolStatus.ACTIVE) {
        res.status(400).json({
          success: false,
          error: "Pool is not accepting investments",
          code: "POOL_INACTIVE",
        });
        return;
      }

      // Validate investment amount
      if (amountBigInt < pool.minInvestment) {
        res.status(400).json({
          success: false,
          error: `Minimum investment is ${pool.minInvestment.toString()}`,
          code: "BELOW_MINIMUM",
        });
        return;
      }

      if (amountBigInt > pool.maxInvestment) {
        res.status(400).json({
          success: false,
          error: `Maximum investment is ${pool.maxInvestment.toString()}`,
          code: "ABOVE_MAXIMUM",
        });
        return;
      }

      // ============== PASSKEY VERIFICATION ==============
      // Require passkey signature for investment transactions
      // This ensures biometric authorization for financial operations

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

        // Return challenge for the user to sign
        // The frontend should request a new challenge, sign it with passkey, and resubmit
        const { options, challengeId } = await webAuthnService.generateAuthenticationOptions(user.email);

        // Store the challenge ID in a way the frontend can retrieve it
        // We'll include it in the response and frontend will send it back with the signed response
        res.status(401).json({
          success: false,
          error: "Passkey verification required",
          code: "PASSKEY_REQUIRED",
          challenge: {
            id: challengeId, // Frontend needs this to send back with verification
            challenge: options.challenge,
            rpId: options.rpId,
            timeout: options.timeout,
            userVerification: "required",
            allowCredentials: options.allowCredentials || [],
          },
          message: "Please sign this transaction with your passkey to authorize the investment.",
        });
        return;
      }

      // Verify the passkey signature
      // webauthnResponse and challengeId should both be provided
      if (!challengeId) {
        res.status(400).json({
          success: false,
          error: "Challenge ID required for verification",
          code: "CHALLENGE_ID_REQUIRED",
        });
        return;
      }

      try {
        // Convert frontend WebAuthnResponse to AuthenticationResponseJSON format
        const authResponse = {
          id: webauthnResponse.id,
          rawId: webauthnResponse.rawId,
          response: {
            authenticatorData: webauthnResponse.response.authenticatorData,
            clientDataJSON: webauthnResponse.response.clientDataJSON,
            signature: webauthnResponse.response.signature,
            userHandle: undefined, // Optional field
          },
          type: webauthnResponse.type as "public-key",
          clientExtensionResults: webauthnResponse.clientExtensionResults || {},
          authenticatorAttachment: webauthnResponse.authenticatorAttachment as "platform" | "cross-platform" | undefined,
        };

        // verifyAuthentication returns AuthenticationResult on success, throws on failure
        const authResult = await webAuthnService.verifyAuthentication(challengeId, authResponse);

        // If we get here, verification succeeded
        console.log(`[Investment] Passkey verified for user ${req.user!.userId} (auth user: ${authResult.user.id})`);
      } catch (verifyError: any) {
        console.error("[Investment] Passkey verification error:", verifyError.message);
        res.status(401).json({
          success: false,
          error: "Passkey verification failed",
          code: "PASSKEY_ERROR",
          details: verifyError.message,
        });
        return;
      }

      // ============== INVESTMENT PROCESSING ==============

      // Get user with wallet address for on-chain transaction
      const investorUser = await prisma.user.findUnique({
        where: { id: req.user!.userId },
        select: { walletAddress: true },
      });

      // Calculate shares (simplified: 1:1 ratio, real implementation would use pool's share price)
      const shares = amountBigInt;

      // Capture current NAV for tracking gains
      const currentNavPerShare = pool.navPerShare ?? BigInt(100000000);

      // Create investment as PENDING - only confirm after on-chain success
      const investment = await prisma.investment.create({
        data: {
          userId: req.user!.userId,
          poolId: pool.id,
          type: "INVEST",
          amount: amountBigInt,
          shares,
          status: "PENDING", // Start as PENDING, confirm after on-chain tx
          sharePriceAtPurchase: currentNavPerShare,
        },
      });

      // ============== ON-CHAIN TRANSACTION ==============
      let txHash: string | null = null;
      let onChainStatus: "submitted" | "skipped" | "failed" = "skipped";
      let finalStatus: "CONFIRMED" | "PENDING" | "FAILED" = "PENDING";

      if (relayerService?.hasRwaPool() && investorUser?.walletAddress) {
        try {
          // Check relayer has sufficient balance
          if (await relayerService.hasSufficientBalance(0.01)) {
            console.log(`[Investment] Submitting on-chain: pool=${pool.chainPoolId}, amount=${amount}`);

            const txResult = await relayerService.submitInvestment(
              pool.chainPoolId,
              investorUser.walletAddress,
              amountBigInt
            );

            if (txResult.status === "success" && txResult.txHash) {
              txHash = txResult.txHash;
              onChainStatus = "submitted";
              finalStatus = "CONFIRMED";

              // Update investment to CONFIRMED with txHash
              await prisma.investment.update({
                where: { id: investment.id },
                data: {
                  txHash: txResult.txHash,
                  status: "CONFIRMED",
                },
              });

              // Update pool stats only after on-chain confirmation
              await prisma.assetPool.update({
                where: { id: pool.id },
                data: {
                  totalDeposited: { increment: amountBigInt },
                  investorCount: { increment: 1 },
                },
              });

              console.log(`[Investment] On-chain success: txHash=${txResult.txHash}`);
            } else {
              onChainStatus = "failed";
              finalStatus = "FAILED";

              // Mark investment as failed
              await prisma.investment.update({
                where: { id: investment.id },
                data: { status: "FAILED" },
              });

              console.error(`[Investment] On-chain failed: status=${txResult.status}`);
            }
          } else {
            console.warn("[Investment] Relayer balance low - keeping as PENDING");
          }
        } catch (onChainError: any) {
          onChainStatus = "failed";
          finalStatus = "FAILED";

          // Mark investment as failed
          await prisma.investment.update({
            where: { id: investment.id },
            data: { status: "FAILED" },
          });

          console.error("[Investment] On-chain error:", onChainError.message);
        }
      } else if (!investorUser?.walletAddress) {
        console.log("[Investment] No wallet address - keeping as PENDING");
      }

      // Log the action
      await prisma.auditLog.create({
        data: {
          action: finalStatus === "CONFIRMED" ? "INVESTMENT_CONFIRMED" : finalStatus === "FAILED" ? "INVESTMENT_FAILED" : "INVESTMENT_PENDING",
          userId: req.user!.userId,
          resourceType: "Investment",
          resourceId: investment.id,
          status: finalStatus === "CONFIRMED" ? "SUCCESS" : finalStatus === "FAILED" ? "FAILURE" : "PENDING",
          metadata: {
            poolId: pool.id,
            amount: amount,
            passkeyVerified: true,
            onChainStatus,
            txHash,
            finalStatus,
          },
        },
      });

      res.json({
        success: true,
        investment: {
          id: investment.id,
          poolId: pool.id,
          amount: investment.amount.toString(),
          shares: investment.shares.toString(),
          status: finalStatus, // Use computed final status
          createdAt: investment.createdAt,
          txHash,
        },
        onChain: {
          status: onChainStatus,
          txHash,
          explorer: txHash ? `https://testnet.snowtrace.io/tx/${txHash}` : null,
        },
        message:
          finalStatus === "CONFIRMED"
            ? "Investment confirmed on-chain. Transaction submitted to Avalanche."
            : finalStatus === "FAILED"
              ? "Investment failed. On-chain transaction was not successful."
              : "Investment recorded. Awaiting on-chain confirmation.",
      });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          error: "Invalid investment request",
          details: error.errors,
        });
        return;
      }

      console.error("Investment error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to process investment",
      });
    }
  }
);

/**
 * POST /api/pools/:id/redeem
 * Initiate a redemption from a pool
 */
router.post(
  "/:id/redeem",
  requireAuth,
  investmentLimiter,
  async (req: Request, res: Response) => {
    try {
      const { shares } = redeemSchema.parse(req.body);
      const sharesBigInt = BigInt(shares);

      // Get pool
      const pool = await prisma.assetPool.findUnique({
        where: { id: req.params.id },
      });

      if (!pool) {
        res.status(404).json({
          success: false,
          error: "Pool not found",
          code: "POOL_NOT_FOUND",
        });
        return;
      }

      // Get user's current holdings
      const userInvestments = await prisma.investment.aggregate({
        where: {
          poolId: pool.id,
          userId: req.user!.userId,
          status: "CONFIRMED",
        },
        _sum: {
          shares: true,
        },
      });

      const totalShares = userInvestments._sum.shares || 0n;

      if (sharesBigInt > totalShares) {
        res.status(400).json({
          success: false,
          error: "Insufficient shares",
          code: "INSUFFICIENT_SHARES",
          available: totalShares.toString(),
        });
        return;
      }

      // Calculate amount (simplified: 1:1 ratio)
      const amount = sharesBigInt;

      // Get user with wallet address for on-chain transaction
      const redeemUser = await prisma.user.findUnique({
        where: { id: req.user!.userId },
        select: { walletAddress: true },
      });

      // Create redemption record
      const redemption = await prisma.investment.create({
        data: {
          userId: req.user!.userId,
          poolId: pool.id,
          type: "REDEEM",
          amount,
          shares: sharesBigInt,
          status: "PENDING",
        },
      });

      // ============== ON-CHAIN TRANSACTION ==============
      let txHash: string | null = null;
      let onChainStatus: "submitted" | "skipped" | "failed" = "skipped";

      if (relayerService?.hasRwaPool() && redeemUser?.walletAddress) {
        try {
          if (await relayerService.hasSufficientBalance(0.01)) {
            console.log(`[Redemption] Submitting on-chain: pool=${pool.chainPoolId}, shares=${shares}`);

            const txResult = await relayerService.submitRedemption(
              pool.chainPoolId,
              redeemUser.walletAddress,
              sharesBigInt
            );

            if (txResult.status === "success" && txResult.txHash) {
              txHash = txResult.txHash;
              onChainStatus = "submitted";

              // Update redemption record
              await prisma.investment.update({
                where: { id: redemption.id },
                data: {
                  txHash: txResult.txHash,
                  status: "CONFIRMED",
                },
              });

              // Update pool stats
              await prisma.assetPool.update({
                where: { id: pool.id },
                data: {
                  totalDeposited: { decrement: amount },
                },
              });

              console.log(`[Redemption] On-chain success: txHash=${txResult.txHash}`);
            } else {
              onChainStatus = "failed";
              console.error(`[Redemption] On-chain failed: status=${txResult.status}`);
            }
          } else {
            console.warn("[Redemption] Relayer balance low - skipping on-chain");
          }
        } catch (onChainError: any) {
          onChainStatus = "failed";
          console.error("[Redemption] On-chain error:", onChainError.message);
        }
      }

      // Log the action
      await prisma.auditLog.create({
        data: {
          action: "REDEMPTION_INITIATED",
          userId: req.user!.userId,
          resourceType: "Investment",
          resourceId: redemption.id,
          status: "SUCCESS",
          metadata: {
            poolId: pool.id,
            shares: shares,
            onChainStatus,
            txHash,
          },
        },
      });

      res.json({
        success: true,
        redemption: {
          id: redemption.id,
          poolId: pool.id,
          shares: redemption.shares.toString(),
          amount: redemption.amount.toString(),
          status: txHash ? "CONFIRMED" : redemption.status,
          createdAt: redemption.createdAt,
          txHash,
        },
        onChain: {
          status: onChainStatus,
          txHash,
          explorer: txHash ? `https://testnet.snowtrace.io/tx/${txHash}` : null,
        },
        message: txHash
          ? "Redemption confirmed on-chain. Funds returned to your wallet."
          : "Redemption initiated. Awaiting confirmation.",
      });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          error: "Invalid redemption request",
          details: error.errors,
        });
        return;
      }

      console.error("Redemption error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to process redemption",
      });
    }
  }
);

// ==================== EIP-2612 Permit Endpoints ====================

/**
 * POST /api/pools/:id/permit-data
 * Get the EIP-712 typed data for permit signing
 * Wallet users call this to get data to sign with their wallet
 */
router.post(
  "/:id/permit-data",
  requireAuth,
  standardApiLimiter,
  async (req: Request, res: Response) => {
    try {
      const { amount, deadline } = permitDataSchema.parse(req.body);
      const amountBigInt = BigInt(amount);

      // Get pool
      const pool = await prisma.assetPool.findUnique({
        where: { id: req.params.id },
      });

      if (!pool) {
        res.status(404).json({
          success: false,
          error: "Pool not found",
          code: "POOL_NOT_FOUND",
        });
        return;
      }

      if (pool.status !== PoolStatus.ACTIVE) {
        res.status(400).json({
          success: false,
          error: "Pool is not accepting investments",
          code: "POOL_INACTIVE",
        });
        return;
      }

      // Validate investment amount
      if (amountBigInt < pool.minInvestment) {
        res.status(400).json({
          success: false,
          error: `Minimum investment is ${pool.minInvestment.toString()}`,
          code: "BELOW_MINIMUM",
        });
        return;
      }

      if (amountBigInt > pool.maxInvestment) {
        res.status(400).json({
          success: false,
          error: `Maximum investment is ${pool.maxInvestment.toString()}`,
          code: "ABOVE_MAXIMUM",
        });
        return;
      }

      // Get user's wallet address
      const user = await prisma.user.findUnique({
        where: { id: req.user!.userId },
        select: { walletAddress: true },
      });

      if (!user?.walletAddress) {
        res.status(400).json({
          success: false,
          error: "Wallet address required for permit signing",
          code: "WALLET_REQUIRED",
        });
        return;
      }

      // Get permit service and generate typed data
      let permitService: PermitService;
      try {
        permitService = getPermitService();
      } catch (error: any) {
        res.status(500).json({
          success: false,
          error: "Permit service not configured",
          code: "PERMIT_NOT_CONFIGURED",
        });
        return;
      }

      const rwaPoolAddress = process.env.RWA_POOL_ADDRESS;
      if (!rwaPoolAddress) {
        res.status(500).json({
          success: false,
          error: "RWA Pool address not configured",
          code: "POOL_NOT_CONFIGURED",
        });
        return;
      }

      // Generate permit typed data for signing
      const { data, typedData } = await permitService.generatePermitData(
        user.walletAddress,
        rwaPoolAddress,
        amountBigInt,
        deadline
      );

      // Debug logging for permit-data
      console.log("[Permit Debug] Generated permit data for signing:", {
        owner: user.walletAddress,
        spender: rwaPoolAddress,
        amount: amountBigInt.toString(),
        deadline: data.deadline,
        nonce: data.nonce.toString(),
        domain: typedData.domain,
      });

      res.json({
        success: true,
        permit: {
          owner: data.owner,
          spender: data.spender,
          value: data.value.toString(),
          nonce: data.nonce.toString(),
          deadline: data.deadline,
        },
        typedData,
        poolId: pool.id,
        chainPoolId: pool.chainPoolId,
        message: "Sign this typed data with your wallet to authorize the investment",
      });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          error: "Invalid request",
          details: error.errors,
        });
        return;
      }

      console.error("Get permit data error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to generate permit data",
      });
    }
  }
);

/**
 * POST /api/pools/:id/invest-permit
 * Invest using EIP-2612 permit signature (gasless for wallet users)
 * User signs permit off-chain, we submit permit + invest in one transaction
 */
router.post(
  "/:id/invest-permit",
  requireAuth,
  investmentLimiter,
  async (req: Request, res: Response) => {
    try {
      const { amount, deadline, signature } = permitInvestSchema.parse(req.body);
      const amountBigInt = BigInt(amount);

      // Get pool
      const pool = await prisma.assetPool.findUnique({
        where: { id: req.params.id },
      });

      if (!pool) {
        res.status(404).json({
          success: false,
          error: "Pool not found",
          code: "POOL_NOT_FOUND",
        });
        return;
      }

      if (pool.status !== PoolStatus.ACTIVE) {
        res.status(400).json({
          success: false,
          error: "Pool is not accepting investments",
          code: "POOL_INACTIVE",
        });
        return;
      }

      // Validate investment amount
      if (amountBigInt < pool.minInvestment) {
        res.status(400).json({
          success: false,
          error: `Minimum investment is ${pool.minInvestment.toString()}`,
          code: "BELOW_MINIMUM",
        });
        return;
      }

      if (amountBigInt > pool.maxInvestment) {
        res.status(400).json({
          success: false,
          error: `Maximum investment is ${pool.maxInvestment.toString()}`,
          code: "ABOVE_MAXIMUM",
        });
        return;
      }

      // Check deadline hasn't expired
      if (deadline < Math.floor(Date.now() / 1000)) {
        res.status(400).json({
          success: false,
          error: "Permit deadline has expired",
          code: "DEADLINE_EXPIRED",
        });
        return;
      }

      // Get user's wallet address
      const user = await prisma.user.findUnique({
        where: { id: req.user!.userId },
        select: { walletAddress: true },
      });

      if (!user?.walletAddress) {
        res.status(400).json({
          success: false,
          error: "Wallet address required for permit investment",
          code: "WALLET_REQUIRED",
        });
        return;
      }

      // Parse and verify the signature
      let permitService: PermitService;
      try {
        permitService = getPermitService();
      } catch (error: any) {
        res.status(500).json({
          success: false,
          error: "Permit service not configured",
          code: "PERMIT_NOT_CONFIGURED",
        });
        return;
      }

      const rwaPoolAddress = process.env.RWA_POOL_ADDRESS;
      if (!rwaPoolAddress) {
        res.status(500).json({
          success: false,
          error: "RWA Pool address not configured",
          code: "POOL_NOT_CONFIGURED",
        });
        return;
      }

      // Verify signature is valid
      const { typedData } = await permitService.generatePermitData(
        user.walletAddress,
        rwaPoolAddress,
        amountBigInt,
        deadline
      );

      // Debug logging
      console.log("[Permit Debug] Verification data:", {
        owner: user.walletAddress,
        spender: rwaPoolAddress,
        amount: amountBigInt.toString(),
        deadline,
        domain: typedData.domain,
        message: typedData.message,
        signatureLength: signature?.length,
      });

      const isValid = permitService.verifySignature(typedData, signature, user.walletAddress);
      if (!isValid) {
        console.log("[Permit Debug] Signature verification FAILED");
        res.status(401).json({
          success: false,
          error: "Invalid permit signature",
          code: "INVALID_SIGNATURE",
        });
        return;
      }

      // Parse signature into v, r, s components
      const sig = permitService.parseSignature(signature);

      // Check relayer is configured
      if (!relayerService?.hasRwaPool()) {
        res.status(500).json({
          success: false,
          error: "Relayer not configured for on-chain transactions",
          code: "RELAYER_NOT_CONFIGURED",
        });
        return;
      }

      // Check relayer has sufficient balance
      if (!(await relayerService.hasSufficientBalance(0.01))) {
        res.status(503).json({
          success: false,
          error: "Relayer balance insufficient",
          code: "RELAYER_LOW_BALANCE",
        });
        return;
      }

      // Calculate shares (1:1 for simplicity)
      const shares = amountBigInt;

      // Capture current NAV for tracking gains
      const currentNavPerShare = pool.navPerShare ?? BigInt(100000000);

      // Submit on-chain transaction with permit
      console.log(`[Permit Investment] Submitting: pool=${pool.chainPoolId}, investor=${user.walletAddress}, amount=${amount}`);

      const txResult = await relayerService.submitInvestmentWithPermit(
        pool.chainPoolId,
        user.walletAddress,
        amountBigInt,
        deadline,
        sig.v,
        sig.r,
        sig.s
      );

      if (txResult.status !== "success") {
        res.status(500).json({
          success: false,
          error: "On-chain transaction failed",
          code: "TX_FAILED",
        });
        return;
      }

      // Create investment record
      const investment = await prisma.investment.create({
        data: {
          userId: req.user!.userId,
          poolId: pool.id,
          type: "INVEST",
          amount: amountBigInt,
          shares,
          status: "CONFIRMED",
          txHash: txResult.txHash,
          sharePriceAtPurchase: currentNavPerShare,
        },
      });

      // Update pool stats
      await prisma.assetPool.update({
        where: { id: pool.id },
        data: {
          totalDeposited: { increment: amountBigInt },
          investorCount: { increment: 1 },
        },
      });

      // Log the action
      await prisma.auditLog.create({
        data: {
          action: "INVESTMENT_PERMIT",
          userId: req.user!.userId,
          resourceType: "Investment",
          resourceId: investment.id,
          status: "SUCCESS",
          metadata: {
            poolId: pool.id,
            amount: amount,
            txHash: txResult.txHash,
            gasUsed: txResult.gasUsed,
            permitDeadline: deadline,
          },
        },
      });

      console.log(`[Permit Investment] Success: txHash=${txResult.txHash}`);

      res.json({
        success: true,
        investment: {
          id: investment.id,
          poolId: pool.id,
          amount: investment.amount.toString(),
          shares: investment.shares.toString(),
          status: investment.status,
          createdAt: investment.createdAt,
          txHash: txResult.txHash,
        },
        transaction: {
          txHash: txResult.txHash,
          blockNumber: txResult.blockNumber,
          gasUsed: txResult.gasUsed,
          explorer: `https://testnet.snowtrace.io/tx/${txResult.txHash}`,
        },
        message: "Investment confirmed on-chain via permit. No gas was required from your wallet.",
      });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          error: "Invalid permit investment request",
          details: error.errors,
        });
        return;
      }

      console.error("Permit investment error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to process permit investment",
        details: error.message,
      });
    }
  }
);

export default router;
