import { ethers } from "hardhat";

/**
 * Script to create all 64 pools on-chain to match the database
 * This ensures the database pools have corresponding on-chain pools
 */
async function main() {
  console.log("=== Pool Creation Script ===\n");

  const network = await ethers.provider.getNetwork();
  console.log(`Network: ${network.name} (chainId: ${network.chainId})`);

  const [signer] = await ethers.getSigners();
  console.log(`Signer: ${signer.address}`);

  const balance = await ethers.provider.getBalance(signer.address);
  console.log(`Balance: ${ethers.formatEther(balance)} AVAX\n`);

  // Connect to existing RWAPool contract
  const RWA_POOL_ADDRESS = process.env.RWA_POOL_ADDRESS;
  if (!RWA_POOL_ADDRESS) {
    throw new Error("RWA_POOL_ADDRESS not set in environment");
  }

  console.log(`RWAPool address: ${RWA_POOL_ADDRESS}`);

  const pool = await ethers.getContractAt("RWAPool", RWA_POOL_ADDRESS);

  // Check contract owner
  const owner = await pool.owner();
  console.log(`Contract owner: ${owner}`);
  console.log(`Signer matches owner: ${owner.toLowerCase() === signer.address.toLowerCase()}`);

  if (owner.toLowerCase() !== signer.address.toLowerCase()) {
    console.error("\n❌ ERROR: Signer is not the contract owner!");
    console.error(`   Owner:  ${owner}`);
    console.error(`   Signer: ${signer.address}`);
    console.error("\n   Only the owner can create pools.");
    console.error("   Check that DEPLOYER_PRIVATE_KEY matches the deployment wallet.");
    process.exitCode = 1;
    return;
  }

  // Get current pool count
  const currentPoolCount = await pool.poolCount();
  console.log(`\nCurrent on-chain pool count: ${currentPoolCount}`);

  // Check each pool 0-64 for existence and status
  console.log("\n=== Pool Status Check ===");
  const missingPools: number[] = [];
  const inactivePools: number[] = [];
  const activePools: number[] = [];

  for (let i = 0; i <= 64; i++) {
    try {
      const poolData = await pool.pools(i);
      // Pool exists if it has been created (check if any field is non-zero or active)
      // The struct: chainPoolId, totalDeposited, totalShares, minInvestment, maxInvestment, active
      const exists = poolData.minInvestment > 0n || poolData.maxInvestment > 0n || poolData.active;

      if (exists) {
        if (poolData.active) {
          activePools.push(i);
        } else {
          inactivePools.push(i);
        }
      } else {
        if (i > 0) { // Pool 0 is special, we start from 1
          missingPools.push(i);
        }
      }
    } catch (error) {
      if (i > 0) {
        missingPools.push(i);
      }
    }
  }

  console.log(`Active pools: ${activePools.join(", ") || "none"}`);
  console.log(`Inactive pools: ${inactivePools.join(", ") || "none"}`);
  console.log(`Missing pools: ${missingPools.length} (IDs: ${missingPools.slice(0, 10).join(", ")}${missingPools.length > 10 ? "..." : ""})`);

  // Pool configurations matching seed data
  const poolConfigs: Record<number, { min: bigint; max: bigint }> = {
    // TREASURY pools (1-12)
    1: { min: 100n * 10n**6n, max: 1_000_000n * 10n**6n },
    2: { min: 500n * 10n**6n, max: 5_000_000n * 10n**6n },
    3: { min: 1000n * 10n**6n, max: 10_000_000n * 10n**6n },
    4: { min: 250n * 10n**6n, max: 2_500_000n * 10n**6n },
    5: { min: 100n * 10n**6n, max: 1_000_000n * 10n**6n },
    6: { min: 500n * 10n**6n, max: 5_000_000n * 10n**6n },
    7: { min: 1000n * 10n**6n, max: 10_000_000n * 10n**6n },
    8: { min: 250n * 10n**6n, max: 2_500_000n * 10n**6n },
    9: { min: 100n * 10n**6n, max: 1_000_000n * 10n**6n },
    10: { min: 500n * 10n**6n, max: 5_000_000n * 10n**6n },
    11: { min: 1000n * 10n**6n, max: 10_000_000n * 10n**6n },
    12: { min: 250n * 10n**6n, max: 2_500_000n * 10n**6n },
    // REAL_ESTATE pools (13-24)
    13: { min: 5000n * 10n**6n, max: 50_000_000n * 10n**6n },
    14: { min: 10000n * 10n**6n, max: 100_000_000n * 10n**6n },
    15: { min: 2500n * 10n**6n, max: 25_000_000n * 10n**6n },
    16: { min: 1000n * 10n**6n, max: 10_000_000n * 10n**6n },
    17: { min: 5000n * 10n**6n, max: 50_000_000n * 10n**6n },
    18: { min: 10000n * 10n**6n, max: 100_000_000n * 10n**6n },
    19: { min: 2500n * 10n**6n, max: 25_000_000n * 10n**6n },
    20: { min: 1000n * 10n**6n, max: 10_000_000n * 10n**6n },
    21: { min: 5000n * 10n**6n, max: 50_000_000n * 10n**6n },
    22: { min: 10000n * 10n**6n, max: 100_000_000n * 10n**6n },
    23: { min: 2500n * 10n**6n, max: 25_000_000n * 10n**6n },
    24: { min: 1000n * 10n**6n, max: 10_000_000n * 10n**6n },
    // PRIVATE_CREDIT pools (25-36)
    25: { min: 10000n * 10n**6n, max: 100_000_000n * 10n**6n },
    26: { min: 5000n * 10n**6n, max: 50_000_000n * 10n**6n },
    27: { min: 25000n * 10n**6n, max: 250_000_000n * 10n**6n },
    28: { min: 2500n * 10n**6n, max: 25_000_000n * 10n**6n },
    29: { min: 10000n * 10n**6n, max: 100_000_000n * 10n**6n },
    30: { min: 5000n * 10n**6n, max: 50_000_000n * 10n**6n },
    31: { min: 25000n * 10n**6n, max: 250_000_000n * 10n**6n },
    32: { min: 2500n * 10n**6n, max: 25_000_000n * 10n**6n },
    33: { min: 10000n * 10n**6n, max: 100_000_000n * 10n**6n },
    34: { min: 5000n * 10n**6n, max: 50_000_000n * 10n**6n },
    35: { min: 25000n * 10n**6n, max: 250_000_000n * 10n**6n },
    36: { min: 2500n * 10n**6n, max: 25_000_000n * 10n**6n },
    // CORPORATE_BONDS pools (37-48)
    37: { min: 1000n * 10n**6n, max: 10_000_000n * 10n**6n },
    38: { min: 5000n * 10n**6n, max: 50_000_000n * 10n**6n },
    39: { min: 2500n * 10n**6n, max: 25_000_000n * 10n**6n },
    40: { min: 500n * 10n**6n, max: 5_000_000n * 10n**6n },
    41: { min: 1000n * 10n**6n, max: 10_000_000n * 10n**6n },
    42: { min: 5000n * 10n**6n, max: 50_000_000n * 10n**6n },
    43: { min: 2500n * 10n**6n, max: 25_000_000n * 10n**6n },
    44: { min: 500n * 10n**6n, max: 5_000_000n * 10n**6n },
    45: { min: 1000n * 10n**6n, max: 10_000_000n * 10n**6n },
    46: { min: 5000n * 10n**6n, max: 50_000_000n * 10n**6n },
    47: { min: 2500n * 10n**6n, max: 25_000_000n * 10n**6n },
    48: { min: 500n * 10n**6n, max: 5_000_000n * 10n**6n },
    // COMMODITIES pools (49-64)
    49: { min: 1000n * 10n**6n, max: 10_000_000n * 10n**6n },
    50: { min: 2500n * 10n**6n, max: 25_000_000n * 10n**6n },
    51: { min: 5000n * 10n**6n, max: 50_000_000n * 10n**6n },
    52: { min: 500n * 10n**6n, max: 5_000_000n * 10n**6n },
    53: { min: 1000n * 10n**6n, max: 10_000_000n * 10n**6n },
    54: { min: 2500n * 10n**6n, max: 25_000_000n * 10n**6n },
    55: { min: 5000n * 10n**6n, max: 50_000_000n * 10n**6n },
    56: { min: 500n * 10n**6n, max: 5_000_000n * 10n**6n },
    57: { min: 1000n * 10n**6n, max: 10_000_000n * 10n**6n },
    58: { min: 2500n * 10n**6n, max: 25_000_000n * 10n**6n },
    59: { min: 5000n * 10n**6n, max: 50_000_000n * 10n**6n },
    60: { min: 500n * 10n**6n, max: 5_000_000n * 10n**6n },
    61: { min: 1000n * 10n**6n, max: 10_000_000n * 10n**6n },
    62: { min: 2500n * 10n**6n, max: 25_000_000n * 10n**6n },
    63: { min: 5000n * 10n**6n, max: 50_000_000n * 10n**6n },
    64: { min: 500n * 10n**6n, max: 5_000_000n * 10n**6n },
  };

  // Step 1: Activate inactive pools
  if (inactivePools.length > 0) {
    console.log("\n=== Activating Inactive Pools ===");
    for (const poolId of inactivePools) {
      try {
        const config = poolConfigs[poolId];
        if (!config) {
          console.log(`   Pool ${poolId}: no config, skipping`);
          continue;
        }
        console.log(`   Activating pool ${poolId}...`);
        const tx = await pool.updatePool(poolId, config.min, config.max, true);
        await tx.wait();
        console.log(`   Pool ${poolId}: activated ✓`);
      } catch (error: any) {
        console.error(`   Pool ${poolId}: failed - ${error.message}`);
      }
    }
  }

  // Step 2: Create missing pools
  if (missingPools.length > 0) {
    console.log("\n=== Creating Missing Pools ===");
    let created = 0;
    let failed = 0;

    // Process in batches to avoid timeout
    const batchSize = 5;
    for (let i = 0; i < missingPools.length; i += batchSize) {
      const batch = missingPools.slice(i, i + batchSize);

      for (const poolId of batch) {
        const config = poolConfigs[poolId];
        if (!config) {
          console.log(`   Pool ${poolId}: no config, skipping`);
          continue;
        }

        try {
          console.log(`   Creating pool ${poolId} (min: ${ethers.formatUnits(config.min, 6)} USDC)...`);
          const tx = await pool.createPool(poolId, config.min, config.max);
          await tx.wait();
          console.log(`   Pool ${poolId}: created ✓`);
          created++;
        } catch (error: any) {
          if (error.message.includes("PoolAlreadyExists")) {
            console.log(`   Pool ${poolId}: already exists`);
          } else {
            console.error(`   Pool ${poolId}: failed - ${error.message.slice(0, 100)}`);
            failed++;
          }
        }
      }

      console.log(`   Batch ${Math.floor(i/batchSize) + 1} complete (${created} created, ${failed} failed)`);
    }

    console.log(`\n   Total: ${created} created, ${failed} failed`);
  }

  // Final verification
  console.log("\n=== Final Verification ===");
  const finalPoolCount = await pool.poolCount();
  console.log(`Final on-chain pool count: ${finalPoolCount}`);

  // Verify all database pools (1-64) are now active
  let allActive = true;
  const stillMissing: number[] = [];
  const stillInactive: number[] = [];

  for (let i = 1; i <= 64; i++) {
    try {
      const poolData = await pool.pools(i);
      if (!poolData.active) {
        if (poolData.minInvestment === 0n && poolData.maxInvestment === 0n) {
          stillMissing.push(i);
        } else {
          stillInactive.push(i);
        }
        allActive = false;
      }
    } catch {
      stillMissing.push(i);
      allActive = false;
    }
  }

  if (allActive) {
    console.log("✅ All 64 pools (1-64) are active on-chain!");
  } else {
    console.log("❌ Some pools are still not active:");
    if (stillMissing.length > 0) {
      console.log(`   Missing: ${stillMissing.join(", ")}`);
    }
    if (stillInactive.length > 0) {
      console.log(`   Inactive: ${stillInactive.join(", ")}`);
    }
  }

  console.log("\n=== Done ===");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
