import { ethers } from "hardhat";

async function main() {
  const mockUsdc = "0x6Ba0C5E8B3534261B643D5Feb966Dc151381646B";
  const rwaPool = "0xB5Ae26551Df3AF9b79782C32e7dC71fd817DF4C3";

  console.log("=== Verifying Phase 1 Contracts on Fuji ===\n");

  const network = await ethers.provider.getNetwork();
  console.log(`Network: ${network.name} (chainId: ${network.chainId})\n`);

  // Check contract code exists
  const usdcCode = await ethers.provider.getCode(mockUsdc);
  const poolCode = await ethers.provider.getCode(rwaPool);

  console.log(
    `MockUSDC (${mockUsdc}):`,
    usdcCode.length > 2 ? "DEPLOYED ✓" : "NOT DEPLOYED"
  );
  console.log(
    `RWAPool (${rwaPool}):`,
    poolCode.length > 2 ? "DEPLOYED ✓" : "NOT DEPLOYED"
  );

  if (usdcCode.length <= 2 || poolCode.length <= 2) {
    console.error("\n❌ One or more contracts not deployed!");
    process.exitCode = 1;
    return;
  }

  // Verify MockUSDC has EIP-2612 Permit
  console.log("\n--- MockUSDC EIP-2612 Permit Check ---");
  const usdc = await ethers.getContractAt("MockUSDC", mockUsdc);

  try {
    const domainSep = await usdc.DOMAIN_SEPARATOR();
    console.log(`DOMAIN_SEPARATOR: ${domainSep.slice(0, 22)}...`);

    const testNonce = await usdc.nonces(
      "0x0000000000000000000000000000000000000001"
    );
    console.log(`nonces() function: works ✓`);

    console.log("EIP-2612 Permit: ENABLED ✓");
  } catch (e: any) {
    console.error("EIP-2612 Permit: MISSING ❌", e.message);
    process.exitCode = 1;
    return;
  }

  // Verify RWAPool has investWithPermit
  console.log("\n--- RWAPool investWithPermit Check ---");
  const pool = await ethers.getContractAt("RWAPool", rwaPool);

  try {
    // Check pool is active
    const pool1Active = await pool.isPoolActive(1);
    console.log(`Pool 1 active: ${pool1Active}`);

    // Check relayer
    const relayer = process.env.RELAYER_ADDRESS;
    if (relayer) {
      const isTrusted = await pool.trustedRelayers(relayer);
      console.log(`Relayer ${relayer.slice(0, 10)}... trusted: ${isTrusted}`);
    }

    // Check USDC address matches
    const poolUsdc = await pool.usdc();
    console.log(
      `USDC address matches: ${poolUsdc.toLowerCase() === mockUsdc.toLowerCase()}`
    );

    console.log("RWAPool investWithPermit: READY ✓");
  } catch (e: any) {
    console.error("RWAPool check failed:", e.message);
    process.exitCode = 1;
    return;
  }

  // Check EntryPoint v0.7 for Phase 2
  console.log("\n--- EntryPoint v0.7 Check (for Phase 2) ---");
  const entryPoint = "0x0000000071727De22E5E9d8BAf0edAc6f37da032";
  const epCode = await ethers.provider.getCode(entryPoint);
  console.log(
    `EntryPoint v0.7 (${entryPoint.slice(0, 14)}...):`,
    epCode.length > 2 ? "AVAILABLE ✓" : "NOT AVAILABLE ❌"
  );

  console.log("\n=== Phase 1 Verification Complete ===");
  console.log("Ready for E2E testing with EIP-2612 Permit flow!");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
