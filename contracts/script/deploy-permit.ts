import { ethers } from "hardhat";

/**
 * Deploys upgraded MockUSDC (with ERC20Permit) and RWAPool (with investWithPermit)
 * for Phase 1 gasless transactions
 */
async function main() {
  console.log("=== RWA Gateway Permit-Enabled Contract Deployment ===\n");

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
  const existingRegistryAddress = process.env.BIOMETRIC_REGISTRY_ADDRESS;

  // ==================== 1. Deploy MockUSDC with ERC20Permit ====================
  console.log("1. Deploying MockUSDC (with ERC20Permit for gasless approvals)...");
  const MockUSDC = await ethers.getContractFactory("MockUSDC");
  const usdc = await MockUSDC.deploy();
  await usdc.waitForDeployment();
  const usdcAddress = await usdc.getAddress();
  console.log(`   MockUSDC deployed to: ${usdcAddress}`);

  // Verify permit functionality exists
  try {
    const domainSeparator = await usdc.DOMAIN_SEPARATOR();
    console.log(`   EIP-2612 Permit enabled ✓ (DOMAIN_SEPARATOR: ${domainSeparator.slice(0, 18)}...)`);
  } catch (e) {
    console.error("   ERROR: ERC20Permit not properly inherited!");
  }

  // ==================== 2. Use existing or deploy new BiometricRegistry ====================
  let registryAddress: string;
  
  if (existingRegistryAddress && ethers.isAddress(existingRegistryAddress)) {
    console.log(`2. Using existing BiometricRegistry: ${existingRegistryAddress}`);
    registryAddress = existingRegistryAddress;
  } else {
    console.log("2. Deploying new BiometricRegistry...");
    const BiometricRegistry = await ethers.getContractFactory("BiometricRegistry");
    const registry = await BiometricRegistry.deploy();
    await registry.waitForDeployment();
    registryAddress = await registry.getAddress();
    console.log(`   BiometricRegistry deployed to: ${registryAddress}`);
  }

  // ==================== 3. Deploy RWAPool with investWithPermit ====================
  console.log("3. Deploying RWAPool (with investWithPermit for gasless investments)...");
  const RWAPool = await ethers.getContractFactory("RWAPool");
  const pool = await RWAPool.deploy(usdcAddress, registryAddress);
  await pool.waitForDeployment();
  const poolAddress = await pool.getAddress();
  console.log(`   RWAPool deployed to: ${poolAddress}`);

  // ==================== 4. Configure Relayer ====================
  if (relayerAddress && ethers.isAddress(relayerAddress)) {
    console.log(`\n4. Configuring relayer: ${relayerAddress}`);

    // Set relayer as trusted on RWAPool
    const tx = await pool.setTrustedRelayer(relayerAddress, true);
    await tx.wait();
    console.log("   - RWAPool: relayer trusted ✓");
  } else {
    console.log("\n4. SKIPPED: No RELAYER_ADDRESS provided");
    console.log("   Set it later with setTrustedRelayer()");
  }

  // ==================== 5. Create Test Pools ====================
  console.log("\n5. Creating test pools on-chain...");

  // Create a subset of pools for testing
  const testPools = [
    { id: 1, min: 100n * 10n**6n, max: 1_000_000n * 10n**6n, name: "US Treasury Fund" },
    { id: 2, min: 500n * 10n**6n, max: 5_000_000n * 10n**6n, name: "Treasury Plus" },
    { id: 13, min: 5000n * 10n**6n, max: 50_000_000n * 10n**6n, name: "NYC Real Estate" },
    { id: 25, min: 10000n * 10n**6n, max: 100_000_000n * 10n**6n, name: "Senior Debt Fund" },
  ];

  for (const config of testPools) {
    try {
      const tx = await pool.createPool(config.id, config.min, config.max);
      await tx.wait();
      console.log(`   Pool ${config.id} (${config.name}): created ✓`);
    } catch (error: any) {
      if (error.message.includes("PoolAlreadyExists")) {
        console.log(`   Pool ${config.id} (${config.name}): already exists`);
      } else {
        console.error(`   Pool ${config.id} failed:`, error.message);
      }
    }
  }

  // ==================== Output ====================
  console.log("\n" + "=".repeat(70));
  console.log("DEPLOYMENT COMPLETE - UPDATE YOUR .env FILE:");
  console.log("=".repeat(70));
  console.log(`MOCK_USDC_ADDRESS=${usdcAddress}`);
  console.log(`BIOMETRIC_REGISTRY_ADDRESS=${registryAddress}`);
  console.log(`RWA_POOL_ADDRESS=${poolAddress}`);
  if (relayerAddress) {
    console.log(`RELAYER_ADDRESS=${relayerAddress}`);
  }
  console.log("=".repeat(70));

  // Phase 1 specific info
  console.log("\n=== PHASE 1: GASLESS TRANSACTIONS (EIP-2612 PERMIT) ===");
  console.log("MockUSDC now supports EIP-2612 Permit for gasless approvals.");
  console.log("RWAPool now supports investWithPermit() for atomic gasless investments.");
  console.log("\nAPI Endpoints:");
  console.log("  POST /api/pools/:id/permit-data  - Get EIP-712 typed data for signing");
  console.log("  POST /api/pools/:id/invest-permit - Submit investment with permit signature");

  // Verification instructions
  if (network.chainId === 43113n) {
    console.log("\nTo verify contracts on Snowtrace:");
    console.log(`npx hardhat verify --network fuji ${usdcAddress}`);
    console.log(`npx hardhat verify --network fuji ${poolAddress} ${usdcAddress} ${registryAddress}`);
  }

  console.log("\n=== Summary ===");
  console.log(`MockUSDC (EIP-2612):   ${usdcAddress}`);
  console.log(`BiometricRegistry:     ${registryAddress}`);
  console.log(`RWAPool (investWithPermit): ${poolAddress}`);
  console.log(`Test pools created:    ${testPools.length}`);
  console.log(`Deployer:              ${deployer.address}`);
  console.log(`Network:               ${network.name} (${network.chainId})`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
