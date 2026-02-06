// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title ERC-4337 Interfaces (v0.7)
 * @notice Minimal interfaces for Account Abstraction
 * @dev Based on ERC-4337 v0.7 specification
 */

/**
 * @notice Packed UserOperation structure (v0.7 format)
 * @dev More gas-efficient than v0.6 struct
 */
struct PackedUserOperation {
    address sender;
    uint256 nonce;
    bytes initCode;
    bytes callData;
    bytes32 accountGasLimits;      // verificationGasLimit (16 bytes) | callGasLimit (16 bytes)
    uint256 preVerificationGas;
    bytes32 gasFees;               // maxPriorityFeePerGas (16 bytes) | maxFeePerGas (16 bytes)
    bytes paymasterAndData;
    bytes signature;
}

/**
 * @title IEntryPoint
 * @notice ERC-4337 EntryPoint interface (v0.7)
 */
interface IEntryPoint {
    /**
     * @notice Execute a batch of UserOperations
     * @param ops Array of operations to execute
     * @param beneficiary Address to receive gas refunds
     */
    function handleOps(
        PackedUserOperation[] calldata ops,
        address payable beneficiary
    ) external;

    /**
     * @notice Get the nonce for a sender/key combination
     * @param sender The account address
     * @param key The nonce key (usually 0)
     * @return nonce The current nonce
     */
    function getNonce(address sender, uint192 key) external view returns (uint256 nonce);

    /**
     * @notice Deposit funds to an account's balance
     * @param account The account to deposit to
     */
    function depositTo(address account) external payable;

    /**
     * @notice Withdraw funds from account balance
     * @param withdrawAddress Where to send funds
     * @param withdrawAmount Amount to withdraw
     */
    function withdrawTo(address payable withdrawAddress, uint256 withdrawAmount) external;

    /**
     * @notice Get account balance in EntryPoint
     * @param account The account address
     * @return balance The deposited balance
     */
    function balanceOf(address account) external view returns (uint256);

    /**
     * @notice Get the hash of a UserOperation
     * @param userOp The UserOperation
     * @return hash The hash to sign
     */
    function getUserOpHash(PackedUserOperation calldata userOp) external view returns (bytes32);
}

/**
 * @title IAccount
 * @notice ERC-4337 Account interface
 */
interface IAccount {
    /**
     * @notice Validate a UserOperation
     * @param userOp The operation to validate
     * @param userOpHash Hash of the operation (for signature)
     * @param missingAccountFunds Funds to pay if not using paymaster
     * @return validationData Packed validation result:
     *         - 0 for success
     *         - 1 for signature failure
     *         - Otherwise: (sigFailed << 160) | (validUntil << 48) | validAfter
     */
    function validateUserOp(
        PackedUserOperation calldata userOp,
        bytes32 userOpHash,
        uint256 missingAccountFunds
    ) external returns (uint256 validationData);
}

/**
 * @title IPaymaster
 * @notice ERC-4337 Paymaster interface
 */
interface IPaymaster {
    enum PostOpMode {
        opSucceeded,
        opReverted,
        postOpReverted
    }

    /**
     * @notice Validate paymaster is willing to pay
     * @param userOp The UserOperation
     * @param userOpHash Hash of the operation
     * @param maxCost Maximum cost of the operation
     * @return context Context to pass to postOp
     * @return validationData Same format as account validation
     */
    function validatePaymasterUserOp(
        PackedUserOperation calldata userOp,
        bytes32 userOpHash,
        uint256 maxCost
    ) external returns (bytes memory context, uint256 validationData);

    /**
     * @notice Post-operation hook
     * @param mode Result of the operation
     * @param context Context from validatePaymasterUserOp
     * @param actualGasCost Actual gas cost of operation
     * @param actualUserOpFeePerGas Actual gas price used
     */
    function postOp(
        PostOpMode mode,
        bytes calldata context,
        uint256 actualGasCost,
        uint256 actualUserOpFeePerGas
    ) external;
}

/**
 * @title IAccountExecute
 * @notice Optional interface for direct execution
 */
interface IAccountExecute {
    /**
     * @notice Execute a call from EntryPoint
     * @param target Target address
     * @param value ETH value
     * @param data Call data
     */
    function execute(address target, uint256 value, bytes calldata data) external;

    /**
     * @notice Execute multiple calls
     * @param targets Target addresses
     * @param values ETH values
     * @param datas Call data array
     */
    function executeBatch(
        address[] calldata targets,
        uint256[] calldata values,
        bytes[] calldata datas
    ) external;
}
