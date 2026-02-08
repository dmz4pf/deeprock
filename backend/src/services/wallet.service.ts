import { SiweMessage, generateNonce } from "siwe";
import { PrismaClient } from "@prisma/client";
import { Redis } from "ioredis";
import { getAddress } from "ethers";

const prisma = new PrismaClient();

// Configuration
const SIWE_DOMAIN = process.env.SIWE_DOMAIN || "localhost";
const SIWE_URI = process.env.SIWE_URI || "http://localhost:3000";
const NONCE_TTL_SECONDS = 300; // 5 minutes

export interface SiweNonceResult {
  nonce: string;
  expiresAt: Date;
}

export interface SiweMessageParams {
  domain: string;
  address: string;
  statement: string;
  uri: string;
  version: string;
  chainId: number;
  nonce: string;
  issuedAt: string;
  expirationTime?: string;
}

export interface SiweVerifyResult {
  user: {
    id: string;
    email: string | null;
    walletAddress: string | null;
    displayName: string | null;
    authProvider: "EMAIL" | "GOOGLE" | "WALLET";
  };
  isNewUser: boolean;
}

export class WalletAuthService {
  constructor(private redis: Redis) {}

  /**
   * Generate SIWE nonce for wallet authentication
   */
  async generateNonce(walletAddress: string): Promise<SiweNonceResult> {
    // Normalize address to checksum format
    const normalizedAddress = walletAddress.toLowerCase();

    const nonce = generateNonce();
    const expiresAt = new Date(Date.now() + NONCE_TTL_SECONDS * 1000);

    // Store nonce in Redis
    await this.redis.setex(
      `siwe:nonce:${normalizedAddress}`,
      NONCE_TTL_SECONDS,
      JSON.stringify({
        nonce,
        createdAt: Date.now(),
      })
    );

    return { nonce, expiresAt };
  }

  /**
   * Generate the SIWE message for signing
   */
  generateMessage(
    address: string,
    nonce: string,
    chainId: number = 43113 // Avalanche Fuji testnet
  ): string {
    // EIP-55: Checksum the address for SIWE compliance
    const checksumAddress = getAddress(address);

    const siweMessage = new SiweMessage({
      domain: SIWE_DOMAIN,
      address: checksumAddress,
      statement: "Sign in to RWA Gateway with your wallet.",
      uri: SIWE_URI,
      version: "1",
      chainId,
      nonce,
      issuedAt: new Date().toISOString(),
      expirationTime: new Date(Date.now() + NONCE_TTL_SECONDS * 1000).toISOString(),
    });

    return siweMessage.prepareMessage();
  }

  /**
   * Verify SIWE signature and authenticate user
   */
  async verifySignature(
    message: string,
    signature: string
  ): Promise<SiweVerifyResult> {
    // Parse the SIWE message
    const siweMessage = new SiweMessage(message);

    // Verify the nonce exists and is valid
    const normalizedAddress = siweMessage.address.toLowerCase();
    const storedNonceData = await this.redis.get(`siwe:nonce:${normalizedAddress}`);

    if (!storedNonceData) {
      throw new Error("Nonce expired or not found");
    }

    const { nonce: storedNonce } = JSON.parse(storedNonceData);
    if (storedNonce !== siweMessage.nonce) {
      throw new Error("Invalid nonce");
    }

    // Verify the signature
    try {
      const fields = await siweMessage.verify({
        signature,
        domain: SIWE_DOMAIN,
        nonce: storedNonce,
      });

      if (!fields.success) {
        throw new Error("Signature verification failed");
      }
    } catch (error) {
      throw new Error("Invalid signature");
    }

    // Delete nonce (prevent replay)
    await this.redis.del(`siwe:nonce:${normalizedAddress}`);

    // Find or create user by wallet address
    const walletAddress = siweMessage.address; // Keep original case (checksum)

    let user = await prisma.user.findUnique({
      where: { walletAddress },
    });

    let isNewUser = false;

    if (!user) {
      isNewUser = true;
      user = await prisma.user.create({
        data: {
          walletAddress,
          displayName: `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`,
          authProvider: "WALLET",
        },
      });

      // Audit log
      await prisma.auditLog.create({
        data: {
          action: "USER_REGISTERED",
          userId: user.id,
          status: "SUCCESS",
          metadata: {
            provider: "WALLET",
            walletAddress,
          },
        },
      });
    } else {
      // Audit log for login
      await prisma.auditLog.create({
        data: {
          action: "WALLET_AUTH",
          userId: user.id,
          status: "SUCCESS",
        },
      });
    }

    return {
      user: {
        id: user.id,
        email: user.email,
        walletAddress: user.walletAddress,
        displayName: user.displayName,
        authProvider: user.authProvider as "EMAIL" | "GOOGLE" | "WALLET",
      },
      isNewUser,
    };
  }
}
