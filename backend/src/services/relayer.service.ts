import { ethers, JsonRpcProvider, Wallet, Contract, TransactionReceipt } from "ethers";
import { Redis } from "ioredis";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// BiometricRegistry ABI - minimal subset for relayer operations
const BIOMETRIC_REGISTRY_ABI = [
  "function register(bytes32 publicKeyX, bytes32 publicKeyY, bytes32 credentialId) external",
  "function registerViaRelayer(address user, bytes32 publicKeyX, bytes32 publicKeyY, bytes32 credentialId, uint256 deadline, uint256 nonce, bytes32 r, bytes32 s) external",
  "function hasIdentity(address user) external view returns (bool)",
  "function getIdentity(address user) external view returns (bytes32 publicKeyX, bytes32 publicKeyY, bytes32 credentialId, uint64 registeredAt, uint64 lastUsed, uint32 counter, bool active)",
  "function trustedRelayers(address) external view returns (bool)",
  "event IdentityRegistered(address indexed user, bytes32 indexed credentialId, bytes32 publicKeyX, bytes32 publicKeyY, uint256 timestamp)",
];

// Configuration
const NONCE_LOCK_TTL = 30; // seconds
const RATE_LIMIT_WINDOW = 60; // seconds
const DEFAULT_GAS_LIMIT = 250_000n;

export interface RelayerConfig {
  rpcUrl: string;
  privateKey: string;
  biometricRegistryAddress: string;
  chainId: number;
}

export interface TransactionResult {
  txHash: string;
  blockNumber: number;
  gasUsed: string;
  status: "success" | "failed";
}

export interface RelayerStatus {
  address: string;
  balance: string;
  nonce: number;
  isTrustedRelayer: boolean;
  chainId: number;
}

export class RelayerService {
  private provider: JsonRpcProvider;
  private wallet: Wallet;
  private biometricRegistry: Contract;
  private chainId: number;

  constructor(
    private redis: Redis,
    config?: Partial<RelayerConfig>
  ) {
    const rpcUrl = config?.rpcUrl || process.env.AVALANCHE_RPC_URL || "https://api.avax-test.network/ext/bc/C/rpc";
    const privateKey = config?.privateKey || process.env.RELAYER_PRIVATE_KEY;
    const registryAddress = config?.biometricRegistryAddress || process.env.BIOMETRIC_REGISTRY_ADDRESS;

    if (!privateKey) {
      throw new Error("RELAYER_PRIVATE_KEY environment variable required");
    }
    if (!registryAddress) {
      throw new Error("BIOMETRIC_REGISTRY_ADDRESS environment variable required");
    }

    this.chainId = config?.chainId || parseInt(process.env.CHAIN_ID || "43113"); // Fuji testnet
    this.provider = new JsonRpcProvider(rpcUrl, this.chainId);
    this.wallet = new Wallet(privateKey, this.provider);
    this.biometricRegistry = new Contract(
      registryAddress,
      BIOMETRIC_REGISTRY_ABI,
      this.wallet
    );
  }

  // ==================== Registration Operations ====================

  /**
   * Register a biometric identity on-chain via the relayer
   * This is a gasless operation for the user
   */
  async registerBiometric(
    userAddress: string,
    publicKeyX: string,
    publicKeyY: string,
    credentialId: string
  ): Promise<TransactionResult> {
    // Rate limit check
    await this.checkRateLimit(userAddress, "register", 1);

    // Check if user already has identity
    const hasIdentity = await this.biometricRegistry.hasIdentity(userAddress);
    if (hasIdentity) {
      throw new Error("User already has registered identity on-chain");
    }

    // Convert to bytes32 format
    const pubKeyX = this.toBytes32(publicKeyX);
    const pubKeyY = this.toBytes32(publicKeyY);
    const credId = this.credentialIdToBytes32(credentialId);

    // Get locked nonce to prevent race conditions
    const nonce = await this.getLockedNonce();

    try {
      // Estimate gas first
      const gasEstimate = await this.biometricRegistry.register.estimateGas(
        pubKeyX,
        pubKeyY,
        credId
      );

      // Add 20% buffer to gas estimate
      const gasLimit = (gasEstimate * 120n) / 100n;

      // Submit transaction
      const tx = await this.biometricRegistry.register(
        pubKeyX,
        pubKeyY,
        credId,
        {
          nonce,
          gasLimit: gasLimit > DEFAULT_GAS_LIMIT ? gasLimit : DEFAULT_GAS_LIMIT,
        }
      );

      // Wait for confirmation (2 blocks on Avalanche)
      const receipt: TransactionReceipt = await tx.wait(2);

      // Log successful registration
      await this.logTransaction(userAddress, "BIOMETRIC_REGISTER", tx.hash, receipt);

      return {
        txHash: receipt.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString(),
        status: receipt.status === 1 ? "success" : "failed",
      };
    } catch (error: any) {
      // Log failed transaction attempt
      await this.logTransactionError(userAddress, "BIOMETRIC_REGISTER", error);
      throw new Error(`Registration failed: ${error.message}`);
    } finally {
      await this.releaseNonceLock();
    }
  }

  /**
   * Register via relayer with user signature (meta-transaction)
   * User signs the registration intent, relayer submits on their behalf
   */
  async registerBiometricWithSignature(
    userAddress: string,
    publicKeyX: string,
    publicKeyY: string,
    credentialId: string,
    deadline: number,
    userNonce: bigint,
    r: string,
    s: string
  ): Promise<TransactionResult> {
    // Rate limit check
    await this.checkRateLimit(userAddress, "register", 1);

    // Validate deadline
    if (deadline < Math.floor(Date.now() / 1000)) {
      throw new Error("Signature deadline expired");
    }

    const pubKeyX = this.toBytes32(publicKeyX);
    const pubKeyY = this.toBytes32(publicKeyY);
    const credId = this.credentialIdToBytes32(credentialId);

    const nonce = await this.getLockedNonce();

    try {
      const tx = await this.biometricRegistry.registerViaRelayer(
        userAddress,
        pubKeyX,
        pubKeyY,
        credId,
        deadline,
        userNonce,
        r,
        s,
        { nonce, gasLimit: DEFAULT_GAS_LIMIT }
      );

      const receipt: TransactionReceipt = await tx.wait(2);

      await this.logTransaction(userAddress, "BIOMETRIC_REGISTER_META", tx.hash, receipt);

      return {
        txHash: receipt.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString(),
        status: receipt.status === 1 ? "success" : "failed",
      };
    } catch (error: any) {
      await this.logTransactionError(userAddress, "BIOMETRIC_REGISTER_META", error);
      throw new Error(`Meta-transaction registration failed: ${error.message}`);
    } finally {
      await this.releaseNonceLock();
    }
  }

  // ==================== Relayer Status ====================

  /**
   * Get relayer wallet status and health information
   */
  async getStatus(): Promise<RelayerStatus> {
    const [balance, nonce, isTrusted] = await Promise.all([
      this.provider.getBalance(this.wallet.address),
      this.wallet.getNonce(),
      this.biometricRegistry.trustedRelayers(this.wallet.address) as Promise<boolean>,
    ]);

    return {
      address: this.wallet.address,
      balance: ethers.formatEther(balance),
      nonce,
      isTrustedRelayer: isTrusted,
      chainId: this.chainId,
    };
  }

  /**
   * Check if relayer has sufficient balance for operations
   */
  async hassufficientBalance(minAvax: number = 0.1): Promise<boolean> {
    const balance = await this.provider.getBalance(this.wallet.address);
    const minBalance = ethers.parseEther(minAvax.toString());
    return balance >= minBalance;
  }

  /**
   * Estimate gas cost for a registration
   */
  async estimateRegistrationGas(
    publicKeyX: string,
    publicKeyY: string,
    credentialId: string
  ): Promise<{ gasEstimate: string; gasCostAvax: string }> {
    const pubKeyX = this.toBytes32(publicKeyX);
    const pubKeyY = this.toBytes32(publicKeyY);
    const credId = this.credentialIdToBytes32(credentialId);

    const gasEstimate = await this.biometricRegistry.register.estimateGas(
      pubKeyX,
      pubKeyY,
      credId
    );

    const feeData = await this.provider.getFeeData();
    const gasPrice = feeData.gasPrice || ethers.parseUnits("25", "gwei");
    const gasCost = gasEstimate * gasPrice;

    return {
      gasEstimate: gasEstimate.toString(),
      gasCostAvax: ethers.formatEther(gasCost),
    };
  }

  // ==================== Nonce Management ====================

  /**
   * Get nonce with distributed lock to prevent concurrent transaction issues
   */
  private async getLockedNonce(): Promise<number> {
    const lockKey = "relayer:nonce:lock";
    const lockValue = `${Date.now()}-${Math.random()}`;

    // Try to acquire lock with retries
    let attempts = 0;
    const maxAttempts = 10;
    const retryDelay = 500; // ms

    while (attempts < maxAttempts) {
      const acquired = await this.redis.set(
        lockKey,
        lockValue,
        "EX",
        NONCE_LOCK_TTL,
        "NX"
      );

      if (acquired === "OK") {
        // Store lock value for release verification
        await this.redis.set("relayer:nonce:lock:value", lockValue, "EX", NONCE_LOCK_TTL);

        // Get current nonce from chain
        const nonce = await this.wallet.getNonce();
        return nonce;
      }

      attempts++;
      await this.delay(retryDelay);
    }

    throw new Error("Could not acquire nonce lock - relayer busy");
  }

  /**
   * Release nonce lock after transaction
   */
  private async releaseNonceLock(): Promise<void> {
    const lockKey = "relayer:nonce:lock";
    const lockValueKey = "relayer:nonce:lock:value";

    // Only release if we own the lock
    const storedValue = await this.redis.get(lockValueKey);
    if (storedValue) {
      await this.redis.del(lockKey, lockValueKey);
    }
  }

  // ==================== Rate Limiting ====================

  /**
   * Check and enforce rate limits for operations
   */
  private async checkRateLimit(
    userId: string,
    operation: string,
    maxPerWindow: number
  ): Promise<void> {
    const key = `ratelimit:relayer:${operation}:${userId}`;
    const now = Date.now();
    const windowStart = now - RATE_LIMIT_WINDOW * 1000;

    // Use Redis sorted set for sliding window
    const multi = this.redis.multi();

    // Remove old entries
    multi.zremrangebyscore(key, 0, windowStart);

    // Count current entries
    multi.zcard(key);

    // Add current request
    multi.zadd(key, now, `${now}-${Math.random()}`);

    // Set TTL
    multi.expire(key, RATE_LIMIT_WINDOW);

    const results = await multi.exec();
    const count = results?.[1]?.[1] as number || 0;

    if (count >= maxPerWindow) {
      throw new Error(`Rate limit exceeded: max ${maxPerWindow} ${operation}(s) per ${RATE_LIMIT_WINDOW} seconds`);
    }
  }

  // ==================== Logging ====================

  /**
   * Log successful transaction to database
   */
  private async logTransaction(
    userId: string,
    action: string,
    txHash: string,
    receipt: TransactionReceipt
  ): Promise<void> {
    try {
      // Find user by wallet address
      const user = await prisma.user.findFirst({
        where: { walletAddress: userId },
      });

      await prisma.auditLog.create({
        data: {
          action,
          userId: user?.id,
          resourceType: "Transaction",
          resourceId: txHash,
          status: receipt.status === 1 ? "SUCCESS" : "FAILURE",
          metadata: {
            txHash,
            blockNumber: receipt.blockNumber,
            gasUsed: receipt.gasUsed.toString(),
          },
        },
      });
    } catch (error) {
      console.error("Failed to log transaction:", error);
    }
  }

  /**
   * Log failed transaction attempt
   */
  private async logTransactionError(
    userId: string,
    action: string,
    error: Error
  ): Promise<void> {
    try {
      const user = await prisma.user.findFirst({
        where: { walletAddress: userId },
      });

      await prisma.auditLog.create({
        data: {
          action,
          userId: user?.id,
          resourceType: "Transaction",
          status: "FAILURE",
          metadata: {
            error: error.message,
          },
        },
      });
    } catch (logError) {
      console.error("Failed to log transaction error:", logError);
    }
  }

  // ==================== Utility Methods ====================

  /**
   * Convert hex string to bytes32 format
   */
  private toBytes32(hex: string): string {
    // Remove 0x prefix if present
    const clean = hex.replace("0x", "");
    // Pad to 64 characters (32 bytes)
    const padded = clean.padStart(64, "0");
    return "0x" + padded;
  }

  /**
   * Convert base64url credential ID to bytes32
   */
  private credentialIdToBytes32(credentialId: string): string {
    // Decode base64url to buffer
    const buffer = Buffer.from(credentialId, "base64url");
    // Take first 32 bytes or pad if shorter
    const bytes32 = Buffer.alloc(32);
    buffer.copy(bytes32, 0, 0, Math.min(32, buffer.length));
    return "0x" + bytes32.toString("hex");
  }

  /**
   * Helper delay function
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
