import { ethers } from "hardhat";

async function main() {
  console.log("=== RWA Gateway Contract Deployment ===\n");

  const network = await ethers.provider.getNetwork();
  console.log(`Network: ${network.name} (chainId: ${network.chainId})`);

  const [deployer] = await ethers.getSigners();
  console.log(`Deployer: ${deployer.address}`);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log(`Balance: ${ethers.formatEther(balance)} AVAX\n`);

  if (balance === 0n) {
    console.error("ERROR: Deployer has no AVAX. Fund the wallet first.");
    console.error("Fuji faucet: https://faucet.avax.network/");
    process.exitCode = 1;
    return;
  }

  const relayerAddress = process.env.RELAYER_ADDRESS;

  // ==================== 1. Deploy MockUSDC ====================
  console.log("1. Deploying MockUSDC...");
  const MockUSDC = await ethers.getContractFactory("MockUSDC");
  const usdc = await MockUSDC.deploy();
  await usdc.waitForDeployment();
  const usdcAddress = await usdc.getAddress();
  console.log(`   MockUSDC deployed to: ${usdcAddress}`);

  // ==================== 2. Deploy BiometricRegistry ====================
  console.log("2. Deploying BiometricRegistry...");
  const BiometricRegistry = await ethers.getContractFactory("BiometricRegistry");
  const registry = await BiometricRegistry.deploy();
  await registry.waitForDeployment();
  const registryAddress = await registry.getAddress();
  console.log(`   BiometricRegistry deployed to: ${registryAddress}`);

  // ==================== 3. Deploy RWAPool ====================
  console.log("3. Deploying RWAPool...");
  const RWAPool = await ethers.getContractFactory("RWAPool");
  const pool = await RWAPool.deploy(usdcAddress, registryAddress);
  await pool.waitForDeployment();
  const poolAddress = await pool.getAddress();
  console.log(`   RWAPool deployed to: ${poolAddress}`);

  // ==================== 4. Configure Relayer ====================
  if (relayerAddress && ethers.isAddress(relayerAddress)) {
    console.log(`\n4. Configuring relayer: ${relayerAddress}`);

    // Set relayer as trusted on BiometricRegistry
    let tx = await registry.setTrustedRelayer(relayerAddress, true);
    await tx.wait();
    console.log("   - BiometricRegistry: relayer trusted ✓");

    // Set relayer as trusted on RWAPool
    tx = await pool.setTrustedRelayer(relayerAddress, true);
    await tx.wait();
    console.log("   - RWAPool: relayer trusted ✓");
  } else {
    console.log("\n4. SKIPPED: No RELAYER_ADDRESS provided");
    console.log("   Set it later with setTrustedRelayer()");
  }

  // ==================== 5. Create Initial Pools ====================
  console.log("\n5. Creating initial investment pools on-chain...");

  // Pool configurations matching seed data (chainPoolId, minInvestment, maxInvestment)
  const poolConfigs = [
    // TREASURY pools (1-12)
    { id: 1, min: 100n * 10n**6n, max: 1_000_000n * 10n**6n },  // US Treasury Fund
    { id: 2, min: 500n * 10n**6n, max: 5_000_000n * 10n**6n },  // Treasury Plus
    { id: 3, min: 1000n * 10n**6n, max: 10_000_000n * 10n**6n }, // T-Bill Direct
    { id: 4, min: 250n * 10n**6n, max: 2_500_000n * 10n**6n },  // Short-Term Treasury
    { id: 5, min: 100n * 10n**6n, max: 1_000_000n * 10n**6n },
    { id: 6, min: 500n * 10n**6n, max: 5_000_000n * 10n**6n },
    { id: 7, min: 1000n * 10n**6n, max: 10_000_000n * 10n**6n },
    { id: 8, min: 250n * 10n**6n, max: 2_500_000n * 10n**6n },
    { id: 9, min: 100n * 10n**6n, max: 1_000_000n * 10n**6n },
    { id: 10, min: 500n * 10n**6n, max: 5_000_000n * 10n**6n },
    { id: 11, min: 1000n * 10n**6n, max: 10_000_000n * 10n**6n },
    { id: 12, min: 250n * 10n**6n, max: 2_500_000n * 10n**6n },
    // REAL_ESTATE pools (13-24)
    { id: 13, min: 5000n * 10n**6n, max: 50_000_000n * 10n**6n },
    { id: 14, min: 10000n * 10n**6n, max: 100_000_000n * 10n**6n },
    { id: 15, min: 2500n * 10n**6n, max: 25_000_000n * 10n**6n },
    { id: 16, min: 1000n * 10n**6n, max: 10_000_000n * 10n**6n },
    { id: 17, min: 5000n * 10n**6n, max: 50_000_000n * 10n**6n },
    { id: 18, min: 10000n * 10n**6n, max: 100_000_000n * 10n**6n },
    { id: 19, min: 2500n * 10n**6n, max: 25_000_000n * 10n**6n },
    { id: 20, min: 1000n * 10n**6n, max: 10_000_000n * 10n**6n },
    { id: 21, min: 5000n * 10n**6n, max: 50_000_000n * 10n**6n },
    { id: 22, min: 10000n * 10n**6n, max: 100_000_000n * 10n**6n },
    { id: 23, min: 2500n * 10n**6n, max: 25_000_000n * 10n**6n },
    { id: 24, min: 1000n * 10n**6n, max: 10_000_000n * 10n**6n },
    // PRIVATE_CREDIT pools (25-36)
    { id: 25, min: 10000n * 10n**6n, max: 100_000_000n * 10n**6n },
    { id: 26, min: 5000n * 10n**6n, max: 50_000_000n * 10n**6n },
    { id: 27, min: 25000n * 10n**6n, max: 250_000_000n * 10n**6n },
    { id: 28, min: 2500n * 10n**6n, max: 25_000_000n * 10n**6n },
    { id: 29, min: 10000n * 10n**6n, max: 100_000_000n * 10n**6n },
    { id: 30, min: 5000n * 10n**6n, max: 50_000_000n * 10n**6n },
    { id: 31, min: 25000n * 10n**6n, max: 250_000_000n * 10n**6n },
    { id: 32, min: 2500n * 10n**6n, max: 25_000_000n * 10n**6n },
    { id: 33, min: 10000n * 10n**6n, max: 100_000_000n * 10n**6n },
    { id: 34, min: 5000n * 10n**6n, max: 50_000_000n * 10n**6n },
    { id: 35, min: 25000n * 10n**6n, max: 250_000_000n * 10n**6n },
    { id: 36, min: 2500n * 10n**6n, max: 25_000_000n * 10n**6n },
    // CORPORATE_BONDS pools (37-48)
    { id: 37, min: 1000n * 10n**6n, max: 10_000_000n * 10n**6n },
    { id: 38, min: 5000n * 10n**6n, max: 50_000_000n * 10n**6n },
    { id: 39, min: 2500n * 10n**6n, max: 25_000_000n * 10n**6n },
    { id: 40, min: 500n * 10n**6n, max: 5_000_000n * 10n**6n },
    { id: 41, min: 1000n * 10n**6n, max: 10_000_000n * 10n**6n },
    { id: 42, min: 5000n * 10n**6n, max: 50_000_000n * 10n**6n },
    { id: 43, min: 2500n * 10n**6n, max: 25_000_000n * 10n**6n },
    { id: 44, min: 500n * 10n**6n, max: 5_000_000n * 10n**6n },
    { id: 45, min: 1000n * 10n**6n, max: 10_000_000n * 10n**6n },
    { id: 46, min: 5000n * 10n**6n, max: 50_000_000n * 10n**6n },
    { id: 47, min: 2500n * 10n**6n, max: 25_000_000n * 10n**6n },
    { id: 48, min: 500n * 10n**6n, max: 5_000_000n * 10n**6n },
    // COMMODITIES pools (49-64)
    { id: 49, min: 1000n * 10n**6n, max: 10_000_000n * 10n**6n },
    { id: 50, min: 2500n * 10n**6n, max: 25_000_000n * 10n**6n },
    { id: 51, min: 5000n * 10n**6n, max: 50_000_000n * 10n**6n },
    { id: 52, min: 500n * 10n**6n, max: 5_000_000n * 10n**6n },
    { id: 53, min: 1000n * 10n**6n, max: 10_000_000n * 10n**6n },
    { id: 54, min: 2500n * 10n**6n, max: 25_000_000n * 10n**6n },
    { id: 55, min: 5000n * 10n**6n, max: 50_000_000n * 10n**6n },
    { id: 56, min: 500n * 10n**6n, max: 5_000_000n * 10n**6n },
    { id: 57, min: 1000n * 10n**6n, max: 10_000_000n * 10n**6n },
    { id: 58, min: 2500n * 10n**6n, max: 25_000_000n * 10n**6n },
    { id: 59, min: 5000n * 10n**6n, max: 50_000_000n * 10n**6n },
    { id: 60, min: 500n * 10n**6n, max: 5_000_000n * 10n**6n },
    { id: 61, min: 1000n * 10n**6n, max: 10_000_000n * 10n**6n },
    { id: 62, min: 2500n * 10n**6n, max: 25_000_000n * 10n**6n },
    { id: 63, min: 5000n * 10n**6n, max: 50_000_000n * 10n**6n },
    { id: 64, min: 500n * 10n**6n, max: 5_000_000n * 10n**6n },
  ];

  // Create pools in batches to avoid timeout
  const batchSize = 10;
  for (let i = 0; i < poolConfigs.length; i += batchSize) {
    const batch = poolConfigs.slice(i, i + batchSize);
    for (const config of batch) {
      try {
        const tx = await pool.createPool(config.id, config.min, config.max);
        await tx.wait();
      } catch (error: any) {
        // Skip if pool already exists
        if (!error.message.includes("PoolAlreadyExists")) {
          console.error(`   Failed to create pool ${config.id}:`, error.message);
        }
      }
    }
    console.log(`   Created pools ${i + 1}-${Math.min(i + batchSize, poolConfigs.length)} ✓`);
  }

  // ==================== Output ====================
  console.log("\n" + "=".repeat(60));
  console.log("DEPLOYMENT COMPLETE - ADD TO YOUR .env FILE:");
  console.log("=".repeat(60));
  console.log(`MOCK_USDC_ADDRESS=${usdcAddress}`);
  console.log(`BIOMETRIC_REGISTRY_ADDRESS=${registryAddress}`);
  console.log(`RWA_POOL_ADDRESS=${poolAddress}`);
  if (relayerAddress) {
    console.log(`RELAYER_ADDRESS=${relayerAddress}`);
  }
  console.log("=".repeat(60));

  // Verification instructions
  if (network.chainId === 43113n) {
    console.log("\nTo verify contracts on Snowtrace:");
    console.log(`npx hardhat verify --network fuji ${usdcAddress}`);
    console.log(`npx hardhat verify --network fuji ${registryAddress}`);
    console.log(`npx hardhat verify --network fuji ${poolAddress} ${usdcAddress} ${registryAddress}`);
  }

  console.log("\n=== Summary ===");
  console.log(`MockUSDC:          ${usdcAddress}`);
  console.log(`BiometricRegistry: ${registryAddress}`);
  console.log(`RWAPool:           ${poolAddress}`);
  console.log(`Pools created:     ${poolConfigs.length}`);
  console.log(`Deployer:          ${deployer.address}`);
  console.log(`Network:           ${network.name} (${network.chainId})`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
