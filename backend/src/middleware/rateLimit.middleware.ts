import { Request, Response, NextFunction } from "express";
import { Redis } from "ioredis";

// Initialize Redis connection
const redis = new Redis(process.env.REDIS_URL || "redis://localhost:6379");

export interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  max: number; // Maximum requests per window
  keyPrefix: string; // Redis key prefix
  message?: string; // Custom error message
  skipFailedRequests?: boolean; // Don't count failed requests
  skipSuccessfulRequests?: boolean; // Don't count successful requests
  keyGenerator?: (req: Request) => string; // Custom key generator
}

export interface RateLimitInfo {
  limit: number;
  current: number;
  remaining: number;
  resetTime: number;
}

/**
 * Create a sliding window rate limiter using Redis sorted sets
 * More accurate than fixed window approach
 */
export function createRateLimiter(config: RateLimitConfig) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Generate key (default: IP-based)
      const identifier = config.keyGenerator
        ? config.keyGenerator(req)
        : getClientIdentifier(req);

      const key = `${config.keyPrefix}:${identifier}`;
      const now = Date.now();
      const windowStart = now - config.windowMs;

      // Use Redis transaction for atomic operations
      const multi = redis.multi();

      // Remove entries outside the window
      multi.zremrangebyscore(key, 0, windowStart);

      // Count current entries in window
      multi.zcard(key);

      // Add current request timestamp
      multi.zadd(key, now, `${now}-${Math.random().toString(36).substring(7)}`);

      // Set TTL to clean up old keys
      multi.expire(key, Math.ceil(config.windowMs / 1000));

      const results = await multi.exec();

      if (!results) {
        // Redis error - fail open
        next();
        return;
      }

      const currentCount = (results[1]?.[1] as number) || 0;
      const remaining = Math.max(0, config.max - currentCount - 1);

      // Set rate limit headers
      res.set("X-RateLimit-Limit", config.max.toString());
      res.set("X-RateLimit-Remaining", remaining.toString());
      res.set("X-RateLimit-Reset", Math.ceil((now + config.windowMs) / 1000).toString());

      if (currentCount >= config.max) {
        // Rate limit exceeded
        const retryAfter = Math.ceil(config.windowMs / 1000);
        res.set("Retry-After", retryAfter.toString());

        res.status(429).json({
          success: false,
          error: config.message || "Too many requests, please try again later",
          code: "RATE_LIMIT_EXCEEDED",
          retryAfter,
          limit: config.max,
          windowMs: config.windowMs,
        });
        return;
      }

      next();
    } catch (error) {
      console.error("Rate limiter error:", error);
      // Fail open on Redis errors
      next();
    }
  };
}

/**
 * Create user-based rate limiter (requires auth middleware first)
 */
export function createUserRateLimiter(config: Omit<RateLimitConfig, "keyGenerator">) {
  return createRateLimiter({
    ...config,
    keyGenerator: (req: Request) => {
      // Use user ID if authenticated, fall back to IP
      const userId = (req as any).user?.userId;
      return userId || getClientIdentifier(req);
    },
  });
}

/**
 * Create wallet-based rate limiter
 */
export function createWalletRateLimiter(config: Omit<RateLimitConfig, "keyGenerator">) {
  return createRateLimiter({
    ...config,
    keyGenerator: (req: Request) => {
      const walletAddress = (req as any).user?.walletAddress;
      return walletAddress?.toLowerCase() || getClientIdentifier(req);
    },
  });
}

// ==================== Preset Rate Limiters ====================

/**
 * Standard API rate limit: 100 requests per minute
 */
export const standardApiLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 100,
  keyPrefix: "rl:api",
  message: "Too many API requests. Please slow down.",
});

/**
 * Auth endpoint rate limit: 5 requests per minute
 * Protects against brute force attacks
 */
export const authLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 5,
  keyPrefix: "rl:auth",
  message: "Too many authentication attempts. Please wait before trying again.",
});

/**
 * Registration rate limit: 3 registrations per hour
 */
export const registrationLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3,
  keyPrefix: "rl:register",
  message: "Too many registration attempts. Please try again later.",
});

/**
 * Relayer transaction rate limit: 10 transactions per minute
 */
export const relayerLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 10,
  keyPrefix: "rl:relayer",
  message: "Too many transaction requests. Please wait before submitting more.",
});

/**
 * Investment rate limit: 5 investments per minute per user
 */
export const investmentLimiter = createUserRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 5,
  keyPrefix: "rl:invest",
  message: "Too many investment requests. Please slow down.",
});

/**
 * Strict rate limit for sensitive operations: 3 per hour
 */
export const strictLimiter = createUserRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3,
  keyPrefix: "rl:strict",
  message: "Rate limit exceeded for this operation. Please try again later.",
});

// ==================== Helper Functions ====================

/**
 * Get client identifier for rate limiting
 * Prefers X-Forwarded-For header for proxied requests
 */
function getClientIdentifier(req: Request): string {
  // Check for forwarded IP (when behind proxy/load balancer)
  const forwarded = req.headers["x-forwarded-for"];
  if (forwarded) {
    // Take the first IP in the chain (original client)
    const ips = typeof forwarded === "string" ? forwarded.split(",") : forwarded;
    const clientIp = ips[0]?.trim();
    if (clientIp) return clientIp;
  }

  // Check for real IP header (nginx)
  const realIp = req.headers["x-real-ip"];
  if (realIp && typeof realIp === "string") {
    return realIp;
  }

  // Fall back to connection IP
  return req.ip || req.socket.remoteAddress || "unknown";
}

/**
 * Get current rate limit status for a key
 */
export async function getRateLimitStatus(
  keyPrefix: string,
  identifier: string,
  windowMs: number,
  max: number
): Promise<RateLimitInfo> {
  const key = `${keyPrefix}:${identifier}`;
  const now = Date.now();
  const windowStart = now - windowMs;

  // Clean and count
  await redis.zremrangebyscore(key, 0, windowStart);
  const current = await redis.zcard(key);

  return {
    limit: max,
    current,
    remaining: Math.max(0, max - current),
    resetTime: Math.ceil((now + windowMs) / 1000),
  };
}

/**
 * Manually reset rate limit for a user (admin function)
 */
export async function resetRateLimit(
  keyPrefix: string,
  identifier: string
): Promise<void> {
  const key = `${keyPrefix}:${identifier}`;
  await redis.del(key);
}

/**
 * Check if rate limit would be exceeded without counting
 */
export async function wouldExceedRateLimit(
  keyPrefix: string,
  identifier: string,
  windowMs: number,
  max: number
): Promise<boolean> {
  const status = await getRateLimitStatus(keyPrefix, identifier, windowMs, max);
  return status.remaining <= 0;
}
