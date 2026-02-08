import { ethers } from "hardhat";

async function main() {
  const oldPool = "0xD710663FbdA019D6E428516c0d6C0eD96B0748a1";
  const newPool = "0xA0e5327605B8ee4DAcB1763699Fc83b565378DE7";
  const usdc = "0x84b47706a096B6F997700C956dC2C5E545d65702";
  
  // Current env paymaster
  const pm1 = await ethers.getContractAt("RWAPaymaster", "0xDA4887Aea4Fa70ceB4e2707BFBcaa10Bc4F82110");
  // Paymaster from earlier context
  const pm2 = await ethers.getContractAt("RWAPaymaster", "0x4dC22058C9824f2a16882acb7BaDB888321f75f9");
  
  console.log("=== Paymaster 0xDA4887.. (current .env) ===");
  try {
    console.log("  Old RWAPool:", await pm1.isTargetAllowed(oldPool));
    console.log("  New RWAPool:", await pm1.isTargetAllowed(newPool));
    console.log("  USDC:", await pm1.isTargetAllowed(usdc));
  } catch (e: any) {
    console.log("  Error:", e.message?.slice(0, 50));
  }
  
  console.log("\n=== Paymaster 0x4dC220.. (from context 08:30) ===");
  try {
    console.log("  Old RWAPool:", await pm2.isTargetAllowed(oldPool));
    console.log("  New RWAPool:", await pm2.isTargetAllowed(newPool));
    console.log("  USDC:", await pm2.isTargetAllowed(usdc));
  } catch (e: any) {
    console.log("  Error:", e.message?.slice(0, 50));
  }
}

main().catch(console.error);
