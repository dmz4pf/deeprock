import { ethers } from "hardhat";

async function main() {
  const PAYMASTER = "0xDA4887Aea4Fa70ceB4e2707BFBcaa10Bc4F82110";
  const ENTRY_POINT = "0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789";
  const DEPOSIT_AMOUNT = ethers.parseEther("0.5"); // 0.5 AVAX for hackathon demos

  console.log("=== Funding Paymaster ===\n");

  const [signer] = await ethers.getSigners();
  console.log("Signer:", signer.address);
  console.log("Signer balance:", ethers.formatEther(await ethers.provider.getBalance(signer.address)), "AVAX");

  const entryPoint = await ethers.getContractAt("IEntryPoint", ENTRY_POINT);

  // Check current deposit
  const currentDeposit = await entryPoint.balanceOf(PAYMASTER);
  console.log("\nCurrent paymaster deposit:", ethers.formatEther(currentDeposit), "AVAX");

  if (currentDeposit >= DEPOSIT_AMOUNT) {
    console.log("✅ Already funded sufficiently");
    return;
  }

  // Deposit to paymaster
  console.log(`\nDepositing ${ethers.formatEther(DEPOSIT_AMOUNT)} AVAX...`);
  const tx = await entryPoint.depositTo(PAYMASTER, { value: DEPOSIT_AMOUNT });
  console.log("Tx:", tx.hash);
  await tx.wait();

  // Verify
  const newDeposit = await entryPoint.balanceOf(PAYMASTER);
  console.log("\n✅ New paymaster deposit:", ethers.formatEther(newDeposit), "AVAX");
}

main().catch(console.error);
