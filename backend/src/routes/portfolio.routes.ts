import { Router, Request, Response } from "express";
import { z } from "zod";
import { PrismaClient, InvestmentType, InvestmentStatus } from "@prisma/client";
import { requireAuth } from "../middleware/auth.middleware.js";
import { standardApiLimiter } from "../middleware/rateLimit.middleware.js";
import { getNavService, NAV_BASE } from "../services/nav.service.js";

const router = Router();
const prisma = new PrismaClient();
const navService = getNavService(prisma);

// ==================== Validation Schemas ====================

const transactionsQuerySchema = z.object({
  type: z.nativeEnum(InvestmentType).optional(),
  status: z.nativeEnum(InvestmentStatus).optional(),
  poolId: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

// ==================== Protected Endpoints ====================

// All portfolio endpoints require authentication
router.use(requireAuth);

/**
 * GET /api/portfolio
 * Get user's complete portfolio overview
 */
router.get("/", standardApiLimiter, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;

    // Get all confirmed investments grouped by pool
    const investments = await prisma.investment.findMany({
      where: {
        userId,
        status: InvestmentStatus.CONFIRMED,
      },
      include: {
        pool: {
          select: {
            id: true,
            name: true,
            assetClass: true,
            yieldRateBps: true,
            status: true,
            navPerShare: true,
            metadata: true, // Include metadata for lockup period
          },
        },
      },
      orderBy: { createdAt: "asc" }, // Order by date to track earliest investment
    });

    // Aggregate by pool with NAV tracking and lockup data
    const holdingsMap = new Map<
      string,
      {
        poolId: string;
        poolName: string;
        assetClass: string;
        yieldRateBps: number;
        totalInvested: bigint;
        totalRedeemed: bigint;
        totalShares: bigint;
        status: string;
        currentNavPerShare: bigint;
        weightedPurchaseNav: bigint;
        weightedNavDivisor: bigint;
        // Lockup tracking
        lockupPeriod: number;
        earliestInvestmentDate: Date | null;
      }
    >();

    for (const inv of investments) {
      const poolMetadata = (inv.pool.metadata as any) || {};
      const lockupDays = poolMetadata.lockupPeriod || 0;

      const existing = holdingsMap.get(inv.poolId) || {
        poolId: inv.poolId,
        poolName: inv.pool.name,
        assetClass: inv.pool.assetClass,
        yieldRateBps: inv.pool.yieldRateBps,
        totalInvested: 0n,
        totalRedeemed: 0n,
        totalShares: 0n,
        status: inv.pool.status,
        currentNavPerShare: inv.pool.navPerShare ?? NAV_BASE,
        weightedPurchaseNav: 0n,
        weightedNavDivisor: 0n,
        lockupPeriod: lockupDays,
        earliestInvestmentDate: null,
      };

      if (inv.type === InvestmentType.INVEST) {
        existing.totalInvested += inv.amount;
        existing.totalShares += inv.shares;
        // Track weighted average purchase NAV
        const purchaseNav = inv.sharePriceAtPurchase ?? NAV_BASE;
        existing.weightedPurchaseNav += inv.shares * purchaseNav;
        existing.weightedNavDivisor += inv.shares;
        // Track earliest investment date (for lockup calculation)
        if (!existing.earliestInvestmentDate || inv.createdAt < existing.earliestInvestmentDate) {
          existing.earliestInvestmentDate = inv.createdAt;
        }
      } else {
        existing.totalRedeemed += inv.amount;
        existing.totalShares -= inv.shares;
        // Adjust weighted averages on redemption (FIFO-like reduction)
        const purchaseNav = inv.sharePriceAtPurchase ?? NAV_BASE;
        existing.weightedPurchaseNav -= inv.shares * purchaseNav;
        existing.weightedNavDivisor -= inv.shares;
      }

      holdingsMap.set(inv.poolId, existing);
    }

    // Convert to array and filter out fully redeemed positions
    const holdings = Array.from(holdingsMap.values())
      .filter((h) => h.totalShares > 0n)
      .map((h) => {
        // Calculate weighted average purchase NAV
        const avgPurchaseNav = h.weightedNavDivisor > 0n
          ? h.weightedPurchaseNav / h.weightedNavDivisor
          : NAV_BASE;

        // Calculate current value and gains
        const { currentValue, costBasis, unrealizedGain, gainPercent } =
          navService.calculateCurrentValue(h.totalShares, h.currentNavPerShare, avgPurchaseNav);

        // Calculate lockup status
        let unlockDate: string | null = null;
        let daysRemaining = 0;
        let isLocked = false;

        if (h.lockupPeriod > 0 && h.earliestInvestmentDate) {
          const unlock = new Date(h.earliestInvestmentDate);
          unlock.setDate(unlock.getDate() + h.lockupPeriod);
          unlockDate = unlock.toISOString();

          const now = new Date();
          if (now < unlock) {
            isLocked = true;
            daysRemaining = Math.ceil(
              (unlock.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
            );
          }
        }

        return {
          poolId: h.poolId,
          poolName: h.poolName,
          assetClass: h.assetClass,
          yieldRatePercent: (h.yieldRateBps / 100).toFixed(2),
          totalInvested: h.totalInvested.toString(),
          totalRedeemed: h.totalRedeemed.toString(),
          netInvested: (h.totalInvested - h.totalRedeemed).toString(),
          totalShares: h.totalShares.toString(),
          status: h.status,
          // NAV-based value tracking
          currentValue: currentValue.toString(),
          costBasis: costBasis.toString(),
          unrealizedGain: unrealizedGain.toString(),
          gainPercent,
          navPerShare: navService.formatNav(h.currentNavPerShare),
          // Lockup status
          lockupPeriod: h.lockupPeriod,
          unlockDate,
          daysRemaining,
          isLocked,
        };
      });

    // Calculate totals
    const totalCostBasis = holdings.reduce(
      (sum, h) => sum + BigInt(h.costBasis),
      0n
    );
    const totalCurrentValue = holdings.reduce(
      (sum, h) => sum + BigInt(h.currentValue),
      0n
    );
    const totalUnrealizedGain = totalCurrentValue - totalCostBasis;
    const totalGainPercent = totalCostBasis > 0n
      ? ((Number(totalUnrealizedGain) / Number(totalCostBasis)) * 100).toFixed(2)
      : "0.00";

    // Get credentials
    const credentials = await prisma.credential.findMany({
      where: { userId },
      select: {
        id: true,
        credentialType: true,
        jurisdiction: true,
        tier: true,
        status: true,
        issuedAt: true,
        expiresAt: true,
      },
    });

    // Get user info
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        walletAddress: true,
        email: true,
        displayName: true,
        createdAt: true,
      },
    });

    res.json({
      success: true,
      portfolio: {
        user: {
          walletAddress: user?.walletAddress,
          email: user?.email,
          displayName: user?.displayName,
          memberSince: user?.createdAt,
        },
        summary: {
          totalCurrentValue: totalCurrentValue.toString(),
          totalCostBasis: totalCostBasis.toString(),
          totalUnrealizedGain: totalUnrealizedGain.toString(),
          totalGainPercent,
          holdingsCount: holdings.length,
          credentialsCount: credentials.length,
        },
        holdings,
        credentials,
      },
    });
  } catch (error: any) {
    console.error("Portfolio error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch portfolio",
    });
  }
});

/**
 * GET /api/portfolio/yield
 * Get yield breakdown by pool
 */
router.get("/yield", standardApiLimiter, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;

    // Get user's pools with investments
    const userPools = await prisma.investment.findMany({
      where: {
        userId,
        status: InvestmentStatus.CONFIRMED,
      },
      distinct: ["poolId"],
      select: {
        poolId: true,
      },
    });

    const poolIds = userPools.map((p) => p.poolId);

    // Get yield history for user's pools
    const yieldData = await prisma.assetPool.findMany({
      where: {
        id: { in: poolIds },
      },
      select: {
        id: true,
        name: true,
        yieldRateBps: true,
        yieldHistory: {
          orderBy: { recordedAt: "desc" },
          take: 12, // Last 12 records
        },
      },
    });

    // Get user's shares per pool
    const sharesPerPool = new Map<string, bigint>();

    const allInvestments = await prisma.investment.findMany({
      where: {
        userId,
        poolId: { in: poolIds },
        status: InvestmentStatus.CONFIRMED,
      },
    });

    for (const inv of allInvestments) {
      const current = sharesPerPool.get(inv.poolId) || 0n;
      if (inv.type === InvestmentType.INVEST) {
        sharesPerPool.set(inv.poolId, current + inv.shares);
      } else {
        sharesPerPool.set(inv.poolId, current - inv.shares);
      }
    }

    // Calculate estimated yield
    const yieldBreakdown = yieldData.map((pool) => {
      const userShares = sharesPerPool.get(pool.id) || 0n;
      // Simplified yield calculation: shares * yieldRate / 10000 / 365 * 30 (monthly estimate)
      const estimatedMonthlyYield =
        userShares > 0n
          ? (userShares * BigInt(pool.yieldRateBps) * 30n) / 10000n / 365n
          : 0n;

      return {
        poolId: pool.id,
        poolName: pool.name,
        yieldRateBps: pool.yieldRateBps,
        yieldRatePercent: (pool.yieldRateBps / 100).toFixed(2),
        userShares: userShares.toString(),
        estimatedMonthlyYield: estimatedMonthlyYield.toString(),
        history: pool.yieldHistory.map((y) => ({
          amount: y.yieldAmount.toString(),
          cumulative: y.cumulativeYield.toString(),
          date: y.recordedAt,
        })),
      };
    });

    // Calculate total estimated yield
    const totalEstimatedMonthlyYield = yieldBreakdown.reduce(
      (sum, y) => sum + BigInt(y.estimatedMonthlyYield),
      0n
    );

    res.json({
      success: true,
      yield: {
        totalEstimatedMonthlyYield: totalEstimatedMonthlyYield.toString(),
        breakdown: yieldBreakdown,
      },
    });
  } catch (error: any) {
    console.error("Yield breakdown error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch yield breakdown",
    });
  }
});

/**
 * GET /api/portfolio/transactions
 * Get transaction history
 */
router.get("/transactions", standardApiLimiter, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const query = transactionsQuerySchema.parse(req.query);
    const { type, status, poolId, page, limit } = query;

    // Build where clause
    const where: any = { userId };

    if (type) where.type = type;
    if (status) where.status = status;
    if (poolId) where.poolId = poolId;

    // Get total count
    const total = await prisma.investment.count({ where });

    // Get transactions with pagination
    const transactions = await prisma.investment.findMany({
      where,
      include: {
        pool: {
          select: {
            name: true,
            assetClass: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    });

    const formattedTransactions = transactions.map((tx) => ({
      id: tx.id,
      type: tx.type.toLowerCase(), // Convert INVEST/REDEEM to invest/redeem for frontend
      status: tx.status.toLowerCase(), // Convert CONFIRMED/PENDING to confirmed/pending
      poolId: tx.poolId,
      poolName: tx.pool.name,
      assetClass: tx.pool.assetClass,
      amount: tx.amount.toString(),
      shares: tx.shares.toString(),
      txHash: tx.txHash,
      blockNumber: tx.blockNumber,
      createdAt: tx.createdAt,
      updatedAt: tx.updatedAt,
    }));

    res.json({
      success: true,
      transactions: formattedTransactions,
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

    console.error("Transactions error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch transactions",
    });
  }
});

/**
 * GET /api/portfolio/credentials
 * Get user's credentials
 */
router.get("/credentials", standardApiLimiter, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;

    const credentials = await prisma.credential.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });

    const formattedCredentials = credentials.map((cred) => ({
      id: cred.id,
      type: cred.credentialType,
      jurisdiction: cred.jurisdiction,
      tier: cred.tier,
      status: cred.status,
      issuerAddress: cred.issuerAddress,
      onChainTxHash: cred.onChainTxHash,
      issuedAt: cred.issuedAt,
      expiresAt: cred.expiresAt,
      isExpired: cred.expiresAt ? cred.expiresAt < new Date() : false,
      metadata: cred.metadata,
    }));

    res.json({
      success: true,
      credentials: formattedCredentials,
    });
  } catch (error: any) {
    console.error("Credentials error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch credentials",
    });
  }
});

/**
 * GET /api/portfolio/documents
 * Get user's sealed documents
 */
router.get("/documents", standardApiLimiter, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;

    const documents = await prisma.document.findMany({
      where: { signerId: userId },
      orderBy: { sealedAt: "desc" },
    });

    const formattedDocuments = documents.map((doc) => ({
      id: doc.id,
      title: doc.title,
      documentHash: doc.documentHash,
      txHash: doc.txHash,
      sealedAt: doc.sealedAt,
      metadata: doc.metadata,
    }));

    res.json({
      success: true,
      documents: formattedDocuments,
    });
  } catch (error: any) {
    console.error("Documents error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch documents",
    });
  }
});

/**
 * GET /api/portfolio/history
 * Get portfolio value history for chart (calculated from investments + APY)
 */
router.get("/history", standardApiLimiter, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;

    // Get all confirmed investments with their pools
    const investments = await prisma.investment.findMany({
      where: {
        userId,
        status: InvestmentStatus.CONFIRMED,
      },
      include: {
        pool: {
          select: {
            yieldRateBps: true,
          },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    if (investments.length === 0) {
      res.json({
        success: true,
        history: [],
      });
      return;
    }

    // Find the earliest investment date
    const firstInvestment = investments[0];
    const startDate = new Date(firstInvestment.createdAt);
    startDate.setHours(0, 0, 0, 0);

    const today = new Date();
    today.setHours(23, 59, 59, 999);

    // Calculate daily portfolio values
    const history: { date: number; value: string }[] = [];
    const dayMs = 24 * 60 * 60 * 1000;

    // Track active positions and their values
    type Position = {
      shares: bigint;
      costBasis: bigint;
      purchaseNav: bigint;
      yieldRateBps: number;
      purchaseDate: Date;
    };
    const positions: Position[] = [];

    // Iterate through each day
    for (
      let currentDate = new Date(startDate);
      currentDate <= today;
      currentDate = new Date(currentDate.getTime() + dayMs)
    ) {
      // Add any investments that happened on or before this date
      for (const inv of investments) {
        const invDate = new Date(inv.createdAt);
        invDate.setHours(0, 0, 0, 0);

        if (invDate <= currentDate) {
          // Check if this investment is already tracked
          const alreadyTracked = positions.some(
            (p) =>
              p.purchaseDate.getTime() === invDate.getTime() &&
              p.shares === inv.shares &&
              p.costBasis === inv.amount
          );

          if (!alreadyTracked) {
            if (inv.type === InvestmentType.INVEST) {
              positions.push({
                shares: inv.shares,
                costBasis: inv.amount,
                purchaseNav: inv.sharePriceAtPurchase ?? NAV_BASE,
                yieldRateBps: inv.pool.yieldRateBps,
                purchaseDate: invDate,
              });
            }
            // Note: REDEEM handling would reduce positions, simplified for now
          }
        }
      }

      // Calculate total portfolio value for this day
      let totalValue = 0n;

      for (const pos of positions) {
        // Calculate days since purchase
        const daysSincePurchase = Math.floor(
          (currentDate.getTime() - pos.purchaseDate.getTime()) / dayMs
        );

        // Calculate NAV growth: NAV = purchaseNav * (1 + APY/365)^days
        // Simplified: NAV = purchaseNav * (1 + (APY * days) / 365 / 10000)
        const dailyGrowthBps =
          BigInt(pos.yieldRateBps) * BigInt(daysSincePurchase);
        const growthFactor =
          NAV_BASE + (dailyGrowthBps * NAV_BASE) / 365n / 10000n;

        // Current value = shares * currentNav / NAV_BASE
        const currentNav = (pos.purchaseNav * growthFactor) / NAV_BASE;
        const positionValue = (pos.shares * currentNav) / NAV_BASE;

        totalValue += positionValue;
      }

      // Add data point (date as unix timestamp in seconds)
      history.push({
        date: Math.floor(currentDate.getTime() / 1000),
        value: totalValue.toString(),
      });
    }

    res.json({
      success: true,
      history,
    });
  } catch (error: any) {
    console.error("Portfolio history error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch portfolio history",
    });
  }
});

export default router;
