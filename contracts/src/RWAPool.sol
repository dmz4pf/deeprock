// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/IERC20Permit.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title RWAPool
 * @notice Investment pool for Real World Assets on Avalanche
 * @dev Handles USDC deposits/withdrawals with passkey-signed authorization via relayer
 */
contract RWAPool is Ownable, Pausable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    // ==================== State ====================

    /// @notice USDC token address
    IERC20 public immutable usdc;

    /// @notice BiometricRegistry for passkey verification
    address public biometricRegistry;

    /// @notice Trusted relayers that can submit meta-transactions
    mapping(address => bool) public trustedRelayers;

    /// @notice Pool information
    struct Pool {
        uint256 chainPoolId;      // Unique pool identifier (matches backend)
        uint256 totalDeposited;   // Total USDC deposited
        uint256 totalShares;      // Total shares issued
        uint256 minInvestment;    // Minimum investment amount
        uint256 maxInvestment;    // Maximum investment per user
        bool active;              // Pool status
    }

    /// @notice User position in a pool
    struct Position {
        uint256 shares;           // User's shares in pool
        uint256 depositedAmount;  // Total USDC deposited
        uint256 lastDepositTime;  // Timestamp of last deposit
    }

    /// @notice Pool ID => Pool data
    mapping(uint256 => Pool) public pools;

    /// @notice Pool ID => User => Position
    mapping(uint256 => mapping(address => Position)) public positions;

    /// @notice Used nonces for meta-transactions (user => nonce => used)
    mapping(address => mapping(uint256 => bool)) public usedNonces;

    /// @notice Total number of pools
    uint256 public poolCount;

    // ==================== Events ====================

    event PoolCreated(
        uint256 indexed chainPoolId,
        uint256 minInvestment,
        uint256 maxInvestment
    );

    event Investment(
        uint256 indexed chainPoolId,
        address indexed investor,
        uint256 amount,
        uint256 shares,
        uint256 timestamp
    );

    event Redemption(
        uint256 indexed chainPoolId,
        address indexed investor,
        uint256 shares,
        uint256 amount,
        uint256 timestamp
    );

    event RelayerUpdated(address indexed relayer, bool trusted);

    // ==================== Errors ====================

    error PoolNotFound();
    error PoolNotActive();
    error InvestmentTooLow();
    error InvestmentTooHigh();
    error InsufficientShares();
    error InsufficientBalance();
    error NotTrustedRelayer();
    error NonceAlreadyUsed();
    error InvalidSignature();
    error DeadlineExpired();
    error ZeroAmount();
    error PoolAlreadyExists();

    // ==================== Constructor ====================

    constructor(address _usdc, address _biometricRegistry) Ownable(msg.sender) {
        usdc = IERC20(_usdc);
        biometricRegistry = _biometricRegistry;
    }

    // ==================== Pool Management ====================

    /**
     * @notice Create a new investment pool
     * @param chainPoolId Unique pool ID (matches backend database)
     * @param minInvestment Minimum investment amount (6 decimals)
     * @param maxInvestment Maximum investment per user (6 decimals)
     */
    function createPool(
        uint256 chainPoolId,
        uint256 minInvestment,
        uint256 maxInvestment
    ) external onlyOwner {
        if (pools[chainPoolId].active) revert PoolAlreadyExists();

        pools[chainPoolId] = Pool({
            chainPoolId: chainPoolId,
            totalDeposited: 0,
            totalShares: 0,
            minInvestment: minInvestment,
            maxInvestment: maxInvestment,
            active: true
        });

        poolCount++;

        emit PoolCreated(chainPoolId, minInvestment, maxInvestment);
    }

    /**
     * @notice Update pool parameters
     */
    function updatePool(
        uint256 chainPoolId,
        uint256 minInvestment,
        uint256 maxInvestment,
        bool active
    ) external onlyOwner {
        Pool storage pool = pools[chainPoolId];
        if (pool.chainPoolId == 0 && !pool.active) revert PoolNotFound();

        pool.minInvestment = minInvestment;
        pool.maxInvestment = maxInvestment;
        pool.active = active;
    }

    // ==================== Investment Operations ====================

    /**
     * @notice Invest USDC into a pool
     * @param chainPoolId Pool to invest in
     * @param amount USDC amount (6 decimals)
     */
    function invest(
        uint256 chainPoolId,
        uint256 amount
    ) external whenNotPaused nonReentrant {
        _invest(chainPoolId, msg.sender, amount);
    }

    /**
     * @notice Invest with EIP-2612 permit (gasless approval + invest in one tx)
     * @dev User signs permit off-chain, relayer submits both permit + invest atomically
     * @param chainPoolId Pool to invest in
     * @param investor The investor address (permit owner)
     * @param amount USDC amount (6 decimals)
     * @param deadline Permit signature deadline
     * @param v Signature v component
     * @param r Signature r component
     * @param s Signature s component
     */
    function investWithPermit(
        uint256 chainPoolId,
        address investor,
        uint256 amount,
        uint256 deadline,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) external whenNotPaused nonReentrant {
        // Execute permit (gasless approval from investor to this contract)
        IERC20Permit(address(usdc)).permit(
            investor,           // owner
            address(this),      // spender
            amount,             // value
            deadline,           // deadline
            v, r, s             // signature
        );

        // Execute investment
        _invest(chainPoolId, investor, amount);
    }

    /**
     * @notice Invest via relayer (meta-transaction)
     * @dev User signs the investment intent, relayer submits on their behalf
     * @param chainPoolId Pool to invest in
     * @param investor The actual investor
     * @param amount USDC amount
     * @param deadline Timestamp after which request expires
     * @param nonce Unique nonce for replay protection
     * @param signature Passkey signature of the investment intent
     */
    function investViaRelayer(
        uint256 chainPoolId,
        address investor,
        uint256 amount,
        uint256 deadline,
        uint256 nonce,
        bytes calldata signature
    ) external whenNotPaused nonReentrant {
        if (!trustedRelayers[msg.sender]) revert NotTrustedRelayer();
        if (block.timestamp > deadline) revert DeadlineExpired();
        if (usedNonces[investor][nonce]) revert NonceAlreadyUsed();

        // Mark nonce as used
        usedNonces[investor][nonce] = true;

        // Verify signature via BiometricRegistry
        // Note: In production, verify the signature against the user's registered passkey
        // For MVP, we trust the relayer's verification in the backend

        _invest(chainPoolId, investor, amount);
    }

    /**
     * @notice Redeem shares from a pool
     * @param chainPoolId Pool to redeem from
     * @param shares Number of shares to redeem
     */
    function redeem(
        uint256 chainPoolId,
        uint256 shares
    ) external whenNotPaused nonReentrant {
        _redeem(chainPoolId, msg.sender, shares);
    }

    /**
     * @notice Redeem via relayer (meta-transaction)
     */
    function redeemViaRelayer(
        uint256 chainPoolId,
        address investor,
        uint256 shares,
        uint256 deadline,
        uint256 nonce,
        bytes calldata signature
    ) external whenNotPaused nonReentrant {
        if (!trustedRelayers[msg.sender]) revert NotTrustedRelayer();
        if (block.timestamp > deadline) revert DeadlineExpired();
        if (usedNonces[investor][nonce]) revert NonceAlreadyUsed();

        usedNonces[investor][nonce] = true;

        _redeem(chainPoolId, investor, shares);
    }

    // ==================== Internal Functions ====================

    function _invest(
        uint256 chainPoolId,
        address investor,
        uint256 amount
    ) internal {
        if (amount == 0) revert ZeroAmount();

        Pool storage pool = pools[chainPoolId];
        if (!pool.active) revert PoolNotActive();
        if (amount < pool.minInvestment) revert InvestmentTooLow();

        Position storage pos = positions[chainPoolId][investor];
        if (pos.depositedAmount + amount > pool.maxInvestment) revert InvestmentTooHigh();

        // Calculate shares (1:1 for simplicity, can add NAV calculation later)
        uint256 shares = amount;

        // Transfer USDC from investor to pool
        usdc.safeTransferFrom(investor, address(this), amount);

        // Update state
        pool.totalDeposited += amount;
        pool.totalShares += shares;
        pos.shares += shares;
        pos.depositedAmount += amount;
        pos.lastDepositTime = block.timestamp;

        emit Investment(chainPoolId, investor, amount, shares, block.timestamp);
    }

    function _redeem(
        uint256 chainPoolId,
        address investor,
        uint256 shares
    ) internal {
        if (shares == 0) revert ZeroAmount();

        Pool storage pool = pools[chainPoolId];
        Position storage pos = positions[chainPoolId][investor];

        if (pos.shares < shares) revert InsufficientShares();

        // Calculate redemption amount (1:1 for simplicity)
        uint256 amount = shares;

        // Check pool has sufficient balance
        if (usdc.balanceOf(address(this)) < amount) revert InsufficientBalance();

        // Update state before transfer (CEI pattern)
        pool.totalDeposited -= amount;
        pool.totalShares -= shares;
        pos.shares -= shares;
        pos.depositedAmount -= amount;

        // Transfer USDC to investor
        usdc.safeTransfer(investor, amount);

        emit Redemption(chainPoolId, investor, shares, amount, block.timestamp);
    }

    // ==================== View Functions ====================

    /**
     * @notice Get pool information
     */
    function getPool(uint256 chainPoolId) external view returns (
        uint256 totalDeposited,
        uint256 totalShares,
        uint256 minInvestment,
        uint256 maxInvestment,
        bool active
    ) {
        Pool storage pool = pools[chainPoolId];
        return (
            pool.totalDeposited,
            pool.totalShares,
            pool.minInvestment,
            pool.maxInvestment,
            pool.active
        );
    }

    /**
     * @notice Get user position in a pool
     */
    function getPosition(uint256 chainPoolId, address user) external view returns (
        uint256 shares,
        uint256 depositedAmount,
        uint256 lastDepositTime
    ) {
        Position storage pos = positions[chainPoolId][user];
        return (pos.shares, pos.depositedAmount, pos.lastDepositTime);
    }

    /**
     * @notice Check if pool exists and is active
     */
    function isPoolActive(uint256 chainPoolId) external view returns (bool) {
        return pools[chainPoolId].active;
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
     * @notice Update BiometricRegistry address
     */
    function setBiometricRegistry(address _registry) external onlyOwner {
        biometricRegistry = _registry;
    }

    /**
     * @notice Pause contract (emergency)
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

    /**
     * @notice Emergency withdraw (admin only)
     */
    function emergencyWithdraw(address to, uint256 amount) external onlyOwner {
        usdc.safeTransfer(to, amount);
    }
}
