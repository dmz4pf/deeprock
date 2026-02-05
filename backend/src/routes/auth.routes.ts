import { Router, Request, Response } from "express";
import { z } from "zod";
import { WebAuthnService } from "../services/webauthn.service.js";
import { Redis } from "ioredis";

const router = Router();

// Initialize Redis and WebAuthn service
const redis = new Redis(process.env.REDIS_URL || "redis://localhost:6379");
const webAuthnService = new WebAuthnService(redis);

// ==================== Validation Schemas ====================

const registerOptionsSchema = z.object({
  email: z.string().email("Invalid email address"),
  displayName: z.string().min(1).max(64).optional(),
});

const registerVerifySchema = z.object({
  challengeId: z.string().uuid("Invalid challenge ID"),
  response: z.object({
    id: z.string(),
    rawId: z.string(),
    type: z.literal("public-key"),
    response: z.object({
      clientDataJSON: z.string(),
      attestationObject: z.string(),
      transports: z.array(z.string()).optional(),
    }),
    clientExtensionResults: z.record(z.any()).optional(),
  }),
});

const loginOptionsSchema = z.object({
  email: z.string().email("Invalid email address"),
});

const loginVerifySchema = z.object({
  challengeId: z.string().uuid("Invalid challenge ID"),
  response: z.object({
    id: z.string(),
    rawId: z.string(),
    type: z.literal("public-key"),
    response: z.object({
      clientDataJSON: z.string(),
      authenticatorData: z.string(),
      signature: z.string(),
      userHandle: z.string().optional(),
    }),
    clientExtensionResults: z.record(z.any()).optional(),
  }),
});

// ==================== Registration Endpoints ====================

/**
 * POST /api/auth/register-options
 * Generate WebAuthn registration options for a new user
 */
router.post("/register-options", async (req: Request, res: Response) => {
  try {
    const { email, displayName } = registerOptionsSchema.parse(req.body);
    const result = await webAuthnService.generateRegistrationOptions(
      email,
      displayName
    );

    res.json({
      success: true,
      options: result.options,
      challengeId: result.challengeId,
    });
  } catch (error: any) {
    console.error("Register options error:", error);

    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: "Validation failed",
        details: error.errors,
      });
    }

    res.status(400).json({
      success: false,
      error: error.message || "Failed to generate registration options",
    });
  }
});

/**
 * POST /api/auth/register-verify
 * Verify WebAuthn registration response and create user
 */
router.post("/register-verify", async (req: Request, res: Response) => {
  try {
    const { challengeId, response } = registerVerifySchema.parse(req.body);
    const result = await webAuthnService.verifyRegistration(
      challengeId,
      response as any
    );

    res.json({
      success: true,
      user: result.user,
      publicKey: result.publicKey,
      message: "Registration successful. You can now authenticate with biometrics.",
    });
  } catch (error: any) {
    console.error("Register verify error:", error);

    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: "Validation failed",
        details: error.errors,
      });
    }

    res.status(400).json({
      success: false,
      error: error.message || "Registration verification failed",
    });
  }
});

// ==================== Authentication Endpoints ====================

/**
 * POST /api/auth/login-options
 * Generate WebAuthn authentication options for existing user
 */
router.post("/login-options", async (req: Request, res: Response) => {
  try {
    const { email } = loginOptionsSchema.parse(req.body);
    const result = await webAuthnService.generateAuthenticationOptions(email);

    res.json({
      success: true,
      options: result.options,
      challengeId: result.challengeId,
    });
  } catch (error: any) {
    console.error("Login options error:", error);

    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: "Validation failed",
        details: error.errors,
      });
    }

    // Don't reveal if user exists or not
    res.status(400).json({
      success: false,
      error: "Unable to generate authentication options",
    });
  }
});

/**
 * POST /api/auth/login-verify
 * Verify WebAuthn authentication response and issue JWT
 */
router.post("/login-verify", async (req: Request, res: Response) => {
  try {
    const { challengeId, response } = loginVerifySchema.parse(req.body);
    const result = await webAuthnService.verifyAuthentication(
      challengeId,
      response as any
    );

    res.json({
      success: true,
      token: result.token,
      expiresAt: result.expiresAt.toISOString(),
      user: result.user,
    });
  } catch (error: any) {
    console.error("Login verify error:", error);

    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: "Validation failed",
        details: error.errors,
      });
    }

    res.status(401).json({
      success: false,
      error: "Authentication failed",
    });
  }
});

// ==================== Session Endpoints ====================

/**
 * GET /api/auth/session
 * Get current session information
 */
router.get("/session", async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        error: "No token provided",
      });
    }

    const token = authHeader.substring(7);
    const session = await webAuthnService.verifyToken(token);

    res.json({
      success: true,
      session,
    });
  } catch (error: any) {
    res.status(401).json({
      success: false,
      error: error.message || "Invalid or expired session",
    });
  }
});

/**
 * POST /api/auth/logout
 * Invalidate current session
 */
router.post("/logout", async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.substring(7);
      await webAuthnService.invalidateSession(token);
    }

    res.json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (error: any) {
    console.error("Logout error:", error);
    // Still return success even if token was invalid
    res.json({
      success: true,
      message: "Logged out",
    });
  }
});

// ==================== Utility Endpoints ====================

/**
 * GET /api/auth/check-email
 * Check if email is already registered (for UX)
 */
router.get("/check-email", async (req: Request, res: Response) => {
  try {
    const email = z.string().email().parse(req.query.email);

    // Import Prisma here to avoid circular dependencies
    const { PrismaClient } = await import("@prisma/client");
    const prisma = new PrismaClient();

    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    res.json({
      success: true,
      registered: !!user,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: "Invalid email address",
    });
  }
});

export default router;
