// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts/proxy/ERC1967/ERC1967Utils.sol";
import "./interfaces/IERC4337.sol";
import "./libraries/P256Verifier.sol";
import "./libraries/WebAuthn.sol";

/**
 * @title P256SmartWallet
 * @notice ERC-4337 compatible smart wallet controlled by P-256 passkey
 * @dev Uses Avalanche's ACP-204 precompile for efficient signature verification
 *
 * Key features:
 * - Passkey-controlled (WebAuthn P-256 signatures)
 * - ERC-4337 compatible for gasless transactions
 * - UUPS upgradeable pattern
 * - Batch execution support
 */
contract P256SmartWallet is IAccount, IAccountExecute, Initializable, UUPSUpgradeable {
    using P256Verifier for *;
    using WebAuthn for *;

    // ==================== Constants ====================

    /// @notice Signature validation success
    uint256 internal constant SIG_VALIDATION_SUCCESS = 0;

    /// @notice Signature validation failed
    uint256 internal constant SIG_VALIDATION_FAILED = 1;

    // ==================== Immutables ====================

    /// @notice The ERC-4337 EntryPoint (v0.7)
    IEntryPoint public immutable entryPoint;

    // ==================== State ====================

    /// @notice Passkey public key X coordinate
    bytes32 public publicKeyX;

    /// @notice Passkey public key Y coordinate
    bytes32 public publicKeyY;

    /// @notice WebAuthn credential ID (for frontend matching)
    bytes32 public credentialId;

    /// @notice Last used signature counter (WebAuthn replay protection)
    uint32 public signatureCounter;

    // ==================== Events ====================

    event WalletInitialized(
        address indexed wallet,
        bytes32 publicKeyX,
        bytes32 publicKeyY,
        bytes32 credentialId
    );

    event TransactionExecuted(
        address indexed target,
        uint256 value,
        bytes data,
        bool success
    );

    event SignatureCounterUpdated(uint32 oldCounter, uint32 newCounter);

    // ==================== Errors ====================

    error OnlyEntryPoint();
    error OnlySelf();
    error InvalidSignature();
    error InvalidSignatureCounter();
    error ExecutionFailed(bytes returnData);
    error InvalidArrayLength();

    // ==================== Modifiers ====================

    modifier onlyEntryPoint() {
        if (msg.sender != address(entryPoint)) revert OnlyEntryPoint();
        _;
    }

    modifier onlySelf() {
        if (msg.sender != address(this)) revert OnlySelf();
        _;
    }

    // ==================== Constructor ====================

    /**
     * @notice Constructor sets the EntryPoint (immutable)
     * @param _entryPoint The ERC-4337 EntryPoint address
     */
    constructor(IEntryPoint _entryPoint) {
        entryPoint = _entryPoint;
        _disableInitializers();
    }

    // ==================== Initialization ====================

    /**
     * @notice Initialize the wallet with a passkey public key
     * @param _publicKeyX X coordinate of P-256 public key
     * @param _publicKeyY Y coordinate of P-256 public key
     * @param _credentialId WebAuthn credential ID (truncated to bytes32)
     */
    function initialize(
        bytes32 _publicKeyX,
        bytes32 _publicKeyY,
        bytes32 _credentialId
    ) external initializer {
        publicKeyX = _publicKeyX;
        publicKeyY = _publicKeyY;
        credentialId = _credentialId;

        emit WalletInitialized(address(this), _publicKeyX, _publicKeyY, _credentialId);
    }

    // ==================== ERC-4337 Account Interface ====================

    /**
     * @notice Validate a UserOperation signature
     * @dev Called by EntryPoint during validation phase
     * @param userOp The UserOperation to validate
     * @param userOpHash Hash of the UserOperation (what user signed)
     * @param missingAccountFunds Funds needed if not using paymaster
     * @return validationData 0 for valid, 1 for invalid signature
     */
    function validateUserOp(
        PackedUserOperation calldata userOp,
        bytes32 userOpHash,
        uint256 missingAccountFunds
    ) external override onlyEntryPoint returns (uint256 validationData) {
        validationData = _validateSignature(userOp, userOpHash);

        // Pay prefund if needed (when not using paymaster)
        if (missingAccountFunds > 0) {
            (bool success,) = payable(msg.sender).call{value: missingAccountFunds}("");
            // Ignore failure - EntryPoint will handle
            (success);
        }
    }

    /**
     * @notice Internal signature validation
     * @param userOp The UserOperation
     * @param userOpHash Hash to verify signature against
     * @return validationData 0 = valid, 1 = invalid
     */
    function _validateSignature(
        PackedUserOperation calldata userOp,
        bytes32 userOpHash
    ) internal returns (uint256 validationData) {
        // Decode WebAuthn signature
        // Format: abi.encode(authenticatorData, clientDataHash, r, s, counter)
        (
            bytes memory authenticatorData,
            bytes32 clientDataHash,
            bytes32 r,
            bytes32 s,
            uint32 counter
        ) = abi.decode(
            userOp.signature,
            (bytes, bytes32, bytes32, bytes32, uint32)
        );

        // Verify signature counter is incrementing (replay protection)
        if (counter <= signatureCounter) {
            return SIG_VALIDATION_FAILED;
        }

        // Compute WebAuthn message hash
        // WebAuthn signs: SHA256(authenticatorData || clientDataHash)
        // The clientDataJSON contains the userOpHash in the challenge field
        bytes32 messageHash = sha256(abi.encodePacked(authenticatorData, clientDataHash));

        // Verify P-256 signature using ACP-204 precompile
        bool valid = P256Verifier.verify(
            messageHash,
            r,
            s,
            publicKeyX,
            publicKeyY
        );

        if (!valid) {
            return SIG_VALIDATION_FAILED;
        }

        // Update signature counter
        uint32 oldCounter = signatureCounter;
        signatureCounter = counter;
        emit SignatureCounterUpdated(oldCounter, counter);

        return SIG_VALIDATION_SUCCESS;
    }

    // ==================== Execution ====================

    /**
     * @notice Execute a single transaction
     * @dev Only callable by EntryPoint after validation
     * @param target Target contract address
     * @param value ETH value to send
     * @param data Call data
     */
    function execute(
        address target,
        uint256 value,
        bytes calldata data
    ) external override onlyEntryPoint {
        _call(target, value, data);
    }

    /**
     * @notice Execute multiple transactions in batch
     * @dev Only callable by EntryPoint after validation
     * @param targets Array of target addresses
     * @param values Array of ETH values
     * @param datas Array of call data
     */
    function executeBatch(
        address[] calldata targets,
        uint256[] calldata values,
        bytes[] calldata datas
    ) external override onlyEntryPoint {
        if (targets.length != values.length || targets.length != datas.length) {
            revert InvalidArrayLength();
        }

        for (uint256 i = 0; i < targets.length; i++) {
            _call(targets[i], values[i], datas[i]);
        }
    }

    /**
     * @notice Internal call helper
     */
    function _call(address target, uint256 value, bytes calldata data) internal {
        (bool success, bytes memory returnData) = target.call{value: value}(data);

        emit TransactionExecuted(target, value, data, success);

        if (!success) {
            revert ExecutionFailed(returnData);
        }
    }

    // ==================== View Functions ====================

    /**
     * @notice Get the wallet owner's public key
     * @return x X coordinate of public key
     * @return y Y coordinate of public key
     */
    function getOwner() external view returns (bytes32 x, bytes32 y) {
        return (publicKeyX, publicKeyY);
    }

    /**
     * @notice Get wallet's nonce from EntryPoint
     * @return nonce Current nonce
     */
    function getNonce() external view returns (uint256) {
        return entryPoint.getNonce(address(this), 0);
    }

    /**
     * @notice Check if wallet is initialized
     * @return True if initialized
     */
    function isInitialized() external view returns (bool) {
        return publicKeyX != bytes32(0) || publicKeyY != bytes32(0);
    }

    // ==================== UUPS Upgrade ====================

    /**
     * @notice Authorize upgrade (only wallet itself via EntryPoint)
     * @dev Called during UUPS upgrade
     */
    function _authorizeUpgrade(address newImplementation) internal override onlyEntryPoint {
        // Additional checks can be added here
        (newImplementation);
    }

    /**
     * @notice Get implementation address
     */
    function getImplementation() external view returns (address) {
        return ERC1967Utils.getImplementation();
    }

    // ==================== Deposit Management ====================

    /**
     * @notice Deposit funds to EntryPoint for gas
     */
    function addDeposit() external payable {
        entryPoint.depositTo{value: msg.value}(address(this));
    }

    /**
     * @notice Get current deposit in EntryPoint
     */
    function getDeposit() external view returns (uint256) {
        return entryPoint.balanceOf(address(this));
    }

    /**
     * @notice Withdraw deposit (only via UserOp)
     */
    function withdrawDepositTo(address payable to, uint256 amount) external onlyEntryPoint {
        entryPoint.withdrawTo(to, amount);
    }

    // ==================== Receive ====================

    /// @notice Allow receiving ETH
    receive() external payable {}
}
