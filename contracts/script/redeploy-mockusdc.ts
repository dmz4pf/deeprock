import { ethers } from "hardhat";

/**
 * Redeploys MockUSDC with ERC20Permit support
 * Existing pool and registry addresses are preserved
 */
async function main() {
  console.log("=== Redeploy MockUSDC with EIP-2612 Permit ===\n");

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

  // Deploy MockUSDC with ERC20Permit
  console.log("Deploying MockUSDC (with ERC20Permit)...");
  const MockUSDC = await ethers.getContractFactory("MockUSDC");
  const usdc = await MockUSDC.deploy();
  await usdc.waitForDeployment();
  const usdcAddress = await usdc.getAddress();
  console.log(`MockUSDC deployed to: ${usdcAddress}`);

  // Verify permit functionality
  try {
    const domainSeparator = await usdc.DOMAIN_SEPARATOR();
    console.log(`EIP-2612 Permit enabled ✓`);
    console.log(`DOMAIN_SEPARATOR: ${domainSeparator}`);

    // Test nonces function exists
    const nonce = await usdc.nonces(deployer.address);
    console.log(`nonces() works ✓ (deployer nonce: ${nonce})`);
  } catch (e: any) {
    console.error("ERROR: ERC20Permit not working:", e.message);
    process.exitCode = 1;
    return;
  }

  // Output
  console.log("\n" + "=".repeat(60));
  console.log("UPDATE YOUR .env FILE:");
  console.log("=".repeat(60));
  console.log(`MOCK_USDC_ADDRESS=${usdcAddress}`);
  console.log("=".repeat(60));

  console.log("\nNOTE: You also need to update the RWA Pool to use this new USDC.");
  console.log("Option 1: Update pool's USDC address (if it has a setter)");
  console.log("Option 2: Redeploy pool with new USDC address");

  if (network.chainId === 43113n) {
    console.log(`\nVerify on Snowtrace:`);
    console.log(`npx hardhat verify --network fuji ${usdcAddress}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
