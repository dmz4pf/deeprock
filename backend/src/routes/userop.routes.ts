import { Router, Request, Response } from "express";
import { z } from "zod";
import { PrismaClient, PoolStatus } from "@prisma/client";
import { requireAuth } from "../middleware/auth.middleware.js";
import { standardApiLimiter, investmentLimiter } from "../middleware/rateLimit.middleware.js";
import { UserOperationService, WebAuthnSignature, UserOperationData } from "../services/userop.service.js";
import { Redis } from "ioredis";
import * as crypto from "crypto";

const router = Router();
const prisma = new PrismaClient();

// Initialize Redis
const redis = new Redis(process.env.REDIS_URL || "redis://localhost:6379");

// Initialize UserOperation service (lazy - only when needed)
let userOpService: UserOperationService | null = null;

function getUserOpService(): UserOperationService {
  if (!userOpService) {
    if (!process.env.P256_WALLET_FACTORY_ADDRESS) {
      throw new Error("P256_WALLET_FACTORY_ADDRESS not configured");
    }
    userOpService = new UserOperationService(redis);
  }
  return userOpService;
}

// ==================== Validation Schemas ====================

const buildUserOpSchema = z.object({
  poolId: z.string().min(1, "Pool ID is required"),
  amount: z.string().regex(/^\d+$/, "Amount must be a positive integer string"),
});

const submitUserOpSchema = z.object({
  requestId: z.string().uuid("Invalid request ID"),
  webauthnSignature: z.object({
    authenticatorData: z.string(),
    clientDataJSON: z.string(),
    signature: z.string(), // DER-encoded signature
    counter: z.number().int().min(0),
  }),
});

// ==================== Smart Wallet Endpoints ====================

/**
 * GET /api/userop/wallet
 * Get user's smart wallet information
 * Returns counterfactual address (computed even if not deployed)
 */
router.get(
  "/wallet",
  requireAuth,
  standardApiLimiter,
  async (req: Request, res: Response) => {
    try {
      const userId = req.user!.userId;

      // Get user's passkey credentials
      const identity = await prisma.biometricIdentity.findFirst({
        where: { userId },
        select: {
          publicKeyX: true,
          publicKeyY: true,
          credentialId: true,
        },
      });

      if (!identity?.publicKeyX || !identity?.publicKeyY) {
        res.status(400).json({
          success: false,
          error: "No passkey registered for this user",
          code: "PASSKEY_REQUIRED",
          message: "Register a passkey to use gasless transactions",
        });
        return;
      }

      const service = getUserOpService();

      // Get wallet info
      const walletInfo = await service.getWalletInfo(
        identity.publicKeyX,
        identity.publicKeyY,
        identity.credentialId
      );

      // Get balance info if deployed
      let depositBalance = "0";
      if (walletInfo.deployed) {
        try {
          // Check EntryPoint deposit balance
          const balance = await service["entryPoint"].balanceOf(walletInfo.address);
          depositBalance = balance.toString();
        } catch {
          // Ignore balance check errors
        }
      }

      // Cache smart wallet address in user record
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { smartWalletAddress: true },
      });
      if (!user?.smartWalletAddress) {
        await prisma.user.update({
          where: { id: userId },
          data: { smartWalletAddress: walletInfo.address },
        });
      }

      res.json({
        success: true,
        wallet: {
          address: walletInfo.address,
          deployed: walletInfo.deployed,
          depositBalance,
          entryPoint: "0x0000000071727De22E5E9d8BAf0edAc6f37da032",
        },
        passkey: {
          credentialId: identity.credentialId,
          hasPublicKey: true,
        },
      });
    } catch (error: any) {
      console.error("[UserOp] Get wallet error:", error.message);

      if (error.message?.includes("not configured")) {
        res.status(503).json({
          success: false,
          error: "Account abstraction not configured",
          code: "AA_NOT_CONFIGURED",
        });
        return;
      }

      res.status(500).json({
        success: false,
        error: "Failed to get wallet info",
      });
    }
  }
);

// ==================== UserOperation Build Endpoints ====================

/**
 * POST /api/userop/invest/build
 * Build a UserOperation for pool investment
 * Returns unsigned UserOp and hash to sign with passkey
 */
router.post(
  "/invest/build",
  requireAuth,
  investmentLimiter,
  async (req: Request, res: Response) => {
    try {
      const { poolId, amount } = buildUserOpSchema.parse(req.body);
      const userId = req.user!.userId;
      const amountBigInt = BigInt(amount);

      // Get pool info
      const pool = await prisma.assetPool.findUnique({
        where: { id: poolId },
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

      // Get user's passkey credentials
      const identity = await prisma.biometricIdentity.findFirst({
        where: { userId },
        select: {
          publicKeyX: true,
          publicKeyY: true,
          credentialId: true,
        },
      });

      if (!identity?.publicKeyX || !identity?.publicKeyY) {
        res.status(400).json({
          success: false,
          error: "No passkey registered for this user",
          code: "PASSKEY_REQUIRED",
        });
        return;
      }

      // Get contract addresses
      const usdcAddress = process.env.MOCK_USDC_ADDRESS;
      const rwaPoolAddress = process.env.RWA_POOL_ADDRESS;

      if (!usdcAddress || !rwaPoolAddress) {
        res.status(503).json({
          success: false,
          error: "Contract addresses not configured",
          code: "CONTRACTS_NOT_CONFIGURED",
        });
        return;
      }

      const service = getUserOpService();

      // Build UserOperation
      const { userOp, hash, walletAddress } = await service.buildInvestUserOp(
        identity.publicKeyX,
        identity.publicKeyY,
        identity.credentialId,
        pool.chainPoolId,
        amountBigInt,
        usdcAddress,
        rwaPoolAddress
      );

      // Generate a unique request ID for tracking
      const requestId = crypto.randomUUID();

      // Store pending UserOp in Redis for submission
      await redis.set(
        `userop:pending:${requestId}`,
        JSON.stringify({
          userOp,
          hash,
          poolId,
          amount,
          userId,
          walletAddress,
          createdAt: Date.now(),
        }),
        "EX",
        600 // 10 minute TTL
      );

      res.json({
        success: true,
        requestId,
        userOp,
        hash,
        walletAddress,
        pool: {
          id: pool.id,
          name: pool.name,
          chainPoolId: pool.chainPoolId,
        },
        message: "Sign this hash with your passkey to authorize the investment",
        signingInstructions: {
          challenge: Buffer.from(hash.slice(2), "hex").toString("base64url"),
          rpId: process.env.WEBAUTHN_RP_ID || "localhost",
          userVerification: "required",
        },
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

      console.error("[UserOp] Build invest error:", error.message);
      res.status(500).json({
        success: false,
        error: "Failed to build UserOperation",
        details: error.message,
      });
    }
  }
);

// ==================== UserOperation Submit Endpoints ====================

/**
 * POST /api/userop/invest/submit
 * Submit a signed UserOperation for pool investment
 */
router.post(
  "/invest/submit",
  requireAuth,
  investmentLimiter,
  async (req: Request, res: Response) => {
    try {
      const { requestId, webauthnSignature } = submitUserOpSchema.parse(req.body);
      const userId = req.user!.userId;

      // Retrieve original userOp from Redis using requestId
      const pendingData = await redis.get(`userop:pending:${requestId}`);
      if (!pendingData) {
        res.status(400).json({
          success: false,
          error: "Request expired or not found. Please try building a new UserOperation.",
          code: "REQUEST_EXPIRED",
        });
        return;
      }

      const { userOp, hash: originalHash, walletAddress, poolId, amount } = JSON.parse(pendingData);
      console.log("[UserOp] Retrieved pending request:", requestId);
      console.log("[UserOp] Original hash from build:", originalHash);

      // Verify user owns this wallet
      const identity = await prisma.biometricIdentity.findFirst({
        where: { userId },
        select: {
          publicKeyX: true,
          publicKeyY: true,
          credentialId: true,
        },
      });

      if (!identity?.publicKeyX || !identity?.publicKeyY) {
        res.status(400).json({
          success: false,
          error: "No passkey registered",
          code: "PASSKEY_REQUIRED",
        });
        return;
      }

      const service = getUserOpService();

      // Verify wallet address matches user's passkey
      const expectedWallet = await service.getWalletAddress(
        identity.publicKeyX,
        identity.publicKeyY,
        identity.credentialId
      );

      if (userOp.sender.toLowerCase() !== expectedWallet.toLowerCase()) {
        res.status(403).json({
          success: false,
          error: "UserOperation sender does not match your wallet",
          code: "WALLET_MISMATCH",
        });
        return;
      }

      // Parse DER signature to r, s components
      const derSignature = Buffer.from(webauthnSignature.signature, "base64url");
      const { r, s } = service.parseDERSignature(derSignature);

      // Compute clientDataHash from clientDataJSON
      const clientDataJSON = Buffer.from(webauthnSignature.clientDataJSON, "base64url");
      const clientDataHash = "0x" + crypto.createHash("sha256")
        .update(clientDataJSON)
        .digest("hex");

      // Verify challenge in clientDataJSON matches the original hash
      try {
        const clientData = JSON.parse(clientDataJSON.toString("utf-8"));
        console.log("[UserOp] clientDataJSON type:", clientData.type);

        // Extract challenge and convert from base64url to hex
        const challengeBase64 = clientData.challenge;
        const challengeHex = "0x" + Buffer.from(challengeBase64, "base64url").toString("hex");
        console.log("[UserOp] Challenge from signature:", challengeHex);
        console.log("[UserOp] Original hash from build:", originalHash);

        // Verify the challenge matches the original hash we asked them to sign
        if (challengeHex.toLowerCase() !== originalHash.toLowerCase()) {
          console.error("[UserOp] CRITICAL: Challenge doesn't match original hash!");
          console.error("[UserOp]   Signed challenge:", challengeHex);
          console.error("[UserOp]   Expected hash:   ", originalHash);
          res.status(400).json({
            success: false,
            error: "Signature challenge does not match the UserOperation hash",
            code: "CHALLENGE_MISMATCH",
          });
          return;
        }
        console.log("[UserOp] Challenge matches original hash ✓");

        // Also verify our hash computation matches EntryPoint's
        const entryPointHash = await service.getEntryPointUserOpHash(userOp);
        console.log("[UserOp] EntryPoint hash:", entryPointHash);
        if (entryPointHash.toLowerCase() !== originalHash.toLowerCase()) {
          console.error("[UserOp] CRITICAL: Our hash doesn't match EntryPoint!");
          console.error("[UserOp]   Our hash:       ", originalHash);
          console.error("[UserOp]   EntryPoint hash:", entryPointHash);
        } else {
          console.log("[UserOp] Hash matches EntryPoint ✓");
        }
      } catch (parseErr: any) {
        console.error("[UserOp] Failed to parse clientDataJSON:", parseErr.message);
        res.status(400).json({
          success: false,
          error: "Invalid clientDataJSON format",
          code: "INVALID_CLIENT_DATA",
        });
        return;
      }

      // Debug: Log public key info
      console.log("[UserOp] User's registered public key:");
      console.log("  publicKeyX:", identity.publicKeyX);
      console.log("  publicKeyY:", identity.publicKeyY);
      console.log("  credentialId:", identity.credentialId);

      // Debug: Test P256 signature verification directly
      const authenticatorDataHex = "0x" + Buffer.from(webauthnSignature.authenticatorData, "base64url").toString("hex");
      console.log("[UserOp] Testing P256 signature directly...");
      console.log("  authenticatorData (hex):", authenticatorDataHex.slice(0, 50) + "...");
      console.log("  authenticatorData length:", Buffer.from(webauthnSignature.authenticatorData, "base64url").length);
      console.log("  clientDataHash:", clientDataHash);
      console.log("  r:", r);
      console.log("  s:", s);

      // Compute messageHash the same way the contract does
      const { ethers: eth } = await import("ethers");
      const authenticatorDataBuffer = Buffer.from(webauthnSignature.authenticatorData, "base64url");
      const clientDataHashBuffer = Buffer.from(clientDataHash.slice(2), "hex");
      const concatenated = Buffer.concat([authenticatorDataBuffer, clientDataHashBuffer]);
      const messageHash = "0x" + crypto.createHash("sha256").update(concatenated).digest("hex");
      console.log("[UserOp] Computed messageHash (sha256(authData || clientDataHash)):", messageHash);

      // Test precompile call
      try {
        const testResult = await service.testP256Verify(
          messageHash,
          r,
          s,
          identity.publicKeyX,
          identity.publicKeyY
        );
        console.log("[UserOp] P256 precompile test result:", testResult);
      } catch (testErr: any) {
        console.error("[UserOp] P256 precompile test failed:", testErr.message);
      }

      // Get the wallet's current signatureCounter from on-chain
      // The contract requires counter > signatureCounter, so we use signatureCounter + 1
      const currentSignatureCounter = await service.getSignatureCounter(walletAddress);
      const adjustedCounter = currentSignatureCounter + 1;
      console.log(`[UserOp] On-chain signatureCounter: ${currentSignatureCounter} -> using: ${adjustedCounter}`);

      const encodedSignature = service.encodeWebAuthnSignature({
        authenticatorData: "0x" + Buffer.from(webauthnSignature.authenticatorData, "base64url").toString("hex"),
        clientDataHash,
        r,
        s,
        counter: adjustedCounter,
      });

      // Add signature to UserOp
      const signedUserOp = service.addSignatureToUserOp(userOp as UserOperationData, encodedSignature);

      // Submit to bundler or directly
      let result;
      if (process.env.BUNDLER_RPC_URL) {
        result = await service.submitUserOp(signedUserOp);
      } else if (process.env.RELAYER_PRIVATE_KEY) {
        // Fallback to direct submission via relayer
        result = await service.submitUserOpDirect(
          signedUserOp,
          process.env.RELAYER_PRIVATE_KEY
        );
      } else {
        res.status(503).json({
          success: false,
          error: "No bundler or relayer configured",
          code: "NO_SUBMISSION_METHOD",
        });
        return;
      }

      // Log the operation
      await service.logUserOp(userId, "INVEST_SUBMITTED", result.userOpHash, result.status);

      // Clean up pending request to prevent replay attacks
      await redis.del(`userop:pending:${requestId}`);

      // If successful, create investment record in database
      if (result.status !== "failed") {
        console.log(`[UserOp] Investment submitted: ${result.userOpHash}`);

        // Create Investment record
        const amountBigInt = BigInt(amount);
        const NAV_BASE = BigInt(100_000_000); // 8 decimals

        // Get pool for NAV calculation
        const poolForNav = await prisma.assetPool.findUnique({
          where: { id: poolId },
          select: { navPerShare: true, chainPoolId: true }
        });

        if (poolForNav) {
          // Calculate shares: amount * NAV_BASE / navPerShare
          const shares = (amountBigInt * NAV_BASE) / poolForNav.navPerShare;

          await prisma.investment.create({
            data: {
              userId,
              poolId,
              type: "INVEST",
              amount: amountBigInt,
              shares,
              sharePriceAtPurchase: poolForNav.navPerShare,
              status: result.status === "success" ? "CONFIRMED" : "PENDING",
              txHash: result.txHash || null,
            },
          });

          // Update pool investor count if confirmed
          if (result.status === "success") {
            // Check if this is user's first investment in this pool
            const existingInvestments = await prisma.investment.count({
              where: {
                userId,
                poolId,
                type: "INVEST",
                status: "CONFIRMED",
              },
            });

            if (existingInvestments === 1) { // This is the only one
              await prisma.assetPool.update({
                where: { id: poolId },
                data: { investorCount: { increment: 1 } },
              });
            }
          }

          console.log(`[UserOp] Investment record created for pool ${poolForNav.chainPoolId}`);
        }
      }

      res.json({
        success: result.status === "success",
        result: {
          userOpHash: result.userOpHash,
          txHash: result.txHash,
          blockNumber: result.blockNumber,
          status: result.status,
          revertReason: result.revertReason,
        },
        explorer: result.txHash
          ? `https://testnet.snowtrace.io/tx/${result.txHash}`
          : null,
        message: result.status === "success"
          ? "Investment confirmed on-chain!"
          : result.status === "pending"
          ? "UserOperation submitted. Awaiting confirmation."
          : result.revertReason
          ? `Transaction reverted: ${result.revertReason}`
          : "Transaction reverted on-chain. Please check your USDC balance and allowance.",
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

      console.error("[UserOp] Submit error:", error.message);

      // Handle specific bundler errors
      if (error.message?.includes("rejected")) {
        res.status(400).json({
          success: false,
          error: "UserOperation rejected by bundler",
          code: "BUNDLER_REJECTED",
          details: error.message,
        });
        return;
      }

      res.status(500).json({
        success: false,
        error: "Failed to submit UserOperation",
        details: error.message,
      });
    }
  }
);

// ==================== Status Endpoints ====================

/**
 * GET /api/userop/:hash/status
 * Check status of a submitted UserOperation
 */
router.get(
  "/:hash/status",
  requireAuth,
  standardApiLimiter,
  async (req: Request, res: Response) => {
    try {
      const { hash } = req.params;

      if (!hash || !hash.startsWith("0x")) {
        res.status(400).json({
          success: false,
          error: "Invalid UserOperation hash",
          code: "INVALID_HASH",
        });
        return;
      }

      const service = getUserOpService();

      // Check bundler for receipt
      if (process.env.BUNDLER_RPC_URL) {
        const result = await service.getUserOpReceipt(hash);

        res.json({
          success: true,
          status: result.status,
          txHash: result.txHash,
          blockNumber: result.blockNumber,
          explorer: result.txHash
            ? `https://testnet.snowtrace.io/tx/${result.txHash}`
            : null,
        });
        return;
      }

      // Check Redis for cached result
      const cached = await redis.get(`userop:result:${hash}`);
      if (cached) {
        const result = JSON.parse(cached);
        res.json({
          success: true,
          status: result.status,
          txHash: result.txHash,
          blockNumber: result.blockNumber,
          explorer: result.txHash
            ? `https://testnet.snowtrace.io/tx/${result.txHash}`
            : null,
        });
        return;
      }

      res.json({
        success: true,
        status: "unknown",
        message: "UserOperation status not found",
      });
    } catch (error: any) {
      console.error("[UserOp] Status check error:", error.message);
      res.status(500).json({
        success: false,
        error: "Failed to check UserOperation status",
      });
    }
  }
);

// ==================== Utility Endpoints ====================

/**
 * GET /api/userop/config
 * Get ERC-4337 configuration for frontend
 */
router.get(
  "/config",
  standardApiLimiter,
  async (req: Request, res: Response) => {
    const configured = !!(
      process.env.P256_WALLET_FACTORY_ADDRESS &&
      process.env.RWA_PAYMASTER_ADDRESS
    );

    res.json({
      success: true,
      configured,
      config: configured
        ? {
            entryPoint: "0x0000000071727De22E5E9d8BAf0edAc6f37da032",
            factory: process.env.P256_WALLET_FACTORY_ADDRESS,
            paymaster: process.env.RWA_PAYMASTER_ADDRESS,
            chainId: parseInt(process.env.CHAIN_ID || "43113"),
            network: "avalanche-fuji",
          }
        : null,
      message: configured
        ? "ERC-4337 Account Abstraction is available"
        : "ERC-4337 not configured. Set P256_WALLET_FACTORY_ADDRESS and RWA_PAYMASTER_ADDRESS",
    });
  }
);

export default router;
