import { Router, Request, Response } from "express";
import { z } from "zod";
import { WebAuthnService } from "../services/webauthn.service.js";
import { Redis } from "ioredis";
import {
  authLimiter,
  registrationLimiter,
  standardApiLimiter,
} from "../middleware/rateLimit.middleware.js";
import { cookieService } from "../services/cookie.service.js";
import { OAuthService } from "../services/oauth.service.js";
import { EmailVerificationService } from "../services/email.service.js";
import { WalletAuthService } from "../services/wallet.service.js";
import { SignJWT } from "jose";
import crypto from "crypto";

const router = Router();

// Initialize Redis and services
const redis = new Redis(process.env.REDIS_URL || "redis://localhost:6379");
const webAuthnService = new WebAuthnService(redis);
const oauthService = new OAuthService(redis);
const emailService = new EmailVerificationService(redis);
const walletService = new WalletAuthService(redis);

// JWT secret for issuing tokens
const JWT_SECRET_RAW = process.env.JWT_SECRET;
if (!JWT_SECRET_RAW) {
  throw new Error("JWT_SECRET environment variable is required");
}
const JWT_SECRET = new TextEncoder().encode(JWT_SECRET_RAW);

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

// Google OAuth schemas
const googleIdTokenSchema = z.object({
  idToken: z.string().min(1, "ID token required"),
});

// Email verification schemas
const sendCodeSchema = z.object({
  email: z.string().email("Invalid email address"),
});

const verifyCodeSchema = z.object({
  email: z.string().email("Invalid email address"),
  code: z.string().length(6, "Code must be 6 digits"),
  displayName: z.string().min(1).max(64).optional(),
});

// Wallet SIWE schemas
const walletNonceSchema = z.object({
  walletAddress: z
    .string()
    .regex(/^0x[a-fA-F0-9]{40}$/, "Invalid wallet address"),
});

const walletVerifySchema = z.object({
  message: z.string().min(1, "Message required"),
  signature: z.string().min(1, "Signature required"),
});

// ==================== Helper Functions ====================

/**
 * Issue JWT and set session cookies
 */
async function issueSession(
  res: Response,
  user: {
    id: string;
    email: string | null;
    walletAddress: string | null;
    authProvider: string;
  }
): Promise<{ token: string; expiresAt: Date; csrfToken: string }> {
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

  const token = await new SignJWT({
    sub: user.id,
    email: user.email,
    walletAddress: user.walletAddress,
    authProvider: user.authProvider,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(expiresAt)
    .sign(JWT_SECRET);

  // Store session
  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

  const { PrismaClient } = await import("@prisma/client");
  const prisma = new PrismaClient();

  await prisma.session.create({
    data: {
      userId: user.id,
      tokenHash,
      expiresAt,
    },
  });

  // Cache in Redis
  await redis.setex(
    `session:${tokenHash}`,
    24 * 60 * 60,
    JSON.stringify({
      userId: user.id,
      email: user.email,
      walletAddress: user.walletAddress,
      authProvider: user.authProvider,
    })
  );

  // Set cookies
  const csrfToken = cookieService.generateCSRFToken();
  cookieService.setAuthCookies(res, token, csrfToken);

  return { token, expiresAt, csrfToken };
}

// ==================== Registration Endpoints ====================

/**
 * POST /api/auth/register-options
 * Generate WebAuthn registration options for a new user
 */
router.post("/register-options", registrationLimiter, async (req: Request, res: Response) => {
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
router.post("/register-verify", registrationLimiter, async (req: Request, res: Response) => {
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
router.post("/login-options", authLimiter, async (req: Request, res: Response) => {
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
router.post("/login-verify", authLimiter, async (req: Request, res: Response) => {
  try {
    const { challengeId, response } = loginVerifySchema.parse(req.body);
    const result = await webAuthnService.verifyAuthentication(
      challengeId,
      response as any
    );

    // SEC-002: Set httpOnly cookies for secure token storage
    const csrfToken = cookieService.generateCSRFToken();
    cookieService.setAuthCookies(res, result.token, csrfToken);

    res.json({
      success: true,
      token: result.token, // Keep for backward compatibility (Phase 2)
      expiresAt: result.expiresAt.toISOString(),
      user: result.user,
      csrfToken, // SEC-002: CSRF token for frontend
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
 * SEC-002: Now supports both cookie and bearer token auth
 */
router.get("/session", async (req: Request, res: Response) => {
  try {
    // SEC-002: Check cookie first, then authorization header
    let token: string | null = null;

    // 1. Try cookie (new method)
    if (req.cookies?.auth_token) {
      token = req.cookies.auth_token;
    }
    // 2. Fallback to Authorization header (backward compat)
    else {
      const authHeader = req.headers.authorization;
      if (authHeader?.startsWith("Bearer ")) {
        token = authHeader.substring(7);
      }
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        error: "No token provided",
      });
    }

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
 * SEC-002: Now clears httpOnly cookies
 */
router.post("/logout", async (req: Request, res: Response) => {
  try {
    // SEC-002: Try to get token from cookie first, then header
    let token: string | null = null;

    if (req.cookies?.auth_token) {
      token = req.cookies.auth_token;
    } else {
      const authHeader = req.headers.authorization;
      if (authHeader?.startsWith("Bearer ")) {
        token = authHeader.substring(7);
      }
    }

    if (token) {
      await webAuthnService.invalidateSession(token);
    }

    // SEC-002: Clear authentication cookies
    cookieService.clearAuthCookies(res);

    res.json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (error: any) {
    console.error("Logout error:", error);
    // SEC-002: Still clear cookies even if token was invalid
    cookieService.clearAuthCookies(res);
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
router.get("/check-email", standardApiLimiter, async (req: Request, res: Response) => {
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

// ==================== Google OAuth Endpoints ====================

/**
 * GET /api/auth/google
 * Redirect to Google OAuth consent screen
 */
router.get("/google", async (req: Request, res: Response) => {
  try {
    const { url } = await oauthService.generateGoogleAuthUrl();
    res.redirect(url);
  } catch (error: any) {
    console.error("Google OAuth init error:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to initialize Google OAuth",
    });
  }
});

/**
 * GET /api/auth/google/callback
 * Handle Google OAuth callback
 */
router.get("/google/callback", async (req: Request, res: Response) => {
  try {
    const { code, state } = req.query;

    if (
      !code ||
      !state ||
      typeof code !== "string" ||
      typeof state !== "string"
    ) {
      throw new Error("Invalid OAuth callback parameters");
    }

    const result = await oauthService.handleGoogleCallback(code, state);

    // Issue session
    const session = await issueSession(res, result.user);

    // Redirect to frontend with success
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
    const params = new URLSearchParams({
      success: "true",
      isNewUser: result.isNewUser.toString(),
    });

    res.redirect(`${frontendUrl}/auth/callback?${params}`);
  } catch (error: any) {
    console.error("Google OAuth callback error:", error);
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
    res.redirect(
      `${frontendUrl}/auth/callback?error=${encodeURIComponent(error.message)}`
    );
  }
});

/**
 * POST /api/auth/google/token
 * Authenticate with Google ID token (for mobile/SPA)
 */
router.post(
  "/google/token",
  authLimiter,
  async (req: Request, res: Response) => {
    try {
      const { idToken } = googleIdTokenSchema.parse(req.body);
      const result = await oauthService.verifyGoogleIdToken(idToken);

      // Issue session
      const session = await issueSession(res, result.user);

      res.json({
        success: true,
        user: result.user,
        isNewUser: result.isNewUser,
        expiresAt: session.expiresAt.toISOString(),
        csrfToken: session.csrfToken,
      });
    } catch (error: any) {
      console.error("Google token auth error:", error);

      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: "Validation failed",
          details: error.errors,
        });
      }

      res.status(401).json({
        success: false,
        error: error.message || "Google authentication failed",
      });
    }
  }
);

// ==================== Email Verification Endpoints ====================

/**
 * POST /api/auth/email/send-code
 * Send verification code to email
 */
router.post(
  "/email/send-code",
  registrationLimiter,
  async (req: Request, res: Response) => {
    try {
      const { email } = sendCodeSchema.parse(req.body);
      const result = await emailService.sendVerificationCode(email);

      res.json({
        success: true,
        message: result.message,
        expiresAt: result.expiresAt.toISOString(),
      });
    } catch (error: any) {
      console.error("Send code error:", error);

      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: "Validation failed",
          details: error.errors,
        });
      }

      res.status(400).json({
        success: false,
        error: error.message || "Failed to send verification code",
      });
    }
  }
);

/**
 * POST /api/auth/email/verify-code
 * Verify code and authenticate user
 */
router.post(
  "/email/verify-code",
  authLimiter,
  async (req: Request, res: Response) => {
    try {
      const { email, code, displayName } = verifyCodeSchema.parse(req.body);
      const result = await emailService.verifyCode(email, code, displayName);

      if (!result.user) {
        throw new Error("Verification failed");
      }

      // Issue session
      const session = await issueSession(res, result.user);

      res.json({
        success: true,
        user: result.user,
        isNewUser: result.isNewUser,
        expiresAt: session.expiresAt.toISOString(),
        csrfToken: session.csrfToken,
      });
    } catch (error: any) {
      console.error("Verify code error:", error);

      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: "Validation failed",
          details: error.errors,
        });
      }

      res.status(400).json({
        success: false,
        error: error.message || "Verification failed",
      });
    }
  }
);

// ==================== Wallet SIWE Endpoints ====================

/**
 * POST /api/auth/wallet/nonce
 * Generate SIWE nonce for wallet
 */
router.post(
  "/wallet/nonce",
  authLimiter,
  async (req: Request, res: Response) => {
    try {
      const { walletAddress } = walletNonceSchema.parse(req.body);
      const result = await walletService.generateNonce(walletAddress);

      // Also return the message to sign
      const message = walletService.generateMessage(
        walletAddress,
        result.nonce
      );

      res.json({
        success: true,
        nonce: result.nonce,
        message,
        expiresAt: result.expiresAt.toISOString(),
      });
    } catch (error: any) {
      console.error("Wallet nonce error:", error);

      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: "Validation failed",
          details: error.errors,
        });
      }

      res.status(400).json({
        success: false,
        error: error.message || "Failed to generate nonce",
      });
    }
  }
);

/**
 * POST /api/auth/wallet/verify
 * Verify SIWE signature and authenticate
 */
router.post(
  "/wallet/verify",
  authLimiter,
  async (req: Request, res: Response) => {
    try {
      const { message, signature } = walletVerifySchema.parse(req.body);
      const result = await walletService.verifySignature(message, signature);

      // Issue session
      const session = await issueSession(res, result.user);

      res.json({
        success: true,
        user: result.user,
        isNewUser: result.isNewUser,
        expiresAt: session.expiresAt.toISOString(),
        csrfToken: session.csrfToken,
      });
    } catch (error: any) {
      console.error("Wallet verify error:", error);

      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: "Validation failed",
          details: error.errors,
        });
      }

      res.status(401).json({
        success: false,
        error: error.message || "Wallet authentication failed",
      });
    }
  }
);

export default router;
