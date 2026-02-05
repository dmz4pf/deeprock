import { Router, Request, Response } from "express";
import { z } from "zod";
import { PrismaClient, InvestmentType, InvestmentStatus } from "@prisma/client";
import { requireAuth } from "../middleware/auth.middleware.js";
import { standardApiLimiter } from "../middleware/rateLimit.middleware.js";

const router = Router();
const prisma = new PrismaClient();

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
          },
        },
      },
    });

    // Aggregate by pool
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
      }
    >();

    for (const inv of investments) {
      const existing = holdingsMap.get(inv.poolId) || {
        poolId: inv.poolId,
        poolName: inv.pool.name,
        assetClass: inv.pool.assetClass,
        yieldRateBps: inv.pool.yieldRateBps,
        totalInvested: 0n,
        totalRedeemed: 0n,
        totalShares: 0n,
        status: inv.pool.status,
      };

      if (inv.type === InvestmentType.INVEST) {
        existing.totalInvested += inv.amount;
        existing.totalShares += inv.shares;
      } else {
        existing.totalRedeemed += inv.amount;
        existing.totalShares -= inv.shares;
      }

      holdingsMap.set(inv.poolId, existing);
    }

    // Convert to array and filter out fully redeemed positions
    const holdings = Array.from(holdingsMap.values())
      .filter((h) => h.totalShares > 0n)
      .map((h) => ({
        poolId: h.poolId,
        poolName: h.poolName,
        assetClass: h.assetClass,
        yieldRatePercent: (h.yieldRateBps / 100).toFixed(2),
        totalInvested: h.totalInvested.toString(),
        totalRedeemed: h.totalRedeemed.toString(),
        netInvested: (h.totalInvested - h.totalRedeemed).toString(),
        totalShares: h.totalShares.toString(),
        status: h.status,
      }));

    // Calculate totals
    const totalInvested = holdings.reduce(
      (sum, h) => sum + BigInt(h.netInvested),
      0n
    );

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
          totalInvested: totalInvested.toString(),
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
      type: tx.type,
      status: tx.status,
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

export default router;
