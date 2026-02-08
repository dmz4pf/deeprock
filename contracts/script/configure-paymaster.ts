import { ethers } from "hardhat";

async function main() {
  const NEW_PAYMASTER = "0xDA4887Aea4Fa70ceB4e2707BFBcaa10Bc4F82110";
  const NEW_POOL = "0xA0e5327605B8ee4DAcB1763699Fc83b565378DE7";
  const NEW_USDC = "0x84b47706a096B6F997700C956dC2C5E545d65702";

  console.log("=== Configuring Paymaster ===\n");
  
  const [signer] = await ethers.getSigners();
  console.log("Signer:", signer.address);
  
  const paymaster = await ethers.getContractAt("RWAPaymaster", NEW_PAYMASTER);
  const owner = await paymaster.owner();
  console.log("Paymaster owner:", owner);
  
  if (owner.toLowerCase() !== signer.address.toLowerCase()) {
    throw new Error(`Signer ${signer.address} is not owner ${owner}`);
  }
  
  // Check current state
  console.log("\nBefore:");
  console.log("  Pool allowed:", await paymaster.isTargetAllowed(NEW_POOL));
  console.log("  USDC allowed:", await paymaster.isTargetAllowed(NEW_USDC));
  
  // Set allowed targets
  console.log("\nSetting allowed targets...");
  
  let tx = await paymaster.setAllowedTarget(NEW_POOL, true);
  await tx.wait();
  console.log("  Pool allowed: tx", tx.hash);
  
  tx = await paymaster.setAllowedTarget(NEW_USDC, true);
  await tx.wait();
  console.log("  USDC allowed: tx", tx.hash);
  
  // Verify
  console.log("\nAfter:");
  console.log("  Pool allowed:", await paymaster.isTargetAllowed(NEW_POOL));
  console.log("  USDC allowed:", await paymaster.isTargetAllowed(NEW_USDC));
  
  console.log("\n✅ Paymaster configured successfully!");
}

main().catch(console.error);
