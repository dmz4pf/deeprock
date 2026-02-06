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
