# RWA Gateway Architecture Document
## Phase 5: Avalanche Integration & Security

**Version:** 1.0
**Date:** February 5, 2026
**Status:** DRAFT
**Project:** RWA Gateway - Biometric Real-World Asset Tokenization on Avalanche

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [ACP-204 Secp256r1 Integration](#2-acp-204-secp256r1-integration)
   - 2.1 [Precompile Specification](#21-precompile-specification)
   - 2.2 [P256Verifier Solidity Library](#22-p256verifier-solidity-library)
   - 2.3 [WebAuthn Message Construction](#23-webauthn-message-construction)
   - 2.4 [Gas Optimization Strategies](#24-gas-optimization-strategies)
3. [eERC Encrypted Token Integration](#3-eerc-encrypted-token-integration)
   - 3.1 [Architecture Overview](#31-architecture-overview)
   - 3.2 [Encrypted Balance Architecture](#32-encrypted-balance-architecture)
   - 3.3 [Privacy-Preserving Compliance](#33-privacy-preserving-compliance)
   - 3.4 [Auditor Key Management](#34-auditor-key-management)
   - 3.5 [RWAToken Integration](#35-rwatoken-integration)
4. [WebAuthn-to-Blockchain Authentication Flow](#4-webauthn-to-blockchain-authentication-flow)
   - 4.1 [End-to-End Authentication Flow](#41-end-to-end-authentication-flow)
   - 4.2 [Challenge-Response Protocol](#42-challenge-response-protocol)
   - 4.3 [Session Management Security](#43-session-management-security)
   - 4.4 [Signature Relay Architecture](#44-signature-relay-architecture)
5. [Security Architecture](#5-security-architecture)
   - 5.1 [Comprehensive Threat Model](#51-comprehensive-threat-model)
   - 5.2 [Defense in Depth Strategy](#52-defense-in-depth-strategy)
   - 5.3 [Attack Vector Deep Dives](#53-attack-vector-deep-dives)
6. [Cryptographic Security](#6-cryptographic-security)
   - 6.1 [Key Generation Workflows](#61-key-generation-workflows)
   - 6.2 [Signature Schemes](#62-signature-schemes)
   - 6.3 [Secure Random Number Generation](#63-secure-random-number-generation)
7. [Operational Security](#7-operational-security)
   - 7.1 [Key Ceremony Procedures](#71-key-ceremony-procedures)
   - 7.2 [Incident Response](#72-incident-response)
   - 7.3 [Compliance Framework](#73-compliance-framework)
- [Appendix A: Pre-Deployment Security Checklist](#appendix-a-pre-deployment-security-checklist)
- [Appendix B: Attack Vectors Quick Reference](#appendix-b-attack-vectors-quick-reference)
- [Appendix C: Glossary](#appendix-c-glossary)

---

## 1. Executive Summary

Phase 5 documents the **Avalanche-exclusive security features** that differentiate RWA Gateway from competitors on other EVM chains. Two critical Avalanche innovations enable our architecture:

1. **ACP-204 (secp256r1 Precompile)** - Native P-256 curve verification at ~6,900 gas (vs 200k-330k in Solidity), enabling cost-effective on-chain biometric authentication via WebAuthn/FIDO2 hardware keys.

2. **eERC (Encrypted ERC Tokens)** - Privacy-preserving token standard using partially homomorphic encryption, allowing confidential balances with regulatory compliance through rotatable auditor keys.

These cannot be replicated on standard EVM chains without significant gas overhead or trusted third parties. Combined, they enable:
- **Biometric-first authentication** without gas cost concerns
- **Private compliance credentials** verifiable on-chain without exposure
- **Institutional-grade privacy** with regulatory auditability

**Security Philosophy:** Defense in depth with cryptographic guarantees at every layer.

> **Cross-References:**
> - Security Layering Model: Phase 1, Section 3.2
> - BiometricRegistry Implementation: Phase 2, Sections 2.7-2.8
> - Relayer Security: Phase 6, Section 5.4

---

## 2. ACP-204 Secp256r1 Integration

### 2.1 Precompile Specification

ACP-204 implements EIP-7951/RIP-7212, providing native P-256 (secp256r1) signature verification on Avalanche C-Chain.

```
┌─────────────────────────────────────────────────────────────────────┐
│                    ACP-204 PRECOMPILE SPECIFICATION                  │
├─────────────────────────────────────────────────────────────────────┤
│  Address:  0x0000000000000000000000000000000000000100                │
│  Activated: November 19, 2025 (Granite Upgrade)                     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  INPUT FORMAT (160 bytes total):                                     │
│  ┌────────────┬────────────┬────────────┬────────────┬────────────┐ │
│  │ messageHash│     r      │     s      │     x      │     y      │ │
│  │  (32 bytes)│ (32 bytes) │ (32 bytes) │ (32 bytes) │ (32 bytes) │ │
│  └────────────┴────────────┴────────────┴────────────┴────────────┘ │
│                                                                      │
│  OUTPUT FORMAT:                                                      │
│  ├── Success: 32 bytes → 0x000...001 (returns uint256(1))           │
│  └── Failure: 0 bytes  → empty (call returns false)                 │
│                                                                      │
│  GAS COST: ~3,450 actual (6,900 documented estimate)                │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

**Key Properties:**
- **NIST FIPS 186-3 compliant** - Same curve as Apple Secure Enclave, Android Keystore
- **Cross-chain compatible** - Same address as RIP-7212 implementations
- **Atomic verification** - Returns 1 or reverts, no partial states

### 2.2 P256Verifier Solidity Library

Complete implementation for on-chain secp256r1 verification:

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title P256Verifier
/// @author RWA Gateway Team
/// @notice Library for secp256r1 (P-256) signature verification via ACP-204
/// @dev Reference implementation: Daimo p256-verifier, adapted for Avalanche
/// @custom:security-contact security@rwa-gateway.app
library P256Verifier {
    // ═══════════════════════════════════════════════════════════════════
    // CONSTANTS
    // ═══════════════════════════════════════════════════════════════════

    /// @notice ACP-204 precompile address on Avalanche C-Chain
    address constant PRECOMPILE = 0x0000000000000000000000000000000000000100;

    /// @notice Expected input length for precompile call
    uint256 constant INPUT_LENGTH = 160;

    /// @notice Expected output length for successful verification
    uint256 constant OUTPUT_LENGTH = 32;

    // ═══════════════════════════════════════════════════════════════════
    // ERRORS
    // ═══════════════════════════════════════════════════════════════════

    /// @notice Thrown when signature length is not 64 bytes (r || s)
    error InvalidSignatureLength(uint256 actual, uint256 expected);

    /// @notice Thrown when public key length is not 64 bytes (x || y)
    error InvalidPublicKeyLength(uint256 actual, uint256 expected);

    /// @notice Thrown when precompile call fails unexpectedly
    error PrecompileCallFailed();

    // ═══════════════════════════════════════════════════════════════════
    // VERIFICATION FUNCTIONS
    // ═══════════════════════════════════════════════════════════════════

    /// @notice Verify a P-256 ECDSA signature using ACP-204 precompile
    /// @param messageHash The SHA-256 hash of the signed message
    /// @param r Signature r component (32 bytes, big-endian)
    /// @param s Signature s component (32 bytes, big-endian)
    /// @param x Public key x coordinate (32 bytes, big-endian)
    /// @param y Public key y coordinate (32 bytes, big-endian)
    /// @return isValid True if signature is valid for the given message and key
    /// @custom:gas ~3,450 gas for precompile call
    function verify(
        bytes32 messageHash,
        bytes32 r,
        bytes32 s,
        bytes32 x,
        bytes32 y
    ) internal view returns (bool isValid) {
        // Encode input: hash || r || s || x || y (160 bytes total)
        bytes memory input = abi.encodePacked(messageHash, r, s, x, y);

        // Call precompile with staticcall (read-only, no state changes)
        (bool success, bytes memory result) = PRECOMPILE.staticcall(input);

        // Precompile returns empty on invalid signature
        if (!success || result.length != OUTPUT_LENGTH) {
            return false;
        }

        // Decode result: 1 = valid, 0 = invalid
        uint256 resultValue;
        assembly {
            resultValue := mload(add(result, 32))
        }

        return resultValue == 1;
    }

    /// @notice Verify signature with raw concatenated bytes
    /// @param messageHash The SHA-256 hash of the signed message
    /// @param signature Concatenated r || s (64 bytes total)
    /// @param publicKey Concatenated x || y (64 bytes total)
    /// @return isValid True if signature is valid
    /// @custom:gas ~3,600 gas (includes decoding overhead)
    function verifyRaw(
        bytes32 messageHash,
        bytes calldata signature,
        bytes calldata publicKey
    ) internal view returns (bool isValid) {
        // Validate input lengths
        if (signature.length != 64) {
            revert InvalidSignatureLength(signature.length, 64);
        }
        if (publicKey.length != 64) {
            revert InvalidPublicKeyLength(publicKey.length, 64);
        }

        // Extract components using assembly for gas efficiency
        bytes32 r;
        bytes32 s;
        bytes32 x;
        bytes32 y;

        assembly {
            // Load signature components
            r := calldataload(signature.offset)
            s := calldataload(add(signature.offset, 32))

            // Load public key components
            x := calldataload(publicKey.offset)
            y := calldataload(add(publicKey.offset, 32))
        }

        return verify(messageHash, r, s, x, y);
    }

    /// @notice Verify WebAuthn assertion signature
    /// @param authenticatorData Raw authenticator data from WebAuthn
    /// @param clientDataHash SHA-256 hash of clientDataJSON
    /// @param signature The assertion signature (r || s, 64 bytes)
    /// @param publicKey The credential public key (x || y, 64 bytes)
    /// @return isValid True if WebAuthn assertion is valid
    /// @custom:gas ~4,500 gas (includes SHA-256 + precompile)
    function verifyWebAuthn(
        bytes calldata authenticatorData,
        bytes32 clientDataHash,
        bytes calldata signature,
        bytes calldata publicKey
    ) internal view returns (bool isValid) {
        // WebAuthn signature is over: authenticatorData || SHA256(clientDataJSON)
        // We receive clientDataHash directly (computed off-chain)
        bytes32 messageHash = sha256(abi.encodePacked(authenticatorData, clientDataHash));

        return verifyRaw(messageHash, signature, publicKey);
    }
}
```

### 2.3 WebAuthn Message Construction

WebAuthn signatures cover a specific message format. Understanding this is critical for correct verification:

```
┌─────────────────────────────────────────────────────────────────────┐
│                 WEBAUTHN SIGNATURE MESSAGE FORMAT                    │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  signatureBase = authenticatorData || SHA256(clientDataJSON)        │
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │              authenticatorData (37+ bytes)                   │    │
│  ├────────────────┬────────────┬────────────┬──────────────────┤    │
│  │   rpIdHash     │   flags    │  counter   │  extensions...   │    │
│  │  (32 bytes)    │  (1 byte)  │ (4 bytes)  │   (variable)     │    │
│  └────────────────┴────────────┴────────────┴──────────────────┘    │
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │                clientDataJSON (example)                      │    │
│  ├─────────────────────────────────────────────────────────────┤    │
│  │  {                                                           │    │
│  │    "type": "webauthn.get",                                  │    │
│  │    "challenge": "base64url-encoded-challenge",              │    │
│  │    "origin": "https://rwa-gateway.app",                     │    │
│  │    "crossOrigin": false                                     │    │
│  │  }                                                          │    │
│  └─────────────────────────────────────────────────────────────┘    │
│                                                                      │
│  flags byte breakdown:                                               │
│  ├── Bit 0 (UP): User Present                                       │
│  ├── Bit 2 (UV): User Verified (biometric/PIN confirmed)            │
│  ├── Bit 3 (BE): Backup Eligibility                                 │
│  ├── Bit 4 (BS): Backup State                                       │
│  ├── Bit 6 (AT): Attested Credential Data included                  │
│  └── Bit 7 (ED): Extension Data included                            │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

**Solidity Helper for Message Construction:**

```solidity
/// @notice Construct the signed message hash from WebAuthn components
/// @param authenticatorData Raw bytes from authenticator
/// @param clientDataJSON Raw JSON string from client
/// @return messageHash The hash that was signed
function constructWebAuthnMessageHash(
    bytes calldata authenticatorData,
    string calldata clientDataJSON
) internal pure returns (bytes32 messageHash) {
    bytes32 clientDataHash = sha256(bytes(clientDataJSON));
    messageHash = sha256(abi.encodePacked(authenticatorData, clientDataHash));
}

/// @notice Extract and validate authenticator data flags
/// @param authenticatorData Raw authenticator data (minimum 37 bytes)
/// @return userPresent Whether UP flag is set
/// @return userVerified Whether UV flag is set
/// @return counter The signature counter value
function parseAuthenticatorData(
    bytes calldata authenticatorData
) internal pure returns (
    bool userPresent,
    bool userVerified,
    uint32 counter
) {
    require(authenticatorData.length >= 37, "AuthData too short");

    // Flags byte is at position 32 (after rpIdHash)
    uint8 flags = uint8(authenticatorData[32]);

    userPresent = (flags & 0x01) != 0;  // Bit 0
    userVerified = (flags & 0x04) != 0; // Bit 2

    // Counter is 4 bytes at position 33-36 (big-endian)
    counter = uint32(bytes4(authenticatorData[33:37]));
}
```

### 2.4 Gas Optimization Strategies

**Gas Cost Comparison:**

| Implementation | Gas Cost | Relative |
|----------------|----------|----------|
| ACP-204 Precompile | ~3,450 | 1x (baseline) |
| Daimo Solidity P256 | ~330,000 | 96x |
| Obvious Wallet Impl | ~250,000 | 72x |
| First-time deployment + verify | ~590,000 | 171x |

**Optimization Strategies:**

1. **Batch Verification** - Verify multiple signatures in single transaction when possible
2. **Lazy Verification** - Verify on first action, cache verification status
3. **Off-chain Pre-validation** - Verify signature format off-chain before submitting
4. **Minimal authenticatorData** - Request only required extensions

```solidity
/// @notice Batch verify multiple signatures (gas efficient for multi-sig)
/// @param messageHashes Array of message hashes
/// @param signatures Array of signatures (each 64 bytes)
/// @param publicKeys Array of public keys (each 64 bytes)
/// @return allValid True only if ALL signatures are valid
/// @custom:gas ~3,450 * n + overhead
function batchVerify(
    bytes32[] calldata messageHashes,
    bytes[] calldata signatures,
    bytes[] calldata publicKeys
) internal view returns (bool allValid) {
    uint256 length = messageHashes.length;
    require(
        signatures.length == length && publicKeys.length == length,
        "Array length mismatch"
    );

    for (uint256 i = 0; i < length; ) {
        if (!P256Verifier.verifyRaw(
            messageHashes[i],
            signatures[i],
            publicKeys[i]
        )) {
            return false;
        }
        unchecked { ++i; }
    }

    return true;
}
```

---

## 3. eERC Encrypted Token Integration

### 3.1 Architecture Overview

eERC (Encrypted ERC) enables **confidential token balances** with **regulatory compliance** using:

```
┌─────────────────────────────────────────────────────────────────────┐
│                    eERC CRYPTOGRAPHIC ARCHITECTURE                   │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  CRYPTOGRAPHIC PRIMITIVES:                                           │
│  ├── BabyJubJub Elliptic Curve (circuit-friendly)                   │
│  ├── Exponential ElGamal Encryption (additively homomorphic)        │
│  ├── zk-SNARKs (Groth16) for range proofs                          │
│  └── Circom circuits for proof generation                           │
│                                                                      │
│  PRIVACY PROPERTIES:                                                 │
│  ├── Balances encrypted on-chain (ciphertext only)                  │
│  ├── Transfer amounts hidden from observers                         │
│  ├── Sender/receiver identities visible (addresses public)          │
│  └── Total supply can be public or private                          │
│                                                                      │
│  COMPLIANCE PROPERTIES:                                              │
│  ├── Designated auditors can decrypt specific transactions          │
│  ├── Auditor keys are rotatable (no permanent backdoor)             │
│  ├── Proof of solvency without revealing balances                   │
│  └── Selective disclosure for regulatory requests                   │
│                                                                      │
│  KEY INSIGHT: Homomorphic encryption allows balance updates         │
│  without decryption. Contract verifies proofs, not amounts.         │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

**Why eERC for RWA Gateway:**
- **Investor privacy** - Holdings not visible to competitors
- **Compliance ready** - Auditors can verify without exposing all holders
- **Institutional requirement** - Banks/funds require transaction privacy

### 3.2 Encrypted Balance Architecture

**Ciphertext Structure:**

```
┌─────────────────────────────────────────────────────────────────────┐
│                  ENCRYPTED BALANCE STRUCTURE                         │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ElGamal Ciphertext (C1, C2):                                       │
│  ├── C1 = r * G           (random point, 32 bytes each coord)       │
│  └── C2 = m * G + r * PK  (message + randomness, 32 bytes each)     │
│                                                                      │
│  Storage per user:                                                   │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │  mapping(address => EncryptedBalance) private _balances;     │   │
│  │                                                               │   │
│  │  struct EncryptedBalance {                                    │   │
│  │      uint256 c1x;  // C1.x coordinate                        │   │
│  │      uint256 c1y;  // C1.y coordinate                        │   │
│  │      uint256 c2x;  // C2.x coordinate                        │   │
│  │      uint256 c2y;  // C2.y coordinate                        │   │
│  │  }                                                            │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                      │
│  Homomorphic Addition (for transfers):                              │
│  ├── newBalance = oldBalance ⊕ transferAmount                       │
│  ├── C1_new = C1_old + C1_transfer                                  │
│  └── C2_new = C2_old + C2_transfer                                  │
│                                                                      │
│  Client-side decryption:                                            │
│  ├── m * G = C2 - sk * C1                                           │
│  └── Discrete log to recover m (feasible for bounded values)        │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

**Solidity Interface for eERC Integration:**

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title IEncryptedERC
/// @notice Interface for eERC encrypted token interactions
interface IEncryptedERC {
    /// @notice Encrypted balance structure
    struct EncryptedBalance {
        uint256 c1x;
        uint256 c1y;
        uint256 c2x;
        uint256 c2y;
    }

    /// @notice Transfer with encrypted amounts
    /// @param to Recipient address
    /// @param encryptedAmount Encrypted transfer amount
    /// @param proof zk-SNARK proof of valid transfer
    function transferEncrypted(
        address to,
        EncryptedBalance calldata encryptedAmount,
        bytes calldata proof
    ) external;

    /// @notice Get encrypted balance (ciphertext only)
    /// @param account Address to query
    /// @return Encrypted balance ciphertext
    function encryptedBalanceOf(address account)
        external view returns (EncryptedBalance memory);

    /// @notice Register user with their encryption public key
    /// @param publicKeyX X coordinate of user's encryption key
    /// @param publicKeyY Y coordinate of user's encryption key
    function registerPublicKey(uint256 publicKeyX, uint256 publicKeyY) external;
}
```

### 3.3 Privacy-Preserving Compliance

**How Compliance Works Without Revealing Data:**

```
┌─────────────────────────────────────────────────────────────────────┐
│              PRIVACY-PRESERVING COMPLIANCE FLOW                      │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  SCENARIO: Verify investor is accredited without revealing wealth   │
│                                                                      │
│  1. CREDENTIAL ISSUANCE (off-chain):                                │
│     ├── KYC provider verifies accreditation                         │
│     ├── Issues encrypted credential to user                         │
│     └── Credential contains: tier, expiry, jurisdiction             │
│                                                                      │
│  2. ON-CHAIN VERIFICATION (zk-proof):                               │
│     ├── User generates proof: "I have valid accreditation"          │
│     ├── Proof reveals NOTHING about actual wealth/income            │
│     ├── Contract verifies proof is valid                            │
│     └── Access granted without exposing credential details          │
│                                                                      │
│  3. AUDIT SCENARIO (selective disclosure):                          │
│     ├── Regulator requests audit of specific address                │
│     ├── Auditor uses time-limited decryption key                    │
│     ├── Decrypts ONLY requested transactions                        │
│     └── Other users' data remains encrypted                         │
│                                                                      │
│  KEY PRINCIPLE: Minimum necessary disclosure                        │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### 3.4 Auditor Key Management

**Auditor Key Rotation Contract:**

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/AccessControl.sol";

/// @title AuditorKeyManager
/// @notice Manages rotatable auditor keys for eERC compliance
/// @dev Auditors can decrypt transactions within their validity period
contract AuditorKeyManager is AccessControl {
    // ═══════════════════════════════════════════════════════════════════
    // ROLES
    // ═══════════════════════════════════════════════════════════════════

    bytes32 public constant COMPLIANCE_ADMIN = keccak256("COMPLIANCE_ADMIN");
    bytes32 public constant KEY_ROTATOR = keccak256("KEY_ROTATOR");

    // ═══════════════════════════════════════════════════════════════════
    // STRUCTS
    // ═══════════════════════════════════════════════════════════════════

    /// @notice Auditor key with validity period
    struct AuditorKey {
        uint256 publicKeyX;     // BabyJubJub x-coordinate
        uint256 publicKeyY;     // BabyJubJub y-coordinate
        uint48 activatedAt;     // Timestamp when key became active
        uint48 expiresAt;       // Timestamp when key expires
        bool isRevoked;         // Emergency revocation flag
        string auditorId;       // Identifier (e.g., "SEC_AUDITOR_2026Q1")
    }

    // ═══════════════════════════════════════════════════════════════════
    // STATE
    // ═══════════════════════════════════════════════════════════════════

    /// @notice All registered auditor keys
    AuditorKey[] public auditorKeys;

    /// @notice Mapping from auditor ID to key index
    mapping(string => uint256) public auditorIdToIndex;

    /// @notice Currently active key index
    uint256 public activeKeyIndex;

    // ═══════════════════════════════════════════════════════════════════
    // EVENTS
    // ═══════════════════════════════════════════════════════════════════

    event AuditorKeyRegistered(
        uint256 indexed keyIndex,
        string auditorId,
        uint48 activatedAt,
        uint48 expiresAt
    );

    event AuditorKeyRevoked(uint256 indexed keyIndex, string reason);
    event ActiveKeyRotated(uint256 oldIndex, uint256 newIndex);

    // ═══════════════════════════════════════════════════════════════════
    // FUNCTIONS
    // ═══════════════════════════════════════════════════════════════════

    /// @notice Register a new auditor key
    /// @param publicKeyX X coordinate of auditor's encryption public key
    /// @param publicKeyY Y coordinate of auditor's encryption public key
    /// @param validityPeriod How long the key is valid (seconds)
    /// @param auditorId Human-readable identifier
    /// @custom:access COMPLIANCE_ADMIN only
    function registerAuditorKey(
        uint256 publicKeyX,
        uint256 publicKeyY,
        uint48 validityPeriod,
        string calldata auditorId
    ) external onlyRole(COMPLIANCE_ADMIN) {
        require(validityPeriod > 0 && validityPeriod <= 365 days, "Invalid validity");
        require(bytes(auditorId).length > 0, "Empty auditor ID");
        require(auditorIdToIndex[auditorId] == 0, "Auditor ID exists");

        uint48 activatedAt = uint48(block.timestamp);
        uint48 expiresAt = activatedAt + validityPeriod;

        auditorKeys.push(AuditorKey({
            publicKeyX: publicKeyX,
            publicKeyY: publicKeyY,
            activatedAt: activatedAt,
            expiresAt: expiresAt,
            isRevoked: false,
            auditorId: auditorId
        }));

        uint256 keyIndex = auditorKeys.length - 1;
        auditorIdToIndex[auditorId] = keyIndex + 1; // +1 to distinguish from default 0

        emit AuditorKeyRegistered(keyIndex, auditorId, activatedAt, expiresAt);
    }

    /// @notice Rotate to a new active auditor key
    /// @param newKeyIndex Index of the key to make active
    /// @custom:access KEY_ROTATOR only
    function rotateActiveKey(uint256 newKeyIndex) external onlyRole(KEY_ROTATOR) {
        require(newKeyIndex < auditorKeys.length, "Invalid key index");
        AuditorKey storage key = auditorKeys[newKeyIndex];
        require(!key.isRevoked, "Key is revoked");
        require(block.timestamp < key.expiresAt, "Key expired");

        uint256 oldIndex = activeKeyIndex;
        activeKeyIndex = newKeyIndex;

        emit ActiveKeyRotated(oldIndex, newKeyIndex);
    }

    /// @notice Emergency revoke an auditor key
    /// @param keyIndex Index of key to revoke
    /// @param reason Reason for revocation
    /// @custom:access COMPLIANCE_ADMIN only
    function revokeKey(
        uint256 keyIndex,
        string calldata reason
    ) external onlyRole(COMPLIANCE_ADMIN) {
        require(keyIndex < auditorKeys.length, "Invalid key index");
        auditorKeys[keyIndex].isRevoked = true;

        emit AuditorKeyRevoked(keyIndex, reason);
    }

    /// @notice Get the currently active auditor public key
    /// @return publicKeyX X coordinate
    /// @return publicKeyY Y coordinate
    function getActiveAuditorKey() external view returns (
        uint256 publicKeyX,
        uint256 publicKeyY
    ) {
        AuditorKey storage key = auditorKeys[activeKeyIndex];
        require(!key.isRevoked && block.timestamp < key.expiresAt, "No active key");
        return (key.publicKeyX, key.publicKeyY);
    }
}
```

### 3.5 RWAToken Integration

**Integration Points with RWAToken:**

```solidity
/// @notice Hook for encrypted balance updates during transfer
/// @dev Called by RWAToken._beforeTokenTransfer
function _beforeEncryptedTransfer(
    address from,
    address to,
    uint256 /* amount - ignored, we use encrypted */,
    IEncryptedERC.EncryptedBalance calldata encryptedAmount,
    bytes calldata proof
) internal {
    // 1. Verify sender has sufficient encrypted balance (via zk-proof)
    require(
        _verifyBalanceProof(from, encryptedAmount, proof),
        "Insufficient balance proof failed"
    );

    // 2. Verify receiver is registered with encryption key
    require(
        _hasEncryptionKey(to),
        "Receiver not registered for encrypted tokens"
    );

    // 3. Verify compliance credentials (via CredentialVerifier)
    require(
        credentialVerifier.verifyTransferCompliance(from, to),
        "Compliance check failed"
    );
}

/// @notice Hook for post-transfer encrypted balance updates
/// @dev Called by RWAToken._afterTokenTransfer
function _afterEncryptedTransfer(
    address from,
    address to,
    IEncryptedERC.EncryptedBalance calldata encryptedAmount
) internal {
    // Update encrypted balances using homomorphic addition
    _subtractEncryptedBalance(from, encryptedAmount);
    _addEncryptedBalance(to, encryptedAmount);

    // Emit encrypted transfer event for auditor indexing
    emit EncryptedTransfer(from, to, block.timestamp);
}
```

---

## 4. WebAuthn-to-Blockchain Authentication Flow

### 4.1 End-to-End Authentication Flow

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                    WEBAUTHN → BLOCKCHAIN AUTHENTICATION                       │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐    │
│  │ Browser │    │ Secure  │    │ Backend │    │ Relayer │    │  Chain  │    │
│  │         │    │ Enclave │    │ (API)   │    │ Service │    │ (C-Chain)│   │
│  └────┬────┘    └────┬────┘    └────┬────┘    └────┬────┘    └────┬────┘    │
│       │              │              │              │              │          │
│       │  1. Request authentication  │              │              │          │
│       ├─────────────────────────────►              │              │          │
│       │              │              │              │              │          │
│       │  2. Challenge + nonce + expiry             │              │          │
│       │◄─────────────────────────────┤              │              │          │
│       │              │              │              │              │          │
│       │  3. Prompt biometric        │              │              │          │
│       ├──────────────►              │              │              │          │
│       │              │              │              │              │          │
│       │  4. User verification (Face ID / Touch ID / PIN)         │          │
│       │              │──┐           │              │              │          │
│       │              │  │ Sign with │              │              │          │
│       │              │  │ P-256 key │              │              │          │
│       │              │◄─┘           │              │              │          │
│       │              │              │              │              │          │
│       │  5. Assertion (signature, authenticatorData, clientData) │          │
│       │◄──────────────┤              │              │              │          │
│       │              │              │              │              │          │
│       │  6. Submit assertion + intended action     │              │          │
│       ├─────────────────────────────►              │              │          │
│       │              │              │              │              │          │
│       │              │  7. Validate assertion format              │          │
│       │              │              ├──┐           │              │          │
│       │              │              │  │ Check:    │              │          │
│       │              │              │  │ - origin  │              │          │
│       │              │              │  │ - rpId    │              │          │
│       │              │              │  │ - flags   │              │          │
│       │              │              │◄─┘           │              │          │
│       │              │              │              │              │          │
│       │              │  8. Create meta-transaction │              │          │
│       │              │              ├──────────────►              │          │
│       │              │              │              │              │          │
│       │              │              │  9. Sign & submit to chain  │          │
│       │              │              │              ├──────────────►          │
│       │              │              │              │              │          │
│       │              │              │              │  10. ACP-204 verify     │
│       │              │              │              │              ├──┐       │
│       │              │              │              │              │  │       │
│       │              │              │              │              │◄─┘       │
│       │              │              │              │              │          │
│       │              │              │  11. Execute action         │          │
│       │              │              │              │              ├──┐       │
│       │              │              │              │              │  │       │
│       │              │              │              │              │◄─┘       │
│       │              │              │              │              │          │
│       │              │              │  12. Transaction receipt    │          │
│       │              │              │◄─────────────┬──────────────┤          │
│       │              │              │              │              │          │
│       │  13. Success confirmation   │              │              │          │
│       │◄─────────────────────────────┤              │              │          │
│       │              │              │              │              │          │
└───────┴──────────────┴──────────────┴──────────────┴──────────────┴──────────┘
```

### 4.2 Challenge-Response Protocol

**Challenge Structure:**

```typescript
interface AuthenticationChallenge {
  // Core challenge data
  challenge: Uint8Array;        // 32 bytes random
  nonce: bigint;                // User-specific incrementing nonce
  expiresAt: number;            // Unix timestamp (5 min from creation)

  // Binding data (prevents cross-site attacks)
  rpId: string;                 // "rwa-gateway.app"
  origin: string;               // "https://rwa-gateway.app"

  // Action binding (prevents action substitution)
  intendedAction: {
    contract: string;           // Target contract address
    method: string;             // Function selector
    params: string;             // ABI-encoded parameters
  };
}
```

**Challenge Generation (Backend):**

```typescript
import { randomBytes } from 'crypto';
import { Redis } from 'ioredis';

async function generateChallenge(
  userId: string,
  intendedAction: IntendedAction,
  redis: Redis
): Promise<AuthenticationChallenge> {
  // Generate cryptographically secure random challenge
  const challenge = randomBytes(32);

  // Get next nonce for this user (atomic increment)
  const nonce = await redis.incr(`auth:nonce:${userId}`);

  // Set expiry (5 minutes)
  const expiresAt = Math.floor(Date.now() / 1000) + 300;

  const challengeData: AuthenticationChallenge = {
    challenge,
    nonce: BigInt(nonce),
    expiresAt,
    rpId: 'rwa-gateway.app',
    origin: 'https://rwa-gateway.app',
    intendedAction,
  };

  // Store challenge for later verification (TTL matches expiry)
  await redis.setex(
    `auth:challenge:${userId}:${nonce}`,
    300,
    JSON.stringify({
      challengeHash: sha256(challenge).toString('hex'),
      intendedAction,
      expiresAt,
    })
  );

  return challengeData;
}
```

**On-Chain Challenge Verification:**

```solidity
/// @notice Verify challenge has not been used and is not expired
/// @param user Address of the authenticating user
/// @param challengeHash Hash of the challenge
/// @param nonce User's authentication nonce
/// @param expiry Challenge expiry timestamp
function _verifyChallenge(
    address user,
    bytes32 challengeHash,
    uint256 nonce,
    uint256 expiry
) internal {
    // Check expiry
    require(block.timestamp < expiry, "Challenge expired");

    // Check nonce is exactly the expected next value
    require(nonce == authNonces[user], "Invalid nonce");

    // Increment nonce atomically (prevents replay)
    authNonces[user] = nonce + 1;

    // Emit for off-chain tracking
    emit ChallengeVerified(user, challengeHash, nonce);
}
```

### 4.3 Session Management Security

**Session Token Structure:**

```typescript
interface SessionToken {
  // JWT Claims
  sub: string;              // User ID (UUID)
  iss: string;              // "rwa-gateway.app"
  aud: string;              // "rwa-gateway-api"
  iat: number;              // Issued at timestamp
  exp: number;              // Expiry (15 minutes for active, 7 days for refresh)

  // Custom claims
  credentialId: string;     // WebAuthn credential ID (base64url)
  publicKeyHash: string;    // SHA256 of credential public key
  authMethod: 'webauthn' | 'metamask';
  tier: number;             // KYC tier (0-3)

  // Security claims
  jti: string;              // JWT ID (for revocation tracking)
  deviceFingerprint: string; // Browser fingerprint hash
}
```

**Redis Session Schema:**

```typescript
// Session storage structure
interface SessionData {
  userId: string;
  credentialId: string;
  publicKey: {
    x: string;  // hex
    y: string;  // hex
  };
  tier: number;
  createdAt: number;
  lastActivity: number;
  deviceInfo: {
    userAgent: string;
    ip: string;  // hashed
    fingerprint: string;
  };
  isRevoked: boolean;
}

// Redis key patterns
const SESSION_KEY = `session:${sessionId}`;           // TTL: 15 min
const REFRESH_KEY = `refresh:${refreshTokenId}`;      // TTL: 7 days
const USER_SESSIONS = `user:sessions:${userId}`;      // Set of active sessions
const REVOKED_TOKENS = `revoked:${jti}`;              // For logout/revocation
```

**Session Security Rules:**

| Rule | Implementation |
|------|----------------|
| Short-lived access tokens | 15-minute TTL, refresh required |
| Secure refresh rotation | New refresh token on each use |
| Device binding | Validate fingerprint on each request |
| Concurrent session limit | Max 5 sessions per user |
| Anomaly detection | Flag IP/geo changes |
| Revocation propagation | Redis pub/sub for immediate invalidation |

### 4.4 Signature Relay Architecture

**Relayer Transaction Flow:**

```
┌─────────────────────────────────────────────────────────────────────┐
│                    SIGNATURE RELAY ARCHITECTURE                      │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  CLIENT SIDE:                                                        │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │  1. User signs with WebAuthn                                   │ │
│  │  2. Client extracts: authenticatorData, clientDataJSON, sig    │ │
│  │  3. Client packages: action + signature + credential info      │ │
│  │  4. POST to /api/relay with session JWT                        │ │
│  └────────────────────────────────────────────────────────────────┘ │
│                              │                                       │
│                              ▼                                       │
│  BACKEND VALIDATION:                                                 │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │  1. Verify JWT session is valid                                │ │
│  │  2. Verify action matches intended action from challenge       │ │
│  │  3. Pre-verify signature format (catch errors early)           │ │
│  │  4. Rate limit check (user + global)                           │ │
│  │  5. Queue for relayer                                          │ │
│  └────────────────────────────────────────────────────────────────┘ │
│                              │                                       │
│                              ▼                                       │
│  RELAYER SERVICE:                                                    │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │  1. Construct meta-transaction:                                │ │
│  │     - BiometricRegistry.authenticateAndExecute(...)            │ │
│  │     - Encode: user, action, sig, authenticatorData, nonce      │ │
│  │                                                                │ │
│  │  2. Gas estimation + buffer (10%)                              │ │
│  │                                                                │ │
│  │  3. Sign with relayer EOA key                                  │ │
│  │                                                                │ │
│  │  4. Submit to Avalanche C-Chain                                │ │
│  │                                                                │ │
│  │  5. Wait for confirmation (2 blocks)                           │ │
│  │                                                                │ │
│  │  6. Return tx hash to backend                                  │ │
│  └────────────────────────────────────────────────────────────────┘ │
│                              │                                       │
│                              ▼                                       │
│  ON-CHAIN EXECUTION:                                                 │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │  1. BiometricRegistry receives meta-tx                         │ │
│  │  2. Reconstruct message hash from authenticatorData + action   │ │
│  │  3. Call ACP-204 precompile for P-256 verification             │ │
│  │  4. Verify nonce matches on-chain counter                      │ │
│  │  5. Execute intended action via internal call                  │ │
│  │  6. Emit AuthenticationSuccessful event                        │ │
│  └────────────────────────────────────────────────────────────────┘ │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 5. Security Architecture

### 5.1 Comprehensive Threat Model

| Threat | Attack Vector | Likelihood | Impact | Mitigation |
|--------|---------------|------------|--------|------------|
| **Signature Replay** | Reuse valid signature | High | Critical | On-chain nonce + challenge expiry |
| **Front-running** | MEV bot intercepts tx | Medium | High | Relayer submission + commit-reveal for high-value ops |
| **Key Extraction** | Compromise secure enclave | Very Low | Critical | Hardware attestation + device binding |
| **Signature Forgery** | Generate valid sig without key | Negligible | Critical | Cryptographic (P-256 128-bit security) |
| **Relayer Compromise** | Steal relayer private key | Low | High | HSM storage + rate limits + multi-sig for upgrades |
| **Session Hijacking** | Steal JWT token | Medium | High | Short TTL + device fingerprint + secure cookies |
| **Phishing** | Fake site captures credentials | High | High | WebAuthn origin binding + user education |
| **Smart Contract Bug** | Logic vulnerability | Medium | Critical | Audits + formal verification + bug bounty |
| **Oracle Manipulation** | Feed false price data | Medium | High | Multiple oracles + TWAP + bounds checking |
| **DoS on Relayer** | Flood with requests | High | Medium | Rate limiting + CAPTCHA + priority queue |
| **Reentrancy** | Recursive call exploit | Medium | Critical | ReentrancyGuard + CEI pattern |
| **Credential Theft** | Steal encrypted credential | Low | Medium | eERC encryption + no plaintext storage |

### 5.2 Defense in Depth Strategy

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         DEFENSE IN DEPTH LAYERS                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ╔═══════════════════════════════════════════════════════════════════════╗  │
│  ║  LAYER 6: APPLICATION SECURITY                                        ║  │
│  ║  ├── Input validation (all user data sanitized)                       ║  │
│  ║  ├── Output encoding (XSS prevention)                                 ║  │
│  ║  ├── CORS policy (allowlist origins only)                             ║  │
│  ║  ├── CSP headers (strict script sources)                              ║  │
│  ║  └── Rate limiting (per-user + per-IP + global)                       ║  │
│  ╠═══════════════════════════════════════════════════════════════════════╣  │
│  ║  LAYER 5: AUTHENTICATION & AUTHORIZATION                              ║  │
│  ║  ├── WebAuthn (hardware-backed, phishing-resistant)                   ║  │
│  ║  ├── On-chain signature verification (ACP-204)                        ║  │
│  ║  ├── Role-based access control (OpenZeppelin AccessControl)           ║  │
│  ║  └── Credential-based gating (CredentialVerifier)                     ║  │
│  ╠═══════════════════════════════════════════════════════════════════════╣  │
│  ║  LAYER 4: SMART CONTRACT SECURITY                                     ║  │
│  ║  ├── ReentrancyGuard on all external functions                        ║  │
│  ║  ├── Pausable for emergency stops                                     ║  │
│  ║  ├── Checks-Effects-Interactions pattern                              ║  │
│  ║  ├── Safe math (Solidity 0.8+ overflow checks)                        ║  │
│  ║  └── Upgradeability via UUPS (minimal proxy)                          ║  │
│  ╠═══════════════════════════════════════════════════════════════════════╣  │
│  ║  LAYER 3: CRYPTOGRAPHIC SECURITY                                      ║  │
│  ║  ├── secp256r1 (P-256) for biometric signatures                       ║  │
│  ║  ├── SHA-256 for hashing                                              ║  │
│  ║  ├── AES-256-GCM for data at rest                                     ║  │
│  ║  ├── eERC (ElGamal + zk-SNARKs) for encrypted balances                ║  │
│  ║  └── CSPRNG for all random values                                     ║  │
│  ╠═══════════════════════════════════════════════════════════════════════╣  │
│  ║  LAYER 2: NETWORK SECURITY                                            ║  │
│  ║  ├── TLS 1.3 for all connections                                      ║  │
│  ║  ├── WAF (Web Application Firewall)                                   ║  │
│  ║  ├── DDoS protection (Vercel Edge + Cloudflare)                       ║  │
│  ║  └── Private RPC endpoints (Alchemy/Infura with API keys)             ║  │
│  ╠═══════════════════════════════════════════════════════════════════════╣  │
│  ║  LAYER 1: INFRASTRUCTURE SECURITY                                     ║  │
│  ║  ├── Environment secrets (Vercel encrypted)                           ║  │
│  ║  ├── Database encryption at rest (Supabase)                           ║  │
│  ║  ├── Minimal IAM permissions                                          ║  │
│  ║  └── Audit logging (all admin actions)                                ║  │
│  ╚═══════════════════════════════════════════════════════════════════════╝  │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 5.3 Attack Vector Deep Dives

**5.3.1 Signature Replay Prevention**

```solidity
/// @notice Replay protection via incrementing nonce
/// @dev Each successful authentication increments user's nonce
mapping(address => uint256) public authNonces;

/// @notice Verify and consume nonce atomically
function _consumeNonce(address user, uint256 providedNonce) internal {
    uint256 expectedNonce = authNonces[user];

    // Strict equality check (no gaps allowed)
    require(providedNonce == expectedNonce, "Invalid nonce");

    // Increment BEFORE any external calls (CEI pattern)
    authNonces[user] = expectedNonce + 1;
}
```

**5.3.2 Front-running Protection**

For high-value operations (large investments, redemptions), implement commit-reveal:

```solidity
/// @notice Commit hash of intended action
mapping(bytes32 => uint256) public commitments;
uint256 public constant COMMIT_DELAY = 2; // blocks

function commit(bytes32 commitHash) external {
    commitments[commitHash] = block.number;
}

function reveal(
    bytes calldata action,
    bytes32 salt
) external {
    bytes32 commitHash = keccak256(abi.encodePacked(action, salt, msg.sender));
    uint256 commitBlock = commitments[commitHash];

    require(commitBlock > 0, "No commitment");
    require(block.number >= commitBlock + COMMIT_DELAY, "Too early");
    require(block.number < commitBlock + COMMIT_DELAY + 50, "Expired");

    delete commitments[commitHash];

    // Execute action
    _executeAction(action);
}
```

**5.3.3 Reentrancy Prevention Pattern**

```solidity
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract SecureContract is ReentrancyGuard {
    /// @notice Safe withdrawal following CEI pattern
    function withdraw(uint256 amount) external nonReentrant {
        // 1. CHECKS
        require(balances[msg.sender] >= amount, "Insufficient");

        // 2. EFFECTS (state changes BEFORE external calls)
        balances[msg.sender] -= amount;

        // 3. INTERACTIONS (external calls LAST)
        (bool success, ) = msg.sender.call{value: amount}("");
        require(success, "Transfer failed");
    }
}
```

---

## 6. Cryptographic Security

### 6.1 Key Generation Workflows

**WebAuthn Credential Creation (Client-Side):**

```typescript
import { startRegistration } from '@simplewebauthn/browser';

async function registerBiometric(
  userId: string,
  challenge: Uint8Array
): Promise<RegistrationCredential> {
  const registrationOptions: PublicKeyCredentialCreationOptions = {
    challenge,

    rp: {
      name: 'RWA Gateway',
      id: 'rwa-gateway.app',
    },

    user: {
      id: new TextEncoder().encode(userId),
      name: userEmail,
      displayName: userName,
    },

    // CRITICAL: Only allow P-256 curve (ES256)
    pubKeyCredParams: [
      { alg: -7, type: 'public-key' },  // ES256 = ECDSA with P-256
    ],

    // Require platform authenticator (Secure Enclave / TPM)
    authenticatorSelection: {
      authenticatorAttachment: 'platform',
      residentKey: 'required',
      userVerification: 'required',
    },

    // Request direct attestation for device verification
    attestation: 'direct',

    timeout: 60000,
  };

  const credential = await startRegistration(registrationOptions);

  // Extract public key coordinates from credential
  const publicKey = extractPublicKeyCoordinates(
    credential.response.getPublicKey()
  );

  return {
    credentialId: credential.id,
    publicKeyX: publicKey.x,
    publicKeyY: publicKey.y,
    attestation: credential.response.attestationObject,
  };
}

function extractPublicKeyCoordinates(
  publicKeyBuffer: ArrayBuffer
): { x: Uint8Array; y: Uint8Array } {
  // COSE key format parsing
  const publicKeyBytes = new Uint8Array(publicKeyBuffer);

  // For P-256 uncompressed point: 0x04 || x (32 bytes) || y (32 bytes)
  if (publicKeyBytes[0] === 0x04 && publicKeyBytes.length === 65) {
    return {
      x: publicKeyBytes.slice(1, 33),
      y: publicKeyBytes.slice(33, 65),
    };
  }

  throw new Error('Unsupported public key format');
}
```

### 6.2 Signature Schemes

**Comparison of Supported Schemes:**

| Scheme | Curve | Algorithm | Use Case | Security | Gas (Avalanche) |
|--------|-------|-----------|----------|----------|-----------------|
| ES256 | secp256r1 (P-256) | ECDSA | WebAuthn/Passkeys | 128-bit | ~3,450 (ACP-204) |
| secp256k1 | secp256k1 | ECDSA | Ethereum EOA | 128-bit | ~3,000 (ecrecover) |
| Ed25519 | Curve25519 | EdDSA | Future support | 128-bit | N/A (no precompile) |

**ES256 Signature Format:**

```
┌─────────────────────────────────────────────────────────────────────┐
│                    ES256 SIGNATURE STRUCTURE                         │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  DER Encoding (from WebAuthn):                                       │
│  ┌────┬────┬─────────────────────┬────┬─────────────────────┐       │
│  │0x30│ len│      r (+ padding)  │0x02│      s (+ padding)  │       │
│  └────┴────┴─────────────────────┴────┴─────────────────────┘       │
│                                                                      │
│  Decoded for Solidity (64 bytes):                                    │
│  ┌─────────────────────────────┬─────────────────────────────┐      │
│  │      r (32 bytes, big-endian)│      s (32 bytes, big-endian)│    │
│  └─────────────────────────────┴─────────────────────────────┘      │
│                                                                      │
│  Note: WebAuthn may use DER encoding with variable-length integers. │
│  Must parse and normalize to fixed 32-byte values for precompile.   │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### 6.3 Secure Random Number Generation

**Requirements by Context:**

| Context | Source | Entropy | Notes |
|---------|--------|---------|-------|
| Server (Node.js) | `crypto.randomBytes()` | /dev/urandom | CSPRNG, OS-level entropy |
| Browser | `crypto.getRandomValues()` | Web Crypto API | CSPRNG, browser-level |
| Smart Contract | Block data + user input | See below | Cannot be truly random |

**On-Chain Randomness Strategy:**

```solidity
/// @notice Generate pseudo-random value with user commitment
/// @dev NOT suitable for high-stakes randomness (use Chainlink VRF for that)
/// @param userCommitment User-provided random value (committed beforehand)
/// @return Random-ish value (unpredictable to miners if commitment is secret)
function generateOnChainRandom(
    bytes32 userCommitment
) internal view returns (bytes32) {
    return keccak256(abi.encodePacked(
        block.prevrandao,      // Post-merge: RANDAO from beacon chain
        block.timestamp,       // Adds time variance
        block.number,          // Adds block variance
        msg.sender,            // User-specific
        userCommitment         // User's secret contribution
    ));
}
```

**Critical Warning:** On-chain randomness is predictable to some degree. For lottery/raffle features, use Chainlink VRF or similar oracle-based solution.

---

## 7. Operational Security

### 7.1 Key Ceremony Procedures

**Contract Deployment Key Ceremony:**

```
┌─────────────────────────────────────────────────────────────────────┐
│                    KEY CEREMONY PROTOCOL                             │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  PARTICIPANTS: 3 key holders (2-of-3 threshold)                     │
│  LOCATION: Secure, physically separate locations                    │
│  DOCUMENTATION: Video recording + signed attestations               │
│                                                                      │
│  STEP 1: KEY GENERATION                                             │
│  ├── Each holder generates key on air-gapped laptop                 │
│  ├── Keys generated on hardware wallet (Ledger Nano X)              │
│  ├── Seed phrase written on metal backup (no digital copy)          │
│  └── Verify key derivation path: m/44'/60'/0'/0/0                   │
│                                                                      │
│  STEP 2: MULTI-SIG SETUP                                            │
│  ├── Create Gnosis Safe with 2-of-3 threshold                       │
│  ├── Each holder adds their address                                 │
│  ├── Verify Safe address on block explorer                          │
│  └── Test: Execute dummy transaction requiring 2 signatures         │
│                                                                      │
│  STEP 3: CONTRACT DEPLOYMENT                                        │
│  ├── Deploy contracts from multi-sig                                │
│  ├── Transfer ownership to multi-sig                                │
│  ├── Verify ownership transfer on chain                             │
│  └── Renounce deployer privileges                                   │
│                                                                      │
│  STEP 4: VERIFICATION                                               │
│  ├── Independent verification of contract bytecode                  │
│  ├── Verify source on Snowtrace                                     │
│  ├── Document all addresses and tx hashes                           │
│  └── Publish ceremony report                                        │
│                                                                      │
│  POST-CEREMONY:                                                      │
│  ├── Hardware wallets stored in separate secure locations           │
│  ├── Metal backups stored in bank safe deposit boxes                │
│  └── Annual key verification (prove possession without exposure)    │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### 7.2 Incident Response

**Severity Classification:**

| Severity | Description | Response Time | Example |
|----------|-------------|---------------|---------|
| **P0** | Active exploit, funds at risk | 15 minutes | Reentrancy attack draining funds |
| **P1** | Critical vulnerability discovered | 1 hour | Unpatched bug reported via bounty |
| **P2** | Security degradation | 4 hours | Relayer key exposed (not used yet) |
| **P3** | Minor security issue | 24 hours | Non-critical audit finding |

**P0 Response Playbook:**

```
┌─────────────────────────────────────────────────────────────────────┐
│                    P0 INCIDENT RESPONSE                              │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  T+0min: DETECTION                                                   │
│  ├── Alert triggered (monitoring / user report / security firm)     │
│  └── On-call engineer acknowledges                                  │
│                                                                      │
│  T+5min: CONTAINMENT                                                 │
│  ├── Execute emergency pause on affected contracts                  │
│  │   └── Multi-sig holders alerted via Signal                       │
│  ├── If single-sig pause available: Use immediately                 │
│  └── Notify core team via emergency channel                         │
│                                                                      │
│  T+15min: WAR ROOM                                                   │
│  ├── Video call with: CTO, Lead Dev, Security Lead                  │
│  ├── Assess: What is affected? How much at risk?                    │
│  ├── Investigate: Root cause analysis begins                        │
│  └── Decide: Can we fix without unpause? Need external help?        │
│                                                                      │
│  T+1hr: COMMUNICATION                                                │
│  ├── Internal: All-hands brief (facts only, no speculation)         │
│  ├── External: Twitter/Discord status update                        │
│  │   └── "We are aware of an issue and have paused contracts.       │
│  │        Funds are safe. Investigation ongoing."                   │
│  └── If user funds affected: Individual notification plan           │
│                                                                      │
│  T+4hr: RESOLUTION                                                   │
│  ├── Fix developed and reviewed                                     │
│  ├── Test on fork of mainnet state                                  │
│  ├── Multi-sig approval for upgrade/unpause                         │
│  └── Deploy fix                                                     │
│                                                                      │
│  T+24hr: POST-MORTEM                                                 │
│  ├── Written report: Timeline, root cause, impact, fix              │
│  ├── Public disclosure (if appropriate)                             │
│  └── Process improvements documented                                │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### 7.3 Compliance Framework

**Regulatory Considerations:**

| Regulation | Requirement | RWA Gateway Implementation |
|------------|-------------|---------------------------|
| **GDPR** | Right to erasure | Off-chain PII only; on-chain data is pseudonymous hashes |
| **SEC** | Accredited investor verification | CredentialVerifier + KYC provider integration |
| **AML/KYC** | Identity verification | Tier-based KYC via Jumio/Onfido integration |
| **OFAC** | Sanctions screening | Jurisdiction blocking in CredentialVerifier |
| **SOC 2** | Security controls | Audit logging, access controls, encryption |

**Data Flow for Compliance:**

```
┌─────────────────────────────────────────────────────────────────────┐
│                    COMPLIANCE DATA FLOW                              │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  USER PII (Off-Chain Only):                                          │
│  ├── Name, DOB, Address → Encrypted in PostgreSQL                   │
│  ├── ID documents → Stored by KYC provider (Jumio)                  │
│  └── NEVER on blockchain                                            │
│                                                                      │
│  ON-CHAIN DATA (Pseudonymous):                                       │
│  ├── Wallet address (not linked to PII on-chain)                    │
│  ├── Encrypted credentials (eERC - no plaintext)                    │
│  ├── Transaction history (amounts encrypted if eERC)                │
│  └── Compliance tier (0-3, no PII)                                  │
│                                                                      │
│  AUDIT TRAIL:                                                        │
│  ├── All admin actions logged with timestamp + actor                │
│  ├── KYC verification results (pass/fail, no raw data)              │
│  ├── Transaction authorization events                               │
│  └── Retention: 7 years (regulatory requirement)                    │
│                                                                      │
│  REGULATORY REQUEST HANDLING:                                        │
│  ├── Subpoena: Legal review → Provide only what's required          │
│  ├── Auditor: Use rotatable auditor key for selective disclosure    │
│  └── User request: Export their data (GDPR Art. 15)                 │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Appendix A: Pre-Deployment Security Checklist

```
╔═══════════════════════════════════════════════════════════════════════╗
║                PRE-DEPLOYMENT SECURITY CHECKLIST                       ║
╠═══════════════════════════════════════════════════════════════════════╣
║                                                                        ║
║  SMART CONTRACTS                                                       ║
║  [ ] All external/public functions have access control                 ║
║  [ ] ReentrancyGuard on functions with external calls                 ║
║  [ ] Pausable modifier on critical functions                          ║
║  [ ] Slither analysis: 0 high/critical findings                       ║
║  [ ] Mythril analysis: 0 high/critical findings                       ║
║  [ ] Test coverage ≥ 95%                                              ║
║  [ ] All tests pass on Fuji testnet                                   ║
║  [ ] Gas usage within acceptable limits                               ║
║  [ ] Contracts verified on Snowtrace                                  ║
║  [ ] Upgrade path tested (UUPS proxy)                                 ║
║  [ ] Emergency pause tested                                           ║
║  [ ] Multi-sig ownership confirmed                                    ║
║                                                                        ║
║  BACKEND                                                               ║
║  [ ] All secrets in environment variables (not in code)               ║
║  [ ] JWT secret is ≥ 256 bits and rotated from default                ║
║  [ ] Rate limiting enabled on all endpoints                           ║
║  [ ] Input validation on all user-supplied data                       ║
║  [ ] SQL injection prevention (parameterized queries)                 ║
║  [ ] CORS configured (allowlist only)                                 ║
║  [ ] CSP headers set                                                  ║
║  [ ] Error messages don't leak sensitive info                         ║
║  [ ] Dependency audit: `npm audit` shows 0 high/critical              ║
║                                                                        ║
║  INFRASTRUCTURE                                                        ║
║  [ ] TLS 1.3 enforced                                                 ║
║  [ ] Database encrypted at rest                                       ║
║  [ ] Backups configured and tested                                    ║
║  [ ] Monitoring alerts active                                         ║
║  [ ] Incident response plan documented                                ║
║  [ ] DDoS protection enabled                                          ║
║                                                                        ║
║  CRYPTOGRAPHIC                                                         ║
║  [ ] ACP-204 precompile tested on Fuji                                ║
║  [ ] Test vectors validated against reference implementation          ║
║  [ ] Key generation uses CSPRNG                                       ║
║  [ ] No hardcoded keys or secrets                                     ║
║  [ ] WebAuthn RP ID matches production domain                         ║
║                                                                        ║
║  OPERATIONAL                                                           ║
║  [ ] Key ceremony completed and documented                            ║
║  [ ] Multi-sig holders geographically distributed                     ║
║  [ ] Runbook for common operations documented                         ║
║  [ ] On-call rotation established                                     ║
║  [ ] Bug bounty program launched                                      ║
║                                                                        ║
╚═══════════════════════════════════════════════════════════════════════╝
```

---

## Appendix B: Attack Vectors Quick Reference

| Attack | Target | Prevention | Detection |
|--------|--------|------------|-----------|
| Replay | Signatures | Nonce + expiry | Duplicate nonce alert |
| Front-running | Transactions | Commit-reveal, private mempool | MEV monitoring |
| Reentrancy | Contracts | ReentrancyGuard + CEI | Static analysis |
| Flash loan | DeFi integrations | Require same-block check | Unusual volume |
| Oracle manipulation | Price feeds | Multiple oracles + TWAP | Price deviation alert |
| Phishing | Users | WebAuthn origin binding | User reports |
| DoS | API/Relayer | Rate limiting | Request spike alert |
| Injection (SQL/XSS) | Backend | Parameterized queries, encoding | WAF logs |
| Session hijacking | JWT | Short TTL, fingerprinting | Session anomaly |
| Privilege escalation | Access control | Minimal permissions, audit | Role change alerts |
| Key compromise | Private keys | HSM, multi-sig | Unauthorized tx alert |
| Supply chain | Dependencies | Lockfile, audit, Snyk | CI/CD scan |

---

## Appendix C: Glossary

| Term | Definition |
|------|------------|
| **ACP-204** | Avalanche Community Proposal 204; adds secp256r1 precompile |
| **CEI** | Checks-Effects-Interactions pattern for reentrancy prevention |
| **CSPRNG** | Cryptographically Secure Pseudo-Random Number Generator |
| **eERC** | Encrypted ERC; Avalanche's privacy-preserving token standard |
| **ElGamal** | Public-key cryptosystem; basis for eERC encryption |
| **HSM** | Hardware Security Module; secure key storage |
| **MEV** | Maximal Extractable Value; profit from transaction ordering |
| **RPID** | Relying Party Identifier; domain binding in WebAuthn |
| **secp256r1** | NIST P-256 curve; used by WebAuthn/Passkeys |
| **UUPS** | Universal Upgradeable Proxy Standard; upgrade pattern |
| **WebAuthn** | Web Authentication API; enables biometric auth in browsers |
| **zk-SNARK** | Zero-Knowledge Succinct Non-Interactive Argument of Knowledge |

---

## Document Control

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-02-05 | RWA Gateway Team | Initial release |

---

*Next: [Architecture Index](./ARCHITECTURE-INDEX.md) - Master navigation for all architecture documents*
