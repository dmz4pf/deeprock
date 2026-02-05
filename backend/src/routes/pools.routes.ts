import { Router, Request, Response } from "express";
import { z } from "zod";
import { PrismaClient, AssetClass, PoolStatus } from "@prisma/client";
import { requireAuth, optionalAuth } from "../middleware/auth.middleware.js";
import { standardApiLimiter, investmentLimiter } from "../middleware/rateLimit.middleware.js";

const router = Router();
const prisma = new PrismaClient();

// ==================== Validation Schemas ====================

const listPoolsQuerySchema = z.object({
  assetClass: z.nativeEnum(AssetClass).optional(),
  status: z.nativeEnum(PoolStatus).optional(),
  minYield: z.coerce.number().min(0).max(10000).optional(),
  maxYield: z.coerce.number().min(0).max(10000).optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z.enum(["yieldRateBps", "totalDeposited", "createdAt"]).default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

const investSchema = z.object({
  amount: z.string().regex(/^\d+$/, "Amount must be a positive integer string"),
});

const redeemSchema = z.object({
  shares: z.string().regex(/^\d+$/, "Shares must be a positive integer string"),
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

    if (assetClass) {
      where.assetClass = assetClass;
    }

    if (status) {
      where.status = status;
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
      },
    });

    // Format response
    const formattedPools = pools.map((pool) => ({
      ...pool,
      totalDeposited: pool.totalDeposited.toString(),
      minInvestment: pool.minInvestment.toString(),
      maxInvestment: pool.maxInvestment.toString(),
      yieldRatePercent: (pool.yieldRateBps / 100).toFixed(2),
    }));

    res.json({
      success: true,
      data: formattedPools,
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

    res.json({
      success: true,
      pool: {
        id: pool.id,
        chainPoolId: pool.chainPoolId,
        name: pool.name,
        assetClass: pool.assetClass,
        rwaTokenAddress: pool.rwaTokenAddress,
        yieldRateBps: pool.yieldRateBps,
        yieldRatePercent: (pool.yieldRateBps / 100).toFixed(2),
        totalDeposited: pool.totalDeposited.toString(),
        investorCount: pool.investorCount,
        minInvestment: pool.minInvestment.toString(),
        maxInvestment: pool.maxInvestment.toString(),
        status: pool.status,
        metadata: pool.metadata,
        createdAt: pool.createdAt,
        updatedAt: pool.updatedAt,
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
 */
router.post(
  "/:id/invest",
  requireAuth,
  investmentLimiter,
  async (req: Request, res: Response) => {
    try {
      const { amount } = investSchema.parse(req.body);
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

      // Calculate shares (simplified: 1:1 ratio, real implementation would use pool's share price)
      const shares = amountBigInt;

      // Create pending investment record
      const investment = await prisma.investment.create({
        data: {
          userId: req.user!.userId,
          poolId: pool.id,
          type: "INVEST",
          amount: amountBigInt,
          shares,
          status: "PENDING",
        },
      });

      // Log the action
      await prisma.auditLog.create({
        data: {
          action: "INVESTMENT_INITIATED",
          userId: req.user!.userId,
          resourceType: "Investment",
          resourceId: investment.id,
          status: "SUCCESS",
          metadata: {
            poolId: pool.id,
            amount: amount,
          },
        },
      });

      // TODO: In a real implementation, this would:
      // 1. Create a signature request for the user
      // 2. Submit via relayer after user signs
      // 3. Update investment status on confirmation

      res.json({
        success: true,
        investment: {
          id: investment.id,
          poolId: pool.id,
          amount: investment.amount.toString(),
          shares: investment.shares.toString(),
          status: investment.status,
          createdAt: investment.createdAt,
        },
        message: "Investment initiated. Awaiting confirmation.",
      });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          error: "Invalid investment amount",
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

      // Create pending redemption record
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
          status: redemption.status,
          createdAt: redemption.createdAt,
        },
        message: "Redemption initiated. Awaiting confirmation.",
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

export default router;
