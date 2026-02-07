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
  AuthenticatorTransportFuture,
} from "@simplewebauthn/types";
import { PrismaClient } from "@prisma/client";
import { Redis } from "ioredis";
import { SignJWT, jwtVerify } from "jose";
import crypto from "crypto";
import { encode as cborEncode, decode as cborDecode } from "cbor-x";
import { ethers, Interface, JsonRpcProvider } from "ethers";
import { RelayerService } from "./relayer.service.js";

// Factory Interface for getAddress call
const FACTORY_INTERFACE = new Interface([
  "function getAddress(bytes32 publicKeyX, bytes32 publicKeyY, bytes32 credentialId) external view returns (address)",
]);

const prisma = new PrismaClient();

// Configuration from environment
const RP_NAME = process.env.WEBAUTHN_RP_NAME || "RWA Gateway";
const RP_ID = process.env.WEBAUTHN_RP_ID || "localhost";
const ORIGIN = process.env.WEBAUTHN_ORIGIN || "http://localhost:3000";
// Security: JWT_SECRET must be set via environment variable
const JWT_SECRET_RAW = process.env.JWT_SECRET;
if (!JWT_SECRET_RAW) {
  throw new Error('SECURITY ERROR: JWT_SECRET environment variable is required. Server cannot start without it.');
}
const JWT_SECRET = new TextEncoder().encode(JWT_SECRET_RAW);
const CHALLENGE_TTL = 300; // 5 minutes

export interface RegistrationResult {
  user: {
    id: string;
    email: string | null;
    walletAddress: string | null;
    displayName: string | null;
    authProvider: 'EMAIL' | 'GOOGLE' | 'WALLET';
  };
  publicKey: { x: string; y: string };
}

export interface AuthenticationResult {
  token: string;
  expiresAt: Date;
  user: {
    id: string;
    email: string | null;
    walletAddress: string | null;
    displayName: string | null;
    authProvider: 'EMAIL' | 'GOOGLE' | 'WALLET';
  };
}

export interface SessionPayload {
  userId: string;
  email: string | null;
  walletAddress: string | null;
  authProvider: 'EMAIL' | 'GOOGLE' | 'WALLET';
}

export class WebAuthnService {
  private relayerService: RelayerService | null = null;

  constructor(private redis: Redis) {
    this.initRelayerService();
  }

  /**
   * Initialize RelayerService for on-chain registration (optional)
   * Gracefully skips if not configured - passkeys still work locally
   */
  private initRelayerService(): void {
    if (process.env.RELAYER_PRIVATE_KEY && process.env.BIOMETRIC_REGISTRY_ADDRESS) {
      try {
        this.relayerService = new RelayerService(this.redis);
        console.log("[WebAuthn] RelayerService initialized - on-chain registration enabled");
      } catch (error: any) {
        console.error("[WebAuthn] RelayerService init failed (on-chain disabled):", error.message);
        this.relayerService = null;
      }
    } else {
      console.log("[WebAuthn] RelayerService not configured - on-chain registration disabled");
    }
  }

  /**
   * Generate registration options for a new user
   */
  async generateRegistrationOptions(email: string, displayName?: string) {
    // Check if user already has biometrics registered
    const existingUser = await prisma.user.findUnique({
      where: { email },
      include: { biometricIdentities: { where: { isActive: true } } },
    });

    // Allow up to 10 passkeys per account (for backup devices)
    const MAX_PASSKEYS = 10;
    if (existingUser?.biometricIdentities.length && existingUser.biometricIdentities.length >= MAX_PASSKEYS) {
      throw new Error(`Maximum ${MAX_PASSKEYS} passkeys allowed per account`);
    }

    // Generate unique user ID for WebAuthn
    const userIdBytes = crypto.randomBytes(32);

    const options = await generateRegistrationOptions({
      rpName: RP_NAME,
      rpID: RP_ID,
      userName: email,
      userDisplayName: displayName || email,
      userID: userIdBytes,
      attestationType: "direct",
      authenticatorSelection: {
        residentKey: "preferred",
        userVerification: "required",
        authenticatorAttachment: "platform", // Prefer built-in authenticators (Touch ID, Face ID)
      },
      supportedAlgorithmIDs: [-7], // ES256 (P-256) only - required for ACP-204
    });

    // Store challenge in Redis with metadata
    const challengeId = crypto.randomUUID();
    await this.redis.setex(
      `webauthn:challenge:${challengeId}`,
      CHALLENGE_TTL,
      JSON.stringify({
        challenge: options.challenge,
        email,
        displayName: displayName || email,
        type: "registration",
        createdAt: Date.now(),
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
  ): Promise<RegistrationResult> {
    // Retrieve stored challenge
    const stored = await this.redis.get(`webauthn:challenge:${challengeId}`);
    if (!stored) {
      throw new Error("Challenge expired or not found");
    }

    const { challenge, email, displayName } = JSON.parse(stored);

    // Verify the registration response
    const verification: VerifiedRegistrationResponse =
      await verifyRegistrationResponse({
        response,
        expectedChallenge: challenge,
        expectedOrigin: ORIGIN,
        expectedRPID: RP_ID,
        requireUserVerification: true,
      });

    if (!verification.verified || !verification.registrationInfo) {
      throw new Error("Registration verification failed");
    }

    // SimpleWebAuthn v10+: credentialID is already a base64url string
    const { credentialID, credentialPublicKey, counter, credentialDeviceType, credentialBackedUp, aaguid } =
      verification.registrationInfo;
    const credentialId = credentialID; // Already base64url encoded, no Buffer conversion needed

    // Convert AAGUID to hex string for storage (identifies authenticator model)
    const aaguidHex = aaguid ? Buffer.from(aaguid).toString('hex') : null;

    console.log("[DEBUG] Registration verified successfully");
    console.log("[DEBUG] credentialID:", credentialId);
    console.log("[DEBUG] credentialPublicKey length:", credentialPublicKey.length);
    console.log("[DEBUG] credentialPublicKey (hex):", Buffer.from(credentialPublicKey).toString('hex'));

    // Extract P-256 public key coordinates from COSE format
    const publicKey = this.extractP256PublicKey(credentialPublicKey);
    console.log("[DEBUG] Extracted X:", publicKey.x);
    console.log("[DEBUG] Extracted Y:", publicKey.y);
    console.log("[DEBUG] X length (hex chars):", publicKey.x.replace('0x', '').length);
    console.log("[DEBUG] Y length (hex chars):", publicKey.y.replace('0x', '').length);

    // Compute smart wallet address from factory BEFORE the transaction
    // (since this is an async RPC call, we do it outside the transaction)
    const walletAddress = await this.computeSmartWalletAddress(
      publicKey.x,
      publicKey.y,
      credentialId
    );
    console.log(`[WebAuthn] Computed smart wallet address: ${walletAddress}`);

    // Create user and biometric identity atomically (or link to existing user)
    const user = await prisma.$transaction(async (tx) => {

      // Check if user already exists (e.g., from Google OAuth)
      const existingUser = await tx.user.findUnique({
        where: { email },
        include: { biometricIdentities: { where: { isActive: true } } },
      });

      if (existingUser) {
        // User exists - link biometric to existing account (up to MAX_PASSKEYS)
        const MAX_PASSKEYS = 10;
        if (existingUser.biometricIdentities.length >= MAX_PASSKEYS) {
          throw new Error(`Maximum ${MAX_PASSKEYS} passkeys allowed per account`);
        }

        // Add biometric identity to existing user
        const biometric = await tx.biometricIdentity.create({
          data: {
            userId: existingUser.id,
            credentialId, // Already base64url from SimpleWebAuthn v10
            publicKeyX: publicKey.x,
            publicKeyY: publicKey.y,
            authCounter: counter,
            deviceInfo: {
              deviceType: credentialDeviceType,
              backedUp: credentialBackedUp,
              transports: response.response.transports,
            },
            aaguid: aaguidHex,
            deviceName: `${credentialDeviceType} device`,
          },
        });

        // Update wallet address if user doesn't have one
        if (!existingUser.walletAddress) {
          await tx.user.update({
            where: { id: existingUser.id },
            data: { walletAddress },
          });
        }

        // Create audit log
        await tx.auditLog.create({
          data: {
            action: "BIOMETRIC_LINK",
            userId: existingUser.id,
            resourceType: "BiometricIdentity",
            resourceId: biometric.id,
            status: "SUCCESS",
            metadata: {
              email,
              credentialDeviceType,
              credentialBackedUp,
              linkedToExistingAccount: true,
            },
          },
        });

        return tx.user.findUnique({
          where: { id: existingUser.id },
          include: { biometricIdentities: true },
        });
      }

      // Check if wallet address already exists (for new user)
      const existingWallet = await tx.user.findUnique({
        where: { walletAddress },
      });
      if (existingWallet) {
        throw new Error("Wallet address already registered");
      }

      // Create new user with biometric
      const newUser = await tx.user.create({
        data: {
          email,
          displayName,
          walletAddress,
          biometricIdentities: {
            create: {
              credentialId, // Already base64url from SimpleWebAuthn v10
              publicKeyX: publicKey.x,
              publicKeyY: publicKey.y,
              authCounter: counter,
              deviceInfo: {
                deviceType: credentialDeviceType,
                backedUp: credentialBackedUp,
                transports: response.response.transports,
              },
              aaguid: aaguidHex,
              deviceName: `${credentialDeviceType} device`,
            },
          },
        },
        include: { biometricIdentities: true },
      });

      // Create audit log
      await tx.auditLog.create({
        data: {
          action: "BIOMETRIC_REGISTER",
          userId: newUser.id,
          resourceType: "BiometricIdentity",
          resourceId: newUser.biometricIdentities[0].id,
          status: "SUCCESS",
          metadata: {
            email,
            credentialDeviceType,
            credentialBackedUp,
          },
        },
      });

      return newUser;
    });

    // === On-Chain Registration (Fire-and-Forget) ===
    // This runs asynchronously and NEVER blocks the WebAuthn response
    if (user && this.relayerService) {
      this.triggerOnChainRegistration(
        user.walletAddress!,
        publicKey.x,
        publicKey.y,
        response.id, // credentialId from browser
        user.biometricIdentities[user.biometricIdentities.length - 1]?.id
      ).catch((err) => {
        // Log but NEVER throw - on-chain failure must not affect local passkey
        console.error("[OnChain] Failed (non-blocking):", err.message);
      });
    }

    // Clean up challenge
    await this.redis.del(`webauthn:challenge:${challengeId}`);

    if (!user) {
      throw new Error("Failed to create or retrieve user");
    }

    return {
      user: {
        id: user.id,
        email: user.email,
        walletAddress: user.walletAddress,
        displayName: user.displayName,
        authProvider: user.authProvider as 'EMAIL' | 'GOOGLE' | 'WALLET',
      },
      publicKey,
    };
  }

  /**
   * Generate authentication options for existing user
   * If email is not provided, uses discoverable credentials (resident keys)
   */
  async generateAuthenticationOptions(email?: string) {
    let allowCredentials: { id: string; transports?: AuthenticatorTransportFuture[] }[] | undefined;

    if (email) {
      // Email provided - look up user's credentials
      const user = await prisma.user.findUnique({
        where: { email },
        include: { biometricIdentities: { where: { isActive: true } } },
      });

      if (!user || !user.biometricIdentities.length) {
        throw new Error("User not found or no registered credentials");
      }

      allowCredentials = user.biometricIdentities.map((cred) => ({
        id: cred.credentialId, // Already base64url string
        transports: (cred.deviceInfo as Record<string, unknown>)?.transports as
          | AuthenticatorTransportFuture[]
          | undefined,
      }));
    }
    // If no email, allowCredentials is undefined - enables discoverable credentials

    const options = await generateAuthenticationOptions({
      rpID: RP_ID,
      allowCredentials,
      userVerification: "required",
    });

    // Store challenge
    // Note: For discoverable credentials, we don't have userId yet - it will be resolved during verification
    const challengeId = crypto.randomUUID();
    await this.redis.setex(
      `webauthn:challenge:${challengeId}`,
      CHALLENGE_TTL,
      JSON.stringify({
        challenge: options.challenge,
        // Only include userId if we have specific credentials (non-discoverable flow)
        ...(allowCredentials && email ? { userId: (await prisma.user.findUnique({ where: { email }, select: { id: true } }))?.id } : {}),
        type: "authentication",
        discoverable: !email, // Flag for discoverable credential flow
        createdAt: Date.now(),
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
  ): Promise<AuthenticationResult> {
    console.log("[DEBUG] ========== VERIFY AUTHENTICATION START ==========");
    console.log("[DEBUG] challengeId:", challengeId);
    console.log("[DEBUG] response.id (credential ID from browser):", response.id);
    console.log("[DEBUG] response.id length:", response.id.length);
    console.log("[DEBUG] response.rawId:", response.rawId);
    console.log("[DEBUG] response.type:", response.type);

    const stored = await this.redis.get(`webauthn:challenge:${challengeId}`);
    if (!stored) {
      console.log("[DEBUG] Challenge not found in Redis");
      throw new Error("Challenge expired or not found");
    }

    const { challenge, userId, discoverable } = JSON.parse(stored);
    console.log("[DEBUG] Challenge found - discoverable:", discoverable, "userId:", userId);

    let user;
    let credential;

    if (discoverable) {
      // Discoverable credentials flow - look up user by credential ID
      console.log("[DEBUG] Discoverable auth - looking for credential ID:", response.id);
      credential = await prisma.biometricIdentity.findFirst({
        where: { credentialId: response.id, isActive: true },
        include: { user: { include: { biometricIdentities: { where: { isActive: true } } } } },
      });

      if (!credential) {
        const allCreds = await prisma.biometricIdentity.findMany({ select: { credentialId: true } });
        console.log("[DEBUG] No matching credential found.");
        console.log("[DEBUG] Looking for:", response.id);
        console.log("[DEBUG] Stored credentials:", allCreds.map(c => c.credentialId));
        console.log("[DEBUG] Comparison:");
        allCreds.forEach(c => {
          console.log(`  "${c.credentialId}" === "${response.id}" ? ${c.credentialId === response.id}`);
          console.log(`  lengths: stored=${c.credentialId.length}, browser=${response.id.length}`);
        });
        throw new Error("Passkey not registered with this app. Please register first.");
      }
      console.log("[DEBUG] Credential found for discoverable auth");
      user = credential.user;
    } else {
      // Traditional flow - use stored userId
      user = await prisma.user.findUnique({
        where: { id: userId },
        include: { biometricIdentities: { where: { isActive: true } } },
      });

      if (!user) {
        throw new Error("User not found");
      }

      // Find matching credential
      credential = user.biometricIdentities.find(
        (c) => c.credentialId === response.id
      );

      if (!credential) {
        throw new Error("Credential not found");
      }
    }

    // Reconstruct public key for verification
    console.log("[DEBUG] Reconstructing public key from stored coordinates");
    console.log("[DEBUG] publicKeyX:", credential.publicKeyX);
    console.log("[DEBUG] publicKeyY:", credential.publicKeyY);

    const publicKeyBuffer = this.reconstructPublicKey(
      credential.publicKeyX,
      credential.publicKeyY
    );
    console.log("[DEBUG] Reconstructed COSE key length:", publicKeyBuffer.length);
    console.log("[DEBUG] Reconstructed COSE key (hex):", Buffer.from(publicKeyBuffer).toString('hex'));

    console.log("[DEBUG] Calling verifyAuthenticationResponse with:");
    console.log("[DEBUG]   expectedChallenge:", challenge);
    console.log("[DEBUG]   expectedOrigin:", ORIGIN);
    console.log("[DEBUG]   expectedRPID:", RP_ID);
    console.log("[DEBUG]   authenticator.credentialID:", credential.credentialId);
    console.log("[DEBUG]   authenticator.counter:", credential.authCounter);

    let verification: VerifiedAuthenticationResponse;
    try {
      verification = await verifyAuthenticationResponse({
        response,
        expectedChallenge: challenge,
        expectedOrigin: ORIGIN,
        expectedRPID: RP_ID,
        requireUserVerification: true,
        authenticator: {
          credentialID: credential.credentialId,
          credentialPublicKey: publicKeyBuffer,
          counter: credential.authCounter,
          transports: (credential.deviceInfo as Record<string, unknown>)?.transports as AuthenticatorTransportFuture[] | undefined,
        },
      });
      console.log("[DEBUG] verifyAuthenticationResponse result:", verification);
    } catch (verifyError: any) {
      console.log("[DEBUG] verifyAuthenticationResponse THREW ERROR:", verifyError.message);
      console.log("[DEBUG] Error stack:", verifyError.stack);
      throw verifyError;
    }

    if (!verification.verified) {
      // Log failed attempt
      await prisma.auditLog.create({
        data: {
          action: "BIOMETRIC_AUTH",
          userId: user.id,
          resourceType: "BiometricIdentity",
          resourceId: credential.id,
          status: "FAILURE",
          metadata: { reason: "Verification failed" },
        },
      });
      throw new Error("Authentication verification failed");
    }

    // Update counter (replay protection) and lastUsedAt tracking
    await prisma.biometricIdentity.update({
      where: { id: credential.id },
      data: {
        authCounter: verification.authenticationInfo.newCounter,
        lastUsedAt: new Date(),
      },
    });

    // Generate JWT token
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
    await prisma.session.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt,
      },
    });

    // Cache session in Redis for fast lookups
    await this.redis.setex(
      `session:${tokenHash}`,
      24 * 60 * 60,
      JSON.stringify({
        userId: user.id,
        email: user.email,
        walletAddress: user.walletAddress,
        authProvider: user.authProvider,
      })
    );

    // Clean up challenge
    await this.redis.del(`webauthn:challenge:${challengeId}`);

    // Audit log
    await prisma.auditLog.create({
      data: {
        action: "BIOMETRIC_AUTH",
        userId: user.id,
        resourceType: "Session",
        status: "SUCCESS",
      },
    });

    // === On-Chain Verification (Fire-and-Forget) ===
    // TODO: FUTURE ENHANCEMENT - On-chain login verification
    // Currently disabled due to signature encoding mismatch between WebAuthn DER format
    // and the P-256 precompile (ACP-204) expected format.
    //
    // To enable in future:
    // 1. Debug DER signature parsing in relayer.service.ts parseDERSignature()
    // 2. Ensure authenticatorData and clientDataHash encoding matches contract expectations
    // 3. Verify counter synchronization between DB and contract
    // 4. Uncomment the block below
    //
    // if (user.walletAddress && this.relayerService) {
    //   this.triggerOnChainVerification(
    //     user.walletAddress,
    //     response.response.authenticatorData,
    //     response.response.clientDataJSON,
    //     response.response.signature
    //   ).catch((err) => {
    //     console.error("[OnChain] Verification failed (non-blocking):", err.message);
    //   });
    // }

    return {
      token,
      expiresAt,
      user: {
        id: user.id,
        email: user.email,
        walletAddress: user.walletAddress,
        displayName: user.displayName,
        authProvider: user.authProvider as 'EMAIL' | 'GOOGLE' | 'WALLET',
      },
    };
  }

  /**
   * Verify JWT token and return session payload
   */
  async verifyToken(token: string): Promise<SessionPayload> {
    try {
      await jwtVerify(token, JWT_SECRET);
      const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

      // Check Redis cache first (faster)
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

      const sessionPayload: SessionPayload = {
        userId: session.userId,
        email: session.user.email,
        walletAddress: session.user.walletAddress,
        authProvider: session.user.authProvider as 'EMAIL' | 'GOOGLE' | 'WALLET',
      };

      // Re-cache in Redis
      const ttl = Math.floor(
        (session.expiresAt.getTime() - Date.now()) / 1000
      );
      if (ttl > 0) {
        await this.redis.setex(
          `session:${tokenHash}`,
          ttl,
          JSON.stringify(sessionPayload)
        );
      }

      return sessionPayload;
    } catch {
      throw new Error("Invalid token");
    }
  }

  /**
   * Validate session token (returns payload or null)
   * Use this instead of verifyToken when you don't want to throw on invalid tokens
   */
  async validateSession(token: string): Promise<SessionPayload | null> {
    try {
      return await this.verifyToken(token);
    } catch {
      return null;
    }
  }

  /**
   * Invalidate session (logout)
   */
  async invalidateSession(token: string): Promise<void> {
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

    // Remove from Redis
    await this.redis.del(`session:${tokenHash}`);

    // Mark as expired in database
    await prisma.session.updateMany({
      where: { tokenHash },
      data: { expiresAt: new Date() },
    });
  }

  // ==================== Helper Methods ====================

  /**
   * Extract P-256 public key coordinates from COSE format
   * COSE key format for EC2 P-256:
   * - Key type (1): 2 (EC2)
   * - Algorithm (3): -7 (ES256)
   * - Curve (-1): 1 (P-256)
   * - X coordinate (-2): 32 bytes
   * - Y coordinate (-3): 32 bytes
   */
  private extractP256PublicKey(credentialPublicKey: Uint8Array): {
    x: string;
    y: string;
  } {
    // Properly decode the CBOR-encoded COSE key
    // cbor-x returns a plain object with numeric keys (including negative), not a Map
    const coseKey = cborDecode(Buffer.from(credentialPublicKey)) as Record<number, number | Uint8Array>;

    console.log("[DEBUG] Decoded COSE key:", JSON.stringify(coseKey, (_, v) =>
      v instanceof Uint8Array ? `Uint8Array(${v.length})` : v
    ));

    // Validate it's an EC2 key with P-256 curve
    // COSE labels: 1=kty, 3=alg, -1=crv, -2=x, -3=y
    const kty = coseKey[1];
    const crv = coseKey[-1];
    if (kty !== 2) {
      throw new Error(`Invalid COSE key type: expected EC2 (2), got ${kty}`);
    }
    if (crv !== 1) {
      throw new Error(`Invalid COSE curve: expected P-256 (1), got ${crv}`);
    }

    // Extract X and Y coordinates (labels -2 and -3)
    const xBytes = coseKey[-2];
    const yBytes = coseKey[-3];

    if (!xBytes || !yBytes || !(xBytes instanceof Uint8Array) || !(yBytes instanceof Uint8Array)) {
      throw new Error("Could not extract public key coordinates from COSE key");
    }

    if (xBytes.length !== 32 || yBytes.length !== 32) {
      throw new Error(`Invalid coordinate length: x=${xBytes.length}, y=${yBytes.length} (expected 32)`);
    }

    return {
      x: "0x" + Buffer.from(xBytes).toString("hex"),
      y: "0x" + Buffer.from(yBytes).toString("hex"),
    };
  }

  /**
   * Reconstruct COSE-like public key from x,y coordinates
   * Returns format suitable for @simplewebauthn/server verification
   *
   * Manually constructs CBOR bytes to avoid compatibility issues between
   * different CBOR libraries (cbor-x vs simplewebauthn's internal decoder)
   */
  private reconstructPublicKey(x: string, y: string): Uint8Array {
    const xHex = x.replace("0x", "");
    const yHex = y.replace("0x", "");

    // Validate coordinate lengths (must be exactly 32 bytes = 64 hex chars)
    if (xHex.length !== 64) {
      throw new Error(`Invalid X coordinate length: ${xHex.length / 2} bytes (expected 32). Stored data may be corrupted - please re-register your passkey.`);
    }
    if (yHex.length !== 64) {
      throw new Error(`Invalid Y coordinate length: ${yHex.length / 2} bytes (expected 32). Stored data may be corrupted - please re-register your passkey.`);
    }

    const xBytes = Buffer.from(xHex, "hex");
    const yBytes = Buffer.from(yHex, "hex");

    // Manually construct CBOR-encoded COSE Key for EC2 (P-256)
    // This avoids compatibility issues between different CBOR implementations
    //
    // COSE Key structure:
    // Map(5) { 1: 2, 3: -7, -1: 1, -2: x_bytes(32), -3: y_bytes(32) }
    //
    // CBOR encoding:
    // A5        - Map with 5 items
    // 01 02     - Key 1 (kty), Value 2 (EC2)
    // 03 26     - Key 3 (alg), Value -7 (ES256, encoded as 0x26 = -1-6)
    // 20 01     - Key -1 (crv, encoded as 0x20 = -1-0), Value 1 (P-256)
    // 21 5820   - Key -2 (x, encoded as 0x21 = -1-1), Byte string 32 bytes (0x58 0x20)
    // [32 bytes of x]
    // 22 5820   - Key -3 (y, encoded as 0x22 = -1-2), Byte string 32 bytes
    // [32 bytes of y]

    const coseBytes = new Uint8Array(77); // 5 + 32 + 5 + 32 + 3 = 77 bytes
    let offset = 0;

    // Map header: 5 items
    coseBytes[offset++] = 0xa5;

    // Key 1 (kty): 2 (EC2)
    coseBytes[offset++] = 0x01;
    coseBytes[offset++] = 0x02;

    // Key 3 (alg): -7 (ES256)
    coseBytes[offset++] = 0x03;
    coseBytes[offset++] = 0x26; // -7 encoded as negative int

    // Key -1 (crv): 1 (P-256)
    coseBytes[offset++] = 0x20; // -1 encoded
    coseBytes[offset++] = 0x01;

    // Key -2 (x): 32-byte string
    coseBytes[offset++] = 0x21; // -2 encoded
    coseBytes[offset++] = 0x58; // byte string, 1-byte length follows
    coseBytes[offset++] = 0x20; // 32 bytes
    coseBytes.set(xBytes, offset);
    offset += 32;

    // Key -3 (y): 32-byte string
    coseBytes[offset++] = 0x22; // -3 encoded
    coseBytes[offset++] = 0x58; // byte string, 1-byte length follows
    coseBytes[offset++] = 0x20; // 32 bytes
    coseBytes.set(yBytes, offset);

    return coseBytes;
  }

  /**
   * Compute smart wallet address from P-256 public key via factory contract
   * This returns the actual CREATE2-computed address that the factory will deploy
   */
  private async computeSmartWalletAddress(
    publicKeyX: string,
    publicKeyY: string,
    credentialId: string
  ): Promise<string> {
    const rpcUrl = process.env.AVALANCHE_RPC_URL || "https://api.avax-test.network/ext/bc/C/rpc";
    const factoryAddress = process.env.P256_WALLET_FACTORY_ADDRESS;

    if (!factoryAddress) {
      console.warn("[WebAuthn] P256_WALLET_FACTORY_ADDRESS not set, using fallback address derivation");
      // Fallback to hash-based derivation (for local dev without factory)
      const publicKeyConcat = publicKeyX.replace("0x", "") + publicKeyY.replace("0x", "");
      const hash = crypto.createHash("sha256").update(Buffer.from(publicKeyConcat, "hex")).digest("hex");
      return "0x" + hash.slice(-40);
    }

    try {
      const provider = new JsonRpcProvider(rpcUrl);

      // Convert to bytes32 format
      const pkX = this.toBytes32(publicKeyX);
      const pkY = this.toBytes32(publicKeyY);
      const credId = this.credentialIdToBytes32(credentialId);

      const calldata = FACTORY_INTERFACE.encodeFunctionData("getAddress", [pkX, pkY, credId]);
      const result = await provider.send("eth_call", [
        { to: factoryAddress, data: calldata },
        "latest",
      ]);

      const decoded = FACTORY_INTERFACE.decodeFunctionResult("getAddress", result);
      const walletAddress = decoded[0] as string;
      console.log(`[WebAuthn] Smart wallet address from factory: ${walletAddress}`);
      return walletAddress;
    } catch (error) {
      console.error("[WebAuthn] Failed to get wallet address from factory:", error);
      // Fallback to hash-based derivation
      const publicKeyConcat = publicKeyX.replace("0x", "") + publicKeyY.replace("0x", "");
      const hash = crypto.createHash("sha256").update(Buffer.from(publicKeyConcat, "hex")).digest("hex");
      return "0x" + hash.slice(-40);
    }
  }

  /**
   * Convert hex string to bytes32 (pad left with zeros)
   */
  private toBytes32(hex: string): string {
    const clean = hex.replace("0x", "");
    return "0x" + clean.padStart(64, "0");
  }

  /**
   * Convert base64url credential ID to bytes32
   * Must match userop.service.ts logic: trailing zeros, not leading
   */
  private credentialIdToBytes32(credentialId: string): string {
    const buffer = Buffer.from(credentialId, "base64url");
    const bytes32 = Buffer.alloc(32);
    buffer.copy(bytes32, 0, 0, Math.min(32, buffer.length));
    return "0x" + bytes32.toString("hex");
  }

  /**
   * Trigger on-chain biometric registration (fire-and-forget)
   *
   * CRITICAL: This method MUST NOT throw or block. Any failure is logged
   * but does not affect the WebAuthn registration flow.
   *
   * @param userAddress - User's derived wallet address
   * @param publicKeyX - P-256 X coordinate (hex with 0x prefix)
   * @param publicKeyY - P-256 Y coordinate (hex with 0x prefix)
   * @param credentialId - WebAuthn credential ID
   * @param biometricId - Database ID for updating onChainTxHash
   */
  private async triggerOnChainRegistration(
    userAddress: string,
    publicKeyX: string,
    publicKeyY: string,
    credentialId: string,
    biometricId?: string
  ): Promise<void> {
    if (!this.relayerService) {
      console.log("[OnChain] RelayerService not initialized, skipping");
      return;
    }

    try {
      // Check relayer has sufficient funds
      const hasBalance = await this.relayerService.hasSufficientBalance(0.01);
      if (!hasBalance) {
        console.warn("[OnChain] Relayer balance too low, skipping on-chain registration");
        return;
      }

      console.log(`[OnChain] Starting registration for ${userAddress}`);

      // Execute on-chain registration
      const result = await this.relayerService.registerBiometric(
        userAddress,
        publicKeyX,
        publicKeyY,
        credentialId
      );

      console.log(`[OnChain] Success: txHash=${result.txHash}, block=${result.blockNumber}, gas=${result.gasUsed}`);

      // Update database with transaction hash (for user visibility/tracking)
      if (biometricId) {
        await prisma.biometricIdentity.update({
          where: { id: biometricId },
          data: {
            // Store tx hash in deviceInfo JSON (no schema change needed)
            deviceInfo: {
              ...(await prisma.biometricIdentity.findUnique({
                where: { id: biometricId },
                select: { deviceInfo: true }
              }))?.deviceInfo as object || {},
              onChainTxHash: result.txHash,
              onChainBlock: result.blockNumber,
              onChainStatus: result.status,
            }
          },
        });
        console.log(`[OnChain] Updated biometricIdentity ${biometricId} with txHash`);
      }
    } catch (error: any) {
      // Check for "already registered" - this is OK, not an error
      if (error.message?.includes("already has registered identity")) {
        console.log(`[OnChain] User ${userAddress} already registered on-chain (OK)`);
        return;
      }

      // Log error but NEVER re-throw
      console.error(`[OnChain] Registration failed for ${userAddress}:`, error.message);

      // Create audit log for on-chain failure (for debugging)
      try {
        await prisma.auditLog.create({
          data: {
            action: "ONCHAIN_REGISTER",
            resourceType: "BiometricIdentity",
            resourceId: biometricId || "unknown",
            status: "FAILURE",
            metadata: {
              userAddress,
              error: error.message,
            },
          },
        });
      } catch (auditError) {
        // Even audit log failure should not propagate
        console.error("[OnChain] Audit log also failed:", (auditError as Error).message);
      }
    }
  }

  /**
   * Trigger on-chain biometric verification (fire-and-forget)
   * Called on every passkey login for hackathon demo
   *
   * CRITICAL: This method MUST NOT throw or block. Any failure is logged
   * but does not affect the login flow.
   */
  private async triggerOnChainVerification(
    userAddress: string,
    authenticatorDataB64: string,
    clientDataJSONB64: string,
    signatureB64: string
  ): Promise<void> {
    if (!this.relayerService) {
      console.log("[OnChain] RelayerService not initialized, skipping verification");
      return;
    }

    try {
      // Check relayer has sufficient funds
      const hasBalance = await this.relayerService.hasSufficientBalance(0.01);
      if (!hasBalance) {
        console.warn("[OnChain] Relayer balance too low, skipping on-chain verification");
        return;
      }

      // Decode base64url to buffers
      const authenticatorData = Buffer.from(authenticatorDataB64, "base64url");
      const clientDataJSON = Buffer.from(clientDataJSONB64, "base64url");
      const signature = Buffer.from(signatureB64, "base64url");

      console.log(`[OnChain] Starting verification for ${userAddress}`);

      // Execute on-chain verification
      const result = await this.relayerService.verifyBiometricOnChain(
        userAddress,
        authenticatorData,
        clientDataJSON,
        signature
      );

      console.log(`[OnChain] Verification Success: txHash=${result.txHash}, block=${result.blockNumber}, gas=${result.gasUsed}`);

    } catch (error: any) {
      // Check for expected errors that aren't problems
      if (error.message?.includes("IdentityNotFound")) {
        console.log(`[OnChain] User ${userAddress} not registered on-chain yet (OK for existing users)`);
        return;
      }

      // Log error but NEVER re-throw
      console.error(`[OnChain] Verification failed for ${userAddress}:`, error.message);
    }
  }
}
