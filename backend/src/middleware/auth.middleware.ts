import { Request, Response, NextFunction } from "express";
import { Redis } from "ioredis";
import { WebAuthnService, SessionPayload } from "../services/webauthn.service.js";

// Extend Express Request type to include user context
declare global {
  namespace Express {
    interface Request {
      user?: SessionPayload;
    }
  }
}

// Initialize Redis connection
const redis = new Redis(process.env.REDIS_URL || "redis://localhost:6379");
const webAuthnService = new WebAuthnService(redis);

/**
 * JWT Authentication Middleware
 * Verifies Bearer token and attaches user context to request
 */
export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      res.status(401).json({
        success: false,
        error: "Authorization header required",
        code: "MISSING_AUTH_HEADER",
      });
      return;
    }

    if (!authHeader.startsWith("Bearer ")) {
      res.status(401).json({
        success: false,
        error: "Invalid authorization format. Use: Bearer <token>",
        code: "INVALID_AUTH_FORMAT",
      });
      return;
    }

    const token = authHeader.substring(7);

    if (!token) {
      res.status(401).json({
        success: false,
        error: "Token not provided",
        code: "MISSING_TOKEN",
      });
      return;
    }

    // Verify token and get session payload
    const session = await webAuthnService.verifyToken(token);

    // Attach user context to request
    req.user = session;

    next();
  } catch (error: any) {
    // Handle specific error types
    if (error.message === "Invalid token" || error.message === "Session expired") {
      res.status(401).json({
        success: false,
        error: "Invalid or expired token",
        code: "INVALID_TOKEN",
      });
      return;
    }

    console.error("Auth middleware error:", error);
    res.status(500).json({
      success: false,
      error: "Authentication failed",
      code: "AUTH_ERROR",
    });
  }
}

/**
 * Optional Authentication Middleware
 * Attaches user context if valid token present, but allows unauthenticated access
 */
export async function optionalAuth(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.substring(7);
      if (token) {
        try {
          const session = await webAuthnService.verifyToken(token);
          req.user = session;
        } catch {
          // Silently ignore invalid tokens for optional auth
        }
      }
    }

    next();
  } catch (error) {
    // Continue without auth on any error
    next();
  }
}

/**
 * Require specific user to match a parameter (e.g., :userId)
 * Must be used after requireAuth middleware
 */
export function requireSelf(paramName: string = "userId") {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: "Authentication required",
        code: "AUTH_REQUIRED",
      });
      return;
    }

    const paramValue = req.params[paramName];

    if (paramValue && paramValue !== req.user.userId) {
      res.status(403).json({
        success: false,
        error: "Access denied",
        code: "FORBIDDEN",
      });
      return;
    }

    next();
  };
}

/**
 * Require wallet address to match a parameter
 * Must be used after requireAuth middleware
 */
export function requireWalletOwner(paramName: string = "walletAddress") {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: "Authentication required",
        code: "AUTH_REQUIRED",
      });
      return;
    }

    const paramValue = req.params[paramName]?.toLowerCase();
    const userWallet = req.user.walletAddress?.toLowerCase();

    if (paramValue && paramValue !== userWallet) {
      res.status(403).json({
        success: false,
        error: "Wallet address mismatch",
        code: "WALLET_MISMATCH",
      });
      return;
    }

    next();
  };
}

/**
 * Extract user ID from request (helper for routes)
 */
export function getUserId(req: Request): string | undefined {
  return req.user?.userId;
}

/**
 * Extract wallet address from request (helper for routes)
 */
export function getWalletAddress(req: Request): string | undefined {
  return req.user?.walletAddress;
}
