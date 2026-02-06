import { ethers } from "hardhat";

async function main() {
  console.log("=== Redeploying MockUSDC with faucetTo function ===\n");

  const [deployer] = await ethers.getSigners();
  console.log(`Deployer: ${deployer.address}`);
  console.log(`Balance: ${ethers.formatEther(await ethers.provider.getBalance(deployer.address))} AVAX\n`);

  // Deploy new MockUSDC
  const MockUSDC = await ethers.getContractFactory("MockUSDC");
  const mockUsdc = await MockUSDC.deploy();
  await mockUsdc.waitForDeployment();

  const newAddress = await mockUsdc.getAddress();
  console.log(`MockUSDC deployed to: ${newAddress}`);

  console.log("\n=== Update your .env file ===");
  console.log(`MOCK_USDC_ADDRESS=${newAddress}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
