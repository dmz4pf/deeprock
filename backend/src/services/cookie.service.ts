import { Response } from "express";
import crypto from "crypto";

/**
 * Cookie Service for httpOnly authentication cookies
 * SEC-002: Migrate from localStorage JWT to httpOnly cookies
 */

const IS_PRODUCTION = process.env.NODE_ENV === "production";

// Cookie settings for maximum security
// Note: Using "lax" for sameSite to allow cookies on OAuth redirects
// (strict would block cookies when redirecting from localhost:3001 to localhost:3000)
// We still have CSRF protection via double-submit cookie pattern
const AUTH_COOKIE_OPTIONS = {
  httpOnly: true, // Prevents JavaScript access (XSS protection)
  secure: IS_PRODUCTION, // HTTPS only in production
  sameSite: (IS_PRODUCTION ? "none" : "lax") as "none" | "lax", // "none" required for cross-origin cookies (Vercel→Railway)
  maxAge: 24 * 60 * 60 * 1000, // 24 hours (matches JWT expiration)
  path: "/api", // Limit scope to API routes
};

// CSRF cookie - readable by JavaScript (for header submission)
const CSRF_COOKIE_OPTIONS = {
  httpOnly: false, // Must be readable by JavaScript
  secure: IS_PRODUCTION,
  sameSite: (IS_PRODUCTION ? "none" : "lax") as "none" | "lax", // "none" required for cross-origin cookies
  maxAge: 24 * 60 * 60 * 1000,
  path: "/",
};

export class CookieService {
  /**
   * Set authentication cookies after successful login
   * @param res - Express response object
   * @param token - JWT token
   * @param csrfToken - CSRF token
   */
  setAuthCookies(res: Response, token: string, csrfToken: string): void {
    // Set httpOnly auth token cookie
    res.cookie("auth_token", token, AUTH_COOKIE_OPTIONS);

    // Set CSRF token cookie (readable by JS for header submission)
    res.cookie("csrf_token", csrfToken, CSRF_COOKIE_OPTIONS);
  }

  /**
   * Clear authentication cookies on logout
   * @param res - Express response object
   */
  clearAuthCookies(res: Response): void {
    res.clearCookie("auth_token", { path: "/api" });
    res.clearCookie("csrf_token", { path: "/" });
  }

  /**
   * Generate a cryptographically secure CSRF token
   * @returns 32-byte hex string
   */
  generateCSRFToken(): string {
    return crypto.randomBytes(32).toString("hex");
  }

  /**
   * Validate CSRF token from cookie matches header
   * @param cookieToken - Token from csrf_token cookie
   * @param headerToken - Token from X-CSRF-Token header
   * @returns true if tokens match
   */
  validateCSRFToken(cookieToken: string | undefined, headerToken: string | undefined): boolean {
    if (!cookieToken || !headerToken) {
      return false;
    }

    // Use timing-safe comparison to prevent timing attacks
    try {
      return crypto.timingSafeEqual(
        Buffer.from(cookieToken),
        Buffer.from(headerToken)
      );
    } catch {
      // Buffers of different lengths will throw
      return false;
    }
  }
}

// Singleton instance
export const cookieService = new CookieService();
