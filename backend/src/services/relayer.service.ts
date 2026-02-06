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
  "function verifyWebAuthn(address user, bytes authenticatorData, bytes32 clientDataHash, bytes32 r, bytes32 s, uint32 counter) external returns (bool valid)",
  "event IdentityRegistered(address indexed user, bytes32 indexed credentialId, bytes32 publicKeyX, bytes32 publicKeyY, uint256 timestamp)",
  "event IdentityVerified(address indexed user, uint32 newCounter, uint256 timestamp)",
];

// RWAPool ABI - for investment operations
const RWA_POOL_ABI = [
  "function investViaRelayer(uint256 chainPoolId, address investor, uint256 amount, uint256 deadline, uint256 nonce, bytes signature) external",
  "function investWithPermit(uint256 chainPoolId, address investor, uint256 amount, uint256 deadline, uint8 v, bytes32 r, bytes32 s) external",
  "function redeemViaRelayer(uint256 chainPoolId, address investor, uint256 shares, uint256 deadline, uint256 nonce, bytes signature) external",
  "function getPool(uint256 chainPoolId) external view returns (uint256 totalDeposited, uint256 totalShares, uint256 minInvestment, uint256 maxInvestment, bool active)",
  "function getPosition(uint256 chainPoolId, address user) external view returns (uint256 shares, uint256 depositedAmount, uint256 lastDepositTime)",
  "function isPoolActive(uint256 chainPoolId) external view returns (bool)",
  "function trustedRelayers(address) external view returns (bool)",
  "event Investment(uint256 indexed chainPoolId, address indexed investor, uint256 amount, uint256 shares, uint256 timestamp)",
  "event Redemption(uint256 indexed chainPoolId, address indexed investor, uint256 shares, uint256 amount, uint256 timestamp)",
];

// MockUSDC ABI - for faucet and permit operations
const MOCK_USDC_ABI = [
  "function balanceOf(address account) external view returns (uint256)",
  "function approve(address spender, uint256 amount) external returns (bool)",
  "function allowance(address owner, address spender) external view returns (uint256)",
  "function transfer(address to, uint256 amount) external returns (bool)",
  "function faucet() external",
  "function faucetAmount(uint256 amount) external",
  "function faucetTo(address to, uint256 amount) external",
  // EIP-2612 Permit functions
  "function nonces(address owner) external view returns (uint256)",
  "function DOMAIN_SEPARATOR() external view returns (bytes32)",
  "function permit(address owner, address spender, uint256 value, uint256 deadline, uint8 v, bytes32 r, bytes32 s) external",
  "function name() external view returns (string)",
];

// Configuration
const NONCE_LOCK_TTL = 30; // seconds
const RATE_LIMIT_WINDOW = 60; // seconds
const DEFAULT_GAS_LIMIT = 250_000n;

export interface RelayerConfig {
  rpcUrl: string;
  privateKey: string;
  biometricRegistryAddress: string;
  rwaPoolAddress?: string;
  mockUsdcAddress?: string;
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
  private rwaPool: Contract | null = null;
  private mockUsdc: Contract | null = null;
  private chainId: number;

  constructor(
    private redis: Redis,
    config?: Partial<RelayerConfig>
  ) {
    const rpcUrl = config?.rpcUrl || process.env.AVALANCHE_RPC_URL || "https://api.avax-test.network/ext/bc/C/rpc";
    const privateKey = config?.privateKey || process.env.RELAYER_PRIVATE_KEY;
    const registryAddress = config?.biometricRegistryAddress || process.env.BIOMETRIC_REGISTRY_ADDRESS;
    const poolAddress = config?.rwaPoolAddress || process.env.RWA_POOL_ADDRESS;
    const usdcAddress = config?.mockUsdcAddress || process.env.MOCK_USDC_ADDRESS;

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

    // Initialize RWA Pool if address provided
    if (poolAddress) {
      this.rwaPool = new Contract(poolAddress, RWA_POOL_ABI, this.wallet);
      console.log(`[Relayer] RWAPool initialized at ${poolAddress}`);
    }

    // Initialize MockUSDC if address provided
    if (usdcAddress) {
      this.mockUsdc = new Contract(usdcAddress, MOCK_USDC_ABI, this.wallet);
      console.log(`[Relayer] MockUSDC initialized at ${usdcAddress}`);
    }
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

  // ==================== On-Chain Verification ====================

  /**
   * Verify a WebAuthn authentication on-chain
   * This triggers a blockchain transaction for each login (hackathon demo)
   */
  async verifyBiometricOnChain(
    userAddress: string,
    authenticatorData: Buffer,
    clientDataJSON: Buffer,
    signature: Buffer
  ): Promise<TransactionResult> {
    // Rate limit: max 10 verifications per minute per user
    await this.checkRateLimit(userAddress, "verify", 10);

    // Parse DER-encoded signature to extract r,s
    const { r, s } = this.parseDERSignature(signature);

    // Compute clientDataHash
    const crypto = await import("crypto");
    const clientDataHash = crypto.createHash("sha256").update(clientDataJSON).digest();

    // Get current counter from contract
    const identity = await this.biometricRegistry.getIdentity(userAddress);
    const counter = identity.counter;

    const nonce = await this.getLockedNonce();

    try {
      const tx = await this.biometricRegistry.verifyWebAuthn(
        userAddress,
        authenticatorData,
        clientDataHash,
        "0x" + r.toString("hex").padStart(64, "0"),
        "0x" + s.toString("hex").padStart(64, "0"),
        counter,
        { nonce, gasLimit: DEFAULT_GAS_LIMIT }
      );

      const receipt: TransactionReceipt = await tx.wait(2);

      await this.logTransaction(userAddress, "BIOMETRIC_VERIFY", tx.hash, receipt);

      return {
        txHash: receipt.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString(),
        status: receipt.status === 1 ? "success" : "failed",
      };
    } catch (error: any) {
      await this.logTransactionError(userAddress, "BIOMETRIC_VERIFY", error);
      throw new Error(`On-chain verification failed: ${error.message}`);
    } finally {
      await this.releaseNonceLock();
    }
  }

  /**
   * Parse DER-encoded ECDSA signature to extract r and s values
   */
  private parseDERSignature(sig: Buffer): { r: Buffer; s: Buffer } {
    // DER format: 0x30 [total-length] 0x02 [r-length] [r] 0x02 [s-length] [s]
    let offset = 0;

    if (sig[offset++] !== 0x30) throw new Error("Invalid DER signature");
    offset++; // Skip total length

    if (sig[offset++] !== 0x02) throw new Error("Invalid DER signature (r)");
    const rLen = sig[offset++];
    let r = sig.subarray(offset, offset + rLen);
    offset += rLen;

    if (sig[offset++] !== 0x02) throw new Error("Invalid DER signature (s)");
    const sLen = sig[offset++];
    let s = sig.subarray(offset, offset + sLen);

    // Remove leading zeros if present (DER uses signed integers)
    if (r[0] === 0x00 && r.length > 32) r = r.subarray(1);
    if (s[0] === 0x00 && s.length > 32) s = s.subarray(1);

    // Pad to 32 bytes if needed
    if (r.length < 32) r = Buffer.concat([Buffer.alloc(32 - r.length), r]);
    if (s.length < 32) s = Buffer.concat([Buffer.alloc(32 - s.length), s]);

    return { r, s };
  }

  // ==================== Investment Operations ====================

  /**
   * Submit investment via relayer (meta-transaction)
   * @param chainPoolId The on-chain pool ID
   * @param investorAddress The investor's wallet address
   * @param amount Investment amount in USDC (6 decimals)
   * @param signature Passkey signature (for audit purposes - verification done in backend)
   */
  async submitInvestment(
    chainPoolId: number,
    investorAddress: string,
    amount: bigint,
    signature: string = "0x"
  ): Promise<TransactionResult> {
    if (!this.rwaPool) {
      throw new Error("RWA Pool not configured - set RWA_POOL_ADDRESS");
    }

    // Rate limit check
    await this.checkRateLimit(investorAddress, "invest", 5);

    // Generate deadline (5 minutes from now)
    const deadline = Math.floor(Date.now() / 1000) + 300;

    // Generate unique nonce for this transaction
    const userNonce = BigInt(Date.now()) * 1000n + BigInt(Math.floor(Math.random() * 1000));

    const nonce = await this.getLockedNonce();

    try {
      // Estimate gas
      const gasEstimate = await this.rwaPool.investViaRelayer.estimateGas(
        chainPoolId,
        investorAddress,
        amount,
        deadline,
        userNonce,
        signature
      );

      const gasLimit = (gasEstimate * 130n) / 100n; // 30% buffer for safety

      // Submit transaction
      const tx = await this.rwaPool.investViaRelayer(
        chainPoolId,
        investorAddress,
        amount,
        deadline,
        userNonce,
        signature,
        { nonce, gasLimit: gasLimit > DEFAULT_GAS_LIMIT ? gasLimit : DEFAULT_GAS_LIMIT }
      );

      // Wait for confirmation (2 blocks)
      const receipt: TransactionReceipt = await tx.wait(2);

      // Log successful investment
      await this.logTransaction(investorAddress, "POOL_INVEST", tx.hash, receipt);

      console.log(`[Relayer] Investment submitted: pool=${chainPoolId}, investor=${investorAddress}, amount=${amount}, txHash=${receipt.hash}`);

      return {
        txHash: receipt.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString(),
        status: receipt.status === 1 ? "success" : "failed",
      };
    } catch (error: any) {
      await this.logTransactionError(investorAddress, "POOL_INVEST", error);
      throw new Error(`Investment failed: ${error.message}`);
    } finally {
      await this.releaseNonceLock();
    }
  }

  /**
   * Submit investment with EIP-2612 permit (gasless for wallet users)
   * This combines the permit approval and investment in a single transaction
   * @param chainPoolId The on-chain pool ID
   * @param investorAddress The investor's wallet address
   * @param amount Investment amount in USDC (6 decimals)
   * @param deadline Permit signature deadline timestamp
   * @param v Signature v component
   * @param r Signature r component
   * @param s Signature s component
   */
  async submitInvestmentWithPermit(
    chainPoolId: number,
    investorAddress: string,
    amount: bigint,
    deadline: number,
    v: number,
    r: string,
    s: string
  ): Promise<TransactionResult> {
    if (!this.rwaPool) {
      throw new Error("RWA Pool not configured - set RWA_POOL_ADDRESS");
    }

    // Rate limit check
    await this.checkRateLimit(investorAddress, "invest_permit", 5);

    // Validate deadline hasn't expired
    if (deadline < Math.floor(Date.now() / 1000)) {
      throw new Error("Permit deadline has expired");
    }

    const nonce = await this.getLockedNonce();

    try {
      // Estimate gas for the combined permit + invest transaction
      const gasEstimate = await this.rwaPool.investWithPermit.estimateGas(
        chainPoolId,
        investorAddress,
        amount,
        deadline,
        v,
        r,
        s
      );

      const gasLimit = (gasEstimate * 130n) / 100n; // 30% buffer

      // Submit transaction
      const tx = await this.rwaPool.investWithPermit(
        chainPoolId,
        investorAddress,
        amount,
        deadline,
        v,
        r,
        s,
        { nonce, gasLimit: gasLimit > 350_000n ? gasLimit : 350_000n }
      );

      // Wait for confirmation (2 blocks)
      const receipt: TransactionReceipt = await tx.wait(2);

      // Log successful investment
      await this.logTransaction(investorAddress, "POOL_INVEST_PERMIT", tx.hash, receipt);

      console.log(`[Relayer] Permit investment submitted: pool=${chainPoolId}, investor=${investorAddress}, amount=${amount}, txHash=${receipt.hash}`);

      return {
        txHash: receipt.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString(),
        status: receipt.status === 1 ? "success" : "failed",
      };
    } catch (error: any) {
      await this.logTransactionError(investorAddress, "POOL_INVEST_PERMIT", error);
      throw new Error(`Permit investment failed: ${error.message}`);
    } finally {
      await this.releaseNonceLock();
    }
  }

  /**
   * Get permit nonce for a user's address from MockUSDC
   * This is needed to construct the permit signature
   */
  async getPermitNonce(userAddress: string): Promise<bigint> {
    if (!this.mockUsdc) {
      throw new Error("MockUSDC not configured");
    }
    return this.mockUsdc.nonces(userAddress);
  }

  /**
   * Submit redemption via relayer (meta-transaction)
   * @param chainPoolId The on-chain pool ID
   * @param investorAddress The investor's wallet address
   * @param shares Number of shares to redeem
   * @param signature Passkey signature (for audit purposes)
   */
  async submitRedemption(
    chainPoolId: number,
    investorAddress: string,
    shares: bigint,
    signature: string = "0x"
  ): Promise<TransactionResult> {
    if (!this.rwaPool) {
      throw new Error("RWA Pool not configured - set RWA_POOL_ADDRESS");
    }

    // Rate limit check
    await this.checkRateLimit(investorAddress, "redeem", 5);

    const deadline = Math.floor(Date.now() / 1000) + 300;
    const userNonce = BigInt(Date.now()) * 1000n + BigInt(Math.floor(Math.random() * 1000));

    const nonce = await this.getLockedNonce();

    try {
      const gasEstimate = await this.rwaPool.redeemViaRelayer.estimateGas(
        chainPoolId,
        investorAddress,
        shares,
        deadline,
        userNonce,
        signature
      );

      const gasLimit = (gasEstimate * 130n) / 100n;

      const tx = await this.rwaPool.redeemViaRelayer(
        chainPoolId,
        investorAddress,
        shares,
        deadline,
        userNonce,
        signature,
        { nonce, gasLimit: gasLimit > DEFAULT_GAS_LIMIT ? gasLimit : DEFAULT_GAS_LIMIT }
      );

      const receipt: TransactionReceipt = await tx.wait(2);

      await this.logTransaction(investorAddress, "POOL_REDEEM", tx.hash, receipt);

      console.log(`[Relayer] Redemption submitted: pool=${chainPoolId}, investor=${investorAddress}, shares=${shares}, txHash=${receipt.hash}`);

      return {
        txHash: receipt.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString(),
        status: receipt.status === 1 ? "success" : "failed",
      };
    } catch (error: any) {
      await this.logTransactionError(investorAddress, "POOL_REDEEM", error);
      throw new Error(`Redemption failed: ${error.message}`);
    } finally {
      await this.releaseNonceLock();
    }
  }

  /**
   * Get pool information from on-chain
   */
  async getPoolOnChain(chainPoolId: number): Promise<{
    totalDeposited: string;
    totalShares: string;
    minInvestment: string;
    maxInvestment: string;
    active: boolean;
  } | null> {
    if (!this.rwaPool) return null;

    try {
      const result = await this.rwaPool.getPool(chainPoolId);
      return {
        totalDeposited: result[0].toString(),
        totalShares: result[1].toString(),
        minInvestment: result[2].toString(),
        maxInvestment: result[3].toString(),
        active: result[4],
      };
    } catch {
      return null;
    }
  }

  /**
   * Get user position from on-chain
   */
  async getPositionOnChain(chainPoolId: number, userAddress: string): Promise<{
    shares: string;
    depositedAmount: string;
    lastDepositTime: number;
  } | null> {
    if (!this.rwaPool) return null;

    try {
      const result = await this.rwaPool.getPosition(chainPoolId, userAddress);
      return {
        shares: result[0].toString(),
        depositedAmount: result[1].toString(),
        lastDepositTime: Number(result[2]),
      };
    } catch {
      return null;
    }
  }

  /**
   * Check if RWA Pool is configured
   */
  hasRwaPool(): boolean {
    return this.rwaPool !== null;
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
  async hasSufficientBalance(minAvax: number = 0.1): Promise<boolean> {
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

  // ==================== Faucet Operations ====================

  /**
   * Mint test USDC to a user's wallet (testnet only)
   * Uses relayer to pay gas, user gets free test tokens
   */
  async mintTestUsdc(
    userAddress: string,
    amount: bigint = BigInt(10_000) * BigInt(10 ** 6) // Default 10,000 USDC
  ): Promise<TransactionResult> {
    if (!this.mockUsdc) {
      throw new Error("MockUSDC not configured");
    }

    // Cap at 100,000 USDC per request
    const maxAmount = BigInt(100_000) * BigInt(10 ** 6);
    if (amount > maxAmount) {
      amount = maxAmount;
    }

    console.log(`[Relayer] Minting ${amount.toString()} USDC to ${userAddress}`);

    // Use faucetTo to mint directly to user's address (anyone can call this)
    const tx = await this.mockUsdc.faucetTo(userAddress, amount);
    const receipt = await tx.wait();

    return {
      txHash: receipt.hash,
      blockNumber: receipt.blockNumber,
      gasUsed: receipt.gasUsed.toString(),
      status: receipt.status === 1 ? "success" : "failed",
    };
  }

  /**
   * Get USDC balance for an address
   */
  async getUsdcBalance(userAddress: string): Promise<string> {
    if (!this.mockUsdc) {
      throw new Error("MockUSDC not configured");
    }
    const balance = await this.mockUsdc.balanceOf(userAddress);
    return balance.toString();
  }

  /**
   * Check if MockUSDC is configured
   */
  hasMockUsdc(): boolean {
    return this.mockUsdc !== null;
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
