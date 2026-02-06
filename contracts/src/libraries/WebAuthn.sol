// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title WebAuthn
 * @notice Library for parsing WebAuthn authenticator data and client data
 * @dev Based on WebAuthn Level 2 specification
 */
library WebAuthn {
    /// @notice Minimum authenticator data length (37 bytes)
    uint256 constant MIN_AUTH_DATA_LENGTH = 37;

    /// @notice Parse authenticator data flags
    struct AuthenticatorData {
        bytes32 rpIdHash;        // SHA256 of relying party ID
        bool userPresent;        // UP flag (bit 0)
        bool userVerified;       // UV flag (bit 2)
        bool backupEligible;     // BE flag (bit 3)
        bool backupState;        // BS flag (bit 4)
        bool attestedCredentialData; // AT flag (bit 6)
        bool extensionData;      // ED flag (bit 7)
        uint32 signCount;        // Signature counter (4 bytes, big-endian)
    }

    error InvalidAuthenticatorData();
    error InvalidClientData();

    /**
     * @notice Parse authenticator data bytes
     * @param data Raw authenticator data from WebAuthn assertion
     * @return parsed The parsed authenticator data
     */
    function parseAuthenticatorData(
        bytes calldata data
    ) internal pure returns (AuthenticatorData memory parsed) {
        if (data.length < MIN_AUTH_DATA_LENGTH) revert InvalidAuthenticatorData();

        // First 32 bytes: RP ID hash
        parsed.rpIdHash = bytes32(data[:32]);

        // Byte 33 (index 32): Flags
        uint8 flags = uint8(data[32]);
        parsed.userPresent = (flags & 0x01) != 0;           // Bit 0
        parsed.userVerified = (flags & 0x04) != 0;          // Bit 2
        parsed.backupEligible = (flags & 0x08) != 0;        // Bit 3
        parsed.backupState = (flags & 0x10) != 0;           // Bit 4
        parsed.attestedCredentialData = (flags & 0x40) != 0; // Bit 6
        parsed.extensionData = (flags & 0x80) != 0;         // Bit 7

        // Bytes 34-37 (indices 33-36): Sign counter (big-endian uint32)
        parsed.signCount = uint32(bytes4(data[33:37]));
    }

    /**
     * @notice Extract sign counter from authenticator data
     * @param authenticatorData Raw authenticator data
     * @return counter The signature counter value
     */
    function getSignCounter(
        bytes calldata authenticatorData
    ) internal pure returns (uint32 counter) {
        if (authenticatorData.length < MIN_AUTH_DATA_LENGTH) revert InvalidAuthenticatorData();
        counter = uint32(bytes4(authenticatorData[33:37]));
    }

    /**
     * @notice Compute the WebAuthn message hash for verification
     * @dev WebAuthn signatures are over: SHA256(authenticatorData || clientDataHash)
     * @param authenticatorData The raw authenticator data
     * @param clientDataHash SHA256 hash of clientDataJSON
     * @return messageHash The hash to verify signature against
     */
    function computeMessageHash(
        bytes calldata authenticatorData,
        bytes32 clientDataHash
    ) internal pure returns (bytes32 messageHash) {
        messageHash = sha256(abi.encodePacked(authenticatorData, clientDataHash));
    }

    /**
     * @notice Verify authenticator data has required flags set
     * @param authenticatorData Raw authenticator data
     * @param requireUserPresence Whether UP flag must be set
     * @param requireUserVerification Whether UV flag must be set
     * @return valid True if flags match requirements
     */
    function verifyFlags(
        bytes calldata authenticatorData,
        bool requireUserPresence,
        bool requireUserVerification
    ) internal pure returns (bool valid) {
        AuthenticatorData memory parsed = parseAuthenticatorData(authenticatorData);

        if (requireUserPresence && !parsed.userPresent) {
            return false;
        }
        if (requireUserVerification && !parsed.userVerified) {
            return false;
        }

        return true;
    }
}
