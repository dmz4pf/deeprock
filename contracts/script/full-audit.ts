import { ethers } from "hardhat";

async function main() {
  console.log("=== FULL ARCHITECTURE AUDIT ===\n");
  
  // Contract addresses
  const OLD_POOL = "0xD710663FbdA019D6E428516c0d6C0eD96B0748a1";
  const NEW_POOL = "0xA0e5327605B8ee4DAcB1763699Fc83b565378DE7";
  const OLD_USDC = "0xd249A6FE09666B97B85fE479E218cAE44d7dE810";
  const NEW_USDC = "0x84b47706a096B6F997700C956dC2C5E545d65702";
  const OLD_PAYMASTER = "0x4dC22058C9824f2a16882acb7BaDB888321f75f9";
  const NEW_PAYMASTER = "0xDA4887Aea4Fa70ceB4e2707BFBcaa10Bc4F82110";
  
  // 1. Check OLD Pool
  console.log("=== OLD RWAPool (0xD710663...) ===");
  try {
    const oldPool = await ethers.getContractAt("RWAPool", OLD_POOL);
    const oldPoolCount = await oldPool.poolCount();
    console.log("  Pool Count:", oldPoolCount.toString());
    
    let activeCount = 0;
    for (let i = 1; i <= Math.min(Number(oldPoolCount), 64); i++) {
      try {
        const p = await oldPool.pools(i);
        if (p.active) activeCount++;
      } catch {}
    }
    console.log("  Active Pools:", activeCount);
    
    // Check owner
    const oldOwner = await oldPool.owner();
    console.log("  Owner:", oldOwner);
  } catch (e: any) {
    console.log("  Error:", e.message?.slice(0, 60));
  }
  
  // 2. Check NEW Pool
  console.log("\n=== NEW RWAPool (0xA0e5327...) ===");
  try {
    const newPool = await ethers.getContractAt("RWAPool", NEW_POOL);
    const newPoolCount = await newPool.poolCount();
    console.log("  Pool Count:", newPoolCount.toString());
    
    let activeCount = 0;
    for (let i = 1; i <= Math.min(Number(newPoolCount), 64); i++) {
      const p = await newPool.pools(i);
      if (p.active) activeCount++;
    }
    console.log("  Active Pools:", activeCount);
    
    const newOwner = await newPool.owner();
    console.log("  Owner:", newOwner);
  } catch (e: any) {
    console.log("  Error:", e.message?.slice(0, 60));
  }
  
  // 3. Check OLD Paymaster
  console.log("\n=== OLD Paymaster (0x4dC220...) ===");
  try {
    const oldPm = await ethers.getContractAt("RWAPaymaster", OLD_PAYMASTER);
    console.log("  OLD_POOL allowed:", await oldPm.isTargetAllowed(OLD_POOL));
    console.log("  NEW_POOL allowed:", await oldPm.isTargetAllowed(NEW_POOL));
    console.log("  NEW_USDC allowed:", await oldPm.isTargetAllowed(NEW_USDC));
    const oldPmOwner = await oldPm.owner();
    console.log("  Owner:", oldPmOwner);
  } catch (e: any) {
    console.log("  Error:", e.message?.slice(0, 60));
  }
  
  // 4. Check NEW Paymaster
  console.log("\n=== NEW Paymaster (0xDA4887...) ===");
  try {
    const newPm = await ethers.getContractAt("RWAPaymaster", NEW_PAYMASTER);
    console.log("  OLD_POOL allowed:", await newPm.isTargetAllowed(OLD_POOL));
    console.log("  NEW_POOL allowed:", await newPm.isTargetAllowed(NEW_POOL));
    console.log("  NEW_USDC allowed:", await newPm.isTargetAllowed(NEW_USDC));
    const newPmOwner = await newPm.owner();
    console.log("  Owner:", newPmOwner);
  } catch (e: any) {
    console.log("  Error:", e.message?.slice(0, 60));
  }
  
  // 5. Check .env values match what's needed
  console.log("\n=== Environment Check ===");
  console.log("  RWA_POOL_ADDRESS in .env:", process.env.RWA_POOL_ADDRESS);
  console.log("  RWA_PAYMASTER_ADDRESS in .env:", process.env.RWA_PAYMASTER_ADDRESS);
  
  // 6. Summary
  console.log("\n=== SUMMARY ===");
  console.log("The system has TWO different RWAPool contracts:");
  console.log("  - OLD: 0xD710663... (from initial deployment)");
  console.log("  - NEW: 0xA0e5327... (redeployed with permit support)");
  console.log("");
  console.log("The paymaster that allows the OLD pool is 0x4dC220...");
  console.log("The paymaster in .env (0xDA4887...) allows NOTHING.");
}

main().catch(console.error);
