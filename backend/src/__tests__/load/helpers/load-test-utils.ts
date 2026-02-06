/**
 * Load Test Utilities
 *
 * Shared utilities for load testing the ERC-4337 bundler integration.
 * Provides functions for creating test wallets, funding them, and
 * simulating concurrent UserOperations.
 */

import { ethers, JsonRpcProvider, Contract, Wallet } from 'ethers';
import * as crypto from 'crypto';

// Test configuration
export const LOAD_TEST_CONFIG = {
  rpcUrl: process.env.AVALANCHE_FUJI_RPC || 'https://api.avax-test.network/ext/bc/C/rpc',
  chainId: 43113,
  mockUsdcAddress: process.env.MOCK_USDC_ADDRESS!,
  rwaPoolAddress: process.env.RWA_POOL_ADDRESS!,
  p256WalletFactoryAddress: process.env.P256_WALLET_FACTORY_ADDRESS!,
  rwaPaymasterAddress: process.env.RWA_PAYMASTER_ADDRESS!,
  relayerPrivateKey: process.env.RELAYER_PRIVATE_KEY,
};

// Contract ABIs
export const FACTORY_ABI = [
  'function getAddress(bytes32 publicKeyX, bytes32 publicKeyY, bytes32 credentialId) external view returns (address)',
  'function walletExists(bytes32 publicKeyX, bytes32 publicKeyY, bytes32 credentialId) external view returns (bool deployed, address wallet)',
  'function createWallet(bytes32 publicKeyX, bytes32 publicKeyY, bytes32 credentialId) external returns (address)',
];

export const MOCK_USDC_ABI = [
  'function balanceOf(address) view returns (uint256)',
  'function faucetTo(address, uint256)',
  'function approve(address, uint256) returns (bool)',
  'function allowance(address, address) view returns (uint256)',
];

export const PAYMASTER_ABI = [
  'function getDeposit() view returns (uint256)',
  'function isTargetAllowed(address) view returns (bool)',
];

export const RWA_POOL_ABI = [
  'function invest(uint256 amount)',
  'function balanceOf(address) view returns (uint256)',
  'function totalSupply() view returns (uint256)',
];

/**
 * Test wallet with P-256 keypair for passkey simulation
 */
export interface TestWallet {
  publicKeyX: string;
  publicKeyY: string;
  credentialId: string;
  privateKey: crypto.KeyObject;
  smartWalletAddress: string;
  nonce: bigint;
}

/**
 * Transaction result with timing metrics
 */
export interface TxResult {
  success: boolean;
  txHash?: string;
  error?: string;
  gasUsed?: bigint;
  nonce: bigint;
  duration: number;
  startTime: number;
  endTime: number;
}

/**
 * Batch metrics for aggregate analysis
 */
export interface BatchMetrics {
  batch: number;
  userOps: number;
  duration: number;
  gasUsed: bigint;
  blockNumber: number;
  successCount: number;
  failureCount: number;
}

/**
 * Generate a P-256 keypair for testing
 * Uses a seed for reproducibility in some scenarios
 */
export function generateP256Keypair(seed?: string): {
  publicKeyX: string;
  publicKeyY: string;
  credentialId: string;
  privateKey: crypto.KeyObject;
} {
  // Generate P-256 keypair
  const { publicKey, privateKey } = crypto.generateKeyPairSync('ec', {
    namedCurve: 'P-256',
  });

  // Export public key in JWK format to get x,y coordinates
  const jwk = publicKey.export({ format: 'jwk' });

  // Convert from base64url to hex
  const x = Buffer.from(jwk.x!, 'base64url').toString('hex').padStart(64, '0');
  const y = Buffer.from(jwk.y!, 'base64url').toString('hex').padStart(64, '0');

  // Generate credential ID (deterministic if seed provided)
  const credentialId = seed
    ? '0x' + crypto.createHash('sha256').update(`credential-${seed}`).digest('hex')
    : '0x' + crypto.randomBytes(32).toString('hex');

  return {
    publicKeyX: '0x' + x,
    publicKeyY: '0x' + y,
    credentialId,
    privateKey,
  };
}

/**
 * Sign a hash with P-256 private key (simulating WebAuthn signature)
 */
export function signWithP256(
  privateKey: crypto.KeyObject,
  message: Buffer
): { r: string; s: string; derSignature: Buffer } {
  const sign = crypto.createSign('SHA256');
  sign.update(message);
  const derSignature = sign.sign(privateKey);

  // Parse DER signature to extract r and s
  let offset = 0;
  if (derSignature[offset++] !== 0x30) throw new Error('Invalid DER');
  offset++; // total length

  if (derSignature[offset++] !== 0x02) throw new Error('Invalid DER (r)');
  const rLen = derSignature[offset++];
  let r = derSignature.subarray(offset, offset + rLen);
  offset += rLen;

  if (derSignature[offset++] !== 0x02) throw new Error('Invalid DER (s)');
  const sLen = derSignature[offset++];
  let s = derSignature.subarray(offset, offset + sLen);

  // Remove leading zeros if present (DER encoding artifact)
  if (r[0] === 0x00 && r.length === 33) r = r.subarray(1);
  if (s[0] === 0x00 && s.length === 33) s = s.subarray(1);

  // Pad to 32 bytes if needed
  r = Buffer.concat([Buffer.alloc(32 - r.length), r]);
  s = Buffer.concat([Buffer.alloc(32 - s.length), s]);

  // Normalize S to low-S form (required for some verifiers)
  const n = BigInt('0xFFFFFFFF00000000FFFFFFFFFFFFFFFFBCE6FAADA7179E84F3B9CAC2FC632551');
  const halfN = n / 2n;
  let sBigInt = BigInt('0x' + s.toString('hex'));
  if (sBigInt > halfN) {
    sBigInt = n - sBigInt;
    s = Buffer.from(sBigInt.toString(16).padStart(64, '0'), 'hex');
  }

  return {
    r: '0x' + r.toString('hex'),
    s: '0x' + s.toString('hex'),
    derSignature,
  };
}

/**
 * Create multiple test wallets for load testing
 */
export async function createTestWallets(
  count: number,
  provider: JsonRpcProvider
): Promise<TestWallet[]> {
  const factory = new Contract(
    LOAD_TEST_CONFIG.p256WalletFactoryAddress,
    FACTORY_ABI,
    provider
  );

  const wallets: TestWallet[] = [];

  for (let i = 0; i < count; i++) {
    const keypair = generateP256Keypair(`load-test-wallet-${i}-${Date.now()}`);

    // Compute smart wallet address
    const smartWalletAddress = await factory.getAddress(
      keypair.publicKeyX,
      keypair.publicKeyY,
      keypair.credentialId
    );

    wallets.push({
      ...keypair,
      smartWalletAddress,
      nonce: 0n,
    });
  }

  return wallets;
}

/**
 * Fund test wallets with MockUSDC using faucet
 */
export async function fundWallets(
  wallets: TestWallet[],
  amount: bigint,
  signer: Wallet
): Promise<void> {
  const mockUsdc = new Contract(
    LOAD_TEST_CONFIG.mockUsdcAddress,
    MOCK_USDC_ABI,
    signer
  );

  console.log(`Funding ${wallets.length} wallets with ${ethers.formatUnits(amount, 6)} USDC each...`);

  // Fund in batches to avoid nonce issues
  const BATCH_SIZE = 10;
  for (let i = 0; i < wallets.length; i += BATCH_SIZE) {
    const batch = wallets.slice(i, i + BATCH_SIZE);
    const txPromises = batch.map((wallet) =>
      mockUsdc.faucetTo(wallet.smartWalletAddress, amount)
    );

    const txs = await Promise.all(txPromises);
    await Promise.all(txs.map((tx: ethers.ContractTransactionResponse) => tx.wait()));

    console.log(`Funded batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(wallets.length / BATCH_SIZE)}`);
  }
}

/**
 * Verify wallet balances
 */
export async function verifyBalances(
  wallets: TestWallet[],
  expectedAmount: bigint,
  provider: JsonRpcProvider
): Promise<boolean> {
  const mockUsdc = new Contract(
    LOAD_TEST_CONFIG.mockUsdcAddress,
    MOCK_USDC_ABI,
    provider
  );

  for (const wallet of wallets) {
    const balance = await mockUsdc.balanceOf(wallet.smartWalletAddress);
    if (balance < expectedAmount) {
      console.warn(`Wallet ${wallet.smartWalletAddress} has insufficient balance: ${balance}`);
      return false;
    }
  }

  return true;
}

/**
 * Create a provider and relayer signer for tests
 */
export function createTestProvider(): {
  provider: JsonRpcProvider;
  relayerSigner: Wallet | null;
} {
  const provider = new JsonRpcProvider(LOAD_TEST_CONFIG.rpcUrl);

  let relayerSigner: Wallet | null = null;
  if (LOAD_TEST_CONFIG.relayerPrivateKey) {
    relayerSigner = new Wallet(LOAD_TEST_CONFIG.relayerPrivateKey, provider);
  }

  return { provider, relayerSigner };
}

/**
 * Retry wrapper with exponential backoff
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error | undefined;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      const delay = baseDelay * Math.pow(2, attempt);
      console.warn(`Attempt ${attempt + 1} failed, retrying in ${delay}ms...`);
      await sleep(delay);
    }
  }

  throw lastError;
}

/**
 * Sleep utility
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Format duration in human-readable format
 */
export function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(2)}s`;
  return `${(ms / 60000).toFixed(2)}m`;
}

/**
 * Calculate percentile from array of numbers
 */
export function percentile(arr: number[], p: number): number {
  if (arr.length === 0) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  const index = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.max(0, index)];
}

/**
 * Generate a load test report
 */
export function generateLoadTestReport(
  testName: string,
  results: TxResult[],
  startTime: number,
  endTime: number
): string {
  const totalDuration = endTime - startTime;
  const successful = results.filter((r) => r.success);
  const failed = results.filter((r) => !r.success);

  const durations = successful.map((r) => r.duration);
  const avgLatency = durations.length > 0
    ? durations.reduce((a, b) => a + b, 0) / durations.length
    : 0;

  const throughput = successful.length / (totalDuration / 1000);

  const totalGas = successful.reduce((sum, r) => sum + (r.gasUsed || 0n), 0n);

  return `
╔══════════════════════════════════════════════════════════════╗
║                    LOAD TEST REPORT                          ║
╠══════════════════════════════════════════════════════════════╣
║  Test Name: ${testName.padEnd(48)}║
╠══════════════════════════════════════════════════════════════╣
║  SUMMARY                                                     ║
║  ────────────────────────────────────────────────────────── ║
║  Total Transactions:     ${results.length.toString().padEnd(35)}║
║  Successful:             ${successful.length.toString().padEnd(35)}║
║  Failed:                 ${failed.length.toString().padEnd(35)}║
║  Success Rate:           ${((successful.length / results.length) * 100).toFixed(2).padEnd(33)}% ║
╠══════════════════════════════════════════════════════════════╣
║  TIMING                                                      ║
║  ────────────────────────────────────────────────────────── ║
║  Total Duration:         ${formatDuration(totalDuration).padEnd(35)}║
║  Throughput:             ${throughput.toFixed(2).padEnd(31)} tx/s ║
║  Avg Latency:            ${formatDuration(avgLatency).padEnd(35)}║
║  P50 Latency:            ${formatDuration(percentile(durations, 50)).padEnd(35)}║
║  P95 Latency:            ${formatDuration(percentile(durations, 95)).padEnd(35)}║
║  P99 Latency:            ${formatDuration(percentile(durations, 99)).padEnd(35)}║
╠══════════════════════════════════════════════════════════════╣
║  GAS                                                         ║
║  ────────────────────────────────────────────────────────── ║
║  Total Gas Used:         ${totalGas.toString().padEnd(35)}║
║  Avg Gas/Transaction:    ${(Number(totalGas) / successful.length || 0).toFixed(0).padEnd(35)}║
╚══════════════════════════════════════════════════════════════╝
`;
}
