import { expect } from "chai";
import { ethers } from "hardhat";

describe("P256Verifier", function () {
  let verifierTest: any;

  before(async function () {
    // Deploy a test contract that uses the library
    const P256VerifierTest = await ethers.getContractFactory("P256VerifierTest");
    verifierTest = await P256VerifierTest.deploy();
    await verifierTest.waitForDeployment();
  });

  describe("Precompile Availability", function () {
    it("should detect if ACP-204 precompile is available", async function () {
      const available = await verifierTest.checkPrecompileAvailable();
      console.log(`ACP-204 Precompile Available: ${available}`);

      // On Fuji, this should be true after Granite upgrade
      // On local hardhat, this will be false unless we fork Fuji
      if (process.env.HARDHAT_NETWORK === "fuji") {
        expect(available).to.be.true;
      }
    });
  });

  describe("Signature Verification", function () {
    it("should return false for invalid zero inputs", async function () {
      const result = await verifierTest.verify(
        ethers.zeroPadValue("0x01", 32),
        ethers.zeroPadValue("0x02", 32),
        ethers.zeroPadValue("0x03", 32),
        ethers.zeroPadValue("0x04", 32),
        ethers.zeroPadValue("0x05", 32)
      );
      expect(result).to.be.false;
    });

    it("should reject invalid signature length in verifyRaw", async function () {
      await expect(
        verifierTest.verifyRaw(
          ethers.zeroPadValue("0x01", 32),
          "0x1234", // Invalid: only 2 bytes, need 64
          ethers.zeroPadValue("0x04", 32) + ethers.zeroPadValue("0x05", 32).slice(2) // 64 bytes
        )
      ).to.be.revertedWithCustomError(verifierTest, "InvalidSignatureLength");
    });

    it("should reject invalid public key length in verifyRaw", async function () {
      await expect(
        verifierTest.verifyRaw(
          ethers.zeroPadValue("0x01", 32),
          ethers.zeroPadValue("0x02", 32) + ethers.zeroPadValue("0x03", 32).slice(2), // 64 bytes
          "0x1234" // Invalid: only 2 bytes, need 64
        )
      ).to.be.revertedWithCustomError(verifierTest, "InvalidPublicKeyLength");
    });
  });
});
