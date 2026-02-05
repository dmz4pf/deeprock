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
      const hasBalance = await service.hassufficientBalance(0.1);
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
    const hasBalance = await service.hassufficientBalance(0.1);
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

export default router;
