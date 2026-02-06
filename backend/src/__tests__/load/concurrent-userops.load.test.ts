/**
 * Load Test: Concurrent UserOperations
 *
 * Tests the system's ability to handle multiple concurrent investments
 * from different users. Measures success rates, latencies, and throughput
 * under various concurrency levels.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { ethers, JsonRpcProvider, Contract, Wallet } from 'ethers';
import { UserOperationService } from '../../services/userop.service';
import Redis from 'ioredis';
import {
  createTestWallets,
  fundWallets,
  createTestProvider,
  signWithP256,
  generateLoadTestReport,
  LOAD_TEST_CONFIG,
  MOCK_USDC_ABI,
  RWA_POOL_ABI,
  type TestWallet,
  type TxResult,
} from './helpers/load-test-utils';
import { MetricsCollector, ProgressTracker } from './helpers/metrics-collector';

// Skip load tests by default (run with: npm run test:load)
const SKIP_LOAD_TESTS = process.env.RUN_LOAD_TESTS !== 'true';

describe.skipIf(SKIP_LOAD_TESTS)('Concurrent UserOperation Load Test', () => {
  let provider: JsonRpcProvider;
  let relayerSigner: Wallet | null;
  let userOpService: UserOperationService;
  let redis: Redis;
  let metrics: MetricsCollector;

  const INVESTMENT_AMOUNT = 100n * 10n ** 6n; // 100 USDC
  const POOL_ID = 'pool-1'; // Test pool

  beforeAll(async () => {
    // Verify environment
    if (!LOAD_TEST_CONFIG.relayerPrivateKey) {
      throw new Error('RELAYER_PRIVATE_KEY required for load tests');
    }
    if (!LOAD_TEST_CONFIG.mockUsdcAddress) {
      throw new Error('MOCK_USDC_ADDRESS required for load tests');
    }

    // Initialize provider and signer
    const setup = createTestProvider();
    provider = setup.provider;
    relayerSigner = setup.relayerSigner;

    // Initialize Redis for nonce management
    redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

    // Initialize UserOperation service
    userOpService = new UserOperationService(provider, redis);

    // Initialize metrics collector
    metrics = new MetricsCollector();

    console.log('Load test environment initialized');
    console.log(`  RPC URL: ${LOAD_TEST_CONFIG.rpcUrl}`);
    console.log(`  MockUSDC: ${LOAD_TEST_CONFIG.mockUsdcAddress}`);
    console.log(`  Pool: ${LOAD_TEST_CONFIG.rwaPoolAddress}`);
  });

  afterAll(async () => {
    await redis.quit();
    console.log('\n' + metrics.generateReport());
  });

  /**
   * Execute investment for a single wallet
   */
  async function executeInvestment(wallet: TestWallet): Promise<TxResult> {
    const startTime = Date.now();
    const stopTimer = metrics.startTimer('investment_latency');

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
        INVESTMENT_AMOUNT
      );

      // Sign with P-256
      const userOpHash = await userOpService.getUserOpHash(userOp);
      const hashBuffer = Buffer.from(userOpHash.slice(2), 'hex');
      const { r, s } = signWithP256(wallet.privateKey, hashBuffer);

      userOp.signature = ethers.solidityPacked(
        ['bytes32', 'bytes32', 'bytes'],
        [r, s, '0x'] // Empty authenticator data for testing
      );

      // Submit via relayer
      const txHash = await userOpService.submitUserOp(userOp, relayerSigner!);

      // Wait for confirmation
      const receipt = await provider.waitForTransaction(txHash, 1, 60000);

      const duration = stopTimer();
      metrics.record('investment_success', 1);
      metrics.record('gas_used', Number(receipt!.gasUsed));

      return {
        success: true,
        txHash,
        gasUsed: receipt!.gasUsed,
        nonce: userOp.nonce,
        duration,
        startTime,
        endTime: Date.now(),
      };
    } catch (error) {
      const duration = stopTimer();
      metrics.record('investment_success', 0);
      metrics.record('investment_error', 1, { error: (error as Error).message.slice(0, 50) });

      return {
        success: false,
        error: (error as Error).message,
        nonce: 0n,
        duration,
        startTime,
        endTime: Date.now(),
      };
    }
  }

  /**
   * Run concurrent investments test
   */
  async function runConcurrentTest(
    userCount: number,
    description: string
  ): Promise<{ results: TxResult[]; duration: number }> {
    console.log(`\n--- ${description} (${userCount} users) ---`);

    // Create and fund wallets
    console.log(`Creating ${userCount} test wallets...`);
    const wallets = await createTestWallets(userCount, provider);

    console.log(`Funding wallets with ${ethers.formatUnits(INVESTMENT_AMOUNT, 6)} USDC each...`);
    await fundWallets(wallets, INVESTMENT_AMOUNT * 2n, relayerSigner!);

    // Prepare progress tracker
    const progress = new ProgressTracker(userCount);

    // Execute all investments concurrently
    console.log('Starting concurrent investments...');
    const startTime = Date.now();

    const results = await Promise.all(
      wallets.map(async (wallet) => {
        const result = await executeInvestment(wallet);
        progress.complete(result.success);
        return result;
      })
    );

    const endTime = Date.now();
    const duration = endTime - startTime;

    // Log summary
    const summary = progress.getSummary();
    console.log(`\nCompleted: ${summary.completed}/${summary.total} in ${duration}ms`);
    console.log(`Success rate: ${((summary.completed / summary.total) * 100).toFixed(2)}%`);
    console.log(`Throughput: ${(summary.completed / (duration / 1000)).toFixed(2)} tx/s`);

    return { results, duration };
  }

  it('should handle 10 concurrent investments with >95% success', async () => {
    const { results } = await runConcurrentTest(10, 'Small concurrency test');

    const successful = results.filter((r) => r.success).length;
    const successRate = successful / results.length;

    console.log(generateLoadTestReport('10 Concurrent Users', results, results[0].startTime, Date.now()));

    expect(successRate).toBeGreaterThan(0.95);
  }, 120000);

  it('should handle 25 concurrent investments with >90% success', async () => {
    const { results } = await runConcurrentTest(25, 'Medium concurrency test');

    const successful = results.filter((r) => r.success).length;
    const successRate = successful / results.length;

    console.log(generateLoadTestReport('25 Concurrent Users', results, results[0].startTime, Date.now()));

    expect(successRate).toBeGreaterThan(0.90);
  }, 180000);

  it('should handle 50 concurrent investments with >85% success', async () => {
    const { results } = await runConcurrentTest(50, 'High concurrency test');

    const successful = results.filter((r) => r.success).length;
    const successRate = successful / results.length;

    console.log(generateLoadTestReport('50 Concurrent Users', results, results[0].startTime, Date.now()));

    expect(successRate).toBeGreaterThan(0.85);
  }, 300000);

  it('should maintain latency under 30s for 90% of transactions', async () => {
    const { results } = await runConcurrentTest(20, 'Latency test');

    const successful = results.filter((r) => r.success);
    const durations = successful.map((r) => r.duration).sort((a, b) => a - b);

    const p90Index = Math.ceil(0.9 * durations.length) - 1;
    const p90Latency = durations[Math.max(0, p90Index)];

    console.log(`P90 Latency: ${p90Latency}ms`);

    expect(p90Latency).toBeLessThan(30000);
  }, 180000);

  it('should report accurate gas consumption', async () => {
    const { results } = await runConcurrentTest(5, 'Gas measurement test');

    const successful = results.filter((r) => r.success && r.gasUsed);
    expect(successful.length).toBeGreaterThan(0);

    const gasValues = successful.map((r) => Number(r.gasUsed!));
    const avgGas = gasValues.reduce((a, b) => a + b, 0) / gasValues.length;
    const minGas = Math.min(...gasValues);
    const maxGas = Math.max(...gasValues);

    console.log(`Gas consumption:`);
    console.log(`  Average: ${avgGas.toLocaleString()}`);
    console.log(`  Min: ${minGas.toLocaleString()}`);
    console.log(`  Max: ${maxGas.toLocaleString()}`);
    console.log(`  Variance: ${((maxGas - minGas) / avgGas * 100).toFixed(2)}%`);

    // Gas should be relatively consistent
    expect(maxGas - minGas).toBeLessThan(avgGas * 0.5); // Within 50% variance
  }, 120000);
});
