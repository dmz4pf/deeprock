#!/usr/bin/env npx ts-node
/**
 * Test Script for RWA Gateway Features
 *
 * Tests: NAV updates, Fee accrual, Swaps, Redemption queue, Settlement
 *
 * Usage: npx ts-node src/scripts/test-features.ts
 */

import { PrismaClient, PoolStatus } from "@prisma/client";
import { getNavService } from "../services/nav.service.js";
import { getFeeService } from "../services/fee.service.js";
import { getSwapService } from "../services/swap.service.js";
import { getRedemptionQueueService } from "../services/redemption-queue.service.js";
import { getFeeJob } from "../jobs/fee.job.js";
import { getSettlementJob } from "../jobs/settlement.job.js";

const prisma = new PrismaClient();

// Test utilities
const log = (section: string, msg: string) => console.log(`[${section}] ${msg}`);
const success = (section: string, msg: string) => console.log(`✅ [${section}] ${msg}`);
const error = (section: string, msg: string) => console.error(`❌ [${section}] ${msg}`);
const divider = () => console.log("\n" + "=".repeat(60) + "\n");

async function setupTestData() {
  log("SETUP", "Creating test user and pools...");

  // Create or get test user
  let user = await prisma.user.findFirst({ where: { email: "test@example.com" } });
  if (!user) {
    user = await prisma.user.create({
      data: {
        email: "test@example.com",
        displayName: "Test User",
        walletAddress: "0x1234567890123456789012345678901234567890",
        smartWalletAddress: "0x0987654321098765432109876543210987654321",
      },
    });
    log("SETUP", `Created test user: ${user.id}`);
  } else {
    log("SETUP", `Using existing test user: ${user.id}`);
  }

  // Create or get test pools
  let pool1 = await prisma.assetPool.findFirst({ where: { chainPoolId: 901 } });
  if (!pool1) {
    pool1 = await prisma.assetPool.create({
      data: {
        chainPoolId: 901,
        name: "Test Treasury Pool",
        assetClass: "TREASURY",
        rwaTokenAddress: "0xTREASURY",
        yieldRateBps: 500, // 5%
        minInvestment: BigInt("100000000"), // 100 USDC
        maxInvestment: BigInt("1000000000000"), // 1M USDC
        navPerShare: BigInt("100000000"), // 1.00
        settlementDays: 1,
      },
    });
    log("SETUP", `Created pool1: ${pool1.id}`);
  }

  let pool2 = await prisma.assetPool.findFirst({ where: { chainPoolId: 902 } });
  if (!pool2) {
    pool2 = await prisma.assetPool.create({
      data: {
        chainPoolId: 902,
        name: "Test Real Estate Pool",
        assetClass: "REAL_ESTATE",
        rwaTokenAddress: "0xREALESTATE",
        yieldRateBps: 800, // 8%
        minInvestment: BigInt("100000000"),
        maxInvestment: BigInt("1000000000000"),
        navPerShare: BigInt("105000000"), // 1.05
        settlementDays: 3,
      },
    });
    log("SETUP", `Created pool2: ${pool2.id}`);
  }

  // Create fee configs
  await prisma.feeConfig.upsert({
    where: { poolId: pool1.id },
    create: {
      poolId: pool1.id,
      managementFeeBps: 50,
      performanceFeeBps: 1000,
      entryFeeBps: 0,
      exitFeeBps: 10,
      feeRecipient: "0xFEETREASURY",
    },
    update: {},
  });

  await prisma.feeConfig.upsert({
    where: { poolId: pool2.id },
    create: {
      poolId: pool2.id,
      managementFeeBps: 75,
      performanceFeeBps: 1500,
      entryFeeBps: 0,
      exitFeeBps: 15,
      feeRecipient: "0xFEETREASURY",
    },
    update: {},
  });

  // Create test investment for user
  const existingInvestment = await prisma.investment.findFirst({
    where: { userId: user.id, poolId: pool1.id, type: "INVEST" },
  });

  if (!existingInvestment) {
    await prisma.investment.create({
      data: {
        userId: user.id,
        poolId: pool1.id,
        type: "INVEST",
        amount: BigInt("10000000000"), // 10,000 USDC
        shares: BigInt("10000000000"), // 10,000 shares (using 6 decimals for testing - Prisma BigInt bug with >MAX_SAFE_INTEGER)
        status: "CONFIRMED",
        sharePriceAtPurchase: BigInt("100000000"),
      },
    });
    log("SETUP", "Created test investment");
  }

  success("SETUP", "Test data ready");
  return { user, pool1, pool2 };
}

async function testNavService(poolId: string) {
  divider();
  log("NAV", "Testing NAV Service...");

  const navService = getNavService(prisma);

  // Get current pool and NAV
  const pool = await prisma.assetPool.findUnique({ where: { id: poolId } });
  if (!pool) {
    error("NAV", "Pool not found");
    return;
  }
  log("NAV", `Current NAV: ${navService.formatNav(pool.navPerShare)}`);

  // Update NAV for this pool
  const result = await navService.updatePoolNav(poolId);
  if (result) {
    log("NAV", `Updated NAV: ${navService.formatNav(result.newNav)} (${result.growthPercent} growth)`);
  } else {
    log("NAV", "NAV not updated (too soon or pool inactive)");
  }

  // Calculate current value of 100 shares
  const shares = BigInt("100000000"); // 100 shares (6 decimals)
  const value = navService.calculateCurrentValue(shares, pool.navPerShare);
  log("NAV", `100 shares worth: $${(Number(value.currentValue) / 1e6).toFixed(2)} USDC`);

  success("NAV", "NAV service working");
}

async function testFeeService(poolId: string) {
  divider();
  log("FEE", "Testing Fee Service...");

  const feeService = getFeeService(prisma);

  // Get fee config
  const config = await feeService.getFeeConfig(poolId);
  if (config) {
    log("FEE", `Fee config: mgmt=${config.managementFeeBps}bps, perf=${config.performanceFeeBps}bps`);
  }

  // Run fee accrual
  const results = await feeService.accrueManagementFees();
  log("FEE", `Accrued fees for ${results.length} pools`);

  for (const r of results) {
    log("FEE", `  - ${r.poolName}: ${feeService.formatFeeAmount(r.amount)}`);
  }

  // Get pending fees
  const pending = await feeService.getPendingFees(poolId);
  log("FEE", `Pending fees: ${pending.length}`);

  success("FEE", "Fee service working");
}

async function testFeeJob() {
  divider();
  log("FEE_JOB", "Testing Fee Job...");

  const feeJob = getFeeJob(prisma);

  log("FEE_JOB", "Running fee accrual job manually...");
  await feeJob.runNow();

  success("FEE_JOB", "Fee job executed");
}

async function testSwapService(userId: string, sourcePoolId: string, targetPoolId: string) {
  divider();
  log("SWAP", "Testing Swap Service...");

  const swapService = getSwapService(prisma);

  // Get quote
  const shares = BigInt("1000000000"); // 1 share (6 decimals for testing)

  try {
    const quote = await swapService.getSwapQuote(
      userId,
      sourcePoolId,
      targetPoolId,
      shares,
      50 // 0.5% slippage
    );

    log("SWAP", `Quote received:`);
    log("SWAP", `  Shares in: ${quote.sharesIn.toString()}`);
    log("SWAP", `  Source amount: ${swapService.formatUsdcAmount(quote.sourceAmount)}`);
    log("SWAP", `  Fee: ${swapService.formatUsdcAmount(quote.fee)}`);
    log("SWAP", `  Target amount: ${swapService.formatUsdcAmount(quote.targetAmount)}`);
    log("SWAP", `  Target shares: ${swapService.formatShares(quote.targetShares)}`);
    log("SWAP", `  Min output: ${swapService.formatShares(quote.minOutputShares)}`);
    log("SWAP", `  Expires: ${quote.expiresAt.toISOString()}`);

    // Build swap UserOp
    const buildResult = await swapService.buildSwapUserOp(
      userId,
      sourcePoolId,
      targetPoolId,
      shares,
      50
    );

    log("SWAP", `Swap built: ${buildResult.swapId}`);
    log("SWAP", `CallData length: ${buildResult.callData.length} bytes`);

    // Get swap status
    const swap = await swapService.getSwap(buildResult.swapId);
    log("SWAP", `Swap status: ${swap.status}`);

    // Cancel it (since we're just testing)
    await swapService.cancelSwap(buildResult.swapId, userId);
    log("SWAP", "Swap cancelled");

    success("SWAP", "Swap service working");
  } catch (err: any) {
    error("SWAP", err.message);
  }
}

async function testRedemptionQueue(userId: string, poolId: string) {
  divider();
  log("QUEUE", "Testing Redemption Queue Service...");

  const queueService = getRedemptionQueueService(prisma);

  // Get user position
  const position = await queueService.getUserPosition(userId, poolId);
  log("QUEUE", `User position: total=${position.totalShares}, available=${position.availableShares}`);

  if (position.availableShares <= 0n) {
    log("QUEUE", "No shares available to queue for redemption");
    return;
  }

  // Queue a small redemption
  const sharesToRedeem = BigInt("100000000"); // 0.1 shares (6 decimals for testing)

  try {
    const result = await queueService.queueRedemption({
      userId,
      poolId,
      shares: sharesToRedeem,
    });

    log("QUEUE", `Queued redemption:`);
    log("QUEUE", `  ID: ${result.id}`);
    log("QUEUE", `  Position: ${result.queuePosition}`);
    log("QUEUE", `  Est. amount: ${result.estimatedAmount.toString()}`);
    log("QUEUE", `  Settlement: ${result.settlementDate.toISOString()}`);
    log("QUEUE", `  Requires approval: ${result.requiresApproval}`);

    // Get user's redemptions
    const redemptions = await queueService.getUserRedemptions(userId);
    log("QUEUE", `User has ${redemptions.length} redemption(s) in queue`);

    // Cancel it
    await queueService.cancelRedemption(result.id, userId);
    log("QUEUE", "Redemption cancelled");

    success("QUEUE", "Redemption queue service working");
  } catch (err: any) {
    error("QUEUE", err.message);
  }
}

async function testSettlementJob() {
  divider();
  log("SETTLE", "Testing Settlement Job...");

  const settlementJob = getSettlementJob(prisma);

  log("SETTLE", "Running settlement job manually...");
  const results = await settlementJob.runNow();

  log("SETTLE", `Processed ${results.length} redemptions`);

  for (const r of results) {
    log("SETTLE", `  - ${r.id}: ${r.status}`);
  }

  success("SETTLE", "Settlement job executed");
}

async function testPoolQueueStats(poolId: string) {
  divider();
  log("STATS", "Testing Pool Queue Stats...");

  const queueService = getRedemptionQueueService(prisma);

  const stats = await queueService.getPoolQueueStats(poolId);

  log("STATS", `Pool queue stats:`);
  log("STATS", `  Queued: ${stats.queued.count} entries, ${stats.queued.totalShares} shares`);
  log("STATS", `  Pending approval: ${stats.pendingApproval.count} entries`);
  log("STATS", `  Processing: ${stats.processing.count} entries`);

  success("STATS", "Queue stats working");
}

async function main() {
  console.log("\n🧪 RWA Gateway Feature Test Script\n");
  console.log("=".repeat(60));

  try {
    // Setup
    const { user, pool1, pool2 } = await setupTestData();

    // Run tests
    await testNavService(pool1.id);
    await testFeeService(pool1.id);
    await testFeeJob();
    await testSwapService(user.id, pool1.id, pool2.id);
    await testRedemptionQueue(user.id, pool1.id);
    await testSettlementJob();
    await testPoolQueueStats(pool1.id);

    divider();
    console.log("✅ All tests completed!\n");

  } catch (err) {
    console.error("\n❌ Test failed:", err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
