// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts/proxy/ERC1967/ERC1967Utils.sol";
import "./interfaces/IERC4337.sol";
import "./libraries/P256Verifier.sol";
import "./libraries/WebAuthn.sol";

/**
 * @title P256SmartWalletV2
 * @notice ERC-4337 compatible smart wallet with multi-passkey support
 * @dev Upgraded from V1 to support up to 10 owner credentials
 *      Uses Avalanche's ACP-204 precompile for efficient P-256 verification
 *
 * Key features:
 * - Multiple passkey owners (up to 10)
 * - ERC-4337 compatible for gasless transactions
 * - UUPS upgradeable pattern
 * - Batch execution support
 * - Credential index hint for O(1) signature lookup
 */
contract P256SmartWalletV2 is IAccount, IAccountExecute, Initializable, UUPSUpgradeable {
    using P256Verifier for *;
    using WebAuthn for *;

    // ==================== Constants ====================

    uint256 internal constant SIG_VALIDATION_SUCCESS = 0;
    uint256 internal constant SIG_VALIDATION_FAILED = 1;
    uint8 public constant MAX_OWNERS = 10;

    // ==================== Immutables ====================

    IEntryPoint public immutable entryPoint;

    // ==================== Structs ====================

    /// @notice Owner credential structure
    struct OwnerCredential {
        bytes32 publicKeyX;
        bytes32 publicKeyY;
        bytes32 credentialId;
        uint32 counter;
        bool active;
    }

    // ==================== State ====================

    /// @notice Array of owner credentials
    OwnerCredential[] public owners;

    /// @notice Credential ID to owner index mapping (for O(1) lookup)
    mapping(bytes32 => uint8) public credentialToIndex;

    // ==================== Events ====================

    event WalletInitialized(
        address indexed wallet,
        bytes32 publicKeyX,
        bytes32 publicKeyY,
        bytes32 credentialId
    );

    event OwnerAdded(
        uint8 indexed index,
        bytes32 publicKeyX,
        bytes32 publicKeyY,
        bytes32 credentialId
    );

    event OwnerRemoved(
        uint8 indexed index,
        bytes32 credentialId
    );

    event TransactionExecuted(
        address indexed target,
        uint256 value,
        bytes data,
        bool success
    );

    event SignatureCounterUpdated(uint8 ownerIndex, uint32 oldCounter, uint32 newCounter);

    // ==================== Errors ====================

    error OnlyEntryPoint();
    error OnlySelf();
    error InvalidSignature();
    error InvalidSignatureCounter();
    error ExecutionFailed(bytes returnData);
    error InvalidArrayLength();
    error MaxOwnersReached();
    error CredentialAlreadyExists();
    error CredentialNotFound();
    error CannotRemoveLastOwner();
    error InvalidOwnerIndex();

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

    constructor(IEntryPoint _entryPoint) {
        entryPoint = _entryPoint;
        _disableInitializers();
    }

    // ==================== Initialization ====================

    /**
     * @notice Initialize the wallet with primary passkey
     */
    function initialize(
        bytes32 _publicKeyX,
        bytes32 _publicKeyY,
        bytes32 _credentialId
    ) external initializer {
        owners.push(OwnerCredential({
            publicKeyX: _publicKeyX,
            publicKeyY: _publicKeyY,
            credentialId: _credentialId,
            counter: 0,
            active: true
        }));

        credentialToIndex[_credentialId] = 0;

        emit WalletInitialized(address(this), _publicKeyX, _publicKeyY, _credentialId);
        emit OwnerAdded(0, _publicKeyX, _publicKeyY, _credentialId);
    }

    // ==================== Owner Management ====================

    /**
     * @notice Add a new owner credential (must be called via UserOp)
     */
    function addOwner(
        bytes32 _publicKeyX,
        bytes32 _publicKeyY,
        bytes32 _credentialId
    ) external onlyEntryPoint {
        if (owners.length >= MAX_OWNERS) revert MaxOwnersReached();
        if (credentialToIndex[_credentialId] != 0 ||
            (owners.length > 0 && owners[0].credentialId == _credentialId)) {
            revert CredentialAlreadyExists();
        }

        uint8 newIndex = uint8(owners.length);
        owners.push(OwnerCredential({
            publicKeyX: _publicKeyX,
            publicKeyY: _publicKeyY,
            credentialId: _credentialId,
            counter: 0,
            active: true
        }));

        credentialToIndex[_credentialId] = newIndex;

        emit OwnerAdded(newIndex, _publicKeyX, _publicKeyY, _credentialId);
    }

    /**
     * @notice Remove an owner credential by index (must be called via UserOp)
     */
    function removeOwner(uint8 index) external onlyEntryPoint {
        if (index >= owners.length) revert InvalidOwnerIndex();

        // Count active owners
        uint8 activeCount = 0;
        for (uint8 i = 0; i < owners.length; i++) {
            if (owners[i].active) activeCount++;
        }
        if (activeCount <= 1) revert CannotRemoveLastOwner();

        OwnerCredential storage owner = owners[index];
        if (!owner.active) revert CredentialNotFound();

        bytes32 credId = owner.credentialId;
        owner.active = false;
        delete credentialToIndex[credId];

        emit OwnerRemoved(index, credId);
    }

    // ==================== ERC-4337 Account Interface ====================

    /**
     * @notice Validate a UserOperation signature
     * @dev Signature format: abi.encode(authenticatorData, clientDataHash, r, s, counter, ownerIndex)
     */
    function validateUserOp(
        PackedUserOperation calldata userOp,
        bytes32 userOpHash,
        uint256 missingAccountFunds
    ) external override onlyEntryPoint returns (uint256 validationData) {
        validationData = _validateSignature(userOp, userOpHash);

        if (missingAccountFunds > 0) {
            (bool success,) = payable(msg.sender).call{value: missingAccountFunds}("");
            (success);
        }
    }

    /**
     * @notice Internal signature validation with multi-owner support
     */
    function _validateSignature(
        PackedUserOperation calldata userOp,
        bytes32 userOpHash
    ) internal returns (uint256 validationData) {
        // Decode signature with owner index hint
        (
            bytes memory authenticatorData,
            bytes32 clientDataHash,
            bytes32 r,
            bytes32 s,
            uint32 counter,
            uint8 ownerIndexHint
        ) = abi.decode(
            userOp.signature,
            (bytes, bytes32, bytes32, bytes32, uint32, uint8)
        );

        // Try hint first (O(1))
        if (ownerIndexHint < owners.length) {
            OwnerCredential storage owner = owners[ownerIndexHint];
            if (owner.active && counter > owner.counter) {
                bytes32 messageHash = sha256(abi.encodePacked(authenticatorData, clientDataHash));

                bool valid = P256Verifier.verify(
                    messageHash,
                    r,
                    s,
                    owner.publicKeyX,
                    owner.publicKeyY
                );

                if (valid) {
                    uint32 oldCounter = owner.counter;
                    owner.counter = counter;
                    emit SignatureCounterUpdated(ownerIndexHint, oldCounter, counter);
                    return SIG_VALIDATION_SUCCESS;
                }
            }
        }

        // Fallback: linear search through all owners
        for (uint8 i = 0; i < owners.length; i++) {
            if (i == ownerIndexHint) continue;

            OwnerCredential storage owner = owners[i];
            if (!owner.active || counter <= owner.counter) continue;

            bytes32 messageHash = sha256(abi.encodePacked(authenticatorData, clientDataHash));

            bool valid = P256Verifier.verify(
                messageHash,
                r,
                s,
                owner.publicKeyX,
                owner.publicKeyY
            );

            if (valid) {
                uint32 oldCounter = owner.counter;
                owner.counter = counter;
                emit SignatureCounterUpdated(i, oldCounter, counter);
                return SIG_VALIDATION_SUCCESS;
            }
        }

        return SIG_VALIDATION_FAILED;
    }

    // ==================== Execution ====================

    /**
     * @notice Execute a single transaction
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

    function _call(address target, uint256 value, bytes calldata data) internal {
        (bool success, bytes memory returnData) = target.call{value: value}(data);

        emit TransactionExecuted(target, value, data, success);

        if (!success) {
            revert ExecutionFailed(returnData);
        }
    }

    // ==================== View Functions ====================

    /**
     * @notice Get all owners
     */
    function getOwners() external view returns (OwnerCredential[] memory) {
        return owners;
    }

    /**
     * @notice Get owner count (including inactive)
     */
    function getOwnerCount() external view returns (uint256) {
        return owners.length;
    }

    /**
     * @notice Get active owner count
     */
    function getActiveOwnerCount() external view returns (uint8 count) {
        for (uint8 i = 0; i < owners.length; i++) {
            if (owners[i].active) count++;
        }
    }

    /**
     * @notice Get owner by index
     */
    function getOwner(uint8 index) external view returns (
        bytes32 publicKeyX,
        bytes32 publicKeyY,
        bytes32 credentialId,
        uint32 counter,
        bool active
    ) {
        if (index >= owners.length) revert InvalidOwnerIndex();
        OwnerCredential storage owner = owners[index];
        return (owner.publicKeyX, owner.publicKeyY, owner.credentialId, owner.counter, owner.active);
    }

    /**
     * @notice Find owner index by credential ID
     */
    function findOwnerIndex(bytes32 credentialId) external view returns (uint8 index, bool found) {
        // Check index 0 explicitly (mapping returns 0 for non-existent)
        if (owners.length > 0 && owners[0].credentialId == credentialId) {
            return (0, true);
        }

        uint8 idx = credentialToIndex[credentialId];
        if (idx != 0 && idx < owners.length && owners[idx].credentialId == credentialId) {
            return (idx, true);
        }

        return (0, false);
    }

    /**
     * @notice Get wallet's nonce from EntryPoint
     */
    function getNonce() external view returns (uint256) {
        return entryPoint.getNonce(address(this), 0);
    }

    /**
     * @notice Check if wallet is initialized
     */
    function isInitialized() external view returns (bool) {
        return owners.length > 0;
    }

    // ==================== V1 Compatibility ====================

    /**
     * @notice Get primary owner's public key (V1 compatibility)
     */
    function getOwner() external view returns (bytes32 x, bytes32 y) {
        if (owners.length == 0) return (bytes32(0), bytes32(0));
        return (owners[0].publicKeyX, owners[0].publicKeyY);
    }

    /**
     * @notice Get primary public key X (V1 compatibility)
     */
    function publicKeyX() external view returns (bytes32) {
        if (owners.length == 0) return bytes32(0);
        return owners[0].publicKeyX;
    }

    /**
     * @notice Get primary public key Y (V1 compatibility)
     */
    function publicKeyY() external view returns (bytes32) {
        if (owners.length == 0) return bytes32(0);
        return owners[0].publicKeyY;
    }

    /**
     * @notice Get primary credential ID (V1 compatibility)
     */
    function credentialId() external view returns (bytes32) {
        if (owners.length == 0) return bytes32(0);
        return owners[0].credentialId;
    }

    /**
     * @notice Get primary signature counter (V1 compatibility)
     */
    function signatureCounter() external view returns (uint32) {
        if (owners.length == 0) return 0;
        return owners[0].counter;
    }

    // ==================== UUPS Upgrade ====================

    function _authorizeUpgrade(address newImplementation) internal override onlyEntryPoint {
        (newImplementation);
    }

    function getImplementation() external view returns (address) {
        return ERC1967Utils.getImplementation();
    }

    // ==================== Deposit Management ====================

    function addDeposit() external payable {
        entryPoint.depositTo{value: msg.value}(address(this));
    }

    function getDeposit() external view returns (uint256) {
        return entryPoint.balanceOf(address(this));
    }

    function withdrawDepositTo(address payable to, uint256 amount) external onlyEntryPoint {
        entryPoint.withdrawTo(to, amount);
    }

    receive() external payable {}
}
