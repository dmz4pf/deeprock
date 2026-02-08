# RWA Gateway Architecture Document
## Phase 4: Backend & Database Architecture

**Version:** 1.1
**Date:** February 5, 2026
**Status:** DRAFT
**Project:** RWA Gateway - Biometric Real-World Asset Tokenization on Avalanche

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Backend Architecture Overview](#2-backend-architecture-overview)
3. [API Design](#3-api-design)
4. [WebAuthn Ceremony Management](#4-webauthn-ceremony-management)
5. [OAuth Authentication (Google Sign-In)](#5-oauth-authentication-google-sign-in)
6. [Email Verification Service](#6-email-verification-service)
7. [Wallet Authentication](#7-wallet-authentication)
8. [Relayer Service Architecture](#8-relayer-service-architecture)
9. [Event Indexer Architecture](#9-event-indexer-architecture)
10. [Database Architecture](#10-database-architecture)
11. [Caching Strategy](#11-caching-strategy)
12. [Background Job Architecture](#12-background-job-architecture)
13. [Security Implementation](#13-security-implementation)
14. [Monitoring & Observability](#14-monitoring--observability)

---

## 1. Executive Summary

The RWA Gateway backend is a Node.js application built on Next.js API Routes with supporting services for blockchain interaction, event indexing, and background processing. The architecture prioritizes security through WebAuthn biometric authentication, scalability through Redis caching and BullMQ job processing, and reliability through PostgreSQL persistence with comprehensive audit logging.

**Key Design Decisions:**
- Monolithic API with modular service extraction points
- Relayer-based gasless transactions requiring biometric signatures
- Event-driven architecture for blockchain state synchronization
- Write-through caching for frequently accessed data
- Job queues for async operations with guaranteed delivery

---

## 2. Backend Architecture Overview

### 2.1 Service Architecture Diagram

```
                                    EXTERNAL TRAFFIC
                                          |
                                          v
                            +---------------------------+
                            |      Vercel Edge CDN      |
                            |   (Rate Limit + WAF)      |
                            +-------------+-------------+
                                          |
                                          v
+-------------------------------------------------------------------------+
|                           APPLICATION TIER                               |
|                                                                          |
|  +-------------------+  +-------------------+  +-------------------+     |
|  |   Next.js API     |  |   WebSocket       |  |   Static Assets   |     |
|  |   Routes          |  |   Server          |  |   (Next.js)       |     |
|  |                   |  |   (Socket.io)     |  |                   |     |
|  |  /api/auth/*      |  |                   |  |                   |     |
|  |  /api/pools/*     |  |  Real-time        |  |  /_next/static/*  |     |
|  |  /api/portfolio/* |  |  Updates          |  |                   |     |
|  |  /api/documents/* |  |                   |  |                   |     |
|  +--------+----------+  +--------+----------+  +-------------------+     |
|           |                      |                                       |
|           v                      v                                       |
|  +----------------------------------------------------------+           |
|  |                    SERVICE LAYER                          |           |
|  |                                                           |           |
|  |  +---------------+  +---------------+  +---------------+  |           |
|  |  | AuthService   |  | PoolService   |  | DocService    |  |           |
|  |  +---------------+  +---------------+  +---------------+  |           |
|  |  +---------------+  +---------------+  +---------------+  |           |
|  |  | RelayerSvc    |  | CredentialSvc |  | PortfolioSvc  |  |           |
|  |  +---------------+  +---------------+  +---------------+  |           |
|  +----------------------------------------------------------+           |
|                                                                          |
+-------------------------------------------------------------------------+
                    |                   |                   |
                    v                   v                   v
+-------------------------------------------------------------------------+
|                           DATA TIER                                      |
|                                                                          |
|  +-------------------+  +-------------------+  +-------------------+     |
|  |   PostgreSQL 16   |  |    Redis 7.x      |  |   Avalanche RPC   |     |
|  |                   |  |                   |  |                   |     |
|  |  - Users          |  |  - Sessions       |  |  - Contract State |     |
|  |  - Investments    |  |  - Challenges     |  |  - Events         |     |
|  |  - Credentials    |  |  - Rate Limits    |  |  - Transactions   |     |
|  |  - Documents      |  |  - Cache          |  |                   |     |
|  +-------------------+  +-------------------+  +-------------------+     |
|                                                                          |
+-------------------------------------------------------------------------+
                    |
                    v
+-------------------------------------------------------------------------+
|                        WORKER TIER                                       |
|                                                                          |
|  +-------------------+  +-------------------+  +-------------------+     |
|  |   Event Indexer   |  |   BullMQ Workers  |  |   Health Monitor  |     |
|  |                   |  |                   |  |                   |     |
|  |  - Subscribe to   |  |  - Yield Update   |  |  - DB Ping        |     |
|  |    chain events   |  |  - Pool Stats     |  |  - Redis Ping     |     |
|  |  - Index to DB    |  |  - Credential     |  |  - RPC Ping       |     |
|  |  - Handle reorgs  |  |    Expiry Check   |  |  - Alerting       |     |
|  +-------------------+  +-------------------+  +-------------------+     |
|                                                                          |
+-------------------------------------------------------------------------+
```

### 2.2 Request Flow Diagram

```
                    Client Request
                          |
                          v
+-------------------------------------------------------------------+
|                    1. INGRESS LAYER                                |
|  +-------------------------------------------------------------+  |
|  |  Vercel Edge Middleware                                      |  |
|  |  - CORS validation                                           |  |
|  |  - IP-based rate limiting (100 req/min)                     |  |
|  |  - Request ID injection (X-Request-ID)                      |  |
|  +-------------------------------------------------------------+  |
+-------------------------------------------------------------------+
                          |
                          v
+-------------------------------------------------------------------+
|                    2. API ROUTE LAYER                              |
|  +-------------------------------------------------------------+  |
|  |  Next.js API Route Handler                                   |  |
|  |  - Method validation (GET, POST, etc.)                      |  |
|  |  - Request body parsing                                      |  |
|  |  - Zod schema validation                                     |  |
|  +-------------------------------------------------------------+  |
+-------------------------------------------------------------------+
                          |
                          v
+-------------------------------------------------------------------+
|                    3. AUTHENTICATION LAYER                         |
|  +-------------------------------------------------------------+  |
|  |  JWT Middleware (authMiddleware)                             |  |
|  |  - Token extraction from Authorization header               |  |
|  |  - Token verification (HS256)                               |  |
|  |  - Session lookup in Redis                                  |  |
|  |  - User context injection (req.user)                        |  |
|  +-------------------------------------------------------------+  |
+-------------------------------------------------------------------+
                          |
                          v
+-------------------------------------------------------------------+
|                    4. AUTHORIZATION LAYER                          |
|  +-------------------------------------------------------------+  |
|  |  Role-based Access Control                                   |  |
|  |  - Route-level permission check                             |  |
|  |  - Resource ownership validation                            |  |
|  |  - Admin-only route enforcement                             |  |
|  +-------------------------------------------------------------+  |
+-------------------------------------------------------------------+
                          |
                          v
+-------------------------------------------------------------------+
|                    5. BUSINESS LOGIC LAYER                         |
|  +-------------------------------------------------------------+  |
|  |  Service Layer Invocation                                    |  |
|  |  - Database queries via Prisma                              |  |
|  |  - Cache reads/writes via Redis                             |  |
|  |  - Blockchain interactions via ethers.js                    |  |
|  |  - External API calls                                       |  |
|  +-------------------------------------------------------------+  |
+-------------------------------------------------------------------+
                          |
                          v
+-------------------------------------------------------------------+
|                    6. RESPONSE LAYER                               |
|  +-------------------------------------------------------------+  |
|  |  Response Formatting                                         |  |
|  |  - Success: { success: true, data: {...} }                  |  |
|  |  - Error: { success: false, error: {...} }                  |  |
|  |  - Structured logging (Pino)                                |  |
|  +-------------------------------------------------------------+  |
+-------------------------------------------------------------------+
```

### 2.3 Module Organization

```
/backend
  /src
    /api                    # API route handlers
      /auth
        register-options.ts
        register-verify.ts
        login-options.ts
        login-verify.ts
        logout.ts
        session.ts
      /credentials
        request.ts
        status.ts
        [address].ts
        simulate.ts
      /pools
        index.ts
        [id].ts
        [id]/invest.ts
        [id]/redeem.ts
        [id]/investors.ts
      /portfolio
        index.ts
        yield.ts
        transactions.ts
      /documents
        seal.ts
        verify/[hash].ts
        list.ts

    /services              # Business logic
      AuthService.ts
      CredentialService.ts
      PoolService.ts
      PortfolioService.ts
      DocumentService.ts
      RelayerService.ts
      IndexerService.ts

    /middleware            # Request processing
      auth.ts              # JWT validation
      rateLimit.ts         # Rate limiting
      validate.ts          # Zod validation wrapper
      errorHandler.ts      # Global error handling

    /lib                   # Shared utilities
      prisma.ts            # Prisma client singleton
      redis.ts             # Redis client
      ethers.ts            # Ethers provider + contracts
      logger.ts            # Pino logger
      constants.ts         # App constants

    /schemas               # Zod schemas
      auth.ts
      credentials.ts
      pools.ts
      documents.ts

    /jobs                  # BullMQ job processors
      indexEvents.ts
      updateYield.ts
      checkExpiredCredentials.ts
      syncPoolStats.ts
      cleanupSessions.ts
      healthCheck.ts

    /types                 # TypeScript definitions
      api.ts
      database.ts
      blockchain.ts
```

---

## 3. API Design

### 3.1 RESTful Conventions

| Principle | Implementation |
|-----------|----------------|
| **Resource Naming** | Plural nouns: `/pools`, `/credentials`, `/documents` |
| **HTTP Methods** | GET (read), POST (create), PUT (replace), PATCH (update), DELETE (remove) |
| **Status Codes** | 200 OK, 201 Created, 400 Bad Request, 401 Unauthorized, 403 Forbidden, 404 Not Found, 429 Too Many Requests, 500 Internal Error |
| **Versioning** | URL path: `/api/v1/...` (future), currently unversioned |
| **Pagination** | Query params: `?page=1&limit=20` |
| **Filtering** | Query params: `?status=active&asset_class=treasury` |
| **Sorting** | Query params: `?sort=created_at&order=desc` |

### 3.2 Request/Response Schemas (Zod)

```typescript
// /src/schemas/auth.ts
import { z } from 'zod';

// Registration Options Request
export const RegisterOptionsRequestSchema = z.object({
  email: z.string().email(),
  displayName: z.string().min(2).max(100),
});

// Registration Options Response
export const RegisterOptionsResponseSchema = z.object({
  success: z.literal(true),
  data: z.object({
    challenge: z.string(),
    rp: z.object({
      name: z.string(),
      id: z.string(),
    }),
    user: z.object({
      id: z.string(),
      name: z.string(),
      displayName: z.string(),
    }),
    pubKeyCredParams: z.array(z.object({
      type: z.literal('public-key'),
      alg: z.number(), // -7 for ES256 (P-256)
    })),
    authenticatorSelection: z.object({
      authenticatorAttachment: z.enum(['platform', 'cross-platform']).optional(),
      residentKey: z.enum(['required', 'preferred', 'discouraged']),
      userVerification: z.enum(['required', 'preferred', 'discouraged']),
    }),
    timeout: z.number(),
    attestation: z.enum(['none', 'indirect', 'direct', 'enterprise']),
  }),
});

// Registration Verify Request
export const RegisterVerifyRequestSchema = z.object({
  email: z.string().email(),
  attestation: z.object({
    id: z.string(),
    rawId: z.string(),
    response: z.object({
      clientDataJSON: z.string(),
      attestationObject: z.string(),
      transports: z.array(z.string()).optional(),
    }),
    type: z.literal('public-key'),
    clientExtensionResults: z.record(z.unknown()).optional(),
    authenticatorAttachment: z.string().optional(),
  }),
});

// Login Options Request
export const LoginOptionsRequestSchema = z.object({
  email: z.string().email(),
});

// Login Verify Request
export const LoginVerifyRequestSchema = z.object({
  email: z.string().email(),
  assertion: z.object({
    id: z.string(),
    rawId: z.string(),
    response: z.object({
      clientDataJSON: z.string(),
      authenticatorData: z.string(),
      signature: z.string(),
      userHandle: z.string().optional(),
    }),
    type: z.literal('public-key'),
    clientExtensionResults: z.record(z.unknown()).optional(),
  }),
});

// Session Response
export const SessionResponseSchema = z.object({
  success: z.literal(true),
  data: z.object({
    user: z.object({
      id: z.string().uuid(),
      walletAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
      email: z.string().email(),
      displayName: z.string(),
      hasCredential: z.boolean(),
      credentialTier: z.number().nullable(),
    }),
    expiresAt: z.string().datetime(),
  }),
});
```

```typescript
// /src/schemas/pools.ts
import { z } from 'zod';

export const PoolSchema = z.object({
  id: z.string().uuid(),
  chainPoolId: z.number().int().positive(),
  name: z.string(),
  description: z.string(),
  assetClass: z.enum(['treasury', 'real_estate', 'private_credit', 'commodities']),
  rwaTokenAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  yieldRateBps: z.number().int().min(0).max(10000), // basis points
  minInvestment: z.string(), // BigInt as string
  maxInvestment: z.string(),
  totalDeposited: z.string(),
  investorCount: z.number().int(),
  status: z.enum(['active', 'paused', 'closed']),
  createdAt: z.string().datetime(),
});

export const ListPoolsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  assetClass: z.enum(['treasury', 'real_estate', 'private_credit', 'commodities']).optional(),
  status: z.enum(['active', 'paused', 'closed']).optional(),
  sort: z.enum(['created_at', 'yield_rate_bps', 'total_deposited']).default('created_at'),
  order: z.enum(['asc', 'desc']).default('desc'),
});

export const InvestRequestSchema = z.object({
  amount: z.string().refine((val) => {
    try {
      const bn = BigInt(val);
      return bn > 0n;
    } catch {
      return false;
    }
  }, 'Amount must be a positive integer string'),
  biometricAssertion: z.object({
    authenticatorData: z.string(),
    clientDataJSON: z.string(),
    signature: z.string(),
  }),
});

export const RedeemRequestSchema = z.object({
  shares: z.string().refine((val) => {
    try {
      const bn = BigInt(val);
      return bn > 0n;
    } catch {
      return false;
    }
  }, 'Shares must be a positive integer string'),
  biometricAssertion: z.object({
    authenticatorData: z.string(),
    clientDataJSON: z.string(),
    signature: z.string(),
  }),
});
```

```typescript
// /src/schemas/credentials.ts
import { z } from 'zod';

export const CredentialRequestSchema = z.object({
  credentialType: z.enum(['accredited', 'qualified', 'institutional', 'retail_restricted']),
  jurisdiction: z.string().length(2).toUpperCase(), // ISO 3166-1 alpha-2
  documents: z.array(z.object({
    type: z.enum(['id', 'proof_of_income', 'accreditation_letter', 'entity_docs']),
    fileUrl: z.string().url(),
  })).min(1),
});

export const CredentialStatusResponseSchema = z.object({
  success: z.literal(true),
  data: z.object({
    credentialId: z.string().uuid().nullable(),
    status: z.enum(['none', 'pending', 'approved', 'rejected', 'expired']),
    credentialType: z.string().nullable(),
    jurisdiction: z.string().nullable(),
    tier: z.number().int().nullable(),
    issuedAt: z.string().datetime().nullable(),
    expiresAt: z.string().datetime().nullable(),
    rejectionReason: z.string().nullable(),
  }),
});

// Demo credential issuance (for hackathon)
export const SimulateCredentialRequestSchema = z.object({
  credentialType: z.enum(['accredited', 'qualified', 'institutional', 'retail_restricted']),
  jurisdiction: z.string().length(2).toUpperCase(),
  tier: z.number().int().min(1).max(3),
});
```

### 3.3 Error Response Format

```typescript
// /src/types/api.ts
export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
}

export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;           // Machine-readable: AUTH_INVALID_TOKEN
    message: string;        // Human-readable: "Authentication token is invalid"
    details?: unknown;      // Additional context (validation errors, etc.)
    requestId: string;      // X-Request-ID for debugging
    timestamp: string;      // ISO 8601
  };
}

// Error codes enum
export enum ErrorCode {
  // Authentication (AUTH_*)
  AUTH_MISSING_TOKEN = 'AUTH_MISSING_TOKEN',
  AUTH_INVALID_TOKEN = 'AUTH_INVALID_TOKEN',
  AUTH_EXPIRED_TOKEN = 'AUTH_EXPIRED_TOKEN',
  AUTH_INVALID_SIGNATURE = 'AUTH_INVALID_SIGNATURE',
  AUTH_CHALLENGE_EXPIRED = 'AUTH_CHALLENGE_EXPIRED',
  AUTH_USER_NOT_FOUND = 'AUTH_USER_NOT_FOUND',

  // Credentials (CRED_*)
  CRED_NOT_FOUND = 'CRED_NOT_FOUND',
  CRED_EXPIRED = 'CRED_EXPIRED',
  CRED_INSUFFICIENT = 'CRED_INSUFFICIENT',
  CRED_WRONG_JURISDICTION = 'CRED_WRONG_JURISDICTION',

  // Pools (POOL_*)
  POOL_NOT_FOUND = 'POOL_NOT_FOUND',
  POOL_PAUSED = 'POOL_PAUSED',
  POOL_CLOSED = 'POOL_CLOSED',
  POOL_MIN_NOT_MET = 'POOL_MIN_NOT_MET',
  POOL_MAX_EXCEEDED = 'POOL_MAX_EXCEEDED',

  // Transactions (TX_*)
  TX_FAILED = 'TX_FAILED',
  TX_REVERTED = 'TX_REVERTED',
  TX_TIMEOUT = 'TX_TIMEOUT',
  TX_INSUFFICIENT_BALANCE = 'TX_INSUFFICIENT_BALANCE',

  // Rate Limiting (RATE_*)
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',

  // Validation (VAL_*)
  VAL_INVALID_INPUT = 'VAL_INVALID_INPUT',

  // Internal (INT_*)
  INT_SERVER_ERROR = 'INT_SERVER_ERROR',
  INT_DATABASE_ERROR = 'INT_DATABASE_ERROR',
  INT_BLOCKCHAIN_ERROR = 'INT_BLOCKCHAIN_ERROR',
}
```

### 3.4 Authentication Flow

```
+------------------+     +------------------+     +------------------+
|     Client       |     |      API         |     |    Redis         |
+--------+---------+     +--------+---------+     +--------+---------+
         |                        |                        |
         | POST /auth/login-options                        |
         |----------------------->|                        |
         |                        |                        |
         |                        | Generate challenge     |
         |                        |----------------------->|
         |                        | SET challenge:{id} 5m  |
         |                        |<-----------------------|
         |                        |                        |
         |<-----------------------|                        |
         | { challenge, allowCredentials }                 |
         |                        |                        |
         | [User provides biometric]                       |
         |                        |                        |
         | POST /auth/login-verify                         |
         |----------------------->|                        |
         |                        |                        |
         |                        | GET challenge:{id}     |
         |                        |----------------------->|
         |                        |<-----------------------|
         |                        |                        |
         |                        | Verify WebAuthn assertion
         |                        | (SimpleWebAuthn)       |
         |                        |                        |
         |                        | Generate JWT token     |
         |                        | (24h expiry)           |
         |                        |                        |
         |                        | Store session          |
         |                        |----------------------->|
         |                        | SET session:{hash} 24h |
         |                        |<-----------------------|
         |                        |                        |
         |<-----------------------|                        |
         | { token, user, expiresAt }                      |
         |                        |                        |
         | [Subsequent requests with Authorization header] |
         |                        |                        |
         | GET /api/portfolio     |                        |
         | Authorization: Bearer {token}                   |
         |----------------------->|                        |
         |                        |                        |
         |                        | Verify JWT signature   |
         |                        |                        |
         |                        | GET session:{hash}     |
         |                        |----------------------->|
         |                        |<-----------------------|
         |                        | (session data)         |
         |                        |                        |
         |<-----------------------|                        |
         | { portfolio data }     |                        |
```

### 3.5 Rate Limiting Strategy

```typescript
// /src/middleware/rateLimit.ts
import { Redis } from 'ioredis';
import { NextResponse } from 'next/server';

interface RateLimitConfig {
  windowMs: number;      // Time window in milliseconds
  maxRequests: number;   // Max requests per window
  keyPrefix: string;     // Redis key prefix
}

const RATE_LIMITS: Record<string, RateLimitConfig> = {
  // Global rate limit
  'global': {
    windowMs: 60_000,    // 1 minute
    maxRequests: 100,
    keyPrefix: 'ratelimit:global',
  },

  // Authentication endpoints (stricter)
  'auth': {
    windowMs: 60_000,
    maxRequests: 10,
    keyPrefix: 'ratelimit:auth',
  },

  // WebAuthn challenge generation (very strict)
  'challenge': {
    windowMs: 60_000,
    maxRequests: 5,
    keyPrefix: 'ratelimit:challenge',
  },

  // Transaction endpoints (relayer rate limit)
  'transaction': {
    windowMs: 60_000,
    maxRequests: 10,      // 10 tx/min/user
    keyPrefix: 'ratelimit:tx',
  },

  // Hourly transaction limit
  'transaction_hourly': {
    windowMs: 3_600_000,  // 1 hour
    maxRequests: 100,     // 100 tx/hour/user
    keyPrefix: 'ratelimit:tx_hourly',
  },
};

export async function checkRateLimit(
  redis: Redis,
  key: string,
  config: RateLimitConfig
): Promise<{ allowed: boolean; remaining: number; resetAt: number }> {
  const fullKey = `${config.keyPrefix}:${key}`;
  const now = Date.now();
  const windowStart = now - config.windowMs;

  // Use Redis sorted set for sliding window
  const pipeline = redis.pipeline();

  // Remove old entries
  pipeline.zremrangebyscore(fullKey, 0, windowStart);

  // Count current entries
  pipeline.zcard(fullKey);

  // Add current request
  pipeline.zadd(fullKey, now, `${now}-${Math.random()}`);

  // Set expiry
  pipeline.pexpire(fullKey, config.windowMs);

  const results = await pipeline.exec();
  const currentCount = (results?.[1]?.[1] as number) || 0;

  const allowed = currentCount < config.maxRequests;
  const remaining = Math.max(0, config.maxRequests - currentCount - 1);
  const resetAt = now + config.windowMs;

  return { allowed, remaining, resetAt };
}
```

---

## 4. WebAuthn Ceremony Management

### 4.1 Registration Ceremony Detail

```typescript
// /src/services/AuthService.ts
import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  VerifiedRegistrationResponse,
} from '@simplewebauthn/server';
import { isoBase64URL } from '@simplewebauthn/server/helpers';

export class AuthService {
  private redis: Redis;
  private prisma: PrismaClient;

  private readonly RP_NAME = 'RWA Gateway';
  private readonly RP_ID = process.env.RP_ID || 'localhost';
  private readonly RP_ORIGIN = process.env.RP_ORIGIN || 'http://localhost:3000';

  // Challenge TTL: 5 minutes
  private readonly CHALLENGE_TTL = 5 * 60;

  async generateRegistrationOptions(email: string, displayName: string) {
    // Check if user already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
      include: { biometricIdentities: true },
    });

    if (existingUser?.biometricIdentities.length > 0) {
      throw new AppError(ErrorCode.AUTH_USER_EXISTS, 'User already registered');
    }

    // Generate user ID (will be stored after verification)
    const userId = crypto.randomUUID();
    const userIdBuffer = Buffer.from(userId.replace(/-/g, ''), 'hex');

    const options = await generateRegistrationOptions({
      rpName: this.RP_NAME,
      rpID: this.RP_ID,
      userID: userIdBuffer,
      userName: email,
      userDisplayName: displayName,

      // Prefer platform authenticators (Touch ID, Face ID, Windows Hello)
      authenticatorSelection: {
        authenticatorAttachment: 'platform',
        residentKey: 'preferred',
        userVerification: 'required',
      },

      // CRITICAL: Request ES256 (P-256) for ACP-204 compatibility
      supportedAlgorithmIDs: [-7], // ES256 only

      // Don't allow re-registration of existing credentials
      excludeCredentials: existingUser?.biometricIdentities.map((cred) => ({
        id: isoBase64URL.toBuffer(cred.credentialId),
        type: 'public-key',
        transports: cred.transports || [],
      })) || [],

      timeout: 120_000, // 2 minutes
      attestation: 'direct', // Request attestation for verification
    });

    // Store challenge in Redis
    const challengeData = {
      challenge: options.challenge,
      userId,
      email,
      displayName,
      createdAt: Date.now(),
    };

    await this.redis.setex(
      `webauthn:challenge:${options.challenge}`,
      this.CHALLENGE_TTL,
      JSON.stringify(challengeData)
    );

    return options;
  }

  async verifyRegistrationAndRegisterOnChain(
    email: string,
    attestation: RegistrationResponseJSON
  ): Promise<{ user: User; txHash: string }> {
    // Retrieve challenge data
    const challengeData = await this.redis.get(
      `webauthn:challenge:${attestation.response.clientDataJSON}`
    );

    // ... challenge decoding logic ...

    // Verify the attestation
    const verification = await verifyRegistrationResponse({
      response: attestation,
      expectedChallenge: storedChallenge.challenge,
      expectedOrigin: this.RP_ORIGIN,
      expectedRPID: this.RP_ID,
      requireUserVerification: true,
    });

    if (!verification.verified || !verification.registrationInfo) {
      throw new AppError(ErrorCode.AUTH_INVALID_SIGNATURE, 'Registration verification failed');
    }

    // Extract P-256 public key coordinates
    const { credentialPublicKey, credentialID, counter } = verification.registrationInfo;
    const { x, y } = this.extractP256Coordinates(credentialPublicKey);

    // Register on blockchain via relayer
    const txHash = await this.relayerService.registerBiometric(
      storedChallenge.userId,
      x,
      y
    );

    // Wait for transaction confirmation
    await this.waitForConfirmation(txHash, 2);

    // Create user and biometric identity in database
    const user = await this.prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          id: storedChallenge.userId,
          email,
          displayName: storedChallenge.displayName,
          walletAddress: this.deriveWalletAddress(x, y),
        },
      });

      await tx.biometricIdentity.create({
        data: {
          userId: newUser.id,
          credentialId: isoBase64URL.fromBuffer(credentialID),
          publicKeyX: x,
          publicKeyY: y,
          authCounter: counter,
          deviceInfo: attestation.response.transports?.join(',') || 'unknown',
          onChainTx: txHash,
        },
      });

      return newUser;
    });

    // Cleanup challenge
    await this.redis.del(`webauthn:challenge:${storedChallenge.challenge}`);

    return { user, txHash };
  }

  private extractP256Coordinates(credentialPublicKey: Uint8Array): { x: string; y: string } {
    // COSE key format parsing
    // For ES256 (P-256), the public key is in COSE_Key format
    // We need to extract the x and y coordinates (32 bytes each)

    const coseKey = cbor.decode(credentialPublicKey);

    // COSE_Key map indices for EC2:
    // -1: crv (1 = P-256)
    // -2: x coordinate
    // -3: y coordinate

    const x = coseKey.get(-2); // 32 bytes
    const y = coseKey.get(-3); // 32 bytes

    if (!x || !y || x.length !== 32 || y.length !== 32) {
      throw new AppError(ErrorCode.AUTH_INVALID_SIGNATURE, 'Invalid P-256 public key');
    }

    return {
      x: '0x' + Buffer.from(x).toString('hex'),
      y: '0x' + Buffer.from(y).toString('hex'),
    };
  }
}
```

### 4.2 Authentication Ceremony Detail

```typescript
async generateLoginOptions(email: string) {
  const user = await this.prisma.user.findUnique({
    where: { email },
    include: { biometricIdentities: true },
  });

  if (!user || user.biometricIdentities.length === 0) {
    throw new AppError(ErrorCode.AUTH_USER_NOT_FOUND, 'User not found or not registered');
  }

  const options = await generateAuthenticationOptions({
    rpID: this.RP_ID,
    userVerification: 'required',
    allowCredentials: user.biometricIdentities.map((cred) => ({
      id: isoBase64URL.toBuffer(cred.credentialId),
      type: 'public-key',
      transports: cred.deviceInfo?.split(',') as AuthenticatorTransport[] || [],
    })),
    timeout: 120_000,
  });

  // Store challenge
  await this.redis.setex(
    `webauthn:challenge:${options.challenge}`,
    this.CHALLENGE_TTL,
    JSON.stringify({
      challenge: options.challenge,
      userId: user.id,
      email,
      createdAt: Date.now(),
    })
  );

  return options;
}

async verifyLoginAndIssueToken(
  email: string,
  assertion: AuthenticationResponseJSON
): Promise<{ token: string; user: User; expiresAt: string }> {
  // Retrieve and validate challenge...

  const user = await this.prisma.user.findUnique({
    where: { email },
    include: { biometricIdentities: true },
  });

  const credential = user?.biometricIdentities.find(
    (c) => c.credentialId === assertion.id
  );

  if (!credential) {
    throw new AppError(ErrorCode.AUTH_INVALID_SIGNATURE, 'Credential not found');
  }

  // Verify the assertion
  const verification = await verifyAuthenticationResponse({
    response: assertion,
    expectedChallenge: storedChallenge.challenge,
    expectedOrigin: this.RP_ORIGIN,
    expectedRPID: this.RP_ID,
    authenticator: {
      credentialID: isoBase64URL.toBuffer(credential.credentialId),
      credentialPublicKey: this.reconstructPublicKey(
        credential.publicKeyX,
        credential.publicKeyY
      ),
      counter: credential.authCounter,
    },
    requireUserVerification: true,
  });

  if (!verification.verified) {
    throw new AppError(ErrorCode.AUTH_INVALID_SIGNATURE, 'Authentication verification failed');
  }

  // Update counter (replay protection)
  await this.prisma.biometricIdentity.update({
    where: { id: credential.id },
    data: { authCounter: verification.authenticationInfo.newCounter },
  });

  // Generate JWT
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
  const token = jwt.sign(
    {
      sub: user!.id,
      email: user!.email,
      walletAddress: user!.walletAddress,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(expiresAt.getTime() / 1000),
    },
    process.env.JWT_SECRET!,
    { algorithm: 'HS256' }
  );

  // Store session in Redis
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  await this.redis.setex(
    `session:${tokenHash}`,
    24 * 60 * 60, // 24 hours
    JSON.stringify({
      userId: user!.id,
      email: user!.email,
      createdAt: Date.now(),
      ipAddress: this.requestContext.ip,
      userAgent: this.requestContext.userAgent,
    })
  );

  // Cleanup challenge
  await this.redis.del(`webauthn:challenge:${storedChallenge.challenge}`);

  return {
    token,
    user: user!,
    expiresAt: expiresAt.toISOString(),
  };
}
```

---

## 5. OAuth Authentication (Google Sign-In)

### 5.1 Overview

RWA Gateway supports Google OAuth as an alternative authentication entry point. After successful Google authentication, users are prompted to register a biometric passkey, which links their Google account to on-chain identity.

**Authentication Flow:**
1. User clicks "Continue with Google"
2. Redirected to Google OAuth consent
3. Google returns authorization code
4. Backend exchanges code for tokens + profile
5. If new user → Create account + prompt biometric setup
6. If existing user → Check for linked biometric
7. Session issued after successful authentication

### 5.2 Google OAuth Configuration

```typescript
// /src/config/oauth.ts
export const googleOAuthConfig = {
  clientId: process.env.GOOGLE_CLIENT_ID!,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
  redirectUri: `${process.env.APP_URL}/api/auth/google/callback`,
  scopes: ['openid', 'email', 'profile'],
};
```

### 5.3 OAuth Service Implementation

```typescript
// /src/services/OAuthService.ts
import { OAuth2Client } from 'google-auth-library';

export class OAuthService {
  private googleClient: OAuth2Client;
  private prisma: PrismaClient;
  private redis: Redis;

  constructor(prisma: PrismaClient, redis: Redis) {
    this.prisma = prisma;
    this.redis = redis;
    this.googleClient = new OAuth2Client(
      googleOAuthConfig.clientId,
      googleOAuthConfig.clientSecret,
      googleOAuthConfig.redirectUri
    );
  }

  /**
   * Generate Google OAuth authorization URL
   */
  async getGoogleAuthUrl(): Promise<{ url: string; state: string }> {
    const state = crypto.randomUUID();

    // Store state for CSRF protection
    await this.redis.setex(
      `oauth:state:${state}`,
      600, // 10 minutes
      JSON.stringify({ createdAt: Date.now() })
    );

    const url = this.googleClient.generateAuthUrl({
      access_type: 'offline',
      scope: googleOAuthConfig.scopes,
      state,
      prompt: 'consent',
    });

    return { url, state };
  }

  /**
   * Handle Google OAuth callback
   */
  async handleGoogleCallback(
    code: string,
    state: string
  ): Promise<{
    user: User;
    isNewUser: boolean;
    hasBiometric: boolean;
    token?: string;
  }> {
    // Validate state (CSRF protection)
    const storedState = await this.redis.get(`oauth:state:${state}`);
    if (!storedState) {
      throw new AppError(ErrorCode.AUTH_INVALID_STATE, 'Invalid or expired state');
    }
    await this.redis.del(`oauth:state:${state}`);

    // Exchange code for tokens
    const { tokens } = await this.googleClient.getToken(code);
    this.googleClient.setCredentials(tokens);

    // Verify ID token and get user info
    const ticket = await this.googleClient.verifyIdToken({
      idToken: tokens.id_token!,
      audience: googleOAuthConfig.clientId,
    });

    const payload = ticket.getPayload();
    if (!payload || !payload.email) {
      throw new AppError(ErrorCode.AUTH_INVALID_TOKEN, 'Invalid Google token');
    }

    const { sub: googleId, email, name, picture } = payload;

    // Check if user exists (by Google ID or email)
    let user = await this.prisma.user.findFirst({
      where: {
        OR: [
          { googleId },
          { email },
        ],
      },
      include: { biometricIdentities: true },
    });

    let isNewUser = false;

    if (!user) {
      // Create new user with Google account
      user = await this.prisma.user.create({
        data: {
          email,
          displayName: name || email.split('@')[0],
          googleId,
          emailVerified: true, // Google accounts are pre-verified
          avatarUrl: picture,
          authProvider: 'GOOGLE',
        },
        include: { biometricIdentities: true },
      });
      isNewUser = true;
    } else if (!user.googleId) {
      // Link Google account to existing user
      user = await this.prisma.user.update({
        where: { id: user.id },
        data: {
          googleId,
          emailVerified: true,
          avatarUrl: user.avatarUrl || picture,
        },
        include: { biometricIdentities: true },
      });
    }

    const hasBiometric = user.biometricIdentities.length > 0;

    // If user has biometric, issue session token
    let token: string | undefined;
    if (hasBiometric) {
      token = await this.issueSessionToken(user);
    }

    return { user, isNewUser, hasBiometric, token };
  }

  private async issueSessionToken(user: User): Promise<string> {
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const token = jwt.sign(
      {
        sub: user.id,
        email: user.email,
        walletAddress: user.walletAddress,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(expiresAt.getTime() / 1000),
      },
      process.env.JWT_SECRET!,
      { algorithm: 'HS256' }
    );

    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    await this.redis.setex(
      `session:${tokenHash}`,
      24 * 60 * 60,
      JSON.stringify({ userId: user.id, email: user.email })
    );

    return token;
  }
}
```

### 5.4 Biometric Linking After OAuth

After Google OAuth success (for users without biometric), the frontend prompts biometric registration:

```typescript
// /src/services/AuthService.ts - Extended for OAuth linking

async linkBiometricToOAuthUser(
  userId: string,
  attestation: RegistrationResponseJSON
): Promise<{ txHash: string }> {
  const user = await this.prisma.user.findUnique({
    where: { id: userId },
    include: { biometricIdentities: true },
  });

  if (!user) {
    throw new AppError(ErrorCode.AUTH_USER_NOT_FOUND, 'User not found');
  }

  if (user.biometricIdentities.length > 0) {
    throw new AppError(ErrorCode.AUTH_ALREADY_REGISTERED, 'Biometric already registered');
  }

  // Verify the attestation and extract public key
  const verification = await verifyRegistrationResponse({
    response: attestation,
    expectedChallenge: await this.getStoredChallenge(userId),
    expectedOrigin: this.RP_ORIGIN,
    expectedRPID: this.RP_ID,
    requireUserVerification: true,
  });

  if (!verification.verified || !verification.registrationInfo) {
    throw new AppError(ErrorCode.AUTH_INVALID_SIGNATURE, 'Verification failed');
  }

  const { x, y } = this.extractP256Coordinates(
    verification.registrationInfo.credentialPublicKey
  );

  // Register on blockchain
  const txHash = await this.relayerService.registerBiometric(userId, x, y);
  await this.waitForConfirmation(txHash, 2);

  // Update user with wallet address and biometric identity
  await this.prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: userId },
      data: { walletAddress: this.deriveWalletAddress(x, y) },
    });

    await tx.biometricIdentity.create({
      data: {
        userId,
        credentialId: isoBase64URL.fromBuffer(
          verification.registrationInfo!.credentialID
        ),
        publicKeyX: x,
        publicKeyY: y,
        authCounter: verification.registrationInfo!.counter,
        onChainTx: txHash,
      },
    });
  });

  return { txHash };
}
```

### 5.5 OAuth API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/auth/google` | Initiate Google OAuth flow |
| GET | `/api/auth/google/callback` | Handle OAuth callback |
| POST | `/api/auth/link-biometric` | Link biometric to OAuth user |

---

## 6. Email Verification Service

### 6.1 Overview

New email registrations require verification before the account is fully activated. This prevents fake accounts and ensures users control the email address.

**Verification Flow:**
1. User submits email during registration
2. Backend generates 6-digit code + sends email
3. User enters code in frontend
4. Backend verifies code
5. If valid → Proceed with biometric registration
6. If invalid/expired → Allow resend

### 6.2 Verification Code Generation

```typescript
// /src/services/EmailVerificationService.ts
import { Resend } from 'resend';

export class EmailVerificationService {
  private resend: Resend;
  private redis: Redis;
  private prisma: PrismaClient;

  private readonly CODE_LENGTH = 6;
  private readonly CODE_TTL = 600; // 10 minutes
  private readonly MAX_ATTEMPTS = 5;
  private readonly RESEND_COOLDOWN = 60; // 1 minute between resends

  constructor(prisma: PrismaClient, redis: Redis) {
    this.prisma = prisma;
    this.redis = redis;
    this.resend = new Resend(process.env.RESEND_API_KEY);
  }

  /**
   * Generate and send verification code
   */
  async sendVerificationCode(email: string): Promise<{ sent: boolean; cooldownRemaining?: number }> {
    // Check cooldown
    const cooldownKey = `email:cooldown:${email}`;
    const cooldown = await this.redis.ttl(cooldownKey);
    if (cooldown > 0) {
      return { sent: false, cooldownRemaining: cooldown };
    }

    // Check if email already registered and verified
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
      select: { emailVerified: true },
    });

    if (existingUser?.emailVerified) {
      throw new AppError(ErrorCode.AUTH_EMAIL_EXISTS, 'Email already registered');
    }

    // Generate 6-digit code
    const code = this.generateCode();

    // Store code in Redis
    const codeKey = `email:verify:${email}`;
    await this.redis.setex(
      codeKey,
      this.CODE_TTL,
      JSON.stringify({
        code,
        attempts: 0,
        createdAt: Date.now(),
      })
    );

    // Set cooldown
    await this.redis.setex(cooldownKey, this.RESEND_COOLDOWN, '1');

    // Send email
    await this.resend.emails.send({
      from: 'RWA Gateway <noreply@rwagateway.io>',
      to: email,
      subject: 'Verify your email - RWA Gateway',
      html: this.getVerificationEmailTemplate(code),
    });

    return { sent: true };
  }

  /**
   * Verify the code
   */
  async verifyCode(email: string, code: string): Promise<{ verified: boolean; token?: string }> {
    const codeKey = `email:verify:${email}`;
    const stored = await this.redis.get(codeKey);

    if (!stored) {
      throw new AppError(ErrorCode.AUTH_CODE_EXPIRED, 'Verification code expired');
    }

    const data = JSON.parse(stored);

    // Check max attempts
    if (data.attempts >= this.MAX_ATTEMPTS) {
      await this.redis.del(codeKey);
      throw new AppError(ErrorCode.AUTH_MAX_ATTEMPTS, 'Too many failed attempts');
    }

    // Verify code
    if (data.code !== code) {
      data.attempts += 1;
      await this.redis.setex(codeKey, this.CODE_TTL, JSON.stringify(data));
      return { verified: false };
    }

    // Code valid - mark email as verified
    await this.redis.del(codeKey);

    // Create or update user with verified email
    let user = await this.prisma.user.findUnique({ where: { email } });

    if (!user) {
      // Create pending user (will complete registration with biometric)
      user = await this.prisma.user.create({
        data: {
          email,
          displayName: email.split('@')[0],
          emailVerified: true,
          authProvider: 'EMAIL',
        },
      });
    } else {
      await this.prisma.user.update({
        where: { email },
        data: { emailVerified: true },
      });
    }

    // Generate temporary token for biometric registration flow
    const tempToken = jwt.sign(
      { sub: user.id, email, purpose: 'biometric_registration' },
      process.env.JWT_SECRET!,
      { expiresIn: '30m' }
    );

    return { verified: true, token: tempToken };
  }

  private generateCode(): string {
    return Array.from({ length: this.CODE_LENGTH }, () =>
      Math.floor(Math.random() * 10)
    ).join('');
  }

  private getVerificationEmailTemplate(code: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
          .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
          .code { font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #1a1a1a;
                  background: #f4f4f4; padding: 20px; text-align: center; border-radius: 8px; }
          .footer { margin-top: 40px; font-size: 14px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>Verify your email</h1>
          <p>Enter this code to complete your RWA Gateway registration:</p>
          <div class="code">${code}</div>
          <p>This code expires in 10 minutes.</p>
          <p>If you didn't request this, please ignore this email.</p>
          <div class="footer">
            <p>RWA Gateway - Biometric RWA Tokenization on Avalanche</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }
}
```

### 6.3 Email Verification API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/email/send-code` | Send verification code |
| POST | `/api/auth/email/verify-code` | Verify code |
| POST | `/api/auth/email/resend-code` | Resend code (with cooldown) |

### 6.4 Request/Response Schemas

```typescript
// /src/schemas/email-verification.ts
import { z } from 'zod';

export const SendCodeRequestSchema = z.object({
  email: z.string().email(),
});

export const VerifyCodeRequestSchema = z.object({
  email: z.string().email(),
  code: z.string().length(6).regex(/^\d+$/),
});

export const SendCodeResponseSchema = z.object({
  success: z.boolean(),
  data: z.object({
    sent: z.boolean(),
    cooldownRemaining: z.number().optional(),
  }),
});

export const VerifyCodeResponseSchema = z.object({
  success: z.boolean(),
  data: z.object({
    verified: z.boolean(),
    token: z.string().optional(), // Temp token for biometric registration
  }),
});
```

---

## 7. Wallet Authentication

### 7.1 Overview

As a third authentication option, users can connect their existing Web3 wallet (MetaMask, Coinbase Wallet, etc.). This provides a familiar auth pattern for crypto-native users while still optionally linking to biometric for enhanced security.

**Wallet Auth Flow:**
1. User clicks "Connect Wallet"
2. Wallet prompts signature request (Sign-In with Ethereum / EIP-4361)
3. Backend verifies signature
4. If new wallet → Create account, optionally prompt biometric
5. If existing wallet → Issue session

### 7.2 SIWE (Sign-In with Ethereum) Integration

```typescript
// /src/services/WalletAuthService.ts
import { SiweMessage, generateNonce } from 'siwe';

export class WalletAuthService {
  private redis: Redis;
  private prisma: PrismaClient;

  private readonly NONCE_TTL = 300; // 5 minutes

  constructor(prisma: PrismaClient, redis: Redis) {
    this.prisma = prisma;
    this.redis = redis;
  }

  /**
   * Generate SIWE message for signing
   */
  async generateSiweMessage(address: string, chainId: number): Promise<{
    message: string;
    nonce: string;
  }> {
    const nonce = generateNonce();

    // Store nonce
    await this.redis.setex(
      `siwe:nonce:${address.toLowerCase()}`,
      this.NONCE_TTL,
      nonce
    );

    const message = new SiweMessage({
      domain: process.env.APP_DOMAIN || 'localhost',
      address,
      statement: 'Sign in to RWA Gateway',
      uri: process.env.APP_URL || 'http://localhost:3000',
      version: '1',
      chainId,
      nonce,
      issuedAt: new Date().toISOString(),
      expirationTime: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
    });

    return {
      message: message.prepareMessage(),
      nonce,
    };
  }

  /**
   * Verify SIWE signature and authenticate
   */
  async verifySiweSignature(
    message: string,
    signature: string
  ): Promise<{
    user: User;
    isNewUser: boolean;
    hasBiometric: boolean;
    token: string;
  }> {
    const siweMessage = new SiweMessage(message);

    // Verify nonce
    const storedNonce = await this.redis.get(
      `siwe:nonce:${siweMessage.address.toLowerCase()}`
    );

    if (!storedNonce || storedNonce !== siweMessage.nonce) {
      throw new AppError(ErrorCode.AUTH_INVALID_NONCE, 'Invalid or expired nonce');
    }

    // Verify signature
    try {
      await siweMessage.verify({ signature });
    } catch (error) {
      throw new AppError(ErrorCode.AUTH_INVALID_SIGNATURE, 'Invalid signature');
    }

    // Clear nonce
    await this.redis.del(`siwe:nonce:${siweMessage.address.toLowerCase()}`);

    const walletAddress = siweMessage.address.toLowerCase();

    // Find or create user
    let user = await this.prisma.user.findUnique({
      where: { walletAddress },
      include: { biometricIdentities: true },
    });

    let isNewUser = false;

    if (!user) {
      user = await this.prisma.user.create({
        data: {
          walletAddress,
          displayName: `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`,
          authProvider: 'WALLET',
        },
        include: { biometricIdentities: true },
      });
      isNewUser = true;
    }

    const hasBiometric = user.biometricIdentities.length > 0;

    // Issue session token
    const token = await this.issueSessionToken(user);

    return { user, isNewUser, hasBiometric, token };
  }

  private async issueSessionToken(user: User): Promise<string> {
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const token = jwt.sign(
      {
        sub: user.id,
        walletAddress: user.walletAddress,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(expiresAt.getTime() / 1000),
      },
      process.env.JWT_SECRET!,
      { algorithm: 'HS256' }
    );

    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    await this.redis.setex(
      `session:${tokenHash}`,
      24 * 60 * 60,
      JSON.stringify({ userId: user.id, walletAddress: user.walletAddress })
    );

    return token;
  }
}
```

### 7.3 Wallet Auth API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/wallet/message` | Generate SIWE message |
| POST | `/api/auth/wallet/verify` | Verify signature and authenticate |
| POST | `/api/auth/wallet/link-biometric` | Link biometric to wallet user |

### 7.4 Request/Response Schemas

```typescript
// /src/schemas/wallet-auth.ts
import { z } from 'zod';

export const GenerateMessageRequestSchema = z.object({
  address: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  chainId: z.number().int().positive(),
});

export const VerifySignatureRequestSchema = z.object({
  message: z.string(),
  signature: z.string(),
});

export const GenerateMessageResponseSchema = z.object({
  success: z.literal(true),
  data: z.object({
    message: z.string(),
    nonce: z.string(),
  }),
});

export const VerifySignatureResponseSchema = z.object({
  success: z.literal(true),
  data: z.object({
    token: z.string(),
    user: z.object({
      id: z.string().uuid(),
      walletAddress: z.string(),
      displayName: z.string(),
      hasBiometric: z.boolean(),
    }),
    isNewUser: z.boolean(),
  }),
});
```

---

## 8. Relayer Service Architecture

### 8.1 Transaction Preparation

```typescript
// /src/services/RelayerService.ts
import { ethers, Contract, Wallet, Provider } from 'ethers';

export class RelayerService {
  private wallet: Wallet;
  private provider: Provider;
  private contracts: {
    biometricRegistry: Contract;
    credentialVerifier: Contract;
    rwaGateway: Contract;
  };

  constructor() {
    this.provider = new ethers.JsonRpcProvider(process.env.AVALANCHE_RPC_URL);
    this.wallet = new Wallet(process.env.RELAYER_PRIVATE_KEY!, this.provider);

    this.contracts = {
      biometricRegistry: new Contract(
        process.env.BIOMETRIC_REGISTRY_ADDRESS!,
        BiometricRegistryABI,
        this.wallet
      ),
      credentialVerifier: new Contract(
        process.env.CREDENTIAL_VERIFIER_ADDRESS!,
        CredentialVerifierABI,
        this.wallet
      ),
      rwaGateway: new Contract(
        process.env.RWA_GATEWAY_ADDRESS!,
        RWAGatewayABI,
        this.wallet
      ),
    };
  }

  async prepareInvestTransaction(
    userId: string,
    poolId: number,
    amount: bigint,
    biometricSignature: BiometricSignature
  ): Promise<PreparedTransaction> {
    // 1. Fetch user's wallet address
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      include: { biometricIdentities: true },
    });

    // 2. Construct message hash (same as what client signed)
    const messageHash = ethers.solidityPackedKeccak256(
      ['uint256', 'uint256', 'address', 'uint256'],
      [poolId, amount, user.walletAddress, Date.now()]
    );

    // 3. Extract r, s from signature
    const { r, s } = this.parseSignature(biometricSignature.signature);

    // 4. Prepare transaction data
    const txData = this.contracts.rwaGateway.interface.encodeFunctionData(
      'investWithBiometric',
      [
        poolId,
        amount,
        messageHash,
        r,
        s,
        user.biometricIdentities[0].publicKeyX,
        user.biometricIdentities[0].publicKeyY,
      ]
    );

    return {
      to: process.env.RWA_GATEWAY_ADDRESS!,
      data: txData,
      userId,
      poolId,
      amount: amount.toString(),
    };
  }
}
```

### 5.2 Gas Estimation

```typescript
async estimateGas(preparedTx: PreparedTransaction): Promise<GasEstimate> {
  try {
    // Estimate gas with 20% buffer
    const gasEstimate = await this.provider.estimateGas({
      to: preparedTx.to,
      data: preparedTx.data,
      from: this.wallet.address,
    });

    const gasWithBuffer = (gasEstimate * 120n) / 100n;

    // Get current gas price
    const feeData = await this.provider.getFeeData();
    const gasPrice = feeData.gasPrice || ethers.parseUnits('25', 'gwei');

    // Calculate total cost
    const totalCost = gasWithBuffer * gasPrice;

    return {
      gasLimit: gasWithBuffer.toString(),
      gasPrice: gasPrice.toString(),
      estimatedCost: totalCost.toString(),
      estimatedCostUSD: this.calculateUSDCost(totalCost),
    };
  } catch (error) {
    // If estimation fails, transaction will likely revert
    throw new AppError(
      ErrorCode.TX_FAILED,
      `Gas estimation failed: ${error.message}`
    );
  }
}
```

### 5.3 Submission and Monitoring

```typescript
async submitTransaction(
  preparedTx: PreparedTransaction,
  gasEstimate: GasEstimate
): Promise<TransactionResult> {
  const txId = crypto.randomUUID();

  try {
    // Log transaction attempt
    this.logger.info({
      txId,
      userId: preparedTx.userId,
      action: 'submit_transaction',
      to: preparedTx.to,
    });

    // Submit transaction
    const tx = await this.wallet.sendTransaction({
      to: preparedTx.to,
      data: preparedTx.data,
      gasLimit: BigInt(gasEstimate.gasLimit),
      gasPrice: BigInt(gasEstimate.gasPrice),
      nonce: await this.getNonceWithLock(),
    });

    // Store pending transaction
    await this.storePendingTransaction(txId, tx.hash, preparedTx);

    // Wait for confirmation (2 blocks on Fuji, 12 on mainnet)
    const confirmations = process.env.NETWORK === 'mainnet' ? 12 : 2;
    const receipt = await tx.wait(confirmations);

    if (receipt?.status === 0) {
      throw new AppError(ErrorCode.TX_REVERTED, 'Transaction reverted');
    }

    // Update transaction status
    await this.updateTransactionStatus(txId, 'confirmed', receipt);

    return {
      txId,
      txHash: tx.hash,
      status: 'confirmed',
      blockNumber: receipt!.blockNumber,
      gasUsed: receipt!.gasUsed.toString(),
    };
  } catch (error) {
    await this.updateTransactionStatus(txId, 'failed', null, error.message);
    throw error;
  }
}

// Nonce management to prevent conflicts
private async getNonceWithLock(): Promise<number> {
  const lockKey = `relayer:nonce:lock`;
  const acquired = await this.redis.set(lockKey, '1', 'EX', 5, 'NX');

  if (!acquired) {
    // Wait and retry
    await new Promise((resolve) => setTimeout(resolve, 100));
    return this.getNonceWithLock();
  }

  try {
    const currentNonce = await this.wallet.getNonce();
    return currentNonce;
  } finally {
    await this.redis.del(lockKey);
  }
}
```

### 5.4 Rate Limiting Implementation

```typescript
// /src/services/RelayerService.ts
async checkRelayerRateLimits(userId: string): Promise<void> {
  // Check per-minute limit
  const minuteResult = await checkRateLimit(
    this.redis,
    userId,
    RATE_LIMITS.transaction
  );

  if (!minuteResult.allowed) {
    throw new AppError(
      ErrorCode.RATE_LIMIT_EXCEEDED,
      `Transaction rate limit exceeded. Try again in ${Math.ceil((minuteResult.resetAt - Date.now()) / 1000)} seconds.`
    );
  }

  // Check per-hour limit
  const hourResult = await checkRateLimit(
    this.redis,
    userId,
    RATE_LIMITS.transaction_hourly
  );

  if (!hourResult.allowed) {
    throw new AppError(
      ErrorCode.RATE_LIMIT_EXCEEDED,
      `Hourly transaction limit exceeded. Try again in ${Math.ceil((hourResult.resetAt - Date.now()) / 60000)} minutes.`
    );
  }
}
```

---

## 6. Event Indexer Architecture

### 6.1 Event Subscription

```typescript
// /src/services/IndexerService.ts
import { ethers, WebSocketProvider, Contract, Log } from 'ethers';

export class IndexerService {
  private wsProvider: WebSocketProvider;
  private contracts: Map<string, Contract> = new Map();
  private lastProcessedBlock: number = 0;

  // Events to index
  private readonly EVENTS = [
    {
      contract: 'BiometricRegistry',
      event: 'BiometricRegistered',
      handler: this.handleBiometricRegistered.bind(this),
    },
    {
      contract: 'CredentialVerifier',
      event: 'CredentialIssued',
      handler: this.handleCredentialIssued.bind(this),
    },
    {
      contract: 'RWAGateway',
      event: 'Investment',
      handler: this.handleInvestment.bind(this),
    },
    {
      contract: 'RWAGateway',
      event: 'Redemption',
      handler: this.handleRedemption.bind(this),
    },
    {
      contract: 'DocumentSeal',
      event: 'DocumentSealed',
      handler: this.handleDocumentSealed.bind(this),
    },
  ];

  async start(): Promise<void> {
    // Initialize WebSocket connection
    this.wsProvider = new WebSocketProvider(process.env.AVALANCHE_WS_URL!);

    // Load last processed block from database
    this.lastProcessedBlock = await this.getLastProcessedBlock();

    // Subscribe to each event
    for (const eventConfig of this.EVENTS) {
      const contract = this.getContract(eventConfig.contract);

      contract.on(eventConfig.event, async (...args) => {
        const event = args[args.length - 1] as Log;
        await this.processEvent(eventConfig, event, args.slice(0, -1));
      });

      this.logger.info({
        action: 'subscribed_to_event',
        contract: eventConfig.contract,
        event: eventConfig.event,
      });
    }

    // Handle WebSocket reconnection
    this.wsProvider.on('error', async (error) => {
      this.logger.error({ error }, 'WebSocket error');
      await this.reconnect();
    });
  }
}
```

### 6.2 Processing Pipeline

```typescript
private async processEvent(
  config: EventConfig,
  log: Log,
  args: unknown[]
): Promise<void> {
  const eventId = `${log.transactionHash}-${log.index}`;

  try {
    // Idempotency check
    const existing = await this.prisma.indexedEvent.findUnique({
      where: { eventId },
    });

    if (existing) {
      this.logger.debug({ eventId }, 'Event already processed, skipping');
      return;
    }

    // Wait for required confirmations
    const confirmations = process.env.NETWORK === 'mainnet' ? 12 : 2;
    await this.waitForConfirmations(log.blockNumber, confirmations);

    // Check for reorg
    const currentBlock = await this.wsProvider.getBlock(log.blockNumber);
    if (currentBlock?.hash !== log.blockHash) {
      this.logger.warn({ eventId, blockNumber: log.blockNumber }, 'Block reorg detected');
      return;
    }

    // Process within transaction
    await this.prisma.$transaction(async (tx) => {
      // Store indexed event record
      await tx.indexedEvent.create({
        data: {
          eventId,
          contractAddress: log.address,
          eventName: config.event,
          blockNumber: log.blockNumber,
          blockHash: log.blockHash,
          transactionHash: log.transactionHash,
          logIndex: log.index,
          processedAt: new Date(),
        },
      });

      // Call specific handler
      await config.handler(tx, log, args);
    });

    // Update last processed block
    if (log.blockNumber > this.lastProcessedBlock) {
      this.lastProcessedBlock = log.blockNumber;
      await this.updateLastProcessedBlock(log.blockNumber);
    }

    this.logger.info({
      eventId,
      event: config.event,
      blockNumber: log.blockNumber,
    }, 'Event processed successfully');

  } catch (error) {
    this.logger.error({ eventId, error }, 'Failed to process event');

    // Queue for retry
    await this.queueForRetry(eventId, config, log, args);
  }
}

// Individual event handlers
private async handleInvestment(
  tx: PrismaTransaction,
  log: Log,
  [investor, poolId, amount, shares]: [string, bigint, bigint, bigint]
): Promise<void> {
  // Find user by wallet address
  const user = await tx.user.findFirst({
    where: { walletAddress: investor.toLowerCase() },
  });

  if (!user) {
    this.logger.warn({ investor }, 'User not found for investment event');
    return;
  }

  // Create investment record
  await tx.investment.create({
    data: {
      userId: user.id,
      poolId: Number(poolId),
      amount: amount.toString(),
      shares: shares.toString(),
      type: 'invest',
      status: 'confirmed',
      txHash: log.transactionHash,
      blockNumber: log.blockNumber,
    },
  });

  // Update pool stats
  await tx.assetPool.update({
    where: { chainPoolId: Number(poolId) },
    data: {
      totalDeposited: { increment: amount.toString() },
      investorCount: { increment: 1 },
    },
  });

  // Invalidate cache
  await this.invalidateCache([
    `pool:stats:${poolId}`,
    `user:portfolio:${user.id}`,
  ]);
}
```

### 6.3 Reorg Handling

```typescript
async handleReorg(reorgDepth: number): Promise<void> {
  const safeBlock = this.lastProcessedBlock - reorgDepth;

  this.logger.warn({
    reorgDepth,
    lastProcessedBlock: this.lastProcessedBlock,
    safeBlock,
  }, 'Handling chain reorganization');

  // Find all events that might be affected
  const affectedEvents = await this.prisma.indexedEvent.findMany({
    where: {
      blockNumber: { gt: safeBlock },
    },
  });

  for (const event of affectedEvents) {
    // Check if block still exists with same hash
    const currentBlock = await this.wsProvider.getBlock(event.blockNumber);

    if (!currentBlock || currentBlock.hash !== event.blockHash) {
      // Event was on orphaned fork - mark for reprocessing
      await this.prisma.indexedEvent.update({
        where: { id: event.id },
        data: {
          reorged: true,
          reorgedAt: new Date(),
        },
      });

      // Revert associated data changes
      await this.revertEventEffects(event);
    }
  }

  // Reprocess from safe block
  await this.reindexFromBlock(safeBlock);
}

private async revertEventEffects(event: IndexedEvent): Promise<void> {
  switch (event.eventName) {
    case 'Investment':
      await this.revertInvestment(event);
      break;
    case 'Redemption':
      await this.revertRedemption(event);
      break;
    // ... other event reversions
  }
}
```

### 6.4 Failure Recovery

```typescript
// Startup recovery process
async recoverFromFailure(): Promise<void> {
  // 1. Get last processed block from database
  const lastBlock = await this.getLastProcessedBlock();

  // 2. Get current chain head
  const currentBlock = await this.wsProvider.getBlockNumber();

  // 3. Calculate gap
  const gap = currentBlock - lastBlock;

  if (gap > 0) {
    this.logger.info({
      lastBlock,
      currentBlock,
      gap,
    }, 'Recovering missed blocks');

    // 4. Fetch and process missed events
    for (const eventConfig of this.EVENTS) {
      const contract = this.getContract(eventConfig.contract);

      const filter = contract.filters[eventConfig.event]();
      const events = await contract.queryFilter(filter, lastBlock + 1, currentBlock);

      for (const event of events) {
        await this.processEvent(eventConfig, event, event.args);
      }
    }
  }

  // 5. Update last processed block
  await this.updateLastProcessedBlock(currentBlock);
}
```

---

## 7. Database Architecture

### 7.1 Complete ERD Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          DATABASE ENTITY RELATIONSHIPS                        │
└─────────────────────────────────────────────────────────────────────────────┘

+-------------------+       +----------------------+       +-------------------+
|      users        |       | biometric_identities |       |    credentials    |
+-------------------+       +----------------------+       +-------------------+
| id (PK)           |<──────| user_id (FK)         |       | id (PK)           |
| wallet_address    |       | id (PK)              |   ┌───| user_id (FK)      |
| email             |       | credential_id        |   │   | credential_type   |
| display_name      |       | public_key_x         |   │   | jurisdiction      |
| created_at        |       | public_key_y         |   │   | tier              |
| updated_at        |       | auth_counter         |   │   | issued_at         |
| is_active         |<──────| device_info          |   │   | expires_at        |
+-------------------+       | on_chain_tx          |   │   | issuer_address    |
        │                   | created_at           |   │   | status            |
        │                   +----------------------+   │   | encrypted_data    |
        │                                              │   | on_chain_tx       |
        │                                              │   +-------------------+
        │                                              │
        │           +----------------------+           │
        │           |    investments       |           │
        │           +----------------------+           │
        │           | id (PK)              |           │
        └───────────| user_id (FK)         |───────────┘
                    | pool_id (FK)         |───────────┐
                    | amount               |           │
                    | shares               |           │
                    | type                 |           │
                    | status               |           │
                    | tx_hash              |           │
                    | block_number         |           │
                    | created_at           |           │
                    +----------------------+           │
                                                       │
+-------------------+       +----------------------+   │
|   asset_pools     |       |      documents       |   │
+-------------------+       +----------------------+   │
| id (PK)           |<──────| pool_id (FK)?        |   │
| chain_pool_id     |       | id (PK)              |   │
| name              |<──────| document_hash        |───┘
| description       |       | title                |
| asset_class       |       | signer_id (FK)       |───┐
| rwa_token_address |       | sealed_at            |   │
| yield_rate_bps    |       | tx_hash              |   │
| min_investment    |       | metadata             |   │
| max_investment    |       +----------------------+   │
| total_deposited   |                                  │
| investor_count    |       +----------------------+   │
| status            |       |      sessions        |   │
| created_at        |       +----------------------+   │
+-------------------+       | id (PK)              |   │
                            | user_id (FK)         |───┘
                            | token_hash           |
+-------------------+       | expires_at           |
|  indexed_events   |       | ip_address           |
+-------------------+       | user_agent           |
| id (PK)           |       | created_at           |
| event_id          |       +----------------------+
| contract_address  |
| event_name        |
| block_number      |
| block_hash        |
| transaction_hash  |
| log_index         |
| processed_at      |
| reorged           |
| reorged_at        |
+-------------------+
```

### 7.2 Prisma Schema

```prisma
// /prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id                  String               @id @default(uuid())
  walletAddress       String?              @unique @map("wallet_address")
  email               String?              @unique
  displayName         String               @map("display_name")

  // OAuth & Email Verification
  googleId            String?              @unique @map("google_id")
  emailVerified       Boolean              @default(false) @map("email_verified")
  authProvider        AuthProvider         @default(EMAIL) @map("auth_provider")
  avatarUrl           String?              @map("avatar_url")

  createdAt           DateTime             @default(now()) @map("created_at")
  updatedAt           DateTime             @updatedAt @map("updated_at")
  isActive            Boolean              @default(true) @map("is_active")

  biometricIdentities BiometricIdentity[]
  credentials         Credential[]
  investments         Investment[]
  documents           Document[]           @relation("SignedDocuments")
  sessions            Session[]

  @@index([googleId])
  @@index([authProvider])
  @@map("users")
}

enum AuthProvider {
  EMAIL    // Email + biometric registration
  GOOGLE   // Google OAuth
  WALLET   // Web3 wallet (SIWE)

  @@map("auth_provider")
}

model BiometricIdentity {
  id           String   @id @default(uuid())
  userId       String   @map("user_id")
  credentialId String   @unique @map("credential_id")
  publicKeyX   String   @map("public_key_x")
  publicKeyY   String   @map("public_key_y")
  authCounter  Int      @map("auth_counter")
  deviceInfo   String?  @map("device_info")
  onChainTx    String?  @map("on_chain_tx")
  createdAt    DateTime @default(now()) @map("created_at")

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@map("biometric_identities")
}

model Credential {
  id              String           @id @default(uuid())
  userId          String           @map("user_id")
  credentialType  CredentialType   @map("credential_type")
  jurisdiction    String           // ISO 3166-1 alpha-2
  tier            Int              // 1-3
  issuedAt        DateTime         @map("issued_at")
  expiresAt       DateTime         @map("expires_at")
  issuerAddress   String           @map("issuer_address")
  status          CredentialStatus @default(PENDING)
  encryptedData   String?          @map("encrypted_data")
  onChainTx       String?          @map("on_chain_tx")
  createdAt       DateTime         @default(now()) @map("created_at")
  updatedAt       DateTime         @updatedAt @map("updated_at")

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([status])
  @@index([expiresAt])
  @@map("credentials")
}

enum CredentialType {
  ACCREDITED
  QUALIFIED
  INSTITUTIONAL
  RETAIL_RESTRICTED

  @@map("credential_type")
}

enum CredentialStatus {
  PENDING
  APPROVED
  REJECTED
  EXPIRED
  REVOKED

  @@map("credential_status")
}

model AssetPool {
  id              String      @id @default(uuid())
  chainPoolId     Int         @unique @map("chain_pool_id")
  name            String
  description     String
  assetClass      AssetClass  @map("asset_class")
  rwaTokenAddress String      @map("rwa_token_address")
  yieldRateBps    Int         @map("yield_rate_bps")
  minInvestment   String      @map("min_investment") // BigInt as string
  maxInvestment   String      @map("max_investment")
  totalDeposited  String      @default("0") @map("total_deposited")
  investorCount   Int         @default(0) @map("investor_count")
  status          PoolStatus  @default(ACTIVE)
  createdAt       DateTime    @default(now()) @map("created_at")
  updatedAt       DateTime    @updatedAt @map("updated_at")

  investments Investment[]

  @@index([status])
  @@index([assetClass])
  @@map("asset_pools")
}

enum AssetClass {
  TREASURY
  REAL_ESTATE
  PRIVATE_CREDIT
  COMMODITIES

  @@map("asset_class")
}

enum PoolStatus {
  ACTIVE
  PAUSED
  CLOSED

  @@map("pool_status")
}

model Investment {
  id          String           @id @default(uuid())
  userId      String           @map("user_id")
  poolId      String           @map("pool_id")
  amount      String           // BigInt as string
  shares      String           // BigInt as string
  type        InvestmentType
  status      InvestmentStatus @default(PENDING)
  txHash      String?          @map("tx_hash")
  blockNumber Int?             @map("block_number")
  createdAt   DateTime         @default(now()) @map("created_at")
  updatedAt   DateTime         @updatedAt @map("updated_at")

  user User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  pool AssetPool @relation(fields: [poolId], references: [id])

  @@index([userId])
  @@index([poolId])
  @@index([status])
  @@index([txHash])
  @@map("investments")
}

enum InvestmentType {
  INVEST
  REDEEM

  @@map("investment_type")
}

enum InvestmentStatus {
  PENDING
  CONFIRMED
  FAILED

  @@map("investment_status")
}

model Document {
  id           String   @id @default(uuid())
  documentHash String   @unique @map("document_hash")
  title        String
  signerId     String   @map("signer_id")
  sealedAt     DateTime @map("sealed_at")
  txHash       String   @map("tx_hash")
  metadata     Json?
  createdAt    DateTime @default(now()) @map("created_at")

  signer User @relation("SignedDocuments", fields: [signerId], references: [id])

  @@index([signerId])
  @@index([txHash])
  @@map("documents")
}

model Session {
  id         String   @id @default(uuid())
  userId     String   @map("user_id")
  tokenHash  String   @unique @map("token_hash")
  expiresAt  DateTime @map("expires_at")
  ipAddress  String?  @map("ip_address")
  userAgent  String?  @map("user_agent")
  createdAt  DateTime @default(now()) @map("created_at")

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([expiresAt])
  @@map("sessions")
}

model IndexedEvent {
  id              String    @id @default(uuid())
  eventId         String    @unique @map("event_id") // txHash-logIndex
  contractAddress String    @map("contract_address")
  eventName       String    @map("event_name")
  blockNumber     Int       @map("block_number")
  blockHash       String    @map("block_hash")
  transactionHash String    @map("transaction_hash")
  logIndex        Int       @map("log_index")
  processedAt     DateTime  @map("processed_at")
  reorged         Boolean   @default(false)
  reorgedAt       DateTime? @map("reorged_at")

  @@index([blockNumber])
  @@index([contractAddress, eventName])
  @@index([transactionHash])
  @@map("indexed_events")
}
```

### 7.3 Index Strategy

```sql
-- Performance-critical indexes beyond Prisma defaults

-- Users: Fast lookup by wallet address (blockchain queries)
CREATE INDEX CONCURRENTLY idx_users_wallet_lower
ON users (LOWER(wallet_address));

-- Credentials: Find expiring soon
CREATE INDEX CONCURRENTLY idx_credentials_expiring
ON credentials (expires_at)
WHERE status = 'APPROVED';

-- Investments: Portfolio aggregation
CREATE INDEX CONCURRENTLY idx_investments_portfolio
ON investments (user_id, pool_id, status)
WHERE status = 'CONFIRMED';

-- Asset Pools: Active pool listing
CREATE INDEX CONCURRENTLY idx_pools_active_listing
ON asset_pools (asset_class, yield_rate_bps DESC)
WHERE status = 'ACTIVE';

-- Sessions: Cleanup expired
CREATE INDEX CONCURRENTLY idx_sessions_expired
ON sessions (expires_at)
WHERE expires_at < NOW();

-- Indexed Events: Reorg detection
CREATE INDEX CONCURRENTLY idx_events_block_range
ON indexed_events (block_number DESC, contract_address);
```

### 7.4 Query Patterns

```typescript
// Common query patterns with Prisma

// 1. Get user portfolio with all investments
async function getUserPortfolio(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
    include: {
      investments: {
        where: { status: 'CONFIRMED' },
        include: { pool: true },
        orderBy: { createdAt: 'desc' },
      },
      credentials: {
        where: { status: 'APPROVED' },
        orderBy: { expiresAt: 'asc' },
        take: 1,
      },
    },
  });
}

// 2. List active pools with pagination
async function listActivePools(page: number, limit: number, assetClass?: string) {
  const where = {
    status: 'ACTIVE' as const,
    ...(assetClass && { assetClass: assetClass as AssetClass }),
  };

  const [pools, total] = await prisma.$transaction([
    prisma.assetPool.findMany({
      where,
      orderBy: { yieldRateBps: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.assetPool.count({ where }),
  ]);

  return { pools, total, page, limit, totalPages: Math.ceil(total / limit) };
}

// 3. Get investment history with cursor pagination
async function getInvestmentHistory(
  userId: string,
  cursor?: string,
  limit: number = 20
) {
  return prisma.investment.findMany({
    where: { userId },
    include: { pool: { select: { name: true, assetClass: true } } },
    orderBy: { createdAt: 'desc' },
    take: limit + 1, // Fetch one extra for hasMore
    ...(cursor && { cursor: { id: cursor }, skip: 1 }),
  });
}

// 4. Aggregate portfolio value
async function getPortfolioValue(userId: string) {
  const investments = await prisma.investment.groupBy({
    by: ['poolId'],
    where: {
      userId,
      status: 'CONFIRMED',
      type: 'INVEST',
    },
    _sum: { shares: true },
  });

  // Calculate total value based on current pool prices
  // (In production, join with pool data or use raw query)
  return investments;
}
```

---

## 8. Caching Strategy

### 8.1 Cache Key Design

```typescript
// /src/lib/cacheKeys.ts

export const CacheKeys = {
  // Session management
  session: (tokenHash: string) => `session:${tokenHash}`,

  // WebAuthn challenges (short TTL)
  webauthnChallenge: (id: string) => `webauthn:challenge:${id}`,

  // Pool data (moderate TTL)
  poolStats: (poolId: string | number) => `pool:stats:${poolId}`,
  poolList: (assetClass?: string) => `pool:list:${assetClass || 'all'}`,

  // User data (short TTL)
  userPortfolio: (userId: string) => `user:portfolio:${userId}`,
  userCredential: (userId: string) => `user:credential:${userId}`,

  // Rate limiting
  rateLimit: (ip: string, endpoint: string) => `ratelimit:${ip}:${endpoint}`,
  relayerRateLimit: (userId: string, window: string) =>
    `ratelimit:relayer:${userId}:${window}`,

  // Yield data (long TTL)
  yieldHistory: (poolId: string | number) => `yield:history:${poolId}`,

  // Relayer nonce lock
  relayerNonceLock: () => `relayer:nonce:lock`,

  // Indexer state
  indexerLastBlock: () => `indexer:last_block`,
};

export const CacheTTL = {
  session: 24 * 60 * 60,        // 24 hours
  webauthnChallenge: 5 * 60,    // 5 minutes
  poolStats: 15 * 60,           // 15 minutes
  poolList: 5 * 60,             // 5 minutes
  userPortfolio: 5 * 60,        // 5 minutes
  userCredential: 15 * 60,      // 15 minutes
  rateLimit: 60,                // 1 minute
  yieldHistory: 60 * 60,        // 1 hour
};
```

### 8.2 Invalidation Patterns

```typescript
// /src/lib/cache.ts
import { Redis } from 'ioredis';

export class CacheManager {
  constructor(private redis: Redis) {}

  // Pattern-based invalidation
  async invalidatePattern(pattern: string): Promise<number> {
    const keys = await this.redis.keys(pattern);
    if (keys.length === 0) return 0;
    return this.redis.del(...keys);
  }

  // Invalidate all user-related cache
  async invalidateUserCache(userId: string): Promise<void> {
    await Promise.all([
      this.redis.del(CacheKeys.userPortfolio(userId)),
      this.redis.del(CacheKeys.userCredential(userId)),
    ]);
  }

  // Invalidate pool cache after investment
  async invalidatePoolCache(poolId: string | number): Promise<void> {
    await Promise.all([
      this.redis.del(CacheKeys.poolStats(poolId)),
      this.invalidatePattern('pool:list:*'),
    ]);
  }

  // Atomic get-or-set with TTL
  async getOrSet<T>(
    key: string,
    ttl: number,
    fetchFn: () => Promise<T>
  ): Promise<T> {
    const cached = await this.redis.get(key);

    if (cached) {
      return JSON.parse(cached) as T;
    }

    const data = await fetchFn();
    await this.redis.setex(key, ttl, JSON.stringify(data));

    return data;
  }
}
```

### 8.3 Write-Through vs Write-Behind

```typescript
// Write-through: Update cache immediately after database write
async function investWithWriteThrough(
  userId: string,
  poolId: string,
  amount: bigint
): Promise<Investment> {
  // 1. Write to database
  const investment = await prisma.investment.create({
    data: { userId, poolId, amount: amount.toString(), /* ... */ },
  });

  // 2. Immediately invalidate/update cache (write-through)
  await cache.invalidateUserCache(userId);
  await cache.invalidatePoolCache(poolId);

  return investment;
}

// Write-behind: Queue cache update for background processing
async function updatePoolStatsWithWriteBehind(
  poolId: string
): Promise<void> {
  // 1. Enqueue background job
  await poolStatsQueue.add('updatePoolStats', { poolId }, {
    delay: 1000, // 1 second delay to batch updates
    removeOnComplete: true,
  });

  // 2. Mark cache as stale (optional)
  await cache.redis.set(
    `${CacheKeys.poolStats(poolId)}:stale`,
    '1',
    'EX',
    60
  );
}

// For RWA Gateway, use write-through for:
// - Session data (immediate consistency required)
// - User portfolio (users expect instant updates)
// - Investment records (compliance audit trail)

// Use write-behind for:
// - Pool aggregate stats (can tolerate brief staleness)
// - Yield history (background calculation)
// - Analytics data
```

---

## 9. Background Job Architecture

### 9.1 Job Definitions

```typescript
// /src/jobs/types.ts

export interface JobDefinition {
  name: string;
  schedule?: string;        // Cron expression for scheduled jobs
  concurrency: number;      // Max concurrent workers
  retries: number;          // Max retry attempts
  backoff: {
    type: 'fixed' | 'exponential';
    delay: number;          // Base delay in ms
  };
  timeout: number;          // Job timeout in ms
}

export const JOB_DEFINITIONS: Record<string, JobDefinition> = {
  indexEvents: {
    name: 'indexEvents',
    // No schedule - continuous worker
    concurrency: 1,         // Single worker to maintain order
    retries: 5,
    backoff: { type: 'exponential', delay: 1000 },
    timeout: 30_000,
  },

  updateYield: {
    name: 'updateYield',
    schedule: '0 * * * *',  // Every hour at :00
    concurrency: 2,
    retries: 3,
    backoff: { type: 'fixed', delay: 5000 },
    timeout: 120_000,       // 2 minutes
  },

  checkExpiredCredentials: {
    name: 'checkExpiredCredentials',
    schedule: '0 */6 * * *', // Every 6 hours
    concurrency: 1,
    retries: 3,
    backoff: { type: 'fixed', delay: 10000 },
    timeout: 300_000,       // 5 minutes
  },

  syncPoolStats: {
    name: 'syncPoolStats',
    schedule: '*/15 * * * *', // Every 15 minutes
    concurrency: 3,
    retries: 3,
    backoff: { type: 'fixed', delay: 5000 },
    timeout: 60_000,
  },

  cleanupSessions: {
    name: 'cleanupSessions',
    schedule: '0 3 * * *',   // Daily at 3 AM
    concurrency: 1,
    retries: 2,
    backoff: { type: 'fixed', delay: 30000 },
    timeout: 600_000,       // 10 minutes
  },

  healthCheck: {
    name: 'healthCheck',
    schedule: '*/5 * * * *', // Every 5 minutes
    concurrency: 1,
    retries: 1,
    backoff: { type: 'fixed', delay: 1000 },
    timeout: 30_000,
  },
};
```

### 9.2 Queue Configuration

```typescript
// /src/jobs/queues.ts
import { Queue, Worker, QueueScheduler } from 'bullmq';
import { Redis } from 'ioredis';

const connection = new Redis(process.env.REDIS_URL!, {
  maxRetriesPerRequest: null, // Required for BullMQ
});

// Create queues
export const queues = {
  indexEvents: new Queue('indexEvents', { connection }),
  updateYield: new Queue('updateYield', { connection }),
  checkExpiredCredentials: new Queue('checkExpiredCredentials', { connection }),
  syncPoolStats: new Queue('syncPoolStats', { connection }),
  cleanupSessions: new Queue('cleanupSessions', { connection }),
  healthCheck: new Queue('healthCheck', { connection }),
};

// Queue schedulers (required for delayed jobs and rate limiting)
export const schedulers = Object.keys(queues).map(
  (name) => new QueueScheduler(name, { connection })
);

// Schedule recurring jobs
export async function scheduleRecurringJobs(): Promise<void> {
  for (const [name, definition] of Object.entries(JOB_DEFINITIONS)) {
    if (definition.schedule) {
      const queue = queues[name as keyof typeof queues];

      // Remove existing repeatable jobs
      const existingJobs = await queue.getRepeatableJobs();
      for (const job of existingJobs) {
        await queue.removeRepeatableByKey(job.key);
      }

      // Add new repeatable job
      await queue.add(
        name,
        {},
        {
          repeat: { pattern: definition.schedule },
          removeOnComplete: 100,  // Keep last 100 completed
          removeOnFail: 1000,     // Keep last 1000 failed
        }
      );

      console.log(`Scheduled job: ${name} with cron: ${definition.schedule}`);
    }
  }
}
```

### 9.3 Job Processors

```typescript
// /src/jobs/processors/updateYield.ts
import { Job } from 'bullmq';

export async function processUpdateYield(job: Job): Promise<void> {
  const logger = job.log.bind(job);

  logger('Starting yield update job');

  // Get all active pools
  const pools = await prisma.assetPool.findMany({
    where: { status: 'ACTIVE' },
  });

  for (const pool of pools) {
    try {
      // Fetch current yield data from blockchain
      const onChainYield = await rwaGatewayContract.getPoolYield(pool.chainPoolId);

      // Calculate accumulated yield since last update
      const lastYieldRecord = await prisma.yieldHistory.findFirst({
        where: { poolId: pool.id },
        orderBy: { recordedAt: 'desc' },
      });

      const yieldSinceLastUpdate = calculateYieldDelta(
        lastYieldRecord,
        onChainYield
      );

      // Store yield history
      await prisma.yieldHistory.create({
        data: {
          poolId: pool.id,
          yieldAmount: yieldSinceLastUpdate.toString(),
          cumulativeYield: onChainYield.toString(),
          recordedAt: new Date(),
        },
      });

      // Update cache
      await cache.redis.setex(
        CacheKeys.yieldHistory(pool.id),
        CacheTTL.yieldHistory,
        JSON.stringify({
          currentYield: onChainYield.toString(),
          lastUpdated: new Date().toISOString(),
        })
      );

      logger(`Updated yield for pool ${pool.name}: ${yieldSinceLastUpdate}`);

    } catch (error) {
      logger(`Failed to update yield for pool ${pool.id}: ${error.message}`);
      // Continue with other pools
    }
  }

  logger('Yield update job completed');
}
```

### 9.4 Monitoring

```typescript
// /src/jobs/monitor.ts
import { Queue, QueueEvents } from 'bullmq';

export function setupQueueMonitoring(queue: Queue): void {
  const events = new QueueEvents(queue.name, { connection: queue.opts.connection });

  events.on('completed', ({ jobId, returnvalue }) => {
    logger.info({
      queue: queue.name,
      jobId,
      status: 'completed',
      result: returnvalue,
    });
  });

  events.on('failed', ({ jobId, failedReason }) => {
    logger.error({
      queue: queue.name,
      jobId,
      status: 'failed',
      reason: failedReason,
    });

    // Alert if critical job fails
    if (['indexEvents', 'healthCheck'].includes(queue.name)) {
      alertService.sendAlert({
        severity: 'high',
        message: `Critical job ${queue.name} failed: ${failedReason}`,
      });
    }
  });

  events.on('stalled', ({ jobId }) => {
    logger.warn({
      queue: queue.name,
      jobId,
      status: 'stalled',
    });
  });
}

// Queue metrics for monitoring dashboard
export async function getQueueMetrics(queue: Queue) {
  const [waiting, active, completed, failed, delayed] = await Promise.all([
    queue.getWaitingCount(),
    queue.getActiveCount(),
    queue.getCompletedCount(),
    queue.getFailedCount(),
    queue.getDelayedCount(),
  ]);

  return {
    name: queue.name,
    waiting,
    active,
    completed,
    failed,
    delayed,
    timestamp: new Date().toISOString(),
  };
}
```

---

## 10. Security Implementation

### 10.1 Input Validation

```typescript
// /src/middleware/validate.ts
import { z, ZodSchema } from 'zod';
import { NextRequest, NextResponse } from 'next/server';

export function validateRequest<T>(schema: ZodSchema<T>) {
  return async (req: NextRequest): Promise<T> => {
    const body = await req.json();

    const result = schema.safeParse(body);

    if (!result.success) {
      const errors = result.error.issues.map((issue) => ({
        path: issue.path.join('.'),
        message: issue.message,
      }));

      throw new ValidationError(errors);
    }

    return result.data;
  };
}

// Sanitization utilities
export const sanitize = {
  // Prevent SQL injection (though Prisma handles this)
  string: (input: string): string => {
    return input.replace(/[<>'"]/g, '');
  },

  // Ethereum address validation
  address: (input: string): string => {
    if (!/^0x[a-fA-F0-9]{40}$/.test(input)) {
      throw new ValidationError([{ path: 'address', message: 'Invalid Ethereum address' }]);
    }
    return input.toLowerCase();
  },

  // BigInt string validation
  bigint: (input: string): bigint => {
    try {
      const value = BigInt(input);
      if (value < 0n) throw new Error('Negative value');
      return value;
    } catch {
      throw new ValidationError([{ path: 'amount', message: 'Invalid numeric value' }]);
    }
  },
};
```

### 10.2 Authentication Middleware

```typescript
// /src/middleware/auth.ts
import { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';

export interface AuthenticatedRequest extends NextRequest {
  user: {
    id: string;
    email: string;
    walletAddress: string;
  };
}

export async function authMiddleware(
  req: NextRequest
): Promise<AuthenticatedRequest> {
  // Extract token from Authorization header
  const authHeader = req.headers.get('authorization');

  if (!authHeader?.startsWith('Bearer ')) {
    throw new AuthError(ErrorCode.AUTH_MISSING_TOKEN, 'Missing authorization header');
  }

  const token = authHeader.slice(7);

  // Verify JWT signature
  let payload: jwt.JwtPayload;
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET!) as jwt.JwtPayload;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new AuthError(ErrorCode.AUTH_EXPIRED_TOKEN, 'Token has expired');
    }
    throw new AuthError(ErrorCode.AUTH_INVALID_TOKEN, 'Invalid token');
  }

  // Verify session exists in Redis
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  const sessionData = await redis.get(`session:${tokenHash}`);

  if (!sessionData) {
    throw new AuthError(ErrorCode.AUTH_INVALID_TOKEN, 'Session not found or expired');
  }

  // Attach user to request
  (req as AuthenticatedRequest).user = {
    id: payload.sub!,
    email: payload.email as string,
    walletAddress: payload.walletAddress as string,
  };

  return req as AuthenticatedRequest;
}
```

### 10.3 Authorization Checks

```typescript
// /src/middleware/authorize.ts

export enum Permission {
  INVEST = 'invest',
  REDEEM = 'redeem',
  VIEW_PORTFOLIO = 'view_portfolio',
  SEAL_DOCUMENT = 'seal_document',
  ADMIN_VIEW_INVESTORS = 'admin_view_investors',
  ADMIN_PAUSE_POOL = 'admin_pause_pool',
}

// Role-permission mapping
const ROLE_PERMISSIONS: Record<string, Permission[]> = {
  user: [
    Permission.INVEST,
    Permission.REDEEM,
    Permission.VIEW_PORTFOLIO,
    Permission.SEAL_DOCUMENT,
  ],
  admin: [
    // All user permissions
    Permission.INVEST,
    Permission.REDEEM,
    Permission.VIEW_PORTFOLIO,
    Permission.SEAL_DOCUMENT,
    // Admin-only
    Permission.ADMIN_VIEW_INVESTORS,
    Permission.ADMIN_PAUSE_POOL,
  ],
};

export async function authorize(
  req: AuthenticatedRequest,
  requiredPermission: Permission
): Promise<void> {
  // Get user role from database
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: { role: true, isActive: true },
  });

  if (!user || !user.isActive) {
    throw new AuthError(ErrorCode.AUTH_USER_NOT_FOUND, 'User not found or inactive');
  }

  const userPermissions = ROLE_PERMISSIONS[user.role] || [];

  if (!userPermissions.includes(requiredPermission)) {
    throw new AuthError(
      ErrorCode.AUTH_FORBIDDEN,
      `Permission denied: ${requiredPermission}`
    );
  }
}

// Resource ownership check
export async function authorizeResourceOwner(
  req: AuthenticatedRequest,
  resourceType: 'investment' | 'document' | 'credential',
  resourceId: string
): Promise<void> {
  const ownershipChecks = {
    investment: async () => {
      const investment = await prisma.investment.findUnique({
        where: { id: resourceId },
        select: { userId: true },
      });
      return investment?.userId === req.user.id;
    },
    document: async () => {
      const document = await prisma.document.findUnique({
        where: { id: resourceId },
        select: { signerId: true },
      });
      return document?.signerId === req.user.id;
    },
    credential: async () => {
      const credential = await prisma.credential.findUnique({
        where: { id: resourceId },
        select: { userId: true },
      });
      return credential?.userId === req.user.id;
    },
  };

  const isOwner = await ownershipChecks[resourceType]();

  if (!isOwner) {
    throw new AuthError(ErrorCode.AUTH_FORBIDDEN, 'Access denied to this resource');
  }
}
```

### 10.4 Audit Logging

```typescript
// /src/lib/auditLog.ts
import { prisma } from './prisma';

export enum AuditAction {
  // Authentication
  AUTH_REGISTER = 'auth.register',
  AUTH_LOGIN = 'auth.login',
  AUTH_LOGOUT = 'auth.logout',
  AUTH_FAILED = 'auth.failed',

  // Credentials
  CRED_REQUEST = 'credential.request',
  CRED_ISSUED = 'credential.issued',
  CRED_REJECTED = 'credential.rejected',

  // Investments
  INVEST_INITIATED = 'investment.initiated',
  INVEST_CONFIRMED = 'investment.confirmed',
  INVEST_FAILED = 'investment.failed',
  REDEEM_INITIATED = 'redemption.initiated',
  REDEEM_CONFIRMED = 'redemption.confirmed',

  // Documents
  DOC_SEALED = 'document.sealed',
  DOC_VERIFIED = 'document.verified',

  // Admin
  ADMIN_POOL_PAUSE = 'admin.pool.pause',
  ADMIN_POOL_UNPAUSE = 'admin.pool.unpause',
}

export interface AuditLogEntry {
  action: AuditAction;
  userId?: string;
  resourceType?: string;
  resourceId?: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  status: 'success' | 'failure';
  errorMessage?: string;
}

export async function auditLog(entry: AuditLogEntry): Promise<void> {
  await prisma.auditLog.create({
    data: {
      action: entry.action,
      userId: entry.userId,
      resourceType: entry.resourceType,
      resourceId: entry.resourceId,
      metadata: entry.metadata || {},
      ipAddress: entry.ipAddress,
      userAgent: entry.userAgent,
      status: entry.status,
      errorMessage: entry.errorMessage,
      timestamp: new Date(),
    },
  });

  // Also log to Pino for real-time monitoring
  if (entry.status === 'failure') {
    logger.warn({ audit: entry }, `Audit: ${entry.action} failed`);
  } else {
    logger.info({ audit: entry }, `Audit: ${entry.action}`);
  }
}

// Middleware wrapper for automatic audit logging
export function withAuditLog(
  action: AuditAction,
  handler: (req: AuthenticatedRequest) => Promise<NextResponse>
) {
  return async (req: AuthenticatedRequest): Promise<NextResponse> => {
    const startTime = Date.now();

    try {
      const response = await handler(req);

      await auditLog({
        action,
        userId: req.user?.id,
        ipAddress: req.headers.get('x-forwarded-for') || req.ip,
        userAgent: req.headers.get('user-agent') || undefined,
        status: 'success',
        metadata: { durationMs: Date.now() - startTime },
      });

      return response;
    } catch (error) {
      await auditLog({
        action,
        userId: req.user?.id,
        ipAddress: req.headers.get('x-forwarded-for') || req.ip,
        userAgent: req.headers.get('user-agent') || undefined,
        status: 'failure',
        errorMessage: error.message,
        metadata: { durationMs: Date.now() - startTime },
      });

      throw error;
    }
  };
}
```

---

## 11. Monitoring & Observability

### 11.1 Logging Strategy

```typescript
// /src/lib/logger.ts
import pino from 'pino';

export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',

  // JSON output for production, pretty for development
  transport: process.env.NODE_ENV === 'development'
    ? { target: 'pino-pretty', options: { colorize: true } }
    : undefined,

  // Standard fields
  base: {
    env: process.env.NODE_ENV,
    service: 'rwa-gateway',
    version: process.env.npm_package_version,
  },

  // Timestamp format
  timestamp: pino.stdTimeFunctions.isoTime,

  // Redact sensitive fields
  redact: {
    paths: [
      'req.headers.authorization',
      'req.headers.cookie',
      '*.password',
      '*.token',
      '*.privateKey',
      '*.secret',
    ],
    censor: '[REDACTED]',
  },

  // Serializers for common objects
  serializers: {
    req: (req) => ({
      method: req.method,
      url: req.url,
      path: req.path,
      parameters: req.params,
      query: req.query,
      headers: {
        'user-agent': req.headers['user-agent'],
        'x-request-id': req.headers['x-request-id'],
      },
    }),
    res: (res) => ({
      statusCode: res.statusCode,
    }),
    err: pino.stdSerializers.err,
  },
});

// Child loggers for different modules
export const createModuleLogger = (module: string) =>
  logger.child({ module });

export const loggers = {
  api: createModuleLogger('api'),
  relayer: createModuleLogger('relayer'),
  indexer: createModuleLogger('indexer'),
  jobs: createModuleLogger('jobs'),
  cache: createModuleLogger('cache'),
  db: createModuleLogger('database'),
};
```

### 11.2 Metrics Collection

```typescript
// /src/lib/metrics.ts

// Custom metrics for monitoring dashboard
export interface Metrics {
  // API metrics
  api: {
    requestCount: number;
    errorCount: number;
    latencyP50: number;
    latencyP95: number;
    latencyP99: number;
  };

  // Relayer metrics
  relayer: {
    txSubmitted: number;
    txConfirmed: number;
    txFailed: number;
    gasUsed: bigint;
    avgGasPrice: bigint;
  };

  // Indexer metrics
  indexer: {
    eventsProcessed: number;
    blocksProcessed: number;
    reorgsHandled: number;
    lastBlockNumber: number;
    lagBlocks: number;
  };

  // Database metrics
  database: {
    queryCount: number;
    avgQueryTime: number;
    connectionPoolSize: number;
    activeConnections: number;
  };

  // Cache metrics
  cache: {
    hitRate: number;
    missRate: number;
    keyCount: number;
    memoryUsage: number;
  };

  // Business metrics
  business: {
    totalUsers: number;
    activeUsers24h: number;
    totalInvestments: number;
    totalVolumeUSD: string;
    totalPoolsActive: number;
  };
}

// Collect metrics for health endpoint
export async function collectMetrics(): Promise<Metrics> {
  const [
    apiMetrics,
    relayerMetrics,
    indexerMetrics,
    dbMetrics,
    cacheMetrics,
    businessMetrics,
  ] = await Promise.all([
    collectApiMetrics(),
    collectRelayerMetrics(),
    collectIndexerMetrics(),
    collectDatabaseMetrics(),
    collectCacheMetrics(),
    collectBusinessMetrics(),
  ]);

  return {
    api: apiMetrics,
    relayer: relayerMetrics,
    indexer: indexerMetrics,
    database: dbMetrics,
    cache: cacheMetrics,
    business: businessMetrics,
  };
}
```

### 11.3 Health Checks

```typescript
// /src/api/health/route.ts
import { NextResponse } from 'next/server';

interface HealthCheckResult {
  status: 'healthy' | 'degraded' | 'unhealthy';
  checks: {
    database: ComponentHealth;
    redis: ComponentHealth;
    blockchain: ComponentHealth;
    relayer: ComponentHealth;
  };
  version: string;
  uptime: number;
  timestamp: string;
}

interface ComponentHealth {
  status: 'up' | 'down' | 'degraded';
  latency?: number;
  message?: string;
}

export async function GET(): Promise<NextResponse<HealthCheckResult>> {
  const startTime = Date.now();

  const checks = await Promise.allSettled([
    checkDatabase(),
    checkRedis(),
    checkBlockchain(),
    checkRelayer(),
  ]);

  const [database, redis, blockchain, relayer] = checks.map((result) =>
    result.status === 'fulfilled' ? result.value : { status: 'down' as const, message: result.reason?.message }
  );

  // Determine overall status
  const allUp = [database, redis, blockchain, relayer].every((c) => c.status === 'up');
  const anyDown = [database, redis, blockchain, relayer].some((c) => c.status === 'down');

  const overallStatus = allUp ? 'healthy' : anyDown ? 'unhealthy' : 'degraded';

  const response: HealthCheckResult = {
    status: overallStatus,
    checks: { database, redis, blockchain, relayer },
    version: process.env.npm_package_version || '0.0.0',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  };

  const statusCode = overallStatus === 'healthy' ? 200 : overallStatus === 'degraded' ? 200 : 503;

  return NextResponse.json(response, { status: statusCode });
}

async function checkDatabase(): Promise<ComponentHealth> {
  const start = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    return { status: 'up', latency: Date.now() - start };
  } catch (error) {
    return { status: 'down', message: error.message };
  }
}

async function checkRedis(): Promise<ComponentHealth> {
  const start = Date.now();
  try {
    await redis.ping();
    return { status: 'up', latency: Date.now() - start };
  } catch (error) {
    return { status: 'down', message: error.message };
  }
}

async function checkBlockchain(): Promise<ComponentHealth> {
  const start = Date.now();
  try {
    const blockNumber = await provider.getBlockNumber();
    const latency = Date.now() - start;

    // Check if we're more than 30 seconds behind
    const block = await provider.getBlock(blockNumber);
    const blockAge = Date.now() / 1000 - (block?.timestamp || 0);

    if (blockAge > 30) {
      return { status: 'degraded', latency, message: `Block age: ${blockAge}s` };
    }

    return { status: 'up', latency };
  } catch (error) {
    return { status: 'down', message: error.message };
  }
}

async function checkRelayer(): Promise<ComponentHealth> {
  const start = Date.now();
  try {
    const balance = await provider.getBalance(process.env.RELAYER_ADDRESS!);
    const latency = Date.now() - start;

    // Warn if balance is low (< 1 AVAX)
    const minBalance = ethers.parseEther('1');
    if (balance < minBalance) {
      return {
        status: 'degraded',
        latency,
        message: `Low balance: ${ethers.formatEther(balance)} AVAX`
      };
    }

    return { status: 'up', latency };
  } catch (error) {
    return { status: 'down', message: error.message };
  }
}
```

### 11.4 Alerting Thresholds

```typescript
// /src/lib/alerts.ts

export interface AlertConfig {
  metric: string;
  condition: 'gt' | 'lt' | 'eq';
  threshold: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  cooldownMinutes: number;
}

export const ALERT_CONFIGS: AlertConfig[] = [
  // API Alerts
  {
    metric: 'api.errorRate',
    condition: 'gt',
    threshold: 0.05,  // 5% error rate
    severity: 'high',
    cooldownMinutes: 15,
  },
  {
    metric: 'api.latencyP95',
    condition: 'gt',
    threshold: 2000,  // 2 seconds
    severity: 'medium',
    cooldownMinutes: 30,
  },

  // Relayer Alerts
  {
    metric: 'relayer.balance',
    condition: 'lt',
    threshold: 5,     // 5 AVAX
    severity: 'high',
    cooldownMinutes: 60,
  },
  {
    metric: 'relayer.txFailRate',
    condition: 'gt',
    threshold: 0.1,   // 10% failure rate
    severity: 'critical',
    cooldownMinutes: 5,
  },

  // Indexer Alerts
  {
    metric: 'indexer.lagBlocks',
    condition: 'gt',
    threshold: 100,   // 100 blocks behind
    severity: 'high',
    cooldownMinutes: 15,
  },

  // Database Alerts
  {
    metric: 'database.connectionPoolUtilization',
    condition: 'gt',
    threshold: 0.8,   // 80% pool usage
    severity: 'medium',
    cooldownMinutes: 30,
  },

  // Cache Alerts
  {
    metric: 'cache.hitRate',
    condition: 'lt',
    threshold: 0.7,   // Below 70% hit rate
    severity: 'low',
    cooldownMinutes: 60,
  },

  // Business Alerts
  {
    metric: 'business.noInvestments24h',
    condition: 'eq',
    threshold: 0,     // No investments in 24h
    severity: 'medium',
    cooldownMinutes: 1440, // Once per day
  },
];

// Alert destinations
export const ALERT_CHANNELS = {
  critical: ['pagerduty', 'slack', 'email'],
  high: ['slack', 'email'],
  medium: ['slack'],
  low: ['slack'],
};
```

---

## Appendix A: Environment Variables

```bash
# /env.example

# Database
DATABASE_URL="postgresql://user:password@localhost:5432/rwa_gateway"

# Redis
REDIS_URL="redis://localhost:6379"

# JWT
JWT_SECRET="your-256-bit-secret"

# WebAuthn
RP_ID="localhost"
RP_ORIGIN="http://localhost:3000"

# Avalanche
AVALANCHE_RPC_URL="https://api.avax-test.network/ext/bc/C/rpc"
AVALANCHE_WS_URL="wss://api.avax-test.network/ext/bc/C/ws"
NETWORK="fuji" # or "mainnet"

# Relayer
RELAYER_PRIVATE_KEY="0x..."
RELAYER_ADDRESS="0x..."

# Contract Addresses
BIOMETRIC_REGISTRY_ADDRESS="0x..."
CREDENTIAL_VERIFIER_ADDRESS="0x..."
RWA_GATEWAY_ADDRESS="0x..."

# Logging
LOG_LEVEL="info"
NODE_ENV="development"
```

---

## Appendix B: Document Control

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-02-04 | Architecture Team | Initial draft |

---

**End of Phase 4: Backend & Database Architecture**

*Previous: Phase 3 - Frontend Architecture*
*Next: Phase 5 - Security & Operations*
