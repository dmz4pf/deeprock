import { Request, Response, NextFunction } from "express";
import { cookieService } from "../services/cookie.service.js";

/**
 * CSRF Protection Middleware
 * SEC-002: Double-submit cookie pattern for CSRF protection
 *
 * Validates that X-CSRF-Token header matches csrf_token cookie
 * for state-changing requests (POST, PUT, DELETE, PATCH)
 */

// Paths exempt from CSRF validation (initial auth endpoints)
const CSRF_EXEMPT_PATHS = [
  // Passkey/WebAuthn
  "/api/auth/register-options",
  "/api/auth/register-verify",
  "/api/auth/login-options",
  "/api/auth/login-verify",
  "/api/auth/check-email",
  // Email verification
  "/api/auth/email/send-code",
  "/api/auth/email/verify-code",
  // Wallet SIWE
  "/api/auth/wallet/nonce",
  "/api/auth/wallet/verify",
  // Google OAuth
  "/api/auth/google",
  // Health
  "/api/health",
];

/**
 * Check if path is exempt from CSRF protection
 */
function isCSRFExempt(path: string): boolean {
  return CSRF_EXEMPT_PATHS.some((exempt) => path.startsWith(exempt));
}

/**
 * CSRF protection middleware
 * Only validates on state-changing requests (POST, PUT, DELETE, PATCH)
 */
export function csrfProtection(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Skip for safe methods (GET, HEAD, OPTIONS)
  const safeMethods = ["GET", "HEAD", "OPTIONS"];
  if (safeMethods.includes(req.method)) {
    return next();
  }

  // Skip for exempt paths (auth endpoints that establish the session)
  if (isCSRFExempt(req.path)) {
    return next();
  }

  // Skip if no auth cookie (unauthenticated requests don't need CSRF)
  const authCookie = req.cookies?.auth_token;
  if (!authCookie) {
    return next();
  }

  // Validate CSRF token
  const cookieToken = req.cookies?.csrf_token;
  const headerToken = req.headers["x-csrf-token"] as string | undefined;

  if (!cookieService.validateCSRFToken(cookieToken, headerToken)) {
    res.status(403).json({
      success: false,
      error: "CSRF token mismatch",
      code: "CSRF_INVALID",
    });
    return;
  }

  next();
}
