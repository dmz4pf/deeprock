# RWA Gateway Smart Contract Architecture
## Phase 2: Smart Contract Specification

**Version:** 1.0
**Date:** February 4, 2026
**Status:** DRAFT
**Project:** RWA Gateway - Biometric Real-World Asset Tokenization on Avalanche

---

## Table of Contents

1. [Contract Overview & Relationships](#1-contract-overview--relationships)
2. [BiometricRegistry Contract](#2-biometricregistry-contract)
3. [CredentialVerifier Contract](#3-credentialverifier-contract)
4. [RWAGateway Contract](#4-rwagateway-contract)
5. [RWAToken Contract](#5-rwatoken-contract)
6. [DocumentSeal Contract](#6-documentseal-contract)
7. [MockUSDC Contract](#7-mockusdc-contract)
8. [Contract Interactions & Data Flow](#8-contract-interactions--data-flow)
9. [Gas Optimization Strategies](#9-gas-optimization-strategies)
10. [Upgrade & Migration Strategy](#10-upgrade--migration-strategy)
11. [Testing Requirements](#11-testing-requirements)

---

## 1. Contract Overview & Relationships

### 1.1 Contract Dependency Diagram

```
                                    ┌─────────────────────┐
                                    │      Deployer       │
                                    │   (Admin EOA)       │
                                    └──────────┬──────────┘
                                               │ deploys
                    ┌──────────────────────────┼──────────────────────────┐
                    │                          │                          │
                    ▼                          ▼                          ▼
        ┌───────────────────┐     ┌───────────────────┐     ┌───────────────────┐
        │  BiometricRegistry │     │ CredentialVerifier│     │    MockUSDC       │
        │    (~200 lines)    │     │    (~300 lines)   │     │   (~50 lines)     │
        │                    │     │                   │     │                   │
        │  Layer 1: Identity │     │ Layer 2: Compliance│    │  Test Token       │
        └─────────┬──────────┘     └─────────┬─────────┘     └─────────┬─────────┘
                  │                          │                         │
                  │ verifies identity        │ verifies credentials    │ deposit token
                  │                          │                         │
                  └──────────────┬───────────┴─────────────────────────┘
                                 │
                                 ▼
                    ┌───────────────────────┐
                    │      RWAGateway       │
                    │     (~500 lines)      │
                    │                       │
                    │   Layer 3: Assets     │
                    └───────────┬───────────┘
                                │
              ┌─────────────────┼─────────────────┐
              │ creates/manages │                 │ seals documents
              ▼                 │                 ▼
    ┌───────────────────┐      │      ┌───────────────────┐
    │     RWAToken      │      │      │   DocumentSeal    │
    │   (~150 lines)    │      │      │   (~200 lines)    │
    │                   │      │      │                   │
    │  Per-Pool Token   │      │      │  Document Proofs  │
    └───────────────────┘      │      └───────────────────┘
              │                │
              │ transfer hooks │
              └────────────────┘
                    calls CredentialVerifier
```

### 1.2 Inheritance Hierarchy

```
OpenZeppelin Contracts (v5.x)
├── @openzeppelin/contracts/access/Ownable.sol
│   └── BiometricRegistry
│   └── CredentialVerifier
│   └── RWAGateway
│   └── DocumentSeal
│
├── @openzeppelin/contracts/access/AccessControl.sol
│   └── CredentialVerifier (VERIFIER_ROLE, ADMIN_ROLE)
│   └── RWAGateway (POOL_ADMIN_ROLE, YIELD_DISTRIBUTOR_ROLE)
│
├── @openzeppelin/contracts/utils/Pausable.sol
│   └── BiometricRegistry
│   └── RWAGateway
│   └── RWAToken
│
├── @openzeppelin/contracts/utils/ReentrancyGuard.sol
│   └── RWAGateway
│   └── RWAToken
│
├── @openzeppelin/contracts/token/ERC20/ERC20.sol
│   └── RWAToken
│   └── MockUSDC
│
└── @openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol
    └── RWAToken
```

### 1.3 Interface Definitions

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title IBiometricRegistry
/// @notice Interface for biometric identity registration and verification
interface IBiometricRegistry {
    struct BiometricIdentity {
        bytes32 publicKeyX;      // secp256r1 public key X coordinate
        bytes32 publicKeyY;      // secp256r1 public key Y coordinate
        uint256 registeredAt;    // Block timestamp of registration
        bool isActive;           // Whether identity is currently active
        bytes32 credentialId;    // WebAuthn credential identifier
        uint256 authCounter;     // Replay attack prevention counter
    }

    function register(
        bytes32 publicKeyX,
        bytes32 publicKeyY,
        bytes32 credentialId
    ) external returns (bool);

    function verify(
        address user,
        bytes32 messageHash,
        bytes calldata signature
    ) external returns (bool);

    function verifyViaPrecompile(
        address user,
        bytes32 messageHash,
        bytes32 r,
        bytes32 s
    ) external view returns (bool);

    function revoke(address user) external;
    function isRegistered(address user) external view returns (bool);
    function getIdentity(address user) external view returns (BiometricIdentity memory);

    event IdentityRegistered(
        address indexed user,
        bytes32 indexed credentialId,
        uint256 timestamp
    );
    event IdentityRevoked(address indexed user, uint256 timestamp);
    event VerificationSuccess(address indexed user, uint256 authCounter);
    event VerificationFailed(address indexed user, string reason);
}

/// @title ICredentialVerifier
/// @notice Interface for compliance credential management
interface ICredentialVerifier {
    enum CredentialType {
        NONE,           // 0: No credential
        ACCREDITED,     // 1: SEC accredited investor
        QUALIFIED,      // 2: Qualified purchaser
        INSTITUTIONAL,  // 3: Institutional investor
        RETAIL          // 4: Retail (limited)
    }

    struct Credential {
        CredentialType credentialType;
        bytes2 jurisdiction;     // ISO 3166-1 alpha-2 (e.g., "US", "GB")
        uint8 tier;              // Investment tier (1-5)
        uint256 issuedAt;        // Issuance timestamp
        uint256 expiresAt;       // Expiration timestamp
        address issuer;          // Trusted verifier who issued
        bool isActive;           // Whether credential is active
        bytes encryptedData;     // Optional eERC encrypted payload
    }

    function issueCredential(
        address user,
        CredentialType credentialType,
        bytes2 jurisdiction,
        uint8 tier,
        uint256 validityPeriod,
        bytes calldata encryptedData
    ) external returns (bool);

    function verifyCredential(
        address user,
        CredentialType requiredType,
        bytes2[] calldata allowedJurisdictions,
        uint8 requiredTier
    ) external view returns (bool);

    function revokeCredential(address user) external;
    function getCredential(address user) external view returns (Credential memory);

    event CredentialIssued(
        address indexed user,
        CredentialType indexed credentialType,
        bytes2 jurisdiction,
        uint8 tier,
        uint256 expiresAt
    );
    event CredentialRevoked(address indexed user, address indexed revoker);
    event CredentialExpired(address indexed user);
}

/// @title IRWAGateway
/// @notice Interface for RWA pool management and investment
interface IRWAGateway {
    struct AssetPool {
        string name;                    // Pool display name
        address rwaToken;               // RWA token contract address
        address depositToken;           // USDC or other stablecoin
        uint256 totalDeposited;         // Total stablecoin deposited
        uint256 totalShares;            // Total RWA tokens minted
        uint16 yieldRateBps;            // Yield rate in basis points (450 = 4.50%)
        uint256 minInvestment;          // Minimum investment amount
        uint256 maxInvestment;          // Maximum per-user investment
        ICredentialVerifier.CredentialType requiredCredentialType;
        bytes2[] allowedJurisdictions;  // Allowed ISO country codes
        uint8 requiredTier;             // Minimum tier requirement
        bool isActive;                  // Pool accepting investments
        uint256 createdAt;              // Pool creation timestamp
        uint256 lastYieldDistribution;  // Last yield distribution timestamp
    }

    function createPool(
        string calldata name,
        address depositToken,
        uint16 yieldRateBps,
        uint256 minInvestment,
        uint256 maxInvestment,
        ICredentialVerifier.CredentialType requiredCredentialType,
        bytes2[] calldata allowedJurisdictions,
        uint8 requiredTier
    ) external returns (uint256 poolId, address rwaTokenAddress);

    function invest(
        uint256 poolId,
        uint256 amount,
        bytes32 messageHash,
        bytes calldata biometricSignature
    ) external returns (uint256 sharesMinted);

    function redeem(
        uint256 poolId,
        uint256 shares,
        bytes32 messageHash,
        bytes calldata biometricSignature
    ) external returns (uint256 amountRedeemed);

    function distributeYield(uint256 poolId, uint256 yieldAmount) external;
    function getPool(uint256 poolId) external view returns (AssetPool memory);
    function getUserInvestment(uint256 poolId, address user) external view returns (uint256);

    event PoolCreated(
        uint256 indexed poolId,
        string name,
        address indexed rwaToken,
        address depositToken
    );
    event Investment(
        uint256 indexed poolId,
        address indexed investor,
        uint256 amount,
        uint256 sharesMinted
    );
    event Redemption(
        uint256 indexed poolId,
        address indexed investor,
        uint256 shares,
        uint256 amountRedeemed
    );
    event YieldDistributed(uint256 indexed poolId, uint256 amount, uint256 timestamp);
}

/// @title IRWAToken
/// @notice Interface for RWA tokens with transfer restrictions
interface IRWAToken {
    function mint(address to, uint256 amount) external;
    function burn(address from, uint256 amount) external;
    function pause() external;
    function unpause() external;
    function addToWhitelist(address account) external;
    function removeFromWhitelist(address account) external;
    function isWhitelisted(address account) external view returns (bool);

    event WhitelistAdded(address indexed account);
    event WhitelistRemoved(address indexed account);
    event TransferRestricted(address indexed from, address indexed to, string reason);
}

/// @title IDocumentSeal
/// @notice Interface for document sealing and verification
interface IDocumentSeal {
    struct DocumentRecord {
        bytes32 documentHash;    // SHA-256 hash of document
        address[] signers;       // Addresses that have signed
        uint256 createdAt;       // First seal timestamp
        uint256 lastSignedAt;    // Most recent signature timestamp
        bytes metadata;          // Optional metadata (encrypted)
        bool isFinalized;        // Whether document is finalized
    }

    function sealDocument(
        bytes32 documentHash,
        bytes calldata metadata,
        bytes32 messageHash,
        bytes calldata biometricSignature
    ) external returns (bool);

    function addSigner(
        bytes32 documentHash,
        bytes32 messageHash,
        bytes calldata biometricSignature
    ) external returns (bool);

    function finalizeDocument(bytes32 documentHash) external;
    function verifyDocument(bytes32 documentHash) external view returns (bool exists, uint256 signerCount);
    function getDocumentSigners(bytes32 documentHash) external view returns (address[] memory);
    function getDocument(bytes32 documentHash) external view returns (DocumentRecord memory);

    event DocumentSealed(
        bytes32 indexed documentHash,
        address indexed signer,
        uint256 timestamp
    );
    event DocumentSigned(
        bytes32 indexed documentHash,
        address indexed signer,
        uint256 signerIndex
    );
    event DocumentFinalized(bytes32 indexed documentHash, uint256 totalSigners);
}
```

### 1.4 Contract Size Summary

| Contract | Estimated Lines | Complexity | Dependencies |
|----------|-----------------|------------|--------------|
| BiometricRegistry | ~200 | Medium | Ownable, Pausable, ACP-204 |
| CredentialVerifier | ~300 | High | AccessControl, eERC (optional) |
| RWAGateway | ~500 | High | ReentrancyGuard, AccessControl, Pausable |
| RWAToken | ~150 | Medium | ERC20, ERC20Burnable, Pausable |
| DocumentSeal | ~200 | Medium | Ownable, BiometricRegistry |
| MockUSDC | ~50 | Low | ERC20 |
| **Total** | **~1,400** | | |

---

## 2. BiometricRegistry Contract

### 2.1 Purpose

The BiometricRegistry contract serves as the identity foundation layer, storing WebAuthn/Passkey public keys on-chain and verifying biometric signatures using Avalanche's ACP-204 precompile.

### 2.2 State Variables

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract BiometricRegistry is IBiometricRegistry, Ownable, Pausable {

    // ═══════════════════════════════════════════════════════════════════
    // CONSTANTS
    // ═══════════════════════════════════════════════════════════════════

    /// @notice ACP-204 precompile address for secp256r1 verification
    address public constant P256_VERIFIER = 0x0000000000000000000000000000000000000100;

    /// @notice Maximum authentication counter to prevent overflow
    uint256 public constant MAX_AUTH_COUNTER = type(uint256).max - 1000;

    // ═══════════════════════════════════════════════════════════════════
    // STATE VARIABLES
    // ═══════════════════════════════════════════════════════════════════

    /// @notice Mapping from user address to their biometric identity
    mapping(address => BiometricIdentity) private _identities;

    /// @notice Mapping from public key hash to address (reverse lookup)
    /// @dev Key is keccak256(abi.encodePacked(publicKeyX, publicKeyY))
    mapping(bytes32 => address) private _publicKeyToAddress;

    /// @notice Total number of registered identities
    uint256 public registrationCount;

    /// @notice Addresses authorized to register on behalf of users (relayers)
    mapping(address => bool) public trustedRelayers;

    /// @notice Nonce for each user to prevent replay attacks
    mapping(address => uint256) public nonces;

    /// @notice Whether the precompile has been verified to work
    bool public precompileVerified;
}
```

### 2.3 Structs

```solidity
/// @notice Represents a user's biometric identity
/// @dev Stored compactly - total 4 storage slots
struct BiometricIdentity {
    bytes32 publicKeyX;      // Slot 1: secp256r1 public key X coordinate
    bytes32 publicKeyY;      // Slot 2: secp256r1 public key Y coordinate
    uint256 registeredAt;    // Slot 3: Block timestamp of registration
    bool isActive;           // Slot 4 (packed): Whether identity is active
    bytes32 credentialId;    // Slot 4 (packed): WebAuthn credential ID
    uint256 authCounter;     // Slot 5: Replay prevention counter
}

/// @notice Parameters for registration via relayer
struct RegistrationParams {
    address user;
    bytes32 publicKeyX;
    bytes32 publicKeyY;
    bytes32 credentialId;
    uint256 deadline;
    bytes signature;
}
```

### 2.4 Function Specifications

```solidity
// ═══════════════════════════════════════════════════════════════════
// REGISTRATION FUNCTIONS
// ═══════════════════════════════════════════════════════════════════

/// @notice Register a new biometric identity
/// @dev User calls directly or relayer calls on their behalf
/// @param publicKeyX The X coordinate of the secp256r1 public key
/// @param publicKeyY The Y coordinate of the secp256r1 public key
/// @param credentialId The WebAuthn credential identifier
/// @return success Whether registration was successful
/// @custom:security Non-reentrant, checks for existing registration
/// @custom:gas ~120,000 gas
function register(
    bytes32 publicKeyX,
    bytes32 publicKeyY,
    bytes32 credentialId
) external whenNotPaused returns (bool success) {
    address user = msg.sender;

    // Checks
    require(publicKeyX != bytes32(0) && publicKeyY != bytes32(0), "Invalid public key");
    require(!_identities[user].isActive, "Already registered");

    bytes32 keyHash = keccak256(abi.encodePacked(publicKeyX, publicKeyY));
    require(_publicKeyToAddress[keyHash] == address(0), "Public key already registered");

    // Effects
    _identities[user] = BiometricIdentity({
        publicKeyX: publicKeyX,
        publicKeyY: publicKeyY,
        registeredAt: block.timestamp,
        isActive: true,
        credentialId: credentialId,
        authCounter: 0
    });

    _publicKeyToAddress[keyHash] = user;
    unchecked { registrationCount++; }

    emit IdentityRegistered(user, credentialId, block.timestamp);
    return true;
}

/// @notice Register via trusted relayer (meta-transaction)
/// @dev Relayer pays gas, user signs registration params
/// @param params The registration parameters signed by user
/// @return success Whether registration was successful
/// @custom:security Only trusted relayers, signature verification
/// @custom:gas ~135,000 gas
function registerViaRelayer(
    RegistrationParams calldata params
) external whenNotPaused returns (bool success) {
    require(trustedRelayers[msg.sender], "Not authorized relayer");
    require(block.timestamp <= params.deadline, "Registration expired");

    // Verify user signed the registration intent
    bytes32 structHash = keccak256(abi.encode(
        keccak256("Registration(address user,bytes32 publicKeyX,bytes32 publicKeyY,bytes32 credentialId,uint256 deadline,uint256 nonce)"),
        params.user,
        params.publicKeyX,
        params.publicKeyY,
        params.credentialId,
        params.deadline,
        nonces[params.user]++
    ));

    // Note: Initial registration uses traditional ECDSA since user doesn't have
    // biometric registered yet. Subsequent actions use biometric verification.
    address signer = _recoverSigner(structHash, params.signature);
    require(signer == params.user, "Invalid signature");

    // Proceed with registration logic (same as register())
    // ... [condensed for brevity]

    return true;
}

// ═══════════════════════════════════════════════════════════════════
// VERIFICATION FUNCTIONS
// ═══════════════════════════════════════════════════════════════════

/// @notice Verify a biometric signature for a user
/// @dev Updates auth counter on success, reverts on failure
/// @param user The address of the user to verify
/// @param messageHash The hash of the message that was signed
/// @param signature The DER-encoded secp256r1 signature (r || s)
/// @return valid Whether the signature is valid
/// @custom:security Increments counter to prevent replay
/// @custom:gas ~50,000 gas (using precompile)
function verify(
    address user,
    bytes32 messageHash,
    bytes calldata signature
) external whenNotPaused returns (bool valid) {
    BiometricIdentity storage identity = _identities[user];

    // Checks
    require(identity.isActive, "Identity not registered");
    require(signature.length == 64, "Invalid signature length");
    require(identity.authCounter < MAX_AUTH_COUNTER, "Counter overflow");

    // Extract r, s from signature
    bytes32 r;
    bytes32 s;
    assembly {
        r := calldataload(signature.offset)
        s := calldataload(add(signature.offset, 32))
    }

    // Verify via ACP-204 precompile
    bool isValid = _verifyP256(
        messageHash,
        r,
        s,
        identity.publicKeyX,
        identity.publicKeyY
    );

    if (isValid) {
        // Effects - increment counter to prevent replay
        unchecked { identity.authCounter++; }
        emit VerificationSuccess(user, identity.authCounter);
        return true;
    } else {
        emit VerificationFailed(user, "Invalid signature");
        return false;
    }
}

/// @notice Verify signature without state changes (view function)
/// @dev Used for off-chain verification checks
/// @param user The address of the user to verify
/// @param messageHash The hash of the message that was signed
/// @param r The r component of the signature
/// @param s The s component of the signature
/// @return valid Whether the signature is valid
/// @custom:gas ~3,450 gas (precompile cost only)
function verifyViaPrecompile(
    address user,
    bytes32 messageHash,
    bytes32 r,
    bytes32 s
) external view returns (bool valid) {
    BiometricIdentity storage identity = _identities[user];
    require(identity.isActive, "Identity not registered");

    return _verifyP256(
        messageHash,
        r,
        s,
        identity.publicKeyX,
        identity.publicKeyY
    );
}

// ═══════════════════════════════════════════════════════════════════
// INTERNAL FUNCTIONS
// ═══════════════════════════════════════════════════════════════════

/// @notice Internal function to call ACP-204 precompile
/// @dev Precompile at 0x0100 verifies secp256r1 (P-256) signatures
/// @param messageHash The message hash
/// @param r Signature r component
/// @param s Signature s component
/// @param publicKeyX Public key X coordinate
/// @param publicKeyY Public key Y coordinate
/// @return valid Whether signature is valid
function _verifyP256(
    bytes32 messageHash,
    bytes32 r,
    bytes32 s,
    bytes32 publicKeyX,
    bytes32 publicKeyY
) internal view returns (bool valid) {
    // Encode call data for precompile
    // Format: messageHash (32) || r (32) || s (32) || x (32) || y (32)
    bytes memory input = abi.encodePacked(
        messageHash,
        r,
        s,
        publicKeyX,
        publicKeyY
    );

    // Call precompile
    (bool success, bytes memory result) = P256_VERIFIER.staticcall(input);

    // Precompile returns 1 for valid, 0 for invalid
    if (success && result.length == 32) {
        return abi.decode(result, (uint256)) == 1;
    }
    return false;
}

// ═══════════════════════════════════════════════════════════════════
// MANAGEMENT FUNCTIONS
// ═══════════════════════════════════════════════════════════════════

/// @notice Revoke a user's biometric identity
/// @dev Can be called by user or admin
/// @param user The address to revoke
/// @custom:access User can revoke self, owner can revoke anyone
function revoke(address user) external {
    require(
        msg.sender == user || msg.sender == owner(),
        "Not authorized"
    );
    require(_identities[user].isActive, "Not registered");

    BiometricIdentity storage identity = _identities[user];

    // Clear reverse lookup
    bytes32 keyHash = keccak256(abi.encodePacked(
        identity.publicKeyX,
        identity.publicKeyY
    ));
    delete _publicKeyToAddress[keyHash];

    // Deactivate identity
    identity.isActive = false;

    emit IdentityRevoked(user, block.timestamp);
}

/// @notice Add or remove trusted relayer
/// @param relayer The relayer address
/// @param trusted Whether to trust or untrust
/// @custom:access Owner only
function setTrustedRelayer(address relayer, bool trusted) external onlyOwner {
    trustedRelayers[relayer] = trusted;
    emit RelayerUpdated(relayer, trusted);
}

/// @notice Verify precompile is working (call once after deployment)
/// @dev Uses known test vector to verify ACP-204 is available
/// @custom:access Owner only
function verifyPrecompileWorks() external onlyOwner {
    // Test vector for P-256 verification
    // These are known-good values that should verify
    bytes32 testHash = 0x9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08;
    bytes32 testR = 0x...; // Known test R value
    bytes32 testS = 0x...; // Known test S value
    bytes32 testX = 0x...; // Known test public key X
    bytes32 testY = 0x...; // Known test public key Y

    bool works = _verifyP256(testHash, testR, testS, testX, testY);
    require(works, "Precompile verification failed");
    precompileVerified = true;
}
```

### 2.5 Events

```solidity
/// @notice Emitted when a new identity is registered
event IdentityRegistered(
    address indexed user,
    bytes32 indexed credentialId,
    uint256 timestamp
);

/// @notice Emitted when an identity is revoked
event IdentityRevoked(
    address indexed user,
    uint256 timestamp
);

/// @notice Emitted on successful biometric verification
event VerificationSuccess(
    address indexed user,
    uint256 authCounter
);

/// @notice Emitted on failed biometric verification
event VerificationFailed(
    address indexed user,
    string reason
);

/// @notice Emitted when relayer trust status changes
event RelayerUpdated(
    address indexed relayer,
    bool trusted
);
```

### 2.6 Access Control Matrix

| Function | Owner | User (self) | User (other) | Relayer | Anyone |
|----------|-------|-------------|--------------|---------|--------|
| register | - | X | - | - | - |
| registerViaRelayer | - | - | - | X | - |
| verify | - | - | - | - | X |
| verifyViaPrecompile | - | - | - | - | X |
| revoke | X | X | - | - | - |
| setTrustedRelayer | X | - | - | - | - |
| pause/unpause | X | - | - | - | - |
| isRegistered | - | - | - | - | X (view) |
| getIdentity | - | - | - | - | X (view) |

### 2.7 Security Considerations

| Risk | Mitigation |
|------|------------|
| **Replay Attack** | Auth counter incremented on each verification |
| **Front-running** | Signature includes user address and nonce |
| **Key Reuse** | Public key can only be registered to one address |
| **Precompile Failure** | `precompileVerified` check, fallback to revert |
| **Counter Overflow** | MAX_AUTH_COUNTER check before increment |
| **Denial of Service** | Rate limiting in relayer, pausable |

### 2.8 ACP-204 Precompile Integration Details

```
┌─────────────────────────────────────────────────────────────────────┐
│                    ACP-204 Precompile Specification                  │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  Address: 0x0000000000000000000000000000000000000100                 │
│                                                                      │
│  Input Format (160 bytes):                                          │
│  ┌──────────────┬──────────────┬──────────────┬──────────────┬──────────────┐
│  │ messageHash  │      r       │      s       │   publicKeyX │   publicKeyY │
│  │   32 bytes   │   32 bytes   │   32 bytes   │   32 bytes   │   32 bytes   │
│  └──────────────┴──────────────┴──────────────┴──────────────┴──────────────┘
│                                                                      │
│  Output Format (32 bytes):                                          │
│  ┌──────────────────────────────────────────────────────────────────┐
│  │  0x0000...0001 (valid) or 0x0000...0000 (invalid)                │
│  └──────────────────────────────────────────────────────────────────┘
│                                                                      │
│  Gas Cost: ~3,450 gas (vs ~250,000 for Solidity implementation)     │
│                                                                      │
│  Error Handling:                                                     │
│  - Returns (false, empty) if precompile not available               │
│  - Returns (true, 0x00) if signature invalid                        │
│  - Returns (true, 0x01) if signature valid                          │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 3. CredentialVerifier Contract

### 3.1 Purpose

The CredentialVerifier contract manages compliance credentials, allowing trusted verifiers to issue on-chain attestations of investor accreditation status, jurisdiction, and tier. Optionally integrates with eERC for encrypted credential storage.

### 3.2 State Variables

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/AccessControl.sol";

contract CredentialVerifier is ICredentialVerifier, AccessControl {

    // ═══════════════════════════════════════════════════════════════════
    // CONSTANTS & ROLES
    // ═══════════════════════════════════════════════════════════════════

    bytes32 public constant VERIFIER_ROLE = keccak256("VERIFIER_ROLE");
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");

    /// @notice Default credential validity period (1 year)
    uint256 public constant DEFAULT_VALIDITY_PERIOD = 365 days;

    /// @notice Maximum validity period (5 years)
    uint256 public constant MAX_VALIDITY_PERIOD = 5 * 365 days;

    // ═══════════════════════════════════════════════════════════════════
    // STATE VARIABLES
    // ═══════════════════════════════════════════════════════════════════

    /// @notice Mapping from user address to their credential
    mapping(address => Credential) private _credentials;

    /// @notice Mapping of trusted verifier addresses
    mapping(address => bool) public trustedVerifiers;

    /// @notice Mapping of verifier to their issued credential count
    mapping(address => uint256) public verifierIssuanceCount;

    /// @notice Mapping of supported credential types
    mapping(CredentialType => bool) public supportedCredentialTypes;

    /// @notice Mapping of blocked jurisdictions (e.g., sanctioned countries)
    mapping(bytes2 => bool) public blockedJurisdictions;

    /// @notice Reference to BiometricRegistry for identity verification
    IBiometricRegistry public biometricRegistry;

    /// @notice Total credentials issued
    uint256 public totalCredentialsIssued;

    /// @notice Total active credentials
    uint256 public activeCredentialCount;

    /// @notice Whether eERC encryption is enabled
    bool public encryptionEnabled;
}
```

### 3.3 Credential Struct and Types

```solidity
/// @notice Credential type enumeration
/// @dev Ordered by investment capacity (higher = more access)
enum CredentialType {
    NONE,           // 0: No credential (default)
    ACCREDITED,     // 1: SEC accredited investor ($200K+ income or $1M+ net worth)
    QUALIFIED,      // 2: Qualified purchaser ($5M+ investments)
    INSTITUTIONAL,  // 3: Institutional investor (banks, funds, etc.)
    RETAIL          // 4: Retail/non-accredited (limited access)
}

/// @notice Investment tier levels
/// @dev Determines maximum investment amounts
/// Tier 1: Up to $10,000
/// Tier 2: Up to $50,000
/// Tier 3: Up to $100,000
/// Tier 4: Up to $500,000
/// Tier 5: Unlimited

/// @notice Credential data structure
/// @dev Optimized for storage efficiency (3 slots)
struct Credential {
    CredentialType credentialType;   // Slot 1 (packed): 1 byte
    bytes2 jurisdiction;              // Slot 1 (packed): 2 bytes
    uint8 tier;                       // Slot 1 (packed): 1 byte
    uint256 issuedAt;                 // Slot 2: 32 bytes
    uint256 expiresAt;                // Slot 3: 32 bytes
    address issuer;                   // Slot 4 (packed): 20 bytes
    bool isActive;                    // Slot 4 (packed): 1 byte
    bytes encryptedData;              // Slot 5+: dynamic (eERC payload)
}

/// @notice Verification result structure (used internally)
struct VerificationResult {
    bool isValid;
    string reason;
    CredentialType actualType;
    bytes2 actualJurisdiction;
    uint8 actualTier;
}
```

### 3.4 Function Specifications

```solidity
// ═══════════════════════════════════════════════════════════════════
// CREDENTIAL ISSUANCE
// ═══════════════════════════════════════════════════════════════════

/// @notice Issue a credential to a user
/// @dev Only callable by trusted verifiers
/// @param user The address to issue credential to
/// @param credentialType The type of credential (accredited, qualified, etc.)
/// @param jurisdiction ISO 3166-1 alpha-2 country code
/// @param tier Investment tier (1-5)
/// @param validityPeriod How long credential is valid (in seconds)
/// @param encryptedData Optional eERC encrypted payload
/// @return success Whether issuance was successful
/// @custom:access VERIFIER_ROLE only
/// @custom:gas ~95,000 gas
function issueCredential(
    address user,
    CredentialType credentialType,
    bytes2 jurisdiction,
    uint8 tier,
    uint256 validityPeriod,
    bytes calldata encryptedData
) external onlyRole(VERIFIER_ROLE) returns (bool success) {
    // Checks
    require(user != address(0), "Invalid user address");
    require(credentialType != CredentialType.NONE, "Invalid credential type");
    require(supportedCredentialTypes[credentialType], "Unsupported credential type");
    require(!blockedJurisdictions[jurisdiction], "Blocked jurisdiction");
    require(tier >= 1 && tier <= 5, "Invalid tier");
    require(
        validityPeriod > 0 && validityPeriod <= MAX_VALIDITY_PERIOD,
        "Invalid validity period"
    );

    // Check user has registered biometric identity
    require(
        biometricRegistry.isRegistered(user),
        "User must have biometric identity"
    );

    // If user already has credential, check if we can overwrite
    Credential storage existing = _credentials[user];
    if (existing.isActive) {
        require(
            existing.expiresAt < block.timestamp ||
            hasRole(ADMIN_ROLE, msg.sender),
            "Active credential exists"
        );
        unchecked { activeCredentialCount--; }
    }

    // Effects
    uint256 expiresAt = block.timestamp + validityPeriod;

    _credentials[user] = Credential({
        credentialType: credentialType,
        jurisdiction: jurisdiction,
        tier: tier,
        issuedAt: block.timestamp,
        expiresAt: expiresAt,
        issuer: msg.sender,
        isActive: true,
        encryptedData: encryptedData
    });

    unchecked {
        totalCredentialsIssued++;
        activeCredentialCount++;
        verifierIssuanceCount[msg.sender]++;
    }

    emit CredentialIssued(user, credentialType, jurisdiction, tier, expiresAt);
    return true;
}

// ═══════════════════════════════════════════════════════════════════
// CREDENTIAL VERIFICATION
// ═══════════════════════════════════════════════════════════════════

/// @notice Verify a user meets credential requirements
/// @dev Called by RWAGateway during investment/redemption
/// @param user The address to verify
/// @param requiredType Minimum credential type required
/// @param allowedJurisdictions Array of allowed jurisdiction codes
/// @param requiredTier Minimum tier required
/// @return valid Whether user meets all requirements
/// @custom:gas ~8,000 gas (view function)
function verifyCredential(
    address user,
    CredentialType requiredType,
    bytes2[] calldata allowedJurisdictions,
    uint8 requiredTier
) external view returns (bool valid) {
    Credential storage credential = _credentials[user];

    // Check credential exists and is active
    if (!credential.isActive) {
        return false;
    }

    // Check not expired
    if (block.timestamp > credential.expiresAt) {
        return false;
    }

    // Check credential type meets requirement
    // Special case: INSTITUTIONAL can access anything
    // QUALIFIED can access ACCREDITED pools
    // ACCREDITED cannot access QUALIFIED or INSTITUTIONAL pools
    if (credential.credentialType != CredentialType.INSTITUTIONAL) {
        if (uint8(credential.credentialType) < uint8(requiredType)) {
            return false;
        }
    }

    // Check jurisdiction is allowed
    if (allowedJurisdictions.length > 0) {
        bool jurisdictionAllowed = false;
        for (uint256 i = 0; i < allowedJurisdictions.length; i++) {
            if (credential.jurisdiction == allowedJurisdictions[i]) {
                jurisdictionAllowed = true;
                break;
            }
        }
        if (!jurisdictionAllowed) {
            return false;
        }
    }

    // Check tier meets requirement
    if (credential.tier < requiredTier) {
        return false;
    }

    return true;
}

/// @notice Detailed verification with reason (for debugging/UI)
/// @param user The address to verify
/// @param requiredType Minimum credential type required
/// @param allowedJurisdictions Array of allowed jurisdiction codes
/// @param requiredTier Minimum tier required
/// @return result Detailed verification result
function verifyCredentialDetailed(
    address user,
    CredentialType requiredType,
    bytes2[] calldata allowedJurisdictions,
    uint8 requiredTier
) external view returns (VerificationResult memory result) {
    Credential storage credential = _credentials[user];

    result.actualType = credential.credentialType;
    result.actualJurisdiction = credential.jurisdiction;
    result.actualTier = credential.tier;

    if (!credential.isActive) {
        result.isValid = false;
        result.reason = "No active credential";
        return result;
    }

    if (block.timestamp > credential.expiresAt) {
        result.isValid = false;
        result.reason = "Credential expired";
        return result;
    }

    // ... additional checks with specific reasons

    result.isValid = true;
    result.reason = "Verification passed";
    return result;
}

// ═══════════════════════════════════════════════════════════════════
// CREDENTIAL MANAGEMENT
// ═══════════════════════════════════════════════════════════════════

/// @notice Revoke a user's credential
/// @dev Can be called by issuer or admin
/// @param user The address whose credential to revoke
/// @custom:access Issuer of credential or ADMIN_ROLE
function revokeCredential(address user) external {
    Credential storage credential = _credentials[user];
    require(credential.isActive, "No active credential");
    require(
        credential.issuer == msg.sender || hasRole(ADMIN_ROLE, msg.sender),
        "Not authorized to revoke"
    );

    credential.isActive = false;
    unchecked { activeCredentialCount--; }

    emit CredentialRevoked(user, msg.sender);
}

/// @notice Get credential for a user
/// @param user The address to query
/// @return credential The user's credential (or default if none)
function getCredential(address user) external view returns (Credential memory) {
    return _credentials[user];
}

/// @notice Check if credential is expired
/// @param user The address to check
/// @return expired Whether credential has expired
function isExpired(address user) external view returns (bool expired) {
    Credential storage credential = _credentials[user];
    if (!credential.isActive) return true;
    return block.timestamp > credential.expiresAt;
}

// ═══════════════════════════════════════════════════════════════════
// ADMIN FUNCTIONS
// ═══════════════════════════════════════════════════════════════════

/// @notice Add trusted verifier
/// @param verifier The address to trust
/// @custom:access ADMIN_ROLE only
function addVerifier(address verifier) external onlyRole(ADMIN_ROLE) {
    require(verifier != address(0), "Invalid verifier");
    _grantRole(VERIFIER_ROLE, verifier);
    trustedVerifiers[verifier] = true;
    emit VerifierAdded(verifier);
}

/// @notice Remove trusted verifier
/// @param verifier The address to remove
/// @custom:access ADMIN_ROLE only
function removeVerifier(address verifier) external onlyRole(ADMIN_ROLE) {
    _revokeRole(VERIFIER_ROLE, verifier);
    trustedVerifiers[verifier] = false;
    emit VerifierRemoved(verifier);
}

/// @notice Block a jurisdiction
/// @param jurisdiction ISO 3166-1 alpha-2 code to block
/// @custom:access ADMIN_ROLE only
function blockJurisdiction(bytes2 jurisdiction) external onlyRole(ADMIN_ROLE) {
    blockedJurisdictions[jurisdiction] = true;
    emit JurisdictionBlocked(jurisdiction);
}

/// @notice Unblock a jurisdiction
/// @param jurisdiction ISO 3166-1 alpha-2 code to unblock
/// @custom:access ADMIN_ROLE only
function unblockJurisdiction(bytes2 jurisdiction) external onlyRole(ADMIN_ROLE) {
    blockedJurisdictions[jurisdiction] = false;
    emit JurisdictionUnblocked(jurisdiction);
}

/// @notice Enable/disable credential type
/// @param credentialType The type to enable/disable
/// @param supported Whether to support this type
/// @custom:access ADMIN_ROLE only
function setCredentialTypeSupported(
    CredentialType credentialType,
    bool supported
) external onlyRole(ADMIN_ROLE) {
    supportedCredentialTypes[credentialType] = supported;
}

/// @notice Set BiometricRegistry reference
/// @param _biometricRegistry The registry address
/// @custom:access ADMIN_ROLE only
function setBiometricRegistry(
    address _biometricRegistry
) external onlyRole(ADMIN_ROLE) {
    require(_biometricRegistry != address(0), "Invalid address");
    biometricRegistry = IBiometricRegistry(_biometricRegistry);
}
```

### 3.5 eERC Encryption Integration

```solidity
// ═══════════════════════════════════════════════════════════════════
// eERC ENCRYPTION (OPTIONAL - EXPERIMENTAL)
// ═══════════════════════════════════════════════════════════════════

/// @notice Enable encryption for credential data
/// @dev Requires eERC framework to be available on Avalanche
/// @custom:access ADMIN_ROLE only
/// @custom:experimental Feature may not be available
function enableEncryption() external onlyRole(ADMIN_ROLE) {
    // Verify eERC is available
    // This would check for the eERC contract/precompile
    encryptionEnabled = true;
    emit EncryptionEnabled();
}

/// @notice Decrypt credential data (for authorized contracts only)
/// @dev Called internally by RWAGateway during verification
/// @param user The user whose data to decrypt
/// @return decrypted The decrypted credential data
/// @custom:access Internal or authorized contracts only
function _decryptCredentialData(
    address user
) internal view returns (bytes memory decrypted) {
    if (!encryptionEnabled) {
        return _credentials[user].encryptedData;
    }

    // eERC decryption logic would go here
    // This is a placeholder for the actual implementation
    // which depends on Avalanche's eERC specification

    return _credentials[user].encryptedData;
}

/*
┌─────────────────────────────────────────────────────────────────────┐
│                    eERC Integration Architecture                     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  Encryption Flow:                                                    │
│                                                                      │
│  1. Verifier prepares credential data:                              │
│     {                                                                │
│       credentialType: 1,                                            │
│       jurisdiction: "US",                                           │
│       tier: 2,                                                      │
│       additionalData: { ... }                                       │
│     }                                                                │
│                                                                      │
│  2. Off-chain encryption:                                           │
│     encryptedData = eERC.encrypt(                                   │
│       plaintext,                                                    │
│       userPublicKey,                                                │
│       contractKey                                                   │
│     )                                                                │
│                                                                      │
│  3. On-chain storage:                                               │
│     credential.encryptedData = encryptedData                        │
│     (Observers see only encrypted blob)                             │
│                                                                      │
│  4. Verification (on-chain):                                        │
│     - Contract decrypts internally                                  │
│     - Returns boolean only                                          │
│     - No plaintext ever exposed                                     │
│                                                                      │
│  Fallback (if eERC unavailable):                                    │
│  - Store credential type, jurisdiction, tier in plaintext           │
│  - Skip encryptedData field                                         │
│  - System remains functional, just less private                     │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
*/
```

### 3.6 Events

```solidity
event CredentialIssued(
    address indexed user,
    CredentialType indexed credentialType,
    bytes2 jurisdiction,
    uint8 tier,
    uint256 expiresAt
);

event CredentialRevoked(
    address indexed user,
    address indexed revoker
);

event CredentialExpired(
    address indexed user
);

event VerifierAdded(address indexed verifier);
event VerifierRemoved(address indexed verifier);
event JurisdictionBlocked(bytes2 indexed jurisdiction);
event JurisdictionUnblocked(bytes2 indexed jurisdiction);
event EncryptionEnabled();
```

---

## 4. RWAGateway Contract

### 4.1 Purpose

The RWAGateway contract is the central hub for RWA pool management, handling pool creation, investment processing, redemption, and yield distribution. It integrates with BiometricRegistry for authentication and CredentialVerifier for compliance.

### 4.2 State Variables

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract RWAGateway is IRWAGateway, AccessControl, Pausable, ReentrancyGuard {

    // ═══════════════════════════════════════════════════════════════════
    // CONSTANTS & ROLES
    // ═══════════════════════════════════════════════════════════════════

    bytes32 public constant POOL_ADMIN_ROLE = keccak256("POOL_ADMIN_ROLE");
    bytes32 public constant YIELD_DISTRIBUTOR_ROLE = keccak256("YIELD_DISTRIBUTOR_ROLE");

    /// @notice Maximum pools that can be created
    uint256 public constant MAX_POOLS = 1000;

    /// @notice Maximum yield rate (100% = 10000 bps)
    uint16 public constant MAX_YIELD_RATE_BPS = 10000;

    /// @notice Minimum investment period before redemption (7 days)
    uint256 public constant MIN_LOCK_PERIOD = 7 days;

    /// @notice Basis points denominator
    uint256 public constant BPS_DENOMINATOR = 10000;

    // ═══════════════════════════════════════════════════════════════════
    // STATE VARIABLES
    // ═══════════════════════════════════════════════════════════════════

    /// @notice Mapping of pool ID to pool data
    mapping(uint256 => AssetPool) private _pools;

    /// @notice Mapping of pool ID to user address to investment amount
    mapping(uint256 => mapping(address => uint256)) private _userInvestments;

    /// @notice Mapping of pool ID to user address to investment timestamp
    mapping(uint256 => mapping(address => uint256)) private _investmentTimestamps;

    /// @notice Total number of pools created
    uint256 public poolCount;

    /// @notice Reference to BiometricRegistry
    IBiometricRegistry public biometricRegistry;

    /// @notice Reference to CredentialVerifier
    ICredentialVerifier public credentialVerifier;

    /// @notice Fee recipient address
    address public feeRecipient;

    /// @notice Platform fee in basis points (default 50 = 0.5%)
    uint16 public platformFeeBps;

    /// @notice RWAToken implementation for cloning
    address public rwaTokenImplementation;

    /// @notice Mapping of RWA token address to pool ID
    mapping(address => uint256) public tokenToPoolId;
}
```

### 4.3 AssetPool Struct

```solidity
/// @notice Complete pool configuration and state
/// @dev Uses ~6 storage slots
struct AssetPool {
    // Slot 1: Identifiers
    string name;                    // Pool display name

    // Slot 2-3: Token addresses
    address rwaToken;               // RWA token contract address
    address depositToken;           // USDC or other stablecoin

    // Slot 4-5: Amounts
    uint256 totalDeposited;         // Total stablecoin deposited
    uint256 totalShares;            // Total RWA tokens minted

    // Slot 6: Configuration (packed)
    uint16 yieldRateBps;            // Yield rate in basis points
    uint256 minInvestment;          // Minimum investment amount
    uint256 maxInvestment;          // Maximum per-user investment

    // Slot 7: Compliance requirements
    ICredentialVerifier.CredentialType requiredCredentialType;
    bytes2[] allowedJurisdictions;
    uint8 requiredTier;

    // Slot 8: Status (packed)
    bool isActive;                  // Pool accepting investments
    uint256 createdAt;              // Pool creation timestamp
    uint256 lastYieldDistribution;  // Last yield distribution timestamp
}

/// @notice Parameters for pool creation
struct CreatePoolParams {
    string name;
    address depositToken;
    uint16 yieldRateBps;
    uint256 minInvestment;
    uint256 maxInvestment;
    ICredentialVerifier.CredentialType requiredCredentialType;
    bytes2[] allowedJurisdictions;
    uint8 requiredTier;
}
```

### 4.4 Function Specifications

```solidity
// ═══════════════════════════════════════════════════════════════════
// POOL MANAGEMENT
// ═══════════════════════════════════════════════════════════════════

/// @notice Create a new asset pool
/// @dev Deploys a new RWAToken contract for the pool
/// @param params Pool creation parameters
/// @return poolId The ID of the newly created pool
/// @return rwaTokenAddress The address of the pool's RWA token
/// @custom:access POOL_ADMIN_ROLE only
/// @custom:gas ~350,000 gas (includes token deployment)
function createPool(
    CreatePoolParams calldata params
) external onlyRole(POOL_ADMIN_ROLE) returns (uint256 poolId, address rwaTokenAddress) {
    // Checks
    require(poolCount < MAX_POOLS, "Max pools reached");
    require(bytes(params.name).length > 0, "Name required");
    require(params.depositToken != address(0), "Invalid deposit token");
    require(params.yieldRateBps <= MAX_YIELD_RATE_BPS, "Yield rate too high");
    require(params.minInvestment > 0, "Min investment must be > 0");
    require(params.maxInvestment >= params.minInvestment, "Max < min investment");
    require(params.requiredTier >= 1 && params.requiredTier <= 5, "Invalid tier");

    // Effects
    poolId = poolCount++;

    // Deploy new RWA token for this pool
    string memory tokenName = string(abi.encodePacked("RWA-", params.name));
    string memory tokenSymbol = string(abi.encodePacked("RWA", _uint2str(poolId)));

    RWAToken newToken = new RWAToken(
        tokenName,
        tokenSymbol,
        address(this),
        address(credentialVerifier)
    );
    rwaTokenAddress = address(newToken);

    // Store pool data
    _pools[poolId] = AssetPool({
        name: params.name,
        rwaToken: rwaTokenAddress,
        depositToken: params.depositToken,
        totalDeposited: 0,
        totalShares: 0,
        yieldRateBps: params.yieldRateBps,
        minInvestment: params.minInvestment,
        maxInvestment: params.maxInvestment,
        requiredCredentialType: params.requiredCredentialType,
        allowedJurisdictions: params.allowedJurisdictions,
        requiredTier: params.requiredTier,
        isActive: true,
        createdAt: block.timestamp,
        lastYieldDistribution: block.timestamp
    });

    tokenToPoolId[rwaTokenAddress] = poolId;

    emit PoolCreated(poolId, params.name, rwaTokenAddress, params.depositToken);
    return (poolId, rwaTokenAddress);
}

// ═══════════════════════════════════════════════════════════════════
// INVESTMENT FUNCTIONS
// ═══════════════════════════════════════════════════════════════════

/// @notice Invest in a pool
/// @dev Requires biometric verification and credential check
/// @param poolId The pool to invest in
/// @param amount Amount of deposit tokens to invest
/// @param messageHash Hash of the investment intent message
/// @param biometricSignature Biometric signature of messageHash
/// @return sharesMinted Number of RWA tokens minted
/// @custom:security ReentrancyGuard, biometric verification, credential check
/// @custom:gas ~180,000 gas
function invest(
    uint256 poolId,
    uint256 amount,
    bytes32 messageHash,
    bytes calldata biometricSignature
) external nonReentrant whenNotPaused returns (uint256 sharesMinted) {
    AssetPool storage pool = _pools[poolId];
    address investor = msg.sender;

    // ═══════════════════════════════════════════════════════════════
    // CHECKS
    // ═══════════════════════════════════════════════════════════════

    // Pool checks
    require(pool.isActive, "Pool not active");
    require(pool.rwaToken != address(0), "Pool does not exist");

    // Amount checks
    require(amount >= pool.minInvestment, "Below minimum investment");
    uint256 newTotal = _userInvestments[poolId][investor] + amount;
    require(newTotal <= pool.maxInvestment, "Exceeds maximum investment");

    // Biometric verification
    require(
        biometricRegistry.verify(investor, messageHash, biometricSignature),
        "Biometric verification failed"
    );

    // Credential verification
    require(
        credentialVerifier.verifyCredential(
            investor,
            pool.requiredCredentialType,
            pool.allowedJurisdictions,
            pool.requiredTier
        ),
        "Credential verification failed"
    );

    // ═══════════════════════════════════════════════════════════════
    // EFFECTS
    // ═══════════════════════════════════════════════════════════════

    // Calculate shares (1:1 for simplicity, could add share price logic)
    sharesMinted = amount;

    // Update pool state
    pool.totalDeposited += amount;
    pool.totalShares += sharesMinted;

    // Update user state
    _userInvestments[poolId][investor] = newTotal;
    _investmentTimestamps[poolId][investor] = block.timestamp;

    // ═══════════════════════════════════════════════════════════════
    // INTERACTIONS
    // ═══════════════════════════════════════════════════════════════

    // Transfer deposit tokens from user to gateway
    IERC20(pool.depositToken).safeTransferFrom(
        investor,
        address(this),
        amount
    );

    // Mint RWA tokens to user
    IRWAToken(pool.rwaToken).mint(investor, sharesMinted);

    emit Investment(poolId, investor, amount, sharesMinted);
    return sharesMinted;
}

/// @notice Invest via relayer (meta-transaction)
/// @dev Same logic as invest() but relayer pays gas
/// @param investor The actual investor address
/// @param poolId The pool to invest in
/// @param amount Amount to invest
/// @param deadline Transaction deadline
/// @param messageHash Signed message hash
/// @param biometricSignature Biometric signature
/// @return sharesMinted Number of RWA tokens minted
function investViaRelayer(
    address investor,
    uint256 poolId,
    uint256 amount,
    uint256 deadline,
    bytes32 messageHash,
    bytes calldata biometricSignature
) external nonReentrant whenNotPaused returns (uint256 sharesMinted) {
    require(block.timestamp <= deadline, "Transaction expired");

    // Verify message hash matches expected structure
    bytes32 expectedHash = keccak256(abi.encode(
        keccak256("Invest(address investor,uint256 poolId,uint256 amount,uint256 deadline)"),
        investor,
        poolId,
        amount,
        deadline
    ));
    require(messageHash == expectedHash, "Invalid message hash");

    // Rest of logic is same as invest() but with investor instead of msg.sender
    // ... [implementation similar to invest()]

    return sharesMinted;
}

// ═══════════════════════════════════════════════════════════════════
// REDEMPTION FUNCTIONS
// ═══════════════════════════════════════════════════════════════════

/// @notice Redeem RWA tokens for underlying deposit tokens
/// @dev Requires biometric verification and lock period check
/// @param poolId The pool to redeem from
/// @param shares Number of RWA tokens to redeem
/// @param messageHash Hash of the redemption intent message
/// @param biometricSignature Biometric signature of messageHash
/// @return amountRedeemed Amount of deposit tokens returned
/// @custom:security ReentrancyGuard, biometric verification, lock period
/// @custom:gas ~150,000 gas
function redeem(
    uint256 poolId,
    uint256 shares,
    bytes32 messageHash,
    bytes calldata biometricSignature
) external nonReentrant whenNotPaused returns (uint256 amountRedeemed) {
    AssetPool storage pool = _pools[poolId];
    address investor = msg.sender;

    // ═══════════════════════════════════════════════════════════════
    // CHECKS
    // ═══════════════════════════════════════════════════════════════

    require(pool.rwaToken != address(0), "Pool does not exist");
    require(shares > 0, "Shares must be > 0");

    // Check user has enough shares
    uint256 userShares = IERC20(pool.rwaToken).balanceOf(investor);
    require(userShares >= shares, "Insufficient shares");

    // Check lock period
    uint256 investedAt = _investmentTimestamps[poolId][investor];
    require(
        block.timestamp >= investedAt + MIN_LOCK_PERIOD,
        "Lock period not elapsed"
    );

    // Biometric verification
    require(
        biometricRegistry.verify(investor, messageHash, biometricSignature),
        "Biometric verification failed"
    );

    // Re-verify credential (may have expired since investment)
    require(
        credentialVerifier.verifyCredential(
            investor,
            pool.requiredCredentialType,
            pool.allowedJurisdictions,
            pool.requiredTier
        ),
        "Credential verification failed"
    );

    // ═══════════════════════════════════════════════════════════════
    // EFFECTS
    // ═══════════════════════════════════════════════════════════════

    // Calculate redemption amount (1:1 for simplicity)
    amountRedeemed = shares;

    // Check pool has sufficient liquidity
    require(pool.totalDeposited >= amountRedeemed, "Insufficient liquidity");

    // Update pool state
    pool.totalDeposited -= amountRedeemed;
    pool.totalShares -= shares;

    // Update user state
    _userInvestments[poolId][investor] -= amountRedeemed;

    // ═══════════════════════════════════════════════════════════════
    // INTERACTIONS
    // ═══════════════════════════════════════════════════════════════

    // Burn RWA tokens
    IRWAToken(pool.rwaToken).burn(investor, shares);

    // Transfer deposit tokens to user
    IERC20(pool.depositToken).safeTransfer(investor, amountRedeemed);

    emit Redemption(poolId, investor, shares, amountRedeemed);
    return amountRedeemed;
}

// ═══════════════════════════════════════════════════════════════════
// YIELD DISTRIBUTION
// ═══════════════════════════════════════════════════════════════════

/// @notice Distribute yield to pool
/// @dev Increases share value or mints additional tokens
/// @param poolId The pool to distribute yield to
/// @param yieldAmount Amount of yield to distribute (in deposit tokens)
/// @custom:access YIELD_DISTRIBUTOR_ROLE only
/// @custom:gas ~100,000 gas
function distributeYield(
    uint256 poolId,
    uint256 yieldAmount
) external onlyRole(YIELD_DISTRIBUTOR_ROLE) nonReentrant {
    AssetPool storage pool = _pools[poolId];
    require(pool.isActive, "Pool not active");
    require(yieldAmount > 0, "Yield must be > 0");

    // Transfer yield from distributor
    IERC20(pool.depositToken).safeTransferFrom(
        msg.sender,
        address(this),
        yieldAmount
    );

    // Add to pool's total deposited (increases share value)
    pool.totalDeposited += yieldAmount;
    pool.lastYieldDistribution = block.timestamp;

    emit YieldDistributed(poolId, yieldAmount, block.timestamp);
}

// ═══════════════════════════════════════════════════════════════════
// VIEW FUNCTIONS
// ═══════════════════════════════════════════════════════════════════

/// @notice Get pool details
/// @param poolId The pool ID to query
/// @return pool The pool data
function getPool(uint256 poolId) external view returns (AssetPool memory pool) {
    return _pools[poolId];
}

/// @notice Get user's investment in a pool
/// @param poolId The pool ID
/// @param user The user address
/// @return amount The invested amount
function getUserInvestment(
    uint256 poolId,
    address user
) external view returns (uint256 amount) {
    return _userInvestments[poolId][user];
}

/// @notice Get current share price (deposit tokens per share)
/// @param poolId The pool ID
/// @return price Share price (scaled by 1e18)
function getSharePrice(uint256 poolId) external view returns (uint256 price) {
    AssetPool storage pool = _pools[poolId];
    if (pool.totalShares == 0) return 1e18;
    return (pool.totalDeposited * 1e18) / pool.totalShares;
}

/// @notice Check if user can invest in pool
/// @param poolId The pool ID
/// @param user The user address
/// @param amount The amount to invest
/// @return canInvest Whether investment is allowed
/// @return reason Reason if not allowed
function canInvest(
    uint256 poolId,
    address user,
    uint256 amount
) external view returns (bool canInvest, string memory reason) {
    AssetPool storage pool = _pools[poolId];

    if (!pool.isActive) return (false, "Pool not active");
    if (amount < pool.minInvestment) return (false, "Below minimum");

    uint256 newTotal = _userInvestments[poolId][user] + amount;
    if (newTotal > pool.maxInvestment) return (false, "Exceeds maximum");

    if (!biometricRegistry.isRegistered(user)) {
        return (false, "No biometric identity");
    }

    if (!credentialVerifier.verifyCredential(
        user,
        pool.requiredCredentialType,
        pool.allowedJurisdictions,
        pool.requiredTier
    )) {
        return (false, "Credential verification failed");
    }

    return (true, "");
}
```

### 4.5 Pool Configuration Options

```
┌─────────────────────────────────────────────────────────────────────┐
│                    Pool Configuration Matrix                         │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  Yield Rate (yieldRateBps):                                         │
│  ├── 0-100 bps (0-1%): Low-risk treasury products                   │
│  ├── 100-500 bps (1-5%): Investment-grade bonds                     │
│  ├── 500-1000 bps (5-10%): Corporate debt, private credit           │
│  └── 1000+ bps (10%+): High-yield, emerging markets                 │
│                                                                      │
│  Credential Types:                                                   │
│  ├── RETAIL (4): Open to all, lowest limits                         │
│  ├── ACCREDITED (1): $200K income or $1M net worth                  │
│  ├── QUALIFIED (2): $5M+ in investments                             │
│  └── INSTITUTIONAL (3): Banks, funds, registered entities           │
│                                                                      │
│  Tier Levels:                                                        │
│  ├── Tier 1: Up to $10,000                                          │
│  ├── Tier 2: Up to $50,000                                          │
│  ├── Tier 3: Up to $100,000                                         │
│  ├── Tier 4: Up to $500,000                                         │
│  └── Tier 5: Unlimited                                              │
│                                                                      │
│  Jurisdiction Codes (ISO 3166-1 alpha-2):                           │
│  ├── "US" - United States                                           │
│  ├── "GB" - United Kingdom                                          │
│  ├── "SG" - Singapore                                               │
│  ├── "EU" - European Union (custom code)                            │
│  ├── "CA" - Canada                                                  │
│  ├── "AU" - Australia                                               │
│  └── Empty array = All jurisdictions allowed                        │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 5. RWAToken Contract

### 5.1 Purpose

RWAToken is an ERC-20 token with built-in transfer restrictions. Every transfer is validated against the CredentialVerifier to ensure both sender and recipient meet compliance requirements.

### 5.2 State Variables

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract RWAToken is ERC20, ERC20Burnable, Pausable, ReentrancyGuard, IRWAToken {

    // ═══════════════════════════════════════════════════════════════════
    // STATE VARIABLES
    // ═══════════════════════════════════════════════════════════════════

    /// @notice The RWAGateway that controls minting/burning
    address public gateway;

    /// @notice Reference to CredentialVerifier for transfer checks
    ICredentialVerifier public credentialVerifier;

    /// @notice Pool ID this token represents
    uint256 public poolId;

    /// @notice Whitelisted addresses (can send/receive without credential check)
    /// @dev Used for DeFi contracts, exchanges, etc.
    mapping(address => bool) private _whitelist;

    /// @notice Whether transfer restrictions are enabled
    bool public restrictionsEnabled;
}
```

### 5.3 Function Specifications

```solidity
// ═══════════════════════════════════════════════════════════════════
// CONSTRUCTOR
// ═══════════════════════════════════════════════════════════════════

constructor(
    string memory name,
    string memory symbol,
    address _gateway,
    address _credentialVerifier
) ERC20(name, symbol) {
    require(_gateway != address(0), "Invalid gateway");
    require(_credentialVerifier != address(0), "Invalid verifier");

    gateway = _gateway;
    credentialVerifier = ICredentialVerifier(_credentialVerifier);
    restrictionsEnabled = true;

    // Whitelist gateway for minting/burning
    _whitelist[_gateway] = true;
}

// ═══════════════════════════════════════════════════════════════════
// MINTING & BURNING (Gateway Only)
// ═══════════════════════════════════════════════════════════════════

/// @notice Mint tokens to an address
/// @dev Only callable by gateway
/// @param to Recipient address
/// @param amount Amount to mint
function mint(address to, uint256 amount) external override {
    require(msg.sender == gateway, "Only gateway");
    _mint(to, amount);
}

/// @notice Burn tokens from an address
/// @dev Only callable by gateway
/// @param from Address to burn from
/// @param amount Amount to burn
function burn(address from, uint256 amount) external override {
    require(msg.sender == gateway, "Only gateway");
    _burn(from, amount);
}

// ═══════════════════════════════════════════════════════════════════
// TRANSFER RESTRICTION HOOK
// ═══════════════════════════════════════════════════════════════════

/// @notice Hook called before every transfer
/// @dev Enforces credential verification for both parties
/// @param from Sender address
/// @param to Recipient address
/// @param amount Transfer amount
function _update(
    address from,
    address to,
    uint256 amount
) internal virtual override whenNotPaused {
    // Skip checks for minting (from = address(0))
    if (from == address(0)) {
        super._update(from, to, amount);
        return;
    }

    // Skip checks for burning (to = address(0))
    if (to == address(0)) {
        super._update(from, to, amount);
        return;
    }

    // Skip checks if restrictions disabled
    if (!restrictionsEnabled) {
        super._update(from, to, amount);
        return;
    }

    // Skip checks for whitelisted addresses
    if (_whitelist[from] || _whitelist[to]) {
        super._update(from, to, amount);
        return;
    }

    // Get pool requirements from gateway
    IRWAGateway.AssetPool memory pool = IRWAGateway(gateway).getPool(poolId);

    // Verify sender credential
    bool senderValid = credentialVerifier.verifyCredential(
        from,
        pool.requiredCredentialType,
        pool.allowedJurisdictions,
        pool.requiredTier
    );

    if (!senderValid) {
        emit TransferRestricted(from, to, "Sender credential invalid");
        revert("Sender not authorized");
    }

    // Verify recipient credential
    bool recipientValid = credentialVerifier.verifyCredential(
        to,
        pool.requiredCredentialType,
        pool.allowedJurisdictions,
        pool.requiredTier
    );

    if (!recipientValid) {
        emit TransferRestricted(from, to, "Recipient credential invalid");
        revert("Recipient not authorized");
    }

    // All checks passed
    super._update(from, to, amount);
}

// ═══════════════════════════════════════════════════════════════════
// WHITELIST MANAGEMENT
// ═══════════════════════════════════════════════════════════════════

/// @notice Add address to whitelist
/// @param account Address to whitelist
/// @custom:access Gateway only
function addToWhitelist(address account) external override {
    require(msg.sender == gateway, "Only gateway");
    _whitelist[account] = true;
    emit WhitelistAdded(account);
}

/// @notice Remove address from whitelist
/// @param account Address to remove
/// @custom:access Gateway only
function removeFromWhitelist(address account) external override {
    require(msg.sender == gateway, "Only gateway");
    _whitelist[account] = false;
    emit WhitelistRemoved(account);
}

/// @notice Check if address is whitelisted
/// @param account Address to check
/// @return whitelisted Whether address is whitelisted
function isWhitelisted(address account) external view override returns (bool) {
    return _whitelist[account];
}

// ═══════════════════════════════════════════════════════════════════
// PAUSE FUNCTIONALITY
// ═══════════════════════════════════════════════════════════════════

/// @notice Pause all transfers
/// @custom:access Gateway only
function pause() external override {
    require(msg.sender == gateway, "Only gateway");
    _pause();
}

/// @notice Unpause transfers
/// @custom:access Gateway only
function unpause() external override {
    require(msg.sender == gateway, "Only gateway");
    _unpause();
}

// ═══════════════════════════════════════════════════════════════════
// VIEW FUNCTIONS
// ═══════════════════════════════════════════════════════════════════

/// @notice Check if transfer would be allowed
/// @param from Sender address
/// @param to Recipient address
/// @param amount Transfer amount
/// @return allowed Whether transfer would succeed
/// @return reason Reason if not allowed
function canTransfer(
    address from,
    address to,
    uint256 amount
) external view returns (bool allowed, string memory reason) {
    if (paused()) return (false, "Token paused");
    if (balanceOf(from) < amount) return (false, "Insufficient balance");
    if (!restrictionsEnabled) return (true, "");
    if (_whitelist[from] || _whitelist[to]) return (true, "");

    IRWAGateway.AssetPool memory pool = IRWAGateway(gateway).getPool(poolId);

    if (!credentialVerifier.verifyCredential(
        from,
        pool.requiredCredentialType,
        pool.allowedJurisdictions,
        pool.requiredTier
    )) {
        return (false, "Sender credential invalid");
    }

    if (!credentialVerifier.verifyCredential(
        to,
        pool.requiredCredentialType,
        pool.allowedJurisdictions,
        pool.requiredTier
    )) {
        return (false, "Recipient credential invalid");
    }

    return (true, "");
}
```

---

## 6. DocumentSeal Contract

### 6.1 Purpose

The DocumentSeal contract provides immutable proof of document existence and multi-party signatures, useful for investment agreements, subscription documents, and legal contracts.

### 6.2 State Variables

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract DocumentSeal is IDocumentSeal, Ownable {

    // ═══════════════════════════════════════════════════════════════════
    // STATE VARIABLES
    // ═══════════════════════════════════════════════════════════════════

    /// @notice Mapping from document hash to document record
    mapping(bytes32 => DocumentRecord) private _documents;

    /// @notice Mapping to check if address has signed a document
    mapping(bytes32 => mapping(address => bool)) private _hasSigned;

    /// @notice Reference to BiometricRegistry
    IBiometricRegistry public biometricRegistry;

    /// @notice Total documents sealed
    uint256 public totalDocuments;

    /// @notice Maximum signers per document
    uint256 public constant MAX_SIGNERS = 100;
}
```

### 6.3 Function Specifications

```solidity
// ═══════════════════════════════════════════════════════════════════
// DOCUMENT SEALING
// ═══════════════════════════════════════════════════════════════════

/// @notice Seal a new document with biometric signature
/// @param documentHash SHA-256 hash of the document
/// @param metadata Optional metadata (can be encrypted)
/// @param messageHash Hash of seal intent message
/// @param biometricSignature Biometric signature
/// @return success Whether sealing was successful
/// @custom:gas ~100,000 gas
function sealDocument(
    bytes32 documentHash,
    bytes calldata metadata,
    bytes32 messageHash,
    bytes calldata biometricSignature
) external returns (bool success) {
    require(documentHash != bytes32(0), "Invalid document hash");
    require(
        _documents[documentHash].createdAt == 0,
        "Document already exists"
    );

    // Verify biometric
    require(
        biometricRegistry.verify(msg.sender, messageHash, biometricSignature),
        "Biometric verification failed"
    );

    // Create document record
    address[] memory signers = new address[](1);
    signers[0] = msg.sender;

    _documents[documentHash] = DocumentRecord({
        documentHash: documentHash,
        signers: signers,
        createdAt: block.timestamp,
        lastSignedAt: block.timestamp,
        metadata: metadata,
        isFinalized: false
    });

    _hasSigned[documentHash][msg.sender] = true;
    totalDocuments++;

    emit DocumentSealed(documentHash, msg.sender, block.timestamp);
    return true;
}

/// @notice Add signature to existing document
/// @param documentHash The document to sign
/// @param messageHash Hash of sign intent message
/// @param biometricSignature Biometric signature
/// @return success Whether signing was successful
/// @custom:gas ~80,000 gas
function addSigner(
    bytes32 documentHash,
    bytes32 messageHash,
    bytes calldata biometricSignature
) external returns (bool success) {
    DocumentRecord storage doc = _documents[documentHash];

    require(doc.createdAt != 0, "Document does not exist");
    require(!doc.isFinalized, "Document is finalized");
    require(!_hasSigned[documentHash][msg.sender], "Already signed");
    require(doc.signers.length < MAX_SIGNERS, "Max signers reached");

    // Verify biometric
    require(
        biometricRegistry.verify(msg.sender, messageHash, biometricSignature),
        "Biometric verification failed"
    );

    // Add signer
    doc.signers.push(msg.sender);
    doc.lastSignedAt = block.timestamp;
    _hasSigned[documentHash][msg.sender] = true;

    emit DocumentSigned(documentHash, msg.sender, doc.signers.length - 1);
    return true;
}

/// @notice Finalize document (no more signatures allowed)
/// @param documentHash The document to finalize
/// @custom:access First signer only
function finalizeDocument(bytes32 documentHash) external {
    DocumentRecord storage doc = _documents[documentHash];

    require(doc.createdAt != 0, "Document does not exist");
    require(!doc.isFinalized, "Already finalized");
    require(doc.signers[0] == msg.sender, "Only creator can finalize");

    doc.isFinalized = true;

    emit DocumentFinalized(documentHash, doc.signers.length);
}

// ═══════════════════════════════════════════════════════════════════
// VIEW FUNCTIONS
// ═══════════════════════════════════════════════════════════════════

/// @notice Verify a document exists and get signer count
function verifyDocument(
    bytes32 documentHash
) external view returns (bool exists, uint256 signerCount) {
    DocumentRecord storage doc = _documents[documentHash];
    exists = doc.createdAt != 0;
    signerCount = doc.signers.length;
}

/// @notice Get all signers of a document
function getDocumentSigners(
    bytes32 documentHash
) external view returns (address[] memory) {
    return _documents[documentHash].signers;
}

/// @notice Get full document record
function getDocument(
    bytes32 documentHash
) external view returns (DocumentRecord memory) {
    return _documents[documentHash];
}

/// @notice Check if address has signed document
function hasSigned(
    bytes32 documentHash,
    address signer
) external view returns (bool) {
    return _hasSigned[documentHash][signer];
}
```

---

## 7. MockUSDC Contract

### 7.1 Purpose

Simple ERC-20 token for testing on Fuji testnet, mimicking USDC behavior.

### 7.2 Implementation

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/// @title MockUSDC
/// @notice Test USDC for Fuji testnet
/// @dev 6 decimals like real USDC
contract MockUSDC is ERC20 {

    uint8 private constant DECIMALS = 6;

    constructor() ERC20("Mock USDC", "USDC") {
        // Mint 1 billion USDC to deployer for testing
        _mint(msg.sender, 1_000_000_000 * 10**DECIMALS);
    }

    function decimals() public pure override returns (uint8) {
        return DECIMALS;
    }

    /// @notice Faucet function for testing
    /// @param amount Amount to mint (max 10,000 per call)
    function faucet(uint256 amount) external {
        require(amount <= 10_000 * 10**DECIMALS, "Max 10,000 per faucet");
        _mint(msg.sender, amount);
    }

    /// @notice Batch faucet for multiple addresses
    function batchFaucet(address[] calldata recipients, uint256 amount) external {
        require(amount <= 10_000 * 10**DECIMALS, "Max 10,000 per recipient");
        for (uint256 i = 0; i < recipients.length; i++) {
            _mint(recipients[i], amount);
        }
    }
}
```

---

## 8. Contract Interactions & Data Flow

### 8.1 Investment Sequence Diagram

```
┌─────────┐     ┌─────────┐     ┌─────────┐     ┌─────────┐     ┌─────────┐     ┌─────────┐
│  User   │     │ Relayer │     │ Gateway │     │ BioReg  │     │CredVer │     │RWAToken │
└────┬────┘     └────┬────┘     └────┬────┘     └────┬────┘     └────┬────┘     └────┬────┘
     │               │               │               │               │               │
     │ 1. Sign intent│               │               │               │               │
     │   (biometric) │               │               │               │               │
     ├──────────────▶│               │               │               │               │
     │               │               │               │               │               │
     │               │ 2. invest()   │               │               │               │
     │               ├──────────────▶│               │               │               │
     │               │               │               │               │               │
     │               │               │ 3. verify()   │               │               │
     │               │               ├──────────────▶│               │               │
     │               │               │               │               │               │
     │               │               │               │ 4. ACP-204    │               │
     │               │               │               │    precompile │               │
     │               │               │               ├───────┐       │               │
     │               │               │               │       │       │               │
     │               │               │               │◀──────┘       │               │
     │               │               │               │               │               │
     │               │               │ 5. verified ✓ │               │               │
     │               │               │◀──────────────┤               │               │
     │               │               │               │               │               │
     │               │               │ 6. verifyCred()              │               │
     │               │               ├─────────────────────────────▶│               │
     │               │               │               │               │               │
     │               │               │ 7. cred valid ✓               │               │
     │               │               │◀─────────────────────────────┤               │
     │               │               │               │               │               │
     │               │               │ 8. transferFrom(user, USDC)  │               │
     │               │               ├──────────────────────────────────────────────┤
     │               │               │               │               │               │
     │               │               │ 9. mint(user, shares)        │               │
     │               │               ├──────────────────────────────────────────────▶│
     │               │               │               │               │               │
     │               │ 10. success   │               │               │               │
     │               │◀──────────────┤               │               │               │
     │               │               │               │               │               │
     │ 11. confirmed │               │               │               │               │
     │◀──────────────┤               │               │               │               │
     │               │               │               │               │               │
```

### 8.2 Redemption Sequence Diagram

```
┌─────────┐     ┌─────────┐     ┌─────────┐     ┌─────────┐     ┌─────────┐     ┌─────────┐
│  User   │     │ Relayer │     │ Gateway │     │ BioReg  │     │CredVer │     │RWAToken │
└────┬────┘     └────┬────┘     └────┬────┘     └────┬────┘     └────┬────┘     └────┬────┘
     │               │               │               │               │               │
     │ 1. Sign intent│               │               │               │               │
     ├──────────────▶│               │               │               │               │
     │               │               │               │               │               │
     │               │ 2. redeem()   │               │               │               │
     │               ├──────────────▶│               │               │               │
     │               │               │               │               │               │
     │               │               │ 3. Check lock │               │               │
     │               │               │    period     │               │               │
     │               │               ├───────┐       │               │               │
     │               │               │       │       │               │               │
     │               │               │◀──────┘       │               │               │
     │               │               │               │               │               │
     │               │               │ 4. verify()   │               │               │
     │               │               ├──────────────▶│               │               │
     │               │               │               │               │               │
     │               │               │ 5. verified ✓ │               │               │
     │               │               │◀──────────────┤               │               │
     │               │               │               │               │               │
     │               │               │ 6. verifyCred()              │               │
     │               │               ├─────────────────────────────▶│               │
     │               │               │               │               │               │
     │               │               │ 7. cred valid ✓               │               │
     │               │               │◀─────────────────────────────┤               │
     │               │               │               │               │               │
     │               │               │ 8. burn(user, shares)        │               │
     │               │               ├──────────────────────────────────────────────▶│
     │               │               │               │               │               │
     │               │               │ 9. transfer(user, USDC)      │               │
     │               │               ├──────────────────────────────────────────────┤
     │               │               │               │               │               │
     │               │ 10. success   │               │               │               │
     │               │◀──────────────┤               │               │               │
     │               │               │               │               │               │
     │ 11. USDC      │               │               │               │               │
     │    received   │               │               │               │               │
     │◀──────────────┤               │               │               │               │
```

### 8.3 Cross-Contract Call Matrix

| Caller | Callee | Function | Purpose |
|--------|--------|----------|---------|
| RWAGateway | BiometricRegistry | verify() | Authenticate user |
| RWAGateway | CredentialVerifier | verifyCredential() | Check compliance |
| RWAGateway | RWAToken | mint() | Issue shares |
| RWAGateway | RWAToken | burn() | Redeem shares |
| RWAGateway | IERC20 | transferFrom() | Accept deposit |
| RWAGateway | IERC20 | transfer() | Return funds |
| RWAToken | CredentialVerifier | verifyCredential() | Transfer restriction |
| RWAToken | RWAGateway | getPool() | Get pool requirements |
| DocumentSeal | BiometricRegistry | verify() | Authenticate signer |
| BiometricRegistry | ACP-204 | staticcall | Verify P-256 signature |

---

## 9. Gas Optimization Strategies

### 9.1 Gas Estimates by Function

| Contract | Function | Estimated Gas | Cost @ 25 nAVAX |
|----------|----------|---------------|-----------------|
| BiometricRegistry | register() | ~120,000 | ~$0.08 |
| BiometricRegistry | verify() | ~50,000 | ~$0.03 |
| BiometricRegistry | verifyViaPrecompile() | ~3,450 | ~$0.002 |
| CredentialVerifier | issueCredential() | ~95,000 | ~$0.06 |
| CredentialVerifier | verifyCredential() | ~8,000 | ~$0.005 |
| RWAGateway | createPool() | ~350,000 | ~$0.23 |
| RWAGateway | invest() | ~180,000 | ~$0.12 |
| RWAGateway | redeem() | ~150,000 | ~$0.10 |
| RWAToken | transfer() | ~80,000 | ~$0.05 |
| DocumentSeal | sealDocument() | ~100,000 | ~$0.07 |

### 9.2 Optimization Techniques Applied

```solidity
// ═══════════════════════════════════════════════════════════════════
// GAS OPTIMIZATION PATTERNS
// ═══════════════════════════════════════════════════════════════════

// 1. STORAGE PACKING
// Pack multiple small values into single storage slots
struct Credential {
    CredentialType credentialType;  // 1 byte  ─┐
    bytes2 jurisdiction;            // 2 bytes  │ Slot 1
    uint8 tier;                     // 1 byte   │
    bool isActive;                  // 1 byte  ─┘
    uint256 issuedAt;               // 32 bytes → Slot 2
    uint256 expiresAt;              // 32 bytes → Slot 3
    // ... more efficient than having each as separate slot
}

// 2. UNCHECKED ARITHMETIC
// Safe when overflow is impossible (e.g., incrementing counters)
unchecked {
    registrationCount++;
    identity.authCounter++;
}

// 3. MEMORY VS CALLDATA
// Use calldata for read-only function parameters
function verifyCredential(
    address user,
    CredentialType requiredType,
    bytes2[] calldata allowedJurisdictions,  // calldata, not memory
    uint8 requiredTier
) external view returns (bool);

// 4. SHORT-CIRCUIT EVALUATION
// Check cheapest conditions first
function verify(...) external returns (bool) {
    require(identity.isActive, "..."); // Storage read: ~2100 gas
    require(signature.length == 64, "..."); // Memory: ~3 gas
    // Place cheap checks before expensive ones
}

// 5. BATCH OPERATIONS
// Allow multiple operations in single transaction
function batchInvest(
    uint256[] calldata poolIds,
    uint256[] calldata amounts,
    bytes32[] calldata messageHashes,
    bytes[] calldata signatures
) external returns (uint256[] memory sharesMinted);

// 6. PRECOMPILE USAGE
// ACP-204: ~3,450 gas vs ~250,000 for Solidity P-256
function _verifyP256(...) internal view returns (bool) {
    (bool success, bytes memory result) = P256_VERIFIER.staticcall(input);
    // 72x cheaper than on-chain P-256 verification
}

// 7. EVENT INDEXING
// Index frequently queried fields (max 3 indexed per event)
event Investment(
    uint256 indexed poolId,      // Indexed: allows filtering
    address indexed investor,     // Indexed: allows filtering
    uint256 amount,              // Not indexed: full value in logs
    uint256 sharesMinted
);

// 8. MINIMAL PROXY PATTERN (Future)
// Clone RWAToken instead of deploying fresh each time
// Saves ~90% deployment gas for new pools
```

### 9.3 Gas Budget Analysis

```
┌─────────────────────────────────────────────────────────────────────┐
│                    Daily Gas Budget Analysis                         │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  Assumptions:                                                        │
│  - Gas price: 25 nAVAX (0.000000025 AVAX)                           │
│  - AVAX price: $35                                                   │
│  - Daily budget: $100                                                │
│                                                                      │
│  Budget in Gas Units:                                               │
│  $100 / ($35 * 0.000000025) = ~114,285,714 gas/day                  │
│                                                                      │
│  Transaction Capacity:                                               │
│  ├── Registrations (120K gas):     ~952/day                         │
│  ├── Verifications (50K gas):      ~2,285/day                       │
│  ├── Investments (180K gas):       ~634/day                         │
│  ├── Redemptions (150K gas):       ~761/day                         │
│  └── Transfers (80K gas):          ~1,428/day                       │
│                                                                      │
│  Mixed Load Example (per day):                                       │
│  ├── 100 registrations:   12,000,000 gas                            │
│  ├── 500 verifications:   25,000,000 gas                            │
│  ├── 200 investments:     36,000,000 gas                            │
│  ├── 100 redemptions:     15,000,000 gas                            │
│  ├── 300 transfers:       24,000,000 gas                            │
│  └── Total:               112,000,000 gas (~$98)                    │
│                                                                      │
│  Conclusion: $100/day supports significant early-stage activity     │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 10. Upgrade & Migration Strategy

### 10.1 Upgrade Approach

The contracts are designed as **non-upgradeable** for the MVP to maximize simplicity and security. Future upgrades follow a migration pattern.

```
┌─────────────────────────────────────────────────────────────────────┐
│                    Upgrade Strategy: Migration                       │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  MVP Phase (Competition):                                            │
│  ├── Non-upgradeable contracts                                      │
│  ├── Simpler audit surface                                          │
│  └── Lower gas costs (no proxy overhead)                            │
│                                                                      │
│  Post-MVP Upgrade Path:                                              │
│                                                                      │
│  Option A: Contract Migration                                        │
│  ┌────────────┐     ┌────────────┐                                  │
│  │ V1 Gateway │────▶│ V2 Gateway │                                  │
│  └────────────┘     └────────────┘                                  │
│       │                   │                                          │
│       │ 1. Pause V1       │ 3. Users migrate                        │
│       │ 2. Deploy V2      │    via redeem V1                        │
│       │                   │    then invest V2                        │
│       ▼                   ▼                                          │
│  [State frozen]     [New features]                                   │
│                                                                      │
│  Option B: Proxy Pattern (Future)                                    │
│  ┌────────────┐     ┌────────────┐                                  │
│  │   Proxy    │────▶│ Logic V2   │                                  │
│  │  (storage) │     │  (code)    │                                  │
│  └────────────┘     └────────────┘                                  │
│       │                                                              │
│       │ Upgrade via admin                                            │
│       │ No user action needed                                        │
│       ▼                                                              │
│  [Same address, new logic]                                           │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### 10.2 State Migration Considerations

| State Type | Migration Strategy |
|------------|-------------------|
| Biometric identities | Users re-register (one-time action) |
| Credentials | Re-issue via trusted verifier |
| Pool balances | Snapshot and airdrop to V2 |
| Document seals | Immutable, reference V1 for history |

### 10.3 Emergency Procedures

```solidity
// Emergency pause (all contracts)
function emergencyPauseAll() external onlyOwner {
    biometricRegistry.pause();
    credentialVerifier.pause();  // if Pausable added
    gateway.pause();
    // Tokens paused individually via gateway
}

// Emergency withdrawal (gateway only)
function emergencyWithdraw(
    address token,
    address to,
    uint256 amount
) external onlyOwner whenPaused {
    require(
        block.timestamp > lastEmergencyWithdrawRequest + 48 hours,
        "Timelock not elapsed"
    );
    IERC20(token).safeTransfer(to, amount);
}
```

---

## 11. Testing Requirements

### 11.1 Unit Test Cases

```
BiometricRegistry Tests
├── Registration
│   ├── Should register new identity successfully
│   ├── Should reject duplicate registration
│   ├── Should reject invalid public key (zero values)
│   ├── Should reject already-used public key
│   └── Should emit IdentityRegistered event
├── Verification
│   ├── Should verify valid signature via precompile
│   ├── Should reject invalid signature
│   ├── Should reject unregistered user
│   ├── Should increment auth counter on success
│   └── Should emit VerificationSuccess event
├── Revocation
│   ├── Should allow self-revocation
│   ├── Should allow owner revocation
│   ├── Should reject unauthorized revocation
│   └── Should clear reverse lookup
└── Relayer
    ├── Should allow trusted relayer registration
    ├── Should reject untrusted relayer
    └── Should verify message signature

CredentialVerifier Tests
├── Issuance
│   ├── Should issue credential with valid params
│   ├── Should reject invalid credential type
│   ├── Should reject blocked jurisdiction
│   ├── Should reject invalid tier
│   ├── Should reject user without biometric
│   └── Should emit CredentialIssued event
├── Verification
│   ├── Should pass valid credential
│   ├── Should fail expired credential
│   ├── Should fail revoked credential
│   ├── Should fail insufficient type
│   ├── Should fail wrong jurisdiction
│   └── Should fail insufficient tier
├── Revocation
│   ├── Should allow issuer revocation
│   ├── Should allow admin revocation
│   └── Should reject unauthorized revocation
└── Admin
    ├── Should add/remove verifiers
    ├── Should block/unblock jurisdictions
    └── Should set credential type support

RWAGateway Tests
├── Pool Creation
│   ├── Should create pool with valid params
│   ├── Should deploy RWA token
│   ├── Should reject invalid params
│   └── Should emit PoolCreated event
├── Investment
│   ├── Should invest with valid biometric + credential
│   ├── Should reject invalid biometric
│   ├── Should reject invalid credential
│   ├── Should reject below minimum
│   ├── Should reject above maximum
│   ├── Should reject inactive pool
│   ├── Should transfer USDC
│   ├── Should mint RWA tokens
│   └── Should emit Investment event
├── Redemption
│   ├── Should redeem after lock period
│   ├── Should reject before lock period
│   ├── Should reject insufficient shares
│   ├── Should burn RWA tokens
│   ├── Should transfer USDC
│   └── Should emit Redemption event
└── Yield
    ├── Should distribute yield
    ├── Should increase share value
    └── Should emit YieldDistributed event

RWAToken Tests
├── Transfer Restrictions
│   ├── Should allow transfer between verified users
│   ├── Should reject sender without credential
│   ├── Should reject recipient without credential
│   ├── Should allow whitelisted transfers
│   └── Should emit TransferRestricted on failure
├── Minting/Burning
│   ├── Should allow gateway to mint
│   ├── Should allow gateway to burn
│   └── Should reject non-gateway mint/burn
└── Pause
    ├── Should pause transfers
    ├── Should unpause transfers
    └── Should reject non-gateway pause

DocumentSeal Tests
├── Sealing
│   ├── Should seal new document
│   ├── Should reject duplicate document
│   ├── Should require biometric
│   └── Should emit DocumentSealed event
├── Signing
│   ├── Should add signer to existing document
│   ├── Should reject double signing
│   ├── Should reject finalized document
│   └── Should emit DocumentSigned event
└── Finalization
    ├── Should finalize document
    ├── Should reject non-creator finalize
    └── Should emit DocumentFinalized event
```

### 11.2 Integration Test Cases

```
End-to-End Flows
├── Complete User Journey
│   ├── Register biometric
│   ├── Receive credential
│   ├── Invest in pool
│   ├── Wait lock period
│   ├── Redeem investment
│   └── Verify all state changes
├── Multi-User Pool
│   ├── Multiple users invest
│   ├── Yield distribution
│   ├── Partial redemptions
│   └── Verify share calculations
├── Secondary Transfer
│   ├── User A invests
│   ├── User A transfers to User B
│   ├── Verify B has valid credential
│   └── User B redeems
└── Document Multi-Sign
    ├── User A creates document
    ├── Users B, C sign
    ├── User A finalizes
    └── Verify all signatures

Cross-Contract Interactions
├── Gateway → BiometricRegistry → ACP-204
├── Gateway → CredentialVerifier
├── Gateway → RWAToken → CredentialVerifier
├── Gateway → USDC
└── DocumentSeal → BiometricRegistry → ACP-204

Failure Scenarios
├── Expired credential during redemption
├── Revoked identity during transfer
├── Insufficient liquidity on redemption
├── Blocked jurisdiction after credential issue
└── Paused contract during investment
```

### 11.3 Fuzz Testing Targets

```solidity
// Fuzz test targets for invariant testing

// BiometricRegistry invariants
function invariant_registrationCountMatchesActiveIdentities() external view {
    uint256 active = 0;
    // Count active identities
    assert(registrationCount >= active);
}

function invariant_publicKeyUniqueness(
    bytes32 x,
    bytes32 y
) external view {
    bytes32 hash = keccak256(abi.encodePacked(x, y));
    address owner = _publicKeyToAddress[hash];
    if (owner != address(0)) {
        assert(_identities[owner].publicKeyX == x);
        assert(_identities[owner].publicKeyY == y);
    }
}

// RWAGateway invariants
function invariant_poolTotalMatchesMintedTokens(
    uint256 poolId
) external view {
    AssetPool storage pool = _pools[poolId];
    uint256 tokenSupply = IERC20(pool.rwaToken).totalSupply();
    assert(pool.totalShares == tokenSupply);
}

function invariant_poolSolvency(
    uint256 poolId
) external view {
    AssetPool storage pool = _pools[poolId];
    uint256 balance = IERC20(pool.depositToken).balanceOf(address(this));
    assert(balance >= pool.totalDeposited);
}

// Fuzz test scenarios
function testFuzz_Investment(
    uint256 poolId,
    uint256 amount,
    address user
) external {
    vm.assume(poolId < poolCount);
    vm.assume(amount > 0 && amount < type(uint128).max);
    vm.assume(user != address(0));

    // Setup: register user, issue credential, fund USDC
    // ...

    // Test investment
    uint256 sharesBefore = IERC20(pool.rwaToken).balanceOf(user);
    gateway.invest(poolId, amount, ...);
    uint256 sharesAfter = IERC20(pool.rwaToken).balanceOf(user);

    assert(sharesAfter > sharesBefore);
}
```

### 11.4 Security Testing Checklist

| Test Category | Test Cases | Priority |
|---------------|------------|----------|
| **Reentrancy** | invest(), redeem(), sealDocument() | CRITICAL |
| **Access Control** | All admin functions | CRITICAL |
| **Integer Overflow** | Share calculations, counters | HIGH |
| **Front-running** | Investment, credential issuance | HIGH |
| **Signature Replay** | Biometric verification | CRITICAL |
| **DoS** | Large array inputs, gas limits | MEDIUM |
| **Oracle Manipulation** | N/A (no oracles in MVP) | N/A |
| **Flash Loan** | N/A (no composability) | N/A |

---

## Appendix A: Solidity Code Organization

```
contracts/
├── interfaces/
│   ├── IBiometricRegistry.sol
│   ├── ICredentialVerifier.sol
│   ├── IRWAGateway.sol
│   ├── IRWAToken.sol
│   └── IDocumentSeal.sol
├── core/
│   ├── BiometricRegistry.sol
│   ├── CredentialVerifier.sol
│   ├── RWAGateway.sol
│   ├── RWAToken.sol
│   └── DocumentSeal.sol
├── mocks/
│   └── MockUSDC.sol
├── libraries/
│   └── P256Verifier.sol (optional wrapper)
└── test/
    ├── BiometricRegistry.t.sol
    ├── CredentialVerifier.t.sol
    ├── RWAGateway.t.sol
    ├── RWAToken.t.sol
    ├── DocumentSeal.t.sol
    └── Integration.t.sol
```

---

## Appendix B: Deployment Order

```
1. Deploy MockUSDC (Fuji only)
   └── No dependencies

2. Deploy BiometricRegistry
   └── No dependencies, but verify ACP-204 works first

3. Deploy CredentialVerifier
   └── Set BiometricRegistry address
   └── Add initial verifiers

4. Deploy RWAGateway
   └── Set BiometricRegistry address
   └── Set CredentialVerifier address
   └── Grant POOL_ADMIN_ROLE

5. Create initial pools via RWAGateway
   └── Each creates RWAToken automatically

6. Deploy DocumentSeal
   └── Set BiometricRegistry address

7. Configure relayers
   └── Add trusted relayers to BiometricRegistry

8. Transfer ownership (if needed)
   └── Multisig for production
```

---

## Appendix C: Document Control

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-02-04 | Architecture Team | Initial specification |

---

**End of Phase 2: Smart Contract Architecture**

*Next: Phase 3 - API & Backend Architecture*
