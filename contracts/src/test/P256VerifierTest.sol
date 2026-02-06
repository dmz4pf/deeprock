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
