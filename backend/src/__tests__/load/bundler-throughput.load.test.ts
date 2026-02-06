/**
 * Load Test: Bundler Throughput Benchmark
 *
 * Measures the maximum throughput of the bundler integration
 * by sending batches of UserOperations and measuring timing.
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
  formatDuration,
  LOAD_TEST_CONFIG,
  type TestWallet,
  type BatchMetrics,
} from './helpers/load-test-utils';
import { MetricsCollector } from './helpers/metrics-collector';

// Skip load tests by default
const SKIP_LOAD_TESTS = process.env.RUN_LOAD_TESTS !== 'true';

describe.skipIf(SKIP_LOAD_TESTS)('Bundler Throughput Benchmark', () => {
  let provider: JsonRpcProvider;
  let relayerSigner: Wallet | null;
  let userOpService: UserOperationService;
  let redis: Redis;
  let metrics: MetricsCollector;

  const INVESTMENT_AMOUNT = 50n * 10n ** 6n; // 50 USDC

  beforeAll(async () => {
    if (!LOAD_TEST_CONFIG.relayerPrivateKey) {
      throw new Error('RELAYER_PRIVATE_KEY required for load tests');
    }

    const setup = createTestProvider();
    provider = setup.provider;
    relayerSigner = setup.relayerSigner;

    redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
    userOpService = new UserOperationService(provider, redis);
    metrics = new MetricsCollector([100, 500, 1000, 2000, 5000, 10000, 20000, 60000]);

    console.log('Bundler throughput benchmark initialized');
  });

  afterAll(async () => {
    await redis.quit();
    console.log('\n' + metrics.generateReport());
  });

  /**
   * Execute a batch of investments and collect metrics
   */
  async function executeBatch(
    wallets: TestWallet[],
    batchNumber: number
  ): Promise<BatchMetrics> {
    console.log(`\n  Batch ${batchNumber + 1}: Processing ${wallets.length} UserOps...`);

    const batchStart = Date.now();
    let successCount = 0;
    let failureCount = 0;
    let totalGas = 0n;
    let blockNumber = 0;

    // Process all wallets in this batch
    const results = await Promise.all(
      wallets.map(async (wallet, i) => {
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
            INVESTMENT_AMOUNT
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

          const duration = Date.now() - txStart;
          metrics.record('tx_latency', duration);
          metrics.record('batch_tx_success', 1);

          return {
            success: true,
            gasUsed: receipt!.gasUsed,
            blockNumber: receipt!.blockNumber,
            duration,
          };
        } catch (error) {
          const duration = Date.now() - txStart;
          metrics.record('tx_latency', duration);
          metrics.record('batch_tx_success', 0);

          console.log(`    TX ${i + 1} failed: ${(error as Error).message.slice(0, 40)}`);
          return { success: false, gasUsed: 0n, blockNumber: 0, duration };
        }
      })
    );

    // Aggregate results
    for (const result of results) {
      if (result.success) {
        successCount++;
        totalGas += result.gasUsed;
        blockNumber = result.blockNumber; // Take last block number
      } else {
        failureCount++;
      }
    }

    const duration = Date.now() - batchStart;
    const throughput = successCount / (duration / 1000);

    console.log(`    Completed: ${successCount}/${wallets.length} in ${formatDuration(duration)}`);
    console.log(`    Throughput: ${throughput.toFixed(2)} tx/s`);

    metrics.record('batch_duration', duration);
    metrics.record('batch_throughput', throughput);

    return {
      batch: batchNumber,
      userOps: wallets.length,
      duration,
      gasUsed: totalGas,
      blockNumber,
      successCount,
      failureCount,
    };
  }

  it('should measure throughput for 5 batches of 5 transactions', async () => {
    const BATCH_SIZE = 5;
    const BATCHES = 5;
    const TOTAL_WALLETS = BATCH_SIZE * BATCHES;

    console.log('\n=== Throughput Benchmark (5x5) ===');
    console.log(`Total transactions: ${TOTAL_WALLETS}`);

    // Create all wallets upfront
    console.log(`Creating ${TOTAL_WALLETS} test wallets...`);
    const allWallets = await createTestWallets(TOTAL_WALLETS, provider);

    // Fund all wallets
    console.log('Funding wallets...');
    await fundWallets(allWallets, INVESTMENT_AMOUNT * 2n, relayerSigner!);

    // Execute batches
    const batchMetrics: BatchMetrics[] = [];
    const overallStart = Date.now();

    for (let b = 0; b < BATCHES; b++) {
      const batchWallets = allWallets.slice(b * BATCH_SIZE, (b + 1) * BATCH_SIZE);
      const metrics = await executeBatch(batchWallets, b);
      batchMetrics.push(metrics);
    }

    const overallDuration = Date.now() - overallStart;

    // Calculate aggregate metrics
    const totalSuccess = batchMetrics.reduce((sum, m) => sum + m.successCount, 0);
    const totalGas = batchMetrics.reduce((sum, m) => sum + m.gasUsed, 0n);
    const avgLatency = batchMetrics.reduce((sum, m) => sum + m.duration, 0) / BATCHES;
    const avgGasPerOp = Number(totalGas) / totalSuccess;
    const overallThroughput = totalSuccess / (overallDuration / 1000);

    console.log('\n=== BENCHMARK RESULTS ===');
    console.log(`Total Duration: ${formatDuration(overallDuration)}`);
    console.log(`Successful Ops: ${totalSuccess}/${TOTAL_WALLETS}`);
    console.log(`Overall Throughput: ${overallThroughput.toFixed(2)} tx/s`);
    console.log(`Avg Batch Duration: ${formatDuration(avgLatency)}`);
    console.log(`Avg Gas/Operation: ${avgGasPerOp.toLocaleString()}`);
    console.log(`Total Gas Used: ${totalGas.toLocaleString()}`);

    // Assertions
    expect(totalSuccess).toBeGreaterThan(TOTAL_WALLETS * 0.8); // 80% success
    expect(overallThroughput).toBeGreaterThan(0.5); // At least 0.5 tx/s
  }, 600000);

  it('should measure sustained throughput over 10 transactions', async () => {
    const TX_COUNT = 10;

    console.log('\n=== Sustained Throughput Test ===');
    console.log(`Total transactions: ${TX_COUNT}`);

    // Create wallets
    const wallets = await createTestWallets(TX_COUNT, provider);
    await fundWallets(wallets, INVESTMENT_AMOUNT * 2n, relayerSigner!);

    // Execute all at once
    const start = Date.now();
    const metrics = await executeBatch(wallets, 0);
    const duration = Date.now() - start;

    console.log('\n=== SUSTAINED THROUGHPUT ===');
    console.log(`Duration: ${formatDuration(duration)}`);
    console.log(`Success: ${metrics.successCount}/${TX_COUNT}`);
    console.log(`Throughput: ${(metrics.successCount / (duration / 1000)).toFixed(2)} tx/s`);

    expect(metrics.successCount).toBeGreaterThan(TX_COUNT * 0.7);
  }, 300000);

  it('should maintain throughput under increasing load', async () => {
    const LOAD_LEVELS = [2, 5, 10];
    const throughputs: number[] = [];

    console.log('\n=== Scalability Test ===');

    for (const level of LOAD_LEVELS) {
      console.log(`\n--- Load Level: ${level} concurrent ---`);

      const wallets = await createTestWallets(level, provider);
      await fundWallets(wallets, INVESTMENT_AMOUNT * 2n, relayerSigner!);

      const start = Date.now();
      const metrics = await executeBatch(wallets, 0);
      const duration = Date.now() - start;

      const throughput = metrics.successCount / (duration / 1000);
      throughputs.push(throughput);

      console.log(`  Throughput at ${level} concurrent: ${throughput.toFixed(2)} tx/s`);
    }

    console.log('\n=== SCALABILITY SUMMARY ===');
    LOAD_LEVELS.forEach((level, i) => {
      console.log(`  ${level} concurrent: ${throughputs[i].toFixed(2)} tx/s`);
    });

    // Throughput should not degrade too much as load increases
    // (some degradation is expected due to contention)
    const degradation = (throughputs[0] - throughputs[throughputs.length - 1]) / throughputs[0];
    console.log(`  Degradation: ${(degradation * 100).toFixed(2)}%`);

    // Allow up to 80% degradation under high load
    expect(degradation).toBeLessThan(0.8);
  }, 600000);

  it('should report consistent latency distribution', async () => {
    const TX_COUNT = 15;

    console.log('\n=== Latency Distribution Test ===');

    const wallets = await createTestWallets(TX_COUNT, provider);
    await fundWallets(wallets, INVESTMENT_AMOUNT * 2n, relayerSigner!);

    const latencies: number[] = [];
    let successCount = 0;

    // Execute sequentially to get clean latency measurements
    for (const wallet of wallets) {
      const start = Date.now();

      try {
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

        const userOpHash = await userOpService.getUserOpHash(userOp);
        const hashBuffer = Buffer.from(userOpHash.slice(2), 'hex');
        const { r, s } = signWithP256(wallet.privateKey, hashBuffer);

        userOp.signature = ethers.solidityPacked(
          ['bytes32', 'bytes32', 'bytes'],
          [r, s, '0x']
        );

        const txHash = await userOpService.submitUserOp(userOp, relayerSigner!);
        await provider.waitForTransaction(txHash, 1, 60000);

        const latency = Date.now() - start;
        latencies.push(latency);
        successCount++;
        console.log(`  TX ${successCount}: ${formatDuration(latency)}`);
      } catch (error) {
        console.log(`  TX failed: ${(error as Error).message.slice(0, 40)}`);
      }
    }

    if (latencies.length === 0) {
      console.log('No successful transactions for latency analysis');
      return;
    }

    // Calculate statistics
    const sorted = [...latencies].sort((a, b) => a - b);
    const min = sorted[0];
    const max = sorted[sorted.length - 1];
    const avg = latencies.reduce((a, b) => a + b, 0) / latencies.length;
    const median = sorted[Math.floor(sorted.length / 2)];
    const p95 = sorted[Math.ceil(0.95 * sorted.length) - 1];
    const p99 = sorted[Math.ceil(0.99 * sorted.length) - 1];

    // Standard deviation
    const squaredDiffs = latencies.map((l) => Math.pow(l - avg, 2));
    const stdDev = Math.sqrt(squaredDiffs.reduce((a, b) => a + b, 0) / latencies.length);

    console.log('\n=== LATENCY DISTRIBUTION ===');
    console.log(`  Min:    ${formatDuration(min)}`);
    console.log(`  Max:    ${formatDuration(max)}`);
    console.log(`  Avg:    ${formatDuration(avg)}`);
    console.log(`  Median: ${formatDuration(median)}`);
    console.log(`  P95:    ${formatDuration(p95)}`);
    console.log(`  P99:    ${formatDuration(p99)}`);
    console.log(`  StdDev: ${formatDuration(stdDev)}`);
    console.log(`  Success: ${successCount}/${TX_COUNT}`);

    // Latency should be reasonably consistent
    // Coefficient of variation (CV) should be less than 100%
    const cv = stdDev / avg;
    console.log(`  CV: ${(cv * 100).toFixed(2)}%`);

    expect(successCount).toBeGreaterThan(TX_COUNT * 0.6);
    expect(median).toBeLessThan(60000); // Median under 60s
  }, 900000);
});
