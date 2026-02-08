import { ethers } from "hardhat";

async function main() {
  const pool = await ethers.getContractAt("RWAPool", "0xA0e5327605B8ee4DAcB1763699Fc83b565378DE7");

  console.log("=== Pool Verification ===\n");
  console.log("Pool count:", (await pool.poolCount()).toString());

  // Check key pools
  console.log("\nKey pools status:");
  for (const id of [1, 2, 13, 25, 63, 64]) {
    try {
      const p = await pool.pools(id);
      console.log(`  Pool ${id}: active=${p.active}, min=${ethers.formatUnits(p.minInvestment, 6)} USDC`);
    } catch (e) {
      console.log(`  Pool ${id}: ERROR`);
    }
  }

  // Count active pools
  let activeCount = 0;
  for (let i = 1; i <= 64; i++) {
    const p = await pool.pools(i);
    if (p.active) activeCount++;
  }
  console.log(`\nTotal active pools (1-64): ${activeCount}/64`);
}

main().catch(console.error);
