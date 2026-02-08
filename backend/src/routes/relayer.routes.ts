import { Router, Request, Response } from "express";
import { z } from "zod";
import { Redis } from "ioredis";
import { RelayerService } from "../services/relayer.service.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import { relayerLimiter, registrationLimiter } from "../middleware/rateLimit.middleware.js";

const router = Router();

// Initialize Redis and RelayerService
const redis = new Redis(process.env.REDIS_URL || "redis://localhost:6379");
let relayerService: RelayerService | null = null;

// Lazy initialization to handle missing environment variables gracefully
function getRelayerService(): RelayerService {
  if (!relayerService) {
    relayerService = new RelayerService(redis);
  }
  return relayerService;
}

// ==================== Validation Schemas ====================

const registerBiometricSchema = z.object({
  userAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/, "Invalid Ethereum address"),
  publicKeyX: z.string().regex(/^0x[a-fA-F0-9]+$/, "Invalid public key X"),
  publicKeyY: z.string().regex(/^0x[a-fA-F0-9]+$/, "Invalid public key Y"),
  credentialId: z.string().min(1, "Credential ID required"),
});

const registerWithSignatureSchema = z.object({
  userAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/, "Invalid Ethereum address"),
  publicKeyX: z.string().regex(/^0x[a-fA-F0-9]+$/, "Invalid public key X"),
  publicKeyY: z.string().regex(/^0x[a-fA-F0-9]+$/, "Invalid public key Y"),
  credentialId: z.string().min(1, "Credential ID required"),
  deadline: z.number().int().positive(),
  nonce: z.string(), // BigInt as string
  r: z.string().regex(/^0x[a-fA-F0-9]{64}$/, "Invalid signature r"),
  s: z.string().regex(/^0x[a-fA-F0-9]{64}$/, "Invalid signature s"),
});

const estimateGasSchema = z.object({
  publicKeyX: z.string().regex(/^0x[a-fA-F0-9]+$/, "Invalid public key X"),
  publicKeyY: z.string().regex(/^0x[a-fA-F0-9]+$/, "Invalid public key Y"),
  credentialId: z.string().min(1, "Credential ID required"),
});

// ==================== Public Endpoints ====================

/**
 * GET /api/relayer/status
 * Get relayer health and balance information
 */
router.get("/status", async (req: Request, res: Response) => {
  try {
    const service = getRelayerService();
    const status = await service.getStatus();

    res.json({
      success: true,
      status: {
        ...status,
        healthy: parseFloat(status.balance) >= 0.1,
        minBalanceWarning: parseFloat(status.balance) < 0.5,
      },
    });
  } catch (error: any) {
    console.error("Relayer status error:", error);

    // Don't expose internal errors
    if (error.message.includes("environment variable")) {
      res.status(503).json({
        success: false,
        error: "Relayer service not configured",
        code: "RELAYER_NOT_CONFIGURED",
      });
      return;
    }

    res.status(500).json({
      success: false,
      error: "Failed to get relayer status",
      code: "RELAYER_STATUS_ERROR",
    });
  }
});

/**
 * POST /api/relayer/estimate-gas
 * Estimate gas cost for registration
 */
router.post("/estimate-gas", async (req: Request, res: Response) => {
  try {
    const { publicKeyX, publicKeyY, credentialId } = estimateGasSchema.parse(req.body);

    const service = getRelayerService();
    const estimate = await service.estimateRegistrationGas(
      publicKeyX,
      publicKeyY,
      credentialId
    );

    res.json({
      success: true,
      estimate,
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        error: "Validation failed",
        details: error.errors,
      });
      return;
    }

    console.error("Gas estimation error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to estimate gas",
      code: "GAS_ESTIMATE_ERROR",
    });
  }
});

// ==================== Protected Endpoints ====================

/**
 * POST /api/relayer/register
 * Register biometric identity on-chain (requires authentication)
 * This endpoint is called after successful WebAuthn registration
 */
router.post(
  "/register",
  requireAuth,
  registrationLimiter,
  async (req: Request, res: Response) => {
    try {
      const data = registerBiometricSchema.parse(req.body);

      // Verify the user owns this wallet address
      if (req.user?.walletAddress?.toLowerCase() !== data.userAddress.toLowerCase()) {
        res.status(403).json({
          success: false,
          error: "Wallet address mismatch",
          code: "WALLET_MISMATCH",
        });
        return;
      }

      const service = getRelayerService();

      // Check relayer has sufficient balance
      const hasBalance = await service.hasSufficientBalance(0.1);
      if (!hasBalance) {
        res.status(503).json({
          success: false,
          error: "Relayer temporarily unavailable",
          code: "RELAYER_LOW_BALANCE",
        });
        return;
      }

      const result = await service.registerBiometric(
        data.userAddress,
        data.publicKeyX,
        data.publicKeyY,
        data.credentialId
      );

      res.json({
        success: true,
        transaction: result,
        message: "Biometric identity registered on-chain",
      });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          error: "Validation failed",
          details: error.errors,
        });
        return;
      }

      console.error("Registration error:", error);

      // Handle specific errors
      if (error.message.includes("already has registered identity")) {
        res.status(409).json({
          success: false,
          error: "Identity already registered on-chain",
          code: "ALREADY_REGISTERED",
        });
        return;
      }

      if (error.message.includes("Rate limit")) {
        res.status(429).json({
          success: false,
          error: error.message,
          code: "RATE_LIMIT_EXCEEDED",
        });
        return;
      }

      if (error.message.includes("nonce lock")) {
        res.status(503).json({
          success: false,
          error: "Relayer busy, please retry",
          code: "RELAYER_BUSY",
        });
        return;
      }

      res.status(500).json({
        success: false,
        error: "Registration failed",
        code: "REGISTRATION_ERROR",
      });
    }
  }
);

/**
 * POST /api/relayer/register-signed
 * Register biometric identity using meta-transaction with user signature
 */
router.post(
  "/register-signed",
  requireAuth,
  registrationLimiter,
  async (req: Request, res: Response) => {
    try {
      const data = registerWithSignatureSchema.parse(req.body);

      // Verify wallet ownership
      if (req.user?.walletAddress?.toLowerCase() !== data.userAddress.toLowerCase()) {
        res.status(403).json({
          success: false,
          error: "Wallet address mismatch",
          code: "WALLET_MISMATCH",
        });
        return;
      }

      const service = getRelayerService();

      const result = await service.registerBiometricWithSignature(
        data.userAddress,
        data.publicKeyX,
        data.publicKeyY,
        data.credentialId,
        data.deadline,
        BigInt(data.nonce),
        data.r,
        data.s
      );

      res.json({
        success: true,
        transaction: result,
        message: "Biometric identity registered via meta-transaction",
      });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          error: "Validation failed",
          details: error.errors,
        });
        return;
      }

      console.error("Meta-transaction registration error:", error);

      if (error.message.includes("deadline expired")) {
        res.status(400).json({
          success: false,
          error: "Signature deadline expired",
          code: "DEADLINE_EXPIRED",
        });
        return;
      }

      res.status(500).json({
        success: false,
        error: "Meta-transaction registration failed",
        code: "META_TX_ERROR",
      });
    }
  }
);

/**
 * GET /api/relayer/balance-check
 * Check if relayer has sufficient balance (authenticated endpoint)
 */
router.get("/balance-check", requireAuth, async (req: Request, res: Response) => {
  try {
    const service = getRelayerService();
    const hasBalance = await service.hasSufficientBalance(0.1);
    const status = await service.getStatus();

    res.json({
      success: true,
      sufficient: hasBalance,
      balance: status.balance,
      minRequired: "0.1",
      unit: "AVAX",
    });
  } catch (error: any) {
    console.error("Balance check error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to check balance",
    });
  }
});

// ==================== Faucet Endpoints ====================

/**
 * POST /api/relayer/faucet
 * Get free test USDC (testnet only)
 * Requires authentication - mints to user's smart wallet (for passkey users) or linked wallet
 */
router.post("/faucet", requireAuth, relayerLimiter, async (req: Request, res: Response) => {
  try {
    const service = getRelayerService();

    if (!service.hasMockUsdc()) {
      res.status(503).json({
        success: false,
        error: "Faucet not available",
        code: "FAUCET_NOT_CONFIGURED",
      });
      return;
    }

    // Get user's wallet address and biometric identity from database
    const { PrismaClient } = await import("@prisma/client");
    const prisma = new PrismaClient();

    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      select: {
        walletAddress: true,
        biometricIdentities: {
          where: { isActive: true },
          take: 1,
          select: { publicKeyX: true, publicKeyY: true, credentialId: true }
        }
      },
    });

    // Determine target address based on auth flow:
    // - WALLET users: Always use EOA (they use permit flow with MetaMask)
    // - EMAIL/GOOGLE users: Use smart wallet if they have passkey, else EOA
    let targetAddress: string;
    let isSmartWallet = false;
    const isWalletUser = req.user!.authProvider === "WALLET";

    if (isWalletUser && user?.walletAddress) {
      // Wallet users always use their EOA for permit-based flow
      targetAddress = user.walletAddress;
      console.log(`[Faucet] Wallet user - minting to EOA: ${targetAddress}`);
    } else if (user?.biometricIdentities && user.biometricIdentities.length > 0) {
      // Passkey user (EMAIL/GOOGLE) - compute their smart wallet address
      const identity = user.biometricIdentities[0];
      const { UserOperationService } = await import("../services/userop.service.js");
      const redisForUserOp = new Redis(process.env.REDIS_URL || "redis://localhost:6379");
      const userOpService = new UserOperationService(redisForUserOp);

      targetAddress = await userOpService.getWalletAddress(
        identity.publicKeyX,
        identity.publicKeyY,
        identity.credentialId
      );
      isSmartWallet = true;
      console.log(`[Faucet] Passkey user - minting to smart wallet: ${targetAddress}`);
    } else if (user?.walletAddress) {
      // Fallback to EOA wallet (shouldn't normally happen)
      targetAddress = user.walletAddress;
      console.log(`[Faucet] Fallback - minting to EOA: ${targetAddress}`);
    } else {
      res.status(400).json({
        success: false,
        error: "No wallet or passkey linked to account.",
        code: "NO_WALLET",
      });
      return;
    }

    // Parse optional amount (default 10,000 USDC)
    const requestedAmount = req.body.amount ? BigInt(req.body.amount) : BigInt(10_000) * BigInt(10 ** 6);

    // Check relayer has gas
    if (!await service.hasSufficientBalance(0.01)) {
      res.status(503).json({
        success: false,
        error: "Faucet temporarily unavailable",
        code: "RELAYER_LOW_BALANCE",
      });
      return;
    }

    // Mint test USDC to target address
    const result = await service.mintTestUsdc(targetAddress, requestedAmount);

    // Get new balance
    const newBalance = await service.getUsdcBalance(targetAddress);

    res.json({
      success: true,
      transaction: {
        txHash: result.txHash,
        explorer: `https://testnet.snowtrace.io/tx/${result.txHash}`,
      },
      targetAddress,
      isSmartWallet,
      amount: requestedAmount.toString(),
      amountFormatted: `${Number(requestedAmount) / 1_000_000} USDC`,
      newBalance: newBalance,
      newBalanceFormatted: `${Number(newBalance) / 1_000_000} USDC`,
      message: isSmartWallet
        ? "Test USDC sent to your smart wallet!"
        : "Test USDC sent to your wallet!",
    });
  } catch (error: any) {
    console.error("Faucet error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to dispense test tokens",
      details: error.message,
    });
  }
});

/**
 * GET /api/relayer/usdc-balance/:address
 * Get USDC balance for any address
 */
router.get("/usdc-balance/:address", async (req: Request, res: Response) => {
  try {
    const { address } = req.params;

    if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
      res.status(400).json({
        success: false,
        error: "Invalid address format",
      });
      return;
    }

    const service = getRelayerService();

    if (!service.hasMockUsdc()) {
      res.status(503).json({
        success: false,
        error: "USDC contract not configured",
      });
      return;
    }

    const balance = await service.getUsdcBalance(address);

    res.json({
      success: true,
      address,
      balance,
      balanceFormatted: `${Number(balance) / 1_000_000} USDC`,
      token: {
        address: process.env.MOCK_USDC_ADDRESS,
        symbol: "USDC",
        decimals: 6,
      },
    });
  } catch (error: any) {
    console.error("Balance check error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to check balance",
    });
  }
});

export default router;
