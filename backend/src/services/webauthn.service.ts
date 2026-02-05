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
  constructor(private redis: Redis) {}

  /**
   * Generate registration options for a new user
   */
  async generateRegistrationOptions(email: string, displayName?: string) {
    // Check if user already exists with biometrics
    const existingUser = await prisma.user.findUnique({
      where: { email },
      include: { biometricIdentities: { where: { isActive: true } } },
    });

    if (existingUser?.biometricIdentities.length) {
      throw new Error("User already registered with biometrics");
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

    const { credentialID, credentialPublicKey, counter, credentialDeviceType, credentialBackedUp } =
      verification.registrationInfo;

    // Extract P-256 public key coordinates from COSE format
    const publicKey = this.extractP256PublicKey(credentialPublicKey);

    // Create user and biometric identity atomically
    const user = await prisma.$transaction(async (tx) => {
      // Derive deterministic wallet address from public key
      const walletAddress = this.deriveWalletAddress(publicKey.x, publicKey.y);

      // Check if wallet address already exists
      const existingWallet = await tx.user.findUnique({
        where: { walletAddress },
      });
      if (existingWallet) {
        throw new Error("Wallet address already registered");
      }

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
                deviceType: credentialDeviceType,
                backedUp: credentialBackedUp,
                transports: response.response.transports,
              },
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

    // Clean up challenge
    await this.redis.del(`webauthn:challenge:${challengeId}`);

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
        id: cred.credentialId, // Already base64url string
        transports: (cred.deviceInfo as Record<string, unknown>)?.transports as
          | AuthenticatorTransportFuture[]
          | undefined,
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
    const stored = await this.redis.get(`webauthn:challenge:${challengeId}`);
    if (!stored) {
      throw new Error("Challenge expired or not found");
    }

    const { challenge, userId } = JSON.parse(stored);

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { biometricIdentities: { where: { isActive: true } } },
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

    const verification: VerifiedAuthenticationResponse =
      await verifyAuthenticationResponse({
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

    // Update counter (replay protection)
    await prisma.biometricIdentity.update({
      where: { id: credential.id },
      data: { authCounter: verification.authenticationInfo.newCounter },
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
    const keyBytes = Buffer.from(credentialPublicKey);

    // The COSE key is CBOR encoded. For P-256, we need to find the x and y coordinates.
    // SimpleWebAuthn returns a COSE_Key structure. We'll parse it to extract x,y.

    // Find uncompressed point (0x04 prefix) if present
    let xStart = -1;

    // COSE keys have x at label -2 and y at label -3
    // For simplicity, we scan for the 32-byte coordinate pairs
    // In COSE EC2 keys, coordinates are typically at predictable offsets

    // Method: Look for 0x04 marker (uncompressed point) or parse CBOR
    const idx = keyBytes.indexOf(0x04);
    if (idx !== -1 && keyBytes.length >= idx + 65) {
      xStart = idx + 1;
    } else {
      // Fallback: COSE-specific parsing
      // X coordinate typically follows after CBOR map headers
      // For ES256, the structure is predictable
      // Look for byte sequences of length 32
      for (let i = 0; i < keyBytes.length - 64; i++) {
        // Check if this could be start of x coordinate (after some CBOR header)
        if (keyBytes[i] === 0x58 && keyBytes[i + 1] === 0x20) {
          // bstr(32) CBOR encoding
          xStart = i + 2;
          break;
        }
      }
    }

    if (xStart === -1 || xStart + 64 > keyBytes.length) {
      throw new Error("Could not extract public key coordinates from COSE key");
    }

    const xBytes = keyBytes.subarray(xStart, xStart + 32);

    // Y coordinate follows X, possibly with CBOR header
    let yStart = xStart + 32;
    if (keyBytes[yStart] === 0x58 && keyBytes[yStart + 1] === 0x20) {
      yStart += 2;
    }

    const yBytes = keyBytes.subarray(yStart, yStart + 32);

    return {
      x: "0x" + xBytes.toString("hex").padStart(64, "0"),
      y: "0x" + yBytes.toString("hex").padStart(64, "0"),
    };
  }

  /**
   * Reconstruct COSE-like public key from x,y coordinates
   * Returns format suitable for @simplewebauthn/server verification
   */
  private reconstructPublicKey(x: string, y: string): Uint8Array {
    const xBytes = Buffer.from(x.replace("0x", ""), "hex");
    const yBytes = Buffer.from(y.replace("0x", ""), "hex");

    // Return uncompressed point format (0x04 || x || y)
    // This is what SimpleWebAuthn expects for verification
    return new Uint8Array(
      Buffer.concat([Buffer.from([0x04]), xBytes, yBytes])
    );
  }

  /**
   * Derive deterministic wallet address from P-256 public key
   * Uses keccak256 hash of coordinates, taking last 20 bytes
   */
  private deriveWalletAddress(x: string, y: string): string {
    // Concatenate x and y coordinates
    const publicKeyConcat = x.replace("0x", "") + y.replace("0x", "");

    // SHA-256 hash (Ethereum-style would use keccak256, but SHA-256 is simpler for our use)
    const hash = crypto
      .createHash("sha256")
      .update(Buffer.from(publicKeyConcat, "hex"))
      .digest("hex");

    // Take last 40 characters (20 bytes) as address
    return "0x" + hash.slice(-40);
  }
}
