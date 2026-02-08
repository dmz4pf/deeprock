import { ethers } from "hardhat";

async function main() {
  const wallet = "0x076A8b8CFa7bC5C49FCa35C2e7D7fE7cb2AF42cB";
  const OLD_USDC = "0xd249A6FE09666B97B85fE479E218cAE44d7dE810";
  const NEW_USDC = "0x84b47706a096B6F997700C956dC2C5E545d65702";

  console.log("=== Wallet Balance Check ===");
  console.log("Wallet:", wallet);

  try {
    const oldUsdc = await ethers.getContractAt("MockUSDC", OLD_USDC);
    const oldBal = await oldUsdc.balanceOf(wallet);
    console.log("OLD USDC balance:", ethers.formatUnits(oldBal, 6));
  } catch (e: any) {
    console.log("OLD USDC error:", e.message?.slice(0, 50));
  }

  try {
    const newUsdc = await ethers.getContractAt("MockUSDC", NEW_USDC);
    const newBal = await newUsdc.balanceOf(wallet);
    console.log("NEW USDC balance:", ethers.formatUnits(newBal, 6));
  } catch (e: any) {
    console.log("NEW USDC error:", e.message?.slice(0, 50));
  }
}

main().catch(console.error);
