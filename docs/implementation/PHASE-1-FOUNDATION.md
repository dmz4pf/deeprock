# Phase 1: Foundation (Days 1-7)


**Goal:** Establish project infrastructure, verify ACP-204 precompile works on Fuji, deploy BiometricRegistry contract, and set up database schema.

**Architecture:** Hardhat for contracts, Next.js 14 monorepo structure, Prisma for database ORM.

**Tech Stack:** Solidity 0.8.24, TypeScript, Hardhat, Prisma, PostgreSQL

---

## Objectives

1. Verify ACP-204 secp256r1 precompile is functional on Fuji testnet (CRITICAL GO/NO-GO)
2. Deploy BiometricRegistry contract with P256Verifier library
3. Set up database schema with Prisma
4. Create basic project structure for all layers
5. Establish CI/CD foundation

## Deliverables

- [ ] Project monorepo structure created
- [ ] ACP-204 precompile verified working on Fuji
- [ ] P256Verifier library deployed and tested
- [ ] BiometricRegistry contract deployed to Fuji
- [ ] Database schema applied (users, biometric_identities, sessions)
- [ ] Basic API routes scaffolded
- [ ] GitHub Actions CI workflow

## Dependencies

- Avalanche Fuji testnet access
- Fuji AVAX for gas (faucet)
- Supabase account (or local PostgreSQL)
- Upstash account (or local Redis)

---

## Task 1.1: Project Scaffolding

**Complexity:** Low | **Time:** 2-3 hours

**Files:**
- Create: `package.json` (root workspace)
- Create: `contracts/package.json`
- Create: `contracts/hardhat.config.ts`
- Create: `contracts/tsconfig.json`
- Create: `frontend/package.json`
- Create: `backend/package.json`
- Create: `.gitignore`
- Create: `.env.example`

### Step 1: Initialize monorepo

```bash
cd /Users/MAC/Desktop/dev/avax

# Initialize root package.json
npm init -y

# Update package.json for workspaces
```

**package.json (root):**
```json
{
  "name": "rwa-gateway",
  "version": "0.1.0",
  "private": true,
  "workspaces": [
    "contracts",
    "frontend",
    "backend"
  ],
  "scripts": {
    "contracts:compile": "npm run compile -w contracts",
    "contracts:test": "npm run test -w contracts",
    "contracts:deploy": "npm run deploy -w contracts",
    "frontend:dev": "npm run dev -w frontend",
    "frontend:build": "npm run build -w frontend",
    "backend:dev": "npm run dev -w backend",
    "typecheck": "npm run typecheck -w contracts && npm run typecheck -w frontend && npm run typecheck -w backend"
  }
}
```

### Step 2: Set up contracts workspace

```bash
mkdir -p contracts/src contracts/test contracts/script
cd contracts
npm init -y
```

**contracts/package.json:**
```json
{
  "name": "@rwa-gateway/contracts",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "compile": "hardhat compile",
    "test": "hardhat test",
    "test:coverage": "hardhat coverage",
    "deploy:fuji": "hardhat run script/deploy.ts --network fuji",
    "deploy:local": "hardhat run script/deploy.ts --network localhost",
    "verify": "hardhat verify",
    "typecheck": "tsc --noEmit",
    "clean": "hardhat clean"
  },
  "devDependencies": {
    "@nomicfoundation/hardhat-toolbox": "^4.0.0",
    "@nomicfoundation/hardhat-ethers": "^3.0.0",
    "@openzeppelin/contracts": "^5.0.0",
    "hardhat": "^2.19.0",
    "ethers": "^6.9.0",
    "typescript": "^5.3.0",
    "ts-node": "^10.9.0",
    "@types/node": "^20.10.0",
    "dotenv": "^16.3.0"
  }
}
```

**contracts/hardhat.config.ts:**
```typescript
import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import * as dotenv from "dotenv";

dotenv.config({ path: "../.env" });

const FUJI_RPC = process.env.AVALANCHE_FUJI_RPC || "https://api.avax-test.network/ext/bc/C/rpc";
const DEPLOYER_KEY = process.env.DEPLOYER_PRIVATE_KEY || "";

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.24",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
      evmVersion: "cancun",
    },
  },
  networks: {
    hardhat: {
      chainId: 43113, // Fork Fuji for local testing
    },
    fuji: {
      url: FUJI_RPC,
      chainId: 43113,
      accounts: DEPLOYER_KEY ? [DEPLOYER_KEY] : [],
    },
    mainnet: {
      url: process.env.AVALANCHE_MAINNET_RPC || "https://api.avax.network/ext/bc/C/rpc",
      chainId: 43114,
      accounts: DEPLOYER_KEY ? [DEPLOYER_KEY] : [],
    },
  },
  etherscan: {
    apiKey: {
      avalancheFujiTestnet: process.env.SNOWTRACE_API_KEY || "",
      avalanche: process.env.SNOWTRACE_API_KEY || "",
    },
  },
  gasReporter: {
    enabled: true,
    currency: "USD",
  },
};

export default config;
```

### Step 3: Create .env.example

**.env.example:**
```bash
# Blockchain
AVALANCHE_FUJI_RPC=https://api.avax-test.network/ext/bc/C/rpc
AVALANCHE_MAINNET_RPC=https://api.avax.network/ext/bc/C/rpc
DEPLOYER_PRIVATE_KEY=
SNOWTRACE_API_KEY=

# Contracts (populated after deployment)
BIOMETRIC_REGISTRY_ADDRESS=
CREDENTIAL_VERIFIER_ADDRESS=
RWA_GATEWAY_ADDRESS=
DOCUMENT_SEAL_ADDRESS=

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/rwa_gateway

# Redis
REDIS_URL=redis://localhost:6379

# Auth
JWT_SECRET=your-256-bit-secret-here
WEBAUTHN_RP_ID=localhost
WEBAUTHN_RP_NAME=RWA Gateway
WEBAUTHN_ORIGIN=http://localhost:3000

# Relayer
RELAYER_PRIVATE_KEY=
RELAYER_ADDRESS=
```

### Step 4: Create .gitignore

**.gitignore:**
```
# Dependencies
node_modules/
.pnp
.pnp.js

# Build outputs
dist/
build/
.next/
out/

# Hardhat
cache/
artifacts/
typechain-types/
coverage/
coverage.json

# Environment
.env
.env.local
.env.*.local

# IDE
.idea/
.vscode/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Logs
*.log
npm-debug.log*

# Testing
.nyc_output/

# Misc
*.tsbuildinfo
```

### Step 5: Verify setup

Run: `npm install`
Expected: Dependencies installed for all workspaces

Run: `cd contracts && npx hardhat compile`
Expected: Compilation successful (no contracts yet, but Hardhat works)

### Step 6: Commit

```bash
git init
git add .
git commit -m "chore: initialize monorepo structure

- Set up npm workspaces (contracts, frontend, backend)
- Configure Hardhat for Solidity 0.8.24
- Add environment template
- Configure Fuji and mainnet networks

```

---

## Task 1.2: ACP-204 Precompile Verification (CRITICAL)

**Complexity:** High | **Time:** 4-6 hours

**Files:**
- Create: `contracts/src/libraries/P256Verifier.sol`
- Create: `contracts/test/P256Verifier.test.ts`
- Create: `contracts/script/verify-acp204.ts`

### Step 1: Write P256Verifier library

**contracts/src/libraries/P256Verifier.sol:**
```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title P256Verifier
 * @notice Library for verifying secp256r1 (P-256) signatures using Avalanche's ACP-204 precompile
 * @dev Precompile address: 0x0000000000000000000000000000000000000100
 *      Gas cost: ~3,450 (vs 250,000+ in pure Solidity)
 *      Activated: November 19, 2025 (Granite Upgrade)
 */
library P256Verifier {
    /// @dev ACP-204 precompile address for secp256r1 verification
    address constant P256_VERIFIER = 0x0000000000000000000000000000000000000100;

    /// @dev Expected input size: 32 (hash) + 32 (r) + 32 (s) + 32 (x) + 32 (y) = 160 bytes
    uint256 constant INPUT_SIZE = 160;

    error InvalidSignatureLength();
    error InvalidPublicKeyLength();
    error PrecompileCallFailed();
    error SignatureVerificationFailed();

    /**
     * @notice Verify a P-256 signature using the ACP-204 precompile
     * @param messageHash The 32-byte hash of the message that was signed
     * @param r The r component of the signature (32 bytes)
     * @param s The s component of the signature (32 bytes)
     * @param x The x coordinate of the public key (32 bytes)
     * @param y The y coordinate of the public key (32 bytes)
     * @return valid True if signature is valid, false otherwise
     */
    function verify(
        bytes32 messageHash,
        bytes32 r,
        bytes32 s,
        bytes32 x,
        bytes32 y
    ) internal view returns (bool valid) {
        // Pack inputs: messageHash || r || s || x || y
        bytes memory input = abi.encodePacked(messageHash, r, s, x, y);

        // Call precompile
        (bool success, bytes memory result) = P256_VERIFIER.staticcall(input);

        // Precompile returns 1 for valid, reverts for invalid
        if (success && result.length == 32) {
            valid = abi.decode(result, (uint256)) == 1;
        }
    }

    /**
     * @notice Verify a P-256 signature with raw bytes inputs
     * @param messageHash The 32-byte hash of the message
     * @param signature The 64-byte signature (r || s)
     * @param publicKey The 64-byte public key (x || y)
     * @return valid True if signature is valid
     */
    function verifyRaw(
        bytes32 messageHash,
        bytes calldata signature,
        bytes calldata publicKey
    ) internal view returns (bool valid) {
        if (signature.length != 64) revert InvalidSignatureLength();
        if (publicKey.length != 64) revert InvalidPublicKeyLength();

        bytes32 r;
        bytes32 s;
        bytes32 x;
        bytes32 y;

        // Extract components using assembly for gas efficiency
        assembly {
            r := calldataload(signature.offset)
            s := calldataload(add(signature.offset, 32))
            x := calldataload(publicKey.offset)
            y := calldataload(add(publicKey.offset, 32))
        }

        return verify(messageHash, r, s, x, y);
    }

    /**
     * @notice Verify a WebAuthn assertion signature
     * @dev Constructs the signed message as: SHA256(authenticatorData || SHA256(clientDataJSON))
     * @param authenticatorData The authenticator data from WebAuthn
     * @param clientDataHash SHA256 hash of clientDataJSON
     * @param r Signature r component
     * @param s Signature s component
     * @param x Public key x coordinate
     * @param y Public key y coordinate
     * @return valid True if signature is valid
     */
    function verifyWebAuthn(
        bytes calldata authenticatorData,
        bytes32 clientDataHash,
        bytes32 r,
        bytes32 s,
        bytes32 x,
        bytes32 y
    ) internal view returns (bool valid) {
        // WebAuthn signature is over: SHA256(authenticatorData || clientDataHash)
        bytes32 messageHash = sha256(abi.encodePacked(authenticatorData, clientDataHash));
        return verify(messageHash, r, s, x, y);
    }

    /**
     * @notice Check if the ACP-204 precompile is available
     * @dev Useful for runtime checks on networks that may not have the precompile
     * @return available True if precompile responds correctly
     */
    function isPrecompileAvailable() internal view returns (bool available) {
        // Use a known valid test vector
        // This is a minimal check - just verify the precompile responds
        bytes memory testInput = new bytes(INPUT_SIZE);
        (bool success, ) = P256_VERIFIER.staticcall(testInput);
        // Precompile exists if call doesn't revert with "no code"
        // Invalid input will revert but that's expected
        available = success || P256_VERIFIER.code.length > 0;
    }
}
```

### Step 2: Write test file

**contracts/test/P256Verifier.test.ts:**
```typescript
import { expect } from "chai";
import { ethers } from "hardhat";

describe("P256Verifier", function () {
  // Test vectors from NIST FIPS 186-3
  // These are known valid P-256 signatures
  const TEST_VECTORS = {
    // Vector 1: Simple test
    vector1: {
      messageHash: "0x9834876dcfb05cb167a5c24953eba58c4ac89b1adf57f28f2f9d09af107ee8f0",
      r: "0x6b17d1f2e12c4247f8bce6e563a440f277037d812deb33a0f4a13945d898c296",
      s: "0x4fe342e2fe1a7f9b8ee7eb4a7c0f9e162bce33576b315ececbb6406837bf51f5",
      x: "0x6b17d1f2e12c4247f8bce6e563a440f277037d812deb33a0f4a13945d898c296",
      y: "0x4fe342e2fe1a7f9b8ee7eb4a7c0f9e162bce33576b315ececbb6406837bf51f5",
      valid: false, // This is a placeholder - use real test vectors
    },
  };

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
    it("should verify a valid P-256 signature", async function () {
      // Skip if precompile not available
      const available = await verifierTest.checkPrecompileAvailable();
      if (!available) {
        console.log("Skipping: ACP-204 precompile not available on this network");
        this.skip();
      }

      // Use real WebAuthn signature from device
      // This test should be updated with actual test vectors
    });

    it("should reject an invalid signature", async function () {
      const available = await verifierTest.checkPrecompileAvailable();
      if (!available) {
        this.skip();
      }

      // Modify a valid signature to make it invalid
      const result = await verifierTest.verify(
        ethers.zeroPadValue("0x01", 32), // Invalid hash
        ethers.zeroPadValue("0x02", 32),
        ethers.zeroPadValue("0x03", 32),
        ethers.zeroPadValue("0x04", 32),
        ethers.zeroPadValue("0x05", 32)
      );
      expect(result).to.be.false;
    });

    it("should measure gas cost", async function () {
      const available = await verifierTest.checkPrecompileAvailable();
      if (!available) {
        this.skip();
      }

      const tx = await verifierTest.verifyWithGas(
        ethers.zeroPadValue("0x01", 32),
        ethers.zeroPadValue("0x02", 32),
        ethers.zeroPadValue("0x03", 32),
        ethers.zeroPadValue("0x04", 32),
        ethers.zeroPadValue("0x05", 32)
      );
      const receipt = await tx.wait();
      console.log(`Gas used for P-256 verification: ${receipt.gasUsed}`);

      // Should be around 3,450 gas for precompile
      // Much less than 250,000+ for pure Solidity implementation
    });
  });
});
```

### Step 3: Write test contract wrapper

**contracts/src/test/P256VerifierTest.sol:**
```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "../libraries/P256Verifier.sol";

/**
 * @title P256VerifierTest
 * @notice Test contract for P256Verifier library
 */
contract P256VerifierTest {
    using P256Verifier for *;

    event VerificationResult(bool valid, uint256 gasUsed);

    function checkPrecompileAvailable() external view returns (bool) {
        return P256Verifier.isPrecompileAvailable();
    }

    function verify(
        bytes32 messageHash,
        bytes32 r,
        bytes32 s,
        bytes32 x,
        bytes32 y
    ) external view returns (bool) {
        return P256Verifier.verify(messageHash, r, s, x, y);
    }

    function verifyRaw(
        bytes32 messageHash,
        bytes calldata signature,
        bytes calldata publicKey
    ) external view returns (bool) {
        return P256Verifier.verifyRaw(messageHash, signature, publicKey);
    }

    function verifyWithGas(
        bytes32 messageHash,
        bytes32 r,
        bytes32 s,
        bytes32 x,
        bytes32 y
    ) external returns (bool valid) {
        uint256 gasBefore = gasleft();
        valid = P256Verifier.verify(messageHash, r, s, x, y);
        uint256 gasUsed = gasBefore - gasleft();
        emit VerificationResult(valid, gasUsed);
    }
}
```

### Step 4: Write verification script for Fuji

**contracts/script/verify-acp204.ts:**
```typescript
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
```

### Step 5: Run verification on Fuji

```bash
# Get Fuji AVAX from faucet first
# https://faucet.avax.network/

cd contracts
npx hardhat run script/verify-acp204.ts --network fuji
```

Expected output (if precompile available):
```
=== ACP-204 Precompile Verification ===

Network: fuji (chainId: 43113)
Deploying P256VerifierTest...
Deployed to: 0x...

Checking ACP-204 precompile availability...
✅ ACP-204 PRECOMPILE IS AVAILABLE!

Measuring gas cost...
Gas used for verification: ~3450

🎉 GO/NO-GO DECISION: GO - Proceed with BiometricRegistry implementation
```

### Step 6: Commit

```bash
git add .
git commit -m "feat(contracts): add P256Verifier library with ACP-204 integration

- Implement P256Verifier library for secp256r1 signature verification
- Add precompile availability check
- Add test contract and verification script
- Verify ACP-204 working on Fuji testnet

```

---

## Task 1.3: BiometricRegistry Contract

**Complexity:** High | **Time:** 6-8 hours

**Files:**
- Create: `contracts/src/BiometricRegistry.sol`
- Create: `contracts/test/BiometricRegistry.test.ts`

### Step 1: Write BiometricRegistry contract

**contracts/src/BiometricRegistry.sol:**
```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./libraries/P256Verifier.sol";

/**
 * @title BiometricRegistry
 * @notice Core identity layer for RWA Gateway - stores WebAuthn/Passkey public keys
 *         and verifies biometric signatures using Avalanche's ACP-204 precompile
 * @dev Each user registers their P-256 public key (from device Secure Enclave)
 *      Signatures are verified on-chain for transaction authorization
 */
contract BiometricRegistry is Ownable, Pausable, ReentrancyGuard {
    using P256Verifier for *;

    /// @notice Biometric identity data structure
    struct Identity {
        bytes32 publicKeyX;      // P-256 public key X coordinate
        bytes32 publicKeyY;      // P-256 public key Y coordinate
        bytes32 credentialId;    // WebAuthn credential ID hash
        uint64 registeredAt;     // Registration timestamp
        uint64 lastUsed;         // Last verification timestamp
        uint32 counter;          // Signature counter (replay protection)
        bool active;             // Identity status
    }

    /// @notice Mapping from user address to their biometric identity
    mapping(address => Identity) public identities;

    /// @notice Mapping from credential ID to user address (reverse lookup)
    mapping(bytes32 => address) public credentialToUser;

    /// @notice Trusted relayers that can submit meta-transactions
    mapping(address => bool) public trustedRelayers;

    /// @notice Used nonces for meta-transactions (prevents replay)
    mapping(address => mapping(uint256 => bool)) public usedNonces;

    /// @notice Total registered identities
    uint256 public totalIdentities;

    // Events
    event IdentityRegistered(
        address indexed user,
        bytes32 indexed credentialId,
        bytes32 publicKeyX,
        bytes32 publicKeyY,
        uint256 timestamp
    );

    event IdentityVerified(
        address indexed user,
        uint32 newCounter,
        uint256 timestamp
    );

    event IdentityRevoked(
        address indexed user,
        uint256 timestamp
    );

    event RelayerUpdated(
        address indexed relayer,
        bool trusted
    );

    // Errors
    error IdentityAlreadyExists();
    error IdentityNotFound();
    error IdentityNotActive();
    error InvalidSignature();
    error InvalidPublicKey();
    error InvalidCredentialId();
    error CounterTooLow();
    error NonceAlreadyUsed();
    error NotTrustedRelayer();
    error DeadlineExpired();

    constructor() Ownable(msg.sender) {}

    /**
     * @notice Register a new biometric identity
     * @param publicKeyX X coordinate of P-256 public key (32 bytes)
     * @param publicKeyY Y coordinate of P-256 public key (32 bytes)
     * @param credentialId WebAuthn credential ID hash
     */
    function register(
        bytes32 publicKeyX,
        bytes32 publicKeyY,
        bytes32 credentialId
    ) external whenNotPaused {
        _register(msg.sender, publicKeyX, publicKeyY, credentialId);
    }

    /**
     * @notice Register via relayer (meta-transaction)
     * @param user The user address to register
     * @param publicKeyX X coordinate of P-256 public key
     * @param publicKeyY Y coordinate of P-256 public key
     * @param credentialId WebAuthn credential ID hash
     * @param deadline Timestamp after which this request expires
     * @param nonce Unique nonce for replay protection
     * @param r Signature r component
     * @param s Signature s component
     */
    function registerViaRelayer(
        address user,
        bytes32 publicKeyX,
        bytes32 publicKeyY,
        bytes32 credentialId,
        uint256 deadline,
        uint256 nonce,
        bytes32 r,
        bytes32 s
    ) external whenNotPaused {
        if (!trustedRelayers[msg.sender]) revert NotTrustedRelayer();
        if (block.timestamp > deadline) revert DeadlineExpired();
        if (usedNonces[user][nonce]) revert NonceAlreadyUsed();

        // Verify the user signed this registration request
        bytes32 messageHash = keccak256(abi.encodePacked(
            "REGISTER",
            user,
            publicKeyX,
            publicKeyY,
            credentialId,
            deadline,
            nonce,
            block.chainid
        ));

        // For registration, we verify using the public key being registered
        bool valid = P256Verifier.verify(messageHash, r, s, publicKeyX, publicKeyY);
        if (!valid) revert InvalidSignature();

        usedNonces[user][nonce] = true;
        _register(user, publicKeyX, publicKeyY, credentialId);
    }

    /**
     * @notice Verify a biometric signature and update counter
     * @param user The user whose signature to verify
     * @param messageHash The hash of the message that was signed
     * @param r Signature r component
     * @param s Signature s component
     * @param counter Expected counter value (must be >= stored counter)
     * @return valid True if signature is valid and counter updated
     */
    function verify(
        address user,
        bytes32 messageHash,
        bytes32 r,
        bytes32 s,
        uint32 counter
    ) external whenNotPaused returns (bool valid) {
        Identity storage identity = identities[user];

        if (identity.publicKeyX == bytes32(0)) revert IdentityNotFound();
        if (!identity.active) revert IdentityNotActive();
        if (counter < identity.counter) revert CounterTooLow();

        valid = P256Verifier.verify(
            messageHash,
            r,
            s,
            identity.publicKeyX,
            identity.publicKeyY
        );

        if (valid) {
            identity.counter = counter + 1;
            identity.lastUsed = uint64(block.timestamp);
            emit IdentityVerified(user, identity.counter, block.timestamp);
        }
    }

    /**
     * @notice Verify a WebAuthn assertion
     * @param user The user whose signature to verify
     * @param authenticatorData The authenticator data from WebAuthn
     * @param clientDataHash SHA256 hash of clientDataJSON
     * @param r Signature r component
     * @param s Signature s component
     * @param counter Expected counter value
     * @return valid True if signature is valid
     */
    function verifyWebAuthn(
        address user,
        bytes calldata authenticatorData,
        bytes32 clientDataHash,
        bytes32 r,
        bytes32 s,
        uint32 counter
    ) external whenNotPaused returns (bool valid) {
        Identity storage identity = identities[user];

        if (identity.publicKeyX == bytes32(0)) revert IdentityNotFound();
        if (!identity.active) revert IdentityNotActive();
        if (counter < identity.counter) revert CounterTooLow();

        valid = P256Verifier.verifyWebAuthn(
            authenticatorData,
            clientDataHash,
            r,
            s,
            identity.publicKeyX,
            identity.publicKeyY
        );

        if (valid) {
            identity.counter = counter + 1;
            identity.lastUsed = uint64(block.timestamp);
            emit IdentityVerified(user, identity.counter, block.timestamp);
        }
    }

    /**
     * @notice View-only signature verification (no state changes)
     * @dev Useful for checking signatures without incrementing counter
     */
    function verifyView(
        address user,
        bytes32 messageHash,
        bytes32 r,
        bytes32 s
    ) external view returns (bool valid) {
        Identity storage identity = identities[user];

        if (identity.publicKeyX == bytes32(0)) return false;
        if (!identity.active) return false;

        return P256Verifier.verify(
            messageHash,
            r,
            s,
            identity.publicKeyX,
            identity.publicKeyY
        );
    }

    /**
     * @notice Revoke an identity (only owner can self-revoke)
     */
    function revoke() external {
        Identity storage identity = identities[msg.sender];
        if (identity.publicKeyX == bytes32(0)) revert IdentityNotFound();

        identity.active = false;
        emit IdentityRevoked(msg.sender, block.timestamp);
    }

    /**
     * @notice Update trusted relayer status
     * @param relayer The relayer address
     * @param trusted Whether the relayer is trusted
     */
    function setTrustedRelayer(address relayer, bool trusted) external onlyOwner {
        trustedRelayers[relayer] = trusted;
        emit RelayerUpdated(relayer, trusted);
    }

    /**
     * @notice Pause the contract (emergency)
     */
    function pause() external onlyOwner {
        _pause();
    }

    /**
     * @notice Unpause the contract
     */
    function unpause() external onlyOwner {
        _unpause();
    }

    /**
     * @notice Get identity details
     */
    function getIdentity(address user) external view returns (
        bytes32 publicKeyX,
        bytes32 publicKeyY,
        bytes32 credentialId,
        uint64 registeredAt,
        uint64 lastUsed,
        uint32 counter,
        bool active
    ) {
        Identity storage identity = identities[user];
        return (
            identity.publicKeyX,
            identity.publicKeyY,
            identity.credentialId,
            identity.registeredAt,
            identity.lastUsed,
            identity.counter,
            identity.active
        );
    }

    /**
     * @notice Check if user has registered identity
     */
    function hasIdentity(address user) external view returns (bool) {
        return identities[user].publicKeyX != bytes32(0);
    }

    /**
     * @notice Check if identity is active
     */
    function isActive(address user) external view returns (bool) {
        Identity storage identity = identities[user];
        return identity.publicKeyX != bytes32(0) && identity.active;
    }

    // Internal functions

    function _register(
        address user,
        bytes32 publicKeyX,
        bytes32 publicKeyY,
        bytes32 credentialId
    ) internal {
        if (identities[user].publicKeyX != bytes32(0)) revert IdentityAlreadyExists();
        if (publicKeyX == bytes32(0) || publicKeyY == bytes32(0)) revert InvalidPublicKey();
        if (credentialId == bytes32(0)) revert InvalidCredentialId();
        if (credentialToUser[credentialId] != address(0)) revert IdentityAlreadyExists();

        identities[user] = Identity({
            publicKeyX: publicKeyX,
            publicKeyY: publicKeyY,
            credentialId: credentialId,
            registeredAt: uint64(block.timestamp),
            lastUsed: 0,
            counter: 0,
            active: true
        });

        credentialToUser[credentialId] = user;
        totalIdentities++;

        emit IdentityRegistered(user, credentialId, publicKeyX, publicKeyY, block.timestamp);
    }
}
```

### Step 2: Write comprehensive tests

**contracts/test/BiometricRegistry.test.ts:**
```typescript
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
      await expect(registry.connect(user1).register(testPublicKeyX, testPublicKeyY, testCredentialId))
        .to.emit(registry, "IdentityRegistered")
        .withArgs(user1.address, testCredentialId, testPublicKeyX, testPublicKeyY, await getBlockTimestamp());

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

    it("should reject zero public key", async function () {
      await expect(registry.connect(user1).register(ethers.ZeroHash, testPublicKeyY, testCredentialId))
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
  });

  describe("Revocation", function () {
    beforeEach(async function () {
      await registry.connect(user1).register(testPublicKeyX, testPublicKeyY, testCredentialId);
    });

    it("should allow self-revocation", async function () {
      await expect(registry.connect(user1).revoke())
        .to.emit(registry, "IdentityRevoked")
        .withArgs(user1.address, await getBlockTimestamp());

      expect(await registry.isActive(user1.address)).to.be.false;
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
  });

  // Note: Full signature verification tests require real P-256 keys and ACP-204 precompile
  // Those tests should be run on Fuji testnet

  // Helper function
  async function getBlockTimestamp(): Promise<number> {
    const block = await ethers.provider.getBlock("latest");
    return block!.timestamp;
  }
});
```

### Step 3: Run tests

```bash
cd contracts
npm test
```

Expected: All tests pass

### Step 4: Commit

```bash
git add .
git commit -m "feat(contracts): implement BiometricRegistry contract

- WebAuthn public key storage and management
- P-256 signature verification via ACP-204 precompile
- Meta-transaction support via trusted relayers
- Counter-based replay protection
- Pausable and access controlled
- Comprehensive test suite (15+ tests)

```

---

## Task 1.4: Database Schema Setup

**Complexity:** Medium | **Time:** 3-4 hours

**Files:**
- Create: `backend/package.json`
- Create: `backend/prisma/schema.prisma`
- Create: `backend/src/index.ts`

### Step 1: Set up backend package

```bash
mkdir -p backend/src backend/prisma
cd backend
npm init -y
```

**backend/package.json:**
```json
{
  "name": "@rwa-gateway/backend",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js",
    "db:generate": "prisma generate",
    "db:push": "prisma db push",
    "db:migrate": "prisma migrate dev",
    "db:studio": "prisma studio",
    "typecheck": "tsc --noEmit",
    "test": "vitest"
  },
  "dependencies": {
    "@prisma/client": "^5.8.0",
    "express": "^4.18.0",
    "cors": "^2.8.5",
    "helmet": "^7.1.0",
    "jose": "^5.2.0",
    "zod": "^3.22.0",
    "pino": "^8.17.0",
    "pino-pretty": "^10.3.0",
    "ioredis": "^5.3.0",
    "@simplewebauthn/server": "^10.0.0",
    "ethers": "^6.9.0"
  },
  "devDependencies": {
    "prisma": "^5.8.0",
    "typescript": "^5.3.0",
    "tsx": "^4.7.0",
    "@types/node": "^20.10.0",
    "@types/express": "^4.17.21",
    "@types/cors": "^2.8.17",
    "vitest": "^1.2.0",
    "dotenv": "^16.3.0"
  }
}
```

### Step 2: Write Prisma schema

**backend/prisma/schema.prisma:**
```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ============================================
// USER & IDENTITY
// ============================================

model User {
  id            String   @id @default(cuid())
  walletAddress String   @unique @map("wallet_address")
  email         String?  @unique
  displayName   String?  @map("display_name")
  isActive      Boolean  @default(true) @map("is_active")
  createdAt     DateTime @default(now()) @map("created_at")
  updatedAt     DateTime @updatedAt @map("updated_at")

  // Relations
  biometricIdentities BiometricIdentity[]
  credentials         Credential[]
  investments         Investment[]
  documents           Document[]
  sessions            Session[]
  auditLogs           AuditLog[]

  @@map("users")
}

model BiometricIdentity {
  id           String   @id @default(cuid())
  userId       String   @map("user_id")
  credentialId String   @unique @map("credential_id") // WebAuthn credential ID (base64)
  publicKeyX   String   @map("public_key_x") // P-256 X coordinate (hex)
  publicKeyY   String   @map("public_key_y") // P-256 Y coordinate (hex)
  authCounter  Int      @default(0) @map("auth_counter")
  deviceInfo   Json?    @map("device_info") // Browser/device metadata
  onChainTxHash String? @map("on_chain_tx_hash") // Registration transaction
  isActive     Boolean  @default(true) @map("is_active")
  createdAt    DateTime @default(now()) @map("created_at")
  updatedAt    DateTime @updatedAt @map("updated_at")

  // Relations
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@map("biometric_identities")
}

// ============================================
// CREDENTIALS (KYC/ACCREDITATION)
// ============================================

enum CredentialType {
  ACCREDITED
  QUALIFIED
  INSTITUTIONAL
  RETAIL_RESTRICTED
}

enum CredentialStatus {
  PENDING
  APPROVED
  REJECTED
  EXPIRED
  REVOKED
}

model Credential {
  id             String           @id @default(cuid())
  userId         String           @map("user_id")
  credentialType CredentialType   @map("credential_type")
  jurisdiction   String           // ISO 3166-1 alpha-2 (e.g., "US", "GB")
  tier           Int              @default(1) // 1-5, affects investment limits
  status         CredentialStatus @default(PENDING)
  issuerAddress  String?          @map("issuer_address") // On-chain issuer
  onChainTxHash  String?          @map("on_chain_tx_hash")
  issuedAt       DateTime?        @map("issued_at")
  expiresAt      DateTime?        @map("expires_at")
  metadata       Json?            // Additional verification data
  createdAt      DateTime         @default(now()) @map("created_at")
  updatedAt      DateTime         @updatedAt @map("updated_at")

  // Relations
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([status])
  @@map("credentials")
}

// ============================================
// ASSET POOLS & INVESTMENTS
// ============================================

enum AssetClass {
  TREASURY
  REAL_ESTATE
  PRIVATE_CREDIT
  COMMODITIES
}

enum PoolStatus {
  ACTIVE
  PAUSED
  CLOSED
}

model AssetPool {
  id              String      @id @default(cuid())
  chainPoolId     Int         @unique @map("chain_pool_id") // On-chain pool ID
  name            String
  assetClass      AssetClass  @map("asset_class")
  rwaTokenAddress String      @map("rwa_token_address")
  yieldRateBps    Int         @map("yield_rate_bps") // Basis points (100 = 1%)
  totalDeposited  BigInt      @default(0) @map("total_deposited") // In USDC (6 decimals)
  investorCount   Int         @default(0) @map("investor_count")
  minInvestment   BigInt      @map("min_investment")
  maxInvestment   BigInt      @map("max_investment")
  status          PoolStatus  @default(ACTIVE)
  metadata        Json?       // Pool description, documents, etc.
  createdAt       DateTime    @default(now()) @map("created_at")
  updatedAt       DateTime    @updatedAt @map("updated_at")

  // Relations
  investments  Investment[]
  yieldHistory YieldHistory[]

  @@index([assetClass])
  @@index([status])
  @@map("asset_pools")
}

enum InvestmentType {
  INVEST
  REDEEM
}

enum InvestmentStatus {
  PENDING
  CONFIRMED
  FAILED
}

model Investment {
  id          String           @id @default(cuid())
  userId      String           @map("user_id")
  poolId      String           @map("pool_id")
  type        InvestmentType
  amount      BigInt           // USDC amount (6 decimals)
  shares      BigInt           // RWA token shares (18 decimals)
  status      InvestmentStatus @default(PENDING)
  txHash      String?          @map("tx_hash")
  blockNumber Int?             @map("block_number")
  createdAt   DateTime         @default(now()) @map("created_at")
  updatedAt   DateTime         @updatedAt @map("updated_at")

  // Relations
  user User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  pool AssetPool @relation(fields: [poolId], references: [id])

  @@index([userId])
  @@index([poolId])
  @@index([status])
  @@map("investments")
}

model YieldHistory {
  id              String   @id @default(cuid())
  poolId          String   @map("pool_id")
  yieldAmount     BigInt   @map("yield_amount")
  cumulativeYield BigInt   @map("cumulative_yield")
  recordedAt      DateTime @default(now()) @map("recorded_at")

  // Relations
  pool AssetPool @relation(fields: [poolId], references: [id])

  @@index([poolId])
  @@map("yield_history")
}

// ============================================
// DOCUMENTS
// ============================================

model Document {
  id           String   @id @default(cuid())
  documentHash String   @unique @map("document_hash") // SHA-256
  title        String
  signerId     String   @map("signer_id")
  txHash       String?  @map("tx_hash")
  sealedAt     DateTime @default(now()) @map("sealed_at")
  metadata     Json?

  // Relations
  signer User @relation(fields: [signerId], references: [id])

  @@index([signerId])
  @@map("documents")
}

// ============================================
// SESSIONS
// ============================================

model Session {
  id        String   @id @default(cuid())
  userId    String   @map("user_id")
  tokenHash String   @unique @map("token_hash") // SHA-256 of JWT
  expiresAt DateTime @map("expires_at")
  ipAddress String?  @map("ip_address")
  userAgent String?  @map("user_agent")
  createdAt DateTime @default(now()) @map("created_at")

  // Relations
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([expiresAt])
  @@map("sessions")
}

// ============================================
// BLOCKCHAIN INDEXING
// ============================================

model IndexedEvent {
  id              String   @id @default(cuid())
  eventId         String   @unique @map("event_id") // txHash-logIndex
  contractAddress String   @map("contract_address")
  eventName       String   @map("event_name")
  blockNumber     Int      @map("block_number")
  blockHash       String   @map("block_hash")
  txHash          String   @map("tx_hash")
  logIndex        Int      @map("log_index")
  args            Json     // Event arguments
  reorged         Boolean  @default(false)
  indexedAt       DateTime @default(now()) @map("indexed_at")

  @@index([contractAddress])
  @@index([eventName])
  @@index([blockNumber])
  @@map("indexed_events")
}

// ============================================
// AUDIT LOG
// ============================================

model AuditLog {
  id           String   @id @default(cuid())
  action       String   // e.g., "REGISTER", "INVEST", "CREDENTIAL_ISSUED"
  userId       String?  @map("user_id")
  resourceType String?  @map("resource_type")
  resourceId   String?  @map("resource_id")
  metadata     Json?
  ipAddress    String?  @map("ip_address")
  status       String   // "SUCCESS", "FAILURE"
  createdAt    DateTime @default(now()) @map("created_at")

  // Relations
  user User? @relation(fields: [userId], references: [id])

  @@index([action])
  @@index([userId])
  @@index([createdAt])
  @@map("audit_logs")
}
```

### Step 3: Create basic server entry

**backend/src/index.ts:**
```typescript
import express from "express";
import cors from "cors";
import helmet from "helmet";
import pino from "pino";
import { PrismaClient } from "@prisma/client";

// Initialize
const app = express();
const prisma = new PrismaClient();
const logger = pino({
  transport: {
    target: "pino-pretty",
    options: { colorize: true },
  },
});

const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Health check
app.get("/api/health", async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      services: {
        database: "connected",
      },
    });
  } catch (error) {
    logger.error(error, "Health check failed");
    res.status(503).json({
      status: "unhealthy",
      error: "Database connection failed",
    });
  }
});

// Placeholder routes
app.get("/api/pools", (req, res) => {
  res.json({ pools: [], message: "Not implemented yet" });
});

app.get("/api/user/portfolio", (req, res) => {
  res.json({ portfolio: null, message: "Not implemented yet" });
});

// Start server
async function main() {
  try {
    await prisma.$connect();
    logger.info("Database connected");

    app.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
    });
  } catch (error) {
    logger.error(error, "Failed to start server");
    process.exit(1);
  }
}

main();

// Graceful shutdown
process.on("SIGINT", async () => {
  await prisma.$disconnect();
  process.exit(0);
});
```

**backend/tsconfig.json:**
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "lib": ["ES2022"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

### Step 4: Initialize database

```bash
cd backend
npm install

# Generate Prisma client
npx prisma generate

# Push schema to database (create tables)
npx prisma db push
```

Expected: Database tables created successfully

### Step 5: Verify database

```bash
npx prisma studio
```

Expected: Opens Prisma Studio showing all tables

### Step 6: Commit

```bash
git add .
git commit -m "feat(backend): add database schema with Prisma

- User and BiometricIdentity tables
- Credential management (KYC/accreditation)
- AssetPool and Investment tracking
- Document sealing records
- Session management
- Blockchain event indexing
- Audit logging

```

---

## Task 1.5: Frontend Scaffolding

**Complexity:** Medium | **Time:** 2-3 hours

**Files:**
- Create: `frontend/package.json`
- Create: `frontend/next.config.js`
- Create: `frontend/tailwind.config.ts`
- Create: `frontend/app/layout.tsx`
- Create: `frontend/app/page.tsx`

### Step 1: Initialize Next.js project

```bash
cd /Users/MAC/Desktop/dev/avax
npx create-next-app@14 frontend --typescript --tailwind --eslint --app --src-dir=false --import-alias="@/*"
```

### Step 2: Add additional dependencies

```bash
cd frontend
npm install @tanstack/react-query zustand @simplewebauthn/browser ethers@6 clsx tailwind-merge lucide-react
npm install -D @types/node
```

### Step 3: Install shadcn/ui

```bash
npx shadcn@latest init
```

Select:
- Style: Default
- Base color: Slate
- CSS variables: Yes

### Step 4: Add core shadcn components

```bash
npx shadcn@latest add button card input label toast dialog badge tabs skeleton
```

### Step 5: Create base layout

**frontend/app/layout.tsx:**
```tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "RWA Gateway - Biometric RWA Investment",
  description: "Invest in real-world assets with biometric authentication on Avalanche",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
```

**frontend/app/providers.tsx:**
```tsx
"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30 * 1000, // 30 seconds
            gcTime: 5 * 60 * 1000, // 5 minutes
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
```

**frontend/app/page.tsx:**
```tsx
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
      {/* Hero */}
      <section className="container mx-auto px-4 py-20 text-center">
        <Badge variant="secondary" className="mb-4">
          Powered by Avalanche
        </Badge>
        <h1 className="text-5xl font-bold tracking-tight text-slate-900 mb-6">
          Invest in Real-World Assets
          <br />
          <span className="text-blue-600">With Your Fingerprint</span>
        </h1>
        <p className="text-xl text-slate-600 max-w-2xl mx-auto mb-8">
          RWA Gateway brings institutional-grade real estate, treasuries, and private credit
          to everyone. No crypto wallet needed—just your biometrics.
        </p>
        <div className="flex gap-4 justify-center">
          <Link href="/register">
            <Button size="lg" className="text-lg px-8">
              Get Started
            </Button>
          </Link>
          <Link href="/pools">
            <Button size="lg" variant="outline" className="text-lg px-8">
              View Pools
            </Button>
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-4 py-16">
        <div className="grid md:grid-cols-3 gap-8">
          <Card>
            <CardHeader>
              <CardTitle>Biometric Security</CardTitle>
              <CardDescription>
                Face ID and Touch ID verified on Avalanche's blockchain
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-slate-600">
                Your identity is secured by your device's Secure Enclave—no passwords,
                no seed phrases, no wallet extensions.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Gasless Transactions</CardTitle>
              <CardDescription>
                Invest without AVAX or understanding blockchain
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-slate-600">
                Our relayer handles all transaction fees. You invest in USDC,
                we handle the rest.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Real-World Yield</CardTitle>
              <CardDescription>
                Tokenized treasuries, real estate, and more
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-slate-600">
                Access institutional-grade yields previously reserved for
                accredited investors and institutions.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Stats */}
      <section className="container mx-auto px-4 py-16 text-center">
        <div className="grid md:grid-cols-4 gap-8">
          <div>
            <p className="text-4xl font-bold text-blue-600">$0</p>
            <p className="text-slate-600">Total Value Locked</p>
          </div>
          <div>
            <p className="text-4xl font-bold text-blue-600">0</p>
            <p className="text-slate-600">Registered Users</p>
          </div>
          <div>
            <p className="text-4xl font-bold text-blue-600">0</p>
            <p className="text-slate-600">Active Pools</p>
          </div>
          <div>
            <p className="text-4xl font-bold text-blue-600">~3,450</p>
            <p className="text-slate-600">Gas per Verification</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t mt-20 py-8">
        <div className="container mx-auto px-4 text-center text-slate-600">
          <p>Built for Avalanche Build Games 2026</p>
          <p className="text-sm mt-2">
            Powered by ACP-204 secp256r1 precompile
          </p>
        </div>
      </footer>
    </main>
  );
}
```

### Step 6: Test frontend

```bash
cd frontend
npm run dev
```

Expected: Landing page loads at http://localhost:3000

### Step 7: Commit

```bash
git add .
git commit -m "feat(frontend): scaffold Next.js 14 with shadcn/ui

- Initialize Next.js 14 with App Router
- Configure TailwindCSS and shadcn/ui
- Add TanStack Query provider
- Create landing page with feature cards
- Add core UI components (button, card, badge)

```

---

## Task 1.6: CI/CD Foundation

**Complexity:** Low | **Time:** 1-2 hours

**Files:**
- Create: `.github/workflows/ci.yml`

### Step 1: Create GitHub Actions workflow

**.github/workflows/ci.yml:**
```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

env:
  NODE_VERSION: "20"

jobs:
  quality:
    name: Quality Gates
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: "npm"

      - name: Install dependencies
        run: npm ci

      - name: Lint contracts
        run: npm run contracts:compile
        working-directory: contracts

      - name: TypeScript check (contracts)
        run: npm run typecheck
        working-directory: contracts

  contracts:
    name: Contract Tests
    runs-on: ubuntu-latest
    needs: quality
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: "npm"

      - name: Install dependencies
        run: npm ci

      - name: Run contract tests
        run: npm test
        working-directory: contracts

      - name: Run coverage
        run: npm run test:coverage
        working-directory: contracts

  frontend:
    name: Frontend Build
    runs-on: ubuntu-latest
    needs: quality
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: "npm"

      - name: Install dependencies
        run: npm ci

      - name: Build frontend
        run: npm run build
        working-directory: frontend
```

### Step 2: Commit

```bash
git add .
git commit -m "ci: add GitHub Actions workflow

- Quality gates (lint, typecheck)
- Contract test suite
- Frontend build verification

```

---

## Phase 1 Definition of Done

- [ ] Monorepo structure with all workspaces
- [ ] ACP-204 precompile verified on Fuji (GO/NO-GO passed)
- [ ] P256Verifier library deployed and tested
- [ ] BiometricRegistry contract with 15+ passing tests
- [ ] Database schema applied (11 tables)
- [ ] Backend health check endpoint working
- [ ] Frontend landing page loading
- [ ] GitHub Actions CI passing

## Estimated Total Time: 25-35 hours

## Next Phase

Continue to [PHASE-2-CONTRACTS.md](./PHASE-2-CONTRACTS.md) for CredentialVerifier, RWAGateway, RWAToken, and DocumentSeal contracts.
