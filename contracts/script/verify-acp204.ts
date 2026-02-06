import { ethers } from "hardhat";

async function main() {
  console.log("=== ACP-204 Precompile Verification ===\n");

  const network = await ethers.provider.getNetwork();
  console.log(`Network: ${network.name} (chainId: ${network.chainId})`);

  if (network.chainId !== 43113n) {
    console.log("WARNING: Not on Fuji testnet. Precompile may not be available.\n");
  }

  // Deploy test contract
  console.log("Deploying P256VerifierTest...");
  const P256VerifierTest = await ethers.getContractFactory("P256VerifierTest");
  const verifier = await P256VerifierTest.deploy();
  await verifier.waitForDeployment();
  console.log(`Deployed to: ${await verifier.getAddress()}\n`);

  // Check precompile availability
  console.log("Checking ACP-204 precompile availability...");
  const available = await verifier.checkPrecompileAvailable();

  if (available) {
    console.log("✅ ACP-204 PRECOMPILE IS AVAILABLE!\n");

    // Measure gas
    console.log("Measuring gas cost...");
    const tx = await verifier.verifyWithGas(
      ethers.zeroPadValue("0x01", 32),
      ethers.zeroPadValue("0x02", 32),
      ethers.zeroPadValue("0x03", 32),
      ethers.zeroPadValue("0x04", 32),
      ethers.zeroPadValue("0x05", 32)
    );
    const receipt = await tx.wait();

    // Parse event for gas used
    const event = receipt?.logs[0];
    if (event) {
      const decoded = verifier.interface.parseLog({
        topics: event.topics as string[],
        data: event.data
      });
      console.log(`Gas used for verification: ${decoded?.args.gasUsed}`);
    }

    console.log("\n🎉 GO/NO-GO DECISION: GO - Proceed with BiometricRegistry implementation");
  } else {
    console.log("❌ ACP-204 PRECOMPILE NOT AVAILABLE\n");
    console.log("Options:");
    console.log("1. Wait for Granite upgrade activation");
    console.log("2. Use Daimo P256Verifier (250,000+ gas per verification)");
    console.log("3. Use different authentication mechanism");
    console.log("\n⚠️  GO/NO-GO DECISION: EVALUATE FALLBACK OPTIONS");
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
