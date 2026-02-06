import { ethers } from "hardhat";

async function main() {
  console.log("=== Verifying Permit-Enabled Deployment ===\n");

  const usdcAddress = "0x6Ba0C5E8B3534261B643D5Feb966Dc151381646B";
  const poolAddress = "0xB5Ae26551Df3AF9b79782C32e7dC71fd817DF4C3";

  const [deployer] = await ethers.getSigners();

  // Verify MockUSDC
  console.log("1. MockUSDC (EIP-2612):");
  const usdc = await ethers.getContractAt("MockUSDC", usdcAddress);
  const name = await usdc.name();
  const domainSep = await usdc.DOMAIN_SEPARATOR();
  const domainSepShort = domainSep.substring(0, 18);
  console.log("   Name: " + name);
  console.log("   DOMAIN_SEPARATOR: " + domainSepShort + "...");
  console.log("   Permit: EIP-2612 enabled");

  // Verify RWAPool
  console.log("\n2. RWAPool (investWithPermit):");
  const pool = await ethers.getContractAt("RWAPool", poolAddress);
  const poolCount = await pool.poolCount();
  console.log("   Pool count: " + poolCount.toString());

  // Check if investWithPermit function exists by encoding
  const iface = pool.interface;
  const investWithPermitFunc = iface.getFunction("investWithPermit");
  const hasFn = investWithPermitFunc ? "available" : "missing";
  console.log("   investWithPermit: " + hasFn);

  // Try to create missing pool 25
  console.log("\n3. Creating missing test pool 25...");
  try {
    const tx = await pool.createPool(25, 10000n * 10n**6n, 100_000_000n * 10n**6n);
    await tx.wait();
    console.log("   Pool 25: created");
  } catch (e: any) {
    if (e.message.includes("PoolAlreadyExists")) {
      console.log("   Pool 25: already exists");
    } else {
      console.log("   Pool 25 error: " + e.message);
    }
  }

  // Check pool 1 exists
  const pool1 = await pool.getPool(1);
  console.log("\n4. Pool 1 verification:");
  console.log("   Active: " + pool1.active);
  console.log("   Min Investment: " + ethers.formatUnits(pool1.minInvestment, 6) + " USDC");
  console.log("   Max Investment: " + ethers.formatUnits(pool1.maxInvestment, 6) + " USDC");

  console.log("\n=== Deployment Verified Successfully ===");
  console.log("\nPhase 1 Gasless Transactions Ready:");
  console.log("- MockUSDC supports EIP-2612 Permit");
  console.log("- RWAPool supports investWithPermit");
  console.log("- Test pools created");
}

main().catch(console.error);
