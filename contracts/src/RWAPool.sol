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
 * @dev Handles USDC deposits/withdrawals with NAV-based pricing and fee collection
 */
contract RWAPool is Ownable, Pausable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    // ==================== Constants ====================

    /// @notice NAV base (8 decimals) - 1.00000000 = 100_000_000
    uint256 public constant NAV_BASE = 100_000_000;

    /// @notice Maximum NAV change per update (10% = 1000 bps)
    uint256 public constant MAX_NAV_CHANGE_BPS = 1000;

    /// @notice Basis points denominator
    uint256 public constant BPS_DENOMINATOR = 10000;

    // ==================== State ====================

    /// @notice USDC token address
    IERC20 public immutable usdc;

    /// @notice BiometricRegistry for passkey verification
    address public biometricRegistry;

    /// @notice NAV admin address (can update NAV)
    address public navAdmin;

    /// @notice Fee treasury address
    address public feeTreasury;

    /// @notice Trusted relayers that can submit meta-transactions
    mapping(address => bool) public trustedRelayers;

    /// @notice NAV data per pool
    struct PoolNav {
        uint256 navPerShare;      // Current NAV per share (8 decimals)
        uint256 lastUpdate;       // Last update timestamp
        uint256 minNav;           // Minimum allowed NAV (circuit breaker)
    }

    /// @notice Pool NAV data
    mapping(uint256 => PoolNav) public poolNavs;

    /// @notice Fee configuration per pool (in basis points)
    struct FeeConfig {
        uint256 entryFeeBps;      // Entry fee (default 0)
        uint256 exitFeeBps;       // Exit fee (default 10 = 0.1%)
    }

    /// @notice Pool fee configuration
    mapping(uint256 => FeeConfig) public poolFees;

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

    event NavUpdated(
        uint256 indexed chainPoolId,
        uint256 oldNav,
        uint256 newNav,
        address updatedBy,
        uint256 timestamp
    );

    event NavAdminUpdated(address indexed oldAdmin, address indexed newAdmin);

    event FeeTreasuryUpdated(address indexed oldTreasury, address indexed newTreasury);

    event FeeConfigUpdated(
        uint256 indexed chainPoolId,
        uint256 entryFeeBps,
        uint256 exitFeeBps
    );

    event FeeCollected(
        uint256 indexed chainPoolId,
        address indexed investor,
        uint256 feeAmount,
        string feeType
    );

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
    error NotNavAdmin();
    error NavChangeTooLarge();
    error NavBelowMinimum();
    error InvalidNav();

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

        // Initialize NAV at 1.00000000 (NAV_BASE)
        poolNavs[chainPoolId] = PoolNav({
            navPerShare: NAV_BASE,
            lastUpdate: block.timestamp,
            minNav: NAV_BASE / 2 // 50% circuit breaker
        });

        // Initialize default fees (0% entry, 0.1% exit)
        poolFees[chainPoolId] = FeeConfig({
            entryFeeBps: 0,
            exitFeeBps: 10
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

        // Calculate entry fee
        FeeConfig storage fees = poolFees[chainPoolId];
        uint256 entryFee = (amount * fees.entryFeeBps) / BPS_DENOMINATOR;
        uint256 netAmount = amount - entryFee;

        if (netAmount < pool.minInvestment) revert InvestmentTooLow();

        Position storage pos = positions[chainPoolId][investor];
        if (pos.depositedAmount + netAmount > pool.maxInvestment) revert InvestmentTooHigh();

        // Get current NAV (defaults to NAV_BASE if not set)
        uint256 currentNav = poolNavs[chainPoolId].navPerShare;
        if (currentNav == 0) currentNav = NAV_BASE;

        // Calculate shares based on NAV
        // shares = (amount * NAV_BASE) / currentNav
        // Example: $1000 at NAV 1.10 = 1000 * 100_000_000 / 110_000_000 = 909.09 shares
        uint256 shares = (netAmount * NAV_BASE) / currentNav;

        // Transfer USDC from investor to pool
        usdc.safeTransferFrom(investor, address(this), amount);

        // Send entry fee to treasury
        if (entryFee > 0 && feeTreasury != address(0)) {
            usdc.safeTransfer(feeTreasury, entryFee);
            emit FeeCollected(chainPoolId, investor, entryFee, "ENTRY");
        }

        // Update state
        pool.totalDeposited += netAmount;
        pool.totalShares += shares;
        pos.shares += shares;
        pos.depositedAmount += netAmount;
        pos.lastDepositTime = block.timestamp;

        emit Investment(chainPoolId, investor, netAmount, shares, block.timestamp);
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

        // Get current NAV
        uint256 currentNav = poolNavs[chainPoolId].navPerShare;
        if (currentNav == 0) currentNav = NAV_BASE;

        // Calculate redemption amount based on NAV
        // grossAmount = (shares * currentNav) / NAV_BASE
        // Example: 909 shares at NAV 1.15 = 909 * 115_000_000 / 100_000_000 = $1045.35
        uint256 grossAmount = (shares * currentNav) / NAV_BASE;

        // Calculate exit fee
        FeeConfig storage fees = poolFees[chainPoolId];
        uint256 exitFee = (grossAmount * fees.exitFeeBps) / BPS_DENOMINATOR;
        uint256 netAmount = grossAmount - exitFee;

        // Check pool has sufficient balance
        if (usdc.balanceOf(address(this)) < grossAmount) revert InsufficientBalance();

        // Update state before transfer (CEI pattern)
        pool.totalDeposited -= grossAmount;
        pool.totalShares -= shares;
        pos.shares -= shares;
        // Adjust deposited amount proportionally
        pos.depositedAmount = (pos.depositedAmount * (pos.shares)) / (pos.shares + shares);

        // Transfer USDC to investor (net of fee)
        usdc.safeTransfer(investor, netAmount);

        // Send exit fee to treasury
        if (exitFee > 0 && feeTreasury != address(0)) {
            usdc.safeTransfer(feeTreasury, exitFee);
            emit FeeCollected(chainPoolId, investor, exitFee, "EXIT");
        }

        emit Redemption(chainPoolId, investor, shares, netAmount, block.timestamp);
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

    // ==================== NAV Management ====================

    /**
     * @notice Set NAV admin address
     */
    function setNavAdmin(address _navAdmin) external onlyOwner {
        address oldAdmin = navAdmin;
        navAdmin = _navAdmin;
        emit NavAdminUpdated(oldAdmin, _navAdmin);
    }

    /**
     * @notice Update NAV for a pool (NAV admin only)
     * @param chainPoolId Pool to update
     * @param newNav New NAV value (8 decimals)
     */
    function updateNav(uint256 chainPoolId, uint256 newNav) external {
        if (msg.sender != navAdmin && msg.sender != owner()) revert NotNavAdmin();
        if (newNav == 0) revert InvalidNav();

        Pool storage pool = pools[chainPoolId];
        if (!pool.active) revert PoolNotActive();

        PoolNav storage nav = poolNavs[chainPoolId];
        uint256 oldNav = nav.navPerShare;
        if (oldNav == 0) oldNav = NAV_BASE;

        // Check NAV change limit (±10%)
        uint256 maxChange = (oldNav * MAX_NAV_CHANGE_BPS) / BPS_DENOMINATOR;
        if (newNav > oldNav + maxChange || newNav < oldNav - maxChange) {
            revert NavChangeTooLarge();
        }

        // Check circuit breaker
        if (newNav < nav.minNav) revert NavBelowMinimum();

        nav.navPerShare = newNav;
        nav.lastUpdate = block.timestamp;

        emit NavUpdated(chainPoolId, oldNav, newNav, msg.sender, block.timestamp);
    }

    /**
     * @notice Set minimum NAV for circuit breaker
     */
    function setMinNav(uint256 chainPoolId, uint256 minNav) external onlyOwner {
        poolNavs[chainPoolId].minNav = minNav;
    }

    // ==================== Fee Management ====================

    /**
     * @notice Set fee treasury address
     */
    function setFeeTreasury(address _feeTreasury) external onlyOwner {
        address oldTreasury = feeTreasury;
        feeTreasury = _feeTreasury;
        emit FeeTreasuryUpdated(oldTreasury, _feeTreasury);
    }

    /**
     * @notice Set fee configuration for a pool
     * @param chainPoolId Pool to configure
     * @param entryFeeBps Entry fee in basis points
     * @param exitFeeBps Exit fee in basis points
     */
    function setPoolFees(
        uint256 chainPoolId,
        uint256 entryFeeBps,
        uint256 exitFeeBps
    ) external onlyOwner {
        Pool storage pool = pools[chainPoolId];
        if (pool.chainPoolId == 0 && !pool.active) revert PoolNotFound();

        poolFees[chainPoolId] = FeeConfig({
            entryFeeBps: entryFeeBps,
            exitFeeBps: exitFeeBps
        });

        emit FeeConfigUpdated(chainPoolId, entryFeeBps, exitFeeBps);
    }

    // ==================== NAV & Fee View Functions ====================

    /**
     * @notice Get pool NAV data
     */
    function getPoolNav(uint256 chainPoolId) external view returns (
        uint256 navPerShare,
        uint256 lastUpdate,
        uint256 minNav
    ) {
        PoolNav storage nav = poolNavs[chainPoolId];
        return (
            nav.navPerShare == 0 ? NAV_BASE : nav.navPerShare,
            nav.lastUpdate,
            nav.minNav
        );
    }

    /**
     * @notice Get pool fee configuration
     */
    function getPoolFees(uint256 chainPoolId) external view returns (
        uint256 entryFeeBps,
        uint256 exitFeeBps
    ) {
        FeeConfig storage fees = poolFees[chainPoolId];
        return (fees.entryFeeBps, fees.exitFeeBps);
    }

    /**
     * @notice Calculate current position value based on NAV
     */
    function getPositionValue(uint256 chainPoolId, address user) external view returns (
        uint256 shares,
        uint256 currentValue,
        uint256 depositedAmount
    ) {
        Position storage pos = positions[chainPoolId][user];
        uint256 currentNav = poolNavs[chainPoolId].navPerShare;
        if (currentNav == 0) currentNav = NAV_BASE;

        uint256 value = (pos.shares * currentNav) / NAV_BASE;
        return (pos.shares, value, pos.depositedAmount);
    }
}
