import { ethers } from "hardhat";

async function main() {
  const OLD_USDC = "0xd249A6FE09666B97B85fE479E218cAE44d7dE810";
  const NEW_USDC = "0x84b47706a096B6F997700C956dC2C5E545d65702";
  const OLD_POOL = "0xD710663FbdA019D6E428516c0d6C0eD96B0748a1";
  const NEW_POOL = "0xA0e5327605B8ee4DAcB1763699Fc83b565378DE7";
  
  console.log("=== USDC Contract Check ===\n");
  
  // Check OLD USDC
  console.log("OLD USDC (0xd249A6...):");
  try {
    const oldUsdc = await ethers.getContractAt("MockUSDC", OLD_USDC);
    const oldPoolBalance = await oldUsdc.balanceOf(OLD_POOL);
    console.log("  Balance in OLD_POOL:", ethers.formatUnits(oldPoolBalance, 6), "USDC");
    const newPoolBalance = await oldUsdc.balanceOf(NEW_POOL);
    console.log("  Balance in NEW_POOL:", ethers.formatUnits(newPoolBalance, 6), "USDC");
  } catch (e: any) {
    console.log("  Error:", e.message?.slice(0, 50));
  }
  
  // Check NEW USDC
  console.log("\nNEW USDC (0x84b477...):");
  try {
    const newUsdc = await ethers.getContractAt("MockUSDC", NEW_USDC);
    const oldPoolBalance = await newUsdc.balanceOf(OLD_POOL);
    console.log("  Balance in OLD_POOL:", ethers.formatUnits(oldPoolBalance, 6), "USDC");
    const newPoolBalance = await newUsdc.balanceOf(NEW_POOL);
    console.log("  Balance in NEW_POOL:", ethers.formatUnits(newPoolBalance, 6), "USDC");
    
    // Check if permit is supported
    try {
      const domainSep = await newUsdc.DOMAIN_SEPARATOR();
      console.log("  Permit supported: YES (has DOMAIN_SEPARATOR)");
    } catch {
      console.log("  Permit supported: NO");
    }
  } catch (e: any) {
    console.log("  Error:", e.message?.slice(0, 50));
  }
}

main().catch(console.error);
