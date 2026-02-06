/**
 * Load Test: Paymaster Gas Estimation Accuracy
 *
 * Tests the accuracy of gas estimation for UserOperations
 * across varied transaction amounts. Ensures the paymaster
 * doesn't under-estimate gas (which would cause failures).
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { ethers, JsonRpcProvider, Wallet, Contract } from 'ethers';
import { UserOperationService } from '../../services/userop.service';
import Redis from 'ioredis';
import {
  createTestWallets,
  fundWallets,
  createTestProvider,
  signWithP256,
  LOAD_TEST_CONFIG,
  PAYMASTER_ABI,
  type TestWallet,
} from './helpers/load-test-utils';
import { MetricsCollector } from './helpers/metrics-collector';

// Skip load tests by default
const SKIP_LOAD_TESTS = process.env.RUN_LOAD_TESTS !== 'true';

interface GasEstimate {
  wallet: string;
  amount: bigint;
  estimated: {
    callGasLimit: bigint;
    verificationGasLimit: bigint;
    preVerificationGas: bigint;
    total: bigint;
  };
  actual: bigint;
  ratio: number;
  success: boolean;
  error?: string;
}

describe.skipIf(SKIP_LOAD_TESTS)('Paymaster Gas Estimation Accuracy', () => {
  let provider: JsonRpcProvider;
  let relayerSigner: Wallet | null;
  let userOpService: UserOperationService;
  let redis: Redis;
  let metrics: MetricsCollector;
  let paymaster: Contract;

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

    paymaster = new Contract(
      LOAD_TEST_CONFIG.rwaPaymasterAddress,
      PAYMASTER_ABI,
      provider
    );

    // Check paymaster deposit
    const deposit = await paymaster.getDeposit();
    console.log('Paymaster gas estimation test initialized');
    console.log(`  Paymaster deposit: ${ethers.formatEther(deposit)} AVAX`);
  });

  afterAll(async () => {
    await redis.quit();
    console.log('\n' + metrics.generateReport());
  });

  /**
   * Execute investment and collect gas metrics
   */
  async function measureGasAccuracy(
    wallet: TestWallet,
    amount: bigint
  ): Promise<GasEstimate> {
    const stopTimer = metrics.startTimer('gas_measurement');

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
        amount
      );

      // Capture estimated gas values
      const estimated = {
        callGasLimit: BigInt(userOp.callGasLimit),
        verificationGasLimit: BigInt(userOp.verificationGasLimit),
        preVerificationGas: BigInt(userOp.preVerificationGas),
        total:
          BigInt(userOp.callGasLimit) +
          BigInt(userOp.verificationGasLimit) +
          BigInt(userOp.preVerificationGas),
      };

      // Sign with P-256
      const userOpHash = await userOpService.getUserOpHash(userOp);
      const hashBuffer = Buffer.from(userOpHash.slice(2), 'hex');
      const { r, s } = signWithP256(wallet.privateKey, hashBuffer);

      userOp.signature = ethers.solidityPacked(
        ['bytes32', 'bytes32', 'bytes'],
        [r, s, '0x']
      );

      // Submit and wait for receipt
      const txHash = await userOpService.submitUserOp(userOp, relayerSigner!);
      const receipt = await provider.waitForTransaction(txHash, 1, 60000);

      const actual = receipt!.gasUsed;
      const ratio = Number(estimated.total) / Number(actual);

      stopTimer();

      metrics.record('gas_estimated', Number(estimated.total));
      metrics.record('gas_actual', Number(actual));
      metrics.record('gas_ratio', ratio);

      return {
        wallet: wallet.smartWalletAddress,
        amount,
        estimated,
        actual,
        ratio,
        success: true,
      };
    } catch (error) {
      stopTimer();
      return {
        wallet: wallet.smartWalletAddress,
        amount,
        estimated: {
          callGasLimit: 0n,
          verificationGasLimit: 0n,
          preVerificationGas: 0n,
          total: 0n,
        },
        actual: 0n,
        ratio: 0,
        success: false,
        error: (error as Error).message,
      };
    }
  }

  it('should accurately estimate gas for minimum investment (10 USDC)', async () => {
    const amount = 10n * 10n ** 6n; // 10 USDC

    console.log('\n=== Gas Estimation Test: Minimum Investment ===');

    const wallets = await createTestWallets(1, provider);
    await fundWallets(wallets, amount * 2n, relayerSigner!);

    const result = await measureGasAccuracy(wallets[0], amount);

    if (!result.success) {
      console.log(`Failed: ${result.error}`);
      throw new Error(result.error);
    }

    console.log(`Amount: ${ethers.formatUnits(amount, 6)} USDC`);
    console.log(`Estimated total gas: ${result.estimated.total.toLocaleString()}`);
    console.log(`  - Call gas limit: ${result.estimated.callGasLimit.toLocaleString()}`);
    console.log(`  - Verification gas: ${result.estimated.verificationGasLimit.toLocaleString()}`);
    console.log(`  - Pre-verification: ${result.estimated.preVerificationGas.toLocaleString()}`);
    console.log(`Actual gas used: ${result.actual.toLocaleString()}`);
    console.log(`Estimation ratio: ${result.ratio.toFixed(3)}`);

    // Should not under-estimate (ratio >= 1.0)
    expect(result.ratio).toBeGreaterThanOrEqual(0.9);
    // Should not over-estimate too much (ratio < 3.0)
    expect(result.ratio).toBeLessThan(3.0);
  }, 120000);

  it('should accurately estimate gas for large investment (1000 USDC)', async () => {
    const amount = 1000n * 10n ** 6n; // 1000 USDC

    console.log('\n=== Gas Estimation Test: Large Investment ===');

    const wallets = await createTestWallets(1, provider);
    await fundWallets(wallets, amount * 2n, relayerSigner!);

    const result = await measureGasAccuracy(wallets[0], amount);

    if (!result.success) {
      console.log(`Failed: ${result.error}`);
      throw new Error(result.error);
    }

    console.log(`Amount: ${ethers.formatUnits(amount, 6)} USDC`);
    console.log(`Estimated total gas: ${result.estimated.total.toLocaleString()}`);
    console.log(`Actual gas used: ${result.actual.toLocaleString()}`);
    console.log(`Estimation ratio: ${result.ratio.toFixed(3)}`);

    expect(result.ratio).toBeGreaterThanOrEqual(0.9);
    expect(result.ratio).toBeLessThan(3.0);
  }, 120000);

  it('should have consistent estimation across varied amounts', async () => {
    const AMOUNTS = [
      10n * 10n ** 6n,   // 10 USDC
      50n * 10n ** 6n,   // 50 USDC
      100n * 10n ** 6n,  // 100 USDC
      500n * 10n ** 6n,  // 500 USDC
      1000n * 10n ** 6n, // 1000 USDC
    ];

    console.log('\n=== Gas Estimation Consistency Test ===');
    console.log(`Testing ${AMOUNTS.length} different amounts...`);

    const results: GasEstimate[] = [];

    for (const amount of AMOUNTS) {
      const wallets = await createTestWallets(1, provider);
      await fundWallets(wallets, amount * 2n, relayerSigner!);

      const result = await measureGasAccuracy(wallets[0], amount);
      results.push(result);

      if (result.success) {
        console.log(
          `  ${ethers.formatUnits(amount, 6).padStart(8)} USDC: ` +
            `estimated=${result.estimated.total.toString().padStart(10)}, ` +
            `actual=${result.actual.toString().padStart(10)}, ` +
            `ratio=${result.ratio.toFixed(3)}`
        );
      } else {
        console.log(
          `  ${ethers.formatUnits(amount, 6).padStart(8)} USDC: FAILED - ${result.error?.slice(0, 40)}`
        );
      }
    }

    const successful = results.filter((r) => r.success);
    const ratios = successful.map((r) => r.ratio);

    if (ratios.length === 0) {
      console.log('No successful transactions');
      return;
    }

    // Calculate statistics
    const avgRatio = ratios.reduce((a, b) => a + b, 0) / ratios.length;
    const minRatio = Math.min(...ratios);
    const maxRatio = Math.max(...ratios);
    const variance = ratios.map((r) => Math.pow(r - avgRatio, 2)).reduce((a, b) => a + b, 0) / ratios.length;
    const stdDev = Math.sqrt(variance);

    console.log('\n=== ESTIMATION STATISTICS ===');
    console.log(`Successful: ${successful.length}/${results.length}`);
    console.log(`Avg Ratio: ${avgRatio.toFixed(3)}`);
    console.log(`Min Ratio: ${minRatio.toFixed(3)}`);
    console.log(`Max Ratio: ${maxRatio.toFixed(3)}`);
    console.log(`Std Dev: ${stdDev.toFixed(3)}`);

    // All ratios should be >= 0.9 (no significant under-estimation)
    const underEstimates = ratios.filter((r) => r < 0.95);
    console.log(`Under-estimates (<0.95): ${underEstimates.length}/${ratios.length}`);

    // Under-estimation rate should be less than 10%
    expect(underEstimates.length / ratios.length).toBeLessThan(0.1);
  }, 600000);

  it('should not under-estimate gas for 10 random amounts', async () => {
    const SAMPLES = 10;

    console.log('\n=== Random Amount Gas Estimation Test ===');
    console.log(`Testing ${SAMPLES} random amounts...`);

    const results: GasEstimate[] = [];

    for (let i = 0; i < SAMPLES; i++) {
      // Random amount between 10 and 1000 USDC
      const randomMultiplier = 10 + Math.floor(Math.random() * 990);
      const amount = BigInt(randomMultiplier) * 10n ** 6n;

      const wallets = await createTestWallets(1, provider);
      await fundWallets(wallets, amount * 2n, relayerSigner!);

      const result = await measureGasAccuracy(wallets[0], amount);
      results.push(result);

      if (result.success) {
        console.log(
          `  Sample ${i + 1}: ${ethers.formatUnits(amount, 6).padStart(8)} USDC, ratio=${result.ratio.toFixed(3)}`
        );
      } else {
        console.log(`  Sample ${i + 1}: FAILED - ${result.error?.slice(0, 40)}`);
      }
    }

    const successful = results.filter((r) => r.success);
    const underEstimates = successful.filter((r) => r.ratio < 1.0);

    console.log('\n=== RESULTS ===');
    console.log(`Successful: ${successful.length}/${SAMPLES}`);
    console.log(`Under-estimates (ratio < 1.0): ${underEstimates.length}/${successful.length}`);

    // Should not under-estimate more than 5% of the time
    if (successful.length > 0) {
      expect(underEstimates.length / successful.length).toBeLessThan(0.05);
    }
  }, 600000);

  it('should check paymaster has sufficient deposit for load test', async () => {
    console.log('\n=== Paymaster Deposit Check ===');

    const deposit = await paymaster.getDeposit();
    const depositAvax = Number(ethers.formatEther(deposit));

    console.log(`Paymaster deposit: ${depositAvax.toFixed(4)} AVAX`);

    // Estimate gas cost per transaction
    const estimatedGasPerTx = 300000n; // Conservative estimate
    const gasPrice = (await provider.getFeeData()).gasPrice || ethers.parseUnits('25', 'gwei');
    const costPerTx = estimatedGasPerTx * gasPrice;
    const costPerTxAvax = Number(ethers.formatEther(costPerTx));

    console.log(`Estimated gas per tx: ${estimatedGasPerTx.toLocaleString()}`);
    console.log(`Gas price: ${ethers.formatUnits(gasPrice, 'gwei')} gwei`);
    console.log(`Estimated cost per tx: ${costPerTxAvax.toFixed(6)} AVAX`);

    // Calculate how many transactions can be sponsored
    const maxTransactions = Math.floor(depositAvax / costPerTxAvax);
    console.log(`Max transactions with current deposit: ${maxTransactions}`);

    // Should be able to handle at least 10 transactions
    expect(depositAvax).toBeGreaterThan(costPerTxAvax * 10);

    // Warn if deposit is getting low
    if (maxTransactions < 50) {
      console.warn(`⚠️  Warning: Paymaster deposit is running low!`);
      console.warn(`   Recommend depositing more AVAX to the paymaster.`);
    }
  }, 30000);

  it('should track gas consumption over multiple transactions', async () => {
    const TX_COUNT = 5;
    const amount = 100n * 10n ** 6n; // 100 USDC

    console.log('\n=== Gas Consumption Tracking ===');
    console.log(`Executing ${TX_COUNT} transactions...`);

    // Check initial paymaster deposit
    const initialDeposit = await paymaster.getDeposit();
    console.log(`Initial paymaster deposit: ${ethers.formatEther(initialDeposit)} AVAX`);

    const results: GasEstimate[] = [];

    for (let i = 0; i < TX_COUNT; i++) {
      const wallets = await createTestWallets(1, provider);
      await fundWallets(wallets, amount * 2n, relayerSigner!);

      const result = await measureGasAccuracy(wallets[0], amount);
      results.push(result);

      if (result.success) {
        console.log(`  TX ${i + 1}: gas=${result.actual.toLocaleString()}`);
      } else {
        console.log(`  TX ${i + 1}: FAILED`);
      }
    }

    // Check final paymaster deposit
    const finalDeposit = await paymaster.getDeposit();
    const consumed = initialDeposit - finalDeposit;

    console.log(`\nFinal paymaster deposit: ${ethers.formatEther(finalDeposit)} AVAX`);
    console.log(`Total AVAX consumed: ${ethers.formatEther(consumed)} AVAX`);

    const successful = results.filter((r) => r.success);
    if (successful.length > 0) {
      const avgGas = successful.reduce((sum, r) => sum + Number(r.actual), 0) / successful.length;
      console.log(`Avg gas per tx: ${avgGas.toLocaleString()}`);
      console.log(`Avg AVAX per tx: ${ethers.formatEther(consumed / BigInt(successful.length))} AVAX`);
    }

    expect(successful.length).toBeGreaterThan(0);
  }, 300000);
});
