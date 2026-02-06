import { ethers, JsonRpcProvider, Contract } from "ethers";
import { Redis } from "ioredis";
import { PrismaClient } from "@prisma/client";
import * as crypto from "crypto";

const prisma = new PrismaClient();

// ERC-4337 EntryPoint v0.7
const ENTRYPOINT_ADDRESS = "0x0000000071727De22E5E9d8BAf0edAc6f37da032";

// EntryPoint v0.7 ABI (minimal)
const ENTRYPOINT_ABI = [
  "function getNonce(address sender, uint192 key) external view returns (uint256 nonce)",
  "function getUserOpHash(tuple(address sender, uint256 nonce, bytes initCode, bytes callData, bytes32 accountGasLimits, uint256 preVerificationGas, bytes32 gasFees, bytes paymasterAndData, bytes signature) userOp) external view returns (bytes32)",
  "function balanceOf(address account) external view returns (uint256)",
  "function handleOps(tuple(address sender, uint256 nonce, bytes initCode, bytes callData, bytes32 accountGasLimits, uint256 preVerificationGas, bytes32 gasFees, bytes paymasterAndData, bytes signature)[] ops, address payable beneficiary) external",
];

// Factory ABI
const FACTORY_ABI = [
  "function getAddress(bytes32 publicKeyX, bytes32 publicKeyY, bytes32 credentialId) external view returns (address)",
  "function createWallet(bytes32 publicKeyX, bytes32 publicKeyY, bytes32 credentialId) external returns (address)",
  "function getInitCode(bytes32 publicKeyX, bytes32 publicKeyY, bytes32 credentialId) external view returns (bytes)",
  "function walletExists(bytes32 publicKeyX, bytes32 publicKeyY, bytes32 credentialId) external view returns (bool deployed, address wallet)",
];

// Smart Wallet ABI
const SMART_WALLET_ABI = [
  "function execute(address target, uint256 value, bytes calldata data) external",
  "function executeBatch(address[] calldata targets, uint256[] calldata values, bytes[] calldata datas) external",
  "function getNonce() external view returns (uint256)",
  "function getDeposit() external view returns (uint256)",
];

/**
 * Packed UserOperation structure (ERC-4337 v0.7)
 */
export interface PackedUserOperation {
  sender: string;
  nonce: bigint;
  initCode: string;
  callData: string;
  accountGasLimits: string; // Packed: verificationGasLimit (16 bytes) | callGasLimit (16 bytes)
  preVerificationGas: bigint;
  gasFees: string; // Packed: maxPriorityFeePerGas (16 bytes) | maxFeePerGas (16 bytes)
  paymasterAndData: string;
  signature: string;
}

/**
 * UserOperation for API responses (serializable)
 */
export interface UserOperationData {
  sender: string;
  nonce: string;
  initCode: string;
  callData: string;
  accountGasLimits: string;
  preVerificationGas: string;
  gasFees: string;
  paymasterAndData: string;
  signature: string;
}

/**
 * WebAuthn signature components
 */
export interface WebAuthnSignature {
  authenticatorData: string; // hex
  clientDataHash: string; // hex (SHA256 of clientDataJSON)
  r: string; // hex
  s: string; // hex
  counter: number;
}

export interface UserOpConfig {
  rpcUrl: string;
  chainId: number;
  factoryAddress: string;
  paymasterAddress: string;
  bundlerRpcUrl?: string;
}

export interface UserOpResult {
  userOpHash: string;
  txHash?: string;
  blockNumber?: number;
  status: "pending" | "success" | "failed";
}

/**
 * UserOperation Service
 * Builds and submits ERC-4337 UserOperations for gasless transactions
 */
export class UserOperationService {
  private provider: JsonRpcProvider;
  private entryPoint: Contract;
  private factory: Contract;
  private paymasterAddress: string;
  private bundlerRpcUrl: string;
  private chainId: number;

  constructor(
    private redis: Redis,
    config?: Partial<UserOpConfig>
  ) {
    const rpcUrl = config?.rpcUrl || process.env.AVALANCHE_RPC_URL || "https://api.avax-test.network/ext/bc/C/rpc";
    this.chainId = config?.chainId || parseInt(process.env.CHAIN_ID || "43113");
    this.paymasterAddress = config?.paymasterAddress || process.env.RWA_PAYMASTER_ADDRESS || "";
    this.bundlerRpcUrl = config?.bundlerRpcUrl || process.env.BUNDLER_RPC_URL || "";

    const factoryAddress = config?.factoryAddress || process.env.P256_WALLET_FACTORY_ADDRESS;

    if (!factoryAddress) {
      throw new Error("P256_WALLET_FACTORY_ADDRESS environment variable required");
    }

    this.provider = new JsonRpcProvider(rpcUrl, this.chainId);
    this.entryPoint = new Contract(ENTRYPOINT_ADDRESS, ENTRYPOINT_ABI, this.provider);
    this.factory = new Contract(factoryAddress, FACTORY_ABI, this.provider);

    console.log(`[UserOp] Service initialized - Factory: ${factoryAddress}, Paymaster: ${this.paymasterAddress}`);
  }

  // ==================== Wallet Address Computation ====================

  /**
   * Compute smart wallet address for a passkey (counterfactual)
   */
  async getWalletAddress(
    publicKeyX: string,
    publicKeyY: string,
    credentialId: string
  ): Promise<string> {
    const pkX = this.toBytes32(publicKeyX);
    const pkY = this.toBytes32(publicKeyY);
    const credId = this.credentialIdToBytes32(credentialId);

    return (this.factory as any).getAddress(pkX, pkY, credId);
  }

  /**
   * Check if wallet is deployed
   */
  async isWalletDeployed(walletAddress: string): Promise<boolean> {
    const code = await this.provider.getCode(walletAddress);
    return code !== "0x";
  }

  /**
   * Get wallet existence info
   */
  async getWalletInfo(
    publicKeyX: string,
    publicKeyY: string,
    credentialId: string
  ): Promise<{ deployed: boolean; address: string }> {
    const pkX = this.toBytes32(publicKeyX);
    const pkY = this.toBytes32(publicKeyY);
    const credId = this.credentialIdToBytes32(credentialId);

    const [deployed, address] = await (this.factory as any).walletExists(pkX, pkY, credId);
    return { deployed, address };
  }

  // ==================== UserOperation Building ====================

  /**
   * Build UserOperation for investment
   * Returns the UserOp and hash for signing
   */
  async buildInvestUserOp(
    publicKeyX: string,
    publicKeyY: string,
    credentialId: string,
    poolId: number,
    amount: bigint,
    usdcAddress: string,
    poolAddress: string
  ): Promise<{ userOp: UserOperationData; hash: string; walletAddress: string }> {
    const pkX = this.toBytes32(publicKeyX);
    const pkY = this.toBytes32(publicKeyY);
    const credId = this.credentialIdToBytes32(credentialId);

    // Get wallet address
    const walletAddress = await (this.factory as any).getAddress(pkX, pkY, credId);

    // Check if wallet is deployed
    const isDeployed = await this.isWalletDeployed(walletAddress);

    // Get nonce from EntryPoint
    const nonce = await (this.entryPoint as any).getNonce(walletAddress, 0);

    // Build callData: approve USDC + invest in pool (batch)
    const callData = this.buildInvestCallData(
      usdcAddress,
      poolAddress,
      poolId,
      amount
    );

    // Get initCode if wallet not deployed
    let initCode = "0x";
    if (!isDeployed) {
      initCode = await (this.factory as any).getInitCode(pkX, pkY, credId);
    }

    // Gas estimates (conservative for hackathon)
    const verificationGasLimit = isDeployed ? 100_000n : 300_000n; // Higher for deployment
    const callGasLimit = 400_000n; // Approve + invest
    const preVerificationGas = 50_000n;

    // Get current gas prices
    const feeData = await this.provider.getFeeData();
    const maxFeePerGas = feeData.maxFeePerGas || ethers.parseUnits("30", "gwei");
    const maxPriorityFeePerGas = feeData.maxPriorityFeePerGas || ethers.parseUnits("2", "gwei");

    // Build packed UserOperation
    const userOp: PackedUserOperation = {
      sender: walletAddress,
      nonce,
      initCode,
      callData,
      accountGasLimits: this.packGasLimits(verificationGasLimit, callGasLimit),
      preVerificationGas,
      gasFees: this.packGasFees(maxPriorityFeePerGas, maxFeePerGas),
      paymasterAndData: this.paymasterAddress || "0x",
      signature: "0x", // To be filled after signing
    };

    // Compute hash for signing
    const hash = await this.computeUserOpHash(userOp);

    return {
      userOp: this.serializeUserOp(userOp),
      hash,
      walletAddress,
    };
  }

  /**
   * Build UserOperation for token approval only
   */
  async buildApproveUserOp(
    publicKeyX: string,
    publicKeyY: string,
    credentialId: string,
    tokenAddress: string,
    spenderAddress: string,
    amount: bigint
  ): Promise<{ userOp: UserOperationData; hash: string; walletAddress: string }> {
    const pkX = this.toBytes32(publicKeyX);
    const pkY = this.toBytes32(publicKeyY);
    const credId = this.credentialIdToBytes32(credentialId);

    const walletAddress = await (this.factory as any).getAddress(pkX, pkY, credId);
    const isDeployed = await this.isWalletDeployed(walletAddress);
    const nonce = await (this.entryPoint as any).getNonce(walletAddress, 0);

    // Build approve callData
    const erc20Interface = new ethers.Interface([
      "function approve(address spender, uint256 amount) returns (bool)",
    ]);
    const approveData = erc20Interface.encodeFunctionData("approve", [spenderAddress, amount]);

    // Wrap in execute call
    const walletInterface = new ethers.Interface([
      "function execute(address target, uint256 value, bytes calldata data)",
    ]);
    const callData = walletInterface.encodeFunctionData("execute", [
      tokenAddress,
      0,
      approveData,
    ]);

    let initCode = "0x";
    if (!isDeployed) {
      initCode = await (this.factory as any).getInitCode(pkX, pkY, credId);
    }

    const verificationGasLimit = isDeployed ? 100_000n : 300_000n;
    const callGasLimit = 100_000n;
    const preVerificationGas = 50_000n;

    const feeData = await this.provider.getFeeData();
    const maxFeePerGas = feeData.maxFeePerGas || ethers.parseUnits("30", "gwei");
    const maxPriorityFeePerGas = feeData.maxPriorityFeePerGas || ethers.parseUnits("2", "gwei");

    const userOp: PackedUserOperation = {
      sender: walletAddress,
      nonce,
      initCode,
      callData,
      accountGasLimits: this.packGasLimits(verificationGasLimit, callGasLimit),
      preVerificationGas,
      gasFees: this.packGasFees(maxPriorityFeePerGas, maxFeePerGas),
      paymasterAndData: this.paymasterAddress || "0x",
      signature: "0x",
    };

    const hash = await this.computeUserOpHash(userOp);

    return {
      userOp: this.serializeUserOp(userOp),
      hash,
      walletAddress,
    };
  }

  // ==================== Signature Encoding ====================

  /**
   * Encode WebAuthn signature for UserOperation
   * Called after user signs with passkey
   */
  encodeWebAuthnSignature(sig: WebAuthnSignature): string {
    return ethers.AbiCoder.defaultAbiCoder().encode(
      ["bytes", "bytes32", "bytes32", "bytes32", "uint32"],
      [
        sig.authenticatorData,
        sig.clientDataHash,
        sig.r,
        sig.s,
        sig.counter,
      ]
    );
  }

  /**
   * Parse DER-encoded ECDSA signature to r, s components
   */
  parseDERSignature(derSignature: Buffer): { r: string; s: string } {
    let offset = 0;

    if (derSignature[offset++] !== 0x30) throw new Error("Invalid DER signature");
    offset++; // Skip total length

    if (derSignature[offset++] !== 0x02) throw new Error("Invalid DER signature (r)");
    const rLen = derSignature[offset++];
    let r = derSignature.subarray(offset, offset + rLen);
    offset += rLen;

    if (derSignature[offset++] !== 0x02) throw new Error("Invalid DER signature (s)");
    const sLen = derSignature[offset++];
    let s = derSignature.subarray(offset, offset + sLen);

    // Remove leading zeros (DER uses signed integers)
    if (r[0] === 0x00 && r.length > 32) r = r.subarray(1);
    if (s[0] === 0x00 && s.length > 32) s = s.subarray(1);

    // Pad to 32 bytes
    const rPadded = Buffer.alloc(32);
    const sPadded = Buffer.alloc(32);
    r.copy(rPadded, 32 - r.length);
    s.copy(sPadded, 32 - s.length);

    return {
      r: "0x" + rPadded.toString("hex"),
      s: "0x" + sPadded.toString("hex"),
    };
  }

  /**
   * Add signature to UserOperation
   */
  addSignatureToUserOp(
    userOp: UserOperationData,
    signature: string
  ): UserOperationData {
    return {
      ...userOp,
      signature,
    };
  }

  // ==================== Submission ====================

  /**
   * Submit signed UserOperation to bundler
   */
  async submitUserOp(userOp: UserOperationData): Promise<UserOpResult> {
    if (!this.bundlerRpcUrl) {
      throw new Error("BUNDLER_RPC_URL not configured");
    }

    // Validate signature is present
    if (!userOp.signature || userOp.signature === "0x") {
      throw new Error("UserOperation must be signed before submission");
    }

    try {
      const response = await fetch(this.bundlerRpcUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: Date.now(),
          method: "eth_sendUserOperation",
          params: [userOp, ENTRYPOINT_ADDRESS],
        }),
      });

      const result = await response.json();

      if (result.error) {
        console.error("[UserOp] Bundler error:", result.error);
        throw new Error(`Bundler rejected UserOp: ${result.error.message}`);
      }

      const userOpHash = result.result;
      console.log(`[UserOp] Submitted to bundler: ${userOpHash}`);

      // Store pending operation
      await this.redis.set(
        `userop:pending:${userOpHash}`,
        JSON.stringify({ userOp, submittedAt: Date.now() }),
        "EX",
        3600 // 1 hour TTL
      );

      return {
        userOpHash,
        status: "pending",
      };
    } catch (error: any) {
      console.error("[UserOp] Submission failed:", error.message);
      throw error;
    }
  }

  /**
   * Get UserOperation receipt from bundler
   */
  async getUserOpReceipt(userOpHash: string): Promise<UserOpResult> {
    if (!this.bundlerRpcUrl) {
      throw new Error("BUNDLER_RPC_URL not configured");
    }

    const response = await fetch(this.bundlerRpcUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: Date.now(),
        method: "eth_getUserOperationReceipt",
        params: [userOpHash],
      }),
    });

    const result = await response.json();

    if (result.error) {
      throw new Error(`Failed to get receipt: ${result.error.message}`);
    }

    if (!result.result) {
      return { userOpHash, status: "pending" };
    }

    const receipt = result.result;
    return {
      userOpHash,
      txHash: receipt.receipt?.transactionHash,
      blockNumber: receipt.receipt?.blockNumber,
      status: receipt.success ? "success" : "failed",
    };
  }

  // ==================== Direct Submission (Fallback) ====================

  /**
   * Submit UserOperation directly via handleOps (if no bundler)
   * Requires relayer wallet to pay gas
   */
  async submitUserOpDirect(
    userOp: UserOperationData,
    relayerPrivateKey: string
  ): Promise<UserOpResult> {
    const wallet = new ethers.Wallet(relayerPrivateKey, this.provider);
    const entryPointWithSigner = this.entryPoint.connect(wallet) as Contract;

    // Convert serialized UserOp back to struct format
    const userOpStruct = {
      sender: userOp.sender,
      nonce: BigInt(userOp.nonce),
      initCode: userOp.initCode,
      callData: userOp.callData,
      accountGasLimits: userOp.accountGasLimits,
      preVerificationGas: BigInt(userOp.preVerificationGas),
      gasFees: userOp.gasFees,
      paymasterAndData: userOp.paymasterAndData,
      signature: userOp.signature,
    };

    try {
      const tx = await entryPointWithSigner.handleOps(
        [userOpStruct],
        wallet.address, // beneficiary
        { gasLimit: 1_000_000n }
      );

      const receipt = await tx.wait(2);

      // Compute userOpHash for consistency
      const userOpHash = await this.computeUserOpHash({
        ...userOpStruct,
        preVerificationGas: userOpStruct.preVerificationGas,
        nonce: userOpStruct.nonce,
      });

      return {
        userOpHash,
        txHash: receipt.hash,
        blockNumber: receipt.blockNumber,
        status: receipt.status === 1 ? "success" : "failed",
      };
    } catch (error: any) {
      console.error("[UserOp] Direct submission failed:", error.message);
      throw error;
    }
  }

  // ==================== Helper Methods ====================

  /**
   * Build batch callData for approve + invest
   */
  private buildInvestCallData(
    usdcAddress: string,
    poolAddress: string,
    poolId: number,
    amount: bigint
  ): string {
    const erc20Interface = new ethers.Interface([
      "function approve(address spender, uint256 amount) returns (bool)",
    ]);
    const poolInterface = new ethers.Interface([
      "function invest(uint256 poolId, uint256 amount)",
    ]);
    const walletInterface = new ethers.Interface([
      "function executeBatch(address[] calldata targets, uint256[] calldata values, bytes[] calldata datas)",
    ]);

    const approveData = erc20Interface.encodeFunctionData("approve", [poolAddress, amount]);
    const investData = poolInterface.encodeFunctionData("invest", [poolId, amount]);

    return walletInterface.encodeFunctionData("executeBatch", [
      [usdcAddress, poolAddress],
      [0, 0],
      [approveData, investData],
    ]);
  }

  /**
   * Compute UserOperation hash for signing
   */
  private async computeUserOpHash(userOp: PackedUserOperation): Promise<string> {
    // Pack UserOp fields for hashing
    const userOpEncoded = ethers.AbiCoder.defaultAbiCoder().encode(
      ["address", "uint256", "bytes32", "bytes32", "bytes32", "uint256", "bytes32", "bytes32"],
      [
        userOp.sender,
        userOp.nonce,
        ethers.keccak256(userOp.initCode),
        ethers.keccak256(userOp.callData),
        userOp.accountGasLimits,
        userOp.preVerificationGas,
        userOp.gasFees,
        ethers.keccak256(userOp.paymasterAndData),
      ]
    );

    const userOpHash = ethers.keccak256(userOpEncoded);

    // Final hash includes EntryPoint and chainId
    return ethers.keccak256(
      ethers.AbiCoder.defaultAbiCoder().encode(
        ["bytes32", "address", "uint256"],
        [userOpHash, ENTRYPOINT_ADDRESS, this.chainId]
      )
    );
  }

  /**
   * Pack gas limits (v0.7 format)
   */
  private packGasLimits(verificationGas: bigint, callGas: bigint): string {
    return ethers.toBeHex((verificationGas << 128n) | callGas, 32);
  }

  /**
   * Pack gas fees (v0.7 format)
   */
  private packGasFees(priorityFee: bigint, maxFee: bigint): string {
    return ethers.toBeHex((priorityFee << 128n) | maxFee, 32);
  }

  /**
   * Serialize UserOp for API responses
   */
  private serializeUserOp(userOp: PackedUserOperation): UserOperationData {
    return {
      sender: userOp.sender,
      nonce: userOp.nonce.toString(),
      initCode: userOp.initCode,
      callData: userOp.callData,
      accountGasLimits: userOp.accountGasLimits,
      preVerificationGas: userOp.preVerificationGas.toString(),
      gasFees: userOp.gasFees,
      paymasterAndData: userOp.paymasterAndData,
      signature: userOp.signature,
    };
  }

  /**
   * Convert hex to bytes32 format
   */
  private toBytes32(hex: string): string {
    const clean = hex.replace("0x", "");
    const padded = clean.padStart(64, "0");
    return "0x" + padded;
  }

  /**
   * Convert credential ID to bytes32
   */
  private credentialIdToBytes32(credentialId: string): string {
    const buffer = Buffer.from(credentialId, "base64url");
    const bytes32 = Buffer.alloc(32);
    buffer.copy(bytes32, 0, 0, Math.min(32, buffer.length));
    return "0x" + bytes32.toString("hex");
  }

  // ==================== Database Integration ====================

  /**
   * Get user's smart wallet address from database or compute it
   */
  async getOrComputeWalletAddress(userId: string): Promise<string | null> {
    // First check database
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { smartWalletAddress: true },
    });

    if (user?.smartWalletAddress) {
      return user.smartWalletAddress;
    }

    // Look up passkey credentials
    const identity = await prisma.biometricIdentity.findFirst({
      where: { userId },
      select: { publicKeyX: true, publicKeyY: true, credentialId: true },
    });

    if (!identity?.publicKeyX || !identity?.publicKeyY) {
      return null;
    }

    // Compute wallet address
    const walletAddress = await this.getWalletAddress(
      identity.publicKeyX,
      identity.publicKeyY,
      identity.credentialId
    );

    // Cache in database
    await prisma.user.update({
      where: { id: userId },
      data: { smartWalletAddress: walletAddress },
    });

    return walletAddress;
  }

  /**
   * Log UserOperation to audit
   */
  async logUserOp(
    userId: string,
    action: string,
    userOpHash: string,
    status: "pending" | "success" | "failed"
  ): Promise<void> {
    try {
      await prisma.auditLog.create({
        data: {
          action: `USEROP_${action}`,
          userId,
          resourceType: "UserOperation",
          resourceId: userOpHash,
          status: status.toUpperCase(),
          metadata: { userOpHash },
        },
      });
    } catch (error) {
      console.error("[UserOp] Failed to log:", error);
    }
  }
}
