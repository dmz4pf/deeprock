# Phase 3: Backend Services (Days 15-21)


**Goal:** Build WebAuthn authentication service, relayer for gasless transactions, and core APIs.

**Architecture:** Express.js APIs, Prisma ORM, Redis caching, BullMQ job queues.

**Tech Stack:** Node.js 20, Express, SimpleWebAuthn 10.x, ethers.js 6.x, Prisma 5.x, Redis

---

## Objectives

1. WebAuthn registration and authentication ceremonies
2. Relayer service for meta-transactions
3. Pool and portfolio APIs
4. Blockchain event indexer
5. Redis caching layer
6. Rate limiting and security middleware

## Deliverables

- [ ] WebAuthn registration endpoint (`POST /api/auth/register-options`, `POST /api/auth/register-verify`)
- [ ] WebAuthn authentication endpoint (`POST /api/auth/login-options`, `POST /api/auth/login-verify`)
- [ ] Relayer service with nonce management
- [ ] Pool APIs (`GET /api/pools`, `GET /api/pools/:id`, `POST /api/pools/:id/invest`)
- [ ] Portfolio API (`GET /api/portfolio`)
- [ ] Blockchain event indexer
- [ ] Rate limiting middleware
- [ ] 80%+ test coverage

## Dependencies

- Phase 2 complete (contracts deployed to Fuji)
- PostgreSQL database configured
- Redis instance running
- Relayer wallet funded with AVAX

---

## Task 3.1: WebAuthn Service

**Complexity:** High | **Time:** 6-8 hours

**Files:**
- Create: `backend/src/services/webauthn.service.ts`
- Create: `backend/src/routes/auth.routes.ts`
- Create: `backend/src/middleware/auth.middleware.ts`

### Step 1: Install WebAuthn dependencies

```bash
cd backend
npm install @simplewebauthn/server @simplewebauthn/types jose
```

### Step 2: Create WebAuthn service

**backend/src/services/webauthn.service.ts:**
```typescript
import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
  VerifiedRegistrationResponse,
  VerifiedAuthenticationResponse,
} from "@simplewebauthn/server";
import type {
  RegistrationResponseJSON,
  AuthenticationResponseJSON,
} from "@simplewebauthn/types";
import { PrismaClient } from "@prisma/client";
import { Redis } from "ioredis";
import { SignJWT, jwtVerify } from "jose";
import crypto from "crypto";

const prisma = new PrismaClient();

// Configuration
const RP_NAME = process.env.WEBAUTHN_RP_NAME || "RWA Gateway";
const RP_ID = process.env.WEBAUTHN_RP_ID || "localhost";
const ORIGIN = process.env.WEBAUTHN_ORIGIN || "http://localhost:3000";
const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "development-secret-change-in-production");
const CHALLENGE_TTL = 300; // 5 minutes

export class WebAuthnService {
  constructor(private redis: Redis) {}

  /**
   * Generate registration options for a new user
   */
  async generateRegistrationOptions(email: string, displayName: string) {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
      include: { biometricIdentities: true },
    });

    if (existingUser?.biometricIdentities.length) {
      throw new Error("User already registered with biometrics");
    }

    // Generate challenge
    const options = await generateRegistrationOptions({
      rpName: RP_NAME,
      rpID: RP_ID,
      userName: email,
      userDisplayName: displayName || email,
      attestationType: "direct",
      authenticatorSelection: {
        residentKey: "preferred",
        userVerification: "required",
        authenticatorAttachment: "platform", // Prefer built-in authenticators
      },
      supportedAlgorithmIDs: [-7], // ES256 (P-256) only - required for ACP-204
    });

    // Store challenge in Redis
    const challengeId = crypto.randomUUID();
    await this.redis.setex(
      `webauthn:challenge:${challengeId}`,
      CHALLENGE_TTL,
      JSON.stringify({
        challenge: options.challenge,
        email,
        displayName,
        type: "registration",
      })
    );

    return { options, challengeId };
  }

  /**
   * Verify registration response and create user
   */
  async verifyRegistration(
    challengeId: string,
    response: RegistrationResponseJSON
  ): Promise<{ user: any; publicKey: { x: string; y: string } }> {
    // Get stored challenge
    const stored = await this.redis.get(`webauthn:challenge:${challengeId}`);
    if (!stored) {
      throw new Error("Challenge expired or not found");
    }

    const { challenge, email, displayName } = JSON.parse(stored);

    // Verify the registration response
    const verification: VerifiedRegistrationResponse = await verifyRegistrationResponse({
      response,
      expectedChallenge: challenge,
      expectedOrigin: ORIGIN,
      expectedRPID: RP_ID,
      requireUserVerification: true,
    });

    if (!verification.verified || !verification.registrationInfo) {
      throw new Error("Registration verification failed");
    }

    const { credentialPublicKey, credentialID, counter } = verification.registrationInfo;

    // Extract P-256 public key coordinates
    const publicKey = this.extractP256PublicKey(credentialPublicKey);

    // Create user and biometric identity in transaction
    const user = await prisma.$transaction(async (tx) => {
      // Generate wallet address from public key (deterministic)
      const walletAddress = this.deriveWalletAddress(publicKey.x, publicKey.y);

      const newUser = await tx.user.create({
        data: {
          email,
          displayName,
          walletAddress,
          biometricIdentities: {
            create: {
              credentialId: Buffer.from(credentialID).toString("base64url"),
              publicKeyX: publicKey.x,
              publicKeyY: publicKey.y,
              authCounter: counter,
              deviceInfo: {
                userAgent: response.response.transports,
              },
            },
          },
        },
        include: { biometricIdentities: true },
      });

      return newUser;
    });

    // Clean up challenge
    await this.redis.del(`webauthn:challenge:${challengeId}`);

    return { user, publicKey };
  }

  /**
   * Generate authentication options
   */
  async generateAuthenticationOptions(email: string) {
    const user = await prisma.user.findUnique({
      where: { email },
      include: { biometricIdentities: { where: { isActive: true } } },
    });

    if (!user || !user.biometricIdentities.length) {
      throw new Error("User not found or no registered credentials");
    }

    const options = await generateAuthenticationOptions({
      rpID: RP_ID,
      allowCredentials: user.biometricIdentities.map((cred) => ({
        id: Buffer.from(cred.credentialId, "base64url"),
        type: "public-key",
      })),
      userVerification: "required",
    });

    // Store challenge
    const challengeId = crypto.randomUUID();
    await this.redis.setex(
      `webauthn:challenge:${challengeId}`,
      CHALLENGE_TTL,
      JSON.stringify({
        challenge: options.challenge,
        userId: user.id,
        type: "authentication",
      })
    );

    return { options, challengeId };
  }

  /**
   * Verify authentication and issue JWT
   */
  async verifyAuthentication(
    challengeId: string,
    response: AuthenticationResponseJSON
  ): Promise<{ token: string; user: any; expiresAt: Date }> {
    const stored = await this.redis.get(`webauthn:challenge:${challengeId}`);
    if (!stored) {
      throw new Error("Challenge expired or not found");
    }

    const { challenge, userId } = JSON.parse(stored);

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { biometricIdentities: true },
    });

    if (!user) {
      throw new Error("User not found");
    }

    // Find matching credential
    const credential = user.biometricIdentities.find(
      (c) => c.credentialId === response.id
    );

    if (!credential) {
      throw new Error("Credential not found");
    }

    // Reconstruct public key for verification
    const publicKeyBuffer = this.reconstructPublicKey(
      credential.publicKeyX,
      credential.publicKeyY
    );

    const verification: VerifiedAuthenticationResponse = await verifyAuthenticationResponse({
      response,
      expectedChallenge: challenge,
      expectedOrigin: ORIGIN,
      expectedRPID: RP_ID,
      requireUserVerification: true,
      authenticator: {
        credentialID: Buffer.from(credential.credentialId, "base64url"),
        credentialPublicKey: publicKeyBuffer,
        counter: credential.authCounter,
      },
    });

    if (!verification.verified) {
      throw new Error("Authentication verification failed");
    }

    // Update counter (replay protection)
    await prisma.biometricIdentity.update({
      where: { id: credential.id },
      data: { authCounter: verification.authenticationInfo.newCounter },
    });

    // Generate JWT
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    const token = await new SignJWT({
      sub: user.id,
      email: user.email,
      walletAddress: user.walletAddress,
    })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime(expiresAt)
      .sign(JWT_SECRET);

    // Store session
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
    await prisma.session.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt,
      },
    });

    // Cache session in Redis
    await this.redis.setex(
      `session:${tokenHash}`,
      24 * 60 * 60,
      JSON.stringify({ userId: user.id, email: user.email, walletAddress: user.walletAddress })
    );

    // Clean up challenge
    await this.redis.del(`webauthn:challenge:${challengeId}`);

    return { token, user, expiresAt };
  }

  /**
   * Verify JWT token
   */
  async verifyToken(token: string) {
    try {
      const { payload } = await jwtVerify(token, JWT_SECRET);

      // Check session in Redis first (faster)
      const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
      const cached = await this.redis.get(`session:${tokenHash}`);

      if (cached) {
        return JSON.parse(cached);
      }

      // Fallback to database
      const session = await prisma.session.findUnique({
        where: { tokenHash },
        include: { user: true },
      });

      if (!session || session.expiresAt < new Date()) {
        throw new Error("Session expired");
      }

      return {
        userId: session.userId,
        email: session.user.email,
        walletAddress: session.user.walletAddress,
      };
    } catch (error) {
      throw new Error("Invalid token");
    }
  }

  // Helper methods

  private extractP256PublicKey(credentialPublicKey: Uint8Array): { x: string; y: string } {
    // COSE key format for P-256
    // The public key is in COSE format, we need to extract x and y coordinates
    // This is a simplified extraction - production should use a proper COSE library

    // For P-256, the key is typically:
    // - byte 0: 0x04 (uncompressed point)
    // - bytes 1-32: x coordinate
    // - bytes 33-64: y coordinate

    // Skip COSE envelope and get raw key
    // The actual offset depends on the COSE structure
    const keyBytes = Buffer.from(credentialPublicKey);

    // Find the uncompressed point marker (0x04)
    let offset = keyBytes.indexOf(0x04);
    if (offset === -1) {
      throw new Error("Could not find public key point");
    }

    const x = keyBytes.subarray(offset + 1, offset + 33).toString("hex");
    const y = keyBytes.subarray(offset + 33, offset + 65).toString("hex");

    return {
      x: "0x" + x.padStart(64, "0"),
      y: "0x" + y.padStart(64, "0"),
    };
  }

  private reconstructPublicKey(x: string, y: string): Uint8Array {
    // Reconstruct COSE key from x,y coordinates
    // This is simplified - production should use proper COSE encoding

    const xBytes = Buffer.from(x.replace("0x", ""), "hex");
    const yBytes = Buffer.from(y.replace("0x", ""), "hex");

    // Uncompressed point format
    const publicKey = Buffer.concat([
      Buffer.from([0x04]),
      xBytes,
      yBytes,
    ]);

    return new Uint8Array(publicKey);
  }

  private deriveWalletAddress(x: string, y: string): string {
    // Derive a deterministic "wallet address" from public key
    // This is used as an identifier in the smart contracts
    const publicKeyHash = crypto
      .createHash("sha256")
      .update(x + y)
      .digest("hex");

    return "0x" + publicKeyHash.substring(0, 40);
  }
}
```

### Step 3: Create auth routes

**backend/src/routes/auth.routes.ts:**
```typescript
import { Router, Request, Response } from "express";
import { z } from "zod";
import { WebAuthnService } from "../services/webauthn.service";
import { Redis } from "ioredis";

const router = Router();
const redis = new Redis(process.env.REDIS_URL || "redis://localhost:6379");
const webAuthnService = new WebAuthnService(redis);

// Validation schemas
const registerOptionsSchema = z.object({
  email: z.string().email(),
  displayName: z.string().min(1).max(64).optional(),
});

const registerVerifySchema = z.object({
  challengeId: z.string().uuid(),
  response: z.any(), // WebAuthn response object
});

const loginOptionsSchema = z.object({
  email: z.string().email(),
});

const loginVerifySchema = z.object({
  challengeId: z.string().uuid(),
  response: z.any(),
});

// Registration options
router.post("/register-options", async (req: Request, res: Response) => {
  try {
    const { email, displayName } = registerOptionsSchema.parse(req.body);
    const result = await webAuthnService.generateRegistrationOptions(email, displayName || email);
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Verify registration
router.post("/register-verify", async (req: Request, res: Response) => {
  try {
    const { challengeId, response } = registerVerifySchema.parse(req.body);
    const result = await webAuthnService.verifyRegistration(challengeId, response);

    // TODO: Trigger on-chain registration via relayer
    // This should call BiometricRegistry.register(publicKey.x, publicKey.y, credentialId)

    res.json({
      success: true,
      user: {
        id: result.user.id,
        email: result.user.email,
        walletAddress: result.user.walletAddress,
      },
      publicKey: result.publicKey,
    });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Login options
router.post("/login-options", async (req: Request, res: Response) => {
  try {
    const { email } = loginOptionsSchema.parse(req.body);
    const result = await webAuthnService.generateAuthenticationOptions(email);
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Verify login
router.post("/login-verify", async (req: Request, res: Response) => {
  try {
    const { challengeId, response } = loginVerifySchema.parse(req.body);
    const result = await webAuthnService.verifyAuthentication(challengeId, response);
    res.json({
      success: true,
      token: result.token,
      expiresAt: result.expiresAt.toISOString(),
      user: {
        id: result.user.id,
        email: result.user.email,
        walletAddress: result.user.walletAddress,
      },
    });
  } catch (error: any) {
    res.status(401).json({ error: error.message });
  }
});

// Get current session
router.get("/session", async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({ error: "No token provided" });
    }

    const token = authHeader.substring(7);
    const session = await webAuthnService.verifyToken(token);
    res.json({ session });
  } catch (error: any) {
    res.status(401).json({ error: error.message });
  }
});

// Logout
router.post("/logout", async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.substring(7);
      const tokenHash = require("crypto").createHash("sha256").update(token).digest("hex");

      // Remove from Redis
      await redis.del(`session:${tokenHash}`);

      // Mark as expired in database
      const { PrismaClient } = require("@prisma/client");
      const prisma = new PrismaClient();
      await prisma.session.updateMany({
        where: { tokenHash },
        data: { expiresAt: new Date() },
      });
    }

    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
```

### Step 4: Commit

```bash
git add .
git commit -m "feat(backend): implement WebAuthn authentication service

- Registration ceremony (options + verify)
- Authentication ceremony (options + verify)
- JWT token generation and validation
- P-256 public key extraction from COSE
- Redis challenge storage
- Session management

```

---

## Task 3.2: Relayer Service

**Complexity:** High | **Time:** 5-6 hours

**Files:**
- Create: `backend/src/services/relayer.service.ts`
- Create: `backend/src/routes/relayer.routes.ts`

### Key Implementation Points

```typescript
// backend/src/services/relayer.service.ts

import { ethers } from "ethers";
import { Redis } from "ioredis";

export class RelayerService {
  private wallet: ethers.Wallet;
  private provider: ethers.JsonRpcProvider;
  private contracts: {
    biometricRegistry: ethers.Contract;
    rwaGateway: ethers.Contract;
  };

  constructor(private redis: Redis) {
    this.provider = new ethers.JsonRpcProvider(process.env.AVALANCHE_RPC_URL);
    this.wallet = new ethers.Wallet(process.env.RELAYER_PRIVATE_KEY!, this.provider);

    // Initialize contract instances
    this.contracts = {
      biometricRegistry: new ethers.Contract(
        process.env.BIOMETRIC_REGISTRY_ADDRESS!,
        BiometricRegistryABI,
        this.wallet
      ),
      rwaGateway: new ethers.Contract(
        process.env.RWA_GATEWAY_ADDRESS!,
        RWAGatewayABI,
        this.wallet
      ),
    };
  }

  /**
   * Register biometric identity on-chain
   */
  async registerBiometric(
    user: string,
    publicKeyX: string,
    publicKeyY: string,
    credentialId: string
  ) {
    // Rate limit check
    const key = `ratelimit:relayer:${user}:register`;
    const count = await this.redis.incr(key);
    if (count === 1) await this.redis.expire(key, 60);
    if (count > 1) throw new Error("Rate limit: 1 registration per minute");

    // Get nonce with lock
    const nonce = await this.getLockedNonce();

    try {
      const tx = await this.contracts.biometricRegistry.register(
        publicKeyX,
        publicKeyY,
        credentialId,
        { nonce, gasLimit: 200000 }
      );

      const receipt = await tx.wait(2); // Wait for 2 confirmations

      return {
        txHash: receipt.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString(),
      };
    } finally {
      await this.releaseNonceLock();
    }
  }

  /**
   * Submit investment via relayer
   */
  async submitInvestment(
    poolId: number,
    user: string,
    amount: bigint,
    deadline: number,
    r: string,
    s: string
  ) {
    // Rate limit
    const key = `ratelimit:relayer:${user}:invest`;
    const count = await this.redis.incr(key);
    if (count === 1) await this.redis.expire(key, 60);
    if (count > 10) throw new Error("Rate limit: 10 investments per minute");

    const nonce = await this.getLockedNonce();

    try {
      const tx = await this.contracts.rwaGateway.investViaRelayer(
        poolId,
        user,
        amount,
        deadline,
        r,
        s,
        { nonce, gasLimit: 350000 }
      );

      const receipt = await tx.wait(2);
      return { txHash: receipt.hash, blockNumber: receipt.blockNumber };
    } finally {
      await this.releaseNonceLock();
    }
  }

  private async getLockedNonce(): Promise<number> {
    // Distributed nonce lock
    const lockKey = "relayer:nonce:lock";
    const acquired = await this.redis.set(lockKey, "1", "EX", 30, "NX");
    if (!acquired) {
      throw new Error("Could not acquire nonce lock");
    }
    return await this.wallet.getNonce();
  }

  private async releaseNonceLock() {
    await this.redis.del("relayer:nonce:lock");
  }

  async getBalance(): Promise<string> {
    const balance = await this.provider.getBalance(this.wallet.address);
    return ethers.formatEther(balance);
  }
}
```

---

## Task 3.3: Pool and Portfolio APIs

**Complexity:** Medium | **Time:** 4-5 hours

**Files:**
- Create: `backend/src/routes/pools.routes.ts`
- Create: `backend/src/routes/portfolio.routes.ts`

### Key Endpoints

```typescript
// GET /api/pools - List pools with filtering
// GET /api/pools/:id - Pool details
// POST /api/pools/:id/invest - Invest (triggers relayer)
// POST /api/pools/:id/redeem - Redeem (triggers relayer)

// GET /api/portfolio - User's investments, credentials, yield history
// GET /api/portfolio/yield - Yield breakdown
// GET /api/portfolio/transactions - Transaction history
```

---

## Task 3.4: Blockchain Event Indexer

**Complexity:** Medium | **Time:** 3-4 hours

**Files:**
- Create: `backend/src/services/indexer.service.ts`
- Create: `backend/src/jobs/indexer.job.ts`

### Key Implementation

```typescript
// backend/src/services/indexer.service.ts

export class IndexerService {
  async processEvent(event: ethers.Log, eventName: string, args: any) {
    // Store in database
    await prisma.indexedEvent.create({
      data: {
        eventId: `${event.transactionHash}-${event.index}`,
        contractAddress: event.address,
        eventName,
        blockNumber: event.blockNumber,
        blockHash: event.blockHash,
        txHash: event.transactionHash,
        logIndex: event.index,
        args: args,
      },
    });

    // Update relevant tables based on event type
    switch (eventName) {
      case "Invested":
        await this.handleInvestment(args);
        break;
      case "Redeemed":
        await this.handleRedemption(args);
        break;
      case "YieldDistributed":
        await this.handleYield(args);
        break;
      // ... etc
    }
  }
}
```

---

## Task 3.5: Rate Limiting and Security

**Complexity:** Low | **Time:** 2-3 hours

**Files:**
- Create: `backend/src/middleware/rateLimit.middleware.ts`
- Create: `backend/src/middleware/security.middleware.ts`

### Key Implementation

```typescript
// Sliding window rate limiter using Redis sorted sets
export function createRateLimiter(options: {
  windowMs: number;
  max: number;
  keyPrefix: string;
}) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const key = `${options.keyPrefix}:${req.ip}`;
    const now = Date.now();
    const windowStart = now - options.windowMs;

    // Remove old entries
    await redis.zremrangebyscore(key, 0, windowStart);

    // Count current entries
    const count = await redis.zcard(key);

    if (count >= options.max) {
      return res.status(429).json({
        error: "Too many requests",
        retryAfter: Math.ceil(options.windowMs / 1000),
      });
    }

    // Add current request
    await redis.zadd(key, now, `${now}`);
    await redis.expire(key, Math.ceil(options.windowMs / 1000));

    next();
  };
}
```

---

## Phase 3 Definition of Done

- [ ] WebAuthn registration flow working end-to-end
- [ ] WebAuthn authentication flow working
- [ ] JWT tokens issued and validated
- [ ] Relayer submitting transactions to Fuji
- [ ] Pool listing and details APIs
- [ ] Portfolio API with real data
- [ ] Event indexer syncing blockchain events
- [ ] Rate limiting enforced
- [ ] 80%+ test coverage
- [ ] API documentation (OpenAPI/Swagger)

## Estimated Total Time: 30-40 hours

## Next Phase

Continue to [PHASE-4-FRONTEND.md](./PHASE-4-FRONTEND.md) for Next.js UI implementation.
