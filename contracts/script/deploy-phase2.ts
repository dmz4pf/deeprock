import { ethers } from "hardhat";

/**
 * Phase 2 Deployment: ERC-4337 Account Abstraction
 *
 * Deploys:
 * - P256WalletFactory (deploys P256SmartWallet implementation internally)
 * - RWAPaymaster
 *
 * Configures:
 * - Paymaster whitelist (MockUSDC, RWAPool)
 * - Paymaster initial deposit
 */

// Known addresses
const ENTRYPOINT_V07 = "0x0000000071727De22E5E9d8BAf0edAc6f37da032";

async function main() {
  console.log("=== RWA Gateway Phase 2: ERC-4337 Deployment ===\n");

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

  // Get Phase 1 contract addresses from env
  const MOCK_USDC = process.env.MOCK_USDC_ADDRESS;
  const RWA_POOL = process.env.RWA_POOL_ADDRESS;

  if (!MOCK_USDC || !RWA_POOL) {
    console.error("ERROR: Missing Phase 1 contract addresses in .env");
    console.error("Required: MOCK_USDC_ADDRESS, RWA_POOL_ADDRESS");
    process.exitCode = 1;
    return;
  }

  console.log("Phase 1 Contracts:");
  console.log(`  MockUSDC: ${MOCK_USDC}`);
  console.log(`  RWAPool:  ${RWA_POOL}`);
  console.log(`  EntryPoint v0.7: ${ENTRYPOINT_V07}\n`);

  // Verify EntryPoint exists
  const entryPointCode = await ethers.provider.getCode(ENTRYPOINT_V07);
  if (entryPointCode === "0x") {
    console.error("ERROR: EntryPoint v0.7 not deployed at expected address");
    console.error("Check if ERC-4337 is available on this network");
    process.exitCode = 1;
    return;
  }
  console.log("EntryPoint v0.7 verified ✓\n");

  // ==================== 1. Deploy P256WalletFactory ====================
  console.log("1. Deploying P256WalletFactory...");
  console.log("   (This also deploys the P256SmartWallet implementation)");

  const P256WalletFactory = await ethers.getContractFactory("P256WalletFactory");
  const factory = await P256WalletFactory.deploy(ENTRYPOINT_V07);
  await factory.waitForDeployment();
  const factoryAddress = await factory.getAddress();
  console.log(`   P256WalletFactory deployed to: ${factoryAddress}`);

  // Get implementation address
  const implAddress = await factory.walletImplementation();
  console.log(`   P256SmartWallet implementation: ${implAddress}`);

  // ==================== 2. Deploy RWAPaymaster ====================
  console.log("\n2. Deploying RWAPaymaster...");

  const RWAPaymaster = await ethers.getContractFactory("RWAPaymaster");
  const paymaster = await RWAPaymaster.deploy(ENTRYPOINT_V07, deployer.address);
  await paymaster.waitForDeployment();
  const paymasterAddress = await paymaster.getAddress();
  console.log(`   RWAPaymaster deployed to: ${paymasterAddress}`);

  // ==================== 3. Configure Paymaster ====================
  console.log("\n3. Configuring Paymaster...");

  // Set wallet factory
  let tx = await paymaster.setWalletFactory(factoryAddress);
  await tx.wait();
  console.log("   - Wallet factory set ✓");

  // Whitelist MockUSDC
  tx = await paymaster.setAllowedTarget(MOCK_USDC, true);
  await tx.wait();
  console.log(`   - MockUSDC whitelisted ✓`);

  // Whitelist RWAPool
  tx = await paymaster.setAllowedTarget(RWA_POOL, true);
  await tx.wait();
  console.log(`   - RWAPool whitelisted ✓`);

  // ==================== 4. Fund Paymaster ====================
  console.log("\n4. Funding Paymaster...");

  // Deposit 0.5 AVAX for gas sponsorship (adjust as needed)
  const depositAmount = ethers.parseEther("0.5");
  tx = await paymaster.deposit({ value: depositAmount });
  await tx.wait();

  const paymasterDeposit = await paymaster.getDeposit();
  console.log(`   Paymaster deposit: ${ethers.formatEther(paymasterDeposit)} AVAX ✓`);

  // ==================== 5. Verify Setup ====================
  console.log("\n5. Verifying setup...");

  // Check whitelist
  const usdcAllowed = await paymaster.isTargetAllowed(MOCK_USDC);
  const poolAllowed = await paymaster.isTargetAllowed(RWA_POOL);
  console.log(`   MockUSDC allowed: ${usdcAllowed}`);
  console.log(`   RWAPool allowed: ${poolAllowed}`);

  // Test counterfactual address computation
  const testPubKeyX = "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef";
  const testPubKeyY = "0xfedcba0987654321fedcba0987654321fedcba0987654321fedcba0987654321";
  const testCredId = "0x0000000000000000000000000000000000000000000000000000000000000001";

  const testWalletAddress = await factory.getAddress(testPubKeyX, testPubKeyY, testCredId);
  console.log(`   Test wallet address computation: ${testWalletAddress}`);

  // ==================== Output ====================
  console.log("\n" + "=".repeat(60));
  console.log("PHASE 2 DEPLOYMENT COMPLETE - ADD TO YOUR .env FILE:");
  console.log("=".repeat(60));
  console.log(`P256_WALLET_FACTORY_ADDRESS=${factoryAddress}`);
  console.log(`P256_SMART_WALLET_IMPL_ADDRESS=${implAddress}`);
  console.log(`RWA_PAYMASTER_ADDRESS=${paymasterAddress}`);
  console.log(`ENTRYPOINT_ADDRESS=${ENTRYPOINT_V07}`);
  console.log("=".repeat(60));

  // Verification instructions
  if (network.chainId === 43113n) {
    console.log("\nTo verify contracts on Snowtrace:");
    console.log(`npx hardhat verify --network fuji ${factoryAddress} ${ENTRYPOINT_V07}`);
    console.log(`npx hardhat verify --network fuji ${paymasterAddress} ${ENTRYPOINT_V07} ${deployer.address}`);
  }

  console.log("\n=== Phase 2 Summary ===");
  console.log(`P256WalletFactory:      ${factoryAddress}`);
  console.log(`P256SmartWallet (impl): ${implAddress}`);
  console.log(`RWAPaymaster:           ${paymasterAddress}`);
  console.log(`EntryPoint v0.7:        ${ENTRYPOINT_V07}`);
  console.log(`Paymaster deposit:      ${ethers.formatEther(paymasterDeposit)} AVAX`);
  console.log(`Network:                ${network.name} (${network.chainId})`);

  console.log("\n=== Next Steps ===");
  console.log("1. Create backend UserOperation service (userop.service.ts)");
  console.log("2. Integrate WebAuthn passkey signing with UserOps");
  console.log("3. Test gasless investment flow for passkey users");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
