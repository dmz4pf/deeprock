import { expect } from "chai";
import { ethers } from "hardhat";
import { BiometricRegistry } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("BiometricRegistry", function () {
  let registry: BiometricRegistry;
  let owner: SignerWithAddress;
  let user1: SignerWithAddress;
  let user2: SignerWithAddress;
  let relayer: SignerWithAddress;

  // Test keys (not real WebAuthn keys - for testing only)
  const testPublicKeyX = ethers.zeroPadValue("0x1234", 32);
  const testPublicKeyY = ethers.zeroPadValue("0x5678", 32);
  const testCredentialId = ethers.keccak256(ethers.toUtf8Bytes("test-credential"));

  beforeEach(async function () {
    [owner, user1, user2, relayer] = await ethers.getSigners();

    const BiometricRegistry = await ethers.getContractFactory("BiometricRegistry");
    registry = await BiometricRegistry.deploy();
    await registry.waitForDeployment();
  });

  describe("Deployment", function () {
    it("should set the correct owner", async function () {
      expect(await registry.owner()).to.equal(owner.address);
    });

    it("should start with zero identities", async function () {
      expect(await registry.totalIdentities()).to.equal(0);
    });

    it("should not be paused initially", async function () {
      expect(await registry.paused()).to.be.false;
    });
  });

  describe("Registration", function () {
    it("should register a new identity", async function () {
      const tx = await registry.connect(user1).register(testPublicKeyX, testPublicKeyY, testCredentialId);
      const receipt = await tx.wait();
      const block = await ethers.provider.getBlock(receipt!.blockNumber);

      await expect(tx)
        .to.emit(registry, "IdentityRegistered")
        .withArgs(user1.address, testCredentialId, testPublicKeyX, testPublicKeyY, block!.timestamp);

      expect(await registry.hasIdentity(user1.address)).to.be.true;
      expect(await registry.isActive(user1.address)).to.be.true;
      expect(await registry.totalIdentities()).to.equal(1);
    });

    it("should reject duplicate registration", async function () {
      await registry.connect(user1).register(testPublicKeyX, testPublicKeyY, testCredentialId);

      await expect(registry.connect(user1).register(testPublicKeyX, testPublicKeyY, testCredentialId))
        .to.be.revertedWithCustomError(registry, "IdentityAlreadyExists");
    });

    it("should reject duplicate credential ID", async function () {
      await registry.connect(user1).register(testPublicKeyX, testPublicKeyY, testCredentialId);

      const differentKeyX = ethers.zeroPadValue("0xabcd", 32);
      const differentKeyY = ethers.zeroPadValue("0xef01", 32);

      await expect(registry.connect(user2).register(differentKeyX, differentKeyY, testCredentialId))
        .to.be.revertedWithCustomError(registry, "IdentityAlreadyExists");
    });

    it("should reject zero public key X", async function () {
      await expect(registry.connect(user1).register(ethers.ZeroHash, testPublicKeyY, testCredentialId))
        .to.be.revertedWithCustomError(registry, "InvalidPublicKey");
    });

    it("should reject zero public key Y", async function () {
      await expect(registry.connect(user1).register(testPublicKeyX, ethers.ZeroHash, testCredentialId))
        .to.be.revertedWithCustomError(registry, "InvalidPublicKey");
    });

    it("should reject zero credential ID", async function () {
      await expect(registry.connect(user1).register(testPublicKeyX, testPublicKeyY, ethers.ZeroHash))
        .to.be.revertedWithCustomError(registry, "InvalidCredentialId");
    });

    it("should store correct identity data", async function () {
      await registry.connect(user1).register(testPublicKeyX, testPublicKeyY, testCredentialId);

      const identity = await registry.getIdentity(user1.address);
      expect(identity.publicKeyX).to.equal(testPublicKeyX);
      expect(identity.publicKeyY).to.equal(testPublicKeyY);
      expect(identity.credentialId).to.equal(testCredentialId);
      expect(identity.counter).to.equal(0);
      expect(identity.active).to.be.true;
    });

    it("should map credential ID to user address", async function () {
      await registry.connect(user1).register(testPublicKeyX, testPublicKeyY, testCredentialId);
      expect(await registry.credentialToUser(testCredentialId)).to.equal(user1.address);
    });
  });

  describe("Revocation", function () {
    beforeEach(async function () {
      await registry.connect(user1).register(testPublicKeyX, testPublicKeyY, testCredentialId);
    });

    it("should allow self-revocation", async function () {
      const tx = await registry.connect(user1).revoke();
      const receipt = await tx.wait();
      const block = await ethers.provider.getBlock(receipt!.blockNumber);

      await expect(tx)
        .to.emit(registry, "IdentityRevoked")
        .withArgs(user1.address, block!.timestamp);

      expect(await registry.isActive(user1.address)).to.be.false;
      // Still has identity, just not active
      expect(await registry.hasIdentity(user1.address)).to.be.true;
    });

    it("should reject revocation of non-existent identity", async function () {
      await expect(registry.connect(user2).revoke())
        .to.be.revertedWithCustomError(registry, "IdentityNotFound");
    });
  });

  describe("Relayer Management", function () {
    it("should add trusted relayer", async function () {
      await expect(registry.setTrustedRelayer(relayer.address, true))
        .to.emit(registry, "RelayerUpdated")
        .withArgs(relayer.address, true);

      expect(await registry.trustedRelayers(relayer.address)).to.be.true;
    });

    it("should remove trusted relayer", async function () {
      await registry.setTrustedRelayer(relayer.address, true);
      await registry.setTrustedRelayer(relayer.address, false);

      expect(await registry.trustedRelayers(relayer.address)).to.be.false;
    });

    it("should reject non-owner setting relayer", async function () {
      await expect(registry.connect(user1).setTrustedRelayer(relayer.address, true))
        .to.be.revertedWithCustomError(registry, "OwnableUnauthorizedAccount");
    });
  });

  describe("Pause/Unpause", function () {
    it("should pause and unpause", async function () {
      await registry.pause();
      expect(await registry.paused()).to.be.true;

      await registry.unpause();
      expect(await registry.paused()).to.be.false;
    });

    it("should reject registration when paused", async function () {
      await registry.pause();

      await expect(registry.connect(user1).register(testPublicKeyX, testPublicKeyY, testCredentialId))
        .to.be.revertedWithCustomError(registry, "EnforcedPause");
    });

    it("should reject non-owner pause", async function () {
      await expect(registry.connect(user1).pause())
        .to.be.revertedWithCustomError(registry, "OwnableUnauthorizedAccount");
    });

    it("should reject non-owner unpause", async function () {
      await registry.pause();
      await expect(registry.connect(user1).unpause())
        .to.be.revertedWithCustomError(registry, "OwnableUnauthorizedAccount");
    });
  });

  describe("View Functions", function () {
    it("should return false for non-existent identity", async function () {
      expect(await registry.hasIdentity(user1.address)).to.be.false;
      expect(await registry.isActive(user1.address)).to.be.false;
    });

    it("should lookup user by credential ID", async function () {
      await registry.connect(user1).register(testPublicKeyX, testPublicKeyY, testCredentialId);
      expect(await registry.credentialToUser(testCredentialId)).to.equal(user1.address);
    });

    it("should return zero address for unknown credential", async function () {
      expect(await registry.credentialToUser(testCredentialId)).to.equal(ethers.ZeroAddress);
    });
  });

  describe("Verification View", function () {
    beforeEach(async function () {
      await registry.connect(user1).register(testPublicKeyX, testPublicKeyY, testCredentialId);
    });

    it("should return false for non-existent user", async function () {
      const result = await registry.verifyView(
        user2.address,
        ethers.ZeroHash,
        ethers.zeroPadValue("0x01", 32),
        ethers.zeroPadValue("0x02", 32)
      );
      expect(result).to.be.false;
    });

    it("should return false for revoked identity", async function () {
      await registry.connect(user1).revoke();

      const result = await registry.verifyView(
        user1.address,
        ethers.ZeroHash,
        ethers.zeroPadValue("0x01", 32),
        ethers.zeroPadValue("0x02", 32)
      );
      expect(result).to.be.false;
    });
  });

  // Note: Full signature verification tests require real P-256 keys and ACP-204 precompile
  // Those tests should be run on Fuji testnet with actual WebAuthn credentials
});
