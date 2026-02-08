# RWA Pool Mechanics: Comprehensive Research
## Production-Ready Features for Scaling RWA Gateway

**Date:** February 7, 2026
**Purpose:** Deep dive into how RWA pools work in production, APY dynamics, and features needed to scale

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [How RWA Pools Work](#2-how-rwa-pools-work)
3. [APY & Yield Mechanics](#3-apy--yield-mechanics)
4. [Yield Distribution Models](#4-yield-distribution-models)
5. [NAV Calculation & Oracle Integration](#5-nav-calculation--oracle-integration)
6. [Compliance & Transfer Restrictions](#6-compliance--transfer-restrictions)
7. [Redemption & Liquidity Management](#7-redemption--liquidity-management)
8. [Production-Ready Features](#8-production-ready-features)
9. [Current Implementation Gap Analysis](#9-current-implementation-gap-analysis)
10. [Recommendations](#10-recommendations)

---

## 1. Executive Summary

### Key Findings

| Aspect | Current RWA Gateway | Production Standard | Gap |
|--------|---------------------|---------------------|-----|
| **Yield Model** | None (1:1 shares) | Dynamic NAV with accrual | Critical |
| **APY Updates** | Not implemented | Daily/hourly oracle feeds | Critical |
| **Redemption** | Instant 1:1 | Queue-based with NAV check | High |
| **Compliance** | Basic relayer trust | ERC-3643 with on-chain KYC | High |
| **Tranching** | Single pool | Senior/Junior tranches | Medium |
| **Fee Structure** | None | Management + Performance fees | Medium |

### Market Context

- **$8.86B** in tokenized Treasuries (Jan 2026)
- **$18.91B** in active on-chain private credit
- **4-12% APY** typical yields (Treasury: 4-5%, Private Credit: 8-12%)
- **ERC-4626** standard for yield-bearing vaults adopted by 50+ protocols

---

## 2. How RWA Pools Work

### 2.1 The Fundamental Structure

```
┌─────────────────────────────────────────────────────────────────┐
│                    OFF-CHAIN (REAL WORLD)                       │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │ US Treasury │  │   Bonds     │  │  Private Credit Loans   │  │
│  │    Bills    │  │  (Corporate)│  │  (Receivables, RE, etc) │  │
│  └──────┬──────┘  └──────┬──────┘  └────────────┬────────────┘  │
│         │                │                      │               │
│         └────────────────┼──────────────────────┘               │
│                          │                                      │
│                    ┌─────▼─────┐                                │
│                    │  Custodian │ (e.g., BlackRock, State Street)│
│                    │  + SPV     │                               │
│                    └─────┬─────┘                                │
└──────────────────────────┼──────────────────────────────────────┘
                           │
              ┌────────────▼────────────┐
              │   Oracle / Attestation   │
              │  (Chainlink, RedStone)   │
              └────────────┬────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────────┐
│                    ON-CHAIN (BLOCKCHAIN)                        │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                    RWA POOL CONTRACT                        ││
│  │  ┌─────────────┐  ┌──────────────┐  ┌───────────────────┐  ││
│  │  │ Deposit     │  │ NAV Oracle   │  │ Yield Distribution│  ││
│  │  │ (USDC in)   │→ │ (Price Feed) │→ │ (Daily Accrual)   │  ││
│  │  └─────────────┘  └──────────────┘  └───────────────────┘  ││
│  │                                                             ││
│  │  ┌─────────────┐  ┌──────────────┐  ┌───────────────────┐  ││
│  │  │ Share Token │  │ Compliance   │  │ Redemption Queue  │  ││
│  │  │ (ERC-4626)  │  │ (Whitelist)  │  │ (FIFO)            │  ││
│  │  └─────────────┘  └──────────────┘  └───────────────────┘  ││
│  └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 Core Pool Types

| Pool Type | Underlying Asset | Typical APY | Risk Profile | Liquidity |
|-----------|------------------|-------------|--------------|-----------|
| **Treasury MMF** | US T-Bills | 4-5% | Very Low | T+0 to T+1 |
| **Corporate Bonds** | Investment Grade | 5-7% | Low-Medium | T+1 to T+3 |
| **Private Credit** | SME Loans, Receivables | 8-12% | Medium-High | T+7 to T+30 |
| **Real Estate** | Property/REIT | 6-10% | Medium | T+30+ |
| **Trade Finance** | Invoice Factoring | 10-15% | Medium | T+30-90 |

### 2.3 Key Players & Their Models

| Platform | Focus | TVL | Model | Key Innovation |
|----------|-------|-----|-------|----------------|
| **BlackRock BUIDL** | Treasury MMF | $2.3B | Fixed NAV $1 | Monthly yield distribution |
| **Ondo OUSG/USDY** | Treasury | $1.8B | Accumulating NAV | 24/7 instant redemption |
| **Maple Finance** | Private Credit | $12B originated | Pool Delegate model | Real yield from lending |
| **Centrifuge** | Trade Finance | $500M | Tinlake tranches | Senior/Junior split |
| **Goldfinch** | Emerging Market Credit | $100M+ | Backer voting | Decentralized underwriting |
| **Securitize** | Institutional | $2.9B | Licensed ATS | SEC-registered securities |

---

## 3. APY & Yield Mechanics

### 3.1 Where Does Yield Come From?

```
┌─────────────────────────────────────────────────────────────────┐
│                    YIELD SOURCES                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  TREASURY POOLS (4-5% APY)                                      │
│  └── Interest from US Treasury Bills                            │
│      └── Fed funds rate passthrough                             │
│      └── Daily accrual, monthly/daily distribution              │
│                                                                 │
│  PRIVATE CREDIT POOLS (8-12% APY)                               │
│  └── Interest payments from borrowers                           │
│      └── Senior secured loans (6-8%)                            │
│      └── SME financing (10-15%)                                 │
│      └── Receivables factoring (12-18%)                         │
│      └── Default premium built into rate                        │
│                                                                 │
│  REAL ESTATE POOLS (6-10% APY)                                  │
│  └── Rental income from properties                              │
│      └── Property appreciation (capital gains)                  │
│      └── Mortgage interest payments                             │
│                                                                 │
│  PROTOCOL INCENTIVES (Variable)                                 │
│  └── Token rewards (e.g., SYRUP, GFI, CFG)                      │
│      └── Liquidity mining rewards                               │
│      └── Staking bonuses                                        │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 3.2 APY Calculation Formula

**Base APY Calculation:**
```
Base APY = (Interest Earned / Principal) × (365 / Days Invested) × 100

Example (Treasury Pool):
- $1,000,000 principal
- $43,000 interest earned in 365 days
- Base APY = (43,000 / 1,000,000) × 100 = 4.30%
```

**Composite APY (with rewards):**
```
Composite APY = Base APY + Reward APY

Maple Finance Example:
- Base APY: 6.99% (from lending)
- Reward APY: 2.20% (SYRUP tokens)
- Composite APY: 9.19%
```

### 3.3 Do APYs Change Over Time?

**YES - APYs are dynamic and change based on:**

| Factor | Impact | Frequency |
|--------|--------|-----------|
| **Fed Interest Rate** | Direct correlation for Treasury pools | Every FOMC meeting (8x/year) |
| **Market Demand** | Higher demand → Lower yields | Daily |
| **Credit Events** | Defaults increase risk premium | As they occur |
| **Pool Utilization** | Higher utilization → Higher rates | Real-time |
| **Token Rewards** | Protocol incentives fluctuate | Weekly/Monthly |

**Real-World APY Changes (2024-2026):**
```
Fed Rate Changes Impact on Treasury APYs:
- Jan 2024: ~5.25% Fed rate → ~5.0% Treasury APY
- Jul 2025: ~4.75% Fed rate → ~4.5% Treasury APY
- Jan 2026: ~4.00% Fed rate → ~3.8% Treasury APY

Private Credit APYs:
- Bull market (2024): 8-10% APY
- Credit tightening (2025): 10-14% APY (risk premium)
- Normalized (2026): 9-12% APY
```

### 3.4 APY Update Mechanisms

| Method | Update Frequency | Gas Cost | Use Case |
|--------|------------------|----------|----------|
| **Push Oracle** | Every block | High | High-frequency trading |
| **Pull Oracle** | On-demand | Medium | User-triggered actions |
| **Heartbeat** | Fixed interval (1h/24h) | Medium | Standard NAV updates |
| **Deviation Trigger** | When price moves >X% | Variable | Volatile assets |

**Chainlink Price Feed Pattern:**
```solidity
interface AggregatorV3Interface {
    function latestRoundData() external view returns (
        uint80 roundId,
        int256 answer,      // Current NAV/price
        uint256 startedAt,
        uint256 updatedAt,  // Last update timestamp
        uint80 answeredInRound
    );
}

// Usage in RWA Pool
function getCurrentNAV() public view returns (uint256) {
    (, int256 navPrice,, uint256 updatedAt,) = navOracle.latestRoundData();
    require(block.timestamp - updatedAt < 24 hours, "Stale NAV");
    return uint256(navPrice);
}
```

---

## 4. Yield Distribution Models

### 4.1 Two Primary Models

```
┌─────────────────────────────────────────────────────────────────┐
│              ACCUMULATING (Price Appreciation)                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  How it works:                                                  │
│  - Token price increases over time                              │
│  - User holds same number of tokens                             │
│  - Value grows through price appreciation                       │
│                                                                 │
│  Example (OUSG, USTB):                                          │
│  Day 0:  100 tokens × $1.00 = $100.00                          │
│  Day 30: 100 tokens × $1.0033 = $100.33 (4% APY)               │
│  Day 365: 100 tokens × $1.04 = $104.00                         │
│                                                                 │
│  Pros: Simple, no rebase events, DeFi composable                │
│  Cons: Price varies from $1, tracking yields harder             │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│              REBASING (Balance Adjustment)                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  How it works:                                                  │
│  - Token price stays fixed at $1.00                             │
│  - Token balance increases daily                                │
│  - Yield distributed as additional tokens                       │
│                                                                 │
│  Example (rOUSG, STBT):                                         │
│  Day 0:  100.000 tokens × $1.00 = $100.00                      │
│  Day 30: 100.329 tokens × $1.00 = $100.33 (4% APY)             │
│  Day 365: 104.000 tokens × $1.00 = $104.00                     │
│                                                                 │
│  Pros: Easy to track, stable price, familiar UX                 │
│  Cons: Susceptible to rebase arbitrage, tax complexity          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 4.2 ERC-4626 Vault Standard (Recommended)

The **ERC-4626 "Tokenized Vault Standard"** is the gold standard for yield-bearing tokens:

```solidity
// Core ERC-4626 Interface
interface IERC4626 is IERC20 {
    // Deposit assets, receive shares
    function deposit(uint256 assets, address receiver)
        external returns (uint256 shares);

    // Withdraw assets by burning shares
    function withdraw(uint256 assets, address receiver, address owner)
        external returns (uint256 shares);

    // Redeem shares for assets
    function redeem(uint256 shares, address receiver, address owner)
        external returns (uint256 assets);

    // Preview conversion (critical for yield calculation)
    function convertToShares(uint256 assets) external view returns (uint256);
    function convertToAssets(uint256 shares) external view returns (uint256);

    // Total assets under management
    function totalAssets() external view returns (uint256);
}
```

**Share Price Calculation:**
```
Share Price = totalAssets() / totalSupply()

Example:
- totalAssets = 1,040,000 USDC (principal + yield)
- totalSupply = 1,000,000 shares
- Share Price = 1.04 USDC per share
- APY = (1.04 - 1.00) / 1.00 × 100 = 4%
```

### 4.3 Yield Accrual Implementation

```solidity
contract YieldBearingPool is ERC4626 {
    uint256 public lastAccrualTimestamp;
    uint256 public accruedYield;
    uint256 public yieldRatePerSecond; // e.g., 4% APY = ~1.27e-9 per second

    function _accrueYield() internal {
        uint256 timeElapsed = block.timestamp - lastAccrualTimestamp;
        if (timeElapsed > 0) {
            uint256 principal = totalAssets() - accruedYield;
            uint256 newYield = (principal * yieldRatePerSecond * timeElapsed) / 1e18;
            accruedYield += newYield;
            lastAccrualTimestamp = block.timestamp;
        }
    }

    function totalAssets() public view override returns (uint256) {
        // Include accrued but undistributed yield
        uint256 timeElapsed = block.timestamp - lastAccrualTimestamp;
        uint256 principal = _asset.balanceOf(address(this));
        uint256 pendingYield = (principal * yieldRatePerSecond * timeElapsed) / 1e18;
        return principal + accruedYield + pendingYield;
    }
}
```

### 4.4 Yield Distribution Methods

| Method | Frequency | Gas Cost | User Experience |
|--------|-----------|----------|-----------------|
| **Continuous Accrual** | Every second | None (view only) | Best - always accurate |
| **Daily Snapshot** | Once/day | Medium | Good - predictable |
| **Weekly Distribution** | Once/week | Low | OK - batched efficiency |
| **Monthly Payout** | Once/month | Very Low | Traditional MMF style |
| **Claim-Based** | On-demand | User pays | DeFi native |

---

## 5. NAV Calculation & Oracle Integration

### 5.1 Net Asset Value (NAV) Fundamentals

```
NAV per Share = (Total Assets - Total Liabilities) / Total Shares Outstanding

For RWA Pools:
Total Assets = Underlying RWAs Value + Cash Reserves + Accrued Interest
Total Liabilities = Management Fees Owed + Pending Redemptions + Expenses
```

### 5.2 Oracle Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    ORACLE ARCHITECTURE                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  OFF-CHAIN DATA SOURCES                                         │
│  ├── Custodian Reports (daily NAV)                              │
│  ├── Bloomberg/Reuters Feeds (bond prices)                      │
│  ├── Appraisal Reports (real estate, quarterly)                 │
│  └── Loan Servicer Data (payment status)                        │
│                                                                 │
│  ORACLE NETWORK                                                 │
│  ├── Chainlink (primary, battle-tested)                         │
│  │   ├── Proof of Reserve                                       │
│  │   └── Price Feeds                                            │
│  ├── RedStone (low-latency, modular)                            │
│  ├── Chronicle (MakerDAO oracle)                                │
│  └── Custom attestation (for private credit)                    │
│                                                                 │
│  ON-CHAIN CONSUMERS                                             │
│  ├── RWA Pool Contract (NAV updates)                            │
│  ├── Redemption Queue (fair value calculation)                  │
│  └── Collateral Manager (liquidation thresholds)                │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 5.3 NAV Update Frequency by Asset Type

| Asset Type | Update Frequency | Data Source | Staleness Tolerance |
|------------|------------------|-------------|---------------------|
| US Treasuries | Daily | Bloomberg, Custodian | 24 hours |
| Money Market | Daily | NAV calculation | 24 hours |
| Corporate Bonds | Daily | Bloomberg | 48 hours |
| Private Credit | Weekly/Monthly | Loan servicer | 7-30 days |
| Real Estate | Quarterly | Appraisal | 90 days |
| Trade Finance | Per invoice | Servicer | On settlement |

### 5.4 Oracle Implementation Pattern

```solidity
interface IRWAOracle {
    struct NAVData {
        uint256 nav;           // NAV per share (18 decimals)
        uint256 totalAssets;   // Total AUM
        uint256 updatedAt;     // Timestamp
        uint8 decimals;        // Price decimals
    }

    function getLatestNAV() external view returns (NAVData memory);
    function isStale() external view returns (bool);
}

contract RWAPool {
    IRWAOracle public navOracle;
    uint256 public maxStaleness = 24 hours;

    modifier withFreshNAV() {
        require(!navOracle.isStale(), "NAV data stale");
        _;
    }

    function _getSharePrice() internal view returns (uint256) {
        IRWAOracle.NAVData memory data = navOracle.getLatestNAV();
        require(block.timestamp - data.updatedAt <= maxStaleness, "Stale");
        return data.nav;
    }

    function convertToAssets(uint256 shares) public view returns (uint256) {
        return (shares * _getSharePrice()) / 1e18;
    }
}
```

---

## 6. Compliance & Transfer Restrictions

### 6.1 ERC-3643 Standard (T-REX)

The **ERC-3643** standard is the leading solution for compliant security tokens:

```solidity
// ERC-3643 Core Architecture
contract ERC3643Token is ERC20 {
    IIdentityRegistry public identityRegistry;
    ICompliance public compliance;

    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 amount
    ) internal override {
        // Skip minting and burning
        if (from != address(0) && to != address(0)) {
            // Check if transfer is compliant
            require(
                compliance.canTransfer(from, to, amount),
                "Transfer not compliant"
            );

            // Verify recipient identity
            require(
                identityRegistry.isVerified(to),
                "Recipient not verified"
            );
        }
    }
}
```

### 6.2 Compliance Rules Engine

```
┌─────────────────────────────────────────────────────────────────┐
│                    COMPLIANCE RULES                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  IDENTITY REQUIREMENTS                                          │
│  ├── KYC Verified (all investors)                               │
│  ├── AML Screening Passed                                       │
│  ├── Sanctions List Clear                                       │
│  └── Identity Not Expired                                       │
│                                                                 │
│  INVESTOR ACCREDITATION                                         │
│  ├── Accredited Investor (SEC Rule 501)                         │
│  │   ├── $1M+ net worth (excl. primary residence)               │
│  │   └── $200K+ income (2 years)                                │
│  ├── Qualified Purchaser ($5M+ investments)                     │
│  ├── Qualified Institutional Buyer (QIB)                        │
│  └── Non-US Investor (Reg S)                                    │
│                                                                 │
│  TRANSFER RESTRICTIONS                                          │
│  ├── Jurisdiction Whitelist (e.g., US, EU, Singapore)           │
│  ├── Maximum Holder Count (e.g., 99 for Reg D)                  │
│  ├── Lock-up Period (e.g., 12 months)                           │
│  ├── Minimum Holding (e.g., $10,000)                            │
│  └── Daily Transfer Limits                                      │
│                                                                 │
│  POOL-SPECIFIC RULES                                            │
│  ├── Minimum Investment Amount                                  │
│  ├── Maximum Investment Per Investor                            │
│  ├── Concentration Limits                                       │
│  └── Redemption Notice Period                                   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 6.3 On-Chain Identity (ONCHAINID)

```solidity
// ONCHAINID Claim Topics
enum ClaimTopic {
    KYC_VERIFIED = 1,
    ACCREDITED_INVESTOR = 2,
    QUALIFIED_PURCHASER = 3,
    JURISDICTION = 4,
    AML_CLEARED = 5,
    SANCTIONS_CLEARED = 6
}

interface IIdentity {
    function getClaim(uint256 topic) external view returns (
        uint256 topic,
        uint256 scheme,
        address issuer,
        bytes memory signature,
        bytes memory data,
        string memory uri
    );
}

// Verification in Pool
function isEligible(address investor) public view returns (bool) {
    IIdentity identity = identityRegistry.identity(investor);

    // Check KYC
    (,,,, bytes memory kycData,) = identity.getClaim(ClaimTopic.KYC_VERIFIED);
    if (kycData.length == 0) return false;

    // Check Accreditation
    (,,,, bytes memory accredData,) = identity.getClaim(ClaimTopic.ACCREDITED_INVESTOR);
    if (accredData.length == 0) return false;

    // Check Jurisdiction
    (,,,, bytes memory jurisdictionData,) = identity.getClaim(ClaimTopic.JURISDICTION);
    bytes2 jurisdiction = abi.decode(jurisdictionData, (bytes2));
    if (!allowedJurisdictions[jurisdiction]) return false;

    return true;
}
```

---

## 7. Redemption & Liquidity Management

### 7.1 The Liquidity Mismatch Problem

```
ON-CHAIN:  Tokens trade 24/7, instant settlement expected
OFF-CHAIN: Real assets have settlement times (T+1 to T+30)

This creates:
- User expects instant redemption
- Pool may not have liquid USDC
- Must sell underlying assets (takes time)
- NAV may change during settlement
```

### 7.2 Redemption Models

| Model | Speed | Liquidity Requirement | Use Case |
|-------|-------|----------------------|----------|
| **Instant** | T+0 | 100% liquid reserves | Treasury MMF |
| **Same-Day** | T+0 (business hours) | 20-50% reserves | Large funds |
| **T+1** | Next business day | 10-20% reserves | Corporate bonds |
| **Queue-Based** | Variable (FIFO) | Minimal | Private credit |
| **Epoch-Based** | Fixed windows | Batched | Illiquid assets |
| **Backstop** | Instant at discount | Partner liquidity | Emergency |

### 7.3 Redemption Queue Implementation

```solidity
struct RedemptionRequest {
    address investor;
    uint256 shares;
    uint256 requestedAt;
    uint256 navAtRequest;
    bool fulfilled;
}

contract RedemptionQueue {
    RedemptionRequest[] public queue;
    uint256 public queueHead;
    uint256 public queueTail;
    uint256 public minNoticeHours = 24;

    function requestRedemption(uint256 shares) external {
        require(shares > 0, "Zero shares");
        require(positions[msg.sender].shares >= shares, "Insufficient");

        // Lock shares
        positions[msg.sender].lockedShares += shares;

        // Add to queue
        queue.push(RedemptionRequest({
            investor: msg.sender,
            shares: shares,
            requestedAt: block.timestamp,
            navAtRequest: getCurrentNAV(),
            fulfilled: false
        }));

        queueTail++;
    }

    function processRedemptions(uint256 maxToProcess) external onlyOperator {
        uint256 availableLiquidity = usdc.balanceOf(address(this));
        uint256 processed = 0;

        while (queueHead < queueTail && processed < maxToProcess) {
            RedemptionRequest storage req = queue[queueHead];

            // Check notice period
            if (block.timestamp < req.requestedAt + minNoticeHours * 1 hours) {
                break; // Queue is ordered, can stop
            }

            // Calculate redemption value at current NAV (not request NAV)
            uint256 currentNAV = getCurrentNAV();
            uint256 redemptionValue = (req.shares * currentNAV) / 1e18;

            if (redemptionValue > availableLiquidity) {
                break; // Not enough liquidity
            }

            // Process redemption
            _executeRedemption(req.investor, req.shares, redemptionValue);
            req.fulfilled = true;
            queueHead++;
            availableLiquidity -= redemptionValue;
            processed++;
        }
    }
}
```

### 7.4 Liquidity Reserve Management

```solidity
contract LiquidityManager {
    uint256 public targetReserveRatio = 1000; // 10% in basis points
    uint256 public minReserveRatio = 500;     // 5% minimum
    uint256 public maxReserveRatio = 2000;    // 20% maximum

    function checkLiquidity() public view returns (
        uint256 currentRatio,
        bool isHealthy,
        bool needsRebalance
    ) {
        uint256 liquidReserves = usdc.balanceOf(address(this));
        uint256 totalValue = totalAssets();

        currentRatio = (liquidReserves * 10000) / totalValue;
        isHealthy = currentRatio >= minReserveRatio;
        needsRebalance = currentRatio < targetReserveRatio - 200
                      || currentRatio > targetReserveRatio + 200;

        return (currentRatio, isHealthy, needsRebalance);
    }

    function _rebalance() internal {
        (uint256 currentRatio,, bool needsRebalance) = checkLiquidity();

        if (!needsRebalance) return;

        if (currentRatio < targetReserveRatio) {
            // Need more liquidity - sell assets or borrow
            uint256 deficit = _calculateDeficit();
            emit LiquidityWarning(deficit);
        } else {
            // Excess liquidity - deploy to yield
            uint256 excess = _calculateExcess();
            _deployToYield(excess);
        }
    }
}
```

---

## 8. Production-Ready Features

### 8.1 Complete Feature Checklist

```
CORE FUNCTIONALITY
├── [ ] ERC-4626 compliant vault interface
├── [ ] Dynamic NAV with oracle integration
├── [ ] Yield accrual (continuous or periodic)
├── [ ] Proper share/asset conversion
├── [ ] Multi-asset pool support
└── [ ] Pool pause/emergency functions

YIELD MANAGEMENT
├── [ ] Yield rate configuration (APY/APR)
├── [ ] Yield distribution mechanism
├── [ ] Compounding vs payout options
├── [ ] Fee deduction (management, performance)
├── [ ] Yield history tracking
└── [ ] Projected yield calculations

COMPLIANCE
├── [ ] Investor whitelist (ERC-3643 compatible)
├── [ ] Accreditation verification
├── [ ] Jurisdiction restrictions
├── [ ] Transfer restrictions
├── [ ] Maximum holder limits
├── [ ] Lock-up period enforcement
└── [ ] Audit trail / event logging

REDEMPTION & LIQUIDITY
├── [ ] Redemption queue (FIFO)
├── [ ] Notice period enforcement
├── [ ] NAV-based redemption pricing
├── [ ] Liquidity reserve management
├── [ ] Epoch-based settlement option
├── [ ] Emergency liquidity facility
└── [ ] Partial redemption support

RISK MANAGEMENT
├── [ ] Concentration limits per investor
├── [ ] Pool capacity limits
├── [ ] Circuit breakers (NAV deviation)
├── [ ] Default handling (for credit pools)
├── [ ] Insurance/reserve fund
└── [ ] Recovery procedures

GOVERNANCE & ADMIN
├── [ ] Multi-sig admin controls
├── [ ] Timelocks for critical changes
├── [ ] Fee parameter updates
├── [ ] Yield rate adjustments
├── [ ] Emergency actions (pause, rescue)
└── [ ] Upgrade mechanism (if upgradeable)

REPORTING & TRANSPARENCY
├── [ ] On-chain NAV history
├── [ ] Yield distribution history
├── [ ] Investor position tracking
├── [ ] Pool performance metrics
├── [ ] Proof of reserves attestation
└── [ ] Compliance report generation
```

### 8.2 Fee Structure

```solidity
struct FeeConfig {
    uint16 managementFeeBps;    // Annual fee (e.g., 50 = 0.5%)
    uint16 performanceFeeBps;   // On profits (e.g., 1000 = 10%)
    uint16 depositFeeBps;       // On deposits (e.g., 10 = 0.1%)
    uint16 redemptionFeeBps;    // On redemptions (e.g., 25 = 0.25%)
    address feeRecipient;       // Treasury address
}

contract FeeManager {
    FeeConfig public fees;
    uint256 public lastFeeCollection;
    uint256 public accruedFees;

    function collectManagementFee() external {
        uint256 daysSinceLastCollection =
            (block.timestamp - lastFeeCollection) / 1 days;

        if (daysSinceLastCollection > 0) {
            uint256 aum = totalAssets();
            uint256 dailyRate = fees.managementFeeBps / 365;
            uint256 fee = (aum * dailyRate * daysSinceLastCollection) / 10000;

            accruedFees += fee;
            lastFeeCollection = block.timestamp;
        }
    }

    function collectPerformanceFee(uint256 profits) external {
        uint256 fee = (profits * fees.performanceFeeBps) / 10000;
        accruedFees += fee;
    }
}
```

### 8.3 Tranching (Senior/Junior)

```solidity
contract TranchedPool {
    struct Tranche {
        uint256 totalDeposited;
        uint256 totalShares;
        uint16 targetAPY;     // Senior: fixed, Junior: residual
        uint8 riskLevel;      // 1 = Senior, 2 = Mezzanine, 3 = Junior
    }

    Tranche public seniorTranche;
    Tranche public juniorTranche;

    uint256 public seniorCoverageRatio = 8000; // Junior covers 20% of losses

    function distributeYield(uint256 totalYield) external {
        // Senior gets paid first (up to target APY)
        uint256 seniorYield = _calculateSeniorYield();
        uint256 actualSeniorYield = min(seniorYield, totalYield);

        // Junior gets residual
        uint256 juniorYield = totalYield - actualSeniorYield;

        seniorTranche.totalDeposited += actualSeniorYield;
        juniorTranche.totalDeposited += juniorYield;
    }

    function handleDefault(uint256 lossAmount) external {
        // Junior absorbs losses first
        if (lossAmount <= juniorTranche.totalDeposited) {
            juniorTranche.totalDeposited -= lossAmount;
        } else {
            // Loss exceeds junior, senior takes hit
            uint256 seniorLoss = lossAmount - juniorTranche.totalDeposited;
            juniorTranche.totalDeposited = 0;
            seniorTranche.totalDeposited -= seniorLoss;
        }
    }
}
```

---

## 9. Current Implementation Gap Analysis

### 9.1 RWAPool.sol Assessment

**Current State:**
```solidity
// Current: 1:1 share calculation (no yield)
uint256 shares = amount;

// Current: Instant redemption (no queue)
function _redeem(...) internal {
    uint256 amount = shares; // 1:1, no NAV
    usdc.safeTransfer(investor, amount);
}
```

**Required State:**
```solidity
// Required: NAV-based share calculation
uint256 sharePrice = _getCurrentNAV();
uint256 shares = (amount * 1e18) / sharePrice;

// Required: Queue-based redemption with NAV
function requestRedemption(uint256 shares) external {
    _addToRedemptionQueue(msg.sender, shares, getCurrentNAV());
}
```

### 9.2 Gap Matrix

| Feature | Current | Required | Priority | Effort |
|---------|---------|----------|----------|--------|
| **NAV Oracle** | None | Chainlink/Custom | Critical | Medium |
| **Yield Accrual** | None | Continuous | Critical | Medium |
| **ERC-4626** | No | Yes | Critical | High |
| **Redemption Queue** | Instant | FIFO Queue | High | Medium |
| **Compliance** | Relayer trust | ERC-3643 | High | High |
| **Fee Structure** | None | Mgmt + Perf | Medium | Low |
| **Tranching** | None | Optional | Low | High |
| **Proof of Reserves** | None | Chainlink PoR | Medium | Medium |

### 9.3 Smart Contract Upgrade Path

```
Phase 1: Core Yield (2-3 weeks)
├── Add yield rate configuration
├── Implement yield accrual mechanism
├── Add NAV calculation (internal first)
├── Update share price calculation
└── Add yield distribution events

Phase 2: ERC-4626 (2 weeks)
├── Implement IERC4626 interface
├── Add deposit/withdraw/redeem functions
├── Implement convertToShares/convertToAssets
├── Add preview functions
└── Maintain backward compatibility

Phase 3: Redemption Queue (2 weeks)
├── Add RedemptionRequest struct
├── Implement queue data structure
├── Add notice period enforcement
├── Implement batch processing
└── Add liquidity monitoring

Phase 4: Oracle Integration (1-2 weeks)
├── Deploy oracle adapter
├── Integrate Chainlink price feed
├── Add staleness checks
├── Implement fallback mechanism
└── Add Proof of Reserves

Phase 5: Compliance Upgrade (3-4 weeks)
├── Integrate identity registry
├── Add transfer restrictions
├── Implement claim verification
├── Add jurisdiction checks
└── Audit and testing
```

---

## 10. Recommendations

### 10.1 Immediate Actions (Week 1-2)

1. **Add Yield Configuration**
   ```solidity
   struct PoolConfig {
       uint16 yieldRateBps;      // e.g., 450 = 4.50% APY
       uint256 lastYieldUpdate;
       uint256 accruedYield;
   }
   ```

2. **Implement NAV Calculation**
   ```solidity
   function getCurrentNAV() public view returns (uint256) {
       uint256 principal = pool.totalDeposited;
       uint256 yield = _calculateAccruedYield();
       return ((principal + yield) * 1e18) / pool.totalShares;
   }
   ```

3. **Update Share Conversion**
   ```solidity
   function _invest(...) internal {
       uint256 nav = getCurrentNAV();
       uint256 shares = (amount * 1e18) / nav;
       // ...
   }
   ```

### 10.2 Short-Term (Week 3-6)

1. **Implement ERC-4626 Interface**
2. **Add Redemption Queue**
3. **Integrate Oracle for NAV**
4. **Add Fee Collection**

### 10.3 Medium-Term (Week 7-12)

1. **ERC-3643 Compliance Integration**
2. **Multi-Pool Support with Different Yield Rates**
3. **Proof of Reserves Attestation**
4. **Advanced Liquidity Management**

### 10.4 Production Deployment Checklist

```
PRE-LAUNCH
├── [ ] Smart contract audit (3rd party)
├── [ ] Oracle integration tested
├── [ ] Compliance legal review
├── [ ] Penetration testing
├── [ ] Load testing (10K+ users)
└── [ ] Disaster recovery plan

LAUNCH
├── [ ] Mainnet deployment (with timelock)
├── [ ] Multi-sig admin setup
├── [ ] Monitoring & alerting
├── [ ] 24/7 incident response
└── [ ] User documentation

POST-LAUNCH
├── [ ] Daily NAV verification
├── [ ] Weekly compliance reports
├── [ ] Monthly performance review
├── [ ] Quarterly security audit
└── [ ] Annual penetration test
```

---

## Sources

### RWA Market & Platforms
- [RWA.xyz Analytics](https://app.rwa.xyz/)
- [RWA.xyz Tokenized Treasuries](https://app.rwa.xyz/treasuries)
- [Ondo Finance](https://ondo.finance/)
- [Maple Finance](https://maple.finance/)

### Technical Standards
- [ERC-4626 Ethereum.org](https://ethereum.org/developers/docs/standards/tokens/erc-4626/)
- [ERC-4626 OpenZeppelin](https://docs.openzeppelin.com/contracts/5.x/erc4626)
- [ERC-3643 Official](https://www.erc3643.org/)
- [ERC-3643 Chainalysis Introduction](https://www.chainalysis.com/blog/introduction-to-erc-3643-ethereum-rwa-token-standard/)

### Implementation Guides
- [QuickNode ERC-4626 Guide](https://www.quicknode.com/guides/ethereum-development/smart-contracts/how-to-use-erc-4626-with-your-smart-contract)
- [LogRocket ERC-4626 Tutorial](https://blog.logrocket.com/write-erc-4626-token-contract-yield-bearing-vaults/)
- [QuillAudits RWA Settlement Guide](https://www.quillaudits.com/blog/rwa/rwa-settlement-and-redemption)
- [RWA.io Oracle Pricing](https://www.rwa.io/post/pricing-oracles-for-tokenized-assets-models-and-checks)

### Compliance & Legal
- [Buzko Krasnov RWA Legal Guide](https://www.buzko.legal/content-eng/legal-guide-to-real-world-assets-rwa-tokenization)
- [InvestAX Compliance Checklist](https://investax.io/blog/legal-compliance-checklist-for-the-tokenization-of-real-world-assets-rwas)
- [iDenfy KYC/AML Guide](https://www.idenfy.com/blog/rwa-tokenization-kyc/)

### Yield & Staking
- [RWA.io Yield-Bearing Tokens](https://www.rwa.io/post/understanding-yield-bearing-rwa-tokens)
- [RWA.io Staking Models](https://www.rwa.io/post/different-staking-models-for-real-world-asset-tokens)
- [Chainlink Tokenized Treasuries](https://chain.link/article/what-are-tokenized-treasuries)

### Platform Deep Dives
- [21Shares Maple Finance Analysis](https://www.21shares.com/en-us/research/how-maple-finance-is-defis-answer-to-private-credit)
- [Mint Ventures Ondo Analysis](https://research.mintventures.fund/2025/5/16/Ondo-Product-Line-Competitive-Landscape-and-Token-Valuation-of-a-Leading-RWA-Project/)
- [DIA Data Centrifuge Guide](https://www.diadata.org/rwa-real-world-asset-map/centrifuge/)

---

*Research compiled: February 7, 2026*
*For: RWA Gateway Production Scaling*
