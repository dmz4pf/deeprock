/**
 * Load Test: Nonce Stress Test
 *
 * Tests the system's nonce management under rapid sequential transactions
 * from the same wallet. Verifies that nonces are correctly managed and
 * no collisions occur.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { ethers, JsonRpcProvider, Wallet } from 'ethers';
import { UserOperationService } from '../../services/userop.service';
import Redis from 'ioredis';
import {
  createTestWallets,
  fundWallets,
  createTestProvider,
  signWithP256,
  sleep,
  LOAD_TEST_CONFIG,
  type TestWallet,
  type TxResult,
} from './helpers/load-test-utils';
import { MetricsCollector } from './helpers/metrics-collector';

// Skip load tests by default
const SKIP_LOAD_TESTS = process.env.RUN_LOAD_TESTS !== 'true';

describe.skipIf(SKIP_LOAD_TESTS)('Nonce Management Stress Test', () => {
  let provider: JsonRpcProvider;
  let relayerSigner: Wallet | null;
  let userOpService: UserOperationService;
  let redis: Redis;
  let metrics: MetricsCollector;

  const SMALL_INVESTMENT = 10n * 10n ** 6n; // 10 USDC per tx

  beforeAll(async () => {
    if (!LOAD_TEST_CONFIG.relayerPrivateKey) {
      throw new Error('RELAYER_PRIVATE_KEY required for load tests');
    }

    const setup = createTestProvider();
    provider = setup.provider;
    relayerSigner = setup.relayerSigner;

    redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
    userOpService = new UserOperationService(provider, redis);
    metrics = new MetricsCollector();

    console.log('Nonce stress test environment initialized');
  });

  afterAll(async () => {
    await redis.quit();
    console.log('\n' + metrics.generateReport());
  });

  /**
   * Execute sequential investments from a single wallet
   */
  async function executeSequentialInvestments(
    wallet: TestWallet,
    count: number,
    delay: number = 0
  ): Promise<TxResult[]> {
    const results: TxResult[] = [];

    for (let i = 0; i < count; i++) {
      const startTime = Date.now();
      const stopTimer = metrics.startTimer('sequential_tx_latency');

      try {
        // Build UserOperation
        const userOp = await userOpService.buildInvestmentUserOp(
          wallet.smartWalletAddress,
          {
            publicKeyX: wallet.publicKeyX,
            publicKeyY: wallet.publicKeyY,
            credentialId: wallet.credentialId,
          },
          LOAD_TEST_CONFIG.rwaPoolAddress,
          SMALL_INVESTMENT
        );

        // Sign with P-256
        const userOpHash = await userOpService.getUserOpHash(userOp);
        const hashBuffer = Buffer.from(userOpHash.slice(2), 'hex');
        const { r, s } = signWithP256(wallet.privateKey, hashBuffer);

        userOp.signature = ethers.solidityPacked(
          ['bytes32', 'bytes32', 'bytes'],
          [r, s, '0x']
        );

        // Submit via relayer
        const txHash = await userOpService.submitUserOp(userOp, relayerSigner!);

        // Wait for confirmation
        const receipt = await provider.waitForTransaction(txHash, 1, 60000);

        const duration = stopTimer();
        metrics.record('nonce_value', Number(userOp.nonce));

        results.push({
          success: true,
          txHash,
          gasUsed: receipt!.gasUsed,
          nonce: userOp.nonce,
          duration,
          startTime,
          endTime: Date.now(),
        });

        console.log(`  TX ${i + 1}/${count}: nonce=${userOp.nonce}, duration=${duration}ms`);

        // Optional delay between transactions
        if (delay > 0 && i < count - 1) {
          await sleep(delay);
        }
      } catch (error) {
        const duration = stopTimer();
        results.push({
          success: false,
          error: (error as Error).message,
          nonce: 0n,
          duration,
          startTime,
          endTime: Date.now(),
        });

        console.log(`  TX ${i + 1}/${count}: FAILED - ${(error as Error).message.slice(0, 50)}`);
      }
    }

    return results;
  }

  it('should handle 5 sequential transactions with correct nonces', async () => {
    const TX_COUNT = 5;
    const TOTAL_FUNDING = SMALL_INVESTMENT * BigInt(TX_COUNT + 1);

    console.log('\n--- Sequential Nonce Test (5 transactions) ---');

    // Create and fund wallet
    const wallets = await createTestWallets(1, provider);
    const wallet = wallets[0];
    await fundWallets(wallets, TOTAL_FUNDING, relayerSigner!);

    console.log(`Wallet: ${wallet.smartWalletAddress}`);
    console.log(`Executing ${TX_COUNT} sequential transactions...`);

    const results = await executeSequentialInvestments(wallet, TX_COUNT);

    // Verify all succeeded
    const successful = results.filter((r) => r.success);
    expect(successful.length).toBe(TX_COUNT);

    // Verify nonces are sequential (0, 1, 2, 3, 4)
    const nonces = successful.map((r) => r.nonce);
    for (let i = 1; i < nonces.length; i++) {
      expect(nonces[i]).toBe(nonces[i - 1] + 1n);
    }

    console.log(`All ${TX_COUNT} transactions completed with sequential nonces`);
  }, 300000);

  it('should handle 10 rapid sequential transactions without nonce collision', async () => {
    const TX_COUNT = 10;
    const TOTAL_FUNDING = SMALL_INVESTMENT * BigInt(TX_COUNT + 1);

    console.log('\n--- Rapid Sequential Nonce Test (10 transactions) ---');

    const wallets = await createTestWallets(1, provider);
    const wallet = wallets[0];
    await fundWallets(wallets, TOTAL_FUNDING, relayerSigner!);

    console.log(`Wallet: ${wallet.smartWalletAddress}`);
    console.log(`Executing ${TX_COUNT} rapid sequential transactions...`);

    const results = await executeSequentialInvestments(wallet, TX_COUNT);

    const successful = results.filter((r) => r.success);
    const successRate = successful.length / TX_COUNT;

    console.log(`\nSuccess rate: ${(successRate * 100).toFixed(2)}%`);

    // Check for nonce collisions (duplicate nonces in results)
    const nonces = successful.map((r) => r.nonce);
    const uniqueNonces = new Set(nonces.map((n) => n.toString()));
    const hasCollisions = uniqueNonces.size !== nonces.length;

    console.log(`Nonce collision detected: ${hasCollisions}`);
    console.log(`Unique nonces: ${uniqueNonces.size}, Total: ${nonces.length}`);

    // Expect no collisions
    expect(hasCollisions).toBe(false);

    // Expect high success rate
    expect(successRate).toBeGreaterThan(0.8);
  }, 600000);

  it('should recover from failed transaction and continue with correct nonce', async () => {
    console.log('\n--- Nonce Recovery Test ---');

    const wallets = await createTestWallets(1, provider);
    const wallet = wallets[0];

    // Fund with enough for only 2 transactions (third will fail due to insufficient balance)
    const LIMITED_FUNDING = SMALL_INVESTMENT * 2n + 1n * 10n ** 6n; // 21 USDC
    await fundWallets(wallets, LIMITED_FUNDING, relayerSigner!);

    console.log(`Wallet: ${wallet.smartWalletAddress}`);
    console.log(`Limited funding: ${ethers.formatUnits(LIMITED_FUNDING, 6)} USDC`);
    console.log('Executing 3 transactions (3rd expected to fail)...');

    // Execute 3 transactions - third should fail due to insufficient balance
    const results = await executeSequentialInvestments(wallet, 3);

    // First 2 should succeed
    expect(results[0].success).toBe(true);
    expect(results[1].success).toBe(true);

    // Third might fail due to insufficient balance or still succeed
    // (depends on exact gas costs and USDC amounts)
    console.log(`Results: ${results.map((r) => r.success ? 'OK' : 'FAIL').join(', ')}`);

    // If we have successful transactions, nonces should be sequential
    const successfulNonces = results.filter((r) => r.success).map((r) => r.nonce);
    for (let i = 1; i < successfulNonces.length; i++) {
      expect(successfulNonces[i]).toBe(successfulNonces[i - 1] + 1n);
    }

    // Now fund more and continue
    console.log('\nFunding more USDC and continuing...');
    await fundWallets(wallets, SMALL_INVESTMENT * 2n, relayerSigner!);

    const moreResults = await executeSequentialInvestments(wallet, 2);
    const newSuccessful = moreResults.filter((r) => r.success);

    console.log(`Additional transactions: ${newSuccessful.length}/2 succeeded`);

    // New transactions should have higher nonces
    if (newSuccessful.length > 0 && successfulNonces.length > 0) {
      const lastPreviousNonce = successfulNonces[successfulNonces.length - 1];
      expect(newSuccessful[0].nonce).toBeGreaterThan(lastPreviousNonce);
    }
  }, 300000);

  it('should handle parallel requests from same wallet (stress test)', async () => {
    console.log('\n--- Parallel Requests Stress Test (same wallet) ---');

    const PARALLEL_COUNT = 5;
    const TOTAL_FUNDING = SMALL_INVESTMENT * BigInt(PARALLEL_COUNT + 2);

    const wallets = await createTestWallets(1, provider);
    const wallet = wallets[0];
    await fundWallets(wallets, TOTAL_FUNDING, relayerSigner!);

    console.log(`Wallet: ${wallet.smartWalletAddress}`);
    console.log(`Sending ${PARALLEL_COUNT} parallel requests from same wallet...`);
    console.log('(This tests nonce lock contention)');

    // Send parallel requests - the service should handle nonce locking
    const startTime = Date.now();
    const promises = Array(PARALLEL_COUNT).fill(null).map(async (_, i) => {
      const txStart = Date.now();
      try {
        const userOp = await userOpService.buildInvestmentUserOp(
          wallet.smartWalletAddress,
          {
            publicKeyX: wallet.publicKeyX,
            publicKeyY: wallet.publicKeyY,
            credentialId: wallet.credentialId,
          },
          LOAD_TEST_CONFIG.rwaPoolAddress,
          SMALL_INVESTMENT
        );

        const userOpHash = await userOpService.getUserOpHash(userOp);
        const hashBuffer = Buffer.from(userOpHash.slice(2), 'hex');
        const { r, s } = signWithP256(wallet.privateKey, hashBuffer);

        userOp.signature = ethers.solidityPacked(
          ['bytes32', 'bytes32', 'bytes'],
          [r, s, '0x']
        );

        const txHash = await userOpService.submitUserOp(userOp, relayerSigner!);
        const receipt = await provider.waitForTransaction(txHash, 1, 120000);

        return {
          index: i,
          success: true,
          nonce: userOp.nonce,
          duration: Date.now() - txStart,
          txHash,
        };
      } catch (error) {
        return {
          index: i,
          success: false,
          nonce: 0n,
          duration: Date.now() - txStart,
          error: (error as Error).message,
        };
      }
    });

    const results = await Promise.all(promises);
    const duration = Date.now() - startTime;

    // Log results
    console.log(`\nResults (${duration}ms total):`);
    results.forEach((r) => {
      if (r.success) {
        console.log(`  Request ${r.index}: nonce=${r.nonce}, duration=${r.duration}ms`);
      } else {
        console.log(`  Request ${r.index}: FAILED - ${r.error?.slice(0, 50)}`);
      }
    });

    const successful = results.filter((r) => r.success);
    const nonces = successful.map((r) => r.nonce);
    const uniqueNonces = new Set(nonces.map((n) => n.toString()));

    console.log(`\nSuccess: ${successful.length}/${PARALLEL_COUNT}`);
    console.log(`Unique nonces: ${uniqueNonces.size}`);
    console.log(`Nonce collision: ${uniqueNonces.size !== nonces.length}`);

    // We expect some failures due to nonce contention, but no collisions
    // among successful transactions
    expect(uniqueNonces.size).toBe(nonces.length);
  }, 600000);
});
