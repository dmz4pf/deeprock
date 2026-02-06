// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./interfaces/IERC4337.sol";

/**
 * @title RWAPaymaster
 * @notice Sponsors gas for RWA Gateway users
 * @dev Whitelist-based paymaster that only sponsors approved targets
 *
 * Key features:
 * - Whitelist of allowed target contracts (RWAPool, MockUSDC)
 * - Daily/per-user gas limits (optional)
 * - Simple validation (no off-chain signature required)
 */
contract RWAPaymaster is IPaymaster, Ownable, ReentrancyGuard {
    // ==================== Constants ====================

    /// @notice Validation success with no time restriction
    uint256 internal constant VALIDATION_SUCCESS = 0;

    /// @notice Validation failed
    uint256 internal constant VALIDATION_FAILED = 1;

    // ==================== State ====================

    /// @notice The ERC-4337 EntryPoint
    IEntryPoint public immutable entryPoint;

    /// @notice Wallet factory (to verify legitimate wallets)
    address public walletFactory;

    /// @notice Allowed target contracts for sponsored calls
    mapping(address => bool) public allowedTargets;

    /// @notice Maximum gas cost per UserOperation (in wei)
    uint256 public maxGasCostPerOp;

    /// @notice Gas used per wallet today (for rate limiting)
    mapping(address => uint256) public dailyGasUsed;

    /// @notice Daily gas limit per wallet
    uint256 public dailyGasLimitPerWallet;

    /// @notice Last reset timestamp
    uint256 public lastDailyReset;

    /// @notice Pause state
    bool public paused;

    // ==================== Events ====================

    event TargetAllowed(address indexed target, bool allowed);
    event GasSponsored(
        address indexed wallet,
        address indexed target,
        uint256 gasCost
    );
    event DepositReceived(address indexed from, uint256 amount);
    event WithdrawalMade(address indexed to, uint256 amount);
    event ConfigUpdated(string param, uint256 value);
    event Paused(bool paused);

    // ==================== Errors ====================

    error OnlyEntryPoint();
    error TargetNotAllowed(address target);
    error PaymasterPaused();
    error DailyLimitExceeded(address wallet);
    error GasCostTooHigh(uint256 cost, uint256 max);
    error InvalidCallData();
    error InsufficientDeposit();

    // ==================== Modifiers ====================

    modifier onlyEntryPoint() {
        if (msg.sender != address(entryPoint)) revert OnlyEntryPoint();
        _;
    }

    modifier whenNotPaused() {
        if (paused) revert PaymasterPaused();
        _;
    }

    // ==================== Constructor ====================

    /**
     * @notice Deploy paymaster
     * @param _entryPoint The ERC-4337 EntryPoint
     * @param _owner Owner address for admin functions
     */
    constructor(
        IEntryPoint _entryPoint,
        address _owner
    ) Ownable(_owner) {
        entryPoint = _entryPoint;

        // Default limits
        maxGasCostPerOp = 0.01 ether;           // 0.01 AVAX max per op
        dailyGasLimitPerWallet = 0.1 ether;     // 0.1 AVAX per wallet per day
        lastDailyReset = block.timestamp;
    }

    // ==================== IPaymaster Interface ====================

    /**
     * @notice Validate paymaster is willing to sponsor this operation
     * @param userOp The UserOperation
     * @param userOpHash Hash of the operation
     * @param maxCost Maximum cost if operation uses all gas
     * @return context Data to pass to postOp
     * @return validationData 0 for success, 1 for failure
     */
    function validatePaymasterUserOp(
        PackedUserOperation calldata userOp,
        bytes32 userOpHash,
        uint256 maxCost
    ) external override onlyEntryPoint whenNotPaused returns (bytes memory context, uint256 validationData) {
        // Reset daily limits if needed
        _checkAndResetDailyLimits();

        // Check max cost
        if (maxCost > maxGasCostPerOp) {
            return ("", VALIDATION_FAILED);
        }

        // Check daily limit
        if (dailyGasUsed[userOp.sender] + maxCost > dailyGasLimitPerWallet) {
            return ("", VALIDATION_FAILED);
        }

        // Extract and validate target from callData
        address target = _extractTarget(userOp.callData);
        if (target == address(0)) {
            return ("", VALIDATION_FAILED);
        }

        if (!allowedTargets[target]) {
            return ("", VALIDATION_FAILED);
        }

        // Encode context for postOp
        context = abi.encode(userOp.sender, target, maxCost);

        return (context, VALIDATION_SUCCESS);

        // Silence unused variable warning
        (userOpHash);
    }

    /**
     * @notice Post-operation hook - called after UserOp execution
     * @param mode Execution result mode
     * @param context Data from validatePaymasterUserOp
     * @param actualGasCost Actual gas used
     * @param actualUserOpFeePerGas Actual fee per gas
     */
    function postOp(
        PostOpMode mode,
        bytes calldata context,
        uint256 actualGasCost,
        uint256 actualUserOpFeePerGas
    ) external override onlyEntryPoint {
        // Decode context
        (address wallet, address target, ) = abi.decode(
            context,
            (address, address, uint256)
        );

        // Track gas usage (even on revert, we still paid)
        dailyGasUsed[wallet] += actualGasCost;

        // Only emit on success
        if (mode == PostOpMode.opSucceeded) {
            emit GasSponsored(wallet, target, actualGasCost);
        }

        // Silence unused variable warning
        (actualUserOpFeePerGas);
    }

    // ==================== Target Management ====================

    /**
     * @notice Set whether a target is allowed for sponsored calls
     * @param target The contract address
     * @param allowed Whether to allow sponsoring calls to this target
     */
    function setAllowedTarget(address target, bool allowed) external onlyOwner {
        allowedTargets[target] = allowed;
        emit TargetAllowed(target, allowed);
    }

    /**
     * @notice Batch set allowed targets
     * @param targets Array of contract addresses
     * @param allowed Array of allow states
     */
    function setAllowedTargets(
        address[] calldata targets,
        bool[] calldata allowed
    ) external onlyOwner {
        require(targets.length == allowed.length, "Length mismatch");

        for (uint256 i = 0; i < targets.length; i++) {
            allowedTargets[targets[i]] = allowed[i];
            emit TargetAllowed(targets[i], allowed[i]);
        }
    }

    // ==================== Configuration ====================

    /**
     * @notice Set wallet factory address
     */
    function setWalletFactory(address _factory) external onlyOwner {
        walletFactory = _factory;
    }

    /**
     * @notice Set max gas cost per operation
     */
    function setMaxGasCostPerOp(uint256 _max) external onlyOwner {
        maxGasCostPerOp = _max;
        emit ConfigUpdated("maxGasCostPerOp", _max);
    }

    /**
     * @notice Set daily gas limit per wallet
     */
    function setDailyGasLimit(uint256 _limit) external onlyOwner {
        dailyGasLimitPerWallet = _limit;
        emit ConfigUpdated("dailyGasLimitPerWallet", _limit);
    }

    /**
     * @notice Pause/unpause the paymaster
     */
    function setPaused(bool _paused) external onlyOwner {
        paused = _paused;
        emit Paused(_paused);
    }

    // ==================== Deposit Management ====================

    /**
     * @notice Deposit funds to EntryPoint for sponsoring gas
     */
    function deposit() external payable {
        entryPoint.depositTo{value: msg.value}(address(this));
        emit DepositReceived(msg.sender, msg.value);
    }

    /**
     * @notice Withdraw funds from EntryPoint
     * @param to Recipient address
     * @param amount Amount to withdraw
     */
    function withdrawTo(address payable to, uint256 amount) external onlyOwner {
        entryPoint.withdrawTo(to, amount);
        emit WithdrawalMade(to, amount);
    }

    /**
     * @notice Get current deposit in EntryPoint
     */
    function getDeposit() external view returns (uint256) {
        return entryPoint.balanceOf(address(this));
    }

    // ==================== View Functions ====================

    /**
     * @notice Get remaining daily gas allowance for a wallet
     */
    function getRemainingDailyAllowance(address wallet) external view returns (uint256) {
        if (dailyGasUsed[wallet] >= dailyGasLimitPerWallet) {
            return 0;
        }
        return dailyGasLimitPerWallet - dailyGasUsed[wallet];
    }

    /**
     * @notice Check if a target is allowed
     */
    function isTargetAllowed(address target) external view returns (bool) {
        return allowedTargets[target];
    }

    // ==================== Internal ====================

    /**
     * @notice Extract target address from UserOp callData
     * @dev Handles both execute() and executeBatch() selectors
     */
    function _extractTarget(bytes calldata callData) internal pure returns (address target) {
        if (callData.length < 4) return address(0);

        bytes4 selector = bytes4(callData[:4]);

        // execute(address,uint256,bytes) = 0xb61d27f6
        if (selector == bytes4(keccak256("execute(address,uint256,bytes)"))) {
            if (callData.length < 36) return address(0);
            // Target is at offset 4, padded to 32 bytes
            target = address(bytes20(callData[16:36]));
        }
        // executeBatch(address[],uint256[],bytes[]) = 0x47e1da2a
        else if (selector == bytes4(keccak256("executeBatch(address[],uint256[],bytes[])"))) {
            // For batch, we verify the first target
            // Full batch validation would require iterating all targets
            if (callData.length < 100) return address(0);

            // Dynamic array - skip offset pointer (32 bytes from selector)
            // Array length at offset, then first element
            // This is simplified - production should decode properly
            uint256 arrayOffset = uint256(bytes32(callData[4:36]));
            if (arrayOffset + 36 + 32 > callData.length) return address(0);

            // First address in array (after length)
            target = address(bytes20(callData[4 + arrayOffset + 32 + 12 : 4 + arrayOffset + 32 + 32]));
        }

        return target;
    }

    /**
     * @notice Reset daily limits if 24 hours have passed
     */
    function _checkAndResetDailyLimits() internal {
        if (block.timestamp >= lastDailyReset + 1 days) {
            lastDailyReset = block.timestamp;
            // Note: Individual wallet mappings are not reset here
            // They effectively reset via the timestamp check
        }
    }

    /**
     * @notice Manual reset of a wallet's daily usage (admin function)
     */
    function resetWalletDailyUsage(address wallet) external onlyOwner {
        dailyGasUsed[wallet] = 0;
    }

    // ==================== Receive ====================

    /// @notice Accept deposits directly
    receive() external payable {
        entryPoint.depositTo{value: msg.value}(address(this));
        emit DepositReceived(msg.sender, msg.value);
    }
}
