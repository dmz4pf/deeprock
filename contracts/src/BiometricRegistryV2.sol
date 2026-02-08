// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./libraries/P256Verifier.sol";

/**
 * @title BiometricRegistryV2
 * @notice Multi-passkey identity layer for RWA Gateway - supports up to 10 credentials per user
 * @dev Upgraded from V1 to support multiple passkeys for device backup/recovery
 *      Each user can register multiple P-256 public keys from different devices
 */
contract BiometricRegistryV2 is Ownable, Pausable, ReentrancyGuard {
    using P256Verifier for *;

    /// @notice Maximum credentials allowed per user
    uint8 public constant MAX_CREDENTIALS = 10;

    /// @notice Individual credential data
    struct Credential {
        bytes32 publicKeyX;      // P-256 public key X coordinate
        bytes32 publicKeyY;      // P-256 public key Y coordinate
        bytes32 credentialId;    // WebAuthn credential ID hash
        uint64 addedAt;          // When credential was added
        uint32 counter;          // Signature counter (replay protection)
        bool active;             // Credential status
    }

    /// @notice Credential index lookup (for O(1) lookup by credentialId)
    struct CredentialIndex {
        address user;
        uint8 index;
        bool exists;
    }

    /// @notice User address => array of credentials
    mapping(address => Credential[]) public credentials;

    /// @notice Credential ID => CredentialIndex (reverse lookup)
    mapping(bytes32 => CredentialIndex) private credentialIndex;

    /// @notice Trusted relayers that can submit meta-transactions
    mapping(address => bool) public trustedRelayers;

    /// @notice Used nonces for meta-transactions
    mapping(address => mapping(uint256 => bool)) public usedNonces;

    /// @notice Total registered users (unique addresses with at least one credential)
    uint256 public totalUsers;

    // Events
    event CredentialAdded(
        address indexed user,
        bytes32 indexed credentialId,
        uint8 credentialIndex,
        bytes32 publicKeyX,
        bytes32 publicKeyY,
        uint256 timestamp
    );

    event CredentialRemoved(
        address indexed user,
        bytes32 indexed credentialId,
        uint8 credentialIndex,
        uint256 timestamp
    );

    event CredentialVerified(
        address indexed user,
        bytes32 indexed credentialId,
        uint32 newCounter,
        uint256 timestamp
    );

    event RelayerUpdated(address indexed relayer, bool trusted);

    // Errors
    error MaxCredentialsReached();
    error CredentialAlreadyExists();
    error CredentialNotFound();
    error CredentialNotActive();
    error InvalidSignature();
    error InvalidPublicKey();
    error InvalidCredentialId();
    error CounterTooLow();
    error NonceAlreadyUsed();
    error NotTrustedRelayer();
    error DeadlineExpired();
    error InvalidCredentialIndex();
    error NoCredentials();

    constructor() Ownable(msg.sender) {}

    // ==================== Credential Management ====================

    /**
     * @notice Add a new passkey credential (direct call)
     * @param publicKeyX X coordinate of P-256 public key
     * @param publicKeyY Y coordinate of P-256 public key
     * @param credentialId WebAuthn credential ID hash
     */
    function addCredential(
        bytes32 publicKeyX,
        bytes32 publicKeyY,
        bytes32 credentialId
    ) external whenNotPaused {
        _addCredential(msg.sender, publicKeyX, publicKeyY, credentialId);
    }

    /**
     * @notice Add credential via relayer (meta-transaction)
     * @dev User signs with the NEW passkey they're registering
     */
    function addCredentialViaRelayer(
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

        // Verify signature with the new public key being registered
        bytes32 messageHash = keccak256(abi.encodePacked(
            "ADD_CREDENTIAL",
            user,
            publicKeyX,
            publicKeyY,
            credentialId,
            deadline,
            nonce,
            block.chainid
        ));

        bool valid = P256Verifier.verify(messageHash, r, s, publicKeyX, publicKeyY);
        if (!valid) revert InvalidSignature();

        usedNonces[user][nonce] = true;
        _addCredential(user, publicKeyX, publicKeyY, credentialId);
    }

    /**
     * @notice Remove a credential by index
     * @param credentialIndex Index in the credentials array
     */
    function removeCredential(uint8 credentialIndex) external {
        _removeCredential(msg.sender, credentialIndex);
    }

    /**
     * @notice Remove credential via existing passkey signature
     * @dev User must sign with ANOTHER active credential to remove one
     */
    function removeCredentialWithSignature(
        uint8 removeIndex,
        uint8 signIndex,
        bytes32 messageHash,
        bytes32 r,
        bytes32 s,
        uint32 counter
    ) external whenNotPaused {
        Credential[] storage userCreds = credentials[msg.sender];
        if (removeIndex >= userCreds.length) revert InvalidCredentialIndex();
        if (signIndex >= userCreds.length) revert InvalidCredentialIndex();
        if (removeIndex == signIndex) revert InvalidCredentialIndex(); // Can't remove using same credential

        Credential storage signCred = userCreds[signIndex];
        if (!signCred.active) revert CredentialNotActive();
        if (counter != signCred.counter) revert CounterTooLow();

        // Verify signature
        bool valid = P256Verifier.verify(
            messageHash,
            r,
            s,
            signCred.publicKeyX,
            signCred.publicKeyY
        );
        if (!valid) revert InvalidSignature();

        // Update counter
        signCred.counter = counter + 1;

        _removeCredential(msg.sender, removeIndex);
    }

    // ==================== Verification ====================

    /**
     * @notice Verify signature using a specific credential (by index hint)
     * @param user User whose credential to verify
     * @param credentialIndexHint Suggested index (for O(1) lookup)
     * @param messageHash Hash of the message that was signed
     * @param r Signature r component
     * @param s Signature s component
     * @param counter Expected counter value
     * @return valid True if signature is valid
     */
    function verifyWithCredential(
        address user,
        uint8 credentialIndexHint,
        bytes32 messageHash,
        bytes32 r,
        bytes32 s,
        uint32 counter
    ) external whenNotPaused returns (bool valid) {
        Credential[] storage userCreds = credentials[user];
        if (userCreds.length == 0) revert NoCredentials();

        // Try hint first (O(1))
        if (credentialIndexHint < userCreds.length) {
            Credential storage cred = userCreds[credentialIndexHint];
            if (cred.active && cred.counter == counter) {
                valid = P256Verifier.verify(
                    messageHash,
                    r,
                    s,
                    cred.publicKeyX,
                    cred.publicKeyY
                );
                if (valid) {
                    cred.counter = counter + 1;
                    emit CredentialVerified(user, cred.credentialId, counter + 1, block.timestamp);
                    return true;
                }
            }
        }

        // Fallback: linear search through all credentials
        for (uint8 i = 0; i < userCreds.length; i++) {
            if (i == credentialIndexHint) continue; // Already tried

            Credential storage cred = userCreds[i];
            if (!cred.active || cred.counter != counter) continue;

            valid = P256Verifier.verify(
                messageHash,
                r,
                s,
                cred.publicKeyX,
                cred.publicKeyY
            );

            if (valid) {
                cred.counter = counter + 1;
                emit CredentialVerified(user, cred.credentialId, counter + 1, block.timestamp);
                return true;
            }
        }

        revert InvalidSignature();
    }

    /**
     * @notice Verify WebAuthn assertion with credential hint
     */
    function verifyWebAuthnWithCredential(
        address user,
        uint8 credentialIndexHint,
        bytes calldata authenticatorData,
        bytes32 clientDataHash,
        bytes32 r,
        bytes32 s,
        uint32 counter
    ) external whenNotPaused returns (bool valid) {
        Credential[] storage userCreds = credentials[user];
        if (userCreds.length == 0) revert NoCredentials();

        // Try hint first
        if (credentialIndexHint < userCreds.length) {
            Credential storage cred = userCreds[credentialIndexHint];
            if (cred.active && cred.counter == counter) {
                valid = P256Verifier.verifyWebAuthn(
                    authenticatorData,
                    clientDataHash,
                    r,
                    s,
                    cred.publicKeyX,
                    cred.publicKeyY
                );
                if (valid) {
                    cred.counter = counter + 1;
                    emit CredentialVerified(user, cred.credentialId, counter + 1, block.timestamp);
                    return true;
                }
            }
        }

        // Fallback: linear search
        for (uint8 i = 0; i < userCreds.length; i++) {
            if (i == credentialIndexHint) continue;

            Credential storage cred = userCreds[i];
            if (!cred.active || cred.counter != counter) continue;

            valid = P256Verifier.verifyWebAuthn(
                authenticatorData,
                clientDataHash,
                r,
                s,
                cred.publicKeyX,
                cred.publicKeyY
            );

            if (valid) {
                cred.counter = counter + 1;
                emit CredentialVerified(user, cred.credentialId, counter + 1, block.timestamp);
                return true;
            }
        }

        revert InvalidSignature();
    }

    /**
     * @notice View-only signature verification (no state changes)
     */
    function verifyView(
        address user,
        bytes32 messageHash,
        bytes32 r,
        bytes32 s
    ) external view returns (bool valid, uint8 credIndex) {
        Credential[] storage userCreds = credentials[user];

        for (uint8 i = 0; i < userCreds.length; i++) {
            Credential storage cred = userCreds[i];
            if (!cred.active) continue;

            valid = P256Verifier.verify(
                messageHash,
                r,
                s,
                cred.publicKeyX,
                cred.publicKeyY
            );

            if (valid) {
                return (true, i);
            }
        }

        return (false, 0);
    }

    // ==================== View Functions ====================

    /**
     * @notice Get all credentials for a user
     */
    function getCredentials(address user) external view returns (Credential[] memory) {
        return credentials[user];
    }

    /**
     * @notice Get active credential count for a user
     */
    function getActiveCredentialCount(address user) external view returns (uint8 count) {
        Credential[] storage userCreds = credentials[user];
        for (uint8 i = 0; i < userCreds.length; i++) {
            if (userCreds[i].active) count++;
        }
    }

    /**
     * @notice Get credential by index
     */
    function getCredential(address user, uint8 index) external view returns (Credential memory) {
        if (index >= credentials[user].length) revert InvalidCredentialIndex();
        return credentials[user][index];
    }

    /**
     * @notice Lookup user and index by credential ID
     */
    function lookupCredential(bytes32 credentialId) external view returns (
        address user,
        uint8 index,
        bool exists
    ) {
        CredentialIndex storage idx = credentialIndex[credentialId];
        return (idx.user, idx.index, idx.exists);
    }

    /**
     * @notice Check if user has any active credentials
     */
    function hasActiveCredential(address user) external view returns (bool) {
        Credential[] storage userCreds = credentials[user];
        for (uint8 i = 0; i < userCreds.length; i++) {
            if (userCreds[i].active) return true;
        }
        return false;
    }

    /**
     * @notice Get total credential count (including inactive)
     */
    function getCredentialCount(address user) external view returns (uint256) {
        return credentials[user].length;
    }

    // ==================== Admin Functions ====================

    /**
     * @notice Update trusted relayer status
     */
    function setTrustedRelayer(address relayer, bool trusted) external onlyOwner {
        trustedRelayers[relayer] = trusted;
        emit RelayerUpdated(relayer, trusted);
    }

    /**
     * @notice Pause contract
     */
    function pause() external onlyOwner {
        _pause();
    }

    /**
     * @notice Unpause contract
     */
    function unpause() external onlyOwner {
        _unpause();
    }

    // ==================== Internal Functions ====================

    function _addCredential(
        address user,
        bytes32 publicKeyX,
        bytes32 publicKeyY,
        bytes32 credentialId
    ) internal {
        Credential[] storage userCreds = credentials[user];

        if (userCreds.length >= MAX_CREDENTIALS) revert MaxCredentialsReached();
        if (publicKeyX == bytes32(0) || publicKeyY == bytes32(0)) revert InvalidPublicKey();
        if (credentialId == bytes32(0)) revert InvalidCredentialId();
        if (credentialIndex[credentialId].exists) revert CredentialAlreadyExists();

        // Track if this is first credential for user
        bool isNewUser = userCreds.length == 0;

        // Add credential
        uint8 newIndex = uint8(userCreds.length);
        userCreds.push(Credential({
            publicKeyX: publicKeyX,
            publicKeyY: publicKeyY,
            credentialId: credentialId,
            addedAt: uint64(block.timestamp),
            counter: 0,
            active: true
        }));

        // Update reverse lookup
        credentialIndex[credentialId] = CredentialIndex({
            user: user,
            index: newIndex,
            exists: true
        });

        if (isNewUser) {
            totalUsers++;
        }

        emit CredentialAdded(user, credentialId, newIndex, publicKeyX, publicKeyY, block.timestamp);
    }

    function _removeCredential(address user, uint8 index) internal {
        Credential[] storage userCreds = credentials[user];

        if (index >= userCreds.length) revert InvalidCredentialIndex();

        Credential storage cred = userCreds[index];
        if (!cred.active) revert CredentialNotActive();

        // Count active credentials - must keep at least one
        uint8 activeCount = 0;
        for (uint8 i = 0; i < userCreds.length; i++) {
            if (userCreds[i].active) activeCount++;
        }
        if (activeCount <= 1) revert NoCredentials(); // Can't remove last credential

        // Deactivate (don't delete to preserve indices)
        bytes32 credId = cred.credentialId;
        cred.active = false;

        // Remove from reverse lookup
        delete credentialIndex[credId];

        emit CredentialRemoved(user, credId, index, block.timestamp);
    }
}
