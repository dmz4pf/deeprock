import { ethers } from "hardhat";

async function main() {
  const paymaster = await ethers.getContractAt("RWAPaymaster", "0xDA4887Aea4Fa70ceB4e2707BFBcaa10Bc4F82110");
  
  const oldPool = "0xD710663FbdA019D6E428516c0d6C0eD96B0748a1";
  const newPool = "0xA0e5327605B8ee4DAcB1763699Fc83b565378DE7";
  
  console.log("=== Paymaster Target Configuration ===");
  console.log("Old RWAPool allowed:", await paymaster.isTargetAllowed(oldPool));
  console.log("New RWAPool allowed:", await paymaster.isTargetAllowed(newPool));
  console.log("USDC allowed:", await paymaster.isTargetAllowed("0x84b47706a096B6F997700C956dC2C5E545d65702"));
}

main().catch(console.error);
