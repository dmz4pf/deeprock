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
     * @param counter Expected counter value (must match stored counter exactly)
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

        // Security: Exact counter match prevents replay attacks
        if (counter != identity.counter) revert CounterTooLow();

        // CEI Pattern: Increment counter BEFORE verification to prevent reentrancy
        uint32 newCounter = counter + 1;
        identity.counter = newCounter;

        valid = P256Verifier.verify(
            messageHash,
            r,
            s,
            identity.publicKeyX,
            identity.publicKeyY
        );

        if (valid) {
            identity.lastUsed = uint64(block.timestamp);
            emit IdentityVerified(user, newCounter, block.timestamp);
        } else {
            // Revert counter if verification failed (rare case)
            identity.counter = counter;
        }
    }

    /**
     * @notice Verify a WebAuthn assertion
     * @param user The user whose signature to verify
     * @param authenticatorData The authenticator data from WebAuthn
     * @param clientDataHash SHA256 hash of clientDataJSON
     * @param r Signature r component
     * @param s Signature s component
     * @param counter Expected counter value (must match stored counter exactly)
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

        // Security: Exact counter match prevents replay attacks
        if (counter != identity.counter) revert CounterTooLow();

        // CEI Pattern: Increment counter BEFORE verification to prevent reentrancy
        uint32 newCounter = counter + 1;
        identity.counter = newCounter;

        valid = P256Verifier.verifyWebAuthn(
            authenticatorData,
            clientDataHash,
            r,
            s,
            identity.publicKeyX,
            identity.publicKeyY
        );

        if (valid) {
            identity.lastUsed = uint64(block.timestamp);
            emit IdentityVerified(user, newCounter, block.timestamp);
        } else {
            // Revert counter if verification failed (rare case)
            identity.counter = counter;
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
